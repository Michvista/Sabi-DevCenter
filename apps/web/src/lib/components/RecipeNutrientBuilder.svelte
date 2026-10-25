<script lang="ts">
  import { sessionToken } from "#lib/auth/session.ts";
  import { getPregnancyWeek } from "../data/pregnancy-weeks";
  import { onMount } from "svelte";

  let { week = 28 }: { week?: number } = $props();
  const api = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
  let weekGuide = $derived(getPregnancyWeek(week));

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

  type SavedRecipe = {
    id: string;
    name: string;
    category: string;
    servings: number;
    mealType: string;
    ingredients: Ingredient[];
    totalWeight: number;
    totals: Record<string, number>;
    createdAt: string;
  };

  const nutrientLabels: Record<string, string> = {
    calciumMg: "Calcium",
    ironMg: "Iron",
    vitaminCMg: "Vitamin C",
    folateMcg: "Folate",
    sodiumMg: "Sodium",
    fibreG: "Fibre",
  };

  // Recipe Metadata
  let recipeName = $state("Mama's Egusi & Ugu Soup");
  let recipeCategory = $state("Soup & Stew");
  let recipeMeal = $state("Lunch");
  let servings = $state(4);

  // Ingredients and Search
  let query = $state("");
  let results = $state<Food[]>([]);
  let selected = $state<Food | null>(null);
  let grams = $state(150);
  let ingredients = $state<Ingredient[]>([]);
  let searching = $state(false);
  let searchMessage = $state("");

  // Saving states
  let savingMeal = $state(false);
  let savingCollection = $state(false);
  let actionFeedback = $state("");
  let savedRecipes = $state<SavedRecipe[]>([]);

  // Popular Nigerian Staples for quick adding
  const quickIngredients = [
    { name: "Ugwu leaves", grams: 100 },
    { name: "Melon seeds", grams: 120 },
    { name: "Brown beans", grams: 200 },
    { name: "White yam", grams: 250 },
    { name: "Plantain", grams: 200 },
    { name: "Smoked fish", grams: 100 },
    { name: "Tomatoes", grams: 100 },
    { name: "Spinach", grams: 100 },
  ];

  // Preset Recipes for 1-click loading
  const recipePresets = [
    {
      name: "Egusi Soup with Steamed Ugu & Fish",
      category: "Soup & Stew",
      meal: "Lunch",
      servings: 4,
      items: [
        { name: "Melon seeds (Egusi)", grams: 150, nutrients: { calciumMg: 82, ironMg: 8.5, fibreG: 5.2, folateMcg: 110, vitaminCMg: 2.1, sodiumMg: 15 }, source: "FAO/INFOODS WAFCT" },
        { name: "Pumpkin leaves (Ugwu)", grams: 150, nutrients: { calciumMg: 145, ironMg: 5.2, vitaminCMg: 38, folateMcg: 130, fibreG: 3.8, sodiumMg: 18 }, source: "FAO/INFOODS WAFCT" },
        { name: "Catfish / smoked fish", grams: 150, nutrients: { calciumMg: 52, ironMg: 2.1, vitaminCMg: 1.2, folateMcg: 15, fibreG: 0, sodiumMg: 65 }, source: "Ayogu et al. 2017" },
        { name: "Palm oil", grams: 30, nutrients: { calciumMg: 2, ironMg: 0.5, vitaminCMg: 0, folateMcg: 0, fibreG: 0, sodiumMg: 2 }, source: "FAO/INFOODS WAFCT" },
      ],
    },
    {
      name: "Beans Porridge with Ripe Plantain",
      category: "Porridge / Pottage",
      meal: "Dinner",
      servings: 3,
      items: [
        { name: "Brown beans", grams: 200, nutrients: { calciumMg: 95, ironMg: 6.8, fibreG: 14.5, folateMcg: 240, vitaminCMg: 1.5, sodiumMg: 22 }, source: "FAO/INFOODS WAFCT" },
        { name: "Ripe plantains", grams: 180, nutrients: { calciumMg: 12, ironMg: 1.2, fibreG: 4.2, folateMcg: 45, vitaminCMg: 26, sodiumMg: 8 }, source: "FAO/INFOODS WAFCT" },
        { name: "Mackerel fish", grams: 100, nutrients: { calciumMg: 38, ironMg: 1.8, fibreG: 0, folateMcg: 12, vitaminCMg: 0.8, sodiumMg: 75 }, source: "FAO/INFOODS WAFCT" },
      ],
    },
    {
      name: "Yam Porridge (Asaro) with Shredded Greens",
      category: "Porridge / Pottage",
      meal: "Lunch",
      servings: 3,
      items: [
        { name: "White yam tuber", grams: 300, nutrients: { calciumMg: 45, ironMg: 1.8, fibreG: 6.5, folateMcg: 58, vitaminCMg: 32, sodiumMg: 12 }, source: "FAO/INFOODS WAFCT" },
        { name: "Spinach / Green leaves", grams: 100, nutrients: { calciumMg: 99, ironMg: 3.5, fibreG: 2.8, folateMcg: 145, vitaminCMg: 28, sodiumMg: 25 }, source: "FAO/INFOODS WAFCT" },
        { name: "Smoked croaker fish", grams: 100, nutrients: { calciumMg: 42, ironMg: 1.9, fibreG: 0, folateMcg: 10, vitaminCMg: 0, sodiumMg: 68 }, source: "Ayogu et al. 2017" },
      ],
    },
  ];

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

  // Per-serving portion breakdown
  let perServing = $derived(
    Object.fromEntries(
      Object.entries(totals).map(([key, val]) => [
        key,
        servings > 0 ? val / servings : val,
      ]),
    ),
  );

  // Clinical Review based on Curtis & Schuler book principles & WHO Antenatal criteria
  let clinicalAssessment = $derived.by(() => {
    if (!ingredients.length) {
      return {
        badge: "Waiting for Ingredients",
        color: "text-[#8e9083] bg-[#faf9f6] border-[#edeae1]",
        summary: "Add measured ingredients above to calculate nutritional density for Week " + week + ".",
        highlights: [] as string[],
        warnings: [] as string[],
        gaps: [] as string[],
        safetyCheck: "No active assessment.",
      };
    }

    const highlights: string[] = [];
    const warnings: string[] = [];
    const gaps: string[] = [];
    let score = 0;

    const allText = (recipeName + " " + ingredients.map((i) => i.name).join(" ")).toLowerCase();

    // 1. Potash / Kaun / Akanwu check (Nigerian traditional food tenderizer risk)
    if (/potash|kaun|akanwu|kanwa/.test(allText)) {
      warnings.push("Potash (Kaun / Akanwu) detected: Traditional rock salt contains high levels of alkaline nitrates and is contraindicated in pregnancy as it can irritate the uterine wall and stimulate premature contractions. Substitute with a pinch of baking soda or slow-simmering for tenderness.");
    }

    // 2. Unpasteurized dairy / soft raw cheeses
    if (/unpasteurized|raw milk|soft cheese|brie|camembert|blue cheese|feta raw/.test(allText)) {
      warnings.push("Unpasteurized dairy / soft cheese: Carries a high risk of Listeria monocytogenes bacteria, which can cross the placenta. Ensure all milk and cheeses are explicitly pasteurized.");
    }

    // 3. Raw or undercooked animal products (raw eggs, sushi, rare meats)
    if (/raw egg|uncooked egg|raw fish|sushi|undercooked|raw meat|rare beef/.test(allText)) {
      warnings.push("Raw or undercooked animal protein detected: Carries risk of Salmonella and Toxoplasmosis. Ensure all eggs have firm yolks and all meats/poultry are cooked thoroughly.");
    }

    // 4. High-mercury fish
    if (/shark|swordfish|king mackerel|tilefish|bigeye tuna/.test(allText)) {
      warnings.push("High-mercury predatory fish: Large predatory species bioaccumulate methylmercury, which harms fetal neurodevelopment. Choose safe Nigerian alternatives like tilapia, croaker, mackerel (Titus), catfish, or salmon.");
    }

    // 5. Excess liver / organ meats
    if (/liver|organ meat/.test(allText)) {
      const liverItem = ingredients.find((i) => /liver|organ meat/i.test(i.name));
      if (liverItem && liverItem.grams > 60) {
        warnings.push(`High Liver portion (${liverItem.grams}g): Liver is exceptionally rich in preformed Vitamin A (retinol). High retinol intakes can be teratogenic. Keep liver portions occasional and under 50g.`);
      }
    }

    // 6. Unstandardized herbal concoctions / agbo / bitter kola
    if (/agbo|herbal tonic|bitter kola|dongoyaro|neem/.test(allText)) {
      warnings.push("Unstandardized herbal remedies (Agbo / Bitter Kola): Lack regulated dosages and frequently contain uterine-stimulating phytochemicals. Avoid non-prescribed herbal concoctions during pregnancy.");
    }

    // 7. Alcohol / fermented palm wine
    if (/alcohol|palm wine|beer|wine|whiskey|stout|gin/.test(allText)) {
      warnings.push("Alcohol detected: There is no known safe amount or trimester for alcohol consumption. Alcohol passes directly through the umbilical cord and causes Fetal Alcohol Spectrum Disorders.");
    }

    // 8. Sodium Safety Audit (Pre-eclampsia & Gestational Hypertension)
    if (totals.sodiumMg > 2000) {
      warnings.push(`High Sodium (${totals.sodiumMg.toFixed(0)} mg in recipe): Exceeds WHO daily sodium recommendations (2,000 mg). High sodium increases blood pressure, water retention, and risks of gestational hypertension and pre-eclampsia. Halve the seasoning cubes or table salt.`);
    } else if (totals.sodiumMg > 1400) {
      warnings.push(`Moderate-to-High Sodium (${totals.sodiumMg.toFixed(0)} mg): Keep bouillon cubes (Maggi/Knorr) moderate. Enhance flavor with natural herbs, garlic, ginger, and locust beans (iru) instead.`);
    }

    // Nutrient Strengths
    // Calcium (vital for 3rd trimester bone hardening, 2nd trimester tooth buds)
    if (totals.calciumMg >= 200) {
      highlights.push(`High Calcium (${totals.calciumMg.toFixed(0)} mg) supports fetal skeletal ossification in Week ${week}.`);
      score += 2;
    }

    // Iron (vital for maternal hemoglobin and placental blood volume)
    if (totals.ironMg >= 5) {
      highlights.push(`Rich in Non-Heme Iron (${totals.ironMg.toFixed(1)} mg) to counter pregnancy anemia.`);
      score += 2;
    }

    // Folate (critical for cell division and neural closure)
    if (totals.folateMcg >= 150) {
      highlights.push(`Excellent Folate (${totals.folateMcg.toFixed(0)} µg) for rapid fetal tissue development.`);
      score += 2;
    }

    // Vitamin C (assists non-heme iron absorption)
    if (totals.vitaminCMg >= 25) {
      highlights.push(`Contains Vitamin C (${totals.vitaminCMg.toFixed(0)} mg) to maximize iron bioavailability.`);
      score += 1;
    }

    // Dietary Fibre (combats pregnancy-induced constipation)
    if (totals.fibreG >= 8) {
      highlights.push(`Dietary Fibre (${totals.fibreG.toFixed(1)} g) promotes healthy digestion and blood sugar stability.`);
      score += 1;
    }

    // Week-specific nutritional alignment and missing critical nutrients
    if (week >= 28) {
      // 3rd Trimester priorities: Calcium (bones), Iron (blood), Protein
      if (totals.calciumMg < 80) {
        gaps.push(`Low Calcium (${totals.calciumMg.toFixed(0)} mg): Week ${week} is the peak window for baby's bone mineral deposition. Pair this dish with dark leafy greens (Ugwu, waterleaf), milk, or fortified grains.`);
      }
      if (totals.ironMg < 3) {
        gaps.push(`Low Iron (${totals.ironMg.toFixed(1)} mg): Blood volume demands in late pregnancy remain elevated to prevent maternal fatigue and postpartum hemorrhage. Consider adding beans, lentils, or lean meat.`);
      }
    } else if (week <= 13) {
      // 1st Trimester priorities: Folate (neural tube), B6
      if (totals.folateMcg < 80) {
        gaps.push(`Low Folate (${totals.folateMcg.toFixed(0)} µg): Folate is vital during early pregnancy for cellular division and preventing neural tube defects. Add sweet oranges, beans, or spinach.`);
      }
    }

    // General safe preparation checklist
    let safetyCheck = "✓ Ingredients comply with safe pregnancy preparation guidelines. Ensure all meats and seafood are cooked thoroughly to at least 74°C (165°F), and wash all fresh leaves in clean potable water.";
    if (warnings.length > 0) {
      safetyCheck = "⚠️ Review the ingredient cautions above before cooking or logging this recipe.";
    }

    if (warnings.length > 0) {
      return {
        badge: "⚠️ Cautions to Review for Week " + week,
        color: "text-[#9c2d15] bg-[#fdf4f0] border-[#f4cfc4]",
        summary: `Clinical review identified ingredient cautions or high sodium levels that require adjustment for safe pregnancy consumption.`,
        highlights,
        warnings,
        gaps,
        safetyCheck,
      };
    } else if (score >= 5) {
      return {
        badge: "★ Highly Recommended for Week " + week,
        color: "text-[#385a38] bg-[#edf5eb] border-[#c6dfc0]",
        summary: `This recipe aligns closely with Week ${week} priorities (${weekGuide.focus}). It delivers high-density micronutrients tailored to your current stage.`,
        highlights,
        warnings,
        gaps,
        safetyCheck,
      };
    } else if (score >= 3) {
      return {
        badge: "✓ Balanced Pregnancy Meal",
        color: "text-[#475842] bg-[#f4f7f2] border-[#dce5d6]",
        summary: `Nutritious, moderate-density recipe. Consider adding dark green leaves (Ugwu or Spinach) to boost calcium and folate for baby's current growth spurt.`,
        highlights,
        warnings,
        gaps,
        safetyCheck,
      };
    } else {
      return {
        badge: "Moderate Nutrient Profile",
        color: "text-[#7c440a] bg-[#fef9e7] border-[#e9d27a]",
        summary: `Provides good caloric sustenance. For optimal fetal development at Week ${week}, pair with calcium-rich greens or protein.`,
        highlights,
        warnings,
        gaps,
        safetyCheck,
      };
    }
  });

  onMount(() => {
    try {
      const stored = localStorage.getItem("sabi-saved-recipes");
      if (stored) savedRecipes = JSON.parse(stored);
    } catch {}
    // Load default preset if empty
    if (!ingredients.length) {
      loadPreset(recipePresets[0]);
    }
  });

  function loadPreset(preset: typeof recipePresets[0]) {
    recipeName = preset.name;
    recipeCategory = preset.category;
    recipeMeal = preset.meal;
    servings = preset.servings;
    ingredients = preset.items.map((item) => ({
      id: crypto.randomUUID(),
      name: item.name,
      grams: item.grams,
      nutrients: item.nutrients,
      source: item.source,
    }));
    actionFeedback = `Loaded "${preset.name}" preset!`;
    setTimeout(() => (actionFeedback = ""), 3000);
  }

  async function search() {
    if (!query.trim()) return;
    searching = true;
    searchMessage = "";
    try {
      const url = new URL(`${api}/pregnancy/foods`);
      url.searchParams.set("q", query.trim());
      const response = await fetch(url);
      const result = (await response.json()) as { foods?: Food[] };
      if (!response.ok) throw new Error("Ingredient search failed.");
      results = (result.foods ?? []).filter(
        (food) =>
          Object.keys(food.nutrients ?? {}).some((key) => nutrientLabels[key]),
      );
      if (!results.length)
        searchMessage = "No measured matches found. Try another ingredient name (e.g. beans, fish, spinach).";
    } catch (err) {
      searchMessage = err instanceof Error ? err.message : "Search failed.";
    } finally {
      searching = false;
    }
  }

  function addIngredient() {
    if (!selected || !Number.isFinite(grams) || grams <= 0 || grams > 5000) return;
    const factor = grams / (selected.nutrientBasisGrams ?? 100);
    const nutrients = Object.fromEntries(
      Object.entries(selected.nutrients)
        .filter(([key, value]) => nutrientLabels[key] && Number.isFinite(value))
        .map(([key, value]) => [key, Math.round(value * factor * 100) / 100]),
    );
    ingredients = [
      ...ingredients,
      {
        id: crypto.randomUUID(),
        name: selected.label,
        grams,
        source: selected.source ?? "Nutrient database",
        nutrients,
      },
    ];
    selected = null;
    query = "";
    results = [];
  }

  function removeIngredient(id: string) {
    ingredients = ingredients.filter((item) => item.id !== id);
  }

  async function saveToMealLog() {
    if (!ingredients.length || !recipeName.trim() || savingMeal) return;
    savingMeal = true;
    actionFeedback = "";
    try {
      const token = sessionToken();
      if (!token) {
        actionFeedback = "Please sign in to log meals to your account.";
        return;
      }
      const response = await fetch(`${api}/records/meals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          foodName: recipeName.trim(),
          mealType: recipeMeal,
          servingGrams: String(Math.round(totalWeight / servings)),
          nutrients: perServing,
          source: `Recipe Builder · ${recipeCategory}`,
          note: `Custom recipe: ${ingredients.map((item) => `${item.name} (${item.grams}g)`).join(", ")}`,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        actionFeedback = err.message ?? "Could not save recipe to meal log.";
        return;
      }
      actionFeedback = `✓ "${recipeName}" logged to your Food Journal as ${recipeMeal}!`;
      setTimeout(() => (actionFeedback = ""), 4500);
    } catch {
      actionFeedback = "Network error. Please try again.";
    } finally {
      savingMeal = false;
    }
  }

  function saveToCollection() {
    if (!ingredients.length || !recipeName.trim() || savingCollection) return;
    savingCollection = true;
    try {
      const newRecipe: SavedRecipe = {
        id: crypto.randomUUID(),
        name: recipeName.trim(),
        category: recipeCategory,
        servings,
        mealType: recipeMeal,
        ingredients: [...ingredients],
        totalWeight,
        totals,
        createdAt: new Date().toISOString(),
      };
      savedRecipes = [newRecipe, ...savedRecipes.filter((r) => r.name !== newRecipe.name)].slice(0, 15);
      localStorage.setItem("sabi-saved-recipes", JSON.stringify(savedRecipes));
      actionFeedback = `✓ "${recipeName}" saved to your recipe collection!`;
      setTimeout(() => (actionFeedback = ""), 4000);
    } finally {
      savingCollection = false;
    }
  }

  function restoreSavedRecipe(recipe: SavedRecipe) {
    recipeName = recipe.name;
    recipeCategory = recipe.category;
    servings = recipe.servings;
    recipeMeal = recipe.mealType;
    ingredients = [...recipe.ingredients];
    actionFeedback = `Restored "${recipe.name}"!`;
    setTimeout(() => (actionFeedback = ""), 3000);
  }

  function deleteSavedRecipe(id: string) {
    savedRecipes = savedRecipes.filter((r) => r.id !== id);
    localStorage.setItem("sabi-saved-recipes", JSON.stringify(savedRecipes));
  }
</script>

<div class="space-y-6" aria-labelledby="recipe-builder-title">
  <!-- Header Banner -->
  <div class="p-6 rounded-3xl bg-linear-to-br from-[#ffffff] via-[#fbfbf8] to-[#f4f7f2] border border-[#d6e5d2] shadow-xs">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#809474]/15 border border-[#809474]/30 text-xs font-bold text-[#475842] uppercase tracking-wider">
        <i class="iconoir-sparks text-xs text-[#809474]"></i>
        <span>NIGERIAN RECIPE NUTRIENT BUILDER</span>
      </span>
      <span class="text-xs text-[#72746b] bg-white border border-[#e7e4dc] px-3 py-1 rounded-full font-medium">
        Week {week} Assessment
      </span>
    </div>

    <h2 id="recipe-builder-title" class="font-serif text-2xl sm:text-3xl font-semibold text-[#2b2c28] mb-2">
      Build, Review &amp; Measure Your Recipe
    </h2>
    <p class="text-xs sm:text-sm text-[#525547] leading-relaxed max-w-3xl">
      Create your authentic family dishes by combining measured Nigerian ingredients. Sabi computes the exact micronutrients and reviews your dish against <em>Your Pregnancy Week by Week</em> standards for Week {week}.
    </p>

    <!-- Quick Load Templates -->
    <div class="pt-4 mt-4 border-t border-[#edeae1]">
      <span class="text-xs font-bold text-[#475842] uppercase tracking-wider block mb-2">
        Quick start with classic Nigerian recipes:
      </span>
      <div class="flex flex-wrap gap-2">
        {#each recipePresets as preset}
          <button
            type="button"
            onclick={() => loadPreset(preset)}
            class="text-xs font-medium px-3.5 py-1.5 rounded-xl bg-white border border-[#dedad0] text-[#2b2c28] hover:border-[#809474] hover:bg-[#edf5eb] transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
          >
            <span class="text-[#809474] font-bold">+</span>
            <span>{preset.name}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Main Grid: Builder (Left 7) & Review/Preview (Right 5) -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    <!-- Left Column: Recipe Configuration & Ingredients -->
    <div class="lg:col-span-7 space-y-6">
      <!-- 1. Recipe Details Card -->
      <section class="rounded-3xl bg-white border border-[#e7e4dc] p-6 shadow-xs space-y-4">
        <div class="flex items-center gap-2 pb-3 border-b border-[#f0ede6]">
          <div class="w-8 h-8 rounded-lg bg-[#809474]/15 flex items-center justify-center text-[#475842]">
            <i class="iconoir-organic-food text-base"></i>
          </div>
          <div>
            <h3 class="font-serif text-base font-semibold text-[#2b2c28]">1. Recipe Details</h3>
            <span class="text-xs text-[#72746b]">Define what you are preparing</span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div class="sm:col-span-2">
            <label for="recipe-title-input" class="block text-xs font-bold text-[#55574f] uppercase tracking-wider mb-1">
              Recipe Name
            </label>
            <input
              id="recipe-title-input"
              bind:value={recipeName}
              placeholder="e.g. Mama's Egusi & Ugu Soup"
              maxlength="120"
              class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dedad0] bg-[#faf9f6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#809474]/40"
            />
          </div>

          <div>
            <label for="recipe-cat-select" class="block text-xs font-bold text-[#55574f] uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              id="recipe-cat-select"
              bind:value={recipeCategory}
              class="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#dedad0] bg-[#faf9f6] focus:bg-white focus:outline-none"
            >
              <option>Soup & Stew</option>
              <option>Swallow</option>
              <option>Porridge / Pottage</option>
              <option>Rice & Grains</option>
              <option>Breakfast & Pap</option>
              <option>Snack & Beverage</option>
            </select>
          </div>

          <div>
            <label for="recipe-servings-select" class="block text-xs font-bold text-[#55574f] uppercase tracking-wider mb-1">
              Planned Portions (Servings)
            </label>
            <select
              id="recipe-servings-select"
              bind:value={servings}
              class="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#dedad0] bg-[#faf9f6] focus:bg-white focus:outline-none"
            >
              <option value={1}>1 portion (single serving)</option>
              <option value={2}>2 portions</option>
              <option value={3}>3 portions</option>
              <option value={4}>4 portions (family pot)</option>
              <option value={6}>6 portions (large batch)</option>
            </select>
          </div>
        </div>
      </section>

      <!-- 2. Add Ingredients Form -->
      <section class="rounded-3xl bg-white border border-[#e7e4dc] p-6 shadow-xs space-y-4">
        <div class="flex items-center gap-2 pb-3 border-b border-[#f0ede6]">
          <div class="w-8 h-8 rounded-lg bg-[#809474]/15 flex items-center justify-center text-[#475842]">
            <i class="iconoir-search text-base"></i>
          </div>
          <div>
            <h3 class="font-serif text-base font-semibold text-[#2b2c28]">2. Add Ingredients &amp; Grams</h3>
            <span class="text-xs text-[#72746b]">Search FAO/INFOODS verified West African database</span>
          </div>
        </div>

        <!-- Search Form -->
        <form
          class="flex flex-col sm:flex-row gap-2"
          onsubmit={(e) => {
            e.preventDefault();
            void search();
          }}
        >
          <input
            bind:value={query}
            placeholder="Search e.g. ugu, beans, yam, catfish…"
            class="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-[#dedad0] bg-[#faf9f6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#809474]/40"
          />
          <button
            type="submit"
            disabled={searching}
            class="py-2.5 px-4 text-xs font-semibold rounded-xl bg-[#809474] text-white hover:bg-[#6c8060] disabled:opacity-50 transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
          >
            {#if searching}
              <i class="iconoir-refresh animate-spin text-xs"></i>
              <span>Searching…</span>
            {:else}
              <i class="iconoir-search text-xs"></i>
              <span>Find Ingredient</span>
            {/if}
          </button>
        </form>

        <!-- Quick Staple Tags -->
        <div class="flex flex-wrap items-center gap-1.5 pt-1">
          <span class="text-[11px] font-bold text-[#888b7c] mr-1 uppercase">Quick:</span>
          {#each quickIngredients as quick}
            <button
              type="button"
              onclick={() => {
                query = quick.name;
                void search();
              }}
              class="px-2.5 py-1 text-[11px] rounded-lg bg-[#faf9f6] border border-[#e2ded5] text-[#55574f] hover:border-[#809474] hover:bg-[#edf5eb] cursor-pointer"
            >
              {quick.name}
            </button>
          {/each}
        </div>

        {#if searchMessage}
          <p class="text-xs text-[#af705a] bg-[#fdf4f0] p-2.5 rounded-xl border border-[#f4cfc4]">
            {searchMessage}
          </p>
        {/if}

        <!-- Search Results List -->
        {#if results.length}
          <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1 border border-[#eeece6] rounded-2xl p-2 bg-[#faf9f6]">
            {#each results as food (food.id)}
              <button
                type="button"
                class="w-full text-left p-2.5 rounded-xl border text-xs transition-colors cursor-pointer {selected?.id === food.id ? 'bg-[#edf5eb] border-[#809474]' : 'bg-white border-[#e7e4dc] hover:bg-[#faf9f6]'}"
                onclick={() => (selected = food)}
              >
                <strong class="font-semibold text-[#2b2c28] block">{food.label}</strong>
                <small class="text-[#888b7c]">{food.source} · {food.category || "Ingredient"}</small>
              </button>
            {/each}
          </div>
        {/if}

        <!-- Selected Ingredient Gram Portions Form -->
        {#if selected}
          <div class="p-4 rounded-2xl bg-[#edf5eb] border border-[#c6dfc0] space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <strong class="text-xs font-bold text-[#385a38] block">{selected.label}</strong>
                <span class="text-[11px] text-[#55574f]">Specify measured raw or cooked portion</span>
              </div>
              <button
                type="button"
                onclick={() => (selected = null)}
                class="text-xs text-[#8e9083] hover:text-[#2b2c28]"
              >
                Cancel
              </button>
            </div>

            <div class="flex items-center gap-3">
              <label for="portion-grams-input" class="text-xs font-semibold text-[#2b2c28] shrink-0">
                Portion Weight (grams):
              </label>
              <input
                id="portion-grams-input"
                type="number"
                min="5"
                max="5000"
                step="5"
                bind:value={grams}
                class="w-24 px-3 py-1.5 text-xs rounded-xl border border-[#dedad0] bg-white font-semibold text-center"
              />
              <button
                type="button"
                onclick={addIngredient}
                class="py-2 px-4 text-xs font-semibold rounded-xl bg-[#809474] text-white hover:bg-[#6c8060] transition-colors cursor-pointer shadow-2xs"
              >
                + Add to Recipe
              </button>
            </div>
          </div>
        {/if}

        <!-- Current Ingredients Table -->
        <div class="pt-3 border-t border-[#f0ede6] space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-[#55574f] uppercase tracking-wider">
              Included Ingredients ({ingredients.length})
            </span>
            <span class="text-xs text-[#888b7c]">Total Weight: {totalWeight}g</span>
          </div>

          {#if ingredients.length === 0}
            <div class="p-6 text-center rounded-2xl bg-[#faf9f6] border border-dashed border-[#dedad0] text-xs text-[#8e9083]">
              No ingredients added yet. Pick a classic preset above or search ingredients to build your recipe.
            </div>
          {:else}
            <div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {#each ingredients as item (item.id)}
                <div class="p-2.5 rounded-xl bg-[#faf9f6] border border-[#eeece6] flex items-center justify-between gap-3 text-xs">
                  <div>
                    <strong class="font-semibold text-[#2b2c28] block">{item.name}</strong>
                    <span class="text-[#72746b]">{item.grams} grams · <small class="text-[#8e9083]">{item.source}</small></span>
                  </div>
                  <button
                    type="button"
                    onclick={() => removeIngredient(item.id)}
                    class="text-[#af705a] hover:underline cursor-pointer font-medium text-xs shrink-0"
                  >
                    Remove
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </section>
    </div>

    <!-- Right Column: Clinical Review & Action Hub -->
    <div class="lg:col-span-5 space-y-6">
      <!-- Clinical Healthiness Assessment Card -->
      <section class="rounded-3xl bg-white border border-[#e7e4dc] p-6 shadow-xs space-y-4">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[11px] font-bold tracking-wider text-[#888b7c] uppercase">PREGNANCY FIT REVIEW</span>
          <span class="text-xs font-bold px-2.5 py-0.5 rounded-full border {clinicalAssessment.color}">
            {clinicalAssessment.badge}
          </span>
        </div>

        <h3 class="font-serif text-lg font-semibold text-[#2b2c28]">
          Week {week} Healthiness Check
        </h3>
        <p class="text-xs text-[#525547] leading-relaxed">
          {clinicalAssessment.summary}
        </p>

        <!-- Warnings & Contraindications -->
        {#if clinicalAssessment.warnings.length}
          <div class="p-3.5 rounded-2xl bg-[#fdf4f0] border border-[#f4cfc4] space-y-2">
            <strong class="text-xs font-bold text-[#9c2d15] uppercase tracking-wider flex items-center gap-1.5">
              <i class="iconoir-warning-triangle text-sm text-[#af705a]"></i>
              Pregnancy Safety Cautions & Alerts:
            </strong>
            <ul class="text-xs text-[#6e2b1d] space-y-2">
              {#each clinicalAssessment.warnings as warn}
                <li class="flex items-start gap-2">
                  <span class="text-[#af705a] font-bold text-sm leading-none mt-0.5">⚠️</span>
                  <span class="leading-relaxed">{warn}</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- Week-Specific Nutrient Gaps -->
        {#if clinicalAssessment.gaps.length}
          <div class="p-3.5 rounded-2xl bg-[#fef9e7] border border-[#e9d27a] space-y-2">
            <strong class="text-xs font-bold text-[#7c440a] uppercase tracking-wider flex items-center gap-1.5">
              <i class="iconoir-info-circle text-sm text-[#b8860b]"></i>
              Week {week} Nutritional Opportunities:
            </strong>
            <ul class="text-xs text-[#523910] space-y-1.5">
              {#each clinicalAssessment.gaps as gap}
                <li class="flex items-start gap-2">
                  <span class="text-[#b8860b] font-bold text-sm leading-none mt-0.5">ℹ</span>
                  <span class="leading-relaxed">{gap}</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- Key Nutritional Strengths -->
        {#if clinicalAssessment.highlights.length}
          <div class="p-3.5 rounded-2xl bg-[#faf9f6] border border-[#eeece6] space-y-2">
            <strong class="text-xs font-bold text-[#475842] uppercase tracking-wider block">Key Nutritional Strengths:</strong>
            <ul class="text-xs text-[#2e3b2c] space-y-1.5">
              {#each clinicalAssessment.highlights as item}
                <li class="flex items-start gap-2">
                  <span class="text-[#809474] font-bold mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        <div class="text-[11px] text-[#72746b] leading-relaxed bg-[#fbfbf8] p-3 rounded-xl border border-[#edeae1]">
          {clinicalAssessment.safetyCheck}
        </div>
      </section>

      <!-- Nutrient Breakdown Card -->
      <section class="rounded-3xl bg-white border border-[#e7e4dc] p-6 shadow-xs space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[#f0ede6]">
          <div>
            <h3 class="font-serif text-base font-semibold text-[#2b2c28]">Calculated Nutrition</h3>
            <span class="text-xs text-[#72746b]">Per single serving ({servings > 0 ? Math.round(totalWeight / servings) : totalWeight}g)</span>
          </div>
          <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-[#809474]/10 text-[#475842]">
            {servings} serving{servings === 1 ? "" : "s"}
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {#each Object.entries(perServing).filter(([key]) => nutrientLabels[key]) as [key, value]}
            <div class="p-2.5 rounded-xl bg-[#faf9f6] border border-[#edeae1]">
              <span class="text-[10px] font-bold uppercase text-[#888b7c] block">{nutrientLabels[key]}</span>
              <strong class="text-sm font-semibold text-[#2b2c28]">
                {value.toFixed(1)} <small class="text-[10px] text-[#72746b]">{key.endsWith("Mg") ? "mg" : key.endsWith("Mcg") ? "µg" : "g"}</small>
              </strong>
            </div>
          {/each}
        </div>

        <!-- Action Buttons -->
        <div class="space-y-2.5 pt-3 border-t border-[#f0ede6]">
          <div class="flex items-center gap-2">
            <label for="recipe-log-meal-type" class="text-xs font-semibold text-[#55574f] shrink-0">Log as:</label>
            <select
              id="recipe-log-meal-type"
              bind:value={recipeMeal}
              class="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[#dedad0] bg-[#faf9f6]"
            >
              <option>Breakfast</option>
              <option>Lunch</option>
              <option>Dinner</option>
              <option>Snack</option>
            </select>
          </div>

          <button
            type="button"
            disabled={savingMeal || !ingredients.length}
            onclick={saveToMealLog}
            class="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-[#809474] text-white hover:bg-[#6c8060] disabled:opacity-50 transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
          >
            {#if savingMeal}
              <i class="iconoir-refresh animate-spin text-sm"></i>
              <span>Logging to Food Journal…</span>
            {:else}
              <i class="iconoir-plus text-sm"></i>
              <span>Log Recipe to Food Journal</span>
            {/if}
          </button>

          <button
            type="button"
            disabled={savingCollection || !ingredients.length}
            onclick={saveToCollection}
            class="w-full py-2 px-4 text-xs font-semibold rounded-xl bg-[#faf9f6] border border-[#dedad0] text-[#475842] hover:bg-[#f2efe9] disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {#if savingCollection}
              <i class="iconoir-refresh animate-spin text-xs"></i>
              <span>Saving Recipe…</span>
            {:else}
              <i class="iconoir-bookmark text-xs"></i>
              <span>Save to My Recipe Collection</span>
            {/if}
          </button>
        </div>

        {#if actionFeedback}
          <div class="p-3 rounded-xl bg-[#edf5eb] border border-[#c6dfc0] text-xs font-medium text-[#385a38] flex items-center gap-2 animate-fade-in" role="status">
            <i class="iconoir-check-circle text-sm text-[#475842]"></i>
            <span>{actionFeedback}</span>
          </div>
        {/if}
      </section>

      <!-- Saved Recipes Drawer / History -->
      {#if savedRecipes.length > 0}
        <section class="rounded-3xl bg-white border border-[#e7e4dc] p-6 shadow-xs space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-[#f0ede6]">
            <h4 class="font-serif text-base font-semibold text-[#2b2c28]">My Saved Recipes ({savedRecipes.length})</h4>
            <span class="text-[11px] text-[#888b7c]">Tap to restore</span>
          </div>

          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            {#each savedRecipes as saved (saved.id)}
              <div class="p-2.5 rounded-xl bg-[#faf9f6] border border-[#eeece6] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onclick={() => restoreSavedRecipe(saved)}
                  class="text-left flex-1 min-w-0 cursor-pointer hover:underline"
                >
                  <strong class="text-xs font-semibold text-[#2b2c28] block truncate">{saved.name}</strong>
                  <span class="text-[10px] text-[#72746b]">{saved.ingredients.length} ingredients · {saved.totalWeight}g</span>
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${saved.name}`}
                  onclick={() => deleteSavedRecipe(saved.id)}
                  class="text-[11px] text-[#af705a] hover:underline cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </div>
            {/each}
          </div>
        </section>
      {/if}
    </div>
  </div>
</div>
