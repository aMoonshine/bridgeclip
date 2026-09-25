"""Local, on-device transcription through the bundled NeMo-Speech.cpp runtime."""

import asyncio
import json
import subprocess
import sys
from types import SimpleNamespace
from unittest.mock import patch

import pytest

sys.path.insert(0, "engine")

from clip_engine.config import NEMOTRON_FILENAME, NEMOTRON_MODEL, Settings
from clip_engine.error_policy import safe_failure_code, safe_job_error_text, safe_processing_error
from clip_engine.services.transcription_service import TranscriptionError, TranscriptionService


def _word(word, start, end):
    return {"word": word, "start": start, "end": end}


def _settings(**overrides):
    base = {
        "openrouter_api_key": "",
        "transcription_backend": "nemotron",
        "transcription_device": "auto",
        "transcription_diarize": False,
        "clipping_mode": "quality",
        "nemo_speech_path": None,
        "nemotron_model_path": None,
    }
    base.update(overrides)
    return SimpleNamespace(**base)


def _service(**overrides):
    service = TranscriptionService.__new__(TranscriptionService)
    service.settings = _settings(**overrides)
    return service


def _runtime_response():
    return json.dumps({
        "text": "And so my fellow Americans ask not what your country can do for you.",
        "confidence": 1,
        "duration": 11,
        "languages": ["en-US"],
        "words": [_word("And", 0.96, 1.04), _word("fellow", 1.76, 2.0), _word("Americans", 2.08, 2.48)],
    }).encode("utf-8")


def test_local_backend_needs_no_api_key_and_costs_nothing():
    assert Settings().transcription_backend == "openrouter", "the hosted backend must stay the default"
    assert Settings().transcription_provider == "openrouter"
    assert Settings(transcription_backend="nemotron").transcription_provider == "local"
    assert Settings(transcription_backend="nemotron").transcription_model == NEMOTRON_MODEL
    assert Settings(transcription_backend="nemotron").transcription_device == "auto"


@pytest.mark.parametrize(
    "value, expected",
    [("auto", "auto"), ("cpu", "cpu"), ("vulkan:0", "vulkan:0"), ("CUDA:1", "cuda:1"), ("  vulkan  ", "vulkan")],
)
def test_documented_devices_are_accepted_and_normalized(value, expected):
    assert Settings(transcription_device=value).transcription_device == expected


@pytest.mark.parametrize("value", ["vulkan:abc", "vulkan:999", "; calc", "rm -rf /", "../../etc", "auto extra"])
def test_undocumented_devices_are_refused(value):
    """The value becomes a subprocess argument, so only a known name may pass."""
    with pytest.raises(Exception):
        Settings(transcription_device=value)


def test_local_command_passes_the_device_and_keeps_paths_out_of_errors(monkeypatch):
    service = _service(transcription_device="vulkan:0")
    monkeypatch.setattr(service, "_nemotron_runtime", lambda: ("local-nemo", "local-model.gguf"))
    seen = {}

    def fake_run(command, **kwargs):
        seen["command"] = command
        return subprocess.CompletedProcess(command, 0, _runtime_response(), b"")

    monkeypatch.setattr(subprocess, "run", fake_run)
    response = asyncio.run(service._request_nemotron_transcript("clip.wav", "en", ["BridgeClip"]))
    assert response["text"].startswith("And so my fellow Americans")
    assert seen["command"] == [
        "local-nemo", "transcribe", "clip.wav", "--model", "local-model.gguf",
        "--language", "en-US", "--format", "json", "--device", "vulkan:0",
        "--speech-context", "BridgeClip",
    ]


