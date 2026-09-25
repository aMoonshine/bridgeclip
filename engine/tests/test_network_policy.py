import socket
from unittest.mock import patch

from clip_engine.network_policy import (
    _preferred_address,
    public_source_url,
    resolve_public_destination,
    unreachable_ipv6_fallback,
)


def _answer(address):
    return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (address, 443))]


def test_public_media_url_requires_global_resolved_destination():
    with patch("clip_engine.network_policy.socket.getaddrinfo", return_value=_answer("8.8.8.8")):
        assert public_source_url("https://video.example.com/movie.mp4")
        assert not public_source_url("file:///etc/passwd")
        assert not public_source_url("https://user:pass@video.example.com/movie.mp4")
        assert not public_source_url("https://video.example.com:8080/movie.mp4")
    with patch("clip_engine.network_policy.socket.getaddrinfo", return_value=_answer("127.0.0.1")):
        assert not public_source_url("https://video.example.com/movie.mp4")
    assert not public_source_url("http://localhost/private")


def test_mixed_public_and_tunnel_answers_still_resolve():
    """A VPN resolver can pair a public A record with a ULA AAAA record."""
    mixed = [
        (socket.AF_INET6, socket.SOCK_STREAM, 6, "", ("fdcc:ad94:bacf:61a4::cafe:7", 443, 0, 0)),
        (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 443)),
    ]
    with patch("clip_engine.network_policy.socket.getaddrinfo", return_value=mixed):
        assert public_source_url("https://video.example.com/movie.mp4")
        pinned = resolve_public_destination("https://video.example.com/movie.mp4")
    assert pinned.url == "https://93.184.216.34/movie.mp4"
    assert pinned.hostname == "video.example.com"


def test_all_private_answers_are_still_refused():
    private = [
        (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("10.0.0.1", 443)),
        (socket.AF_INET6, socket.SOCK_STREAM, 6, "", ("fdcc:ad94:bacf:61a4::cafe:7", 443, 0, 0)),
    ]
    with patch("clip_engine.network_policy.socket.getaddrinfo", return_value=private):
        assert not public_source_url("https://lan.example.com/movie.mp4")


def test_preferred_address_keeps_ipv6_when_it_is_the_only_family():
    import ipaddress

    only_v6 = [ipaddress.ip_address("2001:4860:4860::8888")]
    assert str(_preferred_address(only_v6)) == "2001:4860:4860::8888"


def _fake_socket_factory(v6_works, v4_works):
    """Build a socket.socket replacement; records every address it is given."""
    seen = []

    def make_socket(family, sock_type):
        class FakeSocket:
            def settimeout(self, _value):
                return None

            def connect(self, address):
                seen.append(address)
                if family == socket.AF_INET6 and not v6_works:
                    raise OSError("timed out")
                if family == socket.AF_INET and not v4_works:
                    raise OSError("timed out")

            def close(self):
                return None

        return FakeSocket()

    return make_socket, seen


def test_unreachable_ipv6_fallback_flags_a_blackholed_tunnel():
    """Public AAAA present, IPv6 connect fails, IPv4 connect succeeds."""
    v6 = [(socket.AF_INET6, socket.SOCK_STREAM, 6, "", ("2001:4860:4860::8888", 443, 0, 0))]

    def fake_getaddrinfo(host, port, family=socket.AF_UNSPEC, *args, **kwargs):
        return v6 if family == socket.AF_INET6 else _answer("93.184.216.34")

    make_socket, seen = _fake_socket_factory(v6_works=False, v4_works=True)
    with patch("clip_engine.network_policy.socket.getaddrinfo", fake_getaddrinfo), \
            patch("clip_engine.network_policy.socket.socket", make_socket):
        assert unreachable_ipv6_fallback("https://video.example.com/movie.mp4")
    # Exactly one attempt per family: the probe must not walk the whole CDN set.
    assert len(seen) == 2


def test_unreachable_ipv6_fallback_is_false_when_ipv6_works():
    v6 = [(socket.AF_INET6, socket.SOCK_STREAM, 6, "", ("2001:4860:4860::8888", 443, 0, 0))]

    def fake_getaddrinfo(host, port, family=socket.AF_UNSPEC, *args, **kwargs):
        return v6 if family == socket.AF_INET6 else _answer("93.184.216.34")

    make_socket, _ = _fake_socket_factory(v6_works=True, v4_works=True)
    with patch("clip_engine.network_policy.socket.getaddrinfo", fake_getaddrinfo), \
            patch("clip_engine.network_policy.socket.socket", make_socket):
        assert not unreachable_ipv6_fallback("https://video.example.com/movie.mp4")


