"""Reuse of an already downloaded source between runs.

BridgeClip deletes a job's work directory when the job ends, so the downloaded
source never survives to be reused. Re-running the same video therefore pays the
full download again, which for a long 4K source is minutes and gigabytes.

This keeps a copy outside the work directory, keyed by a stable video identity.
A stored source is only reused when it is the same video, is at least as tall as
the requested download resolution, and its file size matches the stored record.
The downloader probes cached media locally before reuse, without contacting the
host. An optional host-duration check is available when metadata is already known.
"""

import hashlib
import json
import logging
import os
import re
import time
from dataclasses import asdict, dataclass
from typing import Optional
from urllib.parse import parse_qs, urlsplit, urlunsplit

logger = logging.getLogger(__name__)

# A cache key becomes a filename, so it is restricted to characters that need no
# escaping. The same shape the main process allows for a job id.
_SAFE_KEY = re.compile(r"^[A-Za-z0-9_-]{1,96}$")
_YOUTUBE_ID = re.compile(r"^[A-Za-z0-9_-]{6,20}$")

# The host reports a duration; a cached file that differs by more than this is a
# different cut, an edited upload, or the wrong video entirely.
DURATION_TOLERANCE_SECONDS = 2.0

# Sidecars and media are stored together, so one entry is a pair of files.
MEDIA_SUFFIXES = (".mp4", ".mkv", ".webm", ".mov")


class SourceCacheUnavailable(Exception):
    """Raised when the cache directory cannot be used at all."""


@dataclass
class CacheEntry:
    """What is known about a stored source."""

    key: str
    source_type: str
    url: str
    title: str
    height: int
    width: int
    duration_seconds: float
    bytes: int
    media_name: str
    created_at: float
    last_used_at: float

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2, sort_keys=True)

    @classmethod
    def from_json(cls, raw: str) -> Optional["CacheEntry"]:
        try:
            data = json.loads(raw)
        except (ValueError, TypeError):
            return None
        if not isinstance(data, dict):
            return None
        required = ("key", "source_type", "url", "height", "width",
                    "duration_seconds", "bytes", "media_name", "created_at")
        if any(field not in data for field in required):
            return None
        if not isinstance(data["media_name"], str) or "/" in data["media_name"] or "\\" in data["media_name"]:
            return None
        try:
            return cls(
                key=str(data["key"]),
                source_type=str(data["source_type"]),
                url=str(data["url"]),
                # A record written before the title was stored still loads; the
                # list view falls back to the key.
                title=str(data.get("title", "")),
                height=int(data["height"]),
                width=int(data["width"]),
                duration_seconds=float(data["duration_seconds"]),
                bytes=int(data["bytes"]),
                media_name=data["media_name"],
                created_at=float(data["created_at"]),
                last_used_at=float(data.get("last_used_at", data["created_at"])),
            )
        except (TypeError, ValueError):
            return None


def cache_key(url: str, source_type: str) -> str:
    """A stable, filesystem-safe identity for a source.

    The id is taken from the URL where the host publishes one, because two URLs
    for the same video (watch, short, embed) must share an entry. Anything else
    falls back to a hash of the normalised URL, which still gives a stable key
    for a direct link.
    """
    try:
        parsed = urlsplit(url)
    except ValueError:
        return ""
    host = (parsed.hostname or "").lower().rstrip(".")
    video_id = None
    if host.endswith("youtube.com") or host.endswith("youtu.be"):
        if host.endswith("youtu.be"):
            video_id = parsed.path.strip("/").split("/")[0]
        else:
            video_id = (parse_qs(parsed.query).get("v") or [None])[0]
            if not video_id:
                match = re.search(r"/(?:shorts|embed|live|v)/([A-Za-z0-9_-]+)", parsed.path)
                video_id = match.group(1) if match else None
        if video_id and _YOUTUBE_ID.match(video_id):
            return f"yt-{video_id}"
    elif host.endswith("twitch.tv"):
        match = re.search(r"/videos/(\d+)", parsed.path)
        if match:
            return f"tw-{match.group(1)}"

    normalised = urlunsplit((parsed.scheme.lower(), host, parsed.path, parsed.query, ""))
    digest = hashlib.sha256(normalised.encode("utf-8", "replace")).hexdigest()[:32]
    prefix = "tw" if source_type == "twitch" else "src"
    return f"{prefix}-{digest}"


