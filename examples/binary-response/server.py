"""Локальный HTTP-стенд PostMegaMan. Только стандартная библиотека Python 3."""
import argparse
import base64
import hashlib
import io
import json
from pathlib import Path
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import zipfile


def fixtures():
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 160] "
        b"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    content = b"BT /F1 18 Tf 30 90 Td (PostMegaMan binary response) Tj ET"
    objects.append(b"<< /Length %d >>\nstream\n" % len(content) + content + b"\nendstream")
    pdf, offsets = b"%PDF-1.4\n", [0]
    for index, obj in enumerate(objects, 1):
        offsets.append(len(pdf))
        pdf += b"%d 0 obj\n" % index + obj + b"\nendobj\n"
    xref = len(pdf)
    pdf += b"xref\n0 6\n0000000000 65535 f \n"
    pdf += b"".join(b"%010d 00000 n \n" % pos for pos in offsets[1:])
    pdf += b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % xref
    png = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    )
    zipped = io.BytesIO()
    with zipfile.ZipFile(zipped, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        info = zipfile.ZipInfo("example.txt", date_time=(2026, 10, 24, 0, 0, 0))
        archive.writestr(info, "PostMegaMan: точное сохранение байтов\n".encode())
    return pdf, png, zipped.getvalue()


PDF, PNG, ZIP = fixtures()
CASES = {
    "pdf": (200, "application/pdf", PDF, 'attachment; filename="report.pdf"'),
    "png": (200, "Image/PNG; name=test.png", PNG, ""),
    "zip": (200, "application/zip", ZIP, 'attachment; filename="archive.zip"'),
    "png-no-type": (200, None, PNG, ""),
    "pdf-no-type": (200, None, PDF, ""),
    "pdf-text": (200, "text/plain", PDF, ""),
    "png-text": (200, "text/plain", PNG, ""),
    "pdf-error": (500, "application/pdf", PDF, ""),
    "octet": (200, "application/octet-stream", b"printable binary", ""),
    "unknown": (200, "application/x-postmegaman-test", b"ab\x00cd\x01", ""),
    "jpeg": (200, "image/jpeg", b"\xff\xd8\xff\xe0signature-test", ""),
    "gif": (200, "application/octet-stream", b"GIF89asignature-test", ""),
    "short": (200, "application/octet-stream", b"P", ""),
    "json.pdf": (200, "application/problem+json; charset=utf-8", '{"ok":true,"text":"Привет"}'.encode(), ""),
    "xml": (200, "application/xml; charset=utf-8", "<answer>Привет</answer>".encode(), ""),
    "svg": (200, "image/svg+xml", b'<svg xmlns="http://www.w3.org/2000/svg"/>', ""),
    "cp1251": (200, "text/plain; charset=windows-1251", "Привет, мир!".encode("cp1251"), ""),
    "utf16": (200, None, "Привет UTF-16".encode("utf-16"), ""),
    "utf32": (200, None, "Привет UTF-32".encode("utf-32"), ""),
    "bad-charset": (200, "text/plain; charset=postmegaman-invalid", b"undecodable encoding", ""),
    "utf8-bom": (200, "text/plain", "Привет UTF-8".encode("utf-8-sig"), ""),
    "attachment-text": (200, "text/plain", b"text attachment", 'attachment; filename="note.pdf"'),
    "empty": (200, "application/pdf", b"", ""),
    "204": (204, "application/pdf", b"", ""),
    "304": (304, "application/pdf", b"", ""),
    "utf8-name": (200, "application/pdf", PDF, "attachment; filename=plain.pdf; filename*=UTF-8''%D0%9E%D1%82%D1%87%D0%B5%D1%82%20%D1%82%D0%B5%D1%81%D1%82.pdf"),
    "bad-name": (200, "application/pdf", PDF, "attachment; filename=ordinary.pdf; filename*=UTF-8''%GG"),
    "path-name": (200, "application/pdf", PDF, 'attachment; filename="../../bad.exe"'),
    "large": (200, "application/pdf", PDF + b"\x00" * (16 * 1024 * 1024), ""),
    "jwt": (200, "application/json", b'{"access_token":"fixture-token"}', ""),
}
COUNTERS = {}
LOCK = threading.Lock()


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        name = self.path.split("?", 1)[0].strip("/")
        if name == "counters":
            with LOCK:
                body = json.dumps(COUNTERS, ensure_ascii=False).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
        elif name in CASES:
            status, mime, body, disposition = CASES[name]
            with LOCK:
                COUNTERS[name] = COUNTERS.get(name, 0) + 1
            self.send_response(status)
            if mime:
                self.send_header("cOnTeNt-TyPe", mime)
            if disposition:
                self.send_header("Content-Disposition", disposition)
        else:
            body = b"unknown fixture"
            self.send_response(404)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    do_HEAD = do_GET
    do_POST = do_GET

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=18763)
    parser.add_argument("--fixtures", type=Path, help="Каталог для эталонов и SHA-256")
    args = parser.parse_args()
    if args.fixtures:
        args.fixtures.mkdir(parents=True, exist_ok=True)
        for name, body in {"response.pdf": PDF, "response.png": PNG, "response.zip": ZIP}.items():
            (args.fixtures / name).write_bytes(body)
        manifest = {name: {"bytes": len(case[2]), "sha256": hashlib.sha256(case[2]).hexdigest()}
                    for name, case in CASES.items()}
        (args.fixtures / "SHA256.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"PostMegaMan fixture: http://127.0.0.1:{args.port}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", args.port), Handler).serve_forever()
