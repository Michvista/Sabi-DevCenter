<script lang="ts">
  import { goto } from "$app/navigation";
  import { HugeiconsIcon } from "@hugeicons/svelte";
  import {
    ArrowLeft01Icon,
    EyeIcon,
    ViewOffIcon,
  } from "@hugeicons/core-free-icons";
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
    ><HugeiconsIcon icon={ArrowLeft01Icon} size={17} /> Back to Sabi</a
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
          ><HugeiconsIcon
            icon={showPassword ? ViewOffIcon : EyeIcon}
            size={18}
          /></button
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
      <button class="signin-submit" type="submit" disabled={submitting}
        >{submitting
          ? "Please wait…"
          : `${createAccount ? "Create account" : "Sign in"} to ${
              isMidwife ? "care team" : "my pregnancy"
            }`}</button
      >
    </form>
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
