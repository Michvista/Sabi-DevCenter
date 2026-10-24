export type FoodLogEntry = {
  id: string;
  food: string;
  meal: string;
  note: string;
  loggedAt: string;
};

const storageKey = "sabi-food-log-v1";

export function readFoodLog(storage: Pick<Storage, "getItem"> | undefined) {
  if (!storage) return [] as FoodLogEntry[];
  try {
    const value: unknown = JSON.parse(storage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter(
      (entry): entry is FoodLogEntry =>
        !!entry &&
        typeof entry.id === "string" &&
        typeof entry.food === "string" &&
        typeof entry.meal === "string" &&
        typeof entry.note === "string" &&
        typeof entry.loggedAt === "string",
    );
  } catch {
    return [];
  }
}

export function writeFoodLog(
  storage: Pick<Storage, "setItem"> | undefined,
  entries: FoodLogEntry[],
) {
  storage?.setItem(storageKey, JSON.stringify(entries));
}

export function createFoodLogEntry(
  food: string,
  meal: string,
  note: string,
  now = new Date(),
): FoodLogEntry {
  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    food: food.trim(),
    meal,
    note: note.trim(),
    loggedAt: now.toISOString(),
  };
}
