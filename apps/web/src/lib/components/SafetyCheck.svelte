<script lang="ts">
  let checkedSymptoms = $state<string[]>([]);
  let assessment = $state<{
    level: string;
    title: string;
    message: string;
  } | null>(null);

  const urgentSymptoms = [
    "Vaginal bleeding",
    "Severe headache",
    "Blurred vision",
    "High fever",
    "Severe belly pain",
    "Difficulty breathing",
    "Baby moving less",
  ];

  const options = [
    { label: "Vaginal bleeding", urgent: true },
    { label: "Severe headache", urgent: true },
    { label: "Blurred vision", urgent: true },
    { label: "High fever", urgent: true },
    { label: "Severe belly pain", urgent: true },
    { label: "Difficulty breathing", urgent: true },
    { label: "Baby moving less", urgent: true },
    { label: "Mild nausea", urgent: false },
    { label: "Back ache", urgent: false },
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
        /* fall back to local rule */
      }
    }
    const urgent = checkedSymptoms.some((s) => urgentSymptoms.includes(s));
    assessment = urgent
      ? {
          level: "urgent",
          title: "Please seek urgent medical care now",
          message:
            "These symptoms can need immediate assessment during pregnancy. Contact your midwife or go to the nearest health facility now.",
        }
      : {
          level: "contact-care-team",
          title: "Check in with your care team",
          message:
            "Contact your midwife or health worker, especially if this is new, worsening, or worrying you.",
        };
  }

  function clear() {
    checkedSymptoms = [];
    assessment = null;
  }
</script>

<div class="flo-safety-card">
  <div class="flo-safety-header">
    <div class="flo-checkin-eyebrow">A QUICK CHECK-IN</div>
    <h2 class="flo-checkin-title">Something not feeling right?</h2>
    <p class="flo-checkin-sub">
      Choose anything you're experiencing. We'll help you think about a next step.
    </p>
  </div>

  <div class="flo-symptom-list">
    {#each options as opt}
      <button
        class="flo-symptom-chip"
        class:flo-symptom-checked={checkedSymptoms.includes(opt.label)}
        class:flo-symptom-urgent={opt.urgent}
        type="button"
        onclick={() => toggle(opt.label)}
        aria-pressed={checkedSymptoms.includes(opt.label)}
      >
        {#if checkedSymptoms.includes(opt.label)}
          <span class="flo-chip-check">✓</span>
        {/if}
        {opt.label}
      </button>
    {/each}
  </div>

  {#if checkedSymptoms.length > 0}
    <div class="flo-safety-actions">
      <button class="flo-assess-btn" type="button" onclick={assess}>
        See guidance →
      </button>
      <button class="flo-clear-btn" type="button" onclick={clear}>
        Clear
      </button>
    </div>
  {/if}

  {#if assessment}
    <div
      class="flo-assessment-result"
      class:flo-assessment-urgent={assessment.level === "urgent"}
      class:flo-assessment-mild={assessment.level !== "urgent"}
    >
      <strong class="flo-assessment-title">{assessment.title}</strong>
      <p class="flo-assessment-msg">{assessment.message}</p>
      {#if assessment.level === "urgent"}
        <a href="tel:112" class="flo-emergency-link">
          ☎ Emergency help in Nigeria · 112
        </a>
      {/if}
    </div>
  {/if}

  <p class="flo-safety-footnote">
    This check-in doesn't diagnose. If you feel worried, contact your health worker.
  </p>
</div>
