<script lang="ts">
  import { ArrowRight01Icon, BookOpen01Icon } from "@hugeicons/core-free-icons";
  import { HugeiconsIcon } from "@hugeicons/svelte";
  import GuideAudio from "./GuideAudio.svelte";
  import GuideTextTranslation from "./GuideTextTranslation.svelte";
  import { getPregnancyWeek } from "#lib/data/pregnancy-weeks.ts";
  import { onMount } from "svelte";
  let { week }: { week: number } = $props();
  let guide = $derived(getPregnancyWeek(week));
  let bookNoteOverride = $state<string | undefined>();
  let citationOverride = $state<number[] | undefined>();
  let guideText = $derived(
    bookNoteOverride ?? guide.bookNote ?? guide.gentlePrompt,
  );
  let citationPages = $derived(citationOverride ?? guide.citationPages);
  let hasBookSource = $derived(Boolean(bookNoteOverride ?? guide.bookNote));
  let showReminder = $state(false);
  onMount(() => {
    void fetch(
      `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/pregnancy/week`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week }),
      },
    )
      .then((response) => (response.ok ? response.json() : null))
      .then(
        (result: { bookNote?: string; citationPages?: number[] } | null) => {
          if (result?.bookNote) {
            bookNoteOverride = result.bookNote;
            citationOverride = result.citationPages ?? [];
          }
        },
      )
      .catch(() => {});
  });
</script>

<section class="today-guide">
  <div class="guide-top">
    <div class="guide-icon">
      <HugeiconsIcon icon={BookOpen01Icon} size={18} />
    </div>
    <span class="guide-tag">WEEK {week} GUIDE</span><span
      class="guide-more"
      aria-hidden="true">···</span
    >
  </div>
  <h3>{guide.title}</h3>
  <p class:book-excerpt={hasBookSource}>{guideText}</p>
  <GuideAudio text={`${guide.title}. ${guideText}`} />
  <GuideTextTranslation text={`${guide.title}. ${guideText}`} />
  {#if hasBookSource}
    <small class="guide-source">
      Copyrighted excerpt from Curtis &amp; Schuler,
      <em>Your Pregnancy Week by Week</em>, used with permission. PDF
      {citationPages.map((page) => `p. ${page}`).join(", ")}. Educational source
      only; a maternity-care clinician must review it before use as health
      guidance.
    </small>
  {/if}
  <button
    class="encouragement-button"
    onclick={() => (showReminder = !showReminder)}
  >
    {showReminder ? "Hide gentle reminder" : "A little encouragement"}
  </button>
  <small class="ai-privacy-note"
    >This reminder is stored in the app; no AI request or personal data is sent.</small
  >
  {#if showReminder}<p class="encouragement-message" aria-live="polite">
      You can take pregnancy one day at a time. Keep the questions that matter
      to you, and bring them to someone on your care team.
    </p>{/if}
  <div class="guide-divider"></div>
  <div class="guide-tip">
    <span class="tip-spark">✳</span>
    <div>
      <strong>Keep your care team close</strong><span
        >Use this as a question-starter at your next antenatal visit.</span
      >
    </div>
  </div>
  <a class="guide-button" href="#learn"
    >Read your week {week} guide <HugeiconsIcon
      icon={ArrowRight01Icon}
      size={16}
    /></a
  >
  {#if !hasBookSource}
    <small class="guide-source">
      General information for discussion with your maternity-care team. This
      note is not a substitute for professional care.
    </small>
  {/if}
</section>
