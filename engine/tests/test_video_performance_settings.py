"""Source ceiling, encoder choice and clip concurrency."""

import pytest

from clip_engine.config import Settings
from clip_engine.services.video_downloader import (YOUTUBE_FORMAT_SELECTORS,
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


@pytest.mark.parametrize("value", ["cpu", "nvenc", "auto"])
def test_documented_encoders_are_accepted(value):
    assert Settings(video_encoder=value).video_encoder == value


@pytest.mark.parametrize("value", ["videotoolbox", "qsv", "h264_nvenc; calc"])
def test_an_unknown_encoder_is_refused(value):
    with pytest.raises(Exception):
        Settings(video_encoder=value)


def test_an_unset_encoder_means_the_default():
    assert Settings(video_encoder="").video_encoder == "cpu"


def test_the_default_encoder_stays_on_the_processor():
    """Encoding must not silently move to the GPU for an untouched install."""
    assert Settings().video_encoder == "cpu"
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


def test_nvenc_arguments_are_only_built_when_the_probe_passed():
    from clip_engine.services.rendering_service import RenderingService

    service = RenderingService.__new__(RenderingService)
    service.settings = Settings(local_mode=True, video_encoder="cpu")

    service._nvenc_available = False
    assert service._nvenc_args(1080, 1920, 30.0, ["-g", "60"]) == []

    service._nvenc_available = True
    args = service._nvenc_args(1080, 1920, 30.0, ["-g", "60"])
    assert args[args.index("-c:v") + 1] == "h264_nvenc"
    # Constant quality, not CRF, and the bitrate is derived rather than capped.
    assert "-cq" in args and "-crf" not in args
    assert args[args.index("-b:v") + 1] == "0"


def test_the_cpu_path_is_untouched_by_the_new_settings():
    """A default install must encode exactly as it did before."""
    from clip_engine.services.rendering_service import RenderingService

    service = RenderingService.__new__(RenderingService)
    service.settings = Settings(local_mode=True)
    service._local_cpu_encoder = "libx264"
    service._nvenc_available = True

    args = service._video_codec_args(1080, 1920, "30")
    assert args[args.index("-c:v") + 1] == "libx264"
    assert "-crf" in args
