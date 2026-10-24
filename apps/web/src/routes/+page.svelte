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

<main class="landing-page">
  <header class="landing-nav">
    <a class="landing-brand" href="/" aria-label="Sabi home"
      ><img class="landing-mark-glyph" src="/sabi-mark.svg" alt="" />sabi<span
        class="brand-dot">.</span
      ></a
    >
    <nav aria-label="Main">
      <a href="#how">How it helps</a><a href="#portals">Our portals</a>
    </nav>
    <a class="landing-login" href="/sign-in/pregnant"
      >Sign in <HugeiconsIcon icon={ArrowRight01Icon} size={15} /></a
    >
  </header>
  <section class="landing-hero">
    <div class="landing-copy">
      <div class="landing-kicker">
        <i></i> MADE WITH NIGERIAN FAMILIES IN MIND
      </div>
      <h1>Care that stays<br />with you <em>between visits.</em></h1>
      <p>
        Pregnancy brings a lot of questions. Find calm, practical guidance for
        your week, your wellbeing and the foods you know — with your health
        worker at the centre of care.
      </p>
      <div class="landing-actions">
        <a class="landing-primary" href="/sign-in/pregnant"
          >Enter pregnancy portal <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={17}
          /></a
        ><a class="landing-secondary" href="#how">Explore Sabi</a>
      </div>
      <div class="landing-trust">
        <span><i></i>General education, not diagnosis</span><span
          >Built for the days between antenatal visits</span
        >
      </div>
    </div>
    <div class="landing-art" aria-label="Illustration of a woman sitting">
      <div class="art-orbit orbit-one"></div>
      <div class="art-orbit orbit-two"></div>
      <img
        class="hero-illustration"
        src="/sabi-hero-illustration.png"
        alt="Illustration of a woman sitting"
      />
      <div class="art-note note-top">
        <span>✳</span>
        <div>
          <strong>Your week, at a glance</strong><small
            >Gentle guidance for right now</small
          >
        </div>
      </div>
      <div class="art-note note-bottom">
        <span>♡</span>
        <div>
          <strong>You are not alone</strong><small
            >Your care team is part of the journey</small
          >
        </div>
      </div>
      <div class="art-caption">A little care, every week.</div>
    </div>
  </section>
  <section id="how" class="landing-features">
    <div class="landing-section-intro">
      <span>HERE FOR THE IN-BETWEEN</span>
      <h2>Small answers can make<br />a big week feel lighter.</h2>
      <p>
        Useful, culturally grounded support that helps you prepare better
        questions for your next visit.
      </p>
    </div>
    <div class="feature-grid">
      <article>
        <span class="feature-icon coral"
          ><HugeiconsIcon icon={BookOpen01Icon} size={20} /></span
        >
        <h3>Guidance for your week</h3>
        <p>
          Follow a pregnancy timeline with clear, reassuring learning prompts
          and trusted references.
        </p>
      </article>
      <article>
        <span class="feature-icon green"
          ><HugeiconsIcon icon={Shield01Icon} size={20} /></span
        >
        <h3>Know when to get help</h3>
        <p>
          Recognize warning signs and see plain directions to contact a
          qualified health worker.
        </p>
      </article>
      <article>
        <span class="feature-icon yellow"
          ><HugeiconsIcon icon={Leaf01Icon} size={20} /></span
        >
        <h3>Food from home</h3>
        <p>
          Explore familiar ingredients and meals from across Nigeria, with room
          for your own questions.
        </p>
      </article>
    </div>
  </section>
  <section id="portals" class="portal-choices">
    <div class="landing-section-intro">
      <span>TWO SPACES, ONE CARE JOURNEY</span>
      <h2>Choose the space<br />that is right for you.</h2>
    </div>
    <div class="portal-choice-grid">
      <article class="choice-card pregnant-choice">
        <span class="choice-icon"
          ><HugeiconsIcon icon={HeartAddIcon} size={21} /></span
        >
        <div class="choice-label">PREGNANCY PORTAL</div>
        <h3>For pregnant people</h3>
        <p>
          Keep your weekly guide, wellbeing check-ins and food log together in
          your private account.
        </p>
        <a href="/sign-in/pregnant"
          >Sign in to pregnancy portal <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
          /></a
        >
      </article>
      <article class="choice-card care-choice">
        <span class="choice-icon"
          ><HugeiconsIcon icon={UserMultiple02Icon} size={21} /></span
        >
        <div class="choice-label">CARE TEAM PORTAL</div>
        <h3>For nurses & midwives</h3>
        <p>
          Follow up with patients who have explicitly linked their account to
          yours.
        </p>
        <a href="/sign-in/midwife"
          >Sign in to care team portal <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
          /></a
        >
      </article>
    </div>
  </section>
  <footer class="landing-footer">
    <a class="landing-brand" href="/"
      ><img class="landing-mark-glyph" src="/sabi-mark.svg" alt="" />sabi<span
        class="brand-dot">.</span
      ></a
    ><span>Here for the in-between.</span><small
      >General education only · Speak with a qualified health worker about your
      care</small
    >
  </footer>
</main>
