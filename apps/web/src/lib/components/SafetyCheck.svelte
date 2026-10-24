<script lang="ts">
  import {
    Alert02Icon,
    ArrowRight01Icon,
    Location01Icon,
  } from "@hugeicons/core-free-icons";
  import { HugeiconsIcon } from "@hugeicons/svelte";
  let checkedSymptoms = $state<string[]>([]);
  let assessment = $state<{
    level: string;
    title: string;
    message: string;
  } | null>(null);
  const options = [
    "Vaginal bleeding",
    "Severe headache",
    "Blurred vision",
    "High fever",
    "Severe belly pain",
    "Difficulty breathing",
    "Baby moving less",
    "Mild nausea",
    "Back ache",
  ];
  const urgentSymptoms = [
    "Vaginal bleeding",
    "Severe headache",
    "Blurred vision",
    "High fever",
    "Severe belly pain",
    "Difficulty breathing",
    "Baby moving less",
  ];
  const apiUrl = import.meta.env.VITE_API_URL;
  function toggle(symptom: string) {
    checkedSymptoms = checkedSymptoms.includes(symptom)
      ? checkedSymptoms.filter((item) => item !== symptom)
      : [...checkedSymptoms, symptom];
    assessment = null;
  }
  async function assess() {
    if (apiUrl) {
      try {
        const response = await fetch(`${apiUrl}/pregnancy/assess`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            symptoms: checkedSymptoms.map((s) => s.toLowerCase()),
          }),
        });
        if (response.ok) {
          assessment = await response.json();
          return;
        }
      } catch {
        /* Fall back to the same deterministic local safety rule when the API is offline. */
      }
    }
    const urgent = checkedSymptoms.some((symptom) =>
      urgentSymptoms.includes(symptom),
    );
    assessment = urgent
      ? {
          level: "urgent",
          title: "Please seek urgent medical care now",
          message:
            "These symptoms can need immediate assessment during pregnancy. Contact your midwife or go to the nearest health facility now. Ask someone to help you get there if you feel very unwell.",
        }
      : {
          level: "contact-care-team",
          title: "Check in with your care team",
          message:
            "I can’t tell what is causing a symptom. Contact your midwife or health worker, especially if it is new, worsening, or worrying you.",
        };
  }
</script>

<section class="section-block safety-section">
  <div class="section-heading">
    <div>
      <div class="eyebrow small-eyebrow">A QUICK CHECK-IN</div>
      <h2>Something not feeling right?</h2>
    </div>
    <span class="safety-mark"
      ><HugeiconsIcon icon={Alert02Icon} size={16} /></span
    >
  </div>
  <p class="section-description">
    Choose anything you're experiencing. We'll help you think about a next step.
  </p>
  <div class="symptom-list">
    {#each options as symptom}<button
        class="symptom-chip"
        class:checked={checkedSymptoms.includes(symptom)}
        onclick={() => toggle(symptom)}
        >{#if checkedSymptoms.includes(symptom)}<span>✓</span
          >{/if}{symptom}</button
      >{/each}
  </div>
  {#if checkedSymptoms.length}<button class="check-button" onclick={assess}
      >See guidance <HugeiconsIcon icon={ArrowRight01Icon} size={16} /></button
    >{/if}
  {#if assessment}<div
      class="assessment"
      class:urgent={assessment.level === "urgent"}
    >
      <strong>{assessment.title}</strong>
      <p>{assessment.message}</p>
      <a href="tel:112" class="help-link"
        ><HugeiconsIcon icon={Location01Icon} size={15} /> Emergency help in Nigeria
        · 112</a
      >
    </div>{/if}
  <div class="safety-footnote">
    <HugeiconsIcon icon={Alert02Icon} size={14} /> This check-in doesn't diagnose.
    If you feel worried, contact your health worker.
  </div>
</section>
