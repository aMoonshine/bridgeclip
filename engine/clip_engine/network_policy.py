"""Public network destinations for caller-supplied media and callbacks."""

import ipaddress
import socket
import threading
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass
from typing import Iterator
from urllib.parse import urlsplit, urlunsplit


@dataclass(frozen=True)
class PinnedDestination:
    """A request URL whose address cannot change between validation and connect."""

    url: str
    hostname: str
    host_header: str


def _preferred_address(ips: list):
    """Pick the address to pin to from a set of globally routable answers.

    IPv4 wins whenever the host publishes both families. A dual-stack name on a
    machine whose IPv6 route is a blackhole - a VPN tunnel advertising a ULA
    with ``::/0``, for example - resolves to a public-looking AAAA record that
    cannot be reached, and pinning to it turns every request into a full
    timeout. Choosing IPv4 cannot make a reachable request fail, because an A
    record was present, and a genuinely IPv6-only host still falls through to
    its AAAA record.
    """
    for ip in ips:
        if ip.version == 4:
            return ip
    return ips[0]


def resolve_public_destination(url: str) -> PinnedDestination:
    """Resolve once, reject non-public answers, then pin the request to one IP.

    Callers must send the original Host header, use ``hostname`` as the TLS
    SNI name, and disable environment proxies and automatic redirects.
    """
    if not isinstance(url, str) or len(url) > 8192 or any(ord(char) < 32 for char in url):
        raise ValueError("Invalid public destination")
    try:
        parsed = urlsplit(url)
        host = parsed.hostname
        port = parsed.port
        if parsed.scheme not in ("http", "https") or not host or parsed.username or parsed.password:
            raise ValueError("Invalid public destination")
        if port not in (None, 80, 443):
            raise ValueError("Invalid public destination")
        if host.endswith((".local", ".localhost", ".internal")) or host == "localhost":
            raise ValueError("Invalid public destination")
        hostname = host.encode("idna").decode("ascii")
        addresses = socket.getaddrinfo(
            hostname, port or (443 if parsed.scheme == "https" else 80), type=socket.SOCK_STREAM
        )
        if not addresses:
            raise ValueError("Invalid public destination")
        ips = [ipaddress.ip_address(item[4][0]) for item in addresses]
        # Keep the globally routable answers and refuse the host only when none
        # are. A VPN resolver can return a real public A record alongside an
        # unroutable AAAA record; pinning to a reachable address is what matters,
        # and rejecting the whole name on one bad answer breaks working downloads.
        public = [ip for ip in ips if ip.is_global]
        if not public:
            raise ValueError("Invalid public destination")
        ip = _preferred_address(public)
        address = f"[{ip}]" if ip.version == 6 else str(ip)
        host_header = f"[{hostname}]" if ":" in hostname else hostname
        if port is not None:
            address += f":{port}"
            host_header += f":{port}"
        pinned_url = urlunsplit((parsed.scheme, address, parsed.path or "/", parsed.query, ""))
        return PinnedDestination(pinned_url, hostname, host_header)
    except (UnicodeError, ValueError, OSError) as exc:
        raise ValueError("Invalid public destination") from exc


def public_source_url(url: str) -> bool:
    """Check the initial source URL before accepting a job."""
    try:
        resolve_public_destination(url)
        return True
    except ValueError:
        return False


