<script lang="ts">
  import { Cancel01Icon, FavouriteIcon } from "@hugeicons/core-free-icons";
  import { HugeiconsIcon } from "@hugeicons/svelte";
  import { sessionToken } from "#lib/auth/session.ts";
  import { onMount } from "svelte";
  let mood = $state("");
  let showCheckIn = $state(false);
  let saved = $state(false);
  let checkinCount = $state(0);
  let error = $state("");
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
  const moods = [
    { label: "Good", face: "☺", value: "good" },
    { label: "Okay", face: "◡", value: "okay" },
    { label: "A little off", face: "﹏", value: "off" },
    { label: "Need support", face: "♡", value: "support" },
  ];
  async function saveCheckIn() {
    if (!mood) return;
    error = "";
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
      error =
        "Could not save your check-in. Please check your connection and try again.";
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
      showCheckIn = false;
      mood = "";
    }, 1200);
  }
</script>

<section class="section-block checkin-section">
  <div class="section-heading">
    <div>
      <div class="eyebrow small-eyebrow">PAUSE & NOTICE</div>
      <h2>How are you feeling today?</h2>
    </div>
    <span class="gentle-tag"
      ><HugeiconsIcon icon={FavouriteIcon} size={14} /> No judgement, just you</span
    >
  </div>
  <div class="mood-row">
    {#each moods as option}
      <button
        class="mood-option"
        class:selected={mood === option.value}
        onclick={() => {
          mood = option.value;
          showCheckIn = true;
        }}
        ><span class="mood-face {option.value}">{option.face}</span><span
          >{option.label}</span
        ></button
      >
    {/each}
  </div>
  <small class="checkin-count"
    >{checkinCount} check-ins saved to your account</small
  >
  {#if error}<p role="alert" class="food-message">{error}</p>{/if}
  {#if showCheckIn}<div class="checkin-action">
      <span
        >{saved
          ? "Check-in saved. Thank you for sharing."
          : "Would you like to save this check-in?"}</span
      ><button class="text-action" onclick={() => void saveCheckIn()}
        >{saved ? "Saved ✓" : "Save check-in"}</button
      ><button
        class="quiet-close"
        aria-label="Close"
        onclick={() => (showCheckIn = false)}
        ><HugeiconsIcon icon={Cancel01Icon} size={16} /></button
      >
    </div>{/if}
</section>
