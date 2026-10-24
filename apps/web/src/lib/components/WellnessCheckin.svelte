<script lang="ts">
  import { sessionToken } from "#lib/auth/session.ts";
  import { onMount } from "svelte";

  let mood = $state("");
  let saved = $state(false);
  let saving = $state(false);
  let checkinCount = $state(0);
  let error = $state("");

  const moods = [
    { label: "Good", icon: "iconoir-emoji-satisfied", value: "good", color: "text-[#3d6e3d]", bg: "bg-[#edf5eb] border-[#c6dfc0]" },
    { label: "Okay", icon: "iconoir-emoji-quite", value: "okay", color: "text-[#8a6820]", bg: "bg-[#fef9e7] border-[#e9d27a]" },
    { label: "A little off", icon: "iconoir-emoji-sad", value: "off", color: "text-[#af705a]", bg: "bg-[#fdf4f0] border-[#f4cfc4]" },
    { label: "Need support", icon: "iconoir-heart", value: "support", color: "text-[#b94a32]", bg: "bg-[#fef2f0] border-[#f6bfb8]" },
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

<div class="bg-white rounded-2xl border border-[#e7e4dc] p-5 shadow-2xs">
  <!-- Header -->
  <div class="mb-4">
    <div class="text-[11px] font-bold tracking-widest text-[#9c998f] uppercase mb-1">PAUSE & NOTICE</div>
    <h2 class="font-serif text-xl font-semibold text-[#2b2c28] mb-0.5">How are you feeling today?</h2>
    <p class="text-sm text-[#72746b]">No judgement, just you</p>
  </div>

  <!-- Mood grid -->
  <div class="grid grid-cols-2 gap-2.5 mb-4">
    {#each moods as option}
      <button
        class="flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all cursor-pointer {mood === option.value ? option.bg + ' ' + option.color + ' scale-[0.98]' : 'bg-[#faf9f6] border-[#edeae1] text-[#72746b] hover:border-[#d6d2c4]'}"
        onclick={() => { mood = option.value; }}
        type="button"
        aria-pressed={mood === option.value}
      >
        <i class="{option.icon} text-2xl {mood === option.value ? option.color : 'text-[#9a988f]'}"></i>
        <span class="text-xs font-semibold">{option.label}</span>
      </button>
    {/each}
  </div>

  <!-- Count -->
  <p class="text-xs text-[#888b7e] mb-3">
    {checkinCount} check-in{checkinCount !== 1 ? "s" : ""} saved to your account
  </p>

  {#if error}
    <p class="mb-3 text-xs text-[#9c2d15] bg-[#fdf4f0] px-3 py-2 rounded-lg border border-[#f4cfc4]" role="alert">{error}</p>
  {/if}

  {#if mood && !saved}
    <div class="flex items-center justify-between gap-3 pt-3 border-t border-[#f0eee8]">
      <span class="text-xs text-[#72746b]">Save this check-in?</span>
      <button
        class="py-2.5 px-5 text-xs font-semibold rounded-xl bg-[#809474] text-white hover:bg-[#6c8060] disabled:opacity-50 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
        type="button"
        onclick={() => void saveCheckIn()}
        disabled={saving}
      >
        {#if saving}
          <i class="iconoir-refresh animate-spin text-xs"></i>
          <span>Saving…</span>
        {:else}
          <span>Save check-in</span>
        {/if}
      </button>
    </div>
  {/if}

  {#if saved}
    <div class="flex items-center gap-2 pt-3 border-t border-[#f0eee8] text-xs font-semibold text-[#475842]">
      <i class="iconoir-check-circle text-base text-[#809474]"></i>
      <span>Check-in saved. Thank you for sharing.</span>
    </div>
  {/if}
</div>
