import { BadRequestException, Injectable } from "@nestjs/common";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type WafctFood = {
  code: string;
  name: string;
  sourceRef: string;
  nutrientsPer100g: Record<string, number>;
};

type StudiedDish = {
  id: string;
  name: string;
  details: string;
  nutrientsPer100g: Record<string, number>;
  sourceUrl: string;
};

const studiedDishes: StudiedDish[] = [
  {
    id: "study-egusi-soup",
    name: "Egusi soup (study recipe)",
    details:
      "Measured nutrient composition of a study recipe. Egusi recipes vary by ingredients, oil, water and preparation, so this is not a universal value.",
    nutrientsPer100g: {
      energyKcal: 191.8,
      proteinG: 5.5,
      fatG: 9.5,
      carbohydratesG: 21.0,
      fibreG: 2.0,
      ironMg: 0.7,
      zincMg: 0.3,
      vitaminARE: 8.5,
    },
    sourceUrl: "https://journals.sagepub.com/doi/10.1177/0379572116689627",
  },
  {
    id: "study-jollof-rice",
    name: "Jollof rice (study recipe)",
    details:
      "Measured nutrient composition of a study recipe. Rice type, oil, portion water and cooking method can change the final values.",
    nutrientsPer100g: {
      energyKcal: 143.5,
      proteinG: 2.0,
      fatG: 7.7,
      carbohydratesG: 16.6,
      fibreG: 0.2,
      ironMg: 0.4,
      zincMg: 0.2,
      vitaminARE: 5.6,
    },
    sourceUrl: "https://journals.sagepub.com/doi/10.1177/0379572116689627",
  },
  {
    id: "study-jollof-rice-beans",
    name: "Jollof rice and beans (study recipe)",
    details:
      "Measured nutrient composition of a study recipe. Bean-to-rice ratio and cooking method affect the final values.",
    nutrientsPer100g: {
      energyKcal: 137.3,
      proteinG: 2.6,
      fatG: 6.7,
      carbohydratesG: 16.7,
      fibreG: 0.3,
      ironMg: 0.8,
      zincMg: 0.2,
      vitaminARE: 6.7,
    },
    sourceUrl: "https://journals.sagepub.com/doi/10.1177/0379572116689627",
  },
];

export function calculatePortion(
  nutrientsPer100g: Record<string, number>,
  grams: number,
) {
  if (!Number.isFinite(grams) || grams <= 0 || grams > 5000)
    throw new BadRequestException(
      "Serving size must be between 1 and 5000 grams.",
    );
  const factor = grams / 100;
  return Object.fromEntries(
    Object.entries(nutrientsPer100g).map(([key, value]) => [
      key,
      Math.round(value * factor * 100) / 100,
    ]),
  );
}

const excludedEnergyAndMacros = new Set([
  "energyKcal",
  "calories",
  "proteinG",
  "carbohydratesG",
  "fatG",
]);

export function micronutrientsOnly(values: Record<string, number>) {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([name]) => !excludedEnergyAndMacros.has(name),
    ),
  );
}

export type OpenFoodFactsProduct = {
  product_name?: string;
  brands?: string;
  quantity?: string;
  ingredients_text?: string;
  image_front_small_url?: string;
  nutriments?: Record<string, number | string>;
};

export function normalizeOpenFoodFactsProduct(product: OpenFoodFactsProduct) {
  const nutriments = product.nutriments ?? {};
  const keys: Record<string, { name: string; multiplier: number }> = {
    calcium_100g: { name: "calciumMg", multiplier: 1000 },
    iron_100g: { name: "ironMg", multiplier: 1000 },
    "vitamin-c_100g": { name: "vitaminCMg", multiplier: 1000 },
    folate_100g: { name: "folateMcg", multiplier: 1_000_000 },
    sodium_100g: { name: "sodiumMg", multiplier: 1000 },
    fiber_100g: { name: "fibreG", multiplier: 1 },
  };
  const nutrients: Record<string, number> = {};
  for (const [source, target] of Object.entries(keys)) {
    const parsed = Number(nutriments[source]);
    if (Number.isFinite(parsed))
      nutrients[target.name] = parsed * target.multiplier;
  }
  return {
    label:
      [product.product_name, product.brands].filter(Boolean).join(" · ") ||
      "Packaged food",
    category: product.quantity ?? "Packaged product",
    details:
      product.ingredients_text ||
      "The product database did not provide an ingredient list.",
    image: product.image_front_small_url,
    source: "Open Food Facts",
    sourceUrl: "https://world.openfoodfacts.org/",
    nutrientBasis:
      "per 100 g as sold; nutrients shown only when provided by the label",
    nutrientBasisGrams: 100,
    nutrients: micronutrientsOnly(nutrients),
  };
}

