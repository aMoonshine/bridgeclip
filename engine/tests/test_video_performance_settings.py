"""Source ceiling and clip concurrency settings."""

import pytest
import yt_dlp
from types import SimpleNamespace

from clip_engine.config import Settings
from clip_engine.services.video_downloader import (YOUTUBE_FORMAT_SELECTORS,
                                                   VideoDownloaderService,
                                                   height_capped_selectors)


def _ladder(cap):
    return height_capped_selectors(cap)


def test_no_cap_returns_the_original_selectors_unchanged():
    """A default install must download exactly what it always has."""
    assert _ladder(None) == list(YOUTUBE_FORMAT_SELECTORS)
    assert "[height<=" not in _ladder(None)[0]


def test_every_capped_selector_carries_a_height_ceiling():
    for cap in (2160, 1440, 1080, 720):
        for selector in _ladder(cap):
            assert "[height<=" in selector, selector


def test_a_capped_selector_never_offers_more_than_the_ceiling():
    """The fallback ladder must not contain a rung above the requested height."""
    for cap in (2160, 1440, 1080, 720):
        for selector in _ladder(cap):
            ceiling = int(selector.rsplit("<=", 1)[1].rstrip("]"))
            assert ceiling <= cap, (cap, selector)


def test_ytdlp_never_selects_a_4k_stream_for_full_hd():
    """Exercise yt-dlp's selector parser, including its slash fallback."""
    formats = [
        {"format_id": "vhd", "vcodec": "vp9", "acodec": "none", "height": 1080, "ext": "webm"},
        {"format_id": "v4k", "vcodec": "vp9", "acodec": "none", "height": 2160, "ext": "webm"},
        {"format_id": "audio", "vcodec": "none", "acodec": "opus", "ext": "webm"},
    ]
    for fmt in formats:
        fmt["url"] = f"https://example.invalid/{fmt['format_id']}"
    with yt_dlp.YoutubeDL({"quiet": True}) as ydl:
        selected = list(ydl.build_format_selector(_ladder(1080)[0])({"formats": formats}))
    video_heights = [
        part["height"]
        for choice in selected
        for part in choice.get("requested_formats", [choice])
        if part.get("vcodec") != "none"
    ]
    assert video_heights == [1080]


@pytest.mark.parametrize("source_type", ["youtube", "twitch"])
def test_every_host_download_selector_respects_full_hd(source_type):
    downloader = VideoDownloaderService.__new__(VideoDownloaderService)
    downloader.settings = SimpleNamespace(download_resolution="1080")
    selectors = downloader._download_format_selectors(source_type)
    assert selectors
    assert all("[height<=1080]" in selector or "[height<=720]" in selector
               for selector in selectors)


def test_the_ladder_walks_down_before_switching_codec():
    """A 4K-only VP9 host should still yield a capped VP9 file."""
    ladder = _ladder(1080)
    first_two = ladder[:2]
    assert first_two[0].endswith("[height<=1080]")
    assert first_two[1].endswith("[height<=720]")
    # Same base selector, descending heights.
    base_first = first_two[0].split("[height")[0]
    base_second = first_two[1].split("[height")[0]
    assert base_first == base_second


def test_a_lower_ceiling_produces_a_shorter_ladder():
    assert len(_ladder(720)) < len(_ladder(1080)) < len(_ladder(2160))


@pytest.mark.parametrize("value", ["source", "2160", "1440", "1080", "720"])
def test_documented_source_ceilings_are_accepted(value):
    assert Settings(download_resolution=value).download_resolution == value


@pytest.mark.parametrize("value", ["4320", "8k", "1080; rm -rf /"])
def test_an_unknown_source_ceiling_is_refused(value):
    with pytest.raises(Exception):
        Settings(download_resolution=value)


def test_an_unset_source_ceiling_means_the_default():
    """An absent environment variable must not make settings unreadable."""
    assert Settings(download_resolution="").download_resolution == "source"
    assert Settings(download_resolution="   ").download_resolution == "source"


def test_render_settings_keep_the_existing_software_path_by_default():
    assert Settings().download_resolution == "source"
    assert Settings().render_concurrency is None


@pytest.mark.parametrize("value", [1, 2, 4, 6, 8])
def test_an_explicit_clip_count_is_kept(value):
    assert Settings(render_concurrency=value).max_concurrent_renders == value


@pytest.mark.parametrize("value", [0, 9, 1000, -1])
def test_a_clip_count_outside_the_range_is_refused(value):
    with pytest.raises(Exception):
        Settings(render_concurrency=value)


def test_an_absent_clip_count_derives_from_the_machine():
    """Unset means "size it from the cores", which is the pre-existing behaviour."""
    settings = Settings(render_concurrency=None, local_mode=True)
    derived = settings.max_concurrent_renders
    assert 1 <= derived <= 4


def test_the_cpu_path_is_untouched_by_the_new_settings():
    """A default install must encode exactly as it did before."""
    from clip_engine.services.rendering_service import RenderingService

    service = RenderingService.__new__(RenderingService)
    service.settings = Settings(local_mode=True)
    service._local_cpu_encoder = "libx264"
    args = service._video_codec_args(1080, 1920, "30")
    assert args[args.index("-c:v") + 1] == "libx264"
    assert "-crf" in args


@pytest.mark.parametrize("available", [360, 720])
def test_explicit_full_hd_does_not_silently_accept_lower_quality(available):
    from clip_engine.services.video_downloader import VideoDownloadError
    from clip_engine.error_policy import safe_failure_code, safe_processing_error, safe_job_error_text
    downloader = VideoDownloaderService.__new__(VideoDownloaderService)
    downloader.settings = SimpleNamespace(download_resolution="1080")
    with pytest.raises(VideoDownloadError) as caught:
        downloader._check_requested_quality(available)
    assert safe_failure_code(caught.value) == "download.quality_unavailable"
    assert safe_job_error_text(safe_processing_error(caught.value)) == "Requested video quality unavailable"
    downloader._check_requested_quality(1080)
    downloader.settings.download_resolution = "source"
    downloader._check_requested_quality(available)
