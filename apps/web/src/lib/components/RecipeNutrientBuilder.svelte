<script lang="ts">
  import { sessionToken } from "#lib/auth/session.ts";
  const api = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
  type Food = {
    id: string;
    foodCode?: string;
    label: string;
    source: string;
    nutrientBasis?: string;
    nutrientBasisGrams?: number;
    nutrients: Record<string, number>;
  };
  type Ingredient = {
    id: string;
    name: string;
    grams: number;
    source: string;
    nutrients: Record<string, number>;
  };
  const labels: Record<string, string> = {
    calciumMg: "Calcium",
    ironMg: "Iron",
    vitaminCMg: "Vitamin C",
    folateMcg: "Folate",
    sodiumMg: "Sodium",
    fibreG: "Fibre",
  };
  let query = $state("");
  let results = $state<Food[]>([]);
  let selected = $state<Food | null>(null);
  let grams = $state(100);
  let ingredients = $state<Ingredient[]>([]);
  let message = $state("");
  let busy = $state(false);
  let recipeName = $state("");
  let recipeMeal = $state("Lunch");
  let saveMessage = $state("");
  let totalWeight = $derived(
    ingredients.reduce((sum, item) => sum + item.grams, 0),
  );
  let totals = $derived(
    ingredients.reduce(
      (sum, item) => {
        for (const [key, value] of Object.entries(item.nutrients))
          sum[key] = (sum[key] ?? 0) + value;
        return sum;
      },
      {} as Record<string, number>,
    ),
  );

  async function search() {
    busy = true;
    message = "";
    try {
      const url = new URL(`${api}/pregnancy/foods`);
      url.searchParams.set("q", query);
      const response = await fetch(url);
      const result = (await response.json()) as { foods?: Food[] };
      if (!response.ok) throw new Error("Ingredient search is unavailable.");
      results = (result.foods ?? []).filter(
        (food) =>
          (food.source?.includes("FAO/INFOODS") ||
            food.source?.includes("Ayogu")) &&
          Object.keys(food.nutrients ?? {}).some((key) => labels[key]),
      );
      if (!results.length)
        message =
          "No measured micronutrient record matched. Try a broader ingredient name; unmatched ingredients will not be estimated.";
    } catch (error) {
      message =
        error instanceof Error ? error.message : "Ingredient search failed.";
    } finally {
      busy = false;
    }
  }

  function addIngredient() {
    if (!selected || !Number.isFinite(grams) || grams <= 0 || grams > 5000)
      return;
    const factor = grams / (selected.nutrientBasisGrams ?? 100);
    const nutrients = Object.fromEntries(
      Object.entries(selected.nutrients)
        .filter(([key, value]) => labels[key] && Number.isFinite(value))
        .map(([key, value]) => [key, Math.round(value * factor * 100) / 100]),
    );
    ingredients = [
      ...ingredients,
      {
        id: crypto.randomUUID(),
        name: selected.label,
        grams,
        source: selected.source,
        nutrients,
      },
    ];
    selected = null;
    query = "";
    results = [];
  }

  async function saveRecipe() {
    if (!ingredients.length || !recipeName.trim()) return;
    saveMessage = "";
    const response = await fetch(`${api}/records/meals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken()}`,
      },
      body: JSON.stringify({
        foodName: recipeName.trim(),
        mealType: recipeMeal,
        servingGrams: String(totalWeight),
        nutrients: totals,
        source: [...new Set(ingredients.map((item) => item.source))].join("; "),
        note: ingredients
          .map((item) => `${item.name} ${item.grams} g`)
          .join("; "),
      }),
    });
    saveMessage = response.ok
      ? "Recipe estimate saved to your meal log."
      : "Sign in again or check your connection to save this estimate.";
  }
</script>

