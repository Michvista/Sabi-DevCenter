"""Build a one-time, page-cited excerpt cache from the locally supplied book."""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUTPUT = ROOT / "apps/web/src/lib/data/pregnancy-week-book-notes.json"
BOOK = next(ROOT.glob("Your Pregnancy Week by Week*.pdf"), None)


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\u00ad", "").strip())


def chapter_page(pages: list[str], week: int) -> int:
    if week == 1:
        return 37
    if week == 2:
        return 38
    pattern = re.compile(rf"(?m)^\s*Week\s+{week}\s*\n\s*Age of Fetus", re.I)
    for page_number, content in enumerate(pages, start=1):
        if pattern.search(content):
            return page_number
    raise ValueError(f"Could not match week {week} to a chapter page.")


def excerpt_for_week(content: str, week: int) -> str:
    if week == 1:
        match = re.search(
            r"Pregnancy Begins\s+(.+?)(?=Material in this book|$)", content, re.I | re.S
        )
    elif week == 2:
        match = re.search(
            r"When Is Your Baby Due\?\s+(.+?)(?=Tip for Weeks 1\s*&\s*2|$)",
            content,
            re.I | re.S,
        )
    else:
        match = re.search(
            r"How Big Is Your Baby\?\s+(.+?)(?=How Big Are You\?|$)",
            content,
            re.I | re.S,
        )
    if not match:
        raise ValueError(f"Could not find the cited passage for week {week}.")

    sentences = re.split(r"(?<=[.!?])\s+", clean_text(match.group(1)))
    selected: list[str] = []
    for sentence in sentences:
        if len(" ".join(selected + [sentence]).split()) > 35:
            if not selected:
                words = sentence.split()
                return " ".join(words[:35]).rstrip(" ,;:-") + "…"
            break
        selected.append(sentence)
        if len(selected) == 2:
            break
    if not selected:
        raise ValueError(f"The cited passage for week {week} is empty.")
    return " ".join(selected)


def build_notes(pages: list[str]) -> list[dict]:
    if len(pages) < 511:
        raise ValueError("The supplied pregnancy PDF is incomplete or unreadable.")
    notes = []
    for week in range(1, 41):
        page_number = chapter_page(pages, week)
        notes.append(
            {
                "week": week,
                "summary": excerpt_for_week(pages[page_number - 1], week),
                "citationPages": [page_number],
                "reviewStatus": "clinician-review-required",
            }
        )
    return notes


def main() -> None:
    if BOOK is None:
        raise FileNotFoundError("Place the authorized pregnancy book PDF in the project root.")
    if OUTPUT.exists() and "--force" not in sys.argv:
        try:
            cached = json.loads(OUTPUT.read_text(encoding="utf-8"))
            if len(cached.get("notes", [])) == 40 and all(
                note.get("citationPages") for note in cached["notes"]
            ):
                print("All 40 cited book excerpts are already cached in the site.")
                return
        except (OSError, json.JSONDecodeError, TypeError):
            pass

    from pypdf import PdfReader

    reader = PdfReader(str(BOOK))
    pages = [page.extract_text() or "" for page in reader.pages]
    result = {
        "model": "local-pdf-extraction",
        "source": "Your Pregnancy Week by Week — Glade B. Curtis and Judith Schuler",
        "citationNumbering": "PDF page numbers",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "notes": build_notes(pages),
    }
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Cached 40 source excerpts with their exact PDF page citations.")


if __name__ == "__main__":
    main()
