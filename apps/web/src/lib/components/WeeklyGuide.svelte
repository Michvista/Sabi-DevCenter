<script lang="ts">
  import { ArrowRight01Icon, BookOpen01Icon } from "@hugeicons/core-free-icons";
  import { HugeiconsIcon } from "@hugeicons/svelte";
  import GuideAudio from "./GuideAudio.svelte";
  import GuideTextTranslation from "./GuideTextTranslation.svelte";
  import {
    getPregnancyWeek,
    type BookGuideSection,
  } from "#lib/data/pregnancy-weeks.ts";
  let { week }: { week: number } = $props();
  let guide = $derived(getPregnancyWeek(week));
  let bookSectionsOverride = $state<BookGuideSection[] | undefined>();
  let bookSections = $derived(bookSectionsOverride ?? guide.bookSections);
  let hasBookSource = $derived(bookSections.length > 0);
  let guideText = $derived(
    hasBookSource
      ? bookSections.map((section) => `${section.title}. ${section.summary}`).join(" ")
      : guide.gentlePrompt,
  );
  let citationPages = $derived(
    [...new Set(bookSections.flatMap((section) => section.citationPages))].sort(
      (a, b) => a - b,
    ),
  );
  let showReminder = $state(false);
  $effect(() => {
    const currentWeek = week;
    const controller = new AbortController();
    bookSectionsOverride = undefined;
    void fetch(
      `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/pregnancy/week`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week: currentWeek }),
        signal: controller.signal,
      },
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((result: { bookSections?: BookGuideSection[] } | null) => {
        if (result?.bookSections?.length) bookSectionsOverride = result.bookSections;
      })
      .catch(() => {});
    return () => controller.abort();
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
  {#if hasBookSource}
    <div class="book-sections">
      {#each bookSections as section}
        <article class="book-section">
          <strong>{section.title}</strong>
          <p>{section.summary}</p>
          <small>Book PDF {section.citationPages.map((page) => `p. ${page}`).join(", ")}</small>
        </article>
      {/each}
    </div>
  {:else}
    <p>{guideText}</p>
  {/if}
  <GuideAudio text={`${guide.title}. ${guideText}`} />
  <GuideTextTranslation text={`${guide.title}. ${guideText}`} />
  {#if hasBookSource}
    <small class="guide-source">
      Summary of Curtis &amp; Schuler,
      <em>Your Pregnancy Week by Week</em>, prepared once from the provided book. PDF
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
  <div class="guide-nutrition">
    <strong>Food and wellbeing</strong>
    <p>{guide.nutritionFocus}</p>
    <a href="https://www.who.int/tools/elena/interventions/nutrition-counselling-pregnancy" target="_blank" rel="noreferrer">WHO nutrition counselling</a>
  </div>
  <div class="guide-tip">
    <span class="tip-spark">✳</span>
    <div>
      <strong>Antenatal care focus</strong><span>{guide.antenatalFocus}</span>
      <a href="https://www.who.int/teams/maternal-newborn-child-adolescent-health-and-ageing/handbooks/programme-manager-s-handbook-mncah/recommendations-on-interventions-along-life-course/maternal" target="_blank" rel="noreferrer">WHO recommendations · ask your local care team</a>
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
