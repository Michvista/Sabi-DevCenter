export function isValidWeekNote(note, expectedWeek) {
  return (
    note?.week === expectedWeek &&
    typeof note.summary === "string" &&
    note.summary.trim().length > 0 &&
    Array.isArray(note.citationPages) &&
    note.citationPages.length > 0 &&
    note.citationPages.every((page) => Number.isInteger(page) && page > 0)
  );
}

export function isCompleteWeekNotesCache(cache, expectedWeeks = 40) {
  return (
    Array.isArray(cache?.notes) &&
    cache.notes.length === expectedWeeks &&
    cache.notes.every((note, index) => isValidWeekNote(note, index + 1))
  );
}
