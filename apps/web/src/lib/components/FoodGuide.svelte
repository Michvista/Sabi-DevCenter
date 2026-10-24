<script lang="ts">
  import {
    createFoodLogEntry,
    readFoodLog,
    writeFoodLog,
    type FoodLogEntry,
  } from "../data/food-log";
  import { sessionToken } from "#lib/auth/session.ts";
  import { onMount } from "svelte";
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
  let loggingId = $state<string | null>(null);
  let savedFoodId = $state<string | null>(null);

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
    const key = food.id || food.label;
    loggingId = key;
    savedMessage = "";
    try {
      const scaled = portion(food);
      const token = sessionToken();
      if (!token) {
        savedMessage = "Please sign in to log meals to your account.";
        return;
      }
      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/records/meals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            foodName: food.label,
            mealType: meal,
            servingGrams: servingGrams > 0 ? String(servingGrams) : "150",
            nutrients: scaled,
            source: food.source ?? "Nigerian Food Directory",
            note: mealNote,
          }),
        },
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        savedMessage = err?.message ?? "Could not save to your account. Please try again.";
        return;
      }
      const saved = (await response.json()) as { id: string; createdAt: string };
      const entry = {
        ...createFoodLogEntry(food.label, meal, mealNote),
        id: saved.id,
        loggedAt: saved.createdAt,
      };
      foodLog = [entry, ...foodLog].slice(0, 50);
      writeFoodLog(
        typeof localStorage === "undefined" ? undefined : localStorage,
        foodLog,
      );
      mealNote = "";
      savedFoodId = key;
      savedMessage = `✓ ${food.label} added to your meal journal!`;
      setTimeout(() => {
        if (savedFoodId === key) savedFoodId = null;
      }, 3500);
    } catch {
      savedMessage = "Could not reach server. Please check your connection.";
    } finally {
      loggingId = null;
    }
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

