"""Reuse of a downloaded source between runs."""

import os
import asyncio
from types import SimpleNamespace

import pytest

from clip_engine.services.source_cache import (DURATION_TOLERANCE_SECONDS,
                                               CacheEntry, SourceCache, cache_key)
from clip_engine.services.video_downloader import VideoDownloaderService, VideoMetadata

TMP_CACHE = os.environ.get('TEMP', '/tmp') + '/bridgeclip-source-cache-test'
YOUTUBE = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"


def _media(tmp_path, name="source.mp4", size=4096):
    path = tmp_path / name
    path.write_bytes(b"x" * size)
    return str(path)


def test_every_youtube_url_shape_shares_one_key():
    """A watch, short and embed link are the same video and must not re-download."""
    keys = {
        cache_key(url, "youtube") for url in (
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "https://youtu.be/dQw4w9WgXcQ",
            "https://www.youtube.com/shorts/dQw4w9WgXcQ",
            "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
        )
    }
    assert keys == {"yt-dQw4w9WgXcQ"}


def test_different_videos_get_different_keys():
    assert cache_key("https://www.youtube.com/watch?v=aaaaaaaaaaa", "youtube") != \
           cache_key("https://www.youtube.com/watch?v=bbbbbbbbbbb", "youtube")


def test_a_twitch_vod_is_keyed_by_its_id():
    assert cache_key("https://www.twitch.tv/videos/1234567890", "twitch") == "tw-1234567890"


def test_a_direct_link_falls_back_to_a_stable_hash():
    first = cache_key("https://example.com/a.mp4", "local")
    second = cache_key("https://example.com/a.mp4", "local")
    assert first == second and first.startswith("src-")
    # The query is kept: for a signed link it identifies the resource, and a
    # different query must not be served from the same entry.
    assert first != cache_key("https://example.com/a.mp4?x=1", "local")
    # The fragment is not part of the identity.
    assert first == cache_key("https://example.com/a.mp4#t=10", "local")


def test_a_key_is_always_safe_for_a_filename():
    for url in ("https://example.com/../../etc/passwd", "https://example.com/a?b=c&d=e", "not a url"):
        key = cache_key(url, "youtube")
        assert key == "" or all(ch.isalnum() or ch in "-_" for ch in key), key


def test_a_stored_source_is_reused(tmp_path):
    cache = SourceCache(str(tmp_path))
    key = cache_key(YOUTUBE, "youtube")
    assert cache.store(key, YOUTUBE, "youtube", _media(tmp_path), 3840, 2160, 10.0)

    hit = cache.lookup(key, expected_duration=10.0)
    assert hit is not None
    path, entry = hit
    assert os.path.isfile(path)
    assert (entry.height, entry.width, entry.bytes) == (2160, 3840, 4096)


def test_nothing_is_reused_before_anything_is_stored(tmp_path):
    cache = SourceCache(str(tmp_path))
    assert cache.lookup(cache_key(YOUTUBE, "youtube")) is None


def test_a_source_below_the_requested_height_is_not_reused(tmp_path):
    """A cap raised after storing must not be satisfied by a smaller file."""
    cache = SourceCache(str(tmp_path))
    key = cache_key(YOUTUBE, "youtube")
    cache.store(key, YOUTUBE, "youtube", _media(tmp_path), 1920, 1080, 10.0)

    assert cache.lookup(key, expected_duration=10.0, min_height=720) is not None
    assert cache.lookup(key, expected_duration=10.0, min_height=1080) is not None
    assert cache.lookup(key, expected_duration=10.0, min_height=2160) is None


def test_a_source_at_or_above_the_requested_height_is_reused(tmp_path):
    """A 4K source satisfies a 1080p request: the crop can still use the detail."""
    cache = SourceCache(str(tmp_path))
    key = cache_key(YOUTUBE, "youtube")
    cache.store(key, YOUTUBE, "youtube", _media(tmp_path), 3840, 2160, 10.0)
    assert cache.lookup(key, expected_duration=10.0, min_height=1080) is not None


