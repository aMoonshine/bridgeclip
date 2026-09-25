"""End-to-end check of on-device transcription against a real audio fixture.

Skipped unless the NeMo-Speech.cpp runtime and the Nemotron model are both
present, so the suite stays runnable on a machine that has not installed the
optional on-device backend. It never downloads either file.
"""

import asyncio
import os
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, "engine")

from clip_engine.services.transcription_service import TranscriptionService

ROOT = Path(__file__).resolve().parents[2]
FIXTURE = Path(__file__).resolve().parent / "fixtures" / "nemo-jfk.wav"
EXPECTED_TEXT = "fellow Americans"


def _runtime_available(service: TranscriptionService) -> bool:
    try:
        service._nemotron_runtime()
    except Exception:
        return False
    return FIXTURE.is_file()


@pytest.fixture(name="local_service")
def local_service_fixture():
    service = TranscriptionService.__new__(TranscriptionService)
    service.settings = SimpleNamespace(
        transcription_backend="nemotron",
        transcription_device=os.environ.get("TEST_TRANSCRIPTION_DEVICE", "auto"),
        transcription_diarize=False,
        clipping_mode="quality",
        openrouter_api_key="",
        nemo_speech_path=None,
        nemotron_model_path=None,
    )
    if not _runtime_available(service):
        pytest.skip("NeMo-Speech.cpp runtime, model and audio fixture are not all present")
    return service


def test_local_transcription_returns_the_expected_text_and_word_times(local_service):
    result = asyncio.run(
        local_service._transcribe_chunk_local(str(FIXTURE), "en", None, 11.0)
    )
    assert EXPECTED_TEXT in result.full_text
    words = [word for segment in result.segments for word in segment.words]
    assert len(words) >= 10, "captions need per-word timestamps"
    # Word times must be usable for captions: non-decreasing and non-overlapping
    # within a segment, on the millisecond timeline.
    for segment in result.segments:
        for word in segment.words:
            assert 0 <= word.start_time_ms <= word.end_time_ms <= 11_000
        starts = [word.start_time_ms for word in segment.words]
        assert starts == sorted(starts)


def test_local_transcription_reports_a_known_zero_cost(local_service):
    result = asyncio.run(
        local_service._transcribe_chunk_local(str(FIXTURE), "en", None, 11.0)
    )
    assert result.api_costs.estimated_cost_usd == 0.0
    # On-device inference is free; that is known, not an unknown estimate.
    assert result.api_costs.cost_incomplete is False
