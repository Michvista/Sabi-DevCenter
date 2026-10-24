<script lang="ts">
  import GuideAudio from "./GuideAudio.svelte";
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

  /** Comprehensive narration script for audio & translation — covers everything about the week */
  let comprehensiveNarration = $derived.by(() => {
    const parts: string[] = [];

    // 1. Week intro with baby size
    parts.push(
      `Week ${week}, Trimester ${guide.trimester}. Your baby is about the size of a ${guide.babyFruit}, measuring approximately ${guide.babyLength} and weighing ${guide.babyWeight}.`,
    );

    // 2. Key developmental focus
    parts.push(`Key focus this week: ${guide.focus}`);

    // 3. Book-sourced clinical summaries (baby + body changes)
    if (hasBookSource) {
      if (babySections.length > 0) {
        parts.push(
          babySections
            .slice(0, 3)
            .map((s) => `${s.title}: ${s.summary}`)
            .join(" "),
        );
      }
      if (momSections.length > 0) {
        parts.push(
          momSections
            .slice(0, 2)
            .map((s) => `${s.title}: ${s.summary}`)
            .join(" "),
        );
      }
    } else {
      parts.push(guide.gentlePrompt);
    }

    // 4. Antenatal care reminder
    parts.push(`Antenatal care reminder: ${guide.antenatalFocus}`);

    // 5. Nigerian nutrition
    parts.push(
      `Nutrition this week: ${guide.nigerianFoodTip} Foods to prioritize include ${guide.recommendedFoods.slice(0, 4).join(", ")}. Key nutrients: ${guide.keyNutrients.slice(0, 4).join(", ")}.`,
    );

    // 6. Top danger signs
    if (guide.dangerSigns.length > 0) {
      parts.push(
        `Watch out for these warning signs: ${guide.dangerSigns.slice(0, 3).join("; ")}. If you notice any of these, contact your clinic or midwife immediately. In Nigeria, dial 112 for emergencies.`,
      );
    }

    // 7. Clinic questions
    if (guide.clinicQuestions.length > 0) {
      parts.push(
        `Questions to ask at your next visit: ${guide.clinicQuestions.slice(0, 2).join(" Also ask: ")}`,
      );
    }

    // Keep under 4500 chars to stay within translation + TTS limits
    return parts.join(" ").slice(0, 4500);
  });

  let clinicalReview = $state<{
    status: "APPROVED" | "CHANGES_REQUESTED" | "PENDING";
    notes?: string | null;
    reviewedAt?: string | null;
  } | null>(null);

  $effect(() => {
    const currentWeek = week;
    const controller = new AbortController();
    bookSectionsOverride = undefined;
    clinicalReview = null;
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
      .then((result: { bookSections?: BookGuideSection[]; clinicalReview?: typeof clinicalReview } | null) => {
        if (result?.bookSections?.length) bookSectionsOverride = result.bookSections;
        clinicalReview = result?.clinicalReview ?? null;
      })
      .catch(() => {});
    return () => controller.abort();
  });
</script>

