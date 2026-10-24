"""Build expanded, page-cited weekly book notes from the local licensed PDF."""

import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[3]
SOURCE_CACHE = ROOT / "tmp/pdfs/pregnancy-week-book-source.json"
OUTPUT = ROOT / "apps/web/src/lib/data/pregnancy-week-book-notes.json"
BOOK = next(ROOT.glob("Your Pregnancy Week by Week*.pdf"), None)


def week_starts(pages: list[str]) -> dict[int, int]:
    starts: dict[int, int] = {1: 36, 2: 37}  # zero-based PDF pages 37 and 38
    for index, content in enumerate(pages):
        match = re.search(r"(?m)^\s*Week\s+(\d{1,2})\s*\n\s*Age of Fetus", content, re.I)
        if match:
            week = int(match.group(1))
            if 3 <= week <= 40:
                starts[week] = index
    missing = sorted(set(range(1, 41)) - set(starts))
    if missing:
        raise ValueError(f"Could not locate book sections for weeks: {missing}")
    return starts


def build_source(pages: list[str]) -> dict:
    starts = week_starts(pages)
    result = []
    for week in range(1, 41):
        start = starts[1] if week in (1, 2) else starts[week]
        if week in (1, 2):
            end = starts[3]
        else:
            end = starts.get(week + 1, min(start + 18, len(pages)))
        chapter_pages = [
            {"page": index + 1, "text": pages[index].strip()}
            for index in range(start, end)
            if pages[index].strip()
        ]
        if not chapter_pages:
            raise ValueError(f"The source for week {week} is empty.")
        result.append({"week": week, "pages": chapter_pages})
    return {
        "source": "Your Pregnancy Week by Week — Glade B. Curtis and Judith Schuler",
        "citationNumbering": "PDF page numbers",
        "weeks": result,
    }


def excerpt(
    pages: list[dict], start_pattern: str, end_pattern: str, max_words: int
) -> dict | None:
    start_re = re.compile(start_pattern, re.I)
    end_re = re.compile(end_pattern, re.I) if end_pattern else None
    collected: list[tuple[int, str]] = []
    active = False
    for page in pages:
        text = page["text"]
        if not active:
            match = start_re.search(text)
            if not match:
                continue
            active = True
            text = text[match.end() :]
        if end_re:
            end = end_re.search(text)
            if end:
                text = text[: end.start()]
                if text.strip():
                    collected.append((page["page"], text))
                break
        if text.strip():
            collected.append((page["page"], text))
        if len(" ".join(value for _, value in collected).split()) >= max_words:
            break

    selected: list[str] = []
    citation_pages: list[int] = []
    reached_limit = False
    for page_number, content in collected:
        normalized = re.sub(r"\s+", " ", content).strip()
        for sentence in re.split(r"(?<=[.!?])\s+", normalized):
            sentence = sentence.strip()
            if not sentence:
                continue
            current_words = sum(len(part.split()) for part in selected)
            sentence_words = len(sentence.split())
            if current_words + sentence_words > max_words:
                if not selected and sentence_words <= max_words + 18:
                    selected.append(sentence)
                    citation_pages.append(page_number)
                reached_limit = True
                break
            selected.append(sentence)
            citation_pages.append(page_number)
            if sum(len(part.split()) for part in selected) >= max_words - 8:
                break
        if reached_limit or sum(len(part.split()) for part in selected) >= max_words - 8:
            break
    if sum(len(part.split()) for part in selected) < 8:
        return None
    value = " ".join(selected).rstrip(" ,;:-")
    return {"summary": value, "citationPages": sorted(set(citation_pages))}


