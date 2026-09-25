"""Validation of the local NeMo-Speech.cpp device selection."""

import pytest

from clip_engine.config import Settings


def test_device_defaults_to_auto_so_the_runtime_picks_the_gpu():
    assert Settings().transcription_device == "auto"


@pytest.mark.parametrize(
    "value, expected",
    [
        ("auto", "auto"),
        ("cpu", "cpu"),
        ("vulkan:0", "vulkan:0"),
        ("CUDA:1", "cuda:1"),
        ("  vulkan  ", "vulkan"),
        # An unset or blank value falls back to auto rather than failing the run.
        ("", "auto"),
    ],
)
def test_documented_devices_are_accepted_and_normalized(value, expected):
    assert Settings(transcription_device=value).transcription_device == expected


@pytest.mark.parametrize(
    "value",
    [
        "vulkan:abc",
        "vulkan:999",
        "; calc",
        "rm -rf /",
        "../../etc",
        "auto extra",
    ],
)
def test_undocumented_devices_are_rejected(value):
    """The value reaches a subprocess argv, so only a known device name passes."""
    with pytest.raises(Exception):
        Settings(transcription_device=value)
