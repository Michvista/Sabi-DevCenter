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

<section class="food-log recipe-builder" aria-labelledby="recipe-builder-title">
  <div class="food-log-heading">
    <div>
      <span class="food-kicker">MEASURE YOUR OWN RECIPE</span>
      <h4 id="recipe-builder-title">Build a nutrient estimate</h4>
    </div>
  </div>
  <p>
    Add the ingredients and weights from your actual recipe. Sabi totals only
    sourced micronutrients for matched items; it will not guess quantities or
    values for unmatched ingredients.
  </p>
  <form
    class="planner-form"
    onsubmit={(event) => {
      event.preventDefault();
      void search();
    }}
  >
    <label
      >Ingredient<input
        bind:value={query}
        placeholder="e.g. beans, tomato, spinach"
        required
      /></label
    >
    <button type="submit" disabled={busy}
      >{busy ? "Searching…" : "Find measured ingredient"}</button
    >
  </form>
  {#if results.length}<div
      class="recipe-search-results"
      aria-label="Measured ingredient matches"
    >
      {#each results as food (food.id)}<button
          type="button"
          class:chosen={selected?.id === food.id}
          onclick={() => (selected = food)}
          ><strong>{food.label}</strong><small
            >{food.source} · {food.nutrientBasis ?? "reference portion"}</small
          ></button
        >{/each}
    </div>{/if}
  {#if selected}<div class="recipe-add-row">
      <span>{selected.label}</span><label
        >Recipe amount (g)<input
          type="number"
          min="1"
          max="5000"
          bind:value={grams}
        /></label
      ><button type="button" onclick={addIngredient}>Add ingredient</button>
    </div>{/if}
  {#if ingredients.length}<ul class="recipe-ingredient-list">
      {#each ingredients as item (item.id)}<li>
          <span>{item.name} · {item.grams} g<small>{item.source}</small></span
          ><button
            type="button"
            aria-label={`Remove ${item.name}`}
            onclick={() =>
              (ingredients = ingredients.filter(
                (entry) => entry.id !== item.id,
              ))}>Remove</button
          >
        </li>{/each}
    </ul>
    <div class="recipe-estimate">
      <strong
        >Measured recipe estimate · {totalWeight} g total ingredients</strong
      >
      <dl>
        {#each Object.entries(totals).filter(([key]) => labels[key]) as [key, value]}<div
          >
            <dt>{labels[key]}</dt>
            <dd>
              {value.toFixed(1)}
              {key.endsWith("Mg") ? "mg" : key.endsWith("Mcg") ? "µg" : "g"}
            </dd>
          </div>{/each}
      </dl>
    </div>
    <form
      class="planner-form recipe-save-form"
      onsubmit={(event) => {
        event.preventDefault();
        void saveRecipe();
      }}
    >
      <label
        >Recipe name<input
          bind:value={recipeName}
          maxlength="160"
          placeholder="e.g. My egusi soup"
          required
        /></label
      >
      <label
        >Meal<select bind:value={recipeMeal}
          ><option>Breakfast</option><option>Lunch</option><option
            >Dinner</option
          ><option>Snack</option></select
        ></label
      >
      <button type="submit">Save estimate to meal log</button>
    </form>
    {#if saveMessage}<p class="food-message" role="status">
        {saveMessage}
      </p>{/if}
    <small
      >Estimate covers listed ingredients before cooking; cooking water,
      discarded liquid, yield changes, and unmeasured ingredients affect final
      values. Sources are shown per ingredient. This is not individualized
      pregnancy nutrition advice.</small
    >
  {/if}
  {#if message}<p class="food-message" role="status">{message}</p>{/if}
</section>
