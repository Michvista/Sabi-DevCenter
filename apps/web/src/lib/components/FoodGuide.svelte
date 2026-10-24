<script lang="ts">
  import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
  import { HugeiconsIcon } from "@hugeicons/svelte";
  import {
    createFoodLogEntry,
    readFoodLog,
    writeFoodLog,
    type FoodLogEntry,
  } from "../data/food-log";
  import { sessionToken } from "#lib/auth/session.ts";
  import { onMount } from "svelte";
  import MealPlanner from "./MealPlanner.svelte";
  import GroceryList from "./GroceryList.svelte";
  import BarcodeScanner from "./BarcodeScanner.svelte";
  import RecipeNutrientBuilder from "./RecipeNutrientBuilder.svelte";
  import { getPregnancyWeek } from "../data/pregnancy-weeks";
  let { week = 20 }: { week?: number } = $props();

  let weekGuide = $derived(getPregnancyWeek(week));


  type Food = {
    id?: string;
    label: string;
    category?: string;
    image?: string;
    details?: string;
    source?: string;
    sourceUrl?: string;
    foodCode?: string;
    nutrientBasisGrams?: number;
    nutrientBasis?: string;
    nutrients: {
      [key: string]: number | undefined;
    };
  };

  const ideas = [
    "Egusi soup",
    "Moi moi",
    "Ugwu",
    "Tuwo",
    "Miyan kuka",
    "Ofe onugbu",
    "Afang soup",
    "Oats",
  ];
  let query = $state("");
  let foods = $state<Food[]>([]);
  let nutrientBasis = $state("");
  let disclaimer = $state("");
  let sources = $state<string[]>([]);
  let nutritionAvailable = $state(false);
  let loading = $state(false);
  let searched = $state(false);
  let error = $state("");
  let meal = $state("Breakfast");
  let servingGrams = $state(150);
  let mealNote = $state("");
  let foodLog = $state<FoodLogEntry[]>([]);
  let savedMessage = $state("");
  let barcode = $state("");
  let barcodeBusy = $state(false);
  let barcodeMessage = $state("");

  const nutrientLabels: Record<string, string> = {
    calciumMg: "Calcium",
    ironMg: "Iron",
    vitaminCMg: "Vitamin C",
    folateMcg: "Folate",
    sodiumMg: "Sodium",
    fibreG: "Fibre",
  };

  function formatNutrient(key: string, value: number) {
    const unit = key.endsWith("Mg") ? "mg" : key.endsWith("Mcg") ? "µg" : "g";
    return `${value.toFixed(1)} ${unit}`;
  }

  async function lookupBarcode() {
    barcodeBusy = true;
    barcodeMessage = "";
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/pregnancy/foods/barcode/${encodeURIComponent(barcode)}`,
      );
      const body = (await response.json()) as {
        found?: boolean;
        message?: string;
        product?: Food;
      };
      if (!response.ok)
        throw new Error(body.message ?? "Barcode lookup failed.");
      if (!body.found || !body.product) {
        barcodeMessage = body.message ?? "No product was found.";
        return;
      }
      foods = [body.product];
      searched = true;
      barcodeMessage =
        "Packaged food found. Label nutrients may be incomplete; check the physical pack.";
    } catch (cause) {
      barcodeMessage =
        cause instanceof Error
          ? cause.message
          : "Barcode lookup is unavailable.";
    } finally {
      barcodeBusy = false;
    }
  }

  onMount(() => {
    foodLog = readFoodLog(localStorage);
    void fetch(
      `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/records/meals`,
      { headers: { Authorization: `Bearer ${sessionToken()}` } },
    )
      .then((r) => (r.ok ? r.json() : []))
      .then(
        (
          items: Array<{
            id: string;
            foodName: string;
            mealType: string;
            note?: string | null;
            createdAt: string;
          }>,
        ) => {
          if (Array.isArray(items)) {
            foodLog = items.map((item) => ({
              id: item.id,
              food: item.foodName,
              meal: item.mealType,
              note: item.note ?? "",
              loggedAt: item.createdAt,
            }));
            writeFoodLog(localStorage, foodLog);
          }
        },
      )
      .catch(() => {});
  });

  function portion(food: Food) {
    const factor = food.nutrientBasisGrams
      ? servingGrams / food.nutrientBasisGrams
      : 1;
    return Object.fromEntries(
      Object.entries(food.nutrients)
        .filter(
          (item): item is [string, number] =>
            !!nutrientLabels[item[0]] && typeof item[1] === "number",
        )
        .map(([key, value]) => [key, Math.round(value * factor * 100) / 100]),
    );
  }

  async function saveFoodLog(food: Food) {
    const scaled = portion(food);
    const response = await fetch(
      `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/records/meals`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken()}`,
        },
        body: JSON.stringify({
          foodName: food.label,
          mealType: meal,
          servingGrams:
            food.source !== "FatSecret" && servingGrams > 0
              ? String(servingGrams)
              : undefined,
          nutrients: scaled,
          source: food.source ?? "No nutrition source",
          note: mealNote,
        }),
      },
    );
    if (!response.ok) {
      savedMessage = "Could not save to your account. Please try again.";
      return;
    }
    const saved = (await response.json()) as { id: string; createdAt: string };
    const entry = {
      ...createFoodLogEntry(food.label, meal, mealNote),
      id: saved.id,
      loggedAt: saved.createdAt,
    };
    foodLog = [entry, ...foodLog].slice(0, 30);
    writeFoodLog(
      typeof localStorage === "undefined" ? undefined : localStorage,
      foodLog,
    );
    mealNote = "";
    savedMessage = `${food.label} added to your account meal log.`;
  }

  async function removeFoodLog(id: string) {
    await fetch(
      `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/records/meals/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken()}` },
      },
    );
    foodLog = foodLog.filter((entry) => entry.id !== id);
    writeFoodLog(
      typeof localStorage === "undefined" ? undefined : localStorage,
      foodLog,
    );
  }

  async function searchFood(value = query) {
    const term = value.trim();
    if (term.length < 2) {
      error = "Enter a food or dish name to search.";
      return;
    }
    query = term;
    loading = true;
    searched = false;
    error = "";
    try {
      const url = new URL(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/pregnancy/foods`,
      );
      url.searchParams.set("q", term);
      const response = await fetch(url);
      const body = (await response.json()) as {
        foods?: Food[];
        nutrientBasis?: string;
        disclaimer?: string;
        sources?: string[];
        nutritionAvailable?: boolean;
        message?: string;
      };
      if (!response.ok) throw new Error(body.message || "Food search failed");
      foods = body.foods ?? [];
      nutrientBasis = body.nutrientBasis ?? "";
      disclaimer = body.disclaimer ?? "";
      sources = body.sources ?? [];
      nutritionAvailable = body.nutritionAvailable ?? false;
      searched = true;
      if (!foods.length)
        error = "No matches came back. Try another name or ingredient.";
    } catch (cause) {
      error =
        cause instanceof Error && cause.message.includes("not configured")
          ? "Nutrition lookup is being set up. Your food ideas are still here."
          : "Food lookup is unavailable right now. Please try again.";
    } finally {
      loading = false;
    }
  }
</script>

<section class="mb-8 rounded-2xl bg-white border border-[#e7e4dc] p-6 shadow-xs">
  <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
    <div class="flex items-center gap-2">
      <span class="inline-block w-2.5 h-2.5 rounded-full bg-[#af705a]"></span>
      <span class="text-xs font-bold tracking-wider text-[#af705a] uppercase">WEEK {week} NUTRITION INSIGHT</span>
    </div>
    <span class="text-xs text-[#77786f] bg-[#f4f2ec] px-2.5 py-1 rounded-full font-medium">Your Pregnancy Week by Week Guide</span>
  </div>

  <h3 class="text-xl font-serif text-[#30312c] font-semibold mb-2">
    Key Nutrients &amp; Nigerian Foods for Week {week}
  </h3>
  
  <p class="text-sm text-[#525547] leading-relaxed mb-4">
    {weekGuide.nigerianFoodTip}
  </p>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#f0ede6]">
    <div class="rounded-xl bg-[#faf9f6] p-3.5 border border-[#edeae1]">
      <div class="text-xs font-bold text-[#af705a] uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
        <span>⭐</span> Priority Nutrients
      </div>
      <div class="flex flex-wrap gap-1.5">
        {#each weekGuide.keyNutrients as nutrient}
          <span class="text-xs font-medium bg-white text-[#30312c] px-2 py-0.5 rounded-md border border-[#e2dfd5]">{nutrient}</span>
        {/each}
      </div>
    </div>

    <div class="rounded-xl bg-[#f5f8f3] p-3.5 border border-[#e0e8dc]">
      <div class="text-xs font-bold text-[#475842] uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
        <span>🍲</span> Recommended Nigerian Foods
      </div>
      <ul class="text-xs text-[#3d4b39] space-y-1">
        {#each weekGuide.recommendedFoods as foodItem}
          <li class="flex items-center gap-1.5">
            <span class="text-[#809474] font-bold">✓</span> {foodItem}
          </li>
        {/each}
      </ul>
    </div>

    <div class="rounded-xl bg-[#fdf5f3] p-3.5 border border-[#f5ded9]">
      <div class="text-xs font-bold text-[#b94a32] uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
        <span>⚠️</span> Foods / Items to Limit
      </div>
      <ul class="text-xs text-[#6e2b1d] space-y-1">
        {#each weekGuide.foodsToAvoid as avoidItem}
          <li class="flex items-center gap-1.5">
            <span class="text-[#af705a] font-bold">✕</span> {avoidItem}
          </li>
        {/each}
      </ul>
    </div>
  </div>
</section>

<section class="food-card" aria-labelledby="food-guide-title">
  <div class="food-illustration" aria-hidden="true">
    <span>🥬</span><span>🫘</span><span>🍲</span>
  </div>
  <div class="food-copy">
    <span class="food-kicker">FOOD FROM ACROSS NIGERIA</span>
    <h3 id="food-guide-title">Find what’s in your pot.</h3>
    <p>
      Log foods you eat during pregnancy and explore familiar Nigerian and West
      African ingredients. Where the FAO/INFOODS table has a match, we show its
      measured composition per 100 g edible portion; this is not a pregnancy
      diet prescription.
    </p>
    <p class="food-disclaimer">
      Pregnancy-aware food journaling, not a personal diet prescription.
      Food-composition values describe the listed food and serving basis; they
      do not determine what is right for your pregnancy. Ask your antenatal care
      team about individual nutrition or supplement needs.
    </p>
    <form
      class="food-search"
      onsubmit={(event) => {
        event.preventDefault();
        void searchFood();
      }}
    >
      <label class="visually-hidden" for="food-search-input"
        >Search a Nigerian food or ingredient</label
      >
      <input
        id="food-search-input"
        bind:value={query}
        placeholder="Try egusi, moi moi, ugwu…"
        maxlength="100"
      />
      <button type="submit" disabled={loading}>
        {loading ? "Searching…" : "Search"}
      </button>
    </form>
    <div class="food-ideas" aria-label="Popular food searches">
      {#each ideas as idea}<button
          type="button"
          onclick={() => void searchFood(idea)}>{idea}</button
        >{/each}
    </div>
    <form
      class="food-search barcode-search"
      onsubmit={(event) => {
        event.preventDefault();
        void lookupBarcode();
      }}
    >
      <label class="visually-hidden" for="food-barcode"
        >Packaged food barcode</label
      >
      <input
        id="food-barcode"
        bind:value={barcode}
        inputmode="numeric"
        autocomplete="off"
        placeholder="Or enter a product barcode"
        maxlength="14"
      />
      <button type="submit" disabled={barcodeBusy || barcode.length < 8}
        >{barcodeBusy ? "Looking up…" : "Look up barcode"}</button
      >
    </form>
    <BarcodeScanner
      onDetected={(value) => {
        barcode = value;
        void lookupBarcode();
      }}
    />
    {#if barcodeMessage}<p class="food-message" role="status">
        {barcodeMessage}
      </p>{/if}
    {#if error}<p class="food-message" role="status">{error}</p>{/if}
    {#if searched && foods.length}
      <div class="food-results" aria-live="polite">
        {#each foods as food}
          <article class="food-result">
            <div class="food-result-heading">
              {#if food.image}<img
                  src={food.image}
                  alt=""
                  loading="lazy"
                />{/if}
              <div>
                <strong>{food.label}</strong>{#if food.category}<small
                    >{food.category}</small
                  >{/if}
              </div>
            </div>
            {#if food.details}<p class="food-result-details">
                {food.details}
              </p>{/if}
            <dl>
              {#each Object.entries(food.nutrients).filter(([key, value]) => nutrientLabels[key] && typeof value === "number") as [key, value]}
                <div>
                  <dt>{nutrientLabels[key]}</dt>
                  <dd>{formatNutrient(key, value as number)}</dd>
                </div>
              {/each}
            </dl>
            {#if food.nutrientBasis || nutrientBasis}<small
                class="food-result-basis"
                >Nutrition basis · {food.nutrientBasis ?? nutrientBasis}</small
              >{/if}
            {#if food.source === "FatSecret" && food.nutrientBasis && !food.nutrientBasisGrams}<small
                class="food-result-basis"
              >
                FatSecret figures use the serving shown above. Changing grams
                will not rescale them.
              </small>{/if}
            {#if food.source}<small class="food-result-basis"
                >Source: {#if food.sourceUrl}<a
                    href={food.sourceUrl}
                    target="_blank"
                    rel="noreferrer">{food.source}</a
                  >{:else}{food.source}{/if}</small
              >{/if}
            <div class="food-log-form">
              <label>
                Portion (g)
                <input
                  type="number"
                  min="1"
                  max="5000"
                  step="1"
                  bind:value={servingGrams}
                  aria-label="Portion size in grams"
                />
              </label>
              <label>
                Meal
                <select bind:value={meal} aria-label="Meal for food log">
                  <option>Breakfast</option><option>Lunch</option><option
                    >Dinner</option
                  ><option>Snack</option>
                </select>
              </label>
              <label>
                Optional note
                <input
                  bind:value={mealNote}
                  maxlength="120"
                  placeholder="e.g. with plantain"
                />
              </label>
              <button type="button" onclick={() => void saveFoodLog(food)}
                >Add to meal log</button
              >
            </div>
          </article>
        {/each}
        {#if sources.length}<small class="food-result-basis"
            >Dish data: {sources.join(" · ")}</small
          >{/if}
        {#if !nutritionAvailable && !foods.some((food) => food.source === "Open Food Facts")}<small
            class="food-result-basis"
            >FatSecret lookup is unavailable; local reference and study-recipe
            values appear where available.</small
          >{/if}
        <p class="food-disclaimer">{disclaimer}</p>
      </div>
    {/if}
    {#if savedMessage}<p class="food-message" role="status">
        {savedMessage}
      </p>{/if}
    <aside class="food-log" aria-labelledby="food-log-title">
      <div class="food-log-heading">
        <div>
          <span class="food-kicker">YOUR FOOD JOURNAL</span>
          <h4 id="food-log-title">Meals you’ve noted</h4>
        </div>
        <small>Saved to your account · nutrient details only</small>
      </div>
      {#if foodLog.length}
        <ul>
          {#each foodLog as entry (entry.id)}
            <li>
              <div>
                <strong>{entry.food}</strong><span
                  >{entry.meal} · {new Date(
                    entry.loggedAt,
                  ).toLocaleString()}</span
                >{#if entry.note}<small>{entry.note}</small>{/if}
              </div>
              <button
                type="button"
                aria-label={`Remove ${entry.food} from meal notes`}
                onclick={() => void removeFoodLog(entry.id)}>Remove</button
              >
            </li>
          {/each}
        </ul>
      {:else}
        <p>
          When you find a food, add your measured portion here. Sabi calculates
          available nutrients from the reference values.
        </p>
      {/if}
    </aside>
    <RecipeNutrientBuilder />
    <MealPlanner pregnancyWeek={week} />
    <GroceryList />
    <a href="#learn" class="food-learn-link"
      >Explore the learning guide <HugeiconsIcon
        icon={ArrowRight01Icon}
        size={15}
      /></a
    >
  </div>
</section>