def test_unreachable_ipv6_fallback_ignores_hosts_without_ipv6():
    """An IPv4-only host must never be reported as having a broken IPv6 path."""
    def fake_getaddrinfo(host, port, family=socket.AF_UNSPEC, *args, **kwargs):
        if family == socket.AF_INET6:
            raise socket.gaierror("no AAAA record")
        return _answer("93.184.216.34")

    make_socket, seen = _fake_socket_factory(v6_works=True, v4_works=True)
    with patch("clip_engine.network_policy.socket.getaddrinfo", fake_getaddrinfo), \
            patch("clip_engine.network_policy.socket.socket", make_socket):
        assert not unreachable_ipv6_fallback("https://v4only.example.com/movie.mp4")
    # No IPv6 record means no connect is attempted at all.
    assert seen == []


def test_unreachable_ipv6_fallback_ignores_hosts_without_ipv4():
    def fake_getaddrinfo(host, port, family=socket.AF_UNSPEC, *args, **kwargs):
        if family == socket.AF_INET:
            raise socket.gaierror("no A record")
        return [(socket.AF_INET6, socket.SOCK_STREAM, 6, "", ("2001:4860:4860::8888", 443, 0, 0))]

    make_socket, seen = _fake_socket_factory(v6_works=True, v4_works=True)
    with patch("clip_engine.network_policy.socket.getaddrinfo", fake_getaddrinfo), \
            patch("clip_engine.network_policy.socket.socket", make_socket):
        assert not unreachable_ipv6_fallback("https://v6only.example.com/movie.mp4")
    assert seen == []


def test_youtube_bot_check_keeps_its_cause_through_error_policy():
    """A YouTube challenge must not collapse into the generic download failure."""
    from clip_engine.error_policy import safe_processing_error, safe_failure_code
    from clip_engine.services.video_downloader import VideoDownloadError

    error = VideoDownloadError(
        "YouTube is challenging this connection. It refuses downloads from datacenter and VPN addresses.",
        reason="youtube_bot_check",
    )
    outward = safe_processing_error(error)
    assert "challenging" in outward
    assert safe_failure_code(error) == "download.youtube_bot_check"
    assert "Video download failed" not in outward


def test_unreachable_ipv6_keeps_its_cause_through_error_policy():
    from clip_engine.error_policy import safe_processing_error, safe_failure_code
    from clip_engine.services.video_downloader import VideoDownloadError

    error = VideoDownloadError(
        "IPv6 is advertised by this host but cannot be reached.", reason="ipv6_unreachable"
    )
    assert "IPv6" in safe_processing_error(error)
    assert safe_failure_code(error) == "download.ipv6_unreachable"


def test_unreachable_ipv6_fallback_ignores_a_fully_unreachable_host():
    """Both families dead is a plain outage, not a VPN IPv6 misconfiguration."""
    v6 = [(socket.AF_INET6, socket.SOCK_STREAM, 6, "", ("2001:4860:4860::8888", 443, 0, 0))]

    def fake_getaddrinfo(host, port, family=socket.AF_UNSPEC, *args, **kwargs):
        return v6 if family == socket.AF_INET6 else _answer("93.184.216.34")

    make_socket, _ = _fake_socket_factory(v6_works=False, v4_works=False)
    with patch("clip_engine.network_policy.socket.getaddrinfo", fake_getaddrinfo), \
            patch("clip_engine.network_policy.socket.socket", make_socket):
        assert not unreachable_ipv6_fallback("https://video.example.com/movie.mp4")


def test_youtube_detection_uses_hostname_not_text_in_path():
    from types import SimpleNamespace
    from unittest.mock import patch
    from clip_engine.services.video_downloader import VideoDownloaderService

    settings = SimpleNamespace(local_mode=False, get_proxy_list=lambda: [])
    with patch("clip_engine.services.video_downloader.get_settings", return_value=settings):
        downloader = VideoDownloaderService()
        assert downloader.detect_source_type("https://www.youtube.com/watch?v=test") == "youtube"
        assert downloader.detect_source_type("https://evil.example/youtube.com/watch") == "direct_url"
