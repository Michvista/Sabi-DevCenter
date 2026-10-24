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

<section class="space-y-3" aria-label="Show this guide in another language">
  <div class="flex gap-2">
    <label class="sr-only" for="guide-translation-language">Translation language</label>
    <select
      id="guide-translation-language"
      bind:value={language}
      class="flex-1 px-3 py-2 text-xs rounded-xl border border-[#dedad0] bg-[#faf9f6] text-[#2b2c28] focus:outline-none focus:ring-2 focus:ring-[#809474]/40"
    >
      <option value="ha">Hausa</option>
      <option value="ig">Igbo</option>
      <option value="yo">Yorùbá</option>
      <option value="pcm">Nigerian Pidgin</option>
    </select>
    <button
      type="button"
      disabled={loading}
      onclick={showTranslation}
      class="py-2 px-4 text-xs font-semibold rounded-xl bg-white border border-[#d6d2c4] text-[#475842] hover:bg-[#faf9f6] transition-colors cursor-pointer disabled:opacity-50"
    >
      {loading ? "Translating…" : translated ? "Show again" : "Show translation"}
    </button>
  </div>
  {#if translated}
    <p class="p-3.5 rounded-xl bg-[#faf9f6] border border-[#e7e4dc] text-xs sm:text-sm text-[#30312c] leading-relaxed" lang={language}>
      {translated}
    </p>
    <small class="block text-[11px] text-[#8e9083]">
      Machine translation. Ask your maternity-care worker to confirm details that affect your care.
    </small>
  {/if}
  {#if message}
    <p class="text-xs text-[#9c2d15]" role="status">{message}</p>
  {/if}
</section>
