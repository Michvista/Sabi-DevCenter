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
  } from "@hugeicons/core-free-icons";
  import { daysUntil, formatDate, pregnancyWeek } from "#lib/utils.ts";
  import PregnancyHero from "#lib/components/PregnancyHero.svelte";
  import WellnessCheckin from "#lib/components/WellnessCheckin.svelte";
  import SafetyCheck from "#lib/components/SafetyCheck.svelte";
  import WeeklyGuide from "#lib/components/WeeklyGuide.svelte";
  import FoodGuide from "#lib/components/FoodGuide.svelte";
  import LearningResources from "#lib/components/LearningResources.svelte";
  import NotificationOptIn from "#lib/components/NotificationOptIn.svelte";
  import CareTeamLink from "#lib/components/CareTeamLink.svelte";
  import MealPlanner from "#lib/components/MealPlanner.svelte";
  import GroceryList from "#lib/components/GroceryList.svelte";

  let activeNav = $state("Today");
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
  let selectedWeek = $state<number | null>(null);
  let week = $derived(dueDate ? pregnancyWeek(dueDate) : null);
  let days = $derived(dueDate ? daysUntil(dueDate) : null);
  const navigation = [
    { label: "Today", href: "/pregnant/dashboard", icon: Home01Icon },
    { label: "My pregnancy", href: "#pregnancy", icon: Calendar03Icon },
    { label: "Learn", href: "#learn", icon: BookOpen01Icon },
    { label: "My midwife", href: "#care-team", icon: UserMultiple02Icon },
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
      })
      .catch(() => {
        dateMessage = "We could not save that date. Please try again.";
      })
      .finally(() => (dateSaving = false));
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
          ? "Your antenatal visit is saved. Weekly browser reminders are available below."
          : "Your antenatal visit reminder was removed.";
      })
      .catch(() => {
        visitMessage = "We could not save that visit date. Please try again.";
      })
      .finally(() => (visitSaving = false));
  }
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
          <a
            class:active={activeNav === item.label}
            class="nav-item"
            href={item.href}
            onclick={() => (activeNav = item.label)}
          >
            <HugeiconsIcon icon={item.icon} size={19} strokeWidth={1.8} />
            <span>{item.label}</span>
            {#if item.label === "My midwife"}<span class="nav-pip"></span>{/if}
          </a>
        {/each}
      </nav>
      <div class="sidebar-spacer"></div>
      <div class="midwife-card">
        <div class="mini-avatar">{userInitials}</div>
        <div>
          <strong>{currentUser?.name ?? "Your profile"}</strong><small
            >Your care profile</small
          >
        </div>
        <button aria-label="Open profile" class="more-button">···</button>
      </div>
      <div class="privacy-note">
        <span class="privacy-dot"></span> Your health, held with care
      </div>
    </aside>

    <main class="main-content">
      <header class="topbar">
        <div class="breadcrumb">
          My space <span>/</span> <strong>{activeNav}</strong>
        </div>
        <div class="topbar-right">
          <span class="today-label">{formattedToday}</span><button
            class="avatar-button"
            aria-label="Sign out"
            onclick={signOut}>{userInitials}</button
          >
        </div>
      </header>

      <div class="page-wrap">
        <div class="welcome-row">
          <div>
            <div class="eyebrow">
              <span class="sun-icon">✳</span> YOUR PREGNANCY, YOUR PACE
            </div>
            <h1>
              Good morning, {displayName}<span class="heading-period">.</span>
            </h1>
            <p class="subheading">
              A little care for you and baby, right where you are.
            </p>
          </div>
          {#if week !== null}<div class="week-pill">
              <span class="week-pill-dot"></span>
              {week} weeks along
            </div>{/if}
        </div>

        {#if activeNav === "Today"}
          {#if week !== null}
            <PregnancyHero
              {week}
              onExplore={() => {
                selectedWeek = week;
                activeNav = "My pregnancy";
              }}
            />
          {:else}
            <section
              class="profile-setup"
              aria-labelledby="profile-setup-title"
            >
              <span class="eyebrow small-eyebrow"
                >LET'S PERSONALIZE YOUR SPACE</span
              >
              <h2 id="profile-setup-title">When is your baby due?</h2>
              <p>
                Add the due date your health worker gave you to see your
                pregnancy week and timeline.
              </p>
              <label for="first-due-date">Estimated due date</label>
              <div>
                <input
                  id="first-due-date"
                  type="date"
                  bind:value={dueInput}
                /><button
                  onclick={saveDueDate}
                  disabled={!dueInput || dateSaving}
                  >{dateSaving ? "Saving…" : "Save date"}</button
                >
              </div>
              {#if dateMessage}<small role="status">{dateMessage}</small>{/if}
            </section>
          {/if}
          <NotificationOptIn />

          <section class="summary-grid" aria-label="Pregnancy summary">
            <article class="summary-card due-card">
              <div class="summary-icon coral">
                <HugeiconsIcon icon={Calendar03Icon} size={18} />
              </div>
              <div class="summary-content">
                <span class="summary-label">YOUR DUE DATE</span><strong
                  >{dueDate ? formatDate(dueDate) : "Add your due date"}</strong
                ><span class="summary-note"
                  >{days !== null
                    ? `${days} days to meet your baby`
                    : "Set a due date to personalize your guide"}</span
                >
              </div>
              <details class="edit-due">
                <summary aria-label="Edit due date">···</summary>
                <div class="due-popover">
                  <label for="due-date">Due date</label><input
                    id="due-date"
                    type="date"
                    bind:value={dueInput}
                  /><button onclick={saveDueDate}>Save date</button>
                </div>
              </details>
            </article>
            <article class="summary-card visit-card">
              <div class="summary-icon lilac-bg">
                <HugeiconsIcon icon={Clock01Icon} size={18} />
              </div>
              <div class="summary-content">
                <span class="summary-label">NEXT ANTENATAL VISIT</span><strong>
                  {nextVisitDate ? formatDate(nextVisitDate) : "Not added yet"}
                </strong><span class="summary-note">
                  {nextVisitDate
                    ? daysUntil(nextVisitDate) === 0
                      ? "Your visit is today"
                      : daysUntil(nextVisitDate) > 0
                        ? `In ${daysUntil(nextVisitDate)} days`
                        : "This visit date has passed"
                    : "Keep your next visit on your calendar"}
                </span>
              </div>
              <details class="edit-due visit-editor">
                <summary aria-label="Add or edit antenatal visit">
                  <HugeiconsIcon icon={PlusSignIcon} size={17} />
                </summary>
                <div class="due-popover">
                  <label for="next-visit">Next visit date</label>
                  <input id="next-visit" type="date" bind:value={visitInput} />
                  <button onclick={saveNextVisit} disabled={visitSaving}>
                    {visitSaving ? "Saving…" : "Save visit"}
                  </button>
                  {#if visitMessage}<small role="status">{visitMessage}</small
                    >{/if}
                </div>
              </details>
            </article>
            <article class="summary-card midwife-summary">
              <div class="summary-icon green-bg">
                <HugeiconsIcon icon={UserMultiple02Icon} size={18} />
              </div>
              <div class="summary-content">
                <span class="summary-label">YOUR CARE TEAM</span><strong
                  >Connect with a midwife</strong
                ><span class="summary-note"
                  >You're not on this journey alone</span
                >
              </div>
              <a
                class="summary-arrow"
                aria-label="Connect with a midwife"
                href="/sign-in/midwife"
                ><HugeiconsIcon icon={ArrowRight01Icon} size={17} /></a
              >
            </article>
          </section>
          <div class="content-grid">
            <div class="primary-column">
              <WellnessCheckin />
              <SafetyCheck />
            </div>

            <aside class="secondary-column">
              {#if week !== null}<WeeklyGuide {week} />{/if}
              <FoodGuide week={week ?? 20} />
              <div class="support-note">
                <span class="support-icon">♡</span><span
                  >Questions are welcome.<br /><strong
                    >Your midwife is here for you.</strong
                  ></span
                ><HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </div>
            </aside>
          </div>
        {:else if activeNav === "My pregnancy"}
          <section class="journey-page" id="pregnancy">
            <div class="eyebrow small-eyebrow">YOUR JOURNEY</div>
            <h2>Your pregnancy, week by week</h2>
            {#if week !== null}
              <p>
                You are around week {week}. Your health worker can confirm your
                dates.
              </p>
              <div class="journey-progress" aria-label={`Week ${week} of 42`}>
                <span style={`--progress: ${Math.min(100, (week / 42) * 100)}%`}
                ></span>
              </div>
              <div class="journey-weeks">
                {#each Array.from({ length: 42 }, (_, i) => i + 1) as journeyWeek}<button
                    class:current={journeyWeek === week}
                    class:past={journeyWeek < week}
                    class:selected={journeyWeek === selectedWeek}
                    aria-label={`Week ${journeyWeek}`}
                    aria-pressed={journeyWeek === selectedWeek}
                    onclick={() => (selectedWeek = journeyWeek)}
                    >{journeyWeek}</button
                  >{/each}
              </div>
              {#if selectedWeek !== null}<WeeklyGuide
                  week={selectedWeek}
                />{:else}<WeeklyGuide {week} />{/if}
            {:else}
              <p>
                Add your due date on Today to see your place in the journey.
              </p>
            {/if}
          </section>
        {:else if activeNav === "Learn"}
          <section class="learn-page">
            <div class="eyebrow small-eyebrow">LEARN AT YOUR OWN PACE</div>
            <h2>Helpful information for your pregnancy</h2>
            {#if week !== null}<WeeklyGuide {week} />{/if}
            <LearningResources />
            <FoodGuide week={week ?? 20} />
            <MealPlanner />
            <GroceryList />
          </section>
        {:else}
          <section class="midwife-page">
            <div class="eyebrow small-eyebrow">YOUR CARE TEAM</div>
            <h2>Stay connected with your midwife</h2>
            <p>
              Request a connection with a Sabi care-team account. They can only
              see your check-ins after you request access and they approve.
            </p>
            <CareTeamLink />
          </section>
        {/if}

        {#if activeNav === "Today"}<a
            class="portal-entry"
            href="/sign-in/midwife"
            ><span class="portal-entry-icon"
              ><HugeiconsIcon icon={UserMultiple02Icon} size={19} /></span
            ><span
              ><strong>Are you a nurse or midwife?</strong><small
                >Open the separate Sabi care team portal.</small
              ></span
            ><HugeiconsIcon icon={ArrowRight01Icon} size={17} /></a
          >{/if}

        <footer class="page-footer">
          <a class="footer-brand" href="/pregnant/dashboard"
            >sabi<span>.</span></a
          ><span>Here for the in-between.</span><span class="footer-disclaimer"
            >General education only · Always speak with your health worker</span
          >
        </footer>
      </div>
    </main>
  </div>

  <nav class="mobile-nav" aria-label="Mobile navigation">
    {#each navigation as item}<a
        class:active={activeNav === item.label}
        href={item.href}
        onclick={() => (activeNav = item.label)}
        ><HugeiconsIcon icon={item.icon} size={20} /><span>{item.label}</span
        ></a
      >{/each}
  </nav>
{/if}
