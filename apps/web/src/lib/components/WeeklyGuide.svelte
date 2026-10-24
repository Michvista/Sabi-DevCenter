<script lang="ts">
  import {
    ArrowRight01Icon,
    BookOpen01Icon,
    Shield01Icon,
    Leaf01Icon,
    Clock01Icon,
  } from "@hugeicons/core-free-icons";
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

  let activeTab = $state<"baby" | "mom" | "food" | "safety" | "questions">("baby");

  // Categorize book sections into baby and mom
  let babySections = $derived(
    bookSections.filter(
      (s) =>
        /baby|fetal|growth|size|embryo/i.test(s.title) ||
        !/changes in you|uterus|weight|nausea|symptoms/i.test(s.title),
    ),
  );

  let momSections = $derived(
    bookSections.filter((s) =>
      /changes in you|body|uterus|weight|symptoms|planning/i.test(s.title),
    ),
  );

  let guideText = $derived(
    hasBookSource
      ? bookSections.map((section) => `${section.title}. ${section.summary}`).join(" ")
      : guide.gentlePrompt,
  );

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

<div class="flo-week-guide">
  <!-- Flo-Style Hero Banner -->
  <header class="flo-hero-card">
    <div class="flo-hero-header">
      <div class="flo-trimester-tag">
        <span class="dot"></span>
        TRIMESTER {guide.trimester} · WEEK {week}
      </div>
      <span class="flo-pill-quiet">Flo-Style Companion</span>
    </div>

    <div class="flo-hero-main">
      <div class="flo-size-visual">
        <div class="flo-fruit-circle">
          <span class="flo-fruit-emoji">🌱</span>
        </div>
      </div>
      <div class="flo-size-meta">
        <span class="flo-size-subtitle">BABY IS ABOUT THE SIZE OF A</span>
        <h2 class="flo-fruit-name">{guide.babyFruit}</h2>
        <div class="flo-metrics-row">
          <div class="flo-metric">
            <span class="label">Approx. Length</span>
            <strong>{guide.babyLength}</strong>
          </div>
          <div class="flo-metric-sep"></div>
          <div class="flo-metric">
            <span class="label">Approx. Weight</span>
            <strong>{guide.babyWeight}</strong>
          </div>
          <div class="flo-metric-sep"></div>
          <div class="flo-metric">
            <span class="label">Stage</span>
            <strong>Week {week} of 42</strong>
          </div>
        </div>
      </div>
    </div>

    <p class="flo-theme-prompt">{guide.gentlePrompt}</p>
  </header>

  <!-- Segmented Navigation Tabs -->
  <nav class="flo-tabs" aria-label="Week guide sections">
    <button
      class="flo-tab-btn"
      class:active={activeTab === "baby"}
      onclick={() => (activeTab = "baby")}
    >
      <span>👶 Baby</span>
    </button>
    <button
      class="flo-tab-btn"
      class:active={activeTab === "mom"}
      onclick={() => (activeTab = "mom")}
    >
      <span>🌸 Your Body</span>
    </button>
    <button
      class="flo-tab-btn"
      class:active={activeTab === "food"}
      onclick={() => (activeTab = "food")}
    >
      <span>🍲 Nutrition</span>
    </button>
    <button
      class="flo-tab-btn"
      class:active={activeTab === "safety"}
      onclick={() => (activeTab = "safety")}
    >
      <span>⚠️ Danger Signs</span>
    </button>
    <button
      class="flo-tab-btn"
      class:active={activeTab === "questions"}
      onclick={() => (activeTab = "questions")}
    >
      <span>📋 Clinic Questions</span>
    </button>
  </nav>

  <!-- Tab Content Area -->
  <div class="flo-tab-content">
    {#if activeTab === "baby"}
      <section class="flo-card flo-card-baby" aria-labelledby="baby-tab-heading">
        <div class="flo-card-header">
          <div class="flo-badge-icon purple">👶</div>
          <div>
            <h3 id="baby-tab-heading">Baby’s Development in Week {week}</h3>
            <p class="sub">How your little one is growing and transforming</p>
          </div>
        </div>

        {#if hasBookSource && babySections.length > 0}
          <div class="flo-sections-list">
            {#each babySections as section}
              <div class="flo-story-block">
                <h4>{section.title}</h4>
                <p>{section.summary}</p>
              </div>
            {/each}
          </div>
        {:else}
          <div class="flo-story-block">
            <h4>Growth Milestones</h4>
            <p>{guideText}</p>
          </div>
        {/if}

        <div class="flo-highlight-box">
          <div class="highlight-title">✨ Key Focus This Week</div>
          <p>{guide.focus}</p>
        </div>
      </section>

    {:else if activeTab === "mom"}
      <section class="flo-card flo-card-mom" aria-labelledby="mom-tab-heading">
        <div class="flo-card-header">
          <div class="flo-badge-icon peach">🌸</div>
          <div>
            <h3 id="mom-tab-heading">What to Expect in Your Body</h3>
            <p class="sub">Normal physical sensations and gentle care routines</p>
          </div>
        </div>

        {#if hasBookSource && momSections.length > 0}
          <div class="flo-sections-list">
            {#each momSections as section}
              <div class="flo-story-block">
                <h4>{section.title}</h4>
                <p>{section.summary}</p>
              </div>
            {/each}
          </div>
        {:else}
          <div class="flo-story-block">
            <h4>Body Changes & Wellbeing</h4>
            <p>
              Your body is working continuously to nourish your baby. Stay hydrated, take short restful
              pauses throughout the day, and listen closely to what feels comfortable.
            </p>
          </div>
        {/if}

        <div class="flo-antenatal-banner">
          <div class="antenatal-icon">
            <HugeiconsIcon icon={Clock01Icon} size={20} />
          </div>
          <div>
            <strong>Antenatal Care Reminder</strong>
            <p>{guide.antenatalFocus}</p>
          </div>
        </div>
      </section>

    {:else if activeTab === "food"}
      <section class="flo-card flo-card-food" aria-labelledby="food-tab-heading">
        <div class="flo-card-header">
          <div class="flo-badge-icon green">🍲</div>
          <div>
            <h3 id="food-tab-heading">Nigerian Nutrition for Week {week}</h3>
            <p class="sub">Culturally familiar, nutrient-dense foods to power you and baby</p>
          </div>
        </div>

        <div class="flo-food-tip-box">
          <strong>Weekly Nutrition Focus</strong>
          <p>{guide.nigerianFoodTip}</p>
        </div>

        <div class="flo-nutrition-grid">
          <div class="flo-nutri-col">
            <span class="nutri-group-title">Key Nutrients to Prioritize</span>
            <div class="pill-wrap">
              {#each guide.keyNutrients as nutrient}
                <span class="nutrient-pill green-pill">✓ {nutrient}</span>
              {/each}
            </div>
          </div>

          <div class="flo-nutri-col">
            <span class="nutri-group-title">Recommended Nigerian Foods</span>
            <div class="pill-wrap">
              {#each guide.recommendedFoods as food}
                <span class="nutrient-pill warm-pill">🍲 {food}</span>
              {/each}
            </div>
          </div>
        </div>

        <div class="flo-avoid-box">
          <span class="avoid-title">🚫 What to Avoid or Limit This Week</span>
          <ul class="avoid-list">
            {#each guide.foodsToAvoid as avoidItem}
              <li>{avoidItem}</li>
            {/each}
          </ul>
        </div>
      </section>

    {:else if activeTab === "safety"}
      <section class="flo-card flo-card-safety" aria-labelledby="safety-tab-heading">
        <div class="flo-card-header">
          <div class="flo-badge-icon red">⚠️</div>
          <div>
            <h3 id="safety-tab-heading">Things to Watch Out For</h3>
            <p class="sub">Warning signs that require immediate contact with your clinic or midwife</p>
          </div>
        </div>

        <div class="flo-danger-list">
          {#each guide.dangerSigns as sign}
            <div class="danger-item">
              <span class="danger-dot">!</span>
              <span>{sign}</span>
            </div>
          {/each}
        </div>

        <div class="emergency-action-card">
          <strong>When to Seek Help</strong>
          <p>
            Do not wait for your scheduled appointment if you observe any of these warning signs.
            Contact your hospital, primary healthcare centre, or midwife right away.
          </p>
        </div>
      </section>

    {:else if activeTab === "questions"}
      <section class="flo-card flo-card-questions" aria-labelledby="questions-tab-heading">
        <div class="flo-card-header">
          <div class="flo-badge-icon blue">📋</div>
          <div>
            <h3 id="questions-tab-heading">Questions for Your Next Clinic Visit</h3>
            <p class="sub">Practical questions to bring to your nurse, doctor, or midwife</p>
          </div>
        </div>

        <p class="questions-intro">
          Antenatal visits can feel fast. Here are 3 specific questions tailored for week {week} to help you get clear answers:
        </p>

        <div class="questions-list">
          {#each guide.clinicQuestions as q, idx}
            <div class="question-row">
              <span class="question-num">{idx + 1}</span>
              <p>{q}</p>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  </div>

  <!-- Accessibility Audio & Language Feature -->
  <section class="flo-audio-hub" aria-label="Audio and voice guide">
    <div class="audio-hub-header">
      <span class="audio-hub-title">🎧 Listen to this Guide in Your Language</span>
      <span class="audio-hub-sub">Hausa · Igbo · Yorùbá · Nigerian Pidgin · English</span>
    </div>
    <div class="audio-hub-player">
      <GuideAudio text={`${guide.title}. ${guide.nigerianFoodTip} ${guideText}`} />
    </div>
    <div class="translation-wrapper">
      <GuideTextTranslation text={`${guide.title}. ${guide.nigerianFoodTip} ${guideText}`} />
    </div>
  </section>

  <!-- Quiet, Respectful Source Note -->
  <footer class="flo-source-footer">
    <p>
      Adapted from Curtis &amp; Schuler's <em>Your Pregnancy Week by Week</em> and WHO Antenatal Care standards.
      Designed for general education between visits; your maternity team provides individualized clinical care.
    </p>
  </footer>
</div>
