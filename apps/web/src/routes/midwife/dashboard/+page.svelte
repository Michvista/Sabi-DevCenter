<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    endSession,
    hasSession,
    sessionToken,
    sessionUser,
  } from "#lib/auth/session.ts";
  import { pregnancyWeek } from "#lib/utils.ts";
  import { getPregnancyWeek } from "#lib/data/pregnancy-weeks.ts";

  let query = $state("");
  let selected = $state("");
  let authorized = $state(false);
  let activeTab = $state<"overview" | "followups" | "messages" | "reviews">("overview");
  let clinicianName = $state("Care team member");
  let roster = $state<
    {
      id: string;
      name: string;
      email: string;
      week: number;
      due: string;
      nextVisit: string | null;
      status: string;
      tone: string;
      last: string;
      note?: string | null;
      symptoms?: string[];
      checkInAt?: string | null;
      risk: boolean;
    }[]
  >([]);
  let requests = $state<
    { id: string; patientName: string; patientEmail: string }[]
  >([]);
  let clinicalReviews = $state<
    Array<{ week: number; status: string; notes: string | null }>
  >([]);
  let reviewWeek = $state(1);
  let reviewNotes = $state("");
  let reviewMessage = $state("");
  let reviewBusy = $state(false);
  let reviewWeekGuide = $derived(getPregnancyWeek(reviewWeek));
  let clinicianInitials = $derived(
    clinicianName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  );

  let showHistory = $state(false);
  let historyLoading = $state(false);
  let patientCheckIns = $state<
    Array<{
      id: string;
      mood: string;
      symptoms: string[];
      note?: string | null;
      createdAt: string;
    }>
  >([]);

  // Direct patient messaging state
  let patientMessages = $state<
    Array<{
      id: string;
      senderRole: "PREGNANT_PERSON" | "MIDWIFE";
      content: string;
      createdAt: string;
    }>
  >([]);
  let replyText = $state("");
  let sendingReply = $state(false);
  let replySuccess = $state(false);
  let openedFollowups = $state(false);
  let openedMessages = $state(false);
  let approvingId = $state<string | null>(null);
  let reviewDecision = $state<"APPROVED" | "CHANGES_REQUESTED" | null>(null);
  let refreshingCareData = $state(false);

  onMount(() => {
    if (!hasSession("midwife")) void goto("/sign-in/midwife");
    else {
      clinicianName = sessionUser()?.displayName || "Care team member";
      authorized = true;
      void loadCareData();
    }
  });

  function signOut() {
    endSession();
    void goto("/");
  }

  function formatHumanDate(dateStr?: string | null): string {
    if (!dateStr) return "Not scheduled";
    try {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  function formatMoodLabel(mood: string): string {
    if (!mood) return "No check-in recorded";
    const map: Record<string, string> = {
      good: "Feeling Good ☺",
      okay: "Feeling Okay ◡",
      off: "Feeling a Little Off ﹏",
      support: "Needs Support ♡",
      urgent_symptoms: "Reported Urgent Warning Symptoms",
      reported_symptoms: "Reported Mild Discomfort",
      message_to_midwife: "Message from Patient",
    };
    return map[mood] ?? mood;
  }

  async function loadCareData() {
    refreshingCareData = true;
    try {
      const headers = { Authorization: `Bearer ${sessionToken()}` };
      const api = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
      const [patientsResponse, requestsResponse, reviewsResponse] =
        await Promise.all([
          fetch(`${api}/records/care-team/patients`, { headers }),
          fetch(`${api}/records/care-team/requests`, { headers }),
          fetch(`${api}/records/clinical-reviews`, { headers }),
        ]);
      const items = patientsResponse.ok
        ? ((await patientsResponse.json()) as Array<{
            id: string;
            displayName: string;
            email: string;
            dueDate?: string;
            nextVisitDate?: string;
            mood?: string;
            symptoms?: string[];
            note?: string;
            checkInAt?: string;
          }>)
        : [];
      requests = requestsResponse.ok
        ? ((await requestsResponse.json()) as typeof requests)
        : [];
      clinicalReviews = reviewsResponse.ok
        ? ((await reviewsResponse.json()) as typeof clinicalReviews)
        : [];
      reviewNotes =
        clinicalReviews.find((entry) => entry.week === Number(reviewWeek))
          ?.notes ?? "";

      const tones = ["sage", "peach", "lilac", "gold"];
      roster = items.map((p, idx) => {
        const isUrgent = p.mood === "urgent_symptoms" || (p.symptoms && p.symptoms.length > 0);
        return {
          id: p.id,
          name: p.displayName,
          email: p.email,
          week: p.dueDate ? pregnancyWeek(p.dueDate) : 0,
          due: formatHumanDate(p.dueDate),
          nextVisit: p.nextVisitDate ? formatHumanDate(p.nextVisitDate) : null,
          status: isUrgent ? "Needs Follow-up" : p.mood ? "Checked in" : "No check-in yet",
          tone: tones[idx % tones.length],
          last: p.mood ? formatMoodLabel(p.mood) : "No check-in shared",
          note: p.note,
          symptoms: p.symptoms ?? [],
          checkInAt: p.checkInAt,
          risk: Boolean(isUrgent),
        };
      });
      if (!selected && roster[0]) {
        selected = roster[0].id;
        void loadPatientMessages(selected);
      }
    } finally {
      refreshingCareData = false;
    }
  }

  async function loadPatientMessages(patientId: string) {
    if (!patientId) return;
    try {
      const api = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
      const res = await fetch(`${api}/records/care-team/patients/${patientId}/messages`, {
        headers: { Authorization: `Bearer ${sessionToken()}` },
      });
      if (res.ok) {
        patientMessages = await res.json();
      }
    } catch {
      // silent
    }
  }

  $effect(() => {
    if (selected) {
      void loadPatientMessages(selected);
    }
  });

  async function viewPatientHistory(patientId: string) {
    showHistory = true;
    historyLoading = true;
    patientCheckIns = [];
    try {
      const api = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
      const res = await fetch(`${api}/records/care-team/patients/${patientId}/check-ins`, {
        headers: { Authorization: `Bearer ${sessionToken()}` },
      });
      if (res.ok) {
        patientCheckIns = await res.json();
      }
    } catch {
      // silent
    } finally {
      historyLoading = false;
    }
  }

  async function sendClinicianNote(e: SubmitEvent) {
    e.preventDefault();
    if (!replyText.trim() || sendingReply || !patient.id) return;
    sendingReply = true;
    const textToSend = replyText.trim();
    try {
      const api = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
      const res = await fetch(`${api}/records/care-team/patients/${patient.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken()}`,
        },
        body: JSON.stringify({ content: textToSend }),
      });
      if (res.ok) {
        const saved = await res.json();
        patientMessages = [...patientMessages, saved];
        replySuccess = true;
        replyText = "";
        setTimeout(() => {
          replySuccess = false;
        }, 4000);
      }
    } finally {
      sendingReply = false;
    }
  }

  async function approveRequest(id: string) {
    approvingId = id;
    try {
      const api = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
      await fetch(`${api}/records/care-team/requests/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken()}` },
      });
      await loadCareData();
    } finally {
      approvingId = null;
    }
  }

  async function submitClinicalReview(
    status: "APPROVED" | "CHANGES_REQUESTED",
  ) {
    reviewBusy = true;
    reviewDecision = status;
    reviewMessage = "";
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/records/clinical-reviews/${reviewWeek}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken()}`,
          },
          body: JSON.stringify({ status, notes: reviewNotes }),
        },
      );
      const result = (await response.json()) as { message?: string };
      if (!response.ok)
        throw new Error(result.message ?? "Could not save review.");
      reviewMessage =
        status === "APPROVED"
          ? "✓ Clinical review recorded successfully for Week " + reviewWeek + "."
          : "✓ Content revision request logged for Week " + reviewWeek + ".";
      await loadCareData();
    } catch (error) {
      reviewMessage =
        error instanceof Error ? error.message : "Could not save review.";
    } finally {
      reviewBusy = false;
      reviewDecision = null;
    }
  }

  let filtered = $derived(
    roster.filter((person) =>
      person.name.toLowerCase().includes(query.toLowerCase()),
    ),
  );

  let patient = $derived(
    roster.find((person) => person.id === selected) ??
      roster[0] ?? {
        id: "",
        name: "No linked patients yet",
        email: "",
        week: 0,
        due: "Not set",
        nextVisit: null,
        status: "",
        tone: "sage",
        last: "Patients will appear after they request a connection and you approve it.",
        note: null,
        symptoms: [],
        checkInAt: null,
        risk: false,
      },
  );

  let followUpList = $derived(
    roster.filter((p) => p.risk || p.status === "Needs Follow-up"),
  );
</script>

<svelte:head>
  <title>Care team portal — Sabi</title>
  <meta
    name="description"
    content="A separate overview for midwives supporting their patients between antenatal visits."
  />
</svelte:head>

{#if authorized}
  <div class="min-h-screen bg-[#faf9f6] flex flex-col md:flex-row antialiased text-[#2b2c28]">
    <!-- Midwife Sidebar -->
    <aside class="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 bg-white border-r border-[#e7e4dc] p-6 z-20">
      <a class="flex items-center gap-2.5 mb-8" href="/midwife/dashboard">
        <span class="w-9 h-9 rounded-xl bg-[#475842] flex items-center justify-center text-white shadow-xs overflow-hidden">
          <img src="/sabi-mark.svg" alt="" class="w-full h-full" />
        </span>
        <span class="font-serif text-2xl font-bold tracking-tight text-[#2b2c28]">
          sabi<span class="text-[#af705a]">.</span>
          <small class="block font-sans text-[10px] font-bold tracking-widest text-[#9c998f] uppercase">CARE TEAM</small>
        </span>
      </a>

      <div class="text-[11px] font-bold tracking-wider text-[#9c998f] uppercase mb-3 px-3">CLINICAL SUITE</div>

      <nav class="space-y-1" aria-label="Care team navigation">
        <button
          class="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer {activeTab === 'overview' ? 'bg-[#f4f7f2] text-[#2b2c28] border border-[#dce5d6]' : 'text-[#72746b] hover:text-[#2b2c28] hover:bg-[#faf9f6]'}"
          onclick={() => (activeTab = 'overview')}
        >
          <i class="iconoir-activity text-base text-[#809474]"></i>
          <span>Patient overview</span>
        </button>

        <button
          class="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer {activeTab === 'followups' ? 'bg-[#f4f7f2] text-[#2b2c28] border border-[#dce5d6]' : 'text-[#72746b] hover:text-[#2b2c28] hover:bg-[#faf9f6]'}"
          onclick={() => {
            activeTab = 'followups';
            openedFollowups = true;
          }}
        >
          <i class="iconoir-calendar text-base text-[#af705a]"></i>
          <span>Follow-up queue</span>
          {#if followUpList.length > 0 && !openedFollowups}
            <span class="ml-auto px-2 py-0.5 text-xs font-bold rounded-full bg-[#af705a] text-white">
              {followUpList.length}
            </span>
          {/if}
        </button>

        <button
          class="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer {activeTab === 'messages' ? 'bg-[#f4f7f2] text-[#2b2c28] border border-[#dce5d6]' : 'text-[#72746b] hover:text-[#2b2c28] hover:bg-[#faf9f6]'}"
          onclick={() => {
            activeTab = 'messages';
            openedMessages = true;
          }}
        >
          <i class="iconoir-chat-bubble-check text-base text-[#3b82f6]"></i>
          <span>Patient messages</span>
          {#if patientMessages.length > 0 && !openedMessages}
            <span class="ml-auto px-2 py-0.5 text-xs font-bold rounded-full bg-[#3b82f6]/15 text-[#3b82f6]">
              {patientMessages.length}
            </span>
          {/if}
        </button>

        <button
          class="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer {activeTab === 'reviews' ? 'bg-[#f4f7f2] text-[#2b2c28] border border-[#dce5d6]' : 'text-[#72746b] hover:text-[#2b2c28] hover:bg-[#faf9f6]'}"
          onclick={() => (activeTab = 'reviews')}
        >
          <i class="iconoir-shield-check text-base text-[#7b6fa0]"></i>
          <span>Content review</span>
        </button>
      </nav>

      <div class="mt-auto pt-6 border-t border-[#f0ede6] space-y-4">
        <div class="flex items-center gap-3 p-3 rounded-2xl bg-[#faf9f6] border border-[#edeae1]">
          <div class="w-9 h-9 rounded-full bg-[#475842]/20 text-[#475842] font-serif font-bold text-sm flex items-center justify-center shrink-0">
            {clinicianInitials}
          </div>
          <div class="min-w-0 flex-1">
            <strong class="block text-xs font-semibold text-[#2b2c28] truncate">{clinicianName}</strong>
            <small class="block text-[11px] text-[#8e9083] truncate">Care team account</small>
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
        <a class="inline-flex items-center gap-1.5 text-xs font-medium text-[#72746b] hover:text-[#2b2c28] transition-colors" href="/">
          <i class="iconoir-arrow-left text-sm"></i> Sabi home
        </a>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[#809474]"></span>
            <span class="text-xs text-[#8e9083] font-medium">Active Clinical Session</span>
          </div>
          <div class="w-8 h-8 rounded-full bg-[#475842]/20 text-[#475842] font-serif font-bold text-xs flex items-center justify-center border border-white shadow-2xs">
            {clinicianInitials}
          </div>
        </div>
      </header>

      <div class="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto space-y-6 pb-20 md:pb-8">
        <!-- Welcome Row -->
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
          <div>
            <div class="text-[11px] font-bold tracking-widest text-[#9c998f] uppercase">YOUR CARE TEAM</div>
            <h1 class="font-serif text-2xl sm:text-3xl font-semibold text-[#2b2c28] tracking-tight mt-1">
              Good morning, {clinicianName}<span class="text-[#af705a]">.</span>
            </h1>
            <p class="text-xs sm:text-sm text-[#72746b] mt-0.5">Stay close to the people in your care, between every visit.</p>
          </div>
          <button
            disabled={refreshingCareData}
            class="inline-flex items-center gap-2 py-2 px-4 text-xs font-semibold rounded-xl bg-white border border-[#d6d2c4] text-[#475842] hover:bg-[#faf9f6] disabled:opacity-60 transition-colors cursor-pointer shadow-2xs shrink-0"
            onclick={() => void loadCareData()}
          >
            <i class="iconoir-refresh text-sm {refreshingCareData ? 'animate-spin' : ''}"></i>
            <span>{refreshingCareData ? "Refreshing…" : "Refresh care requests"}</span>
          </button>
        </div>

        <!-- Metrics Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <article class="p-5 rounded-3xl bg-white border border-[#e7e4dc] shadow-xs flex items-center justify-between">
            <div>
              <span class="text-[11px] font-bold tracking-wider text-[#888b7c] uppercase block">CONNECTED PATIENTS</span>
              <strong class="font-serif text-3xl font-semibold text-[#2b2c28] block my-1">{String(roster.length).padStart(2, "0")}</strong>
              <small class="text-xs text-[#8e9083]">Across your care list</small>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-[#809474]/15 flex items-center justify-center text-[#475842]">
              <i class="iconoir-community text-2xl"></i>
            </div>
          </article>

          <article class="p-5 rounded-3xl bg-white border border-[#e7e4dc] shadow-xs flex items-center justify-between">
            <div>
              <span class="text-[11px] font-bold tracking-wider text-[#888b7c] uppercase block">CHECK-INS LOGGED</span>
              <strong class="font-serif text-3xl font-semibold text-[#2b2c28] block my-1">
                {String(roster.filter(p => p.status !== "No check-in yet").length).padStart(2, "0")}
              </strong>
              <small class="text-xs text-[#8e9083]">Patients with active logs</small>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-[#809474]/15 flex items-center justify-center text-[#475842]">
              <i class="iconoir-activity text-2xl"></i>
            </div>
          </article>

          <article class="p-5 rounded-3xl bg-white border border-[#e7e4dc] shadow-xs flex items-center justify-between">
            <div>
              <span class="text-[11px] font-bold tracking-wider text-[#888b7c] uppercase block">ATTENTION NEEDED</span>
              <strong class="font-serif text-3xl font-semibold block my-1 {followUpList.length > 0 ? 'text-[#b94a32]' : 'text-[#2b2c28]'}">
                {String(followUpList.length).padStart(2, "0")}
              </strong>
              <small class="text-xs text-[#8e9083]">Reported warnings / messages</small>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-[#af705a]/15 flex items-center justify-center text-[#af705a]">
              <i class="iconoir-bell text-2xl"></i>
            </div>
          </article>
        </div>

        <!-- SECTION 1: OVERVIEW TAB -->
        {#if activeTab === 'overview'}
          <section class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <!-- Left Panel: Roster List -->
            <div class="lg:col-span-5 rounded-3xl bg-white border border-[#e7e4dc] p-6 shadow-xs space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-[#f0ede6]">
                <div>
                  <div class="text-[11px] font-bold tracking-widest text-[#888b7c] uppercase">YOUR PEOPLE</div>
                  <h2 class="font-serif text-xl font-semibold text-[#2b2c28]">Patient check-ins</h2>
                </div>
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#faf9f6] border border-[#e7e4dc] text-[#55574f]">
                  {roster.length} {roster.length === 1 ? 'person' : 'people'}
                </span>
              </div>

              <!-- Search -->
              <div class="relative">
                <input
                  bind:value={query}
                  placeholder="Find a patient…"
                  aria-label="Find a patient"
                  class="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-[#dedad0] bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#809474]/40 focus:bg-white"
                />
                <i class="iconoir-search absolute left-3 top-3 text-xs text-[#888]"></i>
              </div>

              <!-- Pending Requests -->
              {#if requests.length}
                <div class="p-3.5 rounded-2xl bg-[#fef9e7] border border-[#e9d27a] space-y-2">
                  <strong class="text-xs font-bold text-[#7c440a] block">Connection requests ({requests.length})</strong>
                  {#each requests as request (request.id)}
                    <div class="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-[#e9d27a]/40">
                      <div>
                        <span class="font-semibold text-[#2b2c28] block">{request.patientName}</span>
                        <small class="text-[#8e9083]">{request.patientEmail}</small>
                      </div>
                      <button
                        type="button"
                        disabled={approvingId === request.id}
                        onclick={() => void approveRequest(request.id)}
                        class="py-1 px-3 text-xs font-semibold rounded-lg bg-[#809474] text-white hover:bg-[#6c8060] disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {#if approvingId === request.id}
                          <i class="iconoir-refresh animate-spin text-xs"></i>
                          <span>Approving…</span>
                        {:else}
                          <span>Approve</span>
                        {/if}
                      </button>
                    </div>
                  {/each}
                </div>
              {/if}

              <!-- Patients List -->
              <div class="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                {#each filtered as person}
                  <button
                    class="w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 {selected === person.id ? 'bg-[#f4f7f2] border-[#809474]' : 'bg-[#faf9f6] border-[#eeece6] hover:bg-white'}"
                    onclick={() => {
                      selected = person.id;
                      void loadPatientMessages(person.id);
                    }}
                  >
                    <div class="w-10 h-10 rounded-full bg-[#af705a]/15 text-[#af705a] font-serif font-bold text-xs flex items-center justify-center shrink-0">
                      {person.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div class="min-w-0 flex-1">
                      <strong class="block text-sm font-semibold text-[#2b2c28] truncate">{person.name}</strong>
                      <small class="block text-xs text-[#72746b] truncate">
                        {person.week ? `${person.week} weeks` : "No due date"} · {person.status}
                      </small>
                    </div>
                    {#if person.risk}
                      <span class="w-2 h-2 rounded-full bg-[#af705a] shrink-0" title="Question to review"></span>
                    {/if}
                    <i class="iconoir-nav-arrow-right text-xs text-[#aaa]"></i>
                  </button>
                {/each}

                {#if filtered.length === 0}
                  <p class="text-xs text-[#8e9083] p-4 rounded-xl bg-[#faf9f6] text-center">
                    No linked patient matches that search.
                  </p>
                {/if}
              </div>

              <div class="text-[11px] text-[#8e9083] pt-3 border-t border-[#f0ede6] leading-relaxed">
                Only patients who requested a connection and were approved appear here.
              </div>
            </div>

            <!-- Right Panel: Patient Detail -->
            <div class="lg:col-span-7 rounded-3xl bg-white border border-[#e7e4dc] p-6 sm:p-8 shadow-xs space-y-6">
              <!-- Profile Top -->
              <div class="flex items-start justify-between gap-4 pb-6 border-b border-[#f0ede6]">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-2xl bg-[#af705a]/15 text-[#af705a] font-serif font-bold text-xl flex items-center justify-center shadow-xs">
                    {patient.name ? patient.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() : "PT"}
                  </div>
                  <div>
                    <h2 class="font-serif text-2xl font-semibold text-[#2b2c28]">{patient.name}</h2>
                    <p class="text-xs text-[#72746b] mt-0.5">{patient.email || "Connected care record"}</p>
                  </div>
                </div>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edf5eb] text-[#385a38] text-xs font-semibold border border-[#c6dfc0]">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#385a38]"></span> Connected
                </span>
              </div>

              <!-- Stats Row -->
              <div class="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#faf9f6] border border-[#eeece6]">
                <div>
                  <small class="text-[10px] font-bold text-[#888b7c] uppercase tracking-wider block">PREGNANCY</small>
                  <strong class="text-sm font-semibold text-[#2b2c28]">{patient.week ? `Week ${patient.week}` : "Not set"}</strong>
                </div>
                <div>
                  <small class="text-[10px] font-bold text-[#888b7c] uppercase tracking-wider block">DUE DATE</small>
                  <strong class="text-sm font-semibold text-[#2b2c28]">{patient.due}</strong>
                </div>
                <div>
                  <small class="text-[10px] font-bold text-[#888b7c] uppercase tracking-wider block">NEXT VISIT</small>
                  <strong class="text-sm font-semibold text-[#2b2c28]">{patient.nextVisit ?? "Not scheduled"}</strong>
                </div>
              </div>

              <!-- Latest Check-in -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <strong class="text-xs font-bold text-[#888b7c] uppercase tracking-wider">LATEST PATIENT CHECK-IN</strong>
                  <span class="text-xs text-[#8e9083]">{patient.checkInAt ? formatHumanDate(patient.checkInAt) : "Recent log"}</span>
                </div>

                <div class="font-serif text-lg text-[#2b2c28] italic p-4 rounded-2xl bg-[#faf9f6] border border-[#eeece6]">
                  “{patient.last}”
                </div>

                {#if patient.symptoms && patient.symptoms.length > 0}
                  <div class="p-4 rounded-2xl bg-[#fdf4f0] border border-[#f4cfc4] space-y-2">
                    <strong class="text-xs font-semibold text-[#9c2d15] block">
                      Reported Symptoms ({patient.symptoms.length})
                    </strong>
                    <div class="flex flex-wrap gap-1.5">
                      {#each patient.symptoms as s}
                        <span class="px-3 py-1 text-xs rounded-full bg-[#fdeae5] text-[#9c2d15] font-semibold border border-[#f6d0c6]">
                          {s}
                        </span>
                      {/each}
                    </div>
                  </div>
                {/if}

                {#if patient.note}
                  <div class="p-4 rounded-2xl bg-[#faf9f6] border border-[#eeece6] space-y-1">
                    <strong class="text-xs font-semibold text-[#475842] block">Patient Note / Question</strong>
                    <p class="text-xs text-[#525547] leading-relaxed italic">"{patient.note}"</p>
                  </div>
                {/if}

                <div class="pt-2 flex items-center justify-between">
                  <button
                    class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#809474] hover:underline cursor-pointer"
                    onclick={() => void viewPatientHistory(patient.id)}
                  >
                    <span>View full check-in history</span>
                    <i class="iconoir-arrow-right text-xs"></i>
                  </button>
                  <button
                    class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3b82f6] hover:underline cursor-pointer"
                    onclick={() => (activeTab = 'messages')}
                  >
                    <span>Open message conversation</span>
                    <i class="iconoir-chat-bubble-check text-xs"></i>
                  </button>
                </div>
              </div>
            </div>
          </section>

        <!-- SECTION 2: FOLLOW-UPS TAB -->
        {:else if activeTab === 'followups'}
          <section class="rounded-3xl bg-white border border-[#e7e4dc] p-6 sm:p-8 shadow-xs space-y-6">
            <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#f0ede6]">
              <div>
                <div class="text-[11px] font-bold tracking-widest text-[#888b7c] uppercase">PRIORITY CARE LIST</div>
                <h2 class="font-serif text-2xl font-semibold text-[#2b2c28]">Patient Follow-ups</h2>
                <p class="text-xs text-[#72746b] mt-0.5">Patients with reported symptoms, warning indicators, or awaiting clinic visits.</p>
              </div>
              <span class="px-3 py-1 rounded-full bg-[#fdf4f0] text-[#9c2d15] text-xs font-bold border border-[#f4cfc4]">
                {followUpList.length} requiring review
              </span>
            </div>

            {#if followUpList.length === 0}
              <div class="py-16 text-center rounded-2xl bg-[#faf9f6] border border-dashed border-[#e2dfd5] space-y-2">
                <i class="iconoir-check-circle text-4xl text-[#809474]"></i>
                <h3 class="font-serif text-lg font-semibold text-[#2b2c28]">All caught up</h3>
                <p class="text-xs text-[#72746b] max-w-sm mx-auto">
                  None of your connected patients have reported urgent symptoms or unresolved warning signs.
                </p>
              </div>
            {:else}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each followUpList as p}
                  <div class="p-5 rounded-2xl border border-[#f4cfc4] bg-[#fdf4f0] flex flex-col justify-between space-y-4">
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <span class="inline-flex items-center gap-1.5 text-xs font-bold text-[#9c2d15]">
                          <span class="w-2 h-2 rounded-full bg-[#9c2d15]"></span>
                          {p.last}
                        </span>
                        <span class="text-xs text-[#8e9083] font-semibold">{p.week ? `Wk ${p.week}` : 'Due: ' + p.due}</span>
                      </div>
                      <h4 class="font-serif text-lg font-semibold text-[#2b2c28]">{p.name}</h4>
                      <p class="text-xs text-[#72746b]">{p.email}</p>

                      {#if p.symptoms && p.symptoms.length > 0}
                        <div class="mt-3 flex flex-wrap gap-1.5">
                          {#each p.symptoms as sym}
                            <span class="px-2.5 py-0.5 rounded-full bg-white text-[#9c2d15] text-xs font-semibold border border-[#f4cfc4]">
                              {sym}
                            </span>
                          {/each}
                        </div>
                      {/if}

                      {#if p.note}
                        <div class="mt-3 p-3 rounded-xl bg-white border border-[#f4cfc4]/50 text-xs text-[#525547] italic">
                          "{p.note}"
                        </div>
                      {/if}
                    </div>

                    <div class="pt-3 border-t border-[#f4cfc4]/50 flex items-center justify-between">
                      <span class="text-xs text-[#72746b]">Next visit: {p.nextVisit ?? "None set"}</span>
                      <button
                        class="py-1.5 px-3.5 text-xs font-semibold rounded-xl bg-[#809474] text-white hover:bg-[#6c8060] transition-colors cursor-pointer shadow-2xs"
                        onclick={() => {
                          selected = p.id;
                          activeTab = 'overview';
                        }}
                      >
                        Open Record →
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </section>

        <!-- SECTION 3: PATIENT MESSAGES TAB -->
        {:else if activeTab === 'messages'}
          <section class="rounded-3xl bg-white border border-[#e7e4dc] p-6 sm:p-8 shadow-xs space-y-6">
            <div class="flex items-center justify-between pb-4 border-b border-[#f0ede6]">
              <div>
                <div class="text-[11px] font-bold tracking-widest text-[#888b7c] uppercase">TWO-WAY THREAD</div>
                <h2 class="font-serif text-2xl font-semibold text-[#2b2c28]">Messages with {patient.name}</h2>
                <p class="text-xs text-[#72746b] mt-0.5">Clinical notes and answers shared directly to the patient's dashboard.</p>
              </div>
              <span class="text-xs font-semibold px-3 py-1 rounded-full bg-[#3b82f6]/15 text-[#3b82f6]">
                {patientMessages.length} messages
              </span>
            </div>

            <!-- Thread Messages -->
            <div class="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {#if patientMessages.length === 0}
                <div class="py-12 text-center rounded-2xl bg-[#faf9f6] border border-dashed border-[#e2dfd5] space-y-1">
                  <i class="iconoir-chat-bubble-check text-2xl text-[#888]"></i>
                  <p class="text-xs text-[#72746b]">No messages in this patient thread yet.</p>
                  <span class="text-[11px] text-[#8e9083]">Post a note below to begin the care dialogue.</span>
                </div>
              {:else}
                {#each patientMessages as msg (msg.id)}
                  <div class="flex flex-col {msg.senderRole === 'MIDWIFE' ? 'items-end' : 'items-start'}">
                    <div class="flex items-center gap-1.5 mb-1 px-1">
                      <span class="text-[11px] font-semibold {msg.senderRole === 'MIDWIFE' ? 'text-[#475842]' : 'text-[#809474]'}">
                        {msg.senderRole === 'MIDWIFE' ? 'You (Midwife)' : patient.name}
                      </span>
                      <span class="text-[10px] text-[#8e9083]">· {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div class="max-w-md p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs {msg.senderRole === 'MIDWIFE' ? 'bg-[#475842] text-white rounded-tr-xs' : 'bg-[#faf9f6] border border-[#e7e4dc] text-[#2b2c28] rounded-tl-xs'}">
                      {msg.content}
                    </div>
                  </div>
                {/each}
              {/if}
            </div>

            <!-- Clinician Reply Form -->
            <form class="space-y-3 pt-4 border-t border-[#f0ede6]" onsubmit={sendClinicianNote}>
              <div>
                <label for="clinician-msg-input" class="block text-xs font-semibold text-[#55574f] mb-1.5">
                  Send a clinical response or antenatal follow-up to {patient.name}
                </label>
                <textarea
                  id="clinician-msg-input"
                  bind:value={replyText}
                  rows="3"
                  maxlength="500"
                  placeholder="Add reassurance, dietary guidance, or check on reported symptoms for {patient.name}…"
                  class="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-[#dedad0] bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#809474]/40 focus:bg-white resize-none"
                ></textarea>
              </div>

              <div class="flex items-center justify-between">
                <small class="text-xs text-[#8e9083]">Appears directly in the patient's My Midwife tab</small>
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  class="py-2.5 px-6 text-xs font-semibold rounded-xl bg-[#475842] text-white hover:bg-[#384634] disabled:opacity-50 transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {#if sendingReply}
                    <i class="iconoir-refresh animate-spin text-xs"></i>
                    <span>Posting…</span>
                  {:else}
                    <i class="iconoir-arrow-right text-xs"></i>
                    <span>Post Clinical Note</span>
                  {/if}
                </button>
              </div>
            </form>

            {#if replySuccess}
              <div class="p-3 rounded-xl bg-[#edf5eb] border border-[#c6dfc0] text-xs font-medium text-[#385a38]">
                ✓ Clinical note saved and delivered to patient dashboard!
              </div>
            {/if}
          </section>

        <!-- SECTION 4: CONTENT REVIEW TAB -->
        {:else if activeTab === 'reviews'}
          <section class="rounded-3xl bg-white border border-[#e7e4dc] p-6 sm:p-8 shadow-xs space-y-4" aria-labelledby="clinical-review-title">
            <div class="pb-3 border-b border-[#f0ede6]">
              <div class="text-[11px] font-bold tracking-widest text-[#888b7c] uppercase">CONTENT QUALITY & AUDIT</div>
              <h2 id="clinical-review-title" class="font-serif text-2xl font-semibold text-[#2b2c28]">Clinical content review</h2>
              <p class="text-xs text-[#72746b] mt-0.5">
                Review the weekly educational excerpt and leave a decision or correction note. Sabi does not verify professional credentials.
              </p>
            </div>

            <div>
              <label for="midwife-review-week" class="block text-xs font-semibold text-[#55574f] mb-1.5">Pregnancy week</label>
              <select
                id="midwife-review-week"
                bind:value={reviewWeek}
                onchange={() => {
                  reviewNotes =
                    clinicalReviews.find(
                      (entry) => entry.week === Number(reviewWeek),
                    )?.notes ?? "";
                }}
                class="w-full sm:w-80 px-3 py-2 text-xs rounded-xl border border-[#dedad0] bg-[#faf9f6]"
              >
                {#each clinicalReviews as item}
                  <option value={item.week}>
                    Week {item.week} · {item.status === "PENDING" ? "Pending" : item.status === "APPROVED" ? "Reviewed" : "Changes requested"}
                  </option>
                {/each}
              </select>
            </div>

            <article class="p-4 rounded-2xl bg-[#faf9f6] border border-[#eeece6] space-y-2">
              <strong class="font-serif text-base font-semibold text-[#2b2c28] block">{reviewWeekGuide.title}</strong>
              {#if reviewWeekGuide.bookSections.length}
                {#each reviewWeekGuide.bookSections as section}
                  <p class="text-xs text-[#525547] leading-relaxed"><b>{section.title}:</b> {section.summary}</p>
                  <small class="block text-[11px] text-[#8e9083]">Book PDF pages {section.citationPages.join(", ")}</small>
                {/each}
              {:else}
                <p class="text-xs text-[#525547] leading-relaxed">{reviewWeekGuide.gentlePrompt}</p>
              {/if}
              <p class="text-xs text-[#525547] leading-relaxed pt-2 border-t border-[#edeae1]">
                <b>Antenatal care focus:</b> {reviewWeekGuide.antenatalFocus}
              </p>
            </article>

            <div>
              <label for="midwife-review-notes" class="block text-xs font-semibold text-[#55574f] mb-1.5">Review notes</label>
              <textarea
                id="midwife-review-notes"
                bind:value={reviewNotes}
                maxlength="2000"
                placeholder="Add a correction, qualification or review note"
                rows="3"
                class="w-full p-3 text-xs rounded-xl border border-[#dedad0] bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#809474]/40 focus:bg-white resize-none"
              ></textarea>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                disabled={reviewBusy}
                onclick={() => void submitClinicalReview("APPROVED")}
                class="py-2 px-4 text-xs font-semibold rounded-xl bg-[#475842] text-white hover:bg-[#384634] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {#if reviewBusy && reviewDecision === "APPROVED"}
                  <i class="iconoir-refresh animate-spin text-xs"></i>
                  <span>Recording…</span>
                {:else}
                  <span>Record review</span>
                {/if}
              </button>
              <button
                disabled={reviewBusy}
                onclick={() => void submitClinicalReview("CHANGES_REQUESTED")}
                class="py-2 px-4 text-xs font-semibold rounded-xl bg-[#faf9f6] border border-[#d6d2c4] text-[#72746b] hover:bg-[#f0ede6] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {#if reviewBusy && reviewDecision === "CHANGES_REQUESTED"}
                  <i class="iconoir-refresh animate-spin text-xs"></i>
                  <span>Submitting…</span>
                {:else}
                  <span>Request changes</span>
                {/if}
              </button>
            </div>

            {#if reviewMessage}
              <p class="text-xs text-[#475842] font-medium" role="status">{reviewMessage}</p>
            {/if}
          </section>
        {/if}

        <!-- Safety Footer Note -->
        <div class="p-4 rounded-2xl bg-[#f4f7f2] border border-[#dce5d6] text-xs text-[#475842] flex items-center gap-2.5">
          <i class="iconoir-shield-check text-base text-[#809474]"></i>
          <span>This portal supports continuity of care. Clinical decisions remain with the qualified care team and patient.</span>
        </div>
      </div>
    </main>

    <!-- History Drawer Modal -->
    {#if showHistory}
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
        <div class="bg-white rounded-3xl border border-[#e7e4dc] w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
          <div class="p-5 border-b border-[#f0ede6] flex items-center justify-between bg-[#faf9f6]">
            <div>
              <h3 class="font-serif text-xl font-semibold text-[#2b2c28]">{patient.name}</h3>
              <p class="text-xs text-[#72746b]">Check-in history and clinical timeline</p>
            </div>
            <button
              class="w-8 h-8 rounded-full bg-white border border-[#dedad0] flex items-center justify-center text-[#72746b] hover:bg-[#f4f2ec] cursor-pointer"
              onclick={() => (showHistory = false)}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          <div class="p-5 overflow-y-auto space-y-3 flex-1">
            {#if historyLoading}
              <div class="py-12 text-center text-xs text-[#8e9083]">Loading check-in history…</div>
            {:else if patientCheckIns.length === 0}
              <div class="py-12 text-center text-xs text-[#8e9083]">No previous check-in history recorded for this patient.</div>
            {:else}
              {#each patientCheckIns as entry}
                <div class="p-3.5 rounded-2xl border border-[#eeece6] bg-[#faf9f6] space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-semibold text-[#2b2c28]">{formatMoodLabel(entry.mood)}</span>
                    <span class="text-[#8e9083]">{formatHumanDate(entry.createdAt)}</span>
                  </div>
                  {#if entry.symptoms && entry.symptoms.length > 0}
                    <div class="flex flex-wrap gap-1.5">
                      {#each entry.symptoms as s}
                        <span class="px-2.5 py-0.5 rounded-full bg-[#fdeae5] text-[#9c2d15] text-[11px] font-semibold border border-[#f6d0c6]">
                          {s}
                        </span>
                      {/each}
                    </div>
                  {/if}
                  {#if entry.note}
                    <p class="text-xs text-[#525547] bg-white p-2.5 rounded-xl border border-[#eeece6] italic">
                      "{entry.note}"
                    </p>
                  {/if}
                </div>
              {/each}
            {/if}
          </div>

          <div class="p-4 border-t border-[#f0ede6] bg-[#faf9f6] text-right">
            <button
              class="py-2 px-4 text-xs font-semibold rounded-xl bg-[#809474] text-white hover:bg-[#6c8060] transition-colors cursor-pointer"
              onclick={() => (showHistory = false)}
            >
              Close History
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Mobile Nav -->
    <nav class="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#e7e4dc] px-2 py-2 flex items-center justify-around z-30 shadow-lg" aria-label="Care team navigation">
      <button
        class="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer {activeTab === 'overview' ? 'text-[#809474] font-bold' : 'text-[#8e9083]'}"
        onclick={() => (activeTab = 'overview')}
      >
        <i class="iconoir-activity text-xl"></i>
        <span class="text-[10px]">Overview</span>
      </button>
      <button
        class="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer {activeTab === 'followups' ? 'text-[#af705a] font-bold' : 'text-[#8e9083]'}"
        onclick={() => (activeTab = 'followups')}
      >
        <i class="iconoir-calendar text-xl"></i>
        <span class="text-[10px]">Follow-ups</span>
      </button>
      <button
        class="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer {activeTab === 'messages' ? 'text-[#3b82f6] font-bold' : 'text-[#8e9083]'}"
        onclick={() => (activeTab = 'messages')}
      >
        <i class="iconoir-chat-bubble-check text-xl"></i>
        <span class="text-[10px]">Messages</span>
      </button>
      <button
        class="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer {activeTab === 'reviews' ? 'text-[#7b6fa0] font-bold' : 'text-[#8e9083]'}"
        onclick={() => (activeTab = 'reviews')}
      >
        <i class="iconoir-shield-check text-xl"></i>
        <span class="text-[10px]">Reviews</span>
      </button>
    </nav>
  </div>
{/if}