type NigerianFoodRow = {
  Food_Name: string;
  Main_Ingredients: string;
  Description: string;
  Food_Class: string;
  Region: string;
  Spice_Level: string;
  Price_Range: string;
};

type FatSecretFood = {
  food_id?: string;
  food_name?: string;
  brand_name?: string;
  food_description?: string;
  food_url?: string;
};

type FatSecretResponse = {
  foods?: { food?: FatSecretFood | FatSecretFood[] };
  error?: { code?: string | number; message?: string };
};

type FatSecretToken = { access_token: string; expires_in: number };

/** Parses RFC 4180-style quoted CSV fields, including commas and line breaks. */
export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted && char === '"' && text[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  const [headers, ...records] = rows;
  if (!headers) return [];
  return records.map((values) =>
    Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    ),
  );
}

function parseMicronutrients(description = "") {
  const value = (label: string) => {
    const match = description.match(new RegExp(`${label}:\\s*([\\d.]+)`, "i"));
    return match ? Number(match[1]) : undefined;
  };
  return Object.fromEntries(
    Object.entries({
      calciumMg: value("Calcium"),
      ironMg: value("Iron"),
      vitaminCMg: value("Vitamin C"),
      folateMcg: value("Folate"),
      sodiumMg: value("Sodium"),
      fibreG: value("Fibre"),
    }).filter((entry): entry is [string, number] => entry[1] !== undefined),
  );
}

@Injectable()
export class FoodSearchService {
  private cachedToken: FatSecretToken | null = null;
  private tokenExpiresAt = 0;

  private localFoods(): NigerianFoodRow[] {
    const path = resolve(__dirname, "../data/nigerian-foods.csv");
    if (!existsSync(path)) return [];
    const records = parseCsv(readFileSync(path, "utf8"));
    return records.map((record) => ({
      Food_Name: record.Food_Name ?? "",
      Main_Ingredients: record.Main_Ingredients ?? "",
      Description: record.Description ?? "",
      Food_Class: record.Food_Class ?? "",
      Region: record.Region ?? "",
      Spice_Level: record.Spice_Level ?? "",
      Price_Range: record.Price_Range ?? "",
    }));
  }

  private wafctFoods(): WafctFood[] {
    const path = resolve(__dirname, "../data/wafct-foods.json");
    if (!existsSync(path)) return [];
    try {
      return JSON.parse(readFileSync(path, "utf8")) as WafctFood[];
    } catch {
      return [];
    }
  }

  portion(code: string, grams: number) {
    const food = this.wafctFoods().find((item) => item.code === code);
    if (!food)
      throw new BadRequestException(
        "Food item was not found in the FAO/INFOODS table.",
      );
    return {
      code,
      name: food.name,
      servingGrams: grams,
      nutrients: micronutrientsOnly(
        calculatePortion(food.nutrientsPer100g, grams),
      ),
      basis: "Calculated from values per 100 g edible portion",
      source: "FAO/INFOODS Western Africa Food Composition Table 2019",
      sourceRef: food.sourceRef,
    };
  }

  ingredientsForDish(dishName: string): string[] {
    const normalize = (value: string) =>
      value
        .replace(/\([^)]*\)/g, "")
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

