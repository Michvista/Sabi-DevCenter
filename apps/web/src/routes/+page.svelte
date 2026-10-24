<script lang="ts">
  import {
    ArrowRight01Icon,
    HeartAddIcon,
    UserMultiple02Icon,
    Shield01Icon,
    BookOpen01Icon,
    Leaf01Icon,
  } from "@hugeicons/core-free-icons";
  import { HugeiconsIcon } from "@hugeicons/svelte";
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
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      <a class="flex items-center gap-2.5 text-2xl font-serif font-bold text-[#30312c] tracking-tight hover:opacity-90 transition-opacity" href="/" aria-label="Sabi home">
        <img class="w-9 h-9 rounded-xl shadow-xs" src="/sabi-mark.svg" alt="" />
        <span>sabi<span class="text-[#af705a]">.</span></span>
      </a>

      <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-[#686960]" aria-label="Main">
        <a href="#how" class="hover:text-[#30312c] transition-colors">How it helps</a>
        <a href="#portals" class="hover:text-[#30312c] transition-colors">Our portals</a>
        <a href="/sign-in/midwife" class="text-[#809474] hover:text-[#5d7051] transition-colors">Midwives &amp; Nurses</a>
      </nav>

      <div class="flex items-center gap-3">
        <a
          class="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#d6d2c4] text-[#525547] hover:bg-white hover:border-[#809474] transition-all"
          href="/sign-in/midwife"
        >
          Care Portal
        </a>
        <a
          class="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-[#809474] text-white hover:bg-[#6c8060] shadow-xs active:scale-[0.99] transition-all"
          href="/sign-in/pregnant"
        >
          <span>Sign In</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
        </a>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-24">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
      <!-- Left Copy Column -->
      <div class="lg:col-span-7 space-y-6 max-w-2xl">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#809474]/15 text-[#475842] text-xs font-bold tracking-wider uppercase">
          <span class="w-2 h-2 rounded-full bg-[#809474] animate-pulse"></span>
          Made with Nigerian Families in Mind
        </div>

        <h1 class="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#30312c] font-medium tracking-tight leading-[1.12]">
          Care that stays <br class="hidden sm:block" />
          with you <em class="not-italic text-[#af705a] font-normal">between visits.</em>
        </h1>

        <p class="text-base sm:text-lg text-[#686960] leading-relaxed">
          Pregnancy brings a lot of questions. Find calm, week-by-week guidance, Nigerian nutrition insights, and safe medication guides — with your healthcare provider connected at the centre.
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <a
            class="inline-flex items-center justify-center gap-2.5 px-6 py-4 text-base font-semibold rounded-2xl bg-[#af705a] text-white hover:bg-[#975c48] shadow-md hover:shadow-lg active:scale-[0.99] transition-all text-center"
            href="/sign-in/pregnant"
          >
            <span>Enter Pregnancy Portal</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
          </a>

          <a
            class="inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold rounded-2xl bg-white border border-[#d6d2c4] text-[#475842] hover:bg-[#f3f6f1] hover:border-[#809474] active:scale-[0.99] transition-all text-center"
            href="#how"
          >
            Explore Sabi
          </a>
        </div>

        <!-- Trust Badges -->
        <div class="pt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-[#77786f]">
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-[#809474]"></span>
            <span>General education &amp; wellness</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-[#809474]"></span>
            <span>Built for the days between antenatal visits</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-[#809474]"></span>
            <span>One-click Judge Demos ready</span>
          </div>
        </div>
      </div>

      <!-- Right Visual Column -->
      <div class="lg:col-span-5 relative flex justify-center">
        <div class="relative w-full max-w-md">
          <!-- Ambient Glow Circles -->
          <div class="absolute -top-6 -left-6 w-48 h-48 bg-[#af705a]/10 rounded-full blur-2xl"></div>
          <div class="absolute -bottom-6 -right-6 w-52 h-52 bg-[#809474]/15 rounded-full blur-2xl"></div>

          <!-- Main Hero Card Container -->
          <div class="relative rounded-3xl bg-white border border-[#e7e4dc] p-5 shadow-lg overflow-hidden">
            <img
              class="w-full h-auto rounded-2xl object-cover max-h-[380px]"
              src="/sabi-hero-illustration.png"
              alt="Maternal care companion illustration"
            />

            <!-- Floating Note 1 -->
            <div class="absolute top-8 left-8 bg-white/95 backdrop-blur-sm border border-[#e7e4dc] rounded-2xl p-3 shadow-md flex items-center gap-3">
              <span class="w-7 h-7 rounded-full bg-[#af705a]/15 text-[#af705a] flex items-center justify-center text-sm font-bold">✳</span>
              <div>
                <strong class="block text-xs font-bold text-[#30312c]">Your week, at a glance</strong>
                <small class="text-[11px] text-[#77786f]">Flo-style calming updates</small>
              </div>
            </div>

            <!-- Floating Note 2 -->
            <div class="absolute bottom-8 right-8 bg-white/95 backdrop-blur-sm border border-[#e7e4dc] rounded-2xl p-3 shadow-md flex items-center gap-3">
              <span class="w-7 h-7 rounded-full bg-[#809474]/15 text-[#809474] flex items-center justify-center text-sm font-bold">♡</span>
              <div>
                <strong class="block text-xs font-bold text-[#30312c]">You are not alone</strong>
                <small class="text-[11px] text-[#77786f]">Midwife care codes supported</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section id="how" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[#e7e4dc]/70">
    <div class="text-center max-w-2xl mx-auto mb-12">
      <span class="text-xs font-bold tracking-widest text-[#888b7c] uppercase">HERE FOR THE IN-BETWEEN</span>
      <h2 class="font-serif text-3xl sm:text-4xl text-[#30312c] font-medium mt-2 mb-3">
        Small answers can make <br />a big week feel lighter.
      </h2>
      <p class="text-sm sm:text-base text-[#686960]">
        Culturally grounded support from week 1 through 42, helping you ask better questions at your next clinic visit.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <article class="rounded-3xl bg-white border border-[#e7e4dc] p-6 shadow-xs hover:shadow-md transition-shadow">
        <div class="w-12 h-12 rounded-2xl bg-[#af705a]/15 text-[#af705a] flex items-center justify-center mb-5">
          <HugeiconsIcon icon={BookOpen01Icon} size={22} />
        </div>
        <h3 class="font-serif text-xl font-semibold text-[#30312c] mb-2">Guidance for Your Week</h3>
        <p class="text-sm text-[#686960] leading-relaxed">
          Follow your journey from weeks 1 to 42 with baby size comparisons in familiar Nigerian terms, body changes, and book-derived medical excerpts.
        </p>
      </article>

      <article class="rounded-3xl bg-white border border-[#e7e4dc] p-6 shadow-xs hover:shadow-md transition-shadow">
        <div class="w-12 h-12 rounded-2xl bg-[#809474]/15 text-[#475842] flex items-center justify-center mb-5">
          <HugeiconsIcon icon={Shield01Icon} size={22} />
        </div>
        <h3 class="font-serif text-xl font-semibold text-[#30312c] mb-2">Safety &amp; Check-ins</h3>
        <p class="text-sm text-[#686960] leading-relaxed">
          Check in on your mood and symptoms with non-judgmental guidance. Instantly know when something requires urgent medical attention at the clinic.
        </p>
      </article>

      <article class="rounded-3xl bg-white border border-[#e7e4dc] p-6 shadow-xs hover:shadow-md transition-shadow">
        <div class="w-12 h-12 rounded-2xl bg-[#d99f43]/15 text-[#9e6d1c] flex items-center justify-center mb-5">
          <HugeiconsIcon icon={Leaf01Icon} size={22} />
        </div>
        <h3 class="font-serif text-xl font-semibold text-[#30312c] mb-2">Food &amp; 50+ Med Guides</h3>
        <p class="text-sm text-[#686960] leading-relaxed">
          Discover nutrient recommendations tailored to your week, explore regional dishes from all 6 Nigerian zones, and check safety for 50+ common medicines.
        </p>
      </article>
    </div>
  </section>

  <!-- Portals Section -->
  <section id="portals" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mb-12 border-t border-[#e7e4dc]/70">
    <div class="text-center max-w-xl mx-auto mb-10">
      <span class="text-xs font-bold tracking-widest text-[#888b7c] uppercase">TWO SPACES, ONE CARE JOURNEY</span>
      <h2 class="font-serif text-3xl text-[#30312c] font-medium mt-2">Choose the space that fits you.</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <!-- Pregnant Person Portal -->
      <article class="rounded-3xl bg-white border-2 border-[#af705a]/25 p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div class="w-12 h-12 rounded-2xl bg-[#af705a]/15 text-[#af705a] flex items-center justify-center mb-4">
            <HugeiconsIcon icon={HeartAddIcon} size={22} />
          </div>
          <span class="text-xs font-bold tracking-wider text-[#af705a] uppercase">PREGNANCY PORTAL</span>
          <h3 class="font-serif text-2xl font-semibold text-[#30312c] mt-1 mb-2">For Expectant Mothers</h3>
          <p class="text-sm text-[#686960] leading-relaxed mb-6">
            Track your weeks, note your daily wellness, find Nigerian meal ideas, and connect directly with your healthcare worker using their Sabi code.
          </p>
        </div>
        <a
          href="/sign-in/pregnant"
          class="inline-flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-xl bg-[#af705a] text-white font-semibold text-sm hover:bg-[#975c48] transition-colors"
        >
          <span>Sign In to Pregnancy Portal</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </a>
      </article>

      <!-- Midwife / Care Team Portal -->
      <article class="rounded-3xl bg-white border-2 border-[#809474]/25 p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div class="w-12 h-12 rounded-2xl bg-[#809474]/15 text-[#475842] flex items-center justify-center mb-4">
            <HugeiconsIcon icon={UserMultiple02Icon} size={22} />
          </div>
          <span class="text-xs font-bold tracking-wider text-[#475842] uppercase">CARE TEAM PORTAL</span>
          <h3 class="font-serif text-2xl font-semibold text-[#30312c] mt-1 mb-2">For Midwives &amp; Nurses</h3>
          <p class="text-sm text-[#686960] leading-relaxed mb-6">
            Monitor patients who link their care account to your clinic code. Review symptom alerts, view recent check-ins, and support continuous care.
          </p>
        </div>
        <a
          href="/sign-in/midwife"
          class="inline-flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-xl bg-[#475842] text-white font-semibold text-sm hover:bg-[#384634] transition-colors"
        >
          <span>Sign In to Care Team Portal</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </a>
      </article>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t border-[#e7e4dc] bg-white py-10">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <img class="w-6 h-6 rounded-lg" src="/sabi-mark.svg" alt="" />
        <span class="font-serif font-bold text-lg text-[#30312c]">sabi<span class="text-[#af705a]">.</span></span>
        <span class="text-xs text-[#8e9083] ml-2">Here for the in-between.</span>
      </div>

      <small class="text-xs text-[#8e9083] text-center sm:text-right">
        General education only · Always speak with your qualified health worker for clinical advice.
      </small>
    </div>
  </footer>
</main>
