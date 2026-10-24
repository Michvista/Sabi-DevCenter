<script lang="ts">
  import { goto } from "$app/navigation";
  import { authenticate, type PortalRole } from "#lib/auth/session.ts";
  let { role }: { role: PortalRole } = $props();
  let name = $state("");
  let email = $state("");
  let password = $state("");
  let inviteCode = $state("");
  let message = $state("");
  let createAccount = $state(false);
  let showPassword = $state(false);
  let submitting = $state(false);
  const isMidwife = $derived(role === "midwife");
  const demoEnabled = $derived(
    role === "pregnant" && import.meta.env.VITE_DEMO_LOGIN_ENABLED === "true",
  );
  const demoMidwifeEnabled = $derived(
    role === "midwife" && import.meta.env.VITE_DEMO_LOGIN_ENABLED === "true",
  );
  const demoEmail =
    import.meta.env.VITE_DEMO_EMAIL ?? "demo.pregnant@sabi.health";
  const demoPassword = import.meta.env.VITE_DEMO_PASSWORD ?? "SabiDemo2026!";
  const demoMidwifeEmail =
    import.meta.env.VITE_DEMO_MIDWIFE_EMAIL ?? "demo.midwife@sabi.health";
  const demoMidwifePassword =
    import.meta.env.VITE_DEMO_MIDWIFE_PASSWORD ?? "SabiDemo2026!";
  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (submitting) return;
    submitting = true;
    message = "";
    try {
      await authenticate(createAccount ? "register" : "login", {
        ...(createAccount
          ? {
              displayName: name.trim(),
              ...(isMidwife ? { inviteCode: inviteCode.trim() } : {}),
            }
          : {}),
        email: email.trim(),
        password,
        role: isMidwife ? "MIDWIFE" : "PREGNANT_PERSON",
      });
      await goto(isMidwife ? "/midwife/dashboard" : "/pregnant/dashboard");
    } catch (error) {
      message =
        error instanceof Error ? error.message : "Sign-in failed. Try again.";
    } finally {
      submitting = false;
    }
  }
  async function signInDemo() {
    if (submitting) return;
    submitting = true;
    message = "";
    try {
      await authenticate("login", {
        email: demoEmail,
        password: demoPassword,
        role: "PREGNANT_PERSON",
      });
      await goto("/pregnant/dashboard");
    } catch (error) {
      message =
        error instanceof Error ? error.message : "Demo sign-in is unavailable.";
    } finally {
      submitting = false;
    }
  }
  async function signInMidwifeDemo() {
    if (submitting) return;
    submitting = true;
    message = "";
    try {
      await authenticate("login", {
        email: demoMidwifeEmail,
        password: demoMidwifePassword,
        role: "MIDWIFE",
      });
      await goto("/midwife/dashboard");
    } catch (error) {
      message =
        error instanceof Error ? error.message : "Demo sign-in is unavailable.";
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head
  ><title
    >{isMidwife ? "Care team sign in" : "Pregnancy portal sign in"} — Sabi</title
  ><meta
    name="description"
    content="Sign in to your private Sabi portal."
  /></svelte:head
>

<main class="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4 py-10">
  <!-- Back link -->
  <a
    href="/"
    class="fixed top-5 left-5 inline-flex items-center gap-1.5 text-xs font-medium text-[#72746b] hover:text-[#2b2c28] transition-colors"
  >
    <i class="iconoir-arrow-left text-sm"></i>
    <span>Back to Sabi</span>
  </a>

  <div class="w-full max-w-md">
    <!-- Brand -->
    <a href="/" class="flex items-center gap-3 justify-center mb-8">
      <span class="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs overflow-hidden {isMidwife ? 'bg-[#475842]' : 'bg-[#af705a]'}">
        <img src="/sabi-mark.svg" alt="" class="w-full h-full" />
      </span>
      <span class="font-serif text-2xl font-bold text-[#2b2c28] tracking-tight">
        sabi<span class="text-[#af705a]">.</span>
        <small class="block font-sans text-[10px] font-bold tracking-widest text-[#9c998f] mt-0.5 uppercase">
          {isMidwife ? "Care Team Portal" : "Pregnancy Portal"}
        </small>
      </span>
    </a>

    <!-- Card -->
    <div class="bg-white rounded-3xl border border-[#e7e4dc] shadow-sm p-8">
      <!-- Eyebrow + heading -->
      <div class="mb-6">
        <div class="text-[11px] font-bold tracking-widest text-[#9c998f] uppercase mb-1">
          {isMidwife ? "FOR NURSES & MIDWIVES" : "YOUR CARE, YOUR PACE"}
        </div>
        <h1 class="font-serif text-2xl font-semibold text-[#2b2c28] mb-1">
          {isMidwife ? "Welcome, care partner." : "Welcome to your space."}
        </h1>
        <p class="text-sm text-[#72746b]">
          {isMidwife
            ? "Sign in to your care-team account."
            : "Sign in to continue to your pregnancy companion."}
        </p>
      </div>

      <!-- Sign-in / Create account tab toggle -->
      <div class="flex rounded-xl border border-[#e7e4dc] p-1 mb-6 bg-[#faf9f6]">
        <button
          type="button"
          class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all {!createAccount ? 'bg-white text-[#2b2c28] shadow-xs' : 'text-[#72746b] hover:text-[#2b2c28]'}"
          onclick={() => (createAccount = false)}
        >Sign in</button>
        <button
          type="button"
          class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all {createAccount ? 'bg-white text-[#2b2c28] shadow-xs' : 'text-[#72746b] hover:text-[#2b2c28]'}"
          onclick={() => (createAccount = true)}
        >Create account</button>
      </div>

      <!-- Form -->
      <form onsubmit={submit} class="space-y-4">
        {#if createAccount}
          <div>
            <label for="name" class="block text-xs font-semibold text-[#55574f] mb-1.5">Full name</label>
            <input
              id="name"
              bind:value={name}
              autocomplete="name"
              placeholder="Your name"
              required
              class="w-full px-4 py-3 text-sm rounded-xl border border-[#dedad0] bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#809474]/40 focus:bg-white placeholder-[#9a988f]"
            />
          </div>
        {/if}

        <div>
          <label for="email" class="block text-xs font-semibold text-[#55574f] mb-1.5">Email address</label>
          <input
            id="email"
            type="email"
            bind:value={email}
            autocomplete="email"
            placeholder="you@example.com"
            required
            class="w-full px-4 py-3 text-sm rounded-xl border border-[#dedad0] bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#809474]/40 focus:bg-white placeholder-[#9a988f]"
          />
        </div>

        <div>
          <label for="password" class="block text-xs font-semibold text-[#55574f] mb-1.5">Password</label>
          <div class="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              bind:value={password}
              autocomplete={createAccount ? "new-password" : "current-password"}
              minlength="12"
              required
              class="w-full pl-4 pr-11 py-3 text-sm rounded-xl border border-[#dedad0] bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#809474]/40 focus:bg-white"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#555] transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onclick={() => (showPassword = !showPassword)}
            >
              <i class="{showPassword ? 'iconoir-eye-off' : 'iconoir-eye'} text-lg"></i>
            </button>
          </div>
        </div>

        {#if isMidwife && createAccount}
          <div>
            <label for="invite" class="block text-xs font-semibold text-[#55574f] mb-1.5">Care-team invitation code</label>
            <input
              id="invite"
              bind:value={inviteCode}
              autocomplete="off"
              placeholder="Provided by your clinic"
              required
              class="w-full px-4 py-3 text-sm rounded-xl border border-[#dedad0] bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#809474]/40 focus:bg-white placeholder-[#9a988f]"
            />
            <small class="block mt-1 text-xs text-[#72746b]">Ask your clinic administrator for an invitation.</small>
          </div>
        {/if}

        {#if message}
          <p class="px-4 py-2.5 rounded-xl bg-[#fdf4f0] border border-[#f4cfc4] text-sm text-[#9c2d15] font-medium" role="alert">{message}</p>
        {/if}

        <button
          class="w-full py-3 px-4 text-sm font-semibold rounded-xl text-white transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 disabled:opacity-60 {isMidwife ? 'bg-[#475842] hover:bg-[#384634]' : 'bg-[#809474] hover:bg-[#6c8060]'}"
          type="submit"
          disabled={submitting}
        >
          {submitting
            ? "Please wait…"
            : `${createAccount ? "Create account" : "Sign in"} to ${
                isMidwife ? "care team" : "my pregnancy"
              }`}
        </button>
      </form>

      <!-- Demo sections -->
      {#if demoEnabled}
        <section class="mt-5 border border-[#af705a]/30 bg-[#af705a]/5 rounded-2xl p-4" aria-label="Judge demo account">
          <div class="mb-3">
            <strong class="text-xs font-bold text-[#854530] flex items-center gap-1.5">
              <i class="iconoir-spark text-sm text-[#af705a]"></i>
              One-Click Judge Demo Access
            </strong>
            <p class="text-xs text-[#686960] mt-1">
              Explore the pregnancy portal with sample week 29 logs and pre-connected midwife.
            </p>
          </div>
          <button
            class="w-full py-2.5 px-3 text-xs font-bold rounded-xl bg-[#af705a] text-white hover:bg-[#945844] active:scale-[0.99] transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
            type="button"
            onclick={signInDemo}
            disabled={submitting}
          >
            <span>Enter Pregnant Demo Portal</span>
            <i class="iconoir-arrow-right text-xs"></i>
          </button>
          <details class="mt-2 text-xs text-[#77786f]">
            <summary class="cursor-pointer hover:underline text-[11px]">Show demo credentials</summary>
            <dl class="mt-1 space-y-0.5 text-[11px]">
              <div><dt class="inline font-medium">Email: </dt><dd class="inline">{demoEmail}</dd></div>
              <div><dt class="inline font-medium">Password: </dt><dd class="inline">{demoPassword}</dd></div>
            </dl>
          </details>
        </section>
      {/if}

      {#if demoMidwifeEnabled}
        <section class="mt-4 border border-[#809474]/30 bg-[#809474]/5 rounded-2xl p-4" aria-label="Judge midwife demo account">
          <div class="mb-3">
            <strong class="text-xs font-bold text-[#475842] flex items-center gap-1.5">
              <i class="iconoir-hospital text-sm text-[#809474]"></i>
              One-Click Midwife Demo Access
            </strong>
            <p class="text-xs text-[#686960] mt-1">
              Open the care team portal with a pre-connected patient and code: <strong>SABICRE</strong>
            </p>
          </div>
          <button
            class="w-full py-2.5 px-3 text-xs font-bold rounded-xl bg-[#475842] text-white hover:bg-[#384634] active:scale-[0.99] transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
            type="button"
            onclick={signInMidwifeDemo}
            disabled={submitting}
          >
            <span>Enter Midwife Demo Portal</span>
            <i class="iconoir-arrow-right text-xs"></i>
          </button>
          <details class="mt-2 text-xs text-[#77786f]">
            <summary class="cursor-pointer hover:underline text-[11px]">Show midwife demo details</summary>
            <dl class="mt-1 space-y-0.5 text-[11px]">
              <div><dt class="inline font-medium">Email: </dt><dd class="inline">{demoMidwifeEmail}</dd></div>
              <div><dt class="inline font-medium">Password: </dt><dd class="inline">{demoMidwifePassword}</dd></div>
              <div><dt class="inline font-medium">Connection Code: </dt><dd class="inline font-mono font-bold">SABICRE</dd></div>
            </dl>
          </details>
        </section>
      {/if}

      <!-- Footer note -->
      <div class="mt-6 pt-5 border-t border-[#f0eee8] flex flex-col gap-2 text-xs text-[#888b7e]">
        <div class="flex items-start gap-2">
          <i class="iconoir-shield-check text-sm text-[#809474] mt-0.5 shrink-0"></i>
          <span>Passwords are hashed on the server. Sabi is not emergency monitoring — seek urgent care for danger signs.</span>
        </div>
        <a
          class="mt-1 text-xs font-semibold text-[#809474] hover:underline"
          href={isMidwife ? "/sign-in/pregnant" : "/sign-in/midwife"}
        >
          {isMidwife ? "Pregnant person? Sign in here →" : "Nurse or midwife? Sign in here →"}
        </a>
      </div>
    </div>
  </div>
</main>