class SourceCache:
    """A size-bounded store of downloaded sources, outside the work directory."""

    def __init__(self, root: Optional[str], budget_bytes: int = 0):
        self.root = root
        self.budget_bytes = max(0, int(budget_bytes or 0))
        self.enabled = bool(root)
        if not self.enabled:
            return
        try:
            os.makedirs(root, mode=0o700, exist_ok=True)
        except OSError as error:
            # A cache that cannot be created must not fail the run: the user
            # simply downloads again, exactly as before.
            logger.warning("Source cache unavailable at %s: %s", root, error)
            self.enabled = False

    def _media_path(self, key: str, media_name: str) -> str:
        if not _SAFE_KEY.match(key) or not media_name:
            return ""
        return os.path.join(self.root, f"{key}{media_name}")

    def _sidecar_path(self, key: str) -> str:
        return os.path.join(self.root, f"{key}.json") if _SAFE_KEY.match(key) else ""

    def lookup(
        self,
        key: str,
        expected_duration: Optional[float] = None,
        min_height: Optional[int] = None,
        max_height: Optional[int] = None,
    ) -> Optional[tuple[str, CacheEntry]]:
        """A stored source for this key, or None when it cannot be trusted."""
        if not self.enabled:
            return None
        sidecar = self._sidecar_path(key)
        if not sidecar or not os.path.isfile(sidecar):
            return None
        try:
            with open(sidecar, "r", encoding="utf-8") as handle:
                entry = CacheEntry.from_json(handle.read())
        except OSError:
            return None
        if entry is None or entry.key != key:
            return None

        media = self._media_path(key, entry.media_name)
        try:
            actual = os.path.getsize(media)
        except OSError:
            # The sidecar outlived its media: drop the stale record.
            self.discard(key)
            return None
        if actual <= 0 or abs(actual - entry.bytes) > max(1, entry.bytes // 100):
            self.discard(key)
            return None

        # A cap was raised after this was stored, or the file is below it.
        if min_height and entry.height < min_height:
            logger.info(
                "Cached source %s is %dp, below the requested %dp; downloading instead",
                key, entry.height, min_height,
            )
            return None

        if max_height and entry.height > max_height:
            logger.info(
                "Cached source %s is %dp, above the requested %dp ceiling; downloading instead",
                key, entry.height, max_height,
            )
            return None

        if expected_duration is not None:
            if abs(entry.duration_seconds - expected_duration) > DURATION_TOLERANCE_SECONDS:
                logger.warning(
                    "Cached source %s is %.1fs but the host reports %.1fs; downloading instead",
                    key, entry.duration_seconds, expected_duration,
                )
                return None

        entry.last_used_at = time.time()
        try:
            with open(sidecar, "w", encoding="utf-8") as handle:
                handle.write(entry.to_json())
        except OSError:
            pass
        return media, entry

    def store(
        self,
        key: str,
        url: str,
        source_type: str,
        path: str,
        width: int,
        height: int,
        duration_seconds: float,
        title: str = "",
    ) -> bool:
        """Keep a downloaded source for a later run. Best effort by design."""
        if not self.enabled or not _SAFE_KEY.match(key):
            return False
        try:
            size = os.path.getsize(path)
        except OSError:
            return False
        if size <= 0:
            return False

        self.discard(key)
        media_name = self._pick_suffix(path)
        destination = self._media_path(key, media_name)
        if not destination:
            return False
        try:
            # A hard link costs no extra disk and survives the caller's work
            # directory being removed. Copying is the fallback when the cache
            # and the work directory are on different volumes.
            try:
                os.link(path, destination)
            except OSError:
                import shutil
                shutil.copy2(path, destination)
        except OSError as error:
            logger.warning("Could not cache source %s: %s", key, error)
            return False

        now = time.time()
        entry = CacheEntry(
            key=key, source_type=source_type, url=url, title=(title or "").strip()[:200],
            width=int(width), height=int(height),
            duration_seconds=float(duration_seconds), bytes=size,
            media_name=media_name, created_at=now, last_used_at=now,
        )
        try:
            sidecar = self._sidecar_path(key)
            temp = f"{sidecar}.{os.getpid()}.tmp"
            with open(temp, "w", encoding="utf-8") as handle:
                handle.write(entry.to_json())
            os.replace(temp, sidecar)
        except OSError as error:
            logger.warning("Could not write cache record for %s: %s", key, error)
            self.discard(key)
            return False

        self.prune(keep=key)
        logger.info("Cached source %s (%d bytes, %dp)", key, size, height)
        return True

    @staticmethod
    def _pick_suffix(path: str) -> str:
        suffix = os.path.splitext(path)[1].lower()
        return suffix if suffix in MEDIA_SUFFIXES else ".mp4"

    def discard(self, key: str) -> None:
        """Remove a cache entry's media and record, ignoring what is missing."""
        if not self.root or not _SAFE_KEY.match(key):
            return
        sidecar = self._sidecar_path(key)
        try:
            if os.path.isfile(sidecar):
                with open(sidecar, "r", encoding="utf-8") as handle:
                    entry = CacheEntry.from_json(handle.read())
                if entry is not None:
                    media = self._media_path(key, entry.media_name)
                    if media and os.path.isfile(media):
                        os.remove(media)
                os.remove(sidecar)
        except OSError:
            pass
        # Sweep any media left without a record.
        for suffix in MEDIA_SUFFIXES:
            media = self._media_path(key, suffix)
            if media and os.path.isfile(media):
                try:
                    os.remove(media)
                except OSError:
                    pass

    def _entries(self) -> list[tuple[float, int, CacheEntry]]:
        if not self.enabled or not self.root:
            return []
        found = []
        try:
            names = os.listdir(self.root)
        except OSError:
            return found
        for name in names:
            if not name.endswith(".json"):
                continue
            key = name[:-5]
            if not _SAFE_KEY.match(key):
                continue
            try:
                with open(os.path.join(self.root, name), "r", encoding="utf-8") as handle:
                    entry = CacheEntry.from_json(handle.read())
            except OSError:
                continue
            if entry is not None and entry.key == key:
                found.append((entry.last_used_at, entry.bytes, entry))
        return found

    def prune(self, keep: str = "") -> None:
        """Evict least-recently-used entries until the cache fits its budget."""
        if not self.enabled or not self.budget_bytes:
            return
        entries = self._entries()
        total = sum(size for _, size, _ in entries)
        if total <= self.budget_bytes:
            return
        for last_used, size, entry in sorted(entries, key=lambda item: item[0]):
            if total <= self.budget_bytes:
                break
            if entry.key == keep:
                continue
            self.discard(entry.key)
            total -= size
            logger.info("Evicted cached source %s to stay within the cache budget", entry.key)

    def total_bytes(self) -> int:
        return sum(size for _, size, _ in self._entries())

    def describe(self) -> list[dict]:
        """One plain record per entry, for the desktop app to display.

        Only descriptive fields cross the process boundary. A filesystem path is
        never returned, so a record cannot be turned into one by the caller.
        """
        rows = []
        for _, _, entry in self._entries():
            rows.append({
                "key": entry.key,
                "title": entry.title or entry.key,
                "url": entry.url,
                "sourceType": entry.source_type,
                "width": entry.width,
                "height": entry.height,
                "durationSeconds": round(entry.duration_seconds, 1),
                "bytes": entry.bytes,
                "storedAt": round(entry.created_at),
                "lastUsedAt": round(entry.last_used_at),
            })
        rows.sort(key=lambda row: row["lastUsedAt"], reverse=True)
        return rows


def _cli(argv: list[str], env) -> int:
    """List or delete cache entries. Prints JSON on stdout for the desktop app.

    Reads its own directory from the same environment variable the pipeline uses,
    so the app and a running job always agree on where the cache lives.
    """
    import argparse
    import json

    parser = argparse.ArgumentParser(prog="source-cache")
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--delete", metavar="KEY")
    parser.add_argument("--clear", action="store_true")
    args = parser.parse_args(argv)

    root = (env.get("BRIDGECLIP_SOURCE_CACHE") or "").strip() or None
    cache = SourceCache(root, env.get("SOURCE_CACHE_BUDGET_BYTES") or 0)

    if args.delete:
        if not _SAFE_KEY.match(args.delete or ""):
            print(json.dumps({"ok": False, "error": "invalid key"}))
            return 2
        existed = bool(cache._sidecar_path(args.delete)) and os.path.isfile(
            cache._sidecar_path(args.delete)
        )
        cache.discard(args.delete)
        print(json.dumps({"ok": True, "existed": existed}))
        return 0

    if args.clear:
        removed = 0
        for row in cache.describe():
            cache.discard(row["key"])
            removed += 1
        print(json.dumps({"ok": True, "removed": removed}))
        return 0

    print(json.dumps({
        "enabled": cache.enabled,
        "root": "",
        "totalBytes": cache.total_bytes(),
        "entries": cache.describe(),
    }))
    return 0


if __name__ == "__main__":  # pragma: no cover - process entry point
    import sys

    raise SystemExit(_cli(sys.argv[1:], os.environ))
