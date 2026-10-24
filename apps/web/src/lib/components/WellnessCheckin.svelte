<script lang="ts">
  import { sessionToken } from "#lib/auth/session.ts";
  import { onMount } from "svelte";

  let mood = $state("");
  let saved = $state(false);
  let saving = $state(false);
  let checkinCount = $state(0);
  let error = $state("");

  const moods = [
    { label: "Good", icon: "iconoir-emoji-satisfied", value: "good", color: "text-[#3d6e3d]" },
    { label: "Okay", icon: "iconoir-emoji-quite", value: "okay", color: "text-[#8a6820]" },
    { label: "A little off", icon: "iconoir-emoji-sad", value: "off", color: "text-[#af705a]" },
    { label: "Need support", icon: "iconoir-heart", value: "support", color: "text-[#b94a32]" },
  ];

  onMount(() => {
    void fetch(
      `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/records/check-ins`,
      { headers: { Authorization: `Bearer ${sessionToken()}` } },
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((items: unknown[]) => {
        checkinCount = items.length;
      })
      .catch(() => {});
  });

  async function saveCheckIn() {
    if (!mood || saving) return;
    saving = true;
    error = "";
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/records/check-ins`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken()}`,
          },
          body: JSON.stringify({ mood, symptoms: [] }),
        },
      );
      if (!response.ok) {
        error = "Could not save. Please check your connection.";
        return;
      }
      checkinCount += 1;
      const existing = JSON.parse(localStorage.getItem("sabi-checkins") || "[]");
      localStorage.setItem(
        "sabi-checkins",
        JSON.stringify(
          [{ mood, date: new Date().toISOString() }, ...existing].slice(0, 20),
        ),
      );
      saved = true;
      setTimeout(() => {
        saved = false;
        mood = "";
      }, 2000);
    } finally {
      saving = false;
    }
  }
</script>

<div class="flo-checkin-card">
  <div class="flo-checkin-header">
    <div class="flo-checkin-eyebrow">PAUSE &amp; NOTICE</div>
    <h2 class="flo-checkin-title">How are you feeling today?</h2>
    <p class="flo-checkin-sub">No judgement, just you</p>
  </div>

  <div class="flo-mood-grid">
    {#each moods as option}
      <button
        class="flo-mood-btn"
        class:flo-mood-selected={mood === option.value}
        onclick={() => { mood = option.value; }}
        type="button"
        aria-pressed={mood === option.value}
      >
        <i class="{option.icon} text-2xl mb-1.5 {option.color}"></i>
        <span class="flo-mood-label">{option.label}</span>
      </button>
    {/each}
  </div>

  <p class="flo-checkin-count">
    {checkinCount} check-in{checkinCount !== 1 ? "s" : ""} saved to your account
  </p>

  {#if error}
    <p class="flo-checkin-error" role="alert">{error}</p>
  {/if}

  {#if mood && !saved}
    <div class="flo-checkin-save-row">
      <span class="flo-save-prompt">Would you like to save this check-in?</span>
      <button
        class="flo-save-btn"
        type="button"
        onclick={() => void saveCheckIn()}
        disabled={saving}
      >
        {saving ? "Saving…" : "Save check-in"}
      </button>
    </div>
  {/if}

  {#if saved}
    <div class="flo-save-success">
      <span>✓</span> Check-in saved. Thank you for sharing.
    </div>
  {/if}
</div>