    const stapleMap: Record<string, string[]> = {
      beans: ["Brown beans", "Onions", "Palm oil", "Crayfish"],
      plantain: ["Plantains"],
      "boiled plantain": ["Plantains"],
      "fried plantain": ["Plantains", "Vegetable oil"],
      dodo: ["Plantains", "Vegetable oil"],
      eba: ["Garri (cassava flakes)"],
      garri: ["Garri"],
      orange: ["Fresh oranges"],
      oranges: ["Fresh oranges"],
      groundnuts: ["Roasted groundnuts"],
      peanuts: ["Groundnuts"],
      pap: ["Fermented corn (ogi)", "Milk"],
      ogi: ["Ogi (fermented corn)", "Milk"],
      akara: ["Brown beans", "Vegetable oil", "Peppers", "Onions"],
      "moi moi": ["Black-eyed beans", "Bell peppers", "Onions", "Vegetable oil"],
      moimoi: ["Black-eyed beans", "Bell peppers", "Onions", "Vegetable oil"],
      yam: ["White yam tuber"],
      "boiled yam": ["White yam tuber"],
      "yam porridge": ["White yam", "Palm oil", "Ugu leaves", "Smoked fish"],
      asaro: ["White yam", "Palm oil", "Ugu leaves", "Smoked fish"],
      rice: ["Rice", "Tomatoes", "Onions", "Vegetable oil"],
      jollof: ["Rice", "Tomatoes", "Red bell peppers", "Onions", "Vegetable oil"],
      "fried rice": ["Rice", "Carrots", "Green peas", "Chicken breast", "Sweet corn"],
      "efo riro": ["Spinach or Shoko/Tete", "Palm oil", "Locust beans (iru)", "Peppers", "Fish or meat"],
      egusi: ["Melon seeds (egusi)", "Ugu leaves", "Palm oil", "Smoked fish", "Crayfish"],
      okro: ["Fresh okra", "Palm oil", "Crayfish", "Fish or meat"],
      ogbono: ["Ogbono seeds", "Ugu leaves", "Palm oil", "Crayfish", "Assorted meat"],
      "miyan kuka": ["Baobab leaf powder (kuka)", "Beef", "Dried fish", "Locust beans (dawadawa)", "Palm oil"],
      tuwo: ["Rice flour or maize flour"],
      "tuwo shinkafa": ["Mashed white rice"],
      "tuwo masara": ["Maize flour"],
      peppersoup: ["Catfish or goat meat", "Peppersoup spices", "Scent leaves", "Chili peppers"],
      catfish: ["Fresh catfish"],
      tilapia: ["Fresh tilapia fish"],
      croaker: ["Croaker fish"],
      chicken: ["Chicken"],
      beef: ["Beef"],
      goat: ["Goat meat"],
      egg: ["Eggs"],
      eggs: ["Eggs"],
      avocado: ["Avocado pears"],
      banana: ["Bananas"],
      watermelon: ["Watermelon"],
      pawpaw: ["Ripe pawpaw (papaya)"],
      oatmeal: ["Rolled oats", "Milk"],
      oats: ["Rolled oats", "Milk"],
      custard: ["Custard powder", "Milk"],
      bread: ["Whole wheat bread", "Butter"],
    };

    // Split compound dishes like "Ogi with moi moi", "Beans and boiled plantain", "Orange and groundnuts"
    const subDishParts = dishName
      .split(/\s+(?:with|and|&|\+)\s+|,/i)
      .map((part) => part.trim())
      .filter(Boolean);

    const gatheredIngredients: string[] = [];

    for (const part of subDishParts.length ? subDishParts : [dishName]) {
      const normalizedPart = normalize(part);
      let matchedStaple = false;

      for (const [key, ingredients] of Object.entries(stapleMap)) {
        if (
          normalizedPart === key ||
          normalizedPart.includes(key) ||
          key.includes(normalizedPart)
        ) {
          gatheredIngredients.push(...ingredients);
          matchedStaple = true;
          break;
        }
      }

      if (matchedStaple) continue;

      const row = this.localFoods()
        .map((food) => ({ food, name: normalize(food.Food_Name) }))
        .filter(
          ({ name }) =>
            name &&
            (name === normalizedPart ||
              name.includes(normalizedPart) ||
              normalizedPart.includes(name)),
        )
        .sort((left, right) => right.name.length - left.name.length)[0]?.food;

      if (row?.Main_Ingredients) {
        const ingredients: string[] = [];
        let ingredient = "";
        let nested = 0;
        for (const character of row.Main_Ingredients) {
          if (character === "(") nested += 1;
          if (character === ")") nested = Math.max(0, nested - 1);
          if ((character === "," || character === ";") && nested === 0) {
            if (ingredient.trim()) ingredients.push(ingredient.trim());
            ingredient = "";
          } else {
            ingredient += character;
          }
        }
        if (ingredient.trim()) ingredients.push(ingredient.trim());
        gatheredIngredients.push(...ingredients);
      } else {
        gatheredIngredients.push(part);
      }
    }

