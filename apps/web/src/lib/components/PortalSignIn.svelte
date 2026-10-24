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
    >{isMidwife ? "Care team sign in" : "Pregnant person sign in"} — Sabi</title
  ><meta
    name="description"
    content="Sign in to your private Sabi portal."
  /></svelte:head
>
<main class="signin-page">
  <a class="signin-back" href="/"
    ><i class="iconoir-arrow-left text-base"></i> Back to Sabi</a
  >
  <section class="signin-card">
    <a class="signin-brand" href="/"
      ><span class="signin-mark"><img src="/sabi-mark.svg" alt="" /></span><span
        >sabi<span class="brand-dot">.</span><small
          >{isMidwife ? "CARE TEAM PORTAL" : "PREGNANCY PORTAL"}</small
        ></span
      ></a
    >
    <div class="signin-eyebrow">
      {isMidwife ? "FOR NURSES & MIDWIVES" : "YOUR CARE, YOUR PACE"}
    </div>
    <h1>{isMidwife ? "Welcome, care partner." : "Welcome to your space."}</h1>
    <p>
      {isMidwife
        ? "Sign in to your care-team account."
        : "Sign in to continue to your pregnancy companion."}
    </p>
    <div class="signin-mode">
      <button
        type="button"
        class:active={!createAccount}
        onclick={() => (createAccount = false)}>Sign in</button
      ><button
        type="button"
        class:active={createAccount}
        onclick={() => (createAccount = true)}>Create account</button
      >
    </div>
    <form onsubmit={submit}>
      {#if createAccount}<label for="name">Full name</label><input
          id="name"
          bind:value={name}
          autocomplete="name"
          placeholder="Your name"
          required
        />{/if}
      <label for="email">Email address</label><input
        id="email"
        type="email"
        bind:value={email}
        autocomplete="email"
        placeholder="you@example.com"
        required
      />
      <label for="password">Password</label>
      <div class="password-field">
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          bind:value={password}
          autocomplete={createAccount ? "new-password" : "current-password"}
          minlength="12"
          required
        /><button
          type="button"
          class="password-toggle"
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          onclick={() => (showPassword = !showPassword)}
          ><i class="{showPassword ? 'iconoir-eye-off' : 'iconoir-eye'} text-base text-[#888]"></i></button
        >
      </div>
      {#if isMidwife && createAccount}<label for="invite"
          >Care-team invitation code</label
        ><input
          id="invite"
          bind:value={inviteCode}
          autocomplete="off"
          placeholder="Provided by your clinic"
          required
        /><small class="signin-help"
          >Ask your clinic administrator for an invitation.</small
        >{/if}
      {#if message}<p class="signin-error" role="alert">{message}</p>{/if}
      <button
        class="signin-submit !w-full !py-2.5 !px-4 !text-sm !font-semibold !rounded-xl !bg-[#809474] !text-white hover:!bg-[#6d8262] active:!scale-[0.99] transition-all cursor-pointer shadow-xs flex items-center justify-center text-center"
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
    {#if demoEnabled}
      <section class="judge-demo !border !border-[#af705a]/30 !bg-[#af705a]/5 !rounded-2xl !p-4 !mt-5" aria-label="Judge demo account">
        <div>
          <strong class="!text-xs !font-bold !text-[#854530] flex items-center gap-1.5">
            <i class="iconoir-spark text-sm text-[#af705a]"></i> One-Click Judge Demo Access
          </strong>
          <p class="!text-[11px] !text-[#686960] !mt-1">
            Explore the pregnancy portal with sample week 29 logs and pre-connected midwife.
          </p>
        </div>
        <button
          class="judge-demo-button !mt-2.5 !w-full !py-2.5 !px-3 !text-xs !font-bold !rounded-xl !bg-[#af705a] !text-white hover:!bg-[#945844] active:!scale-[0.99] transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
          type="button"
          onclick={signInDemo}
          disabled={submitting}
        >
          <span>Enter Pregnant Demo Portal</span>
          <i class="iconoir-arrow-right text-xs"></i>
        </button>
        <details class="!mt-2 !text-xs !text-[#77786f]">
          <summary class="cursor-pointer hover:underline text-[11px]">Show demo credentials</summary>
          <dl class="!mt-1 !space-y-0.5 text-[11px]">
            <div>
              <dt class="inline font-medium">Email: </dt>
              <dd class="inline">{demoEmail}</dd>
            </div>
            <div>
              <dt class="inline font-medium">Password: </dt>
              <dd class="inline">{demoPassword}</dd>
            </div>
          </dl>
        </details>
      </section>
    {/if}
    {#if demoMidwifeEnabled}
      <section class="judge-demo !border !border-[#809474]/30 !bg-[#809474]/5 !rounded-2xl !p-4 !mt-4" aria-label="Judge midwife demo account">
        <div>
          <strong class="!text-xs !font-bold !text-[#475842] flex items-center gap-1.5">
            <i class="iconoir-hospital text-sm text-[#809474]"></i> One-Click Midwife Demo Access
          </strong>
          <p class="!text-[11px] !text-[#686960] !mt-1">
            Open the care team portal with a pre-connected patient and code: <strong>SABICRE</strong>
          </p>
        </div>
        <button
          class="judge-demo-button !mt-2.5 !w-full !py-2.5 !px-3 !text-xs !font-bold !rounded-xl !bg-[#475842] !text-white hover:!bg-[#384634] active:!scale-[0.99] transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
          type="button"
          onclick={signInMidwifeDemo}
          disabled={submitting}
        >
          <span>Enter Midwife Demo Portal</span>
          <i class="iconoir-arrow-right text-xs"></i>
        </button>
        <details class="!mt-2 !text-xs !text-[#77786f]">
          <summary class="cursor-pointer hover:underline text-[11px]">Show midwife demo details</summary>
          <dl class="!mt-1 !space-y-0.5 text-[11px]">
            <div>
              <dt class="inline font-medium">Email: </dt>
              <dd class="inline">{demoMidwifeEmail}</dd>
            </div>
            <div>
              <dt class="inline font-medium">Password: </dt>
              <dd class="inline">{demoMidwifePassword}</dd>
            </div>
            <div>
              <dt class="inline font-medium">Connection Code: </dt>
              <dd class="inline font-mono font-bold">SABICRE</dd>
            </div>
          </dl>
        </details>
      </section>
    {/if}

    <div class="demo-notice">
      <strong>Private account access</strong><span
        >Passwords are hashed on the server. Sabi is not emergency monitoring;
        seek urgent care for danger signs.</span
      >
    </div>
    <a
      class="signin-switch"
      href={isMidwife ? "/sign-in/pregnant" : "/sign-in/midwife"}
      >{isMidwife
        ? "Pregnant person? Sign in here"
        : "Nurse or midwife? Sign in here"}</a
    >
  </section>
</main>
