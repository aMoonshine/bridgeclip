"""User-approved YouTube cookies, passed in memory by the desktop app."""
import json
import os
import shutil
import logging

from http.cookiejar import Cookie

logger = logging.getLogger(__name__)


def session_data():
    raw = os.environ.get("BRIDGECLIP_YOUTUBE_SESSION")
    if not raw:
        return {}
    try:
        data = json.loads(raw)
        return data if isinstance(data, dict) else {}
    except (ValueError, TypeError):
        return {}


def extraction_options():
    """Use the bundled Node runtime and cookie-capable YouTube clients."""
    options = {}
    node = shutil.which("node")
    if node:
        options["js_runtimes"] = {"node": {"path": node}}
    if session_data().get("cookies"):
        # yt-dlp #17389: authenticated TV client can return "page needs reload".
        options["extractor_args"] = {"youtube": {
            "player_client": ["default", "web_embedded", "-tv_downgraded"]}}
    return options


def apply_session(ydl):
    count = 0
    for entry in session_data().get("cookies", []):
        domain = entry.get("domain", "")
        if domain != "youtube.com" and not domain.endswith(".youtube.com"):
            continue
        ydl.cookiejar.set_cookie(Cookie(
            version=0, name=entry["name"], value=entry["value"], port=None,
            port_specified=False, domain=domain, domain_specified=domain.startswith("."),
            domain_initial_dot=domain.startswith("."), path=entry.get("path", "/"),
            path_specified=True, secure=entry.get("secure", True),
            expires=int(entry["expirationDate"]) if entry.get("expirationDate") else None,
            discard=entry.get("session", False), comment=None, comment_url=None,
            rest={"HttpOnly": None} if entry.get("httpOnly") else {}, rfc2109=False))

        count += 1
    logger.info("YouTube saved cookies applied: %d", count)
