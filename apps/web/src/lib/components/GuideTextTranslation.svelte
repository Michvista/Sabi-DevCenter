<script lang="ts">
  import { translateGuideText, type GuideLanguage } from "#lib/translation.ts";

  let { text }: { text: string } = $props();
  let language = $state<GuideLanguage>("ha");
  let translated = $state("");
  let loading = $state(false);
  let message = $state("");

  async function showTranslation() {
    loading = true;
    message = "";
    translated = "";
    try {
      translated = await translateGuideText(text, language);
    } catch {
      message = "Translation is temporarily unavailable. Please try again.";
    } finally {
      loading = false;
    }
  }
</script>

<section
  class="guide-translation"
  aria-label="Show this guide in another language"
>
  <div class="translation-controls">
    <label class="sr-only" for="guide-translation-language"
      >Translation language</label
    >
    <select id="guide-translation-language" bind:value={language}>
      <option value="ha">Hausa</option>
      <option value="ig">Igbo</option>
      <option value="yo">Yorùbá</option>
      <option value="pcm">Nigerian Pidgin</option>
    </select>
    <button type="button" disabled={loading} onclick={showTranslation}>
      {loading
        ? "Translating…"
        : translated
          ? "Show again"
          : "Show translation"}
    </button>
  </div>
  {#if translated}
    <p class="translated-guide" lang={language}>{translated}</p>
    <small
      >Machine translation. Ask your maternity-care worker to confirm details
      that affect your care.</small
    >
  {/if}
  {#if message}<small role="status">{message}</small>{/if}
</section>

<style>
  .guide-translation {
    display: grid;
    gap: 8px;
    margin: 10px 0;
  }
  .translation-controls {
    display: flex;
    gap: 8px;
  }
  select,
  button {
    border: 1px solid #e7e4dc;
    border-radius: 7px;
    padding: 8px 10px;
    font: inherit;
    font-size: 12px;
  }
  select {
    flex: 1;
    min-width: 0;
    background: white;
    color: #4f514a;
  }
  button {
    background: #f2f4ed;
    color: #485d46;
    font-weight: 600;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.65;
    cursor: wait;
  }
  .translated-guide {
    margin: 0;
    padding: 12px;
    border-radius: 9px;
    background: #f8f7f2;
    line-height: 1.65;
  }
  small {
    color: #85847d;
    font-size: 11px;
    line-height: 1.5;
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