def unreachable_ipv6_fallback(url: str, timeout: float = 2.0) -> bool:
    """Diagnose a host whose IPv6 record is published but cannot be reached.

    True only when all three hold: the name resolves to both families, a TCP
    connect to the IPv6 address fails, and a connect to the IPv4 address
    succeeds. That combination is what a VPN tunnel with a ULA interface and a
    ``::/0`` route produces, and it is the reason a download can fail or crawl
    for minutes while a browser on the same machine loads the page instantly.

    Only the first usable address per family is tried. Every address for one
    host leaves through the same route, so a single failed connect is enough
    signal, and this keeps the whole probe inside its timeout budget on a name
    that publishes a full CDN set of AAAA records.
    """
    try:
        parsed = urlsplit(url)
        host = parsed.hostname
        if not host:
            return False
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        hostname = host.encode("idna").decode("ascii")
    except (UnicodeError, ValueError):
        return False

    def published(family: int) -> list:
        try:
            answers = socket.getaddrinfo(hostname, port, family, socket.SOCK_STREAM)
        except OSError:
            return []
        usable = []
        for answer in answers:
            try:
                if ipaddress.ip_address(answer[4][0]).is_global:
                    usable.append(answer[4])
            except ValueError:
                continue
        return usable

    # Only a host that actually publishes IPv6 can be diagnosed this way. A
    # dual-stack check would otherwise report every IPv4-only host as broken.
    v6_candidates = published(socket.AF_INET6)
    v4_candidates = published(socket.AF_INET)
    if not v6_candidates or not v4_candidates:
        return False

    def reachable(candidates: list, family: int) -> bool:
        sock = socket.socket(family, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        try:
            sock.connect(candidates[0])
            return True
        except OSError:
            return False
        finally:
            sock.close()

    return not reachable(v6_candidates, socket.AF_INET6) and reachable(v4_candidates, socket.AF_INET)


_guard_lock = threading.Lock()
_guard_installed = False
_guard_active: ContextVar[bool] = ContextVar("public_network_guard_active", default=False)
_original_connect = socket.socket.connect
_original_connect_ex = socket.socket.connect_ex
_original_thread_start = threading.Thread.start
_original_executor_submit = ThreadPoolExecutor.submit


def _public_socket_address(sock: socket.socket, address: object) -> object:
    """Return a checked numeric address so DNS cannot change after validation."""
    if sock.family not in (socket.AF_INET, socket.AF_INET6):
        return address
    if not isinstance(address, tuple) or len(address) < 2:
        raise OSError("Invalid network destination")
    host, port = address[:2]
    try:
        ip = ipaddress.ip_address(host)
        if not ip.is_global:
            raise OSError("Network destination is not public")
        return address
    except ValueError:
        pass
    answers = socket.getaddrinfo(host, port, sock.family, sock.type, sock.proto)
    # Only the connectable answers decide the outcome. Rejecting the name when a
    # single answer is unroutable also rejects families that would have worked.
    public = [answer[4] for answer in answers if ipaddress.ip_address(answer[4][0]).is_global]
    if not public:
        raise OSError("Network destination is not public")
    return public[0]


def _install_socket_guard() -> None:
    global _guard_installed
    with _guard_lock:
        if _guard_installed:
            return

        # yt-dlp can hand HLS/DASH and live streams to ffmpeg or another
        # downloader subprocess. Those sockets bypass Python's socket guard.
        from yt_dlp.downloader.external import ExternalFD
        original_external_download = ExternalFD.real_download

        def guarded_connect(sock: socket.socket, address: object) -> object:
            checked = _public_socket_address(sock, address) if _guard_active.get() else address
            return _original_connect(sock, checked)

        def guarded_connect_ex(sock: socket.socket, address: object) -> int:
            checked = _public_socket_address(sock, address) if _guard_active.get() else address
            return _original_connect_ex(sock, checked)

        def guarded_thread_start(thread: threading.Thread) -> None:
            # yt-dlp starts fragment threads itself. Capture the caller's
            # guard state before the new thread begins running.
            if _guard_active.get():
                original_run = thread.run

                def run_with_guard() -> None:
                    token = _guard_active.set(True)
                    try:
                        original_run()
                    finally:
                        _guard_active.reset(token)

                thread.run = run_with_guard
            _original_thread_start(thread)

        def guarded_executor_submit(executor: ThreadPoolExecutor, fn, /, *args, **kwargs):
            # Pool workers can outlive a download or predate it. Set the flag
            # for each task, including unguarded tasks reusing a guarded worker.
            active = _guard_active.get()

            def run_with_guard():
                token = _guard_active.set(active)
                try:
                    return fn(*args, **kwargs)
                finally:
                    _guard_active.reset(token)

            return _original_executor_submit(executor, run_with_guard)

        def guarded_external_download(downloader, filename, info_dict):
            if _guard_active.get():
                raise OSError("External network downloaders are not allowed")
            return original_external_download(downloader, filename, info_dict)

        socket.socket.connect = guarded_connect
        socket.socket.connect_ex = guarded_connect_ex
        threading.Thread.start = guarded_thread_start
        ThreadPoolExecutor.submit = guarded_executor_submit
        ExternalFD.real_download = guarded_external_download
        _guard_installed = True


@contextmanager
def guarded_public_connections() -> Iterator[None]:
    """Guard yt-dlp's sockets and work it starts without affecting other jobs."""
    _install_socket_guard()
    token = _guard_active.set(True)
    try:
        yield
    finally:
        _guard_active.reset(token)