<div class="space-y-6">
  <!-- Hero Card -->
  <header class="rounded-3xl bg-linear-to-br from-[#ffffff] via-[#fbfbf8] to-[#f4f7f2] border border-[#e7e4dc] p-6 sm:p-8 shadow-xs">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-6">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#809474]/15 border border-[#809474]/30 text-xs font-bold text-[#475842] uppercase tracking-wider">
        <span class="w-2 h-2 rounded-full bg-[#809474]"></span>
        <span>Trimester {guide.trimester} · Week {week}</span>
      </div>

      <div class="flex items-center gap-2">
        {#if clinicalReview?.status === "APPROVED"}
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edf5eb] text-[#385a38] text-xs font-semibold border border-[#c6dfc0]">
            <i class="iconoir-check-circle text-xs text-[#809474]"></i>
            <span>Verified by Midwife Care Team</span>
          </span>
        {:else if clinicalReview?.status === "CHANGES_REQUESTED"}
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef9e7] text-[#7c440a] text-xs font-semibold border border-[#e9d27a]">
            <i class="iconoir-warning-triangle text-xs text-[#b8860b]"></i>
            <span>Care Team Note Added</span>
          </span>
        {/if}
        <span class="text-xs text-[#72746b] bg-white border border-[#e7e4dc] px-3 py-1 rounded-full font-medium">
          Clinical Companion
        </span>
      </div>
    </div>

    {#if clinicalReview?.notes}
      <div class="mb-4 p-3 rounded-2xl bg-[#faf9f6] border border-[#dce5d6] text-xs text-[#475842] flex items-start gap-2">
        <i class="iconoir-chat-bubble-check text-sm text-[#809474] mt-0.5 shrink-0"></i>
        <div>
          <strong class="font-semibold block">Midwife Reviewer Note for Week {week}:</strong>
          <span>"{clinicalReview.notes}"</span>
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
      <div class="md:col-span-3 flex justify-center">
        <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#af705a]/10 border-2 border-[#af705a]/20 flex flex-col items-center justify-center text-[#af705a] shadow-xs">
          <i class="iconoir-sparks text-3xl mb-1"></i>
          <span class="text-[11px] font-bold uppercase tracking-wider">Week {week}</span>
        </div>
      </div>
      <div class="md:col-span-9 space-y-3">
        <span class="text-xs font-bold uppercase tracking-widest text-[#888b7c]">BABY IS ABOUT THE SIZE OF A</span>
        <h2 class="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#2b2c28] tracking-tight">
          {guide.babyFruit}
        </h2>
        <div class="flex flex-wrap items-center gap-3 sm:gap-6 pt-1 text-xs sm:text-sm text-[#525547]">
          <div class="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#e7e4dc] shadow-2xs">
            <span class="text-[#888b7c]">Approx. Length:</span>
            <strong class="font-semibold text-[#2b2c28]">{guide.babyLength}</strong>
          </div>
          <div class="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#e7e4dc] shadow-2xs">
            <span class="text-[#888b7c]">Approx. Weight:</span>
            <strong class="font-semibold text-[#2b2c28]">{guide.babyWeight}</strong>
          </div>
          <div class="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#e7e4dc] shadow-2xs">
            <span class="text-[#888b7c]">Stage:</span>
            <strong class="font-semibold text-[#2b2c28]">Week {week} of 42</strong>
          </div>
        </div>
      </div>
    </div>

    <p class="mt-6 pt-4 border-t border-[#edeae1] text-sm text-[#65675c] leading-relaxed">
      {guide.gentlePrompt}
    </p>
  </header>

  <!-- Navigation Tabs -->
  <nav class="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl border border-[#e7e4dc] shadow-2xs" aria-label="Week guide sections">
    <button
      class="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer {activeTab === 'baby' ? 'bg-[#809474] text-white shadow-xs' : 'text-[#686960] hover:text-[#2b2c28] hover:bg-[#faf9f6]'}"
      onclick={() => (activeTab = "baby")}
    >
      <i class="iconoir-user text-base"></i>
      <span>Baby Growth</span>
    </button>
    <button
      class="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer {activeTab === 'mom' ? 'bg-[#809474] text-white shadow-xs' : 'text-[#686960] hover:text-[#2b2c28] hover:bg-[#faf9f6]'}"
      onclick={() => (activeTab = "mom")}
    >
      <i class="iconoir-heart text-base"></i>
      <span>Your Body</span>
    </button>
    <button
      class="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer {activeTab === 'food' ? 'bg-[#809474] text-white shadow-xs' : 'text-[#686960] hover:text-[#2b2c28] hover:bg-[#faf9f6]'}"
      onclick={() => (activeTab = "food")}
    >
      <i class="iconoir-apple-half text-base"></i>
      <span>Nutrition</span>
    </button>
    <button
      class="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer {activeTab === 'safety' ? 'bg-[#af705a] text-white shadow-xs' : 'text-[#686960] hover:text-[#2b2c28] hover:bg-[#faf9f6]'}"
      onclick={() => (activeTab = "safety")}
    >
      <i class="iconoir-warning-triangle text-base"></i>
      <span>Danger Signs</span>
    </button>
    <button
      class="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer {activeTab === 'questions' ? 'bg-[#809474] text-white shadow-xs' : 'text-[#686960] hover:text-[#2b2c28] hover:bg-[#faf9f6]'}"
      onclick={() => (activeTab = "questions")}
    >
      <i class="iconoir-chat-bubble-check text-base"></i>
      <span>Clinic Questions</span>
    </button>
  </nav>

  <!-- Tab Content Area -->
  <div class="rounded-3xl bg-white border border-[#e7e4dc] p-6 sm:p-8 shadow-xs">
    {#if activeTab === "baby"}
      <section class="space-y-6" aria-labelledby="baby-tab-heading">
        <div class="flex items-center gap-3 pb-4 border-b border-[#f0ede6]">
          <div class="w-10 h-10 rounded-xl bg-[#809474]/15 text-[#475842] flex items-center justify-center text-xl">
            <i class="iconoir-sparks"></i>
          </div>
          <div>
            <h3 id="baby-tab-heading" class="font-serif text-xl font-semibold text-[#2b2c28]">Baby’s Development in Week {week}</h3>
            <p class="text-xs text-[#72746b]">How your little one is growing and transforming</p>
          </div>
        </div>

        {#if hasBookSource && babySections.length > 0}
          <div class="space-y-4">
            {#each babySections as section}
              <div class="p-4 rounded-2xl bg-[#faf9f6] border border-[#eeece6] space-y-1.5">
                <h4 class="font-serif text-base font-semibold text-[#30312c]">{section.title}</h4>
                <p class="text-sm text-[#525547] leading-relaxed">{section.summary}</p>
              </div>
            {/each}
          </div>
        {:else}
          <div class="p-4 rounded-2xl bg-[#faf9f6] border border-[#eeece6] space-y-1.5">
            <h4 class="font-serif text-base font-semibold text-[#30312c]">Growth Milestones</h4>
            <p class="text-sm text-[#525547] leading-relaxed">{guideText}</p>
          </div>
        {/if}

        <div class="p-4 rounded-2xl bg-[#809474]/10 border border-[#809474]/25 space-y-1">
          <div class="text-xs font-bold text-[#475842] uppercase tracking-wider flex items-center gap-1.5">
            <i class="iconoir-star text-sm text-[#809474]"></i>
            <span>Key Focus This Week</span>
          </div>
          <p class="text-sm text-[#384634] leading-relaxed font-medium">{guide.focus}</p>
        </div>
      </section>

    {:else if activeTab === "mom"}
      <section class="space-y-6" aria-labelledby="mom-tab-heading">
        <div class="flex items-center gap-3 pb-4 border-b border-[#f0ede6]">
          <div class="w-10 h-10 rounded-xl bg-[#af705a]/15 text-[#af705a] flex items-center justify-center text-xl">
            <i class="iconoir-heart"></i>
          </div>
          <div>
            <h3 id="mom-tab-heading" class="font-serif text-xl font-semibold text-[#2b2c28]">What to Expect in Your Body</h3>
            <p class="text-xs text-[#72746b]">Normal physical sensations and gentle care routines</p>
          </div>
        </div>

        {#if hasBookSource && momSections.length > 0}
          <div class="space-y-4">
            {#each momSections as section}
              <div class="p-4 rounded-2xl bg-[#faf9f6] border border-[#eeece6] space-y-1.5">
                <h4 class="font-serif text-base font-semibold text-[#30312c]">{section.title}</h4>
                <p class="text-sm text-[#525547] leading-relaxed">{section.summary}</p>
              </div>
            {/each}
          </div>
        {:else}
          <div class="p-4 rounded-2xl bg-[#faf9f6] border border-[#eeece6] space-y-1.5">
            <h4 class="font-serif text-base font-semibold text-[#30312c]">Body Changes & Wellbeing</h4>
            <p class="text-sm text-[#525547] leading-relaxed">
              Your body is working continuously to nourish your baby. Stay hydrated, take short restful
              pauses throughout the day, and listen closely to what feels comfortable.
            </p>
          </div>
        {/if}

        <div class="p-4 rounded-2xl bg-[#f4f1f9] border border-[#e2dbeb] flex items-start gap-3">
          <div class="w-9 h-9 rounded-xl bg-[#7b6fa0]/15 flex items-center justify-center shrink-0 text-[#7b6fa0]">
            <i class="iconoir-calendar text-lg"></i>
          </div>
          <div>
            <strong class="font-serif text-sm font-semibold text-[#3a3250] block">Antenatal Care Reminder</strong>
            <p class="text-xs text-[#5f5773] mt-0.5 leading-relaxed">{guide.antenatalFocus}</p>
          </div>
        </div>
      </section>

    {:else if activeTab === "food"}
      <section class="space-y-6" aria-labelledby="food-tab-heading">
        <div class="flex items-center gap-3 pb-4 border-b border-[#f0ede6]">
          <div class="w-10 h-10 rounded-xl bg-[#809474]/15 text-[#385a38] flex items-center justify-center text-xl">
            <i class="iconoir-apple-half"></i>
          </div>
          <div>
            <h3 id="food-tab-heading" class="font-serif text-xl font-semibold text-[#2b2c28]">Nigerian Nutrition for Week {week}</h3>
            <p class="text-xs text-[#72746b]">Culturally familiar, nutrient-dense foods to power you and baby</p>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-[#f7f9f5] border border-[#dce5d6] space-y-1.5">
          <strong class="text-xs font-bold uppercase tracking-wider text-[#475842] block">Weekly Nutrition Focus</strong>
          <p class="text-sm text-[#384634] leading-relaxed">{guide.nigerianFoodTip}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 rounded-2xl bg-white border border-[#e7e4dc] space-y-3">
            <span class="text-xs font-bold uppercase tracking-wider text-[#475842] block">Key Nutrients to Prioritize</span>
            <div class="flex flex-wrap gap-2">
              {#each guide.keyNutrients as nutrient}
                <span class="text-xs font-medium px-3 py-1 rounded-full bg-[#edf5eb] text-[#385a38] border border-[#c6dfc0]">
                  ✓ {nutrient}
                </span>
              {/each}
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-white border border-[#e7e4dc] space-y-3">
            <span class="text-xs font-bold uppercase tracking-wider text-[#af705a] block">Recommended Nigerian Foods</span>
            <div class="flex flex-wrap gap-2">
              {#each guide.recommendedFoods as food}
                <span class="text-xs font-medium px-3 py-1 rounded-full bg-[#faf8f5] text-[#2b2c28] border border-[#e7e3d8]">
                  🍲 {food}
                </span>
              {/each}
            </div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-[#fdf4f0] border border-[#f4cfc4] space-y-2">
          <span class="text-xs font-bold uppercase tracking-wider text-[#9c2d15] block">What to Avoid or Limit This Week</span>
          <ul class="text-xs text-[#7a2412] space-y-1.5">
            {#each guide.foodsToAvoid as avoidItem}
              <li class="flex items-start gap-2">
                <span class="text-[#af705a] font-bold">✕</span>
                <span>{avoidItem}</span>
              </li>
            {/each}
          </ul>
        </div>
      </section>

    {:else if activeTab === "safety"}
      <section class="space-y-6" aria-labelledby="safety-tab-heading">
        <div class="flex items-center gap-3 pb-4 border-b border-[#f0ede6]">
          <div class="w-10 h-10 rounded-xl bg-[#af705a]/15 text-[#af705a] flex items-center justify-center text-xl">
            <i class="iconoir-warning-triangle"></i>
          </div>
          <div>
            <h3 id="safety-tab-heading" class="font-serif text-xl font-semibold text-[#2b2c28]">Things to Watch Out For</h3>
            <p class="text-xs text-[#72746b]">Warning signs that require immediate contact with your clinic or midwife</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {#each guide.dangerSigns as sign}
            <div class="p-3.5 rounded-xl border border-[#f4cfc4] bg-[#fdf4f0] text-xs font-medium text-[#9c2d15] flex items-center gap-2.5">
              <span class="w-5 h-5 rounded-full bg-[#9c2d15] text-white flex items-center justify-center text-[10px] font-bold shrink-0">!</span>
              <span>{sign}</span>
            </div>
          {/each}
        </div>

        <div class="p-4 rounded-2xl bg-[#faf9f6] border border-[#e7e4dc] space-y-1.5">
          <strong class="font-serif text-base font-semibold text-[#2b2c28] block">When to Seek Help</strong>
          <p class="text-xs text-[#686960] leading-relaxed">
            Do not wait for your scheduled appointment if you observe any of these warning signs.
            Contact your hospital, primary healthcare centre, or midwife right away. In Nigeria, dial 112 for emergencies.
          </p>
        </div>
      </section>

    {:else if activeTab === "questions"}
      <section class="space-y-6" aria-labelledby="questions-tab-heading">
        <div class="flex items-center gap-3 pb-4 border-b border-[#f0ede6]">
          <div class="w-10 h-10 rounded-xl bg-[#809474]/15 text-[#475842] flex items-center justify-center text-xl">
            <i class="iconoir-chat-bubble-check"></i>
          </div>
          <div>
            <h3 id="questions-tab-heading" class="font-serif text-xl font-semibold text-[#2b2c28]">Questions for Your Next Clinic Visit</h3>
            <p class="text-xs text-[#72746b]">Practical questions to bring to your nurse, doctor, or midwife</p>
          </div>
        </div>

        <p class="text-sm text-[#686960]">
          Antenatal visits can feel fast. Here are specific questions tailored for week {week} to help you get clear answers:
        </p>

        <div class="space-y-3">
          {#each guide.clinicQuestions as q, idx}
            <div class="p-4 rounded-2xl bg-[#faf9f6] border border-[#eeece6] flex items-start gap-3">
              <span class="w-6 h-6 rounded-full bg-[#809474] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {idx + 1}
              </span>
              <p class="text-sm text-[#30312c] font-medium leading-relaxed">{q}</p>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  </div>

  <!-- Audio & Translation Hub -->
  <section class="rounded-3xl bg-[#faf9f6] border border-[#e7e4dc] p-6 shadow-2xs space-y-4" aria-label="Audio and voice guide">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <i class="iconoir-sound-high text-lg text-[#809474]"></i>
        <span class="font-serif text-base font-semibold text-[#2b2c28]">Listen to this Guide in Your Language</span>
      </div>
      <span class="text-xs text-[#72746b]">Hausa · Igbo · Yorùbá · Nigerian Pidgin · English</span>
    </div>
    <div class="pt-2">
      <GuideAudio text={comprehensiveNarration} />
    </div>
  </section>

  <!-- Source Footer -->
  <footer class="text-center text-xs text-[#8e9083] py-2 max-w-2xl mx-auto leading-relaxed">
    Adapted from Curtis &amp; Schuler's <em>Your Pregnancy Week by Week</em> and WHO Antenatal Care standards.
    Designed for general education between visits; your maternity team provides individualized clinical care.
  </footer>
</div>
