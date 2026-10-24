import { describe, expect, it } from "vitest";
import {
  createFoodLogEntry,
  readFoodLog,
  writeFoodLog,
  type FoodLogEntry,
} from "./food-log";

describe("food log storage", () => {
  it("reads valid entries and ignores malformed records", () => {
    const good: FoodLogEntry = {
      id: "1",
      food: "Moi moi",
      meal: "Lunch",
      note: "",
      loggedAt: "2026-10-18T10:00:00.000Z",
    };
    const storage = {
      getItem: () => JSON.stringify([good, { id: 2 }, null]),
    };
    expect(readFoodLog(storage)).toEqual([good]);
  });

  it("handles unavailable and invalid storage data safely", () => {
    expect(readFoodLog(undefined)).toEqual([]);
    expect(readFoodLog({ getItem: () => "{" })).toEqual([]);
  });

  it("creates and saves a trimmed entry", () => {
    const entry = createFoodLogEntry(
      "  Egusi soup ",
      "Dinner",
      "  With pounded yam ",
      new Date("2026-10-18T10:00:00.000Z"),
    );
    const saved: Record<string, string> = {};
    writeFoodLog({ setItem: (key, value) => (saved[key] = value) }, [entry]);
    expect(entry.food).toBe("Egusi soup");
    expect(entry.note).toBe("With pounded yam");
    expect(JSON.parse(Object.values(saved)[0])).toEqual([entry]);
  });
});