def test_a_cached_4k_source_does_not_satisfy_a_full_hd_ceiling(tmp_path):
    cache = SourceCache(str(tmp_path))
    key = cache_key(YOUTUBE, "youtube")
    cache.store(key, YOUTUBE, "youtube", _media(tmp_path), 3840, 2160, 10.0)

    assert cache.lookup(key, expected_duration=10.0,
                        min_height=1080, max_height=1080) is None


@pytest.mark.parametrize("resolution", ["1080", "2160"])
def test_downloader_reuses_4k_without_contacting_youtube(tmp_path, resolution):
    cache = SourceCache(str(tmp_path))
    cache.store(cache_key(YOUTUBE, "youtube"), YOUTUBE, "youtube",
                _media(tmp_path), 3840, 2160, 10.0, title="Saved title")
    downloader = VideoDownloaderService.__new__(VideoDownloaderService)
    downloader.settings = SimpleNamespace(download_resolution=resolution, max_download_duration_seconds=60)
    downloader.source_cache = cache

    async def network_forbidden(*args, **kwargs):
        raise AssertionError("Cached video must not contact YouTube")

    async def probe(path):
        assert os.path.isfile(path)
        return VideoMetadata("local", 10.0, 3840, 2160, 25.0, "mp4", "local")

    downloader._get_video_info = network_forbidden
    downloader._get_video_metadata_ffprobe = probe
    result = asyncio.run(downloader._download_from_youtube(
        YOUTUBE, str(tmp_path / "new.mp4"), str(tmp_path)))
    assert result.video_path == cache.lookup(cache_key(YOUTUBE, "youtube"))[0]
    assert result.metadata.title == "Saved title"
    assert result.metadata.fps == 25.0
    assert result.source_type == "youtube"


def test_a_source_of_a_different_length_is_not_reused(tmp_path):
    """The strongest guard against serving the wrong video."""
    cache = SourceCache(str(tmp_path))
    key = cache_key(YOUTUBE, "youtube")
    cache.store(key, YOUTUBE, "youtube", _media(tmp_path), 1920, 1080, 10.0)

    assert cache.lookup(key, expected_duration=10.0 + DURATION_TOLERANCE_SECONDS) is not None
    assert cache.lookup(key, expected_duration=10.0 - DURATION_TOLERANCE_SECONDS) is not None
    assert cache.lookup(key, expected_duration=600.0) is None
    # No host duration to compare against is not a reason to refuse.
    assert cache.lookup(key, expected_duration=None) is not None


def test_a_record_whose_media_vanished_is_swept(tmp_path):
    cache = SourceCache(str(tmp_path))
    key = cache_key(YOUTUBE, "youtube")
    cache.store(key, YOUTUBE, "youtube", _media(tmp_path), 1920, 1080, 10.0)

    path, _ = cache.lookup(key)
    os.remove(path)
    assert cache.lookup(key) is None
    assert not (tmp_path / f"{key}.json").exists()


def test_a_truncated_media_file_is_not_reused(tmp_path):
    cache = SourceCache(str(tmp_path))
    key = cache_key(YOUTUBE, "youtube")
    stored = cache.store(key, YOUTUBE, "youtube", _media(tmp_path, size=4096), 1920, 1080, 10.0)
    assert stored

    path, _ = cache.lookup(key)
    with open(path, "wb") as handle:
        handle.write(b"x" * 10)
    assert cache.lookup(key) is None


def test_storing_the_same_key_twice_replaces_the_entry(tmp_path):
    cache = SourceCache(str(tmp_path))
    key = cache_key(YOUTUBE, "youtube")
    cache.store(key, YOUTUBE, "youtube", _media(tmp_path, "one.mp4", 4096), 1920, 1080, 10.0)
    cache.store(key, YOUTUBE, "youtube", _media(tmp_path, "two.mkv", 8192), 3840, 2160, 10.0)

    hit = cache.lookup(key, expected_duration=10.0)
    assert hit is not None and hit[1].height == 2160 and hit[1].bytes == 8192
    # The replaced media is gone, not orphaned.
    assert not os.path.exists(str(tmp_path / f"{key}.mp4"))


