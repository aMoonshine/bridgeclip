import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

from clip_engine.services.transcript_cache import TranscriptCache
from clip_engine.services.transcription_service import (
    TranscriptionService, TranscriptionResult, TranscriptionApiCosts,
    TranscriptSegment, TranscriptWord,
)


def result():
    return TranscriptionResult(
        segments=[TranscriptSegment(0, 500, "Hello", words=[TranscriptWord("Hello", 0, 500)])],
        full_text="Hello", language="en", duration_seconds=1,
        api_costs=TranscriptionApiCosts(estimated_cost_usd=0.1, attempts=1),
    )


def test_second_run_after_planning_failure_skips_audio_and_provider(tmp_path):
    video = tmp_path / "source.mp4"
    video.write_bytes(b"source")
    service = TranscriptionService.__new__(TranscriptionService)
    service.settings = SimpleNamespace(source_cache_dir=str(tmp_path / "cache"))
    service._extract_audio_from_video = AsyncMock()
    service.transcribe_audio = AsyncMock(return_value=result())
    first = asyncio.run(service.transcribe(str(video), str(tmp_path)))
    assert first.api_costs.estimated_cost_usd == 0.1
    # Planning can fail here; a new service still finds the saved transcript.
    second_service = TranscriptionService.__new__(TranscriptionService)
    second_service.settings = service.settings
    second_service._extract_audio_from_video = AsyncMock(side_effect=AssertionError("audio extracted twice"))
    second_service.transcribe_audio = AsyncMock(side_effect=AssertionError("paid twice"))
    second = asyncio.run(second_service.transcribe(str(video), str(tmp_path)))
    assert second.segments == first.segments
    assert second.api_costs is None
    assert second.language == "en"


def test_cache_invalidates_changed_source_range_and_vocabulary(tmp_path):
    video = tmp_path / "source.mp4"
    video.write_bytes(b"source")
    def cache(**kwargs):
        return TranscriptCache(tmp_path / "cache", video, **kwargs)
    cache().store(result())
    assert cache().load() is not None
    for kwargs in ({"start": 10}, {"end": 20}, {"language": "ru"},
                   {"keyterms": ["new term"]}, {"translate": True}):
        assert cache(**kwargs).load() is None
    video.write_bytes(b"different source")
    assert cache().load() is None


def test_bad_cache_is_a_miss_and_does_not_break_transcription(tmp_path):
    video = tmp_path / "source.mp4"
    video.write_bytes(b"source")
    cache = TranscriptCache(tmp_path / "cache", video)
    cache.store(result())
    cache.path.write_text("{broken", encoding="utf-8")
    assert cache.load() is None
    cache.store(TranscriptionResult([], ""))
    assert cache.load() is None
    blocker = tmp_path / "file"
    blocker.write_text("not a directory")
    TranscriptCache(blocker, video).store(result())


def test_partial_transcript_is_not_reused_for_full_source(tmp_path):
    video = tmp_path / "source.mp4"
    video.write_bytes(b"source")
    partial = TranscriptCache(tmp_path / "cache", video, start=30, end=60)
    partial.store(result())
    assert partial.load() is not None
    assert TranscriptCache(tmp_path / "cache", video).load() is None
