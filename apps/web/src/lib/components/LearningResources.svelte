<script lang="ts">
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

<div class="space-y-8">
  <!-- Medication Safety Hub -->
  <section class="rounded-3xl bg-white border border-[#e7e4dc] p-6 sm:p-8 shadow-xs space-y-6" aria-labelledby="meds-heading">
    <div class="flex items-center gap-3 pb-4 border-b border-[#f0ede6]">
      <div class="w-10 h-10 rounded-xl bg-[#af705a]/15 text-[#af705a] flex items-center justify-center text-xl">
        <i class="iconoir-shield-check"></i>
      </div>
      <div>
        <span class="text-[11px] font-bold tracking-widest text-[#888b7c] uppercase">SAFETY FIRST</span>
        <h2 id="meds-heading" class="font-serif text-xl sm:text-2xl font-semibold text-[#2b2c28]">Medication Safety During Pregnancy</h2>
        <p class="text-xs text-[#72746b]">
          Before taking any pill, tea, or remedy, understand how it affects you and your baby. When in doubt, confirm with your midwife.
        </p>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
      <div class="relative flex-1 max-w-md">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search 50+ medicines, supplements, or symptoms…"
          class="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm rounded-xl border border-[#dedad0] bg-[#faf9f6] placeholder-[#9a988f] focus:outline-none focus:ring-2 focus:ring-[#809474]/40 focus:bg-white"
        />
        <span class="absolute left-3 top-3 text-xs text-[#8e9083]">
          <i class="iconoir-search"></i>
        </span>
        {#if searchQuery}
          <button
            type="button"
            onclick={() => (searchQuery = "")}
            class="absolute right-3 top-3 text-xs text-[#8e9083] hover:text-[#30312c]"
          >
            ✕
          </button>
        {/if}
      </div>

      <div class="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter medications by safety level">
        <button
          class="px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer {medFilter === 'all' ? 'bg-[#30312c] text-white shadow-xs' : 'bg-[#faf9f6] text-[#72746b] border border-[#e7e4dc] hover:border-[#809474]'}"
          onclick={() => (medFilter = "all")}
        >
          All ({medications.length})
        </button>
        <button
          class="px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer {medFilter === 'safe' ? 'bg-[#475842] text-white shadow-xs' : 'bg-[#edf5eb] text-[#385a38] border border-[#c6dfc0] hover:border-[#475842]'}"
          onclick={() => (medFilter = "safe")}
        >
          ✓ Safe ({safeCount})
        </button>
        <button
          class="px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer {medFilter === 'caution' ? 'bg-[#b45309] text-white shadow-xs' : 'bg-[#fef9e7] text-[#8a6820] border border-[#e9d27a] hover:border-[#b45309]'}"
          onclick={() => (medFilter = "caution")}
        >
          ! Caution ({cautionCount})
        </button>
        <button
          class="px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer {medFilter === 'avoid' ? 'bg-[#af705a] text-white shadow-xs' : 'bg-[#fdf4f0] text-[#9c2d15] border border-[#f4cfc4] hover:border-[#af705a]'}"
          onclick={() => (medFilter = "avoid")}
        >
          ✕ Avoid ({avoidCount})
        </button>
      </div>
    </div>

    <!-- Medication Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[600px] overflow-y-auto pr-1">
      {#each filteredMeds as med}
        <article class="p-4 rounded-2xl border transition-all {med.category === 'safe' ? 'bg-white border-[#dce5d6]' : med.category === 'caution' ? 'bg-white border-[#fae5b8]' : 'bg-white border-[#f6d2ca]'}">
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider {med.category === 'safe' ? 'bg-[#edf5eb] text-[#385a38]' : med.category === 'caution' ? 'bg-[#fef9e7] text-[#8a6820]' : 'bg-[#fdf4f0] text-[#9c2d15]'}">
              {#if med.category === "safe"}✓ Generally Safe
              {:else if med.category === "caution"}! Caution
              {:else}✕ Avoid{/if}
            </span>
            <span class="text-[11px] font-medium text-[#888b7c]">{med.tag}</span>
          </div>

          <h3 class="font-serif text-base font-semibold text-[#2b2c28] mb-0.5">{med.name}</h3>
          <span class="block text-xs font-medium text-[#809474] mb-2">{med.use}</span>
          <p class="text-xs text-[#525547] leading-relaxed">{med.guidance}</p>
        </article>
      {/each}
    </div>

    <!-- Agbo Warning Banner -->
    <div class="p-4 rounded-2xl bg-[#fef9e7] border border-[#e9d27a] flex items-start gap-3">
      <div class="w-8 h-8 rounded-lg bg-[#b45309]/15 flex items-center justify-center shrink-0 text-[#b45309]">
        <i class="iconoir-warning-triangle text-base"></i>
      </div>
      <div>
        <strong class="font-serif text-sm font-semibold text-[#7c440a] block">
          A Crucial Clinical Note on Traditional Concoctions (Agbo)
        </strong>
        <p class="text-xs text-[#6e461b] mt-1 leading-relaxed">
          Many traditional herbs and herbal concoctions contain compounds that can cause the uterus to
          contract prematurely or stress fetal kidney function. In modern maternity care in Nigeria,
          clinicians strongly advise pausing all unstandardized herbal mixtures throughout pregnancy.
        </p>
      </div>
    </div>
  </section>

  <!-- Regional Nigerian Food Wisdom -->
  <section class="rounded-3xl bg-white border border-[#e7e4dc] p-6 sm:p-8 shadow-xs space-y-6" aria-labelledby="food-wisdom-heading">
    <div class="flex items-center gap-3 pb-4 border-b border-[#f0ede6]">
      <div class="w-10 h-10 rounded-xl bg-[#809474]/15 text-[#385a38] flex items-center justify-center text-xl">
        <i class="iconoir-apple-half"></i>
      </div>
      <div>
        <span class="text-[11px] font-bold tracking-widest text-[#888b7c] uppercase">CULTURAL NUTRITION</span>
        <h2 id="food-wisdom-heading" class="font-serif text-xl sm:text-2xl font-semibold text-[#2b2c28]">Regional Nigerian Food Guides</h2>
        <p class="text-xs text-[#72746b]">
          Nourishing meals from across our six geopolitical zones that deliver essential micronutrients for pregnancy.
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each foods as food}
        <article class="p-4 rounded-2xl bg-[#faf9f6] border border-[#eeece6] space-y-2">
          <h4 class="font-serif text-base font-semibold text-[#2b2c28]">{food.name}</h4>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#809474]/10 text-xs font-semibold text-[#475842]">
            <span class="w-1.5 h-1.5 rounded-full bg-[#809474]"></span>
            <span>{food.nutrients}</span>
          </div>
          <p class="text-xs text-[#525547] leading-relaxed">{food.detail}</p>
        </article>
      {/each}
    </div>
  </section>
</div>
