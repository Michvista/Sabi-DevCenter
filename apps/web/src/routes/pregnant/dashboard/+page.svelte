<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    endSession,
    hasSession,
    sessionToken,
    sessionUser,
  } from "#lib/auth/session.ts";
  import { HugeiconsIcon } from "@hugeicons/svelte";
  import {
    Home01Icon,
    Calendar03Icon,
    BookOpen01Icon,
    UserMultiple02Icon,
    ArrowRight01Icon,
    Clock01Icon,
    PlusSignIcon,
    SparklesIcon,
  } from "@hugeicons/core-free-icons";
  import { daysUntil, formatDate, pregnancyWeek } from "#lib/utils.ts";
  import { getPregnancyWeek } from "#lib/data/pregnancy-weeks.ts";
  import WellnessCheckin from "#lib/components/WellnessCheckin.svelte";
  import SafetyCheck from "#lib/components/SafetyCheck.svelte";
  import WeeklyGuide from "#lib/components/WeeklyGuide.svelte";
  import FoodGuide from "#lib/components/FoodGuide.svelte";
  import LearningResources from "#lib/components/LearningResources.svelte";
  import NotificationOptIn from "#lib/components/NotificationOptIn.svelte";
  import CareTeamLink from "#lib/components/CareTeamLink.svelte";
  import MealPlanner from "#lib/components/MealPlanner.svelte";
  import GroceryList from "#lib/components/GroceryList.svelte";

  let activeNav = $state<"Today" | "My pregnancy" | "Learn" | "My midwife">("Today");
  let authorized = $state(false);
  let currentUser = $state<{ name: string } | null>(null);
  let displayName = $derived(
    currentUser?.name?.trim().split(/\s+/)[0] || "there",
  );
  let userInitials = $derived(
    currentUser?.name
      ?.split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "A",
  );
  let dueDate = $state("");
  let dueInput = $state("");
  let dateSaving = $state(false);
  let dateMessage = $state("");
  let nextVisitDate = $state("");
  let visitInput = $state("");
  let visitSaving = $state(false);
  let visitMessage = $state("");
  let weekInput = $state<number | "">(29); // direct week entry
  let weekSaving = $state(false);

  let week = $derived(dueDate ? pregnancyWeek(dueDate) : (typeof weekInput === "number" ? weekInput : 29));
  let days = $derived(dueDate ? daysUntil(dueDate) : null);
  let currentGuide = $derived(getPregnancyWeek(week ?? 29));


  // My pregnancy interactive state
  let selectedTrimester = $state<1 | 2 | 3>(3);
  let selectedWeek = $state<number>(29);

  // Sub-tabs for Learn
  let learnTab = $state<"foods" | "mealplan" | "meds">("foods");

  const navigation = [
    { label: "Today" as const, href: "/pregnant/dashboard", icon: Home01Icon },
    { label: "My pregnancy" as const, href: "#pregnancy", icon: Calendar03Icon },
    { label: "Learn" as const, href: "#learn", icon: BookOpen01Icon },
    { label: "My midwife" as const, href: "#care-team", icon: UserMultiple02Icon },
  ];

  const formattedToday = new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  onMount(() => {
    if (!hasSession("pregnant")) {
      void goto("/sign-in/pregnant");
      return;
    }
    authorized = true;
    currentUser = { name: sessionUser()?.displayName ?? "" };
    void fetch(
      `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/records/pregnancy`,
      { headers: { Authorization: `Bearer ${sessionToken()}` } },
    )
      .then((r) => r.json())
      .then((record) => {
        if (record?.dueDate) {
          dueDate = record.dueDate.slice(0, 10);
          dueInput = dueDate;
          const currentCalculatedWeek = pregnancyWeek(dueDate);
          selectedWeek = currentCalculatedWeek;
          selectedTrimester = currentCalculatedWeek <= 12 ? 1 : currentCalculatedWeek <= 27 ? 2 : 3;
        }
        if (record?.nextVisitDate) {
          nextVisitDate = record.nextVisitDate.slice(0, 10);
          visitInput = nextVisitDate;
        }
      })
      .catch(() => {});
  });

  function signOut() {
    endSession();
    void goto("/");
  }

  function saveDueDate() {
    if (!dueInput) return;
    dateSaving = true;
    dateMessage = "";
    void fetch(
      `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/records/pregnancy`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken()}`,
        },
        body: JSON.stringify({ dueDate: dueInput }),
      },
    )
      .then((response) => {
        if (!response.ok) throw new Error("Could not save your due date.");
        dueDate = dueInput;
        dateMessage = "Your due date is saved.";
        const newW = pregnancyWeek(dueDate);
        weekInput = newW;
        selectedWeek = newW;
        selectedTrimester = newW <= 12 ? 1 : newW <= 27 ? 2 : 3;
      })
      .catch(() => {
        dateMessage = "We could not save that date. Please try again.";
      })
      .finally(() => (dateSaving = false));
  }

  function saveWeekDirect() {
    const w = typeof weekInput === "number" ? weekInput : parseInt(String(weekInput));
    if (!w || w < 1 || w > 42) return;
    // Compute due date: 40 weeks from LMP, LMP = conception - 2 weeks
    // Due date = today + (40 - w) weeks
    const due = new Date();
    due.setDate(due.getDate() + (40 - w) * 7);
    const dueDateStr = due.toISOString().slice(0, 10);
    weekSaving = true;
    dateMessage = "";
    void fetch(
      `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/records/pregnancy`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken()}`,
        },
        body: JSON.stringify({ dueDate: dueDateStr }),
      },
    )
      .then((response) => {
        if (!response.ok) throw new Error("Could not save.");
        dueDate = dueDateStr;
        dueInput = dueDateStr;
        selectedWeek = w;
        selectedTrimester = w <= 12 ? 1 : w <= 27 ? 2 : 3;
        dateMessage = `Week ${w} saved.`;
      })
      .catch(() => {
        dateMessage = "Could not save your week. Please try again.";
      })
      .finally(() => (weekSaving = false));
  }



  function saveNextVisit() {
    if (!dueDate) {
      visitMessage = "Add your due date before saving a visit.";
      return;
    }
    visitSaving = true;
    visitMessage = "";
    void fetch(
      `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/records/pregnancy`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken()}`,
        },
        body: JSON.stringify({
          dueDate,
          nextVisitDate: visitInput || null,
        }),
      },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not save your visit date.");
        const record = await response.json();
        nextVisitDate = record.nextVisitDate?.slice(0, 10) ?? "";
        visitInput = nextVisitDate;
        visitMessage = nextVisitDate
          ? "Your antenatal visit is saved."
          : "Visit reminder was removed.";
      })
      .catch(() => {
        visitMessage = "We could not save that visit date. Please try again.";
      })
      .finally(() => (visitSaving = false));
  }

  // Weeks for current trimester view
  let trimesterWeeks = $derived(
    selectedTrimester === 1
      ? Array.from({ length: 12 }, (_, i) => i + 1)
      : selectedTrimester === 2
        ? Array.from({ length: 15 }, (_, i) => i + 13)
        : Array.from({ length: 15 }, (_, i) => i + 28),
  );
</script>

<svelte:head>
  <title>Sabi — care for your pregnancy journey</title>
  <meta
    name="description"
    content="A calm, Nigeria-focused pregnancy companion for the days between antenatal visits."
  />
</svelte:head>

{#if authorized}
  <div class="app-shell">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <a class="brand" href="/pregnant/dashboard" aria-label="Sabi home">
        <span class="brand-mark"><img src="/sabi-mark.svg" alt="" /></span>
        <span class="brand-name"
          >sabi<span class="brand-dot">.</span><small>care, close to home</small
          ></span
        >
      </a>
      <div class="side-label">YOUR SPACE</div>
      <nav aria-label="Main navigation">
        {#each navigation as item}
          <button
            class:active={activeNav === item.label}
            class="nav-item"
            onclick={() => (activeNav = item.label)}
          >
            <HugeiconsIcon icon={item.icon} size={19} strokeWidth={1.8} />
            <span>{item.label}</span>
            {#if item.label === "My pregnancy" && week}
              <span class="nav-week-badge">W{week}</span>
            {/if}
          </button>
        {/each}
      </nav>
      <div class="sidebar-spacer"></div>

      <!-- User Profile Badge -->
      <div class="midwife-card">
        <div class="mini-avatar">{userInitials}</div>
        <div>
          <strong>{currentUser?.name || "Your Profile"}</strong>
          <small>{dueDate ? `Week ${week} · Due ${dueDate.slice(5)}` : "Care Profile"}</small>
        </div>
      </div>
      <div class="privacy-note">
        <span class="privacy-dot"></span> Care held with dignity
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <header class="topbar">
        <div class="breadcrumb">
          My space <span>/</span> <strong>{activeNav}</strong>
        </div>
        <div class="topbar-right">
          <span class="today-label">{formattedToday}</span>
          <button
            class="avatar-button"
            aria-label="Sign out"
            title="Sign out of Sabi"
            onclick={signOut}>{userInitials}</button
          >
        </div>
      </header>

      <div class="page-wrap">
        <!-- TOP VIEW: Welcome Header (Common across pages) -->
        <div class="welcome-row">
          <div>
            <div class="eyebrow">
              <span class="sun-icon">✳</span> YOUR CARE, YOUR PACE
            </div>
            <h1>
              Good morning, {displayName}<span class="heading-period">.</span>
            </h1>
            <p class="subheading">
              A little care for you and baby, right where you are.
            </p>
          </div>
          {#if week !== null}
            <div class="week-pill">
              <span class="week-pill-dot"></span>
              {week} weeks along · Trimester {Math.min(3, Math.ceil(week / 13))}
            </div>
          {/if}
        </div>

        <!-- TAB 1: TODAY -->
        {#if activeNav === "Today"}
          <!-- Summary Cards Row -->
          <section class="summary-grid" aria-label="Pregnancy summary">
            <!-- Due Date & Current Week Card -->
            <article class="summary-card due-card">
              <div class="summary-icon coral">
                <HugeiconsIcon icon={Calendar03Icon} size={18} />
              </div>
              <div class="summary-content">
                <div class="flex items-center justify-between gap-2">
                  <span class="summary-label">CURRENT WEEK &amp; DUE DATE</span>
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#af705a]/15 text-[#af705a]">Week {week}</span>
                </div>
                <strong>{dueDate ? formatDate(dueDate) : `Week ${week} (Around Trimester ${Math.min(3, Math.ceil(week / 13))})`}</strong>
                <span class="summary-note">
                  {days !== null
                    ? `${days} days until you meet baby`
                    : "Enter your current week or due date to personalize your timeline"}
                </span>

                <div class="mt-3 pt-2 border-t border-[#e7e4dc] flex flex-wrap items-center gap-2">
                  <label for="direct-week-input" class="text-xs text-[#525547] font-medium">I am on week:</label>
                  <input
                    id="direct-week-input"
                    type="number"
                    min="1"
                    max="42"
                    bind:value={weekInput}
                    class="w-16 px-2 py-1 text-sm font-semibold rounded-md border border-[#d6d2c4] bg-white text-center focus:outline-none focus:ring-1 focus:ring-[#809474]"
                  />
                  <button
                    type="button"
                    onclick={saveWeekDirect}
                    disabled={weekSaving}
                    class="px-2.5 py-1 text-xs font-medium rounded-md bg-[#809474] text-white hover:bg-[#6c8060] transition-colors disabled:opacity-50"
                  >
                    {weekSaving ? "Updating…" : "Set Week"}
                  </button>
                </div>
              </div>
              <details class="edit-due">
                <summary aria-label="Edit due date">···</summary>
                <div class="due-popover">
                  <label for="due-date">Or specify exact due date</label>
                  <input id="due-date" type="date" bind:value={dueInput} />
                  <button onclick={saveDueDate} disabled={dateSaving}>
                    {dateSaving ? "Saving…" : "Save date"}
                  </button>
                  {#if dateMessage}<small role="status">{dateMessage}</small>{/if}
                </div>
              </details>
            </article>

            <!-- Antenatal Visit Card -->
            <article class="summary-card visit-card">
              <div class="summary-icon lilac-bg">
                <HugeiconsIcon icon={Clock01Icon} size={18} />
              </div>
              <div class="summary-content">
                <span class="summary-label">NEXT ANTENATAL VISIT</span>
                <strong>
                  {nextVisitDate ? formatDate(nextVisitDate) : "Not scheduled yet"}
                </strong>
                <span class="summary-note">
                  {nextVisitDate
                    ? daysUntil(nextVisitDate) === 0
                      ? "Your clinic visit is today!"
                      : daysUntil(nextVisitDate) > 0
                        ? `In ${daysUntil(nextVisitDate)} days`
                        : "Visit date has passed"
                    : "Add your next appointment date"}
                </span>
              </div>
              <details class="edit-due visit-editor">
                <summary aria-label="Add or edit antenatal visit">
                  <HugeiconsIcon icon={PlusSignIcon} size={17} />
                </summary>
                <div class="due-popover">
                  <label for="next-visit">Next clinic date</label>
                  <input id="next-visit" type="date" bind:value={visitInput} />
                  <button onclick={saveNextVisit} disabled={visitSaving}>
                    {visitSaving ? "Saving…" : "Save visit"}
                  </button>
                  {#if visitMessage}<small role="status">{visitMessage}</small>{/if}
                </div>
              </details>
            </article>

            <!-- Care Team Card -->
            <article class="summary-card midwife-summary">
              <div class="summary-icon green-bg">
                <HugeiconsIcon icon={UserMultiple02Icon} size={18} />
              </div>
              <div class="summary-content">
                <span class="summary-label">YOUR CARE TEAM</span>
                <strong>Assigned Midwife Connection</strong>
                <span class="summary-note">You are not alone between visits</span>
              </div>
              <button
                class="summary-arrow"
                aria-label="Open care team tab"
                onclick={() => (activeNav = "My midwife")}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={17} />
              </button>
            </article>
          </section>

          <!-- Main Today Two-Column Grid -->
          <div class="today-layout-grid">
            <!-- Left Column: Wellness Check-in & Safety Check -->
            <div class="today-left-col">
              <WellnessCheckin />
              <SafetyCheck />
            </div>

            <!-- Right Column: Today's Week Highlight & Reminders -->
            <aside class="today-right-col">
              <!-- Flo Highlight Card -->
              <div class="today-week-preview-card">
                <div class="preview-badge">
                  <span>🌱 BABY THIS WEEK</span>
                  <span class="badge-week">Week {week}</span>
                </div>
                <h3 class="preview-fruit-title">
                  Baby is the size of a <span class="highlight-fruit">{currentGuide.babyFruit}</span>
                </h3>
                <div class="preview-metrics">
                  <span>Length: ~{currentGuide.babyLength}</span>
                  <span class="bullet">•</span>
                  <span>Weight: ~{currentGuide.babyWeight}</span>
                </div>
                <p class="preview-blurb">{currentGuide.gentlePrompt}</p>

                <div class="preview-food-snippet">
                  <strong>🍲 Food to prioritize this week:</strong>
                  <p>{currentGuide.nigerianFoodTip}</p>
                </div>

                <button
                  class="preview-cta-button"
                  onclick={() => {
                    selectedWeek = week;
                    selectedTrimester = currentGuide.trimester;
                    activeNav = "My pregnancy";
                  }}
                >
                  <span>Explore Full Week {week} Guide</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </button>
              </div>

              <!-- Push Reminder Opt-In -->
              <NotificationOptIn />

              <!-- Quick Care Link Card -->
              <div class="care-reassurance-card">
                <span class="care-heart">♡</span>
                <div>
                  <strong>Questions between clinic visits?</strong>
                  <p>Your midwife is connected on Sabi to review your check-in updates.</p>
                </div>
              </div>
            </aside>
          </div>

        <!-- TAB 2: MY PREGNANCY (FLO-STYLE JOURNEY) -->
        {:else if activeNav === "My pregnancy"}
          <section class="flo-journey-container" id="pregnancy" aria-labelledby="journey-title">
            <div class="journey-header-box">
              <div class="eyebrow small-eyebrow">WEEK-BY-WEEK COMPANION</div>
              <h2 id="journey-title">Your 42-Week Pregnancy Journey</h2>
              <p>
                Select any week to follow baby’s milestones, your body’s changes, and weekly Nigerian food guidance.
              </p>
            </div>

            <!-- Trimester Selector Tabs -->
            <div class="trimester-toggle-bar" role="tablist">
              <button
                class="trimester-btn"
                class:active={selectedTrimester === 1}
                onclick={() => {
                  selectedTrimester = 1;
                  selectedWeek = Math.min(12, selectedWeek);
                }}
              >
                <strong>Trimester 1</strong>
                <small>Weeks 1 – 12 · Foundations</small>
              </button>

              <button
                class="trimester-btn"
                class:active={selectedTrimester === 2}
                onclick={() => {
                  selectedTrimester = 2;
                  selectedWeek = Math.max(13, Math.min(27, selectedWeek));
                }}
              >
                <strong>Trimester 2</strong>
                <small>Weeks 13 – 27 · Growth & Kicks</small>
              </button>

              <button
                class="trimester-btn"
                class:active={selectedTrimester === 3}
                onclick={() => {
                  selectedTrimester = 3;
                  selectedWeek = Math.max(28, selectedWeek);
                }}
              >
                <strong>Trimester 3</strong>
                <small>Weeks 28 – 42 · Final Stretch</small>
              </button>
            </div>

            <!-- Horizontal Week Pills Selector -->
            <div class="week-pills-scroller" aria-label="Select week">
              {#each trimesterWeeks as w}
                <button
                  class="week-bubble"
                  class:current={w === week}
                  class:selected={w === selectedWeek}
                  onclick={() => (selectedWeek = w)}
                  aria-pressed={w === selectedWeek}
                >
                  <span class="bubble-num">{w}</span>
                  <span class="bubble-sub">
                    {#if w === week}You
                    {:else}Wk {w}{/if}
                  </span>
                </button>
              {/each}
            </div>

            <!-- Flo-Style Interactive Weekly Guide for Selected Week -->
            <WeeklyGuide week={selectedWeek} />
          </section>

        <!-- TAB 3: LEARN (STRUCTURED KNOWLEDGE HUB) -->
        {:else if activeNav === "Learn"}
          <section class="learn-hub-page" id="learn" aria-labelledby="learn-hub-title">
            <div class="learn-hero-header">
              <div class="eyebrow small-eyebrow">YOUR KNOWLEDGE HUB</div>
              <h2 id="learn-hub-title">Everything for a Healthy Pregnancy</h2>
              <p>
                Explore Nigerian nutrition, safe medications, weekly meal ideas, and answers to common maternal health questions.
              </p>
            </div>

            <!-- Hub Sub-Navigation Tabs -->
            <div class="learn-subnav">
              <button
                class="subnav-pill"
                class:active={learnTab === "foods"}
                onclick={() => (learnTab = "foods")}
              >
                <span>🍲 Nigerian Foods & Nutrients</span>
              </button>
              <button
                class="subnav-pill"
                class:active={learnTab === "mealplan"}
                onclick={() => (learnTab = "mealplan")}
              >
                <span>📅 7-Day Meal Planner & Market List</span>
              </button>
              <button
                class="subnav-pill"
                class:active={learnTab === "meds"}
                onclick={() => (learnTab = "meds")}
              >
                <span>💊 Medication Safety & Food Guides</span>
              </button>
            </div>

            <!-- Tab Content -->
            <div class="learn-tab-pane">
              {#if learnTab === "foods"}
                <div class="learn-pane-wrap">
                  <FoodGuide week={week ?? 20} />
                </div>
              {:else if learnTab === "mealplan"}
                <div class="learn-pane-wrap mealplan-wrap">
                  <MealPlanner />
                  <GroceryList />
                </div>
              {:else if learnTab === "meds"}
                <div class="learn-pane-wrap">
                  <LearningResources />
                </div>
              {/if}
            </div>
          </section>

        <!-- TAB 4: MY MIDWIFE (CARE TEAM PORTAL) -->
        {:else}
          <section class="midwife-hub-page" id="care-team" aria-labelledby="midwife-title">
            <div class="midwife-hero-header">
              <div class="eyebrow small-eyebrow">CARE TEAM OVERSIGHT</div>
              <h2 id="midwife-title">Connected Care with Your Midwife</h2>
              <p>
                Link your profile with your hospital or primary care midwife. They can review your weekly check-ins,
                blood pressure records, and questions to support you between clinic appointments.
              </p>
            </div>

            <div class="midwife-content-box">
              <CareTeamLink />
            </div>
          </section>
        {/if}

        <footer class="page-footer">
          <a class="footer-brand" href="/pregnant/dashboard"
            >sabi<span>.</span></a
          >
          <span>A maternal health companion for Nigerian families.</span>
          <span class="footer-disclaimer"
            >General education only · Always consult your nurse, midwife, or doctor</span
          >
        </footer>
      </div>
    </main>
  </div>

  <!-- Mobile Bottom Navigation -->
  <nav class="mobile-nav" aria-label="Mobile navigation">
    {#each navigation as item}
      <button
        class:active={activeNav === item.label}
        onclick={() => (activeNav = item.label)}
      >
        <HugeiconsIcon icon={item.icon} size={20} />
        <span>{item.label}</span>
      </button>
    {/each}
  </nav>
{/if}
