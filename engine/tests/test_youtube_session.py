import json
from http.cookiejar import CookieJar
from types import SimpleNamespace
from clip_engine.services.youtube_session import apply_session, session_data


def test_only_youtube_cookies_are_passed_in_memory(monkeypatch):
    cookies = [{"domain": ".youtube.com", "name": "SID", "value": "fixture", "secure": True},
               {"domain": "attacker.test", "name": "secret", "value": "excluded"}]
    monkeypatch.setenv("BRIDGECLIP_YOUTUBE_SESSION", json.dumps({"cookies": cookies, "userAgent": "fixture-browser"}))
    ydl = SimpleNamespace(cookiejar=CookieJar())
    apply_session(ydl)
    assert [(c.domain, c.name, c.value) for c in ydl.cookiejar] == [(".youtube.com", "SID", "fixture")]
    assert session_data()["userAgent"] == "fixture-browser"


def test_absent_or_malformed_session_is_empty(monkeypatch):
    monkeypatch.delenv("BRIDGECLIP_YOUTUBE_SESSION", raising=False)
    assert session_data() == {}
    monkeypatch.setenv("BRIDGECLIP_YOUTUBE_SESSION", "{bad")
    assert session_data() == {}


def test_saved_session_enables_node_and_compatible_clients(monkeypatch):
    from clip_engine.services.youtube_session import extraction_options
    monkeypatch.setenv("BRIDGECLIP_YOUTUBE_SESSION", json.dumps({"cookies": [{"domain": ".youtube.com", "name": "SID", "value": "fixture"}]}))
    monkeypatch.setattr("clip_engine.services.youtube_session.shutil.which", lambda name: "C:/runtime/node.exe" if name == "node" else None)
    opts = extraction_options()
    assert opts["js_runtimes"]["node"]["path"] == "C:/runtime/node.exe"
    assert opts["extractor_args"]["youtube"]["player_client"] == ["default", "web_embedded", "-tv_downgraded"]
    assert "fixture" not in repr(opts)


def test_no_session_preserves_default_clients(monkeypatch):
    from clip_engine.services.youtube_session import extraction_options
    monkeypatch.delenv("BRIDGECLIP_YOUTUBE_SESSION", raising=False)
    monkeypatch.setattr("clip_engine.services.youtube_session.shutil.which", lambda _: None)
    assert extraction_options() == {}


def test_metadata_receives_saved_cookies_and_runtime(monkeypatch):
    import asyncio
    from clip_engine.services import video_downloader as module
    monkeypatch.setenv("BRIDGECLIP_YOUTUBE_SESSION", json.dumps({"cookies": [{"domain": ".youtube.com", "name": "SID", "value": "fixture"}]}))
    monkeypatch.setattr("clip_engine.services.youtube_session.shutil.which", lambda _: "C:/runtime/node.exe")
    class Downloader:
        def __init__(self, options):
            assert options["js_runtimes"]["node"]["path"] == "C:/runtime/node.exe"
            assert "-tv_downgraded" in options["extractor_args"]["youtube"]["player_client"]
            self.cookiejar = CookieJar()
        def __enter__(self):
            return self
        def __exit__(self, *_):
            pass
        def extract_info(self, url, download):
            assert [(c.name, c.value) for c in self.cookiejar] == [("SID", "fixture")]
            return {"title": "fixture", "duration": 5, "width": 320, "height": 240, "fps": 30}
    monkeypatch.setattr(module.yt_dlp, "YoutubeDL", Downloader)
    service = module.VideoDownloaderService.__new__(module.VideoDownloaderService)
    asyncio.run(service._get_video_info("https://www.youtube.com/watch?v=fixture"))


def test_youtube_auth_failure_survives_safe_error_mapping(monkeypatch):
    import asyncio
    import pytest
    from clip_engine.services import video_downloader as module
    from clip_engine.error_policy import safe_processing_error, safe_failure_code, safe_job_error_text
    monkeypatch.setenv("BRIDGECLIP_YOUTUBE_SESSION", json.dumps({"cookies": []}))
    class Downloader:
        def __init__(self, options): self.cookiejar = CookieJar()
        def __enter__(self): return self
        def __exit__(self, *_): pass
        def extract_info(self, *args, **kwargs):
            raise RuntimeError("Sign in to confirm you're not a bot. PRIVATE_PROVIDER_DETAIL")
    monkeypatch.setattr(module.yt_dlp, "YoutubeDL", Downloader)
    service = module.VideoDownloaderService.__new__(module.VideoDownloaderService)
    with pytest.raises(module.VideoDownloadError) as caught:
        asyncio.run(service._get_video_info("https://www.youtube.com/watch?v=fixture"))
    assert safe_failure_code(caught.value) == "download.youtube_auth"
    text = safe_processing_error(caught.value)
    assert text == "YouTube session needs verification"
    assert safe_job_error_text(text) == text
    assert "PRIVATE_PROVIDER_DETAIL" not in text


def test_august_ytdlp_embedded_client_receives_upstream_hls_fix(monkeypatch):
    from clip_engine.services.youtube_session import extraction_options
    from yt_dlp.extractor.youtube._base import INNERTUBE_CLIENTS
    import yt_dlp.version
    client = INNERTUBE_CLIENTS["web_embedded"]["INNERTUBE_CONTEXT"]["client"]
    monkeypatch.setattr(yt_dlp.version, "__version__", "2026.08.19")
    monkeypatch.setitem(client, "userAgent", "test-original")
    del client["userAgent"]
    extraction_options()
    assert "Safari/605.1.15" in client["userAgent"]
    monkeypatch.setitem(client, "userAgent", "future-upstream-agent")
    extraction_options()
    assert client["userAgent"] == "future-upstream-agent"
