<script lang="ts">
  // Using Iconoir icons throughout
</script>

<svelte:head>
  <title>Sabi — pregnancy care, closer to home</title>
  <meta
    name="description"
    content="A Nigeria-focused pregnancy companion for the days between antenatal visits."
  />
</svelte:head>

<main class="min-h-screen bg-[#faf9f6] text-[#30312c] font-sans antialiased selection:bg-[#af705a]/20">
  <!-- Navigation Bar -->
  <header class="sticky top-0 z-40 bg-[#faf9f6]/95 backdrop-blur-md border-b border-[#e7e4dc]/70">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
      <a class="flex items-center gap-2.5 text-2xl font-serif font-bold text-[#30312c] tracking-tight hover:opacity-90 transition-opacity" href="/" aria-label="Sabi home">
        <img class="w-8 h-8 rounded-xl shadow-xs" src="/sabi-mark.svg" alt="" />
        <span>sabi<span class="text-[#af705a]">.</span></span>
      </a>

      <nav class="hidden md:flex items-center gap-7 text-sm font-medium text-[#686960]" aria-label="Main">
        <a href="#how" class="hover:text-[#30312c] transition-colors">How it helps</a>
        <a href="#portals" class="hover:text-[#30312c] transition-colors">Our portals</a>
        <a href="/sign-in/midwife" class="text-[#809474] hover:text-[#5d7051] transition-colors flex items-center gap-1.5">
          <i class="iconoir-hospital text-sm"></i>
          <span>For Midwives</span>
        </a>
      </nav>

      <div class="flex items-center gap-2.5">
        <a
          class="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#d6d2c4] text-[#525547] hover:bg-white hover:border-[#809474] transition-all"
          href="/sign-in/midwife"
        >
          Care Portal
        </a>
        <a
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-[#809474] text-white hover:bg-[#6c8060] shadow-2xs active:scale-[0.99] transition-all"
          href="/sign-in/pregnant"
        >
          <span>Sign In</span>
          <i class="iconoir-arrow-right text-xs"></i>
        </a>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
      <!-- Left Copy Column -->
      <div class="lg:col-span-7 space-y-5 max-w-xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#809474]/15 text-[#475842] text-xs font-bold tracking-wider uppercase">
          <span class="w-2 h-2 rounded-full bg-[#809474]"></span>
          <span>Made for Nigerian Families</span>
        </div>

        <h1 class="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#30312c] font-medium tracking-tight leading-tight">
          Care that stays <br class="hidden sm:block" />
          with you <em class="not-italic text-[#af705a] font-normal">between visits.</em>
        </h1>

        <p class="text-sm sm:text-base text-[#686960] leading-relaxed">
          Pregnancy brings a lot of questions. Find calm, week-by-week guidance, Nigerian nutrition insights, and safe medication guides — with your healthcare provider connected at the centre.
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-wrap items-center gap-3 pt-1">
          <a
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#af705a] text-white hover:bg-[#975c48] shadow-xs active:scale-[0.99] transition-all text-center"
            href="/sign-in/pregnant"
          >
            <span>Enter Pregnancy Portal</span>
            <i class="iconoir-arrow-right text-xs"></i>
          </a>

          <a
            class="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl bg-white border border-[#d6d2c4] text-[#475842] hover:bg-[#f3f6f1] hover:border-[#809474] active:scale-[0.99] transition-all text-center"
            href="#how"
          >
            Explore Sabi
          </a>
        </div>

        <!-- Trust Badges -->
        <div class="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-[#77786f]">
          <div class="flex items-center gap-1.5">
            <i class="iconoir-check-circle text-[#809474]"></i>
            <span>General wellness &amp; education</span>
          </div>
          <div class="flex items-center gap-1.5">
            <i class="iconoir-calendar text-[#809474]"></i>
            <span>Between antenatal visits</span>
          </div>
          <div class="flex items-center gap-1.5">
            <i class="iconoir-shield-check text-[#809474]"></i>
            <span>One-click Judge Demos</span>
          </div>
        </div>
      </div>

      <!-- Right Visual Column: Modern Clean Card Presentation -->
      <div class="lg:col-span-5 relative flex justify-center">
        <div class="w-full max-w-sm rounded-3xl bg-white border border-[#e7e4dc] p-6 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-[#f0ede6]">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-[#809474]/15 flex items-center justify-center text-[#475842]">
                <i class="iconoir-activity text-lg"></i>
              </div>
              <div>
                <strong class="block text-xs font-bold text-[#30312c]">Week 29 Companion</strong>
                <small class="text-[11px] text-[#77786f]">Third Trimester</small>
              </div>
            </div>
            <span class="text-[11px] font-semibold text-[#af705a] bg-[#af705a]/10 px-2 py-0.5 rounded-full">Active</span>
          </div>

          <!-- Calm Interactive Preview -->
          <div class="rounded-2xl bg-[#faf9f6] p-4 border border-[#eeeae1] space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-[#af705a]/15 text-[#af705a] flex items-center justify-center">
                <i class="iconoir-sparks text-lg"></i>
              </div>
              <div>
                <span class="text-[10px] uppercase font-bold tracking-wider text-[#8e9083]">Baby Size</span>
                <p class="text-sm font-semibold text-[#30312c] m-0">Butternut squash · 1.2 kg</p>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-white border border-[#e8e4da] space-y-1">
              <span class="text-[11px] font-bold text-[#475842] flex items-center gap-1">
                <i class="iconoir-apple-half text-xs"></i> Weekly Nigerian Nutrition
              </span>
              <p class="text-xs text-[#525547] leading-relaxed m-0">
                Egusi with fish or lean meat, rich in healthy fats and protein for rapid third trimester growth.
              </p>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1 text-xs text-[#77786f]">
            <span class="flex items-center gap-1.5 text-[#475842] font-medium">
              <i class="iconoir-lock text-xs"></i> Private &amp; encrypted
            </span>
            <span class="text-[11px] text-[#8e9083]">sabi.health</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section id="how" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-[#e7e4dc]/70">
    <div class="text-center max-w-xl mx-auto mb-10">
      <span class="text-xs font-bold tracking-widest text-[#888b7c] uppercase">HERE FOR THE IN-BETWEEN</span>
      <h2 class="font-serif text-2xl sm:text-3xl text-[#30312c] font-medium mt-1 mb-2">
        Small answers can make <br />a big week feel lighter.
      </h2>
      <p class="text-xs sm:text-sm text-[#686960]">
        Culturally grounded support from week 1 through 42, helping you ask better questions at your next clinic visit.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <article class="rounded-2xl bg-white border border-[#e7e4dc] p-5 shadow-2xs hover:shadow-xs transition-shadow">
        <div class="w-10 h-10 rounded-xl bg-[#af705a]/15 text-[#af705a] flex items-center justify-center mb-4">
          <i class="iconoir-book text-xl"></i>
        </div>
        <h3 class="font-serif text-lg font-semibold text-[#30312c] mb-1.5">Guidance for Your Week</h3>
        <p class="text-xs sm:text-sm text-[#686960] leading-relaxed">
          Follow your journey from weeks 1 to 42 with baby size comparisons in familiar Nigerian terms, body changes, and book-derived medical excerpts.
        </p>
      </article>

      <article class="rounded-2xl bg-white border border-[#e7e4dc] p-5 shadow-2xs hover:shadow-xs transition-shadow">
        <div class="w-10 h-10 rounded-xl bg-[#809474]/15 text-[#475842] flex items-center justify-center mb-4">
          <i class="iconoir-shield-check text-xl"></i>
        </div>
        <h3 class="font-serif text-lg font-semibold text-[#30312c] mb-1.5">Safety &amp; Check-ins</h3>
        <p class="text-xs sm:text-sm text-[#686960] leading-relaxed">
          Check in on your mood and symptoms with non-judgmental guidance. Instantly know when something requires urgent medical attention at the clinic.
        </p>
      </article>

      <article class="rounded-2xl bg-white border border-[#e7e4dc] p-5 shadow-2xs hover:shadow-xs transition-shadow">
        <div class="w-10 h-10 rounded-xl bg-[#d99f43]/15 text-[#9e6d1c] flex items-center justify-center mb-4">
          <i class="iconoir-apple-half text-xl"></i>
        </div>
        <h3 class="font-serif text-lg font-semibold text-[#30312c] mb-1.5">Food &amp; 50+ Med Guides</h3>
        <p class="text-xs sm:text-sm text-[#686960] leading-relaxed">
          Discover nutrient recommendations tailored to your week, explore regional dishes from all 6 Nigerian zones, and check safety for 50+ common medicines.
        </p>
      </article>
    </div>
  </section>

  <!-- Portals Section -->
  <section id="portals" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mb-8 border-t border-[#e7e4dc]/70">
    <div class="text-center max-w-xl mx-auto mb-8">
      <span class="text-xs font-bold tracking-widest text-[#888b7c] uppercase">TWO SPACES, ONE CARE JOURNEY</span>
      <h2 class="font-serif text-2xl sm:text-3xl text-[#30312c] font-medium mt-1">Choose the space that fits you.</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
      <!-- Pregnant Person Portal -->
      <article class="rounded-2xl bg-white border-2 border-[#af705a]/25 p-6 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
        <div>
          <div class="w-10 h-10 rounded-xl bg-[#af705a]/15 text-[#af705a] flex items-center justify-center mb-3">
            <i class="iconoir-heart text-xl"></i>
          </div>
          <span class="text-[11px] font-bold tracking-wider text-[#af705a] uppercase">PREGNANCY PORTAL</span>
          <h3 class="font-serif text-xl font-semibold text-[#30312c] mt-1 mb-1.5">For Expectant Mothers</h3>
          <p class="text-xs sm:text-sm text-[#686960] leading-relaxed mb-5">
            Track your weeks, note your daily wellness, find Nigerian meal ideas, and connect directly with your healthcare worker using their Sabi code.
          </p>
        </div>
        <a
          href="/sign-in/pregnant"
          class="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-[#af705a] text-white font-semibold text-xs sm:text-sm hover:bg-[#975c48] transition-colors"
        >
          <span>Sign In to Pregnancy Portal</span>
          <i class="iconoir-arrow-right text-xs"></i>
        </a>
      </article>

      <!-- Midwife / Care Team Portal -->
      <article class="rounded-2xl bg-white border-2 border-[#809474]/25 p-6 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
        <div>
          <div class="w-10 h-10 rounded-xl bg-[#809474]/15 text-[#475842] flex items-center justify-center mb-3">
            <i class="iconoir-hospital text-xl"></i>
          </div>
          <span class="text-[11px] font-bold tracking-wider text-[#475842] uppercase">CARE TEAM PORTAL</span>
          <h3 class="font-serif text-xl font-semibold text-[#30312c] mt-1 mb-1.5">For Midwives &amp; Nurses</h3>
          <p class="text-xs sm:text-sm text-[#686960] leading-relaxed mb-5">
            Monitor patients who link their care account to your clinic code. Review symptom alerts, view recent check-ins, and support continuous care.
          </p>
        </div>
        <a
          href="/sign-in/midwife"
          class="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-[#475842] text-white font-semibold text-xs sm:text-sm hover:bg-[#384634] transition-colors"
        >
          <span>Sign In to Care Team Portal</span>
          <i class="iconoir-arrow-right text-xs"></i>
        </a>
      </article>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t border-[#e7e4dc] bg-white py-8">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <img class="w-6 h-6 rounded-lg" src="/sabi-mark.svg" alt="" />
        <span class="font-serif font-bold text-base text-[#30312c]">sabi<span class="text-[#af705a]">.</span></span>
        <span class="text-xs text-[#8e9083] ml-2">Here for the in-between.</span>
      </div>

      <small class="text-xs text-[#8e9083] text-center sm:text-right">
        General education only · Always speak with your qualified health worker for clinical advice.
      </small>
    </div>
  </footer>
</main>
