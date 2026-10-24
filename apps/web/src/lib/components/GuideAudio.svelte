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

<div class="guide-audio">
  <div class="guide-audio-heading">
    <strong>Listen in your language</strong>
    <span>Hear the guide in English, Hausa, Igbo, Yorùbá or Pidgin.</span>
  </div>
  <div class="guide-audio-controls">
    <label class="sr-only" for="guide-language">Audio language</label>
    <select id="guide-language" bind:value={targetLanguage}>
      <option value="en">English</option>
      <option value="ha">Hausa</option>
      <option value="ig">Igbo</option>
      <option value="yo">Yorùbá</option>
      <option value="pcm">Nigerian Pidgin</option>
    </select>
    <button type="button" disabled={loading} onclick={() => listen(text)}>
      {loading ? "Preparing…" : "Listen"}
    </button>
  </div>
  {#if audioUrl}<audio bind:this={audioElement} controls src={audioUrl}
      >Your browser does not support audio playback.</audio
    >{/if}
  {#if message}<small aria-live="polite">{message}</small>{/if}
  <small class="guide-audio-note"
    >Audio is for general learning. Ask your maternity-care team to explain any
    advice that concerns you.</small
  >
</div>

<style>
  .guide-audio {
    display: grid;
    gap: 9px;
    margin: 16px 0 4px;
    padding: 13px;
    border: 1px solid #ece9e1;
    border-radius: 11px;
    background: #fbfaf7;
  }
  .guide-audio-heading {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: baseline;
  }
  .guide-audio-heading strong {
    color: #485d46;
    font-size: 10px;
  }
  .guide-audio-heading span,
  .guide-audio small {
    color: #85847d;
    font-size: 8px;
    line-height: 1.5;
  }
  .guide-audio-controls {
    display: flex;
    gap: 8px;
  }
  select {
    min-width: 0;
    flex: 1;
    border: 1px solid #e7e4dc;
    border-radius: 7px;
    background: white;
    padding: 8px;
    color: #4f514a;
    font: inherit;
    font-size: 9px;
  }
  button {
    border: 0;
    border-radius: 7px;
    background: #657c62;
    color: white;
    padding: 0 13px;
    font-size: 9px;
    font-weight: 600;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.65;
    cursor: wait;
  }
  audio {
    width: 100%;
    height: 36px;
  }
  .guide-audio-note {
    opacity: 0.8;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