    return [
      ...new Set(
        gatheredIngredients
          .map((ingredient) => ingredient.trim())
          .filter(Boolean),
      ),
    ];
  }

  suggestMealIdeas(options: {
    region?: string;
    budget?: string;
    vegetarian?: boolean;
    avoidIngredients?: string[];
    week: number;
  }) {
    const avoid = (options.avoidIngredients ?? [])
      .map((item) => item.trim().toLocaleLowerCase())
      .filter(Boolean);
    const animalFoods =
      /\b(fish|meat|beef|chicken|turkey|pork|goat|prawn|shrimp|crayfish|seafood|snail|egg)\b/i;
    const region = options.region?.toLocaleLowerCase();
    const regionAliases: Record<string, string[]> = {
      north: ["north", "northern"],
      "south-east": ["south-east", "eastern"],
      "south-south": ["south-south", "southern", "south"],
      "south-west": ["south-west", "southwestern", "lagos", "west"],
    };
    const matches = this.localFoods().filter((food) => {
      const ingredients = food.Main_Ingredients.toLocaleLowerCase();
      const name = food.Food_Name.toLocaleLowerCase();
      const foodRegion = food.Region.toLocaleLowerCase();
      const regionMatches = (
        regionAliases[region ?? ""] ?? [region ?? ""]
      ).some((alias) => alias && foodRegion.includes(alias));
      if (
        region &&
        region !== "any" &&
        !regionMatches &&
        foodRegion !== "nationwide"
      )
        return false;
      if (
        options.budget === "Affordable" &&
        food.Price_Range.toLocaleLowerCase() !== "affordable"
      )
        return false;
      if (options.vegetarian && animalFoods.test(`${name} ${ingredients}`))
        return false;
      if (
        avoid.some((item) => ingredients.includes(item) || name.includes(item))
      )
        return false;
      return true;
    });
    const unique = [
      ...new Map(matches.map((food) => [food.Food_Name, food])).values(),
    ];
    if (unique.length < 6)
      return {
        ideas: [],
        message:
          "There are not enough catalogue matches for these preferences. Try broadening your region, budget or exclusions.",
      };
    const start = (options.week * 7) % unique.length;
    const ideas = Array.from({ length: 7 }, (_, day) => ({
      day: day + 1,
      meals: ["Breakfast", "Lunch", "Dinner"].map((mealType, slot) => {
        const food = unique[(start + day * 3 + slot) % unique.length];
        return {
          mealType,
          dishName: food.Food_Name,
          ingredients: food.Main_Ingredients,
          region: food.Region,
          source:
            "Project-supplied Nigerian food catalogue; ingredients are unverified and nutrient quantities are not measured",
        };
      }),
    }));
    return {
      week: options.week,
      trimester:
        options.week < 14
          ? "First trimester"
          : options.week < 28
            ? "Second trimester"
            : "Third trimester",
      ideas,
      disclaimer:
        "These are preference-filtered meal ideas, not a pregnancy diet prescription. The source catalogue may have incomplete ingredient information and does not measure dish nutrients or quantities. Check ingredients and food-safety needs with your antenatal clinician; do not use this list to manage allergies or medical conditions.",
    };
  }

  private async getAccessToken() {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedToken.access_token;
    }
    const clientId = process.env.FATSECRET_CLIENT_ID;
    const clientSecret = process.env.FATSECRET_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    const response = await fetch("https://oauth.fatsecret.com/connect/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "basic",
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error("FatSecret authentication failed");
    this.cachedToken = (await response.json()) as FatSecretToken;
    this.tokenExpiresAt =
      Date.now() + Math.max(0, this.cachedToken.expires_in - 60) * 1000;
    return this.cachedToken.access_token;
  }

  async search(query: string) {
    const normalized = query.trim().toLocaleLowerCase();
    const words = normalized.split(/\s+/).filter(Boolean);
    const localFoods = this.localFoods()
      .filter((food) => {
        const haystack =
          `${food.Food_Name} ${food.Main_Ingredients} ${food.Description} ${food.Region}`.toLocaleLowerCase();
        return words.every((word) => haystack.includes(word));
      })
      .slice(0, 8)
      .map((food) => ({
        id: `ng-${food.Food_Name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        label: food.Food_Name,
        category: `${food.Food_Class} · ${food.Region}`,
        details: `${food.Description} Ingredients: ${food.Main_Ingredients}. Spice: ${food.Spice_Level}. Typical cost: ${food.Price_Range}.`,
        source: "Nigerian Foods CSV",
        nutrients: {},
      }));

    const studiedFoods = studiedDishes
      .filter((food) =>
        words.every((word) => food.name.toLocaleLowerCase().includes(word)),
      )
      .map((food) => ({
        id: food.id,
        label: food.name,
        category: "Research-measured Nigerian dish",
        details: food.details,
        source: "Ayogu et al. (2017), measured dish composition",
        sourceUrl: food.sourceUrl,
        nutrients: micronutrientsOnly(food.nutrientsPer100g),
        nutrientBasis: "per 100 g of the study recipe",
        nutrientBasisGrams: 100,
      }));

    const wafctFoods = this.wafctFoods()
      .filter((food) =>
        words.every((word) => food.name.toLocaleLowerCase().includes(word)),
      )
      .slice(0, 8)
      .map((food) => ({
        id: food.code,
        label: food.name.replace(/\*$/, ""),
        category: "FAO/INFOODS · Western Africa",
        details: `Food code ${food.code}${food.sourceRef ? `. Table source: ${food.sourceRef}.` : "."}`,
        source: "FAO/INFOODS Western Africa Food Composition Table 2019",
        nutrients: micronutrientsOnly(food.nutrientsPer100g),
        nutrientBasis: "per 100 g edible portion",
        nutrientBasisGrams: 100,
        foodCode: food.code,
      }));

    let nutritionFoods: Array<Record<string, unknown>> = [];
    let nutritionAvailable = false;
    try {
      const token = await this.getAccessToken();
      if (token) {
        const params = new URLSearchParams({
          method: "foods.search",
          search_expression: query,
          max_results: "8",
          format: "json",
        });
        const response = await fetch(
          "https://platform.fatsecret.com/rest/server.api",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
            },
            body: params,
            signal: AbortSignal.timeout(10_000),
          },
        );
        if (!response.ok) throw new Error("FatSecret food search failed");
        const result = (await response.json()) as FatSecretResponse;
        if (result.error) throw new Error("FatSecret rejected the API request");
        const found = result.foods?.food;
        nutritionFoods = (
          Array.isArray(found) ? found : found ? [found] : []
        ).map((food) => ({
          id: food.food_id,
          label: [food.food_name, food.brand_name].filter(Boolean).join(" · "),
          details:
            food.food_description ??
            "Nutrition details were not returned for this result.",
          source: "FatSecret",
          sourceUrl: food.food_url,
          nutrientBasis: food.food_description
            ?.match(/^Per\s+([^–-]+?)(?:\s+-|$)/i)?.[1]
            ?.trim(),
          nutrients: parseMicronutrients(food.food_description),
        }));
        nutritionAvailable = true;
      }
    } catch {
      // Keep the local Nigerian-food catalogue usable during API outages or scope restrictions.
    }

    return {
      foods: [...studiedFoods, ...wafctFoods, ...localFoods, ...nutritionFoods],
      sources: [
        "FAO/INFOODS Western Africa Food Composition Table 2019",
        "Nigerian Foods dataset supplied with this project",
        ...(studiedFoods.length
          ? ["Ayogu et al. (2017), measured Nigerian dish composition"]
          : []),
        ...(nutritionAvailable ? ["FatSecret Platform API"] : []),
      ],
      nutritionAvailable,
      disclaimer:
        "Pregnancy-aware food journaling only: this does not assess whether a meal is suitable for your individual pregnancy. WAFCT values are per 100 g edible portion and may describe foods from across Western Africa, not necessarily a Nigerian recipe. Research-measured dish values describe the specific study recipe and can differ from your own preparation. Scale measured portions only. Local dish descriptions are not nutrient measurements; FatSecret values can refer to a different serving or recipe. Ask your antenatal clinician about personal nutrition needs.",
    };
  }

  async lookupBarcode(code: string) {
    const normalized = code.replace(/\s/g, "");
    if (!/^\d{8,14}$/.test(normalized))
      throw new BadRequestException("Enter a valid 8–14 digit barcode.");
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${normalized}.json?fields=status,product_name,brands,quantity,ingredients_text,image_front_small_url,nutriments`,
      {
        headers: { "User-Agent": "Sabi/0.1 (maternal-health-companion)" },
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!response.ok) throw new Error("Packaged-food lookup is unavailable.");
    const result = (await response.json()) as {
      status?: number;
      product?: OpenFoodFactsProduct;
    };
    if (result.status !== 1 || !result.product)
      return {
        found: false,
        message:
          "This barcode is not in the community database. You can still add the product by name.",
      };
    return {
      found: true,
      product: normalizeOpenFoodFactsProduct(result.product),
    };
  }
}
