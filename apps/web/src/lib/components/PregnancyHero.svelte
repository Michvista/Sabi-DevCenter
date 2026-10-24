<script lang="ts">
  let { week, onExplore }: { week: number; onExplore: () => void } = $props();
</script>

<section class="hero-card" id="pregnancy" aria-label="Pregnancy progress">
  <div class="hero-copy">
    <div class="hero-kicker">YOUR LITTLE ONE IS GROWING</div>
    <h2>One day at a time.<br /><em>You're doing beautifully.</em></h2>
    <p>
      You're in week {week}. Take a breath, listen to your body, and reach out
      when you need support.
    </p>
    <button class="hero-link" onclick={onExplore}
      >Explore week {week}
      <i class="iconoir-nav-arrow-right text-base"></i></button
    >
  </div>
  <div class="hero-art" aria-hidden="true">
    <div class="art-sun"></div>
    <div class="art-orbit orbit-one"></div>
    <div class="art-orbit orbit-two"></div>
    <div class="art-moon">☾</div>
    <div class="art-leaf leaf-one">✦</div>
    <div class="art-leaf leaf-two">✳</div>
    <div class="baby-blob">
      <span class="baby-face">⌣</span><span class="baby-hand">♡</span>
    </div>
    <div class="art-spark spark-one">✧</div>
    <div class="art-spark spark-two">·</div>
  </div>
  <div class="hero-week-stamp"><strong>{week}</strong><span>WEEKS</span></div>
</section>
