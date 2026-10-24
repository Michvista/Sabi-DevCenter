<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    endSession,
    hasSession,
    sessionToken,
    sessionUser,
  } from "#lib/auth/session.ts";
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
  import RecipeNutrientBuilder from "#lib/components/RecipeNutrientBuilder.svelte";

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
  let weekInput = $state<number | "">(29);
  let weekSaving = $state(false);

  let week = $derived(dueDate ? pregnancyWeek(dueDate) : (typeof weekInput === "number" ? weekInput : 29));
  let days = $derived(dueDate ? daysUntil(dueDate) : null);
  let currentGuide = $derived(getPregnancyWeek(week ?? 29));

  let selectedTrimester = $state<1 | 2 | 3>(3);
  let selectedWeek = $state<number>(29);
  let learnTab = $state<"foods" | "mealplan" | "grocery" | "recipes" | "meds">("foods");

  const navigation = [
    { label: "Today" as const, icon: "iconoir-home", color: "text-[#809474]" },
    { label: "My pregnancy" as const, icon: "iconoir-calendar", color: "text-[#af705a]" },
    { label: "Learn" as const, icon: "iconoir-book", color: "text-[#3b82f6]" },
    { label: "My midwife" as const, icon: "iconoir-hospital", color: "text-[#475842]" },
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
  <div class="min-h-screen bg-[#faf9f6] flex flex-col md:flex-row antialiased text-[#2b2c28]">
    <!-- Sidebar Navigation -->
    <aside class="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 bg-white border-r border-[#e7e4dc] p-6 z-20">
      <a class="flex items-center gap-2.5 mb-8" href="/pregnant/dashboard" aria-label="Sabi home">
        <span class="w-9 h-9 rounded-xl bg-[#af705a] flex items-center justify-center text-white shadow-xs overflow-hidden">
          <img src="/sabi-mark.svg" alt="" class="w-full h-full" />
        </span>
        <span class="font-serif text-2xl font-bold tracking-tight text-[#2b2c28]">
          sabi<span class="text-[#af705a]">.</span>
          <small class="block font-sans text-[10px] font-bold tracking-widest text-[#9c998f] uppercase">care close to home</small>
        </span>
      </a>

      <div class="text-[11px] font-bold tracking-wider text-[#9c998f] uppercase mb-3 px-3">YOUR SPACE</div>
      
      <nav class="space-y-1" aria-label="Main navigation">
        {#each navigation as item}
          <button
            class="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer {activeNav === item.label ? 'bg-[#f4f7f2] text-[#2b2c28] border border-[#dce5d6]' : 'text-[#72746b] hover:text-[#2b2c28] hover:bg-[#faf9f6]'}"
            onclick={() => (activeNav = item.label)}
          >
            <i class="{item.icon} text-lg {item.color}"></i>
            <span>{item.label}</span>
            {#if item.label === "My pregnancy" && week}
              <span class="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#af705a]/15 text-[#af705a]">W{week}</span>
            {/if}
          </button>
        {/each}
      </nav>

      <div class="mt-auto pt-6 border-t border-[#f0ede6] space-y-4">
        <div class="flex items-center gap-3 p-3 rounded-2xl bg-[#faf9f6] border border-[#edeae1]">
          <div class="w-9 h-9 rounded-full bg-[#af705a]/20 text-[#af705a] font-serif font-bold text-sm flex items-center justify-center shrink-0">
            {userInitials}
          </div>
          <div class="min-w-0 flex-1">
            <strong class="block text-xs font-semibold text-[#2b2c28] truncate">{currentUser?.name || "Your Profile"}</strong>
            <small class="block text-[11px] text-[#8e9083] truncate">{dueDate ? `Week ${week} · Due ${dueDate.slice(5)}` : "Care Profile"}</small>
          </div>
        </div>

        <button
          onclick={signOut}
          class="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl text-[#72746b] hover:text-[#2b2c28] hover:bg-[#faf9f6] border border-[#e7e4dc] transition-colors cursor-pointer"
        >
          <i class="iconoir-log-out text-sm"></i>
          <span>Sign out</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 md:ml-64 flex flex-col min-h-screen">
      <!-- Topbar -->
      <header class="sticky top-0 z-10 bg-[#faf9f6]/90 backdrop-blur-md border-b border-[#e7e4dc] px-4 sm:px-8 h-16 flex items-center justify-between">
        <div class="text-xs font-medium text-[#72746b]">
          My space <span class="text-[#c8c5bb] mx-1">/</span> <strong class="font-semibold text-[#2b2c28]">{activeNav}</strong>
        </div>
        <div class="flex items-center gap-4">
          <span class="hidden sm:inline-block text-xs text-[#8e9083] font-medium">{formattedToday}</span>
          <div class="w-8 h-8 rounded-full bg-[#af705a]/20 text-[#af705a] font-serif font-bold text-xs flex items-center justify-center border border-white shadow-2xs">
            {userInitials}
          </div>
        </div>
      </header>

      <div class="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto space-y-6 pb-20 md:pb-8">
        <!-- Welcome Header -->
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
          <div>
            <div class="text-[11px] font-bold tracking-widest text-[#9c998f] uppercase flex items-center gap-1.5">
              <span class="text-[#af705a]">✳</span> YOUR CARE, YOUR PACE
            </div>
            <h1 class="font-serif text-2xl sm:text-3xl font-semibold text-[#2b2c28] tracking-tight mt-1">
              Good morning, {displayName}<span class="text-[#af705a]">.</span>
            </h1>
            <p class="text-xs sm:text-sm text-[#72746b] mt-0.5">
              A little care for you and baby, right where you are.
            </p>
          </div>
          {#if week !== null}
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#e7e4dc] text-xs font-semibold text-[#525547] shadow-2xs">
              <span class="w-2 h-2 rounded-full bg-[#af705a]"></span>
              <span>{week} weeks along · Trimester {Math.min(3, Math.ceil(week / 13))}</span>
            </div>
          {/if}
        </div>

        <!-- TAB 1: TODAY -->
        {#if activeNav === "Today"}
          <!-- Summary Cards Grid -->
          <section class="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="Pregnancy summary">
            <!-- Due Date & Current Week Card -->
            <article class="p-5 rounded-3xl bg-white border border-[#e7e4dc] shadow-xs flex flex-col justify-between space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="w-10 h-10 rounded-2xl bg-[#af705a]/15 text-[#af705a] flex items-center justify-center shrink-0">
                  <i class="iconoir-calendar text-xl"></i>
                </div>
                <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#af705a]/15 text-[#af705a]">
                  Week {week}
                </span>
              </div>
              <div>
                <span class="block text-[11px] font-bold tracking-wider text-[#888b7c] uppercase mb-1">DUE DATE & WEEK</span>
                <strong class="font-serif text-lg font-semibold text-[#2b2c28] block">
                  {dueDate ? formatDate(dueDate) : `Week ${week}`}
                </strong>
                <p class="text-xs text-[#72746b] mt-0.5">
                  {days !== null ? `${days} days until you meet baby` : "Set your current week or due date"}
                </p>
              </div>

              <div class="pt-3 border-t border-[#edeae1] flex items-center gap-2">
                <label for="direct-week-input" class="text-xs text-[#72746b] font-medium">Week:</label>
                <input
                  id="direct-week-input"
                  type="number"
                  min="1"
                  max="42"
                  bind:value={weekInput}
                  class="w-16 px-2 py-1 text-xs font-semibold rounded-lg border border-[#dedad0] bg-[#faf9f6] text-center"
                />
                <button
                  type="button"
                  onclick={saveWeekDirect}
                  disabled={weekSaving}
                  class="py-1 px-3 text-xs font-semibold rounded-lg bg-[#809474] text-white hover:bg-[#6c8060] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  {#if weekSaving}
                    <i class="iconoir-refresh animate-spin text-xs"></i>
                    <span>Saving…</span>
                  {:else}
                    <span>Set Week</span>
                  {/if}
                </button>
              </div>
            </article>

            <!-- Antenatal Visit Card -->
            <article class="p-5 rounded-3xl bg-white border border-[#e7e4dc] shadow-xs flex flex-col justify-between space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="w-10 h-10 rounded-2xl bg-[#7b6fa0]/15 text-[#7b6fa0] flex items-center justify-center shrink-0">
                  <i class="iconoir-clock text-xl"></i>
                </div>
              </div>
              <div>
                <span class="block text-[11px] font-bold tracking-wider text-[#888b7c] uppercase mb-1">NEXT CLINIC VISIT</span>
                <strong class="font-serif text-lg font-semibold text-[#2b2c28] block">
                  {nextVisitDate ? formatDate(nextVisitDate) : "Not scheduled yet"}
                </strong>
                <p class="text-xs text-[#72746b] mt-0.5">
                  {nextVisitDate
                    ? daysUntil(nextVisitDate) === 0
                      ? "Your visit is today!"
                      : daysUntil(nextVisitDate) > 0
                        ? `In ${daysUntil(nextVisitDate)} days`
                        : "Visit date has passed"
                    : "Add your next appointment date"}
                </p>
              </div>

              <div class="pt-3 border-t border-[#edeae1] flex items-center gap-2">
                <input
                  type="date"
                  bind:value={visitInput}
                  class="flex-1 px-2 py-1 text-xs rounded-lg border border-[#dedad0] bg-[#faf9f6]"
                />
                <button
                  type="button"
                  onclick={saveNextVisit}
                  disabled={visitSaving}
                  class="py-1 px-3 text-xs font-semibold rounded-lg bg-[#809474] text-white hover:bg-[#6c8060] transition-colors cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1"
                >
                  {#if visitSaving}
                    <i class="iconoir-refresh animate-spin text-xs"></i>
                    <span>Saving…</span>
                  {:else}
                    <span>Save</span>
                  {/if}
                </button>
              </div>
            </article>

            <!-- Care Team Card -->
            <article class="p-5 rounded-3xl bg-white border border-[#e7e4dc] shadow-xs flex flex-col justify-between space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="w-10 h-10 rounded-2xl bg-[#475842]/15 text-[#475842] flex items-center justify-center shrink-0">
                  <i class="iconoir-hospital text-xl"></i>
                </div>
                <button
                  class="text-xs font-semibold text-[#809474] hover:underline flex items-center gap-1 cursor-pointer"
                  onclick={() => (activeNav = "My midwife")}
                >
                  <span>Open portal</span>
                  <i class="iconoir-arrow-right text-xs"></i>
                </button>
              </div>
              <div>
                <span class="block text-[11px] font-bold tracking-wider text-[#888b7c] uppercase mb-1">YOUR CARE TEAM</span>
                <strong class="font-serif text-lg font-semibold text-[#2b2c28] block">
                  Assigned Midwife
                </strong>
                <p class="text-xs text-[#72746b] mt-0.5">
                  Connected support between antenatal visits
                </p>
              </div>
              <div class="pt-3 border-t border-[#edeae1] text-xs text-[#8e9083]">
                Check-ins and symptoms sync automatically.
              </div>
            </article>
          </section>

          <!-- Main Layout: 2 Columns -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <!-- Left Column: Check-ins -->
            <div class="lg:col-span-7 space-y-6">
              <WellnessCheckin />
              <SafetyCheck />
            </div>

            <!-- Right Column: Baby Highlight & Notifications -->
            <aside class="lg:col-span-5 space-y-6">
              <!-- Baby Size Card -->
              <div class="p-6 rounded-3xl bg-linear-to-br from-[#ffffff] to-[#faf8f5] border border-[#e7e4dc] shadow-xs space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#af705a] uppercase tracking-wider">🌱 BABY THIS WEEK</span>
                  <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#af705a]/15 text-[#af705a]">Week {week}</span>
                </div>
                <h3 class="font-serif text-xl font-semibold text-[#2b2c28]">
                  Baby is the size of a <span class="text-[#af705a]">{currentGuide.babyFruit}</span>
                </h3>
                <div class="flex items-center gap-3 text-xs text-[#72746b]">
                  <span>Length: ~{currentGuide.babyLength}</span>
                  <span>•</span>
                  <span>Weight: ~{currentGuide.babyWeight}</span>
                </div>
                <p class="text-xs text-[#525547] leading-relaxed">{currentGuide.gentlePrompt}</p>

                <div class="p-3.5 rounded-2xl bg-[#faf9f6] border border-[#eeece6] space-y-1">
                  <strong class="text-xs font-semibold text-[#475842] block">🍲 Food to prioritize this week:</strong>
                  <p class="text-xs text-[#525547] leading-relaxed">{currentGuide.nigerianFoodTip}</p>
                </div>

                <button
                  class="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-[#809474] text-white hover:bg-[#6c8060] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                  onclick={() => {
                    selectedWeek = week;
                    selectedTrimester = currentGuide.trimester;
                    activeNav = "My pregnancy";
                  }}
                >
                  <span>Explore Full Week {week} Guide</span>
                  <i class="iconoir-arrow-right text-xs"></i>
                </button>
              </div>

              <!-- Push Notification Opt-in -->
              <NotificationOptIn />

              <!-- Reassurance Card -->
              <div class="p-4 rounded-2xl bg-[#faf9f6] border border-[#e7e4dc] flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-[#af705a]/15 text-[#af705a] flex items-center justify-center text-sm font-bold shrink-0">
                  ♡
                </div>
                <div class="text-xs">
                  <strong class="text-[#2b2c28] block">Questions between clinic visits?</strong>
                  <span class="text-[#72746b]">Your midwife is connected on Sabi to review your check-in updates.</span>
                </div>
              </div>
            </aside>
          </div>

        <!-- TAB 2: MY PREGNANCY -->
        {:else if activeNav === "My pregnancy"}
          <section class="space-y-6" id="pregnancy" aria-labelledby="journey-title">
            <div class="p-6 rounded-3xl bg-white border border-[#e7e4dc] shadow-xs space-y-1">
              <div class="text-[11px] font-bold tracking-widest text-[#9c998f] uppercase">WEEK-BY-WEEK COMPANION</div>
              <h2 id="journey-title" class="font-serif text-2xl font-semibold text-[#2b2c28]">Your 42-Week Pregnancy Journey</h2>
              <p class="text-xs sm:text-sm text-[#72746b]">
                Select any week to follow baby’s milestones, your body’s changes, and weekly Nigerian food guidance.
              </p>
            </div>

            <!-- Trimester Selector Tabs -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" role="tablist">
              <button
                class="p-4 rounded-2xl border text-left transition-all cursor-pointer {selectedTrimester === 1 ? 'bg-white border-[#809474] shadow-xs' : 'bg-[#faf9f6] border-[#e7e4dc] hover:bg-white'}"
                onclick={() => {
                  selectedTrimester = 1;
                  selectedWeek = Math.min(12, selectedWeek);
                }}
              >
                <strong class="block text-sm font-semibold text-[#2b2c28]">Trimester 1</strong>
                <small class="text-xs text-[#72746b]">Weeks 1 – 12 · Foundations</small>
              </button>

              <button
                class="p-4 rounded-2xl border text-left transition-all cursor-pointer {selectedTrimester === 2 ? 'bg-white border-[#809474] shadow-xs' : 'bg-[#faf9f6] border-[#e7e4dc] hover:bg-white'}"
                onclick={() => {
                  selectedTrimester = 2;
                  selectedWeek = Math.max(13, Math.min(27, selectedWeek));
                }}
              >
                <strong class="block text-sm font-semibold text-[#2b2c28]">Trimester 2</strong>
                <small class="text-xs text-[#72746b]">Weeks 13 – 27 · Growth & Kicks</small>
              </button>

              <button
                class="p-4 rounded-2xl border text-left transition-all cursor-pointer {selectedTrimester === 3 ? 'bg-white border-[#809474] shadow-xs' : 'bg-[#faf9f6] border-[#e7e4dc] hover:bg-white'}"
                onclick={() => {
                  selectedTrimester = 3;
                  selectedWeek = Math.max(28, selectedWeek);
                }}
              >
                <strong class="block text-sm font-semibold text-[#2b2c28]">Trimester 3</strong>
                <small class="text-xs text-[#72746b]">Weeks 28 – 42 · Final Stretch</small>
              </button>
            </div>

            <!-- Horizontal Week Pills Selector -->
            <div class="flex gap-2 overflow-x-auto pb-2" aria-label="Select week">
              {#each trimesterWeeks as w}
                <button
                  class="flex-none flex flex-col items-center justify-center w-14 py-2.5 rounded-2xl border transition-all cursor-pointer {w === selectedWeek ? 'bg-[#809474] text-white border-[#809474] shadow-xs' : w === week ? 'bg-[#faf9f6] border-[#af705a] text-[#af705a] font-bold' : 'bg-white border-[#e7e4dc] text-[#525547] hover:border-[#809474]'}"
                  onclick={() => (selectedWeek = w)}
                  aria-pressed={w === selectedWeek}
                >
                  <span class="text-sm font-bold">{w}</span>
                  <span class="text-[10px] uppercase">{w === week ? "You" : `Wk ${w}`}</span>
                </button>
              {/each}
            </div>

            <!-- Weekly Guide Component -->
            <WeeklyGuide week={selectedWeek} />
          </section>

        <!-- TAB 3: LEARN -->
        {:else if activeNav === "Learn"}
          <section class="space-y-6" id="learn" aria-labelledby="learn-hub-title">
            <div class="p-6 rounded-3xl bg-white border border-[#e7e4dc] shadow-xs space-y-1">
              <div class="text-[11px] font-bold tracking-widest text-[#9c998f] uppercase">YOUR KNOWLEDGE HUB</div>
              <h2 id="learn-hub-title" class="font-serif text-2xl font-semibold text-[#2b2c28]">Everything for a Healthy Pregnancy</h2>
              <p class="text-xs sm:text-sm text-[#72746b]">
                Explore Nigerian nutrition, safe medications, weekly meal ideas, and answers to common maternal health questions.
              </p>
            </div>

            <!-- Hub Sub-Navigation Tabs -->
            <div class="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl border border-[#e7e4dc] shadow-2xs">
              <button
                class="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer {learnTab === 'foods' ? 'bg-[#809474] text-white shadow-xs' : 'text-[#686960] hover:text-[#2b2c28] hover:bg-[#faf9f6]'}"
                onclick={() => (learnTab = "foods")}
              >
                <i class="iconoir-apple-half text-sm"></i>
                <span>Food Directory</span>
              </button>
              <button
                class="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer {learnTab === 'mealplan' ? 'bg-[#809474] text-white shadow-xs' : 'text-[#686960] hover:text-[#2b2c28] hover:bg-[#faf9f6]'}"
                onclick={() => (learnTab = "mealplan")}
              >
                <i class="iconoir-calendar text-sm"></i>
                <span>7-Day Meal Planner</span>
              </button>
              <button
                class="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer {learnTab === 'grocery' ? 'bg-[#809474] text-white shadow-xs' : 'text-[#686960] hover:text-[#2b2c28] hover:bg-[#faf9f6]'}"
                onclick={() => (learnTab = "grocery")}
              >
                <i class="iconoir-cart text-sm"></i>
                <span>Market List</span>
              </button>
              <button
                class="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer {learnTab === 'recipes' ? 'bg-[#809474] text-white shadow-xs' : 'text-[#686960] hover:text-[#2b2c28] hover:bg-[#faf9f6]'}"
                onclick={() => (learnTab = "recipes")}
              >
                <i class="iconoir-sparks text-sm"></i>
                <span>Recipe Builder</span>
              </button>
              <button
                class="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer {learnTab === 'meds' ? 'bg-[#809474] text-white shadow-xs' : 'text-[#686960] hover:text-[#2b2c28] hover:bg-[#faf9f6]'}"
                onclick={() => (learnTab = "meds")}
              >
                <i class="iconoir-shield-check text-sm"></i>
                <span>Medication Safety</span>
              </button>
            </div>

            <!-- Tab Content -->
            <div>
              {#if learnTab === "foods"}
                <FoodGuide week={week ?? 28} />
              {:else if learnTab === "mealplan"}
                <MealPlanner pregnancyWeek={week ?? 28} onOpenGrocery={() => (learnTab = "grocery")} />
              {:else if learnTab === "grocery"}
                <GroceryList />
              {:else if learnTab === "recipes"}
                <div class="rounded-3xl bg-white border border-[#e7e4dc] p-6 sm:p-8 shadow-xs">
                  <RecipeNutrientBuilder week={week ?? 28} />
                </div>
              {:else if learnTab === "meds"}
                <LearningResources />
              {/if}
            </div>
          </section>

        <!-- TAB 4: MY MIDWIFE -->
        {:else}
          <section class="space-y-6" id="care-team" aria-labelledby="midwife-title">
            <div class="p-6 rounded-3xl bg-white border border-[#e7e4dc] shadow-xs space-y-1">
              <div class="text-[11px] font-bold tracking-widest text-[#9c998f] uppercase">CARE TEAM OVERSIGHT</div>
              <h2 id="midwife-title" class="font-serif text-2xl font-semibold text-[#2b2c28]">Connected Care with Your Midwife</h2>
              <p class="text-xs sm:text-sm text-[#72746b]">
                Link your profile with your hospital or primary care midwife. They can review your weekly check-ins and support you between appointments.
              </p>
            </div>

            <CareTeamLink />
          </section>
        {/if}

        <!-- Footer -->
        <footer class="pt-8 border-t border-[#edeae1] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8e9083]">
          <div class="flex items-center gap-2">
            <strong class="font-serif text-sm font-bold text-[#2b2c28]">sabi<span class="text-[#af705a]">.</span></strong>
            <span>A maternal health companion for Nigerian families.</span>
          </div>
          <span>General education only · Always consult your nurse, midwife, or doctor</span>
        </footer>
      </div>
    </main>
  </div>

  <!-- Mobile Bottom Navigation -->
  <nav class="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#e7e4dc] px-2 py-2 flex items-center justify-around z-30 shadow-lg" aria-label="Mobile navigation">
    {#each navigation as item}
      <button
        class="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer {activeNav === item.label ? 'text-[#809474] font-bold' : 'text-[#8e9083]'}"
        onclick={() => (activeNav = item.label)}
      >
        <i class="{item.icon} text-xl {item.color}"></i>
        <span class="text-[10px]">{item.label}</span>
      </button>
    {/each}
  </nav>
{/if}
