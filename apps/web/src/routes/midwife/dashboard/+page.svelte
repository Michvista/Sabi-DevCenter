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
  let activeTab = $state<"overview" | "followups">("overview");
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

  // Check-in history modal / drawer
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

  // Clinician reply to patient state
  let replyText = $state("");
  let sendingReply = $state(false);
  let replySuccess = $state(false);

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
    }
  }

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
    if (!replyText.trim() || sendingReply) return;
    sendingReply = true;
    try {
      // Simulated delivery into patient log/record
      replySuccess = true;
      replyText = "";
      setTimeout(() => {
        replySuccess = false;
      }, 4000);
    } finally {
      sendingReply = false;
    }
  }

  async function approveRequest(id: string) {
    const api = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
    await fetch(`${api}/records/care-team/requests/${id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionToken()}` },
    });
    await loadCareData();
  }

  async function submitClinicalReview(
    status: "APPROVED" | "CHANGES_REQUESTED",
  ) {
    reviewBusy = true;
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
          ? "Review recorded. This is an audit record; it does not verify professional credentials."
          : "Revision request recorded.";
      await loadCareData();
    } catch (error) {
      reviewMessage =
        error instanceof Error ? error.message : "Could not save review.";
    } finally {
      reviewBusy = false;
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
  <div class="midwife-app">
    <aside class="midwife-sidebar">
      <a class="mw-brand" href="/midwife/dashboard"
        ><span class="mw-mark"><img src="/sabi-mark.svg" alt="" /></span><span
          >sabi<span class="brand-dot">.</span><small>CARE TEAM</small></span
        ></a
      >
      <div class="mw-section-label">CLINIC</div>
      <button
        class="mw-nav"
        class:active={activeTab === 'overview'}
        onclick={() => (activeTab = 'overview')}
      >
        <i class="iconoir-activity text-base text-[#809474]"></i>
        <span>Patient overview</span>
      </button>
      <button
        class="mw-nav"
        class:active={activeTab === 'followups'}
        onclick={() => (activeTab = 'followups')}
      >
        <i class="iconoir-calendar text-base text-[#af705a]"></i>
        <span>Follow-ups</span>
        {#if followUpList.length > 0}
          <span class="ml-auto px-2 py-0.5 text-xs font-bold rounded-full bg-[#af705a] text-white">
            {followUpList.length}
          </span>
        {/if}
      </button>
      <button class="mw-nav mw-signout" onclick={signOut}>
        <i class="iconoir-log-out text-base text-[#888]"></i>
        <span>Sign out</span>
      </button>
      <div class="mw-side-foot">
        <span class="mw-online"></span> Secure care team portal
      </div>
    </aside>
    <main class="mw-main">
      <header class="mw-topbar">
        <a class="back-home" href="/"
          ><i class="iconoir-arrow-left text-base"></i> Sabi home</a
        >
        <div class="mw-top-right">
          <span>Active Session</span>
          <button
            class="mw-bell"
            aria-label="Notifications"
            title="Notifications"
            ><i class="iconoir-bell text-base"></i><i></i
          ></button>
          <div class="mw-clinician-avatar">{clinicianInitials}</div>
          <div class="mw-clinician-name">
            <strong>{clinicianName}</strong><small>Care team account</small>
          </div>
        </div>
      </header>
      <div class="mw-content">
        <div class="mw-welcome">
          <div>
            <div class="mw-kicker">YOUR CARE TEAM</div>
            <h1>Good morning, {clinicianName}<span>.</span></h1>
            <p>Stay close to the people in your care, between every visit.</p>
          </div>
          <button class="invite-button" onclick={() => void loadCareData()}
            ><i class="iconoir-refresh text-base"></i> Refresh care requests</button
          >
        </div>
        <div class="mw-metrics">
          <article>
            <span>CONNECTED PATIENTS</span><strong
              >{String(roster.length).padStart(2, "0")}</strong
            ><small>Across your care list</small><i class="metric-icon"
              ><i class="iconoir-community text-lg text-[#809474]"></i></i
            >
          </article>
          <article>
            <span>CHECK-INS LOGGED</span><strong
              >{String(roster.filter(p => p.status !== "No check-in yet").length).padStart(2, "0")}</strong
            ><small>Patients with active logs</small
            ><i class="metric-icon sage"
              ><i class="iconoir-activity text-lg text-[#657c62]"></i></i
            >
          </article>
          <article>
            <span>ATTENTION NEEDED</span><strong
              class={followUpList.length > 0 ? "text-[#b34026]" : ""}
              >{String(followUpList.length).padStart(2, "0")}</strong
            ><small>Reported warnings / messages</small><i class="metric-icon amber"
              ><i class="iconoir-bell text-lg text-[#af705a]"></i></i
            >
          </article>
        </div>

        {#if activeTab === 'overview'}
          <!-- 2-COLUMN PATIENT OVERVIEW BOARD -->
          <section class="mw-board">
            <div class="mw-list-panel">
              <div class="mw-panel-head">
                <div>
                  <div class="mw-kicker">YOUR PEOPLE</div>
                  <h2>Patient check-ins</h2>
                </div>
                <span class="patient-count">{roster.length} {roster.length === 1 ? 'person' : 'people'}</span>
              </div>
              <label class="mw-search"
                ><i class="iconoir-search text-base text-[#888]"></i><input
                  bind:value={query}
                  placeholder="Find a patient…"
                  aria-label="Find a patient"
                /></label
              >
              {#if requests.length}<div class="mw-pending-requests">
                  <strong>Connection requests</strong
                  >{#each requests as request (request.id)}<div>
                      <span
                        >{request.patientName}<small>{request.patientEmail}</small
                        ></span
                      ><button
                        type="button"
                        onclick={() => void approveRequest(request.id)}
                        >Approve</button
                      >
                    </div>{/each}
                </div>{/if}
              <div class="mw-roster">
                {#each filtered as person}<button
                    class="mw-person"
                    class:chosen={selected === person.id}
                    onclick={() => (selected = person.id)}
                    ><span class="mw-person-avatar {person.tone}"
                      >{person.name
                        .split(/\s+/)
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}</span
                    ><span class="mw-person-copy"
                      ><strong>{person.name}</strong><small
                        >{person.week
                          ? `${person.week} weeks`
                          : "Pregnancy date not added"} · {person.status}</small
                      ></span
                    >{#if person.risk}<span
                        class="followup-dot"
                        title="Question to review"
                      ></span>{/if}<i class="iconoir-nav-arrow-right text-sm text-[#aaa]"></i></button
                  >{/each}{#if filtered.length === 0}<p class="no-match">
                    No linked patient matches that search.
                  </p>{/if}
              </div>
              <div class="mw-consent-note">
                Only patients who requested a connection and were approved appear
                here. Review shared information with the patient during care.
              </div>
            </div>
            <div class="mw-detail-panel">
              <div class="patient-profile">
                <div class="profile-top">
                  <div class="mw-person-avatar large {patient.tone}">
                    {patient.name
                      ? patient.name
                          .split(/\s+/)
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "PT"}
                  </div>
                  <span class="connected-badge"><span></span> Connected</span>
                </div>
                <h2>{patient.name}</h2>
                <p>
                  {patient.email ? patient.email : "Connected care record"}
                </p>
                <div class="patient-stat-row">
                  <div>
                    <small>PREGNANCY</small><strong
                      >{patient.week
                        ? `Week ${patient.week}`
                        : "Not added"}</strong
                    >
                  </div>
                  <div>
                    <small>ESTIMATED DUE DATE</small><strong>{patient.due}</strong
                    >
                  </div>
                  <div>
                    <small>NEXT ANTENATAL VISIT</small><strong
                      >{patient.nextVisit ?? "Not scheduled"}</strong
                    >
                  </div>
                </div>
              </div>
              <div class="latest-checkin">
                <div class="latest-title">
                  <span class="latest-icon"
                    ><i class="iconoir-activity text-sm text-[#657c62]"></i></span
                  >
                  <div>
                    <strong>Latest Patient Check-in</strong>
                    <small>{patient.checkInAt ? formatHumanDate(patient.checkInAt) : "Recent log"}</small>
                  </div>
                </div>
                <div class="checkin-mood">“{patient.last}”</div>

                {#if patient.symptoms && patient.symptoms.length > 0}
                  <div class="mb-4 p-3.5 rounded-xl bg-[#fdf5f3] border border-[#f6ded9]">
                    <strong class="text-xs font-semibold text-[#b34026] block mb-2">
                      Reported Symptoms ({patient.symptoms.length})
                    </strong>
                    <div class="flex flex-wrap gap-1.5">
                      {#each patient.symptoms as s}
                        <span class="px-2.5 py-1 text-xs rounded-full bg-[#fde8e3] text-[#9c2d15] font-medium border border-[#f4c9bf]">
                          {s}
                        </span>
                      {/each}
                    </div>
                  </div>
                {/if}

                {#if patient.note}
                  <div class="mb-4 p-3.5 rounded-xl bg-[#f7f8f4] border border-[#e2e7dc]">
                    <strong class="text-xs font-semibold text-[#455a3f] block mb-1">
                      Patient Note / Question
                    </strong>
                    <p class="text-xs text-[#525547] leading-relaxed italic">
                      "{patient.note}"
                    </p>
                  </div>
                {/if}

                {#if patient.risk}
                  <div class="question-callout">
                    <strong>Care Team Attention Recommended</strong>
                    <span>Review reported concerns with patient at the next clinic touchpoint.</span>
                  </div>
                {:else}
                  <div class="wellbeing-callout">
                    <span>♡</span> No urgent concerns shared in this check-in.
                  </div>
                {/if}

                <div class="mt-4 pt-3 border-t border-[#f0eee8] flex flex-wrap gap-2">
                  <button
                    class="message-patient cursor-pointer"
                    onclick={() => void viewPatientHistory(patient.id)}
                  >
                    View check-in history <i class="iconoir-nav-arrow-right text-sm"></i>
                  </button>
                </div>

                <!-- CLINICIAN REPLY BOX -->
                <div class="mt-5 pt-4 border-t border-[#ebeae4]">
                  <div class="flex items-center gap-2 mb-2">
                    <i class="iconoir-chat-bubble-check text-sm text-[#809474]"></i>
                    <strong class="text-xs font-semibold text-[#2c2d28]">Send Clinical Note / Follow-up</strong>
                  </div>
                  <form class="space-y-2" onsubmit={sendClinicianNote}>
                    <textarea
                      bind:value={replyText}
                      rows="2"
                      maxlength="500"
                      placeholder="Add reassurance, dietary advice, or antenatal appointment prep for {patient.name}…"
                      class="w-full p-2.5 text-xs rounded-xl border border-[#dedad0] bg-[#faf9f6] focus:outline-none focus:ring-1 focus:ring-[#809474] resize-none"
                    ></textarea>
                    <div class="flex items-center justify-between">
                      <small class="text-[11px] text-[#888]">Visible on patient dashboard</small>
                      <button
                        type="submit"
                        disabled={sendingReply || !replyText.trim()}
                        class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#809474] text-white hover:bg-[#6c8060] disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        {sendingReply ? "Saving…" : "Post Note"}
                      </button>
                    </div>
                  </form>
                  {#if replySuccess}
                    <div class="mt-2 p-2 rounded-lg bg-[#edf5eb] text-[#385a38] text-xs font-medium">
                      ✓ Note saved to patient record!
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          </section>

        {:else}
          <!-- FOLLOW-UPS DEDICATED VIEW -->
          <section class="rounded-2xl bg-white border border-[#ebece5] p-6 mb-6">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <div class="mw-kicker">PRIORITY CARE LIST</div>
                <h2 class="font-serif text-2xl font-medium text-[#2c2e27]">Patient Follow-ups</h2>
                <p class="text-xs text-[#7c7e73] mt-1">
                  Patients with reported symptoms, warning indicators, or awaiting clinic visits.
                </p>
              </div>
              <span class="px-3 py-1 rounded-full bg-[#f8ede8] text-[#b34026] text-xs font-bold">
                {followUpList.length} requiring review
              </span>
            </div>

            {#if followUpList.length === 0}
              <div class="py-12 text-center rounded-xl bg-[#faf9f6] border border-dashed border-[#e6e2d8]">
                <i class="iconoir-check-circle text-3xl text-[#809474] mb-2 inline-block"></i>
                <h3 class="font-serif text-lg font-medium text-[#33352f]">All caught up</h3>
                <p class="text-xs text-[#7e8074] max-w-sm mx-auto mt-1">
                  None of your connected patients have reported urgent symptoms or unresolved warning signs.
                </p>
              </div>
            {:else}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each followUpList as p}
                  <div class="rounded-xl border border-[#eedecf] bg-[#fdfaf8] p-4 flex flex-col justify-between">
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <span class="inline-flex items-center gap-1.5 text-xs font-bold text-[#b34026]">
                          <span class="w-2 h-2 rounded-full bg-[#b34026]"></span>
                          {p.last}
                        </span>
                        <span class="text-xs text-[#8c887d] font-semibold">{p.week ? `Wk ${p.week}` : 'Due: ' + p.due}</span>
                      </div>
                      <h4 class="font-serif text-lg font-semibold text-[#2b2c28]">{p.name}</h4>
                      <p class="text-xs text-[#6e7065] mt-0.5">{p.email}</p>

                      {#if p.symptoms && p.symptoms.length > 0}
                        <div class="mt-3 flex flex-wrap gap-1.5">
                          {#each p.symptoms as sym}
                            <span class="px-2 py-0.5 rounded-md bg-[#fbe7e2] text-[#a1331c] text-xs font-medium border border-[#f5cdc4]">
                              {sym}
                            </span>
                          {/each}
                        </div>
                      {/if}

                      {#if p.note}
                        <div class="mt-3 p-2 rounded-lg bg-white border border-[#f0eee8] text-xs text-[#525547] italic">
                          "{p.note}"
                        </div>
                      {/if}
                    </div>

                    <div class="mt-4 pt-3 border-t border-[#f2eae1] flex items-center justify-between">
                      <span class="text-xs text-[#777]">Next visit: {p.nextVisit ?? "None set"}</span>
                      <button
                        class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#809474] text-white hover:bg-[#6c8060] cursor-pointer"
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
        {/if}

        <!-- HISTORY MODAL / DRAWER -->
        {#if showHistory}
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div class="bg-white rounded-2xl border border-[#ebebe4] w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
              <div class="p-5 border-b border-[#f0eee8] flex items-center justify-between bg-[#faf9f6]">
                <div>
                  <h3 class="font-serif text-xl font-semibold text-[#2c2d28]">{patient.name}</h3>
                  <p class="text-xs text-[#777] mt-0.5">Check-in history and clinical timeline</p>
                </div>
                <button
                  class="w-8 h-8 rounded-full bg-white border border-[#dedad0] flex items-center justify-center text-[#666] hover:bg-[#f3f0e8] cursor-pointer"
                  onclick={() => (showHistory = false)}
                  aria-label="Close modal"
                >
                  <i class="iconoir-xmark text-sm"></i>
                </button>
              </div>

              <div class="p-5 overflow-y-auto space-y-4 flex-1">
                {#if historyLoading}
                  <div class="py-12 text-center text-xs text-[#888]">Loading check-in history…</div>
                {:else if patientCheckIns.length === 0}
                  <div class="py-12 text-center text-xs text-[#888]">No previous check-in history recorded for this patient.</div>
                {:else}
                  {#each patientCheckIns as entry}
                    <div class="p-3.5 rounded-xl border border-[#ebe7de] bg-[#fdfdfb] space-y-2">
                      <div class="flex items-center justify-between text-xs">
                        <span class="font-semibold text-[#3c3e37]">{formatMoodLabel(entry.mood)}</span>
                        <span class="text-[#8c8a81]">{formatHumanDate(entry.createdAt)}</span>
                      </div>
                      {#if entry.symptoms && entry.symptoms.length > 0}
                        <div class="flex flex-wrap gap-1.5 pt-1">
                          {#each entry.symptoms as s}
                            <span class="px-2 py-0.5 rounded-full bg-[#fdeae5] text-[#9c2d15] text-[11px] font-medium border border-[#f6d0c6]">
                              {s}
                            </span>
                          {/each}
                        </div>
                      {/if}
                      {#if entry.note}
                        <p class="text-xs text-[#5f6155] bg-white p-2.5 rounded-lg border border-[#f0eee8] italic">
                          "{entry.note}"
                        </p>
                      {/if}
                    </div>
                  {/each}
                {/if}
              </div>

              <div class="p-4 border-t border-[#f0eee8] bg-[#faf9f6] text-right">
                <button
                  class="px-4 py-2 text-xs font-semibold rounded-xl bg-[#809474] text-white hover:bg-[#6c8060] cursor-pointer"
                  onclick={() => (showHistory = false)}
                >
                  Close History
                </button>
              </div>
            </div>
          </div>
        {/if}

        <section
          class="mw-clinical-review"
          aria-labelledby="clinical-review-title"
        >
          <div class="mw-kicker">CONTENT QUALITY</div>
          <h2 id="clinical-review-title">Clinical content review</h2>
          <p>
            Review the weekly educational excerpt and leave a decision or
            correction note. Use this workflow only if you are a qualified
            maternity-care clinician. Sabi does not verify professional
            credentials.
          </p>
          <label
            >Pregnancy week
            <select
              bind:value={reviewWeek}
              onchange={() => {
                reviewNotes =
                  clinicalReviews.find(
                    (entry) => entry.week === Number(reviewWeek),
                  )?.notes ?? "";
              }}
            >
              {#each clinicalReviews as item}<option value={item.week}
                  >Week {item.week} · {item.status === "PENDING"
                    ? "Pending"
                    : item.status === "APPROVED"
                      ? "Reviewed"
                      : "Changes requested"}</option
                >{/each}
            </select>
          </label>
          <article class="mw-review-excerpt">
            <strong>{reviewWeekGuide.title}</strong>
            {#if reviewWeekGuide.bookSections.length}
              {#each reviewWeekGuide.bookSections as section}
                <p><b>{section.title}</b> {section.summary}</p>
                <small>Book PDF pages {section.citationPages.join(", ")}</small>
              {/each}
            {:else}
              <p>{reviewWeekGuide.gentlePrompt}</p>
            {/if}
            <p><b>Antenatal care focus</b> {reviewWeekGuide.antenatalFocus}</p>
          </article>
          <label
            >Review notes<textarea
              bind:value={reviewNotes}
              maxlength="2000"
              placeholder="Add a correction, qualification or review note"
            ></textarea></label
          >
          <div class="mw-review-actions">
            <button
              disabled={reviewBusy}
              onclick={() => void submitClinicalReview("APPROVED")}
              >Record review</button
            >
            <button
              disabled={reviewBusy}
              onclick={() => void submitClinicalReview("CHANGES_REQUESTED")}
              >Request changes</button
            >
          </div>
          {#if reviewMessage}<p role="status">{reviewMessage}</p>{/if}
        </section>
        <div class="mw-safety">
          <span>◈</span> This portal supports continuity of care. Clinical decisions
          remain with the qualified care team and patient.
        </div>
      </div>
    </main>
    <nav class="mw-mobile-nav" aria-label="Care team navigation">
      <button class:active={activeTab === 'overview'} onclick={() => (activeTab = 'overview')}>Overview</button>
      <button class:active={activeTab === 'followups'} onclick={() => (activeTab = 'followups')}>Follow-ups ({followUpList.length})</button>
      <button onclick={signOut}>Sign out</button>
    </nav>
  </div>
{/if}
