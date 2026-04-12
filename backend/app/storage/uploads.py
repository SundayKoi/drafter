"""Team-logo upload handler.

Safety checks (defence in depth):
1. Client-declared Content-Type must be in ``ALLOWED_TYPES``.
2. Body size is capped at ``MAX_FILE_SIZE`` (Nginx also enforces 3M).
3. We sniff the first bytes and match against a known magic-number table —
   a ``.php`` renamed to ``.png`` will fail here even if Content-Type lies.
4. Filename on disk is a fresh ``nanoid`` + extension derived from the
   sniff result. The user's original filename is never used — zero path
   traversal surface.
5. Files land in an uploads volume mounted by Nginx as read-only static;
   the backend never serves them and never executes them.
"""
from __future__ import annotations

import os
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from nanoid import generate as nanoid

ALLOWED_TYPES = {"image/png", "image/jpeg", "image/webp"}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

# magic bytes -> canonical extension
MAGIC = [
    (b"\x89PNG\r\n\x1a\n", "png", "image/png"),
    (b"\xff\xd8\xff", "jpg", "image/jpeg"),
    (b"RIFF", "webp", "image/webp"),  # WebP — secondary check below
]

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "/uploads"))


def _sniff(head: bytes) -> tuple[str, str] | None:
    for magic, ext, mime in MAGIC:
        if head.startswith(magic):
            if ext == "webp" and b"WEBP" not in head[:16]:
                continue
            return ext, mime
    return None


async def save_logo(file: UploadFile) -> str:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unsupported image type")

    contents = await file.read(MAX_FILE_SIZE + 1)
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File too large")
    if not contents:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Empty file")

    sniffed = _sniff(contents[:16])
    if sniffed is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File contents are not a valid image")
    ext, actual_mime = sniffed
    if actual_mime != file.content_type:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Declared MIME does not match file contents"
        )

    logos_dir = UPLOAD_DIR / "logos"
    logos_dir.mkdir(parents=True, exist_ok=True)

    name = f"{nanoid(size=21)}.{ext}"
    out = logos_dir / name
    # Write with restrictive mode — no execute.
    with open(out, "wb") as f:
        f.write(contents)
    try:
        os.chmod(out, 0o640)
    except OSError:
        pass  # Windows dev: chmod may be a no-op

    return f"/uploads/logos/{name}"
