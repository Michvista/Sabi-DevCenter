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

  // Dynamic 7-day Nigerian meal combos tailored specifically to this pregnancy week's nutrients
  let weekCombos = $derived.by(() => {
    const w = pregnancyWeek;
    const nutrients = weekGuide.keyNutrients.slice(0, 3).join(" & ");
    if (w <= 12) {
      return [
        { day: "Monday", breakfast: "Ogi with akara & boiled egg", lunch: "Sweet potato porridge with spinach", dinner: "Fish pepper soup with boiled plantain", highlight: "Folate & gentle on morning nausea" },
        { day: "Tuesday", breakfast: "Oatmeal with warm milk & banana", lunch: "Brown beans porridge with roasted plantain", dinner: "Okro soup with lean fish & eba", highlight: "High soluble fibre & zinc" },
        { day: "Wednesday", breakfast: "Toasted wholemeal bread with egg & avocado", lunch: "Jollof rice with steamed chicken & vegetables", dinner: "Boiled yam with vegetable egg sauce", highlight: "Vitamin B6 & protein building blocks" },
        { day: "Thursday", breakfast: "Moi moi with warm pap (pap)", lunch: "Egusi soup with bitterleaf and smoked fish", dinner: "Gbegiri & ewedu with amala", highlight: "Iron absorption with citrus fruit" },
        { day: "Friday", breakfast: "Boiled sweet potatoes with tomato mackerel stew", lunch: "Fried plantain (Dodo) with beans porridge", dinner: "Vegetable soup with croaker fish", highlight: "Essential fatty acids for baby" },
        { day: "Saturday", breakfast: "Pancake with fresh orange slices", lunch: "Tuwo shinkafa with miyan kuka", dinner: "Catfish peppersoup with boiled unripe plantain", highlight: "Natural minerals & hydration" },
        { day: "Sunday", breakfast: "Akara with whole milk & fruit cup", lunch: "Ofada rice with ayamase stew & boiled egg", dinner: "Light oat porridge with groundnuts", highlight: "Complete protein Sunday dinner" },
      ];
    } else if (w <= 27) {
      return [
        { day: "Monday", breakfast: "Moi moi with boiled egg & orange juice", lunch: "Ugwu (pumpkin leaf) soup with beef & eba", dinner: "Boiled ripe plantain with grilled tilapia fish", highlight: "Iron & Vitamin C for blood volume" },
        { day: "Tuesday", breakfast: "Wholewheat toast with peanut butter & banana", lunch: "Brown beans with corn (Adalu) & steamed fish", dinner: "Efo riro with goat meat & semovita", highlight: "Calcium & non-heme iron combo" },
        { day: "Wednesday", breakfast: "Pap with toasted soybean flour & akara", lunch: "Native jollof rice with dried fish & scent leaf", dinner: "Yam porridge with green vegetable stir-in", highlight: "Bone density minerals" },
        { day: "Thursday", breakfast: "Boiled eggs with sautéed spinach & bread", lunch: "Afang soup with periwinkle & waterleaf", dinner: "Fish pepper soup with steamed unripe plantain", highlight: "Magnesium & zinc boost" },
        { day: "Friday", breakfast: "Fortified cereal with full-cream milk & nuts", lunch: "Ofe onugbu (Bitterleaf soup) with poundo", dinner: "Grilled chicken salad with boiled sweet potatoes", highlight: "Omega-3 & healthy fats" },
        { day: "Saturday", breakfast: "Egg omelette filled with peppers & ugwu with toast", lunch: "Beans and sweet corn with stewed mackerel", dinner: "Fisherman soup with boiled yam", highlight: "Potassium & muscle recovery" },
        { day: "Sunday", breakfast: "Warm oats with crushed walnuts & milk", lunch: "Fried rice with chicken breast & steamed carrots", dinner: "Miyan taushe with tuwo masara", highlight: "Antioxidants & maternal energy" },
      ];
    } else {
      return [
        { day: "Monday", breakfast: "Ogi with akara & sliced ripe pawpaw", lunch: "Egusi soup with steamed ugu, smoked fish & eba", dinner: "Beans porridge with grilled croaker fish", highlight: "Bone calcium & potassium reserves" },
        { day: "Tuesday", breakfast: "Boiled plantain with scrambled egg & tomatoes", lunch: "Tuwo with Miyan Kuka & lean beef", dinner: "Light vegetable soup with catfish & boiled potato", highlight: "Easy digestion for heartburn relief" },
        { day: "Wednesday", breakfast: "Greek yoghurt with sliced banana & honey", lunch: "Ofe nsala (white soup) with catfish & pounded yam", dinner: "Steamed moi moi with warm oatmeal", highlight: "High protein & baby glycogen store" },
        { day: "Thursday", breakfast: "Toasted bread with hard-boiled eggs & sliced pear", lunch: "Banga soup with dried fish & starch", dinner: "Sweet potato porridge with shredded spinach", highlight: "Vitamin K & fetal fat buildup" },
        { day: "Friday", breakfast: "Akara with fresh orange & warm beverage", lunch: "Edikang ikong soup with cow leg & fufu", dinner: "Grilled chicken strips with cucumber & garden egg salad", highlight: "Cellular hydration & tissue growth" },
        { day: "Saturday", breakfast: "Fruit salad (banana, watermelon, apple) with nuts", lunch: "Jollof brown beans with steamed cabbage", dinner: "Goat meat peppersoup with boiled plantain", highlight: "Electrolyte replenishment" },
        { day: "Sunday", breakfast: "Pancakes with scrambled eggs & avocado", lunch: "Fried rice with grilled tilapia & steamed peas", dinner: "Moi moi with custard or light pap", highlight: "Gentle restful Sunday dinner" },
      ];
    }
  });

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