<div class="space-y-6">
  <!-- Banner Top Header -->
  <section class="rounded-3xl bg-linear-to-br from-[#f8faf7] via-[#ffffff] to-[#f4f7f2] border border-[#dce8d9] p-6 sm:p-8 shadow-xs">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#809474]/15 border border-[#809474]/30">
        <i class="iconoir-sparks text-xs text-[#475842]"></i>
        <span class="text-xs font-bold tracking-wider text-[#475842] uppercase">WEEK {week} NUTRITION GUIDE</span>
      </div>
      <span class="text-xs text-[#525547] bg-white border border-[#e2ded5] px-3 py-1 rounded-full font-medium shadow-2xs">
        From <em>Your Pregnancy Week by Week</em> (Curtis &amp; Schuler)
      </span>
    </div>

    <div class="max-w-3xl mb-6">
      <h3 class="text-2xl sm:text-3xl font-serif text-[#242b22] font-semibold mb-3">
        Fueling Baby &amp; Mother at Week {week}
      </h3>
      <p class="text-base text-[#475244] leading-relaxed">
        {weekGuide.nigerianFoodTip}
      </p>
    </div>

    <!-- 3 Curated Cards -->
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

  <!-- Search & Journal Section -->
  <section class="rounded-3xl bg-white border border-[#e7e4dc] p-6 sm:p-8 shadow-xs space-y-6" aria-labelledby="food-guide-title">
    <div class="flex items-center gap-3 pb-4 border-b border-[#f0ede6]">
      <div class="w-10 h-10 rounded-xl bg-[#809474]/15 flex items-center justify-center text-xl text-[#475842]">
        <i class="iconoir-organic-food"></i>
      </div>
      <div>
        <span class="text-[11px] font-bold tracking-widest text-[#888b7c] uppercase">FOOD FROM ACROSS NIGERIA</span>
        <h3 id="food-guide-title" class="font-serif text-xl sm:text-2xl font-semibold text-[#2b2c28]">Find what’s in your pot.</h3>
      </div>
    </div>

    <p class="text-sm text-[#65675c] leading-relaxed">
      Log foods you eat during pregnancy and explore familiar Nigerian and West African ingredients.
      Where the FAO/INFOODS table has a match, we show its measured composition per 100 g edible portion.
    </p>

    <!-- Expanding catalogue notice banner -->
    <div class="p-3.5 rounded-xl bg-[#fef9e7] border border-[#e9d27a] text-xs text-[#7c440a] flex items-start gap-2.5">
      <i class="iconoir-warning-triangle text-base text-[#b8860b] mt-0.5 shrink-0"></i>
      <div>
        <strong class="font-semibold block">Growing West African Food Directory</strong>
        <span>
          Our catalogue is continuously expanding with local dishes. If a specific family recipe or rare local soup is not catalogued yet, you can still schedule it directly in your meal planner or measure its ingredients using our Recipe Builder below.
        </span>
      </div>
    </div>

    <div class="p-3.5 rounded-xl bg-[#faf9f6] border-l-4 border-[#809474] text-xs text-[#72746b] leading-relaxed">
      Pregnancy-aware food journaling, not a personal diet prescription. Food-composition values describe the listed food and serving basis; they do not determine what is right for your pregnancy.
    </div>

    <!-- Search Form -->
    <form
      class="flex flex-col sm:flex-row gap-2.5"
      onsubmit={(event) => {
        event.preventDefault();
        void searchFood();
      }}
    >
      <input
        id="food-search-input"
        bind:value={query}
        placeholder="Try egusi, moi moi, ugwu…"
        maxlength="100"
        class="flex-1 px-4 py-3 text-sm rounded-xl border border-[#dedad0] bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#809474]/40 focus:bg-white placeholder-[#9a988f]"
      />
      <button
        type="submit"
        disabled={loading}
        class="py-3 px-6 text-sm font-semibold rounded-xl bg-[#809474] text-white hover:bg-[#6c8060] disabled:opacity-50 transition-colors cursor-pointer shadow-xs shrink-0"
      >
        {loading ? "Searching…" : "Search Food"}
      </button>
    </form>

    <!-- Quick Ideas -->
    <div class="flex flex-wrap items-center gap-2" aria-label="Popular food searches">
      <span class="text-xs text-[#888b7c] font-medium mr-1">Popular:</span>
      {#each ideas as idea}
        <button
          type="button"
          onclick={() => void searchFood(idea)}
          class="px-3 py-1.5 text-xs font-medium rounded-full bg-[#faf9f6] border border-[#e2ded5] text-[#55574f] hover:border-[#809474] hover:bg-[#edf5eb] transition-all cursor-pointer"
        >
          {idea}
        </button>
      {/each}
    </div>

    {#if error}
      <p class="p-3 rounded-xl bg-[#fdf4f0] border border-[#f4cfc4] text-xs text-[#9c2d15] font-medium" role="status">{error}</p>
    {/if}

    <!-- Results Grid -->
    {#if searched && foods.length}
      <div class="space-y-4 pt-4 border-t border-[#edeae1]" aria-live="polite">
        <div class="flex items-center justify-between">
          <h4 class="font-serif text-base font-semibold text-[#2b2c28]">Search Results ({foods.length})</h4>
          <span class="text-xs text-[#888b7c]">Scroll to see all matches</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[520px] overflow-y-auto pr-1">
          {#each foods as food}
            <article class="p-4 rounded-2xl border border-[#e7e4dc] bg-[#faf9f6] space-y-3">
              <div class="flex items-center gap-3">
                {#if food.image}
                  <img src={food.image} alt="" class="w-10 h-10 rounded-xl object-cover" loading="lazy" />
                {/if}
                <div>
                  <strong class="font-serif text-base text-[#2b2c28] block">{food.label}</strong>
                  {#if food.category}
                    <small class="text-xs text-[#888b7c]">{food.category}</small>
                  {/if}
                </div>
              </div>

              {#if food.details}
                <p class="text-xs text-[#686960] leading-relaxed">{food.details}</p>
              {/if}

              <div class="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white border border-[#eeece6] text-xs">
                {#each Object.entries(food.nutrients).filter(([key, value]) => nutrientLabels[key] && typeof value === "number") as [key, value]}
                  <div>
                    <span class="text-[#888b7c] block text-[10px] uppercase font-bold">{nutrientLabels[key]}</span>
                    <strong class="text-[#2b2c28] font-semibold">{formatNutrient(key, value as number)}</strong>
                  </div>
                {/each}
              </div>

              <!-- Portion / Add Form -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#eeece6]">
                <div>
                  <label class="block text-[10px] font-bold text-[#72746b] uppercase mb-1">Portion (g)</label>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    bind:value={servingGrams}
                    class="w-full px-2 py-1.5 text-xs rounded-lg border border-[#dedad0] bg-white"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-[#72746b] uppercase mb-1">Meal</label>
                  <select bind:value={meal} class="w-full px-2 py-1.5 text-xs rounded-lg border border-[#dedad0] bg-white">
                    <option>Breakfast</option>
                    <option>Lunch</option>
                    <option>Dinner</option>
                    <option>Snack</option>
                  </select>
                </div>
                <div class="flex items-end">
                  <button
                    type="button"
                    disabled={loggingId === (food.id || food.label)}
                    onclick={() => void saveFoodLog(food)}
                    class="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-[#809474] text-white hover:bg-[#6c8060] disabled:opacity-60 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {#if loggingId === (food.id || food.label)}
                      <i class="iconoir-refresh animate-spin text-xs"></i>
                      <span>Logging…</span>
                    {:else if savedFoodId === (food.id || food.label)}
                      <i class="iconoir-check-circle text-xs"></i>
                      <span>Logged!</span>
                    {:else}
                      <span>+ Log Meal</span>
                    {/if}
                  </button>
                </div>
              </div>
            </article>
          {/each}
        </div>
      </div>
    {/if}

    {#if savedMessage}
      <p class="p-3 rounded-xl bg-[#edf5eb] border border-[#c6dfc0] text-xs font-medium text-[#385a38]" role="status">
        ✓ {savedMessage}
      </p>
    {/if}

    <!-- Food Log Section -->
    <aside class="pt-6 border-t border-[#edeae1] space-y-4" aria-labelledby="food-log-title">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-[11px] font-bold tracking-widest text-[#888b7c] uppercase">YOUR FOOD JOURNAL</span>
          <h4 id="food-log-title" class="font-serif text-lg font-semibold text-[#2b2c28]">Meals you’ve noted</h4>
        </div>
        <span class="text-xs text-[#888b7c]">{foodLog.length} entries</span>
      </div>

      {#if foodLog.length}
        <div class="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {#each foodLog as entry (entry.id)}
            <div class="p-3 rounded-xl border border-[#eeece6] bg-[#faf9f6] flex items-center justify-between gap-3">
              <div>
                <strong class="text-sm font-semibold text-[#2b2c28] block">{entry.food}</strong>
                <span class="text-xs text-[#72746b]">{entry.meal} · {new Date(entry.loggedAt).toLocaleDateString()}</span>
                {#if entry.note}
                  <small class="block text-xs text-[#8e9083] italic mt-0.5">{entry.note}</small>
                {/if}
              </div>
              <button
                type="button"
                aria-label={`Remove ${entry.food} from meal notes`}
                onclick={() => void removeFoodLog(entry.id)}
                class="text-xs text-[#af705a] hover:underline cursor-pointer shrink-0 font-medium"
              >
                Remove
              </button>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-xs text-[#8e9083] p-4 rounded-xl bg-[#faf9f6] border border-dashed border-[#e2dfd5] text-center">
          When you find a food, add your measured portion here. Sabi calculates available nutrients from the reference values.
        </p>
      {/if}
    </aside>
  </section>
</div>
