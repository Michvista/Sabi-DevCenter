<script lang="ts">
  import {
    Alert02Icon,
    CheckmarkCircle02Icon,
    Restaurant02Icon,
    Shield01Icon,
    InformationCircleIcon,
  } from "@hugeicons/core-free-icons";
  import { HugeiconsIcon } from "@hugeicons/svelte";

  import { comprehensiveMedications } from "../data/medications-data";

  let medFilter = $state<"all" | "safe" | "caution" | "avoid">("all");
  let searchQuery = $state("");

  const medications = comprehensiveMedications;

  let safeCount = $derived(medications.filter((m) => m.category === "safe").length);
  let cautionCount = $derived(medications.filter((m) => m.category === "caution").length);
  let avoidCount = $derived(medications.filter((m) => m.category === "avoid").length);

  let filteredMeds = $derived(
    medications.filter((m) => {
      const matchesCategory = medFilter === "all" || m.category === medFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.use.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tag.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }),
  );

  const foods = [
    {
      name: "North West · Tuwo Shinkafa & Miyan Kuka",
      nutrients: "Fibre, Iron, Calcium from dried baobab leaves",
      detail:
        "Baobab leaves (kuka) are naturally rich in calcium and iron. Prepare with clean filtered water, lean meats or dried fish, and cook thoroughly.",
    },
    {
      name: "North East · Millet Porridge & Brown Beans",
      nutrients: "Folate, Plant Protein, Complex Carbohydrates",
      detail:
        "Millet provides sustained energy without spiking blood sugar. Brown beans provide plant protein and dietary folate for early fetal development.",
    },
    {
      name: "North Central · Yam & Steamed Leafy Soups",
      nutrients: "Potassium, Vitamin B6, Fibre",
      detail:
        "Pair boiled yam with dark green leafy sauces. Wash greens thoroughly under running water to remove soil residue before cooking.",
    },
    {
      name: "South West · Moi-Moi & Steamed Fish",
      nutrients: "Lean Protein, Iron, B Vitamins",
      detail:
        "Steamed moi-moi wrapped in leaves is gentle on the stomach and rich in digestible protein. Incorporate flaked mackerel for essential omega-3 fatty acids.",
    },
    {
      name: "South East · Ofe Onugbu (Bitterleaf) & Okra",
      nutrients: "Zinc, Folate, Soluble Fibre",
      detail:
        "Wash bitterleaf well to temper bitterness. Okra provides mucilaginous fibre that supports healthy bowel movements and prevents pregnancy constipation.",
    },
    {
      name: "South South · Afang Soup & Fresh Catfish",
      nutrients: "Iron, Vitamin A, Protein, Omega-3",
      detail:
        "Afang and waterleaf soup is exceptionally nutrient-dense. Use well-cleaned seafood and cook until piping hot.",
    },
    {
      name: "Everyday Nigerian Staples · Rolled Oats, Garri, Plantain",
      nutrients: "Fibre, Potassium, Complex Energy",
      detail:
        "Boiled unripe plantain is high in iron and potassium. Rolled oats with warm milk provide a steady breakfast that eases morning nausea.",
    },
  ];
</script>

<div class="learning-hub">
  <!-- Medication Safety Hub -->
  <section class="learning-section med-safety-section" aria-labelledby="meds-heading">
    <div class="learning-section-header">
      <div class="header-icon-wrap amber">
        <HugeiconsIcon icon={Shield01Icon} size={22} />
      </div>
      <div>
        <span class="hub-eyebrow">SAFETY FIRST</span>
        <h2 id="meds-heading">Medication Safety During Pregnancy</h2>
        <p>
          Before taking any pill, tea, or remedy, understand how it affects you and your baby.
          When in doubt, always confirm with your midwife or pharmacist.
        </p>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="mb-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
      <div class="relative flex-1 max-w-md">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search 50+ medicines, supplements, or symptoms…"
          class="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#e2dfd5] bg-white placeholder-[#8e9083] focus:outline-none focus:ring-2 focus:ring-[#809474]/40"
        />
        <span class="absolute left-3 top-2.5 text-xs text-[#8e9083]">🔍</span>
        {#if searchQuery}
          <button
            type="button"
            onclick={() => (searchQuery = "")}
            class="absolute right-3 top-2.5 text-xs text-[#8e9083] hover:text-[#30312c]"
          >
            ✕
          </button>
        {/if}
      </div>

      <div class="med-filters" role="tablist" aria-label="Filter medications by safety level">
        <button
          class="filter-pill"
          class:active={medFilter === "all"}
          onclick={() => (medFilter = "all")}
        >
          All ({medications.length})
        </button>
        <button
          class="filter-pill pill-safe"
          class:active={medFilter === "safe"}
          onclick={() => (medFilter = "safe")}
        >
          🟢 Safe ({safeCount})
        </button>
        <button
          class="filter-pill pill-caution"
          class:active={medFilter === "caution"}
          onclick={() => (medFilter = "caution")}
        >
          🟡 Caution ({cautionCount})
        </button>
        <button
          class="filter-pill pill-avoid"
          class:active={medFilter === "avoid"}
          onclick={() => (medFilter = "avoid")}
        >
          🔴 Avoid ({avoidCount})
        </button>
      </div>
    </div>

    <!-- Medication Cards Grid -->
    <div class="med-cards-grid">
      {#each filteredMeds as med}
        <article class="med-card {med.category}-card">
          <div class="med-card-top">
            <span class="med-badge {med.category}">
              {#if med.category === "safe"}✓ Generally Safe
              {:else if med.category === "caution"}! Caution
              {:else}✕ Strictly Avoid{/if}
            </span>
            <span class="med-tag">{med.tag}</span>
          </div>

          <h3 class="med-name">{med.name}</h3>
          <span class="med-use">{med.use}</span>
          <p class="med-guidance">{med.guidance}</p>
        </article>
      {/each}
    </div>

    <div class="med-warning-banner">
      <div class="warning-icon">
        <HugeiconsIcon icon={Alert02Icon} size={20} />
      </div>
      <div>
        <strong>A Crucial Clinical Note on Traditional Concoctions (Agbo)</strong>
        <p>
          Many traditional herbs and herbal concoctions contain compounds that can cause the uterus to
          contract prematurely or stress fetal kidney function. In modern maternity care in Nigeria,
          clinicians strongly advise pausing all unstandardized herbal mixtures throughout pregnancy.
        </p>
      </div>
    </div>
  </section>

  <!-- Regional Nigerian Food Wisdom -->
  <section class="learning-section food-wisdom-section" aria-labelledby="food-wisdom-heading">
    <div class="learning-section-header">
      <div class="header-icon-wrap green">
        <HugeiconsIcon icon={Restaurant02Icon} size={22} />
      </div>
      <div>
        <span class="hub-eyebrow">CULTURAL NUTRITION</span>
        <h2 id="food-wisdom-heading">Regional Nigerian Food Guides</h2>
        <p>
          Nourishing meals from across our six geopolitical zones that deliver essential micronutrients for pregnancy.
        </p>
      </div>
    </div>

    <div class="food-examples-grid">
      {#each foods as food}
        <article class="food-example-card">
          <div class="food-card-title-row">
            <h4>{food.name}</h4>
          </div>
          <div class="food-nutri-tag">
            <span>✨ {food.nutrients}</span>
          </div>
          <p>{food.detail}</p>
        </article>
      {/each}
    </div>
  </section>
</div>