<section class="rounded-3xl bg-white border border-[#e7e4dc] p-6 sm:p-8 shadow-xs" aria-labelledby="planner-title">
  <!-- Top Eggify Hero Banner: Suggested for Week -->
  <div class="mb-8 rounded-2xl bg-linear-to-br from-[#f8faf7] via-[#ffffff] to-[#f4f7f2] border border-[#dce8d9] p-6 shadow-2xs">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#809474]/15 border border-[#809474]/30">
        <i class="iconoir-sparks text-xs text-[#475842]"></i>
        <span class="text-xs font-bold tracking-wider text-[#475842] uppercase">CURATED FOR WEEK {pregnancyWeek}</span>
      </div>
      <span class="text-xs bg-white text-[#77786f] border border-[#e2dfd5] font-medium px-2.5 py-0.5 rounded-full">
        Evidence-Based Recommendation
      </span>
    </div>
    <h3 class="font-serif text-xl sm:text-2xl text-[#242b22] font-semibold mb-2">
      What to Cook This Week
    </h3>
    <p class="text-sm text-[#475244] leading-relaxed mb-4">
      {weekGuide.nigerianFoodTip}
    </p>

    <!-- One-click Quick Add Dishes -->
    <div class="pt-4 border-t border-[#e2ebd9]">
      <div class="text-xs font-bold text-[#475842] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
        <i class="iconoir-plus-circle text-sm text-[#809474]"></i>
        <span>Tap any dish to quickly pre-fill your plan:</span>
      </div>
      <div class="flex flex-wrap gap-2">
        {#each weekGuide.recommendedFoods as dish}
          <button
            type="button"
            onclick={() => (dishName = dish)}
            class="text-xs font-medium px-3.5 py-2 rounded-xl bg-white border border-[#d6e5d2] text-[#2c382a] hover:border-[#809474] hover:bg-[#edf5eb] active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span class="text-[#809474] font-bold">+</span> {dish}
          </button>
        {/each}
      </div>
    </div>

    <!-- 7-Day Nigerian Meal Timetable Combos Table -->
    <div class="mt-6 pt-5 border-t border-[#e2ebd9]">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <i class="iconoir-calendar text-base text-[#475842]"></i>
          <h4 class="font-serif text-base font-semibold text-[#242b22]">Week {pregnancyWeek} Meal Timetable Combos</h4>
        </div>
        <span class="text-[11px] font-semibold text-[#809474] bg-white px-2.5 py-1 rounded-full border border-[#dce8d9]">
          Breakfast · Lunch · Dinner Combos
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {#each weekCombos as combo}
          <div class="p-4 rounded-xl bg-white border border-[#dce8d9] shadow-2xs hover:shadow-xs transition-shadow">
            <div class="flex items-center justify-between mb-2">
              <strong class="text-xs font-bold text-[#af705a] uppercase tracking-wider">{combo.day}</strong>
              <span class="text-[10px] font-medium text-[#475842] bg-[#809474]/10 px-2 py-0.5 rounded-md">
                {combo.highlight}
              </span>
            </div>
            <div class="space-y-1.5 text-xs text-[#30312c]">
              <div class="flex items-start gap-1.5">
                <span class="text-[10px] font-bold text-[#809474] uppercase w-12 shrink-0">B'fast:</span>
                <span class="font-medium text-[#3b3d36]">{combo.breakfast}</span>
              </div>
              <div class="flex items-start gap-1.5">
                <span class="text-[10px] font-bold text-[#af705a] uppercase w-12 shrink-0">Lunch:</span>
                <span class="font-medium text-[#3b3d36]">{combo.lunch}</span>
              </div>
              <div class="flex items-start gap-1.5">
                <span class="text-[10px] font-bold text-[#7b6fa0] uppercase w-12 shrink-0">Dinner:</span>
                <span class="font-medium text-[#3b3d36]">{combo.dinner}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Main Section: Add Meal & Planned Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <!-- Left Column (5 cols): Add Meal Form -->
    <div class="lg:col-span-5 bg-[#faf9f6] rounded-2xl p-6 border border-[#edeae1]">
      <div class="flex items-center gap-2 mb-4">
        <div class="w-8 h-8 rounded-lg bg-[#809474]/15 flex items-center justify-center text-[#475842]">
          <i class="iconoir-calendar-plus text-base"></i>
        </div>
        <div>
          <h4 id="planner-title" class="font-serif text-base font-semibold text-[#2b2c28]">Add to Schedule</h4>
          <span class="text-xs text-[#77786f]">Record your upcoming dishes</span>
        </div>
      </div>

      <form class="space-y-3.5" onsubmit={add}>
        <div>
          <label class="block text-xs font-bold text-[#55574f] uppercase tracking-wider mb-1" for="plan-date">Planned Date</label>
          <input
            id="plan-date"
            type="date"
            bind:value={date}
            required
            class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dcd7cb] bg-white focus:outline-none focus:ring-2 focus:ring-[#809474]/40"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-[#55574f] uppercase tracking-wider mb-1" for="plan-meal-type">Meal Time</label>
          <select
            id="plan-meal-type"
            bind:value={mealType}
            class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dcd7cb] bg-white focus:outline-none focus:ring-2 focus:ring-[#809474]/40"
          >
            <option>Breakfast</option>
            <option>Lunch</option>
            <option>Dinner</option>
            <option>Snack</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-[#55574f] uppercase tracking-wider mb-1" for="plan-dish-name">Food or Dish Name</label>
          <input
            id="plan-dish-name"
            bind:value={dishName}
            maxlength="160"
            placeholder="e.g. Beans with steamed plantain"
            required
            class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dcd7cb] bg-white focus:outline-none focus:ring-2 focus:ring-[#809474]/40 placeholder-[#9a988f]"
          />
        </div>

        <button
          type="submit"
          class="w-full py-2.5 px-4 text-sm font-semibold rounded-xl bg-[#809474] text-white hover:bg-[#6c8060] transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
        >
          <i class="iconoir-plus text-sm"></i>
          <span>Add to Meal Plan</span>
        </button>
      </form>

      <!-- 7-Day Auto Builder in an accordion -->
      <details class="mt-5 pt-4 border-t border-[#e5e1d5] text-xs text-[#686960]">
        <summary class="font-bold text-[#475842] cursor-pointer hover:underline flex items-center gap-1">
          <i class="iconoir-spark text-xs text-[#809474]"></i>
          <span>Auto-generate a 7-day Nigerian meal plan</span>
        </summary>
        <p class="mt-2 text-xs leading-relaxed text-[#77786f]">
          Filter dishes from our Nigerian food catalogue by region, budget, and dietary preference.
        </p>

        <form
          class="mt-3 space-y-2.5"
          onsubmit={(event) => {
            event.preventDefault();
            void generateIdeas();
          }}
        >
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-medium text-[#55574f] mb-1" for="auto-week">Week</label>
              <input
                id="auto-week"
                type="number"
                min="1"
                max="42"
                bind:value={week}
                class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#dcd7cb] bg-white"
              />
            </div>
            <div>
              <label class="block text-[11px] font-medium text-[#55574f] mb-1" for="auto-budget">Budget</label>
              <select id="auto-budget" bind:value={budget} class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#dcd7cb] bg-white">
                <option>Any</option>
                <option>Affordable</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-medium text-[#55574f] mb-1" for="auto-region">Region</label>
            <select id="auto-region" bind:value={region} class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#dcd7cb] bg-white">
              <option>Any</option>
              <option value="North">North (Hausa / Fulani / Middle Belt)</option>
              <option>South-East</option>
              <option>South-South</option>
              <option>South-West</option>
            </select>
          </div>

          <label class="flex items-center gap-2 cursor-pointer pt-1">
            <input type="checkbox" bind:checked={vegetarian} class="rounded border-[#dcd7cb]" />
            <span class="text-xs text-[#525547]">Vegetarian preference only</span>
          </label>

          <button
            type="submit"
            disabled={generating}
            class="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-[#475842] text-white hover:bg-[#384634] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {generating ? "Generating Ideas…" : "Build 7-Day Plan"}
          </button>
        </form>

        {#if ideas.length}
          <div class="mt-4 space-y-2 max-h-52 overflow-y-auto pr-1">
            {#each ideas as day}
              <div class="p-2.5 bg-white rounded-lg border border-[#e7e4dc]">
                <strong class="text-xs text-[#af705a] block mb-1">Day {day.day}</strong>
                {#each day.meals as m}
                  <div class="text-[11px] text-[#333] mb-0.5">
                    <span class="font-semibold text-[#555]">{m.mealType}:</span> {m.dishName}
                  </div>
                {/each}
              </div>
            {/each}
          </div>
          <button
            class="w-full mt-2.5 py-2 px-3 text-xs font-semibold rounded-lg bg-[#809474] text-white hover:bg-[#6c8060] transition-colors cursor-pointer disabled:opacity-50"
            type="button"
            disabled={savingIdeas}
            onclick={() => void saveIdeas()}
          >
            {savingIdeas ? "Saving…" : "Save All Ideas to My Plan"}
          </button>
        {/if}
      </details>
    </div>

    <!-- Right Column (7 cols): Planned Meals Card List -->
    <div class="lg:col-span-7 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between gap-2 mb-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-[#af705a]/10 flex items-center justify-center text-[#af705a]">
              <i class="iconoir-book-stack text-base"></i>
            </div>
            <div>
              <h4 class="font-serif text-base font-semibold text-[#2b2c28]">Your Planned Meals</h4>
              <span class="text-xs text-[#77786f]">{items.length} dishes scheduled</span>
            </div>
          </div>

          <button
            class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#809474]/15 text-[#475842] hover:bg-[#809474]/25 transition-colors cursor-pointer flex items-center gap-1.5"
            type="button"
            onclick={makeList}
          >
            <i class="iconoir-cart text-xs"></i>
            <span>Export to Grocery List</span>
          </button>
        </div>

        {#if items.length}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[440px] overflow-y-auto pr-1">
            {#each items as item (item.id)}
              <div class="p-3.5 rounded-xl bg-white border border-[#e5e1d5] shadow-2xs hover:border-[#809474]/40 transition-colors">
                <div class="flex items-center justify-between text-xs mb-1.5">
                  <span class="font-bold text-[#809474] uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-md bg-[#809474]/10">
                    {item.mealType}
                  </span>
                  <span class="text-[11px] text-[#8e9083] font-medium">{item.planDate}</span>
                </div>
                <div class="font-medium text-sm text-[#30312c] leading-snug">{item.dishName}</div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="rounded-2xl border-2 border-dashed border-[#e2dfd5] p-8 text-center bg-[#faf9f6]">
            <div class="w-12 h-12 rounded-full bg-white mx-auto flex items-center justify-center mb-3 shadow-2xs text-[#9a988f]">
              <i class="iconoir-pot text-xl"></i>
            </div>
            <h5 class="text-sm font-semibold text-[#525547] mb-1">No meals planned yet</h5>
            <p class="text-xs text-[#8e9083] max-w-sm mx-auto">
              Add meals you plan to cook this week or use the quick suggestions above to get started.
            </p>
          </div>
        {/if}
      </div>

      {#if message}
        <div class="mt-4 p-3 rounded-xl bg-[#edf5eb] border border-[#d6e5d2] text-xs font-medium text-[#385a38] flex items-center gap-2" role="status">
          <i class="iconoir-check-circle text-sm text-[#475842]"></i>
          <span>{message}</span>
        </div>
      {/if}
    </div>
  </div>
</section>