def test_local_command_defaults_to_automatic_device(monkeypatch):
    service = _service()
    monkeypatch.setattr(service, "_nemotron_runtime", lambda: ("local-nemo", "m.gguf"))
    seen = {}

    def fake_run(command, **kwargs):
        seen["command"] = command
        return subprocess.CompletedProcess(command, 0, _runtime_response(), b"")

    monkeypatch.setattr(subprocess, "run", fake_run)
    asyncio.run(service._request_nemotron_transcript("clip.wav", "en", None))
    assert seen["command"][seen["command"].index("--device") + 1] == "auto"


def test_a_failing_runtime_does_not_leak_its_output(monkeypatch):
    service = _service()
    monkeypatch.setattr(service, "_nemotron_runtime", lambda: ("local-nemo", "m.gguf"))
    monkeypatch.setattr(
        subprocess, "run",
        lambda command, **kwargs: subprocess.CompletedProcess(command, 1, b"", b"/home/someone/private.gguf failed"),
    )
    with pytest.raises(TranscriptionError) as caught:
        asyncio.run(service._request_nemotron_transcript("clip.wav", "en", None))
    assert caught.value.reason == "local_failed"
    assert "private" not in str(caught.value)


def test_a_missing_runtime_is_reported_as_unavailable(monkeypatch, tmp_path):
    service = _service(nemo_speech_path=str(tmp_path / "missing"), nemotron_model_path=str(tmp_path / "m.gguf"))
    (tmp_path / "m.gguf").write_bytes(b"stub")
    with pytest.raises(TranscriptionError) as caught:
        service._nemotron_runtime()
    assert caught.value.reason == "local_unavailable"


def test_local_words_reach_the_shared_parser_with_a_known_zero_cost(monkeypatch):
    service = _service()
    monkeypatch.setattr(service, "_nemotron_runtime", lambda: ("local-nemo", "m.gguf"))
    monkeypatch.setattr(
        subprocess, "run",
        lambda command, **kwargs: subprocess.CompletedProcess(command, 0, _runtime_response(), b""),
    )
    result = asyncio.run(service._transcribe_chunk_local("clip.wav", "en", None, 11.0))
    assert result.full_text.startswith("And so my fellow Americans")
    assert [w.word for w in result.segments[0].words][:3] == ["And", "fellow", "Americans"]
    assert result.segments[0].words[0].start_time_ms == 960
    assert result.language == "en-US"
    # On-device inference is free, and that is known rather than unknown.
    assert result.api_costs.estimated_cost_usd == 0.0
    assert result.api_costs.cost_incomplete is False
    assert result.model == NEMOTRON_MODEL


def test_a_local_response_without_words_is_not_accepted(monkeypatch):
    service = _service()
    monkeypatch.setattr(service, "_nemotron_runtime", lambda: ("local-nemo", "m.gguf"))
    monkeypatch.setattr(
        subprocess, "run",
        lambda command, **kwargs: subprocess.CompletedProcess(
            command, 0, json.dumps({"text": "", "words": []}).encode("utf-8"), b""),
    )
    with pytest.raises(TranscriptionError) as caught:
        asyncio.run(service._transcribe_chunk_local("clip.wav", "en", None, 11.0))
    assert caught.value.reason == "local_failed"


def test_local_failures_get_their_own_message_and_code():
    unavailable = TranscriptionError("Local transcription model or runtime is unavailable", reason="local_unavailable")
    outward = safe_processing_error(unavailable)
    assert outward == "Local transcription model or runtime is unavailable"
    assert safe_failure_code(unavailable) == "transcription.local_unavailable"
    assert safe_job_error_text(outward) == "Local transcription model or runtime is unavailable"

    failed = TranscriptionError("Local transcription failed", reason="local_failed")
    assert safe_failure_code(failed) == "transcription.local_failed"
    assert safe_job_error_text("Local transcription failed") == "Local transcription failed"


def test_the_model_file_name_matches_what_is_staged():
    assert NEMOTRON_FILENAME == "nemotron-3.5-asr-streaming-0.6b.q8_0.gguf"
    assert NEMOTRON_MODEL == "nvidia/nemotron-3.5-asr-streaming-0.6b"
