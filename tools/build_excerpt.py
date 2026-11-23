#!/usr/bin/env python3
"""Turn a manuscript into a reader excerpt for the site.

Usage:
  python tools/build_excerpt.py MANUSCRIPT --slug trigger --start "Prologue" --end "2"

MANUSCRIPT can be a .docx (needs: pip install python-docx) or a .txt file
with paragraphs separated by blank lines.

--start  text of the first paragraph to include (e.g. "Prologue")
--end    text of the first paragraph to EXCLUDE (e.g. "2" = stop before chapter 2)

Writes excerpts/<slug>.js, which the reader loads automatically.
Paragraph types are detected from the text:
  "Prologue" / "Epilogue"        -> chapter title
  a bare number like "1"          -> chapter number
  lines starting NOW/AFTER/BEFORE -> section header (POV, place, date)
  everything else                 -> body paragraph
"""
import argparse, json, re, sys
from pathlib import Path


def read_paragraphs(path: Path):
    if path.suffix.lower() == ".docx":
        try:
            import docx  # python-docx
        except ImportError:
            sys.exit("Install python-docx first:  pip install python-docx")
        return [p.text.strip() for p in docx.Document(str(path)).paragraphs if p.text.strip()]
    text = path.read_text(encoding="utf-8")
    return [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]


def classify(p: str):
    if p in ("Prologue", "Epilogue"):
        return {"t": "title", "x": p}
    if re.fullmatch(r"\d{1,3}", p):
        return {"t": "num", "x": p}
    if re.match(r"^(NOW|AFTER|BEFORE)\b", p):
        return {"t": "sub", "x": p}
    return {"t": "p", "x": p}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("manuscript")
    ap.add_argument("--slug", required=True)
    ap.add_argument("--start", required=True)
    ap.add_argument("--end", required=True)
    a = ap.parse_args()

    paras = read_paragraphs(Path(a.manuscript))
    try:
        i = paras.index(a.start)
    except ValueError:
        sys.exit(f'Start paragraph "{a.start}" not found')
    try:
        j = paras.index(a.end, i + 1)
    except ValueError:
        sys.exit(f'End paragraph "{a.end}" not found after start')

    blocks = [classify(p) for p in paras[i:j]]
    words = sum(len(b["x"].split()) for b in blocks)
    out = Path(__file__).resolve().parent.parent / "excerpts" / f"{a.slug}.js"
    out.write_text(
        "window.HALCYON_EXCERPTS = window.HALCYON_EXCERPTS || {};\n"
        f"window.HALCYON_EXCERPTS[{json.dumps(a.slug)}] = "
        + json.dumps(blocks, ensure_ascii=False, indent=0)
        + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {out} — {len(blocks)} paragraphs, {words:,} words")


if __name__ == "__main__":
    main()
