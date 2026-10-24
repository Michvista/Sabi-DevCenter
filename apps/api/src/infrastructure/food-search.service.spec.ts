import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calculatePortion,
  FoodSearchService,
  micronutrientsOnly,
  normalizeOpenFoodFactsProduct,
  parseCsv,
} from "./food-search.service";

describe("FoodSearchService", () => {
  afterEach(() => {
    delete process.env.FATSECRET_CLIENT_ID;
    delete process.env.FATSECRET_CLIENT_SECRET;
    vi.unstubAllGlobals();
  });

  it("parses quoted commas and escaped quotes in CSV fields", () => {
    expect(
      parseCsv('name,description\n"Efo riro","A leafy, peppery stew"')[0],
    ).toEqual({
      name: "Efo riro",
      description: "A leafy, peppery stew",
    });
  });

  it("calculates nutrients by measured edible portion from the WAFCT basis", () => {
    expect(
      calculatePortion({ energyKcal: 377, proteinG: 11.9, ironMg: 4.3 }, 150),
    ).toEqual({ energyKcal: 565.5, proteinG: 17.85, ironMg: 6.45 });
  });

  it("rejects invalid food serving sizes instead of inventing estimates", () => {
    expect(() => calculatePortion({ energyKcal: 100 }, 0)).toThrow(
      /between 1 and 5000/,
    );
  });

  it("searches the imported FAO/INFOODS table with measured per-100g values", async () => {
    const result = await new FoodSearchService().search("oats rolled raw");
    const match = result.foods.find(
      (food) =>
        food.source ===
        "FAO/INFOODS Western Africa Food Composition Table 2019",
    ) as { nutrients?: Record<string, number> } | undefined;
    expect(match?.nutrients?.ironMg).toBeGreaterThan(0);
    expect(match?.nutrients).not.toHaveProperty("energyKcal");
    expect(match?.nutrients).not.toHaveProperty("proteinG");
    expect(result.disclaimer).toContain("per 100 g edible portion");
    expect(result.disclaimer).toContain("per 100 g edible portion");
  });

  it("searches the supplied Nigerian food catalogue without external credentials", async () => {
    const result = await new FoodSearchService().search("egusi soup");
    expect(result.foods.length).toBeGreaterThan(1);
    expect(
      result.foods.find((food) => food.source === "Nigerian Foods CSV"),
    ).toMatchObject({
      label: expect.stringMatching(/egusi/i),
      source: "Nigerian Foods CSV",
    });
    expect(
      result.foods.find((food) => food.source === "Nigerian Foods CSV")
        ?.nutrients,
    ).toEqual({});
    expect(result.disclaimer).toContain("not nutrient measurements");
  });

  it("maps a planned Nigerian dish to its supplied ingredient list", () => {
    expect(
      new FoodSearchService().ingredientsForDish("Fufu and Egusi Soup"),
    ).toEqual(expect.arrayContaining(["egusi seeds", "meat"]));
  });

  it("returns sourced, per-100g research composition for specific Nigerian study recipes", async () => {
    const result = await new FoodSearchService().search("egusi soup");
    expect(
      result.foods.find((food) => food.id === "study-egusi-soup"),
    ).toMatchObject({
      source: "Ayogu et al. (2017), measured dish composition",
      sourceUrl: "https://journals.sagepub.com/doi/10.1177/0379572116689627",
      nutrientBasis: "per 100 g of the study recipe",
      nutrients: { fibreG: 2, ironMg: 0.7, zincMg: 0.3, vitaminARE: 8.5 },
    });
  });

  it("uses OAuth2 and returns FatSecret nutrition estimates when available", async () => {
    process.env.FATSECRET_CLIENT_ID = "client-id";
    process.env.FATSECRET_CLIENT_SECRET = "client-secret";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "access-token", expires_in: 3600 }),
          {
            status: 200,
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            foods: {
              food: {
                food_id: "42",
                food_name: "Egusi soup",
                food_description:
                  "Per 1 bowl - Calories: 250kcal | Fat: 12g | Carbs: 15g | Protein: 20g",
                food_url: "https://foods.fatsecret.com/food/42",
              },
            },
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await new FoodSearchService().search("egusi soup");
    const authRequest = fetchMock.mock.calls[0][1];
    expect(authRequest.headers.Authorization).toMatch(/^Basic /);
    expect(JSON.stringify(authRequest)).not.toContain("client-secret");
    expect(
      result.foods.find((food) => food.source === "FatSecret"),
    ).toMatchObject({
      label: "Egusi soup",
      nutrients: {},
    });
  });

  it("keeps only micronutrients in food summaries and barcode products", () => {
    expect(
      micronutrientsOnly({ energyKcal: 100, proteinG: 3, ironMg: 2 }),
    ).toEqual({ ironMg: 2 });
    expect(
      normalizeOpenFoodFactsProduct({
        product_name: "Sample cereal",
        nutriments: {
          "energy-kcal_100g": 200,
          proteins_100g: 5,
          iron_100g: 0.004,
          "vitamin-c_100g": 0.006,
          folate_100g: 0.000001,
        },
      }),
    ).toMatchObject({
      label: "Sample cereal",
      nutrients: { ironMg: 4, vitaminCMg: 6, folateMcg: 1 },
    });
  });

  it("rejects malformed barcodes before making an external request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(new FoodSearchService().lookupBarcode("123")).rejects.toThrow(
      /8–14 digit barcode/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("builds seven preference-filtered meal-idea days without nutrient claims", () => {
    const result = new FoodSearchService().suggestMealIdeas({
      week: 24,
      vegetarian: true,
      budget: "Affordable",
      avoidIngredients: ["fish"],
    });
    expect(result.ideas).toHaveLength(7);
    expect(result.ideas[0].meals).toHaveLength(3);
    expect(result.disclaimer).toContain("not a pregnancy diet prescription");
    expect(
      result.ideas
        .flatMap((day) => day.meals)
        .every(
          (meal) => !/fish|meat|beef|chicken|seafood/i.test(meal.ingredients),
        ),
    ).toBe(true);
  });

  it("keeps local dish results when FatSecret is unavailable", async () => {
    process.env.FATSECRET_CLIENT_ID = "client-id";
    process.env.FATSECRET_CLIENT_SECRET = "client-secret";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const result = await new FoodSearchService().search("moi moi");
    expect(
      result.foods.some((food) => food.source === "Nigerian Foods CSV"),
    ).toBe(true);
  });

  it("ignores FatSecret API error payloads returned with HTTP 200", async () => {
    process.env.FATSECRET_CLIENT_ID = "client-id";
    process.env.FATSECRET_CLIENT_SECRET = "client-secret";
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ access_token: "access-token", expires_in: 3600 }),
            {
              status: 200,
            },
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ error: { code: 21, message: "IP restriction" } }),
            { status: 200 },
          ),
        ),
    );
    const result = await new FoodSearchService().search("egusi soup");
    expect(result.nutritionAvailable).toBe(false);
    expect(result.sources).not.toContain("FatSecret Platform API");
    expect(
      result.foods.some((food) => food.source === "Nigerian Foods CSV"),
    ).toBe(true);
  });
});
