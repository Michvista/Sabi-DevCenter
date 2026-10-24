<script lang="ts">
  import {
    Alert02Icon,
    CheckmarkCircle02Icon,
    Restaurant02Icon,
    Shield01Icon,
    InformationCircleIcon,
  } from "@hugeicons/core-free-icons";
  import { HugeiconsIcon } from "@hugeicons/svelte";

  let medFilter = $state<"all" | "safe" | "caution" | "avoid">("all");

  const medications = [
    {
      category: "safe",
      name: "Paracetamol",
      use: "Mild to moderate pain, headache, and fever reduction",
      status: "Generally Safe",
      guidance: "Widely considered the safest first-line pain reliever during pregnancy. Always use the lowest effective dose and do not exceed daily limits.",
      tag: "First-line option",
    },
    {
      category: "safe",
      name: "Folic Acid & Iron Supplements",
      use: "Neural tube defect prevention & maternal anaemia prevention",
      status: "Essential Routine Care",
      guidance: "Take daily as prescribed at your antenatal clinic. Best taken with water or citrus juice (Vitamin C enhances iron absorption).",
      tag: "Antenatal standard",
    },
    {
      category: "safe",
      name: "Antacids (Calcium-based)",
      use: "Occasional pregnancy heartburn and indigestion",
      status: "Safe with Guidance",
      guidance: "Calcium carbonate antacids are generally safe. Avoid formulations high in sodium or aluminium unless cleared by your midwife.",
      tag: "Digestive comfort",
    },
    {
      category: "caution",
      name: "Antimalarials (ACTs / Coartem)",
      use: "Treatment of confirmed malaria in pregnancy",
      status: "Prescription Only",
      guidance: "Malaria in pregnancy is dangerous and must be treated promptly. Artemisinin-based combinations (ACTs) are recommended in the 2nd and 3rd trimesters under medical oversight.",
      tag: "Clinician oversight",
    },
    {
      category: "caution",
      name: "SP (Fansidar) for IPTp",
      use: "Intermittent preventive treatment of malaria",
      status: "Clinic Scheduled",
      guidance: "Given directly by nurses/midwives at antenatal clinics starting from the second trimester (after quickening), spaced at least 4 weeks apart.",
      tag: "Routine clinic dose",
    },
    {
      category: "caution",
      name: "Antihistamines (Chlorpheniramine)",
      use: "Allergies and severe skin itching",
      status: "Check with Doctor",
      guidance: "Some older antihistamines have established safety records, but check with your doctor before taking, and avoid combination cold medicines containing decongestants.",
      tag: "Doctor consult",
    },
    {
      category: "avoid",
      name: "Ibuprofen, Diclofenac & NSAIDs",
      use: "Pain relief and inflammation",
      status: "Strictly Avoid",
      guidance: "Avoid, especially in the 3rd trimester. Can cause premature closure of the fetal ductus arteriosus and reduce amniotic fluid levels.",
      tag: "Risk to baby",
    },
    {
      category: "avoid",
      name: "Tetracycline & Doxycycline",
      use: "Certain bacterial infections",
      status: "Strictly Avoid",
      guidance: "Can cause permanent discolouration of developing fetal teeth and impair skeletal bone development.",
      tag: "Bone/teeth harm",
    },
    {
      category: "avoid",
      name: "Herbal Concoctions (Agbo / Traditional Herbs)",
      use: "Traditional remedies, cleansers, or teas",
      status: "Strictly Avoid",
      guidance: "Unstandardized doses, unknown chemical constituents, and potential uterine-stimulating herbs can trigger premature contractions, bleeding, or toxic effects.",
      tag: "Unsafe in pregnancy",
    },
  ];

  let filteredMeds = $derived(
    medFilter === "all" ? medications : medications.filter((m) => m.category === medFilter),
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

    <!-- Filter Pills -->
    <div class="med-filters" role="tablist" aria-label="Filter medications by safety level">
      <button
        class="filter-pill"
        class:active={medFilter === "all"}
        onclick={() => (medFilter = "all")}
      >
        All Common Medicines ({medications.length})
      </button>
      <button
        class="filter-pill pill-safe"
        class:active={medFilter === "safe"}
        onclick={() => (medFilter = "safe")}
      >
        🟢 Generally Safe (3)
      </button>
      <button
        class="filter-pill pill-caution"
        class:active={medFilter === "caution"}
        onclick={() => (medFilter = "caution")}
      >
        🟡 Caution / Clinic Only (3)
      </button>
      <button
        class="filter-pill pill-avoid"
        class:active={medFilter === "avoid"}
        onclick={() => (medFilter = "avoid")}
      >
        🔴 Strictly Avoid (3)
      </button>
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
