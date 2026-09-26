"""Atomic, local transcript reuse independent of the subsequent clip planner."""

import hashlib
import json
import logging
import math
import os
import tempfile
from dataclasses import asdict
from pathlib import Path

logger = logging.getLogger(__name__)
MAX_CACHE_BYTES = 32 * 1024 * 1024


def decode_result(data):
    from .transcription_service import TranscriptionResult, TranscriptSegment, TranscriptWord

    segments = []
    for raw in data["segments"]:
        segment = TranscriptSegment(**{**raw, "words": [TranscriptWord(**w) for w in raw["words"]]})
        for item in [segment, *segment.words]:
            start, end = item.start_time_ms, item.end_time_ms
            if not all(isinstance(t, (int, float)) and math.isfinite(t) for t in (start, end)):
                raise ValueError("Invalid cached timestamps")
            if start < 0 or end < start:
                raise ValueError("Invalid cached interval")
        if not isinstance(segment.text, str) or not segment.words:
            raise ValueError("Cached speech requires text and word timing")
        segments.append(segment)
    if not segments or not isinstance(data["full_text"], str):
        raise ValueError("Empty cached transcript")
    return TranscriptionResult(
        segments=segments, full_text=data["full_text"], language=data.get("language"),
        duration_seconds=data.get("duration_seconds"),
        provider=data.get("provider", "openrouter"), model=data.get("model", "unknown"),
        # Loading a transcript incurs no new provider charge.
        api_costs=None,
    )


class TranscriptCache:
    def __init__(self, root, video_path, *, language=None, translate=False,
                 keyterms=None, start=None, end=None):
        self.path = None
        self.identity = None
        if not root:
            return
        try:
            video = Path(video_path).resolve()
            stat = video.stat()
            self.identity = {
                "version": 1, "source": str(video), "bytes": stat.st_size,
                "mtime_ns": stat.st_mtime_ns, "language": language or "auto",
                "translate": translate, "keyterms": sorted(set(keyterms or [])),
                "start": float(start or 0), "end": float(end) if end is not None else None,
            }
            digest = hashlib.sha256(json.dumps(self.identity, sort_keys=True).encode()).hexdigest()
            self.path = Path(root) / "transcripts" / (digest + ".json")
        except OSError:
            logger.warning("Transcript cache could not identify the source")

    def load(self):
        if self.path is None:
            return None
        try:
            if self.path.stat().st_size > MAX_CACHE_BYTES:
                return None
            record = json.loads(self.path.read_text(encoding="utf-8"))
            if record["identity"] != self.identity:
                return None
            return decode_result(record["result"])
        except (OSError, ValueError, TypeError, KeyError):
            return None

    def store(self, result):
        if self.path is None or not result.segments:
            return
        temporary = None
        try:
            data = asdict(result)
            decode_result(data)
            serialized = json.dumps({"identity": self.identity, "result": data}, ensure_ascii=False)
            if len(serialized.encode("utf-8")) > MAX_CACHE_BYTES:
                return
            self.path.parent.mkdir(parents=True, exist_ok=True)
            with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=self.path.parent,
                                             suffix=".tmp", delete=False) as handle:
                temporary = handle.name
                handle.write(serialized)
            os.replace(temporary, self.path)
        except (OSError, ValueError, TypeError, KeyError):
            logger.warning("Could not save transcript cache; processing will continue")
        finally:
            if temporary and os.path.exists(temporary):
                try:
                    os.unlink(temporary)
                except OSError:
                    pass
