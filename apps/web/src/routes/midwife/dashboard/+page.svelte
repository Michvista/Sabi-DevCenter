<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    endSession,
    hasSession,
    sessionToken,
    sessionUser,
  } from "#lib/auth/session.ts";
  import {
    ArrowLeft01Icon,
    ArrowRight01Icon,
    Calendar03Icon,
    Search01Icon,
    UserMultiple02Icon,
    Notification03Icon,
    Add01Icon,
    Activity01Icon,
  } from "@hugeicons/core-free-icons";
  import { HugeiconsIcon } from "@hugeicons/svelte";
  import { pregnancyWeek } from "#lib/utils.ts";
  import { getPregnancyWeek } from "#lib/data/pregnancy-weeks.ts";

  let query = $state("");
  let selected = $state("");
  let authorized = $state(false);
  let clinicianName = $state("Care team member");
  let roster = $state<
    {
      id: string;
      name: string;
      week: number;
      due: string;
      status: string;
      tone: string;
      last: string;
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
          dueDate?: string;
          mood?: string;
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
    roster = items.map((p) => ({
      id: p.id,
      name: p.displayName,
      week: p.dueDate ? pregnancyWeek(p.dueDate) : 0,
      due: p.dueDate ?? "Not set",
      status: p.mood ? "Checked in" : "No check-in yet",
      tone: "sage",
      last: p.mood ?? "No check-in shared",
      risk: false,
    }));
    selected = roster[0]?.id ?? "";
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
        week: 0,
        due: "Not set",
        status: "",
        tone: "sage",
        last: "Patients will appear after they request a connection and you approve it.",
        risk: false,
      },
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
      <a class="mw-nav active" href="/midwife/dashboard"
        ><HugeiconsIcon icon={Activity01Icon} size={18} /> Patient overview</a
      >
      <a class="mw-nav" href="#follow-ups"
        ><HugeiconsIcon icon={Calendar03Icon} size={18} /> Follow-ups</a
      >
      <button class="mw-nav mw-signout" onclick={signOut}>Sign out</button>
      <div class="mw-side-foot">
        <span class="mw-online"></span> Secure care team portal
      </div>
    </aside>
    <main class="mw-main">
      <header class="mw-topbar">
        <a class="back-home" href="/"
          ><HugeiconsIcon icon={ArrowLeft01Icon} size={16} /> Sabi home</a
        >
        <div class="mw-top-right">
          <span>Thursday, October 15</span><button
            class="mw-bell"
            aria-label="Notifications"
            ><HugeiconsIcon icon={Notification03Icon} size={18} /><i
            ></i></button
          >
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
            ><HugeiconsIcon icon={Add01Icon} size={16} /> Refresh care requests</button
          >
        </div>
        <div class="mw-metrics">
          <article>
            <span>CONNECTED PATIENTS</span><strong
              >{String(roster.length).padStart(2, "0")}</strong
            ><small>Across your care list</small><i class="metric-icon"
              ><HugeiconsIcon icon={UserMultiple02Icon} size={17} /></i
            >
          </article>
          <article>
            <span>CHECK-INS THIS WEEK</span><strong>—</strong><small
              >Check-in summaries load from linked records</small
            ><i class="metric-icon sage"
              ><HugeiconsIcon icon={Activity01Icon} size={17} /></i
            >
          </article>
          <article>
            <span>CONNECTION REQUESTS</span><strong
              >{String(requests.length).padStart(2, "0")}</strong
            ><small>Waiting for your review</small><i class="metric-icon amber"
              ><HugeiconsIcon icon={Calendar03Icon} size={17} /></i
            >
          </article>
        </div>
        <section class="mw-board">
          <div class="mw-list-panel">
            <div class="mw-panel-head">
              <div>
                <div class="mw-kicker">YOUR PEOPLE</div>
                <h2>Patient check-ins</h2>
              </div>
              <span class="patient-count">{roster.length} people</span>
            </div>
            <label class="mw-search"
              ><HugeiconsIcon icon={Search01Icon} size={16} /><input
                bind:value={query}
                placeholder="Find a patient"
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
                    ></span>{/if}<HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={15}
                  /></button
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
                  {patient.id}
                </div>
                <span class="connected-badge"><span></span> Connected</span>
              </div>
              <h2>{patient.name}</h2>
              <p>
                {patient.id
                  ? "Connected care record"
                  : "Patient records require patient consent."}
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
              </div>
            </div>
            <div class="latest-checkin">
              <div class="latest-title">
                <span class="latest-icon"
                  ><HugeiconsIcon icon={Activity01Icon} size={15} /></span
                >
                <div>
                  <strong>Latest check-in</strong><small>Today · 8:42 AM</small>
                </div>
              </div>
              <div class="checkin-mood">“{patient.last}”</div>
              {#if patient.risk}<div class="question-callout">
                  <strong>Question for care team</strong><span
                    >Could you help answer this at the next check-in?</span
                  >
                </div>{:else}<div class="wellbeing-callout">
                  <span>♡</span> No urgent concerns shared in this check-in.
                </div>{/if}<button class="message-patient"
                >View check-in history <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={15}
                /></button
              >
            </div>
          </div>
        </section>
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
      <a href="/midwife/dashboard" aria-current="page">Overview</a>
      <a href="#follow-ups">Follow-ups</a>
      <button onclick={signOut}>Sign out</button>
    </nav>
  </div>
{/if}