<div class="rounded-2xl border border-[#e7e4dc] bg-[#faf9f6] p-5 space-y-4" aria-labelledby="recipe-builder-title">
  <div>
    <span class="text-[11px] font-bold tracking-widest text-[#888b7c] uppercase">MEASURE YOUR OWN RECIPE</span>
    <h4 id="recipe-builder-title" class="font-serif text-base font-semibold text-[#2b2c28]">Build a nutrient estimate</h4>
    <p class="text-xs text-[#72746b] mt-1 leading-relaxed">
      Add the ingredients and weights from your actual recipe. Sabi totals only sourced micronutrients for matched items.
    </p>
  </div>

  <form
    class="flex flex-col sm:flex-row gap-2.5"
    onsubmit={(event) => {
      event.preventDefault();
      void search();
    }}
  >
    <input
      bind:value={query}
      placeholder="e.g. beans, tomato, spinach"
      required
      class="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#dedad0] bg-white focus:outline-none focus:ring-2 focus:ring-[#809474]/40"
    />
    <button
      type="submit"
      disabled={busy}
      class="py-2 px-4 text-xs font-semibold rounded-xl bg-[#809474] text-white hover:bg-[#6c8060] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
    >
      {busy ? "Searching…" : "Find measured ingredient"}
    </button>
  </form>

  {#if results.length}
    <div class="space-y-1.5 max-h-48 overflow-y-auto" aria-label="Measured ingredient matches">
      {#each results as food (food.id)}
        <button
          type="button"
          class="w-full text-left p-2.5 rounded-xl border text-xs transition-colors cursor-pointer {selected?.id === food.id ? 'bg-[#edf5eb] border-[#809474]' : 'bg-white border-[#e7e4dc] hover:bg-[#faf9f6]'}"
          onclick={() => (selected = food)}
        >
          <strong class="font-semibold text-[#2b2c28] block">{food.label}</strong>
          <small class="text-[#888b7c]">{food.source} · {food.nutrientBasis ?? "reference portion"}</small>
        </button>
      {/each}
    </div>
  {/if}

  {#if selected}
    <div class="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white border border-[#e7e4dc] text-xs">
      <span class="font-semibold text-[#2b2c28] flex-1">{selected.label}</span>
      <div class="flex items-center gap-1.5">
        <label class="text-[#72746b]">Amount (g):</label>
        <input
          type="number"
          min="1"
          max="5000"
          bind:value={grams}
          class="w-20 px-2 py-1 text-xs rounded-lg border border-[#dedad0]"
        />
      </div>
      <button
        type="button"
        onclick={addIngredient}
        class="py-1 px-3 rounded-lg bg-[#809474] text-white font-semibold hover:bg-[#6c8060] cursor-pointer"
      >
        Add
      </button>
    </div>
  {/if}

  {#if ingredients.length}
    <div class="space-y-3 pt-3 border-t border-[#edeae1]">
      <ul class="space-y-1.5 text-xs">
        {#each ingredients as item (item.id)}
          <li class="flex items-center justify-between p-2 rounded-lg bg-white border border-[#eeece6]">
            <div>
              <span class="font-medium text-[#2b2c28]">{item.name} · {item.grams} g</span>
              <small class="block text-[10px] text-[#888b7c]">{item.source}</small>
            </div>
            <button
              type="button"
              aria-label={`Remove ${item.name}`}
              onclick={() =>
                (ingredients = ingredients.filter(
                  (entry) => entry.id !== item.id,
                ))}
              class="text-xs text-[#af705a] hover:underline cursor-pointer"
            >
              Remove
            </button>
          </li>
        {/each}
      </ul>

      <!-- Totals Estimate -->
      <div class="p-3.5 rounded-xl bg-white border border-[#dce5d6] space-y-2">
        <strong class="text-xs font-semibold text-[#475842] block">
          Measured recipe estimate · {totalWeight} g total ingredients
        </strong>
        <div class="grid grid-cols-3 gap-2 text-xs">
          {#each Object.entries(totals).filter(([key]) => labels[key]) as [key, value]}
            <div>
              <span class="text-[#888b7c] block text-[10px] uppercase font-bold">{labels[key]}</span>
              <span class="font-semibold text-[#2b2c28]">
                {value.toFixed(1)} {key.endsWith("Mg") ? "mg" : key.endsWith("Mcg") ? "µg" : "g"}
              </span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Save Recipe Form -->
      <form
        class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2"
        onsubmit={(event) => {
          event.preventDefault();
          void saveRecipe();
        }}
      >
        <input
          bind:value={recipeName}
          maxlength="160"
          placeholder="Recipe name (e.g. My egusi)"
          required
          class="px-3 py-2 text-xs rounded-xl border border-[#dedad0] bg-white sm:col-span-1"
        />
        <select bind:value={recipeMeal} class="px-3 py-2 text-xs rounded-xl border border-[#dedad0] bg-white">
          <option>Breakfast</option>
          <option>Lunch</option>
          <option>Dinner</option>
          <option>Snack</option>
        </select>
        <button
          type="submit"
          class="py-2 px-3 text-xs font-semibold rounded-xl bg-[#809474] text-white hover:bg-[#6c8060] transition-colors cursor-pointer"
        >
          Save to meal log
        </button>
      </form>

      {#if saveMessage}
        <p class="text-xs text-[#385a38] font-medium" role="status">✓ {saveMessage}</p>
      {/if}
    </div>
  {/if}

  {#if message}
    <p class="text-xs text-[#af705a]" role="status">{message}</p>
  {/if}
</div>
