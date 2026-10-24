<script lang="ts">
  import { onMount } from "svelte";
  import { sessionToken } from "#lib/auth/session.ts";
  import { getPregnancyWeek } from "../data/pregnancy-weeks";
  type Plan = {
    id: string;
    planDate: string;
    mealType: string;
    dishName: string;
    note?: string | null;
  };
  let { pregnancyWeek = 20 }: { pregnancyWeek?: number } = $props();
  const api = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
  let weekGuide = $derived(getPregnancyWeek(pregnancyWeek));

  let items = $state<Plan[]>([]);
  let date = $state(new Date().toISOString().slice(0, 10));
  let mealType = $state("Breakfast");
  let dishName = $state("");
  let message = $state("");
  let week = $state(20);
  let region = $state("Any");
  let budget = $state("Any");
  let vegetarian = $state(false);
  let avoidIngredients = $state("");
  let ideas = $state<
    Array<{
      day: number;
      meals: Array<{
        mealType: string;
        dishName: string;
        ingredients: string;
        region: string;
      }>;
    }>
  >([]);
  let ideasDisclaimer = $state("");
  let generating = $state(false);
  let savingIdeas = $state(false);
  async function load() {
    const r = await fetch(`${api}/records/meal-plan`, {
      headers: { Authorization: `Bearer ${sessionToken()}` },
    });
    if (r.ok) items = await r.json();
  }
  onMount(() => {
    week = pregnancyWeek;
    void load();
  });
  async function add(event: SubmitEvent) {
    event.preventDefault();
    message = "";
    const r = await fetch(`${api}/records/meal-plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken()}`,
      },
      body: JSON.stringify({ planDate: date, mealType, dishName }),
    });
    if (!r.ok) {
      message =
        "Could not save meal plan. Check your connection and try again.";
      return;
    }
    dishName = "";
    await load();
  }
  async function makeList() {
    const r = await fetch(`${api}/records/groceries/from-plan`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionToken()}` },
    });
    const result = await r.json();
    message = r.ok
      ? `${result.added} grocery items added${result.expandedMeals ? ` from ${result.expandedMeals} matched meal${result.expandedMeals === 1 ? "" : "s"}` : ""}.`
      : "Could not build the grocery list.";
  }
  async function generateIdeas() {
    generating = true;
    message = "";
    try {
      const r = await fetch(`${api}/pregnancy/meal-plan/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week: Number(week),
          region,
          budget,
          vegetarian,
          avoidIngredients: avoidIngredients
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });
      const result = (await r.json()) as {
        ideas?: typeof ideas;
        disclaimer?: string;
        message?: string;
      };
      if (!r.ok)
        throw new Error(result.message ?? "Could not build meal ideas.");
      ideas = result.ideas ?? [];
      ideasDisclaimer = result.disclaimer ?? "";
      if (!ideas.length)
        message =
          result.message ?? "No matches. Try broadening your preferences.";
    } catch (error) {
      message =
        error instanceof Error ? error.message : "Could not build meal ideas.";
    } finally {
      generating = false;
    }
  }
  async function saveIdeas() {
    savingIdeas = true;
    let savedCount = 0;
    const firstDay = new Date(`${date}T12:00:00`);
    for (const day of ideas) {
      const planDate = new Date(firstDay);
      planDate.setDate(firstDay.getDate() + day.day - 1);
      for (const meal of day.meals) {
        const response = await fetch(`${api}/records/meal-plan`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken()}`,
          },
          body: JSON.stringify({
            planDate: `${planDate.getFullYear()}-${String(planDate.getMonth() + 1).padStart(2, "0")}-${String(planDate.getDate()).padStart(2, "0")}`,
            mealType: meal.mealType,
            dishName: meal.dishName,
            note: `Catalogue idea · ingredients: ${meal.ingredients}`,
          }),
        });
        if (response.ok) savedCount += 1;
      }
    }
    message = `${savedCount} of ${ideas.length * 3} meal ideas saved to your plan.`;
    await load();
    savingIdeas = false;
  }
</script>

<section class="food-log planner" aria-labelledby="planner-title">
  <!-- Weekly Book-Backed Suggested Meals Banner -->
  <div class="mb-6 rounded-2xl bg-[#faf9f6] border border-[#e7e4dc] p-5 shadow-xs">
    <div class="flex items-center justify-between gap-2 mb-2">
      <span class="text-xs font-bold tracking-wider text-[#af705a] uppercase">SUGGESTED FOR WEEK {pregnancyWeek}</span>
      <span class="text-xs bg-[#809474]/15 text-[#475842] font-semibold px-2.5 py-0.5 rounded-full">Book-backed Nutrition</span>
    </div>
    <h4 class="font-serif text-lg text-[#30312c] font-semibold mb-1">
      Recommended Meals &amp; Nutrients for Your Current Week
    </h4>
    <p class="text-xs text-[#686960] mb-3">
      {weekGuide.nigerianFoodTip}
    </p>

    <!-- One-click Meal Add Chips -->
    <div class="pt-3 border-t border-[#eae6de]">
      <div class="text-xs font-bold text-[#525547] mb-2 flex items-center gap-1.5">
        <i class="iconoir-plus-circle text-sm text-[#809474]"></i>
        <span>Tap any suggested dish to add to your plan:</span>
      </div>
      <div class="flex flex-wrap gap-2">
        {#each weekGuide.recommendedFoods as dish}
          <button
            type="button"
            onclick={() => (dishName = dish)}
            class="text-xs font-medium px-3 py-1.5 rounded-xl bg-white border border-[#d6d2c4] text-[#30312c] hover:border-[#809474] hover:bg-[#f5f8f3] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>+</span> {dish}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <div class="food-log-heading">
    <div>
      <span class="food-kicker">PLAN AHEAD</span>
      <h4 id="planner-title">Your meals this week</h4>
    </div>
  </div>
  <form class="planner-form" onsubmit={add}>
    <label>Date<input type="date" bind:value={date} required /></label>
    <label
      >Meal<select bind:value={mealType}
        ><option>Breakfast</option><option>Lunch</option><option>Dinner</option
        ><option>Snack</option></select
      ></label
    >
    <label
      >Food or dish<input
        bind:value={dishName}
        maxlength="160"
        placeholder="e.g. beans and plantain"
        required
      /></label
    >
    <button type="submit">Add to plan</button>
  </form>
  <details class="meal-ideas-builder">
    <summary>Build a week of local meal ideas</summary>
    <p>
      Filter by pregnancy week, region, budget and food preferences. This uses
      dish names and ingredients from the supplied Nigerian food catalogue; it
      does not provide measured portions or nutrients.
    </p>
    <form
      class="planner-form"
      onsubmit={(event) => {
        event.preventDefault();
        void generateIdeas();
      }}
    >
      <label
        >Pregnancy week<input
          type="number"
          min="1"
          max="42"
          bind:value={week}
        /></label
      >
      <label
        >Region<select bind:value={region}
          ><option>Any</option><option value="North"
            >North (catalogue grouping)</option
          ><option>South-East</option><option>South-South</option><option
            >South-West</option
          ></select
        ></label
      >
      <label
        >Budget<select bind:value={budget}
          ><option>Any</option><option>Affordable</option></select
        ></label
      >
      <label class="meal-ideas-check"
        ><input type="checkbox" bind:checked={vegetarian} /> Vegetarian preferences</label
      >
      <label
        >Exclude ingredient names<input
          bind:value={avoidIngredients}
          placeholder="Comma-separated; e.g. fish, groundnut"
        /></label
      >
      <button type="submit" disabled={generating}
        >{generating ? "Building ideas…" : "Build 7-day ideas"}</button
      >
    </form>
    {#if ideas.length}<div class="meal-ideas-results">
        {#each ideas as day}<article>
            <strong>Day {day.day}</strong>{#each day.meals as meal}<p>
                <b>{meal.mealType}:</b>
                {meal.dishName}<small>{meal.ingredients}</small>
              </p>{/each}
          </article>{/each}
      </div>
      <p class="meal-ideas-disclaimer">{ideasDisclaimer}</p>
      <button
        class="planner-secondary"
        type="button"
        disabled={savingIdeas}
        onclick={() => void saveIdeas()}
        >{savingIdeas ? "Saving…" : "Save ideas to my week"}</button
      >{/if}
  </details>
  {#if items.length}<ul class="planner-list">
      {#each items as item (item.id)}<li>
          <strong>{item.planDate}</strong><span
            >{item.mealType} · {item.dishName}</span
          >
        </li>{/each}
    </ul>{:else}<p class="food-log">
      Add dishes you already plan to cook. This is not a prescribed diet.
    </p>{/if}
  <button class="planner-secondary" type="button" onclick={makeList}
    >Build grocery list from plan</button
  >
  {#if message}<p class="food-message" role="status">{message}</p>{/if}
</section>
