<script lang="ts">
  import { onDestroy } from "svelte";
  import { translateGuideText } from "#lib/translation.ts";
  let { text }: { text: string } = $props();

  let targetLanguage = $state("en");
  let loading = $state(false);
  let message = $state("");
  let audioUrl = $state("");
  let audioElement: HTMLAudioElement | undefined = $state();

  onDestroy(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  });

  async function listen(text: string) {
    loading = true;
    message = "Preparing audio…";
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = "";

    try {
      const spokenText =
        targetLanguage === "pcm" ? await translateGuideText(text, "pcm") : text;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/voice/guide`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: spokenText, targetLanguage }),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.message ?? "Voice playback is unavailable right now.",
        );
      }
      const fallback = response.headers.get("X-Sabi-Audio-Fallback");
      audioUrl = URL.createObjectURL(await response.blob());
      message =
        fallback === "azure-original-english"
          ? "Playing the guide in English because audio in your selected language is unavailable."
          : targetLanguage === "pcm"
            ? "Playing the guide in Nigerian Pidgin."
            : "Audio is ready. Ask your health worker to clarify anything important.";
      await audioElement?.play();
    } catch (error) {
      if (targetLanguage === "en" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-NG";
        utterance.onend = () => (message = "Playing the English guide.");
        utterance.onerror = () => (message = "Audio is unavailable right now.");
        message = "Preparing the English guide…";
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } else {
        message =
          targetLanguage === "en"
            ? "Audio is unavailable right now. Please try again later."
            : "Audio in this language is temporarily unavailable. Please try again later.";
      }
    } finally {
      loading = false;
    }
  }
</script>

<div class="rounded-2xl border border-[#e7e4dc] bg-white p-4 space-y-3">
  <div class="flex flex-wrap items-center justify-between gap-2">
    <div>
      <strong class="font-serif text-sm font-semibold text-[#2b2c28] block">Listen in your language</strong>
      <span class="text-xs text-[#72746b]">Hear the guide in English, Hausa, Igbo, Yorùbá or Pidgin.</span>
    </div>
  </div>
  <div class="flex gap-2">
    <label class="sr-only" for="guide-language">Audio language</label>
    <select
      id="guide-language"
      bind:value={targetLanguage}
      class="flex-1 px-3 py-2 text-xs rounded-xl border border-[#dedad0] bg-[#faf9f6] text-[#2b2c28] focus:outline-none focus:ring-2 focus:ring-[#809474]/40"
    >
      <option value="en">English</option>
      <option value="ha">Hausa</option>
      <option value="ig">Igbo</option>
      <option value="yo">Yorùbá</option>
      <option value="pcm">Nigerian Pidgin</option>
    </select>
    <button
      type="button"
      disabled={loading}
      onclick={() => listen(text)}
      class="py-2 px-4 text-xs font-semibold rounded-xl bg-[#809474] text-white hover:bg-[#6c8060] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
    >
      <i class="iconoir-sound-high text-xs"></i>
      <span>{loading ? "Preparing…" : "Listen"}</span>
    </button>
  </div>
  {#if audioUrl}
    <audio bind:this={audioElement} controls src={audioUrl} class="w-full h-9 rounded-lg">
      Your browser does not support audio playback.
    </audio>
  {/if}
  {#if message}
    <p class="text-xs text-[#525547]" aria-live="polite">{message}</p>
  {/if}
  <small class="block text-[11px] text-[#8e9083]">
    Audio is for general learning. Ask your maternity-care team to explain any advice that concerns you.
  </small>
</div>