def build_notes(weeks: list[dict]) -> list[dict]:
    notes = []
    for week_source in weeks:
        week = week_source["week"]
        pages = week_source["pages"]
        if week == 1:
            sections = [
                {
                    "title": "Pregnancy begins",
                    **(excerpt(pages, r"Pregnancy Begins", r"Signs and Symptoms of Pregnancy", 55) or {}),
                },
                {
                    "title": "How pregnancy is dated",
                    **(excerpt(pages, r"When Is Your Baby Due\?", r"Tip for Weeks 1 & 2", 68) or {}),
                },
                {
                    "title": "Planning care and wellbeing",
                    **(excerpt(pages, r"Your Health Can Affect Your Pregnancy", r"Dad Tip", 60) or {}),
                },
            ]
        elif week == 2:
            sections = [
                {
                    "title": "How pregnancy is dated",
                    **(excerpt(pages, r"When Is Your Baby Due\?", r"Tip for Weeks 1 & 2", 68) or {}),
                },
                {
                    "title": "Understanding the menstrual cycle",
                    **(excerpt(pages, r"Your Menstrual Cycle", r"Your Health Can Affect Your Pregnancy", 60) or {}),
                },
                {
                    "title": "Planning care and wellbeing",
                    **(excerpt(pages, r"Your Health Can Affect Your Pregnancy", r"Dad Tip", 60) or {}),
                },
            ]
        else:
            sections = []
            topic_title = "Book topic"
            for title, start, end, word_limit in [
                ("Baby’s size", r"How Big Is Your Baby\?", r"How Big Are You\?", 55),
                ("Book topic", r"How Your Baby Is Growing and Developing", r"Changes in You", 78),
                ("Changes in you", r"How Big Are You\?", r"How Your Baby Is Growing and Developing", 60),
                ("Nutrition in the book", r"Your Nutrition", r"You Should Also Know", 90),
            ]:
                content = excerpt(pages, start, end, word_limit)
                if content:
                    if title == "Book topic":
                        topic_title = title_from_section(pages, start) or title
                        title = topic_title
                    sections.append({"title": title, **content})
        sections = [section for section in sections if section.get("summary")]
        if len(sections) < 2:
            raise ValueError(f"Could not extract enough cited guide sections for week {week}.")
        citations = sorted(
            {page for section in sections for page in section["citationPages"]}
        )
        notes.append(
            {
                "week": week,
                "summary": "\n\n".join(
                    f"{section['title']}: {section['summary']}" for section in sections
                ),
                "sections": sections,
                "citationPages": citations,
                "reviewStatus": "clinician-review-required",
            }
        )
    return notes


def title_from_section(pages: list[dict], start_pattern: str) -> str | None:
    start_re = re.compile(start_pattern, re.I)
    for page in pages:
        match = start_re.search(page["text"])
        if not match:
            continue
        lines = [line.strip() for line in page["text"][match.end():].splitlines() if line.strip()]
        if not lines:
            continue
        candidate = re.sub(r"\s+", " ", lines[0]).strip(" .:-")
        words = re.findall(r"[A-Za-z][A-Za-z’'-]*", candidate)
        title_case = sum(word[0].isupper() for word in words)
        if 1 <= len(words) <= 7 and title_case / len(words) >= 0.8:
            return f"Book topic: {candidate}"
        return None
    return None


def main() -> None:
    if BOOK is None:
        raise FileNotFoundError("Place the authorized pregnancy book PDF in the project root.")
    reader = PdfReader(str(BOOK))
    pages = [page.extract_text() or "" for page in reader.pages]
    if len(pages) < 511:
        raise ValueError("The supplied pregnancy PDF is incomplete or unreadable.")
    SOURCE_CACHE.parent.mkdir(parents=True, exist_ok=True)
    source = build_source(pages)
    SOURCE_CACHE.write_text(
        json.dumps(source, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    if OUTPUT.exists() and "--force" not in sys.argv:
        try:
            cached = json.loads(OUTPUT.read_text(encoding="utf-8"))
            if len(cached.get("notes", [])) == 40 and all(
                len(note.get("sections", [])) >= 2 for note in cached["notes"]
            ):
                print("All 40 expanded, cited week guides are already prepared.")
                return
        except (OSError, json.JSONDecodeError, TypeError):
            pass
    result = {
        "model": "local-pdf-extraction",
        "source": source["source"],
        "citationNumbering": source["citationNumbering"],
        "rights": "Used with permission as confirmed by the project owner.",
        "generation": "one-time source extraction; no runtime Gemini generation",
        "notes": build_notes(source["weeks"]),
    }
    OUTPUT.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print("Prepared expanded, page-cited excerpts for all 40 book weeks.")


if __name__ == "__main__":
    main()