def test_the_budget_evicts_the_least_recently_used(tmp_path):
    """Storing prunes, so the cache never exceeds the budget it was given."""
    budget = 8192
    cache = SourceCache(str(tmp_path), budget_bytes=budget)
    for name in ("a", "b", "c"):
        cache.store(f"yt-{name}aaaa", f"https://x/{name}", "youtube",
                    _media(tmp_path, f"{name}.mp4", 4096), 1920, 1080, 10.0)
        assert cache.total_bytes() <= budget

    # Two 4 KB entries fit in 8 KB; the third pushes the oldest out.
    remaining = sorted(p.name for p in tmp_path.glob("*.json"))
    assert remaining == ["yt-baaaa.json", "yt-caaaa.json"]
    assert not (tmp_path / "yt-aaaaa.json").exists()
    assert not (tmp_path / "yt-aaaaa.mp4").exists()
    assert (tmp_path / "yt-caaaa.mp4").is_file()


def test_no_budget_means_nothing_is_evicted(tmp_path):
    cache = SourceCache(str(tmp_path), budget_bytes=0)
    for name in ("a", "b", "c"):
        cache.store(f"yt-{name}aaaa", f"https://x/{name}", "youtube",
                    _media(tmp_path, f"{name}.mp4", 4096), 1920, 1080, 10.0)
    assert len(list(tmp_path.glob("*.json"))) == 3


def test_a_disabled_cache_never_raises(tmp_path):
    """A cache that cannot exist must degrade into downloading again."""
    blocker = tmp_path / "afile"
    blocker.write_text("not a directory")
    for cache in (SourceCache(None), SourceCache(str(blocker / "sources"))):
        assert cache.enabled is False
        assert cache.lookup("yt-anything") is None
        assert cache.store("yt-anything", YOUTUBE, "youtube", _media(tmp_path), 1, 1, 1.0) is False
        cache.prune()
        assert cache.total_bytes() == 0


def test_a_sidecar_naming_a_path_outside_the_cache_is_ignored(tmp_path):
    """A tampered record must not make the engine read an arbitrary file."""
    cache = SourceCache(str(tmp_path))
    key = cache_key(YOUTUBE, "youtube")
    (tmp_path / f"{key}.json").write_text(
        '{"key":"%s","source_type":"youtube","url":"u","height":1080,"width":1920,'
        '"duration_seconds":10.0,"bytes":10,"media_name":"..\\\\..\\\\secret.mp4",'
        '"created_at":0,"last_used_at":0}' % key
    )
    assert cache.lookup(key) is None


def test_the_desktop_bridge_variable_is_the_one_the_engine_reads(monkeypatch):
    """A name mismatch disables the cache silently, with nothing in the log.

    The desktop bridge sends BRIDGECLIP_SOURCE_CACHE. A pydantic field would read
    SOURCE_CACHE_DIR instead, leave the setting unset, and every run would quietly
    download again while the app still showed the chosen folder.
    """
    from clip_engine.config import get_settings
    from clip_engine.services.video_downloader import VideoDownloaderService

    monkeypatch.setenv("BRIDGECLIP_SOURCE_CACHE", str(TMP_CACHE))
    monkeypatch.delenv("SOURCE_CACHE_DIR", raising=False)

    assert get_settings().source_cache_dir == str(TMP_CACHE)
    service = VideoDownloaderService()
    assert service.source_cache.enabled, "the app's variable must enable the cache"


def test_the_budget_comes_from_the_bridge_variable(monkeypatch):
    from clip_engine.config import get_settings

    monkeypatch.setenv("SOURCE_CACHE_BUDGET_BYTES", "1234")
    assert get_settings().source_cache_budget_bytes == 1234
    monkeypatch.setenv("SOURCE_CACHE_BUDGET_BYTES", "not a number")
    assert get_settings().source_cache_budget_bytes > 0


def test_a_corrupt_sidecar_is_ignored(tmp_path):
    cache = SourceCache(str(tmp_path))
    key = cache_key(YOUTUBE, "youtube")
    (tmp_path / f"{key}.json").write_text("{not json")
    assert cache.lookup(key) is None
