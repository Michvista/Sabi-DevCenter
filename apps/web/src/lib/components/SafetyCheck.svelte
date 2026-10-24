<script lang="ts">
  import { sessionToken } from "#lib/auth/session.ts";

  let checkedSymptoms = $state<string[]>([]);
  let assessment = $state<{
    level: string;
    title: string;
    message: string;
  } | null>(null);
  let sharedToMidwife = $state(false);
  let sharing = $state(false);

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

  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

  function toggle(symptom: string) {
    checkedSymptoms = checkedSymptoms.includes(symptom)
      ? checkedSymptoms.filter((item) => item !== symptom)
      : [...checkedSymptoms, symptom];
    assessment = null;
    sharedToMidwife = false;
  }

  async function assess() {
    if (!checkedSymptoms.length) return;
    sharing = true;

    // Send check-in with symptoms to patient record so connected midwife receives it
    const token = sessionToken();
    if (token) {
      try {
        await fetch(`${apiUrl}/records/check-ins`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mood: checkedSymptoms.some((s) => urgentSymptoms.includes(s)) ? "urgent_symptoms" : "reported_symptoms",
            symptoms: checkedSymptoms,
            note: "Reported via A Quick Check-in",
          }),
        });
        sharedToMidwife = true;
      } catch {
        // Fall back gracefully
      }
    }

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
          sharing = false;
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
    sharing = false;
  }

  function clear() {
    checkedSymptoms = [];
    assessment = null;
    sharedToMidwife = false;
  }
</script>

<div class="bg-white rounded-2xl border border-[#e7e4dc] p-5 shadow-2xs">
  <!-- Header -->
  <div class="mb-4">
    <div class="text-[11px] font-bold tracking-widest text-[#9c998f] uppercase mb-1">A QUICK CHECK-IN</div>
    <h2 class="font-serif text-xl font-semibold text-[#2b2c28] mb-0.5">Something not feeling right?</h2>
    <p class="text-sm text-[#72746b]">Choose anything you're experiencing. We'll help you think about a next step.</p>
  </div>

  <!-- Symptom chips -->
  <div class="flex flex-wrap gap-2 mb-4">
    {#each options as opt}
      <button
        class="px-3.5 py-2 text-xs font-medium rounded-full border-2 transition-all cursor-pointer flex items-center gap-1.5
          {checkedSymptoms.includes(opt.label)
            ? opt.urgent
              ? 'bg-[#fdf4f0] border-[#f4cfc4] text-[#9c2d15] font-semibold'
              : 'bg-[#edf5eb] border-[#c6dfc0] text-[#385a38] font-semibold'
            : 'bg-[#faf9f6] border-[#e7e4dc] text-[#55574f] hover:border-[#af705a]/40'}"
        type="button"
        onclick={() => toggle(opt.label)}
        aria-pressed={checkedSymptoms.includes(opt.label)}
      >
        {#if checkedSymptoms.includes(opt.label)}
          <i class="iconoir-check-circle text-xs {opt.urgent ? 'text-[#af705a]' : 'text-[#809474]'}"></i>
        {/if}
        {opt.label}
      </button>
    {/each}
  </div>

  {#if checkedSymptoms.length > 0}
    <div class="flex items-center gap-2 mb-3">
      <button
        class="flex-1 py-2.5 px-4 text-sm font-semibold rounded-xl bg-[#af705a] text-white hover:bg-[#975c48] disabled:opacity-60 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
        type="button"
        onclick={assess}
        disabled={sharing}
      >
        {#if sharing}
          <svg class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Assessing…</span>
        {:else}
          <span>See guidance</span>
          <i class="iconoir-nav-arrow-right text-sm"></i>
        {/if}
      </button>
      <button
        class="py-2.5 px-4 text-sm font-medium rounded-xl bg-[#faf9f6] border border-[#e7e4dc] text-[#55574f] hover:bg-[#f0eee8] disabled:opacity-60 transition-colors cursor-pointer"
        type="button"
        onclick={clear}
        disabled={sharing}
      >
        Clear
      </button>
    </div>
  {/if}

  {#if sharedToMidwife}
    <div class="mb-3 px-3 py-2.5 rounded-xl bg-[#809474]/10 border border-[#809474]/25 text-xs text-[#3d4b39] flex items-start gap-2">
      <i class="iconoir-check-circle text-sm text-[#809474] mt-0.5 shrink-0"></i>
      <div>
        <span class="font-bold text-[#475842]">Shared with your midwife:</span>
        <span class="ml-1">These symptoms have been logged to your connected care team's portal.</span>
      </div>
    </div>
  {/if}

  {#if assessment}
    <div
      class="rounded-xl p-4 {assessment.level === 'urgent'
        ? 'bg-[#fdf4f0] border border-[#f4cfc4]'
        : 'bg-[#f2f6ee] border border-[#cfe0c8]'}"
    >
      <strong class="block text-sm font-bold {assessment.level === 'urgent' ? 'text-[#9c2d15]' : 'text-[#385a38]'} mb-1">
        {assessment.title}
      </strong>
      <p class="text-xs leading-relaxed {assessment.level === 'urgent' ? 'text-[#7a2412]' : 'text-[#486143]'} mb-2">
        {assessment.message}
      </p>
      {#if assessment.level === "urgent"}
        <a
          href="tel:112"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-[#9c2d15] bg-white px-3 py-1.5 rounded-lg border border-[#f4cfc4] hover:bg-[#fef2f0] transition-colors"
        >
          <i class="iconoir-phone text-sm"></i>
          Emergency help in Nigeria · 112
        </a>
      {/if}
    </div>
  {/if}

  <p class="mt-3 text-xs text-[#888b7e] border-t border-[#f0eee8] pt-3">
    This check-in doesn't diagnose. If you feel worried, contact your health worker.
  </p>
</div>
