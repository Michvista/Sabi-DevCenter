<script lang="ts">
  import {
    createFoodLogEntry,
    readFoodLog,
    writeFoodLog,
    type FoodLogEntry,
  } from "../data/food-log";
  import { sessionToken } from "#lib/auth/session.ts";
  import { onMount } from "svelte";
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

<section class="mb-8 rounded-3xl bg-linear-to-br from-[#f8faf7] via-[#ffffff] to-[#f4f7f2] border border-[#dce8d9] p-6 sm:p-8 shadow-xs">
  <!-- Banner Top Header -->
  <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#809474]/15 border border-[#809474]/30">
      <i class="iconoir-sparks text-xs text-[#475842]"></i>
      <span class="text-xs font-bold tracking-wider text-[#475842] uppercase">WEEK {week} NUTRITION GUIDE</span>
    </div>
    <span class="text-xs text-[#525547] bg-white border border-[#e2ded5] px-3 py-1 rounded-full font-medium shadow-2xs">
      From <em>Your Pregnancy Week by Week</em> (Curtis &amp; Schuler)
    </span>
  </div>

  <!-- Hero Headline & Excerpt -->
  <div class="max-w-3xl mb-6">
    <h3 class="text-2xl sm:text-3xl font-serif text-[#242b22] font-semibold mb-3">
      Fueling Baby &amp; Mother at Week {week}
    </h3>
    <p class="text-base text-[#475244] leading-relaxed">
      {weekGuide.nigerianFoodTip}
    </p>
  </div>

  <!-- 3 Eggify-style Curated Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 border-t border-[#e5edd4]">
    <!-- Card 1: Priority Nutrients -->
    <div class="rounded-2xl bg-white p-5 border border-[#e1e9de] shadow-2xs hover:shadow-xs transition-shadow">
      <div class="w-9 h-9 rounded-xl bg-[#af705a]/10 flex items-center justify-center mb-3">
        <i class="iconoir-star text-lg text-[#af705a]"></i>
      </div>
      <h4 class="text-xs font-bold text-[#af705a] uppercase tracking-wider mb-2">Priority Nutrients</h4>
      <p class="text-xs text-[#72756a] mb-3">Key micronutrients baby requires right now for healthy development.</p>
      <div class="flex flex-wrap gap-1.5">
        {#each weekGuide.keyNutrients as nutrient}
          <span class="text-xs font-semibold bg-[#faf8f5] text-[#30312c] px-2.5 py-1 rounded-lg border border-[#e7e3d8]">
            {nutrient}
          </span>
        {/each}
      </div>
    </div>

    <!-- Card 2: Recommended Nigerian Foods -->
    <div class="rounded-2xl bg-white p-5 border border-[#d6e5d2] shadow-2xs hover:shadow-xs transition-shadow">
      <div class="w-9 h-9 rounded-xl bg-[#809474]/15 flex items-center justify-center mb-3">
        <i class="iconoir-apple-half text-lg text-[#385a38]"></i>
      </div>
      <h4 class="text-xs font-bold text-[#385a38] uppercase tracking-wider mb-2">Recommended Dishes</h4>
      <p class="text-xs text-[#72756a] mb-3">Familiar, readily available meals packed with this week's nutrients.</p>
      <ul class="text-xs text-[#2e3b2c] space-y-2">
        {#each weekGuide.recommendedFoods as foodItem}
          <li class="flex items-start gap-2">
            <span class="text-[#475842] font-bold text-sm leading-none mt-0.5">✓</span>
            <span class="font-medium">{foodItem}</span>
          </li>
        {/each}
      </ul>
    </div>

    <!-- Card 3: Items to Limit or Avoid -->
    <div class="rounded-2xl bg-white p-5 border border-[#f5ded9] shadow-2xs hover:shadow-xs transition-shadow">
      <div class="w-9 h-9 rounded-xl bg-[#b94a32]/10 flex items-center justify-center mb-3">
        <i class="iconoir-warning-triangle text-lg text-[#b94a32]"></i>
      </div>
      <h4 class="text-xs font-bold text-[#b94a32] uppercase tracking-wider mb-2">Limit or Avoid</h4>
      <p class="text-xs text-[#72756a] mb-3">Ingredients and preparations advised against for fetal safety.</p>
      <ul class="text-xs text-[#6e2b1d] space-y-2">
        {#each weekGuide.foodsToAvoid as avoidItem}
          <li class="flex items-start gap-2">
            <span class="text-[#af705a] font-bold text-sm leading-none mt-0.5">✕</span>
            <span>{avoidItem}</span>
          </li>
        {/each}
      </ul>
    </div>
  </div>
</section>

<section class="food-card" aria-labelledby="food-guide-title">
  <div class="food-illustration flex items-center gap-2" aria-hidden="true">
    <i class="iconoir-leaf text-2xl text-[#809474]"></i>
    <i class="iconoir-apple-half text-2xl text-[#af705a]"></i>
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
    <a href="#learn" class="food-learn-link"
      >Explore the learning guide <i class="iconoir-nav-arrow-right text-sm"></i></a
    >
  </div>
</section>
