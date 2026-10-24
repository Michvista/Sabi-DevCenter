<script lang="ts">
  import {
    Alert02Icon,
    CheckmarkCircle02Icon,
    Restaurant02Icon,
  } from "@hugeicons/core-free-icons";
  import { HugeiconsIcon } from "@hugeicons/svelte";

  const foods = [
    {
      name: "North West · tuwo & miyan kuka",
      detail:
        "A familiar regional pairing; prepare with clean water and cook ingredients thoroughly.",
    },
    {
      name: "North East · millet & beans",
      detail:
        "Millet porridge and beans appear in many local meals; discuss individual dietary needs with your care team.",
    },
    {
      name: "North Central · yam & leafy soups",
      detail:
        "Meals vary by household; wash produce carefully and cook foods well.",
    },
    {
      name: "South West · moi-moi & beans",
      detail:
        "Beans can be prepared in different ways; refrigerate cooked food safely.",
    },
    {
      name: "South East · ofe onugbu & cassava",
      detail:
        "Traditional meals differ across communities; ask about food restrictions that apply to you.",
    },
    {
      name: "South South · afang & seafood",
      detail: "Use seafood that is thoroughly cooked and safely stored.",
    },
    {
      name: "Everyday staples · oats, rice, garri",
      detail:
        "Enjoy familiar foods as part of varied meals that suit your appetite and access.",
    },
    {
      name: "Market ingredients · ugwu, beans, crayfish",
      detail:
        "Wash produce, cook thoroughly, and use clean, safely stored ingredients.",
    },
  ];
</script>

<section class="learning-resources" id="learn" aria-labelledby="learn-title">
  <div class="learning-heading">
    <div>
      <div class="eyebrow small-eyebrow">KEEP LEARNING</div>
      <h2 id="learn-title">Small answers for everyday questions.</h2>
      <p>
        General information to bring into a conversation with your care team.
      </p>
    </div>
  </div>
  <div class="resource-grid">
    <article class="resource-card nutrition-resource">
      <div class="resource-top">
        <span class="resource-icon"
          ><HugeiconsIcon icon={Restaurant02Icon} size={19} /></span
        >
        <span class="resource-label">NIGERIAN FOOD GUIDE</span>
      </div>
      <h3>Familiar foods, thoughtful choices.</h3>
      <p>
        Nigeria's kitchens are diverse. These are examples to explore, not a
        meal prescription; portions and needs differ.
      </p>
      <div class="food-examples">
        {#each foods as food}
          <details>
            <summary>{food.name}<span>+</span></summary>
            <p>{food.detail}</p>
          </details>
        {/each}
      </div>
      <small class="resource-disclaimer"
        >Food examples are not a medical diet. Ask your health worker about
        special dietary needs, allergies, food safety and portion guidance.</small
      >
    </article>
    <article class="resource-card medicine-resource">
      <div class="resource-top">
        <span class="resource-icon medicine"
          ><HugeiconsIcon icon={Alert02Icon} size={19} /></span
        >
        <span class="resource-label">MEDICINES & PREGNANCY</span>
      </div>
      <h3>Check before you take it.</h3>
      <p>
        That includes pain relief, malaria medicines, herbal products, and
        supplements. Safety can depend on the specific product and stage of
        pregnancy.
      </p>
      <ul>
        <li>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} /> Ask your midwife,
          doctor, or pharmacist first.
        </li>
        <li>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} /> Don't stop a prescribed
          medicine without medical advice.
        </li>
        <li>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} /> Bring the package
          or a photo of the label.
        </li>
      </ul>
      <small class="resource-disclaimer"
        >This app does not label individual medicines as safe or unsafe. A
        qualified health worker can review your exact medicine.</small
      >
    </article>
  </div>
</section>
