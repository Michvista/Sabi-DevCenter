<script lang="ts">
  import { sessionToken } from "#lib/auth/session.ts";
  import { onMount } from "svelte";

  const api = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
  let code = $state("");
  let message = $state("");
  let messageType = $state<"success" | "error">("success");
  let busy = $state(false);

  let connection = $state<{
    connected: boolean;
    midwifeName?: string;
    midwifeEmail?: string;
    status?: string;
  }>({ connected: false });
  let loadingConnection = $state(true);
  let checkingNotes = $state(false);
  let notesCheckedMessage = $state("");

  // Chat conversation state
  let messages = $state<Array<{
    id: string;
    senderRole: "PREGNANT_PERSON" | "MIDWIFE";
    content: string;
    createdAt: string;
  }>>([]);
  let chatText = $state("");
  let sendingChat = $state(false);
  let chatSent = $state(false);

  async function checkConnection(manual = false) {
    if (manual) checkingNotes = true;
    else loadingConnection = true;
    notesCheckedMessage = "";
    try {
      const res = await fetch(`${api}/records/care-links/status`, {
        headers: { Authorization: `Bearer ${sessionToken()}` },
      });
      if (res.ok) {
        connection = await res.json();
        if (connection.connected) {
          await loadMessages();
        }
      }
      if (manual) {
        notesCheckedMessage = `Updated notes & messages just now (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`;
        setTimeout(() => {
          notesCheckedMessage = "";
        }, 5000);
      }
    } catch {
      if (manual) notesCheckedMessage = "Could not refresh notes right now.";
    } finally {
      loadingConnection = false;
      checkingNotes = false;
    }
  }

  async function loadMessages() {
    try {
      const res = await fetch(`${api}/records/care-messages`, {
        headers: { Authorization: `Bearer ${sessionToken()}` },
      });
      if (res.ok) {
        messages = await res.json();
      }
    } catch {
      // fallback
    }
  }

  onMount(() => {
    void checkConnection();
  });

  async function connect(event: SubmitEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    busy = true;
    message = "";
    try {
      const response = await fetch(`${api}/records/care-links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken()}`,
        },
        body: JSON.stringify({ code: code.trim() }),
      });
      const result = await response.json();
      if (!response.ok || result.message) {
        messageType = "error";
        throw new Error(result.message ?? "Could not connect. Please try again.");
      }
      messageType = "success";
      message =
        result.status === "active"
          ? "You are connected! Your midwife can now review your check-ins."
          : "Request sent! Your midwife will approve access before seeing your records.";
      code = "";
      await checkConnection();
    } catch (error) {
      messageType = "error";
      message =
        error instanceof Error ? error.message : "Connection request failed.";
    } finally {
      busy = false;
    }
  }

  async function sendChatMessage(e: SubmitEvent) {
    e.preventDefault();
    if (!chatText.trim() || sendingChat) return;
    sendingChat = true;
    const textToSend = chatText.trim();
    try {
      const res = await fetch(`${api}/records/care-messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken()}`,
        },
        body: JSON.stringify({ content: textToSend }),
      });
      if (res.ok) {
        const saved = await res.json();
        messages = [...messages, saved];
        chatSent = true;
        chatText = "";
        setTimeout(() => {
          chatSent = false;
        }, 4000);
      }
    } catch {
      // silent fail
    } finally {
      sendingChat = false;
    }
  }

  function formatTime(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }
</script>

<div class="space-y-6" id="care-team">
  {#if connection.connected}
    <!-- ACTIVE CONNECTION BANNER & CLINICAL OVERVIEW -->
    <div class="rounded-3xl bg-linear-to-br from-[#ffffff] via-[#fbfbf8] to-[#f4f7f2] border border-[#d6e5d2] p-6 sm:p-8 shadow-xs space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#809474]/15 border border-[#809474]/30 text-xs font-bold text-[#475842] uppercase tracking-wider">
          <span class="w-2 h-2 rounded-full bg-[#475842] animate-pulse"></span>
          Active Care Connection
        </span>
        <span class="text-xs text-[#72746b] bg-white border border-[#e7e4dc] px-3 py-1 rounded-full font-medium">
          Care Held with Dignity
        </span>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-[#475842] text-white flex items-center justify-center text-2xl font-bold font-serif shadow-xs">
            {connection.midwifeName ? connection.midwifeName.slice(0, 2).toUpperCase() : "MW"}
          </div>
          <div>
            <h3 class="font-serif text-2xl font-semibold text-[#2b2c28]">{connection.midwifeName ?? "Assigned Midwife"}</h3>
            <p class="text-xs sm:text-sm text-[#72746b] mt-0.5">{connection.midwifeEmail ?? "Primary Maternity Health Worker"}</p>
            <span class="inline-flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-[#475842]">
              <i class="iconoir-check-circle text-sm text-[#809474]"></i>
              Connected on Sabi Care Team Portal
            </span>
          </div>
        </div>

        <div class="flex flex-col items-start sm:items-end gap-1.5 self-start sm:self-auto">
          <button
            onclick={() => void checkConnection(true)}
            disabled={checkingNotes}
            class="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl border border-[#d6d2c4] bg-white text-xs font-semibold text-[#475842] hover:bg-[#faf9f6] disabled:opacity-60 transition-colors cursor-pointer shadow-2xs"
          >
            <i class="{checkingNotes ? 'iconoir-refresh animate-spin' : 'iconoir-activity'} text-xs"></i>
            <span>{checkingNotes ? "Checking…" : "Check for new notes"}</span>
          </button>
          {#if notesCheckedMessage}
            <span class="text-[11px] font-medium text-[#385a38] flex items-center gap-1 animate-fade-in">
              <i class="iconoir-check-circle text-xs text-[#809474]"></i>
              {notesCheckedMessage}
            </span>
          {/if}
        </div>
      </div>

      <!-- Clinical Live Sync Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#edeae1]">
        <div class="p-4 rounded-2xl bg-white border border-[#e7e4dc] space-y-1">
          <span class="text-[10px] font-bold tracking-wider text-[#888b7c] uppercase block">CHECK-IN SYNC</span>
          <strong class="text-sm font-semibold text-[#2b2c28] block">Live & Shared</strong>
          <p class="text-[11px] text-[#72746b]">Your mood & symptoms sync directly to your midwife's dashboard.</p>
        </div>
        <div class="p-4 rounded-2xl bg-white border border-[#e7e4dc] space-y-1">
          <span class="text-[10px] font-bold tracking-wider text-[#888b7c] uppercase block">ANTENATAL REVIEW</span>
          <strong class="text-sm font-semibold text-[#2b2c28] block">Weekly Oversight</strong>
          <p class="text-[11px] text-[#72746b]">Your assigned health worker monitors warning signs and clinic dates.</p>
        </div>
        <div class="p-4 rounded-2xl bg-white border border-[#e7e4dc] space-y-1">
          <span class="text-[10px] font-bold tracking-wider text-[#888b7c] uppercase block">COMMUNICATION</span>
          <strong class="text-sm font-semibold text-[#2b2c28] block">Two-Way Thread</strong>
          <p class="text-[11px] text-[#72746b]">Ask questions and receive clinical notes between visits below.</p>
        </div>
      </div>
    </div>

    <!-- TWO-WAY CONVERSATION & MIDWIFE FEEDBACK THREAD -->
    <div class="rounded-3xl bg-white border border-[#e7e4dc] p-6 sm:p-8 shadow-xs space-y-6">
      <div class="flex items-center justify-between pb-4 border-b border-[#f0ede6]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-[#809474]/15 text-[#475842] flex items-center justify-center text-xl">
            <i class="iconoir-chat-bubble-check"></i>
          </div>
          <div>
            <h4 class="font-serif text-xl font-semibold text-[#2b2c28]">Care Conversation & Clinical Notes</h4>
            <span class="text-xs text-[#72746b]">Messages and advice exchanged with {connection.midwifeName ?? "your midwife"}</span>
          </div>
        </div>
        <span class="text-xs text-[#888b7c] font-medium">{messages.length} messages</span>
      </div>

      <!-- Messages Stream -->
      <div class="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {#if messages.length === 0}
          <div class="py-10 text-center rounded-2xl bg-[#faf9f6] border border-dashed border-[#e2dfd5] space-y-1">
            <i class="iconoir-heart text-2xl text-[#af705a]"></i>
            <p class="text-xs text-[#72746b]">No messages in this thread yet.</p>
            <span class="text-[11px] text-[#8e9083]">Ask a question or leave a note below; your midwife will respond here.</span>
          </div>
        {:else}
          {#each messages as msg (msg.id)}
            <div class="flex flex-col {msg.senderRole === 'PREGNANT_PERSON' ? 'items-end' : 'items-start'}">
              <div class="flex items-center gap-1.5 mb-1 px-1">
                <span class="text-[11px] font-semibold {msg.senderRole === 'PREGNANT_PERSON' ? 'text-[#809474]' : 'text-[#475842]'}">
                  {msg.senderRole === 'PREGNANT_PERSON' ? 'You' : connection.midwifeName ?? 'Midwife'}
                </span>
                <span class="text-[10px] text-[#8e9083]">· {formatTime(msg.createdAt)}</span>
              </div>
              <div class="max-w-md p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs {msg.senderRole === 'PREGNANT_PERSON' ? 'bg-[#809474] text-white rounded-tr-xs' : 'bg-[#faf9f6] border border-[#e7e4dc] text-[#2b2c28] rounded-tl-xs'}">
                {msg.content}
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <!-- Message Composer -->
      <form class="space-y-3 pt-4 border-t border-[#f0ede6]" onsubmit={sendChatMessage}>
        <div>
          <label for="midwife-msg-input" class="block text-xs font-semibold text-[#55574f] mb-1.5">
            Send a question or note for your next antenatal review
          </label>
          <textarea
            id="midwife-msg-input"
            bind:value={chatText}
            required
            rows="3"
            maxlength="500"
            placeholder="Ask about your symptoms, appointment dates, food concerns, or how you feel…"
            class="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-[#dedad0] bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#809474]/40 focus:bg-white placeholder-[#9a988f] resize-none"
          ></textarea>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <small class="text-xs text-[#8e9083]">
            Non-urgent clinical questions only. For emergency warning signs, call 112 immediately.
          </small>
          <button
            type="submit"
            disabled={sendingChat || !chatText.trim()}
            class="py-2.5 px-6 text-xs font-semibold rounded-xl bg-[#809474] text-white hover:bg-[#6c8060] disabled:opacity-50 transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2 shrink-0"
          >
            <i class="iconoir-arrow-right text-xs"></i>
            <span>{sendingChat ? "Sending…" : "Send to Midwife"}</span>
          </button>
        </div>
      </form>

      {#if chatSent}
        <div class="p-3 rounded-xl bg-[#edf5eb] border border-[#d6e5d2] text-xs font-medium text-[#385a38] flex items-center gap-2">
          <i class="iconoir-check-circle text-sm text-[#809474]"></i>
          <span>Message sent directly to your midwife's care team portal!</span>
        </div>
      {/if}
    </div>

  {:else}
    <!-- NOT YET CONNECTED FORM -->
    <div class="rounded-3xl bg-white border border-[#e7e4dc] p-6 sm:p-8 shadow-xs space-y-6">
      <div class="flex items-center gap-3 pb-4 border-b border-[#f0ede6]">
        <div class="w-10 h-10 rounded-xl bg-[#809474]/15 flex items-center justify-center text-xl text-[#475842]">
          <i class="iconoir-hospital"></i>
        </div>
        <div>
          <div class="text-[11px] font-bold tracking-widest text-[#9c998f] uppercase">YOUR CARE TEAM</div>
          <h2 class="font-serif text-xl sm:text-2xl font-semibold text-[#2b2c28] leading-snug">Connect with your midwife</h2>
        </div>
      </div>

      <p class="text-xs sm:text-sm text-[#72746b] leading-relaxed">
        Ask your midwife or health worker for their <strong class="text-[#2b2c28]">Sabi connection code</strong>.
        Enter it below to request a link to their care team account.
      </p>

      <form class="space-y-4 max-w-lg" onsubmit={connect}>
        <div>
          <label class="block text-xs font-semibold text-[#55574f] mb-1.5" for="care-code">
            Midwife connection code
          </label>
          <div class="flex gap-2">
            <input
              id="care-code"
              type="text"
              bind:value={code}
              required
              maxlength="8"
              placeholder="e.g. SABICRE"
              autocomplete="off"
              autocapitalize="characters"
              spellcheck="false"
              class="flex-1 px-4 py-3 text-sm font-mono font-bold uppercase tracking-widest rounded-xl border border-[#dedad0] bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#809474]/40 focus:bg-white"
            />
            <button
              class="py-3 px-6 text-xs sm:text-sm font-semibold rounded-xl bg-[#809474] text-white hover:bg-[#6c8060] disabled:opacity-50 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
              type="submit"
              disabled={busy || !code.trim()}
            >
              {busy ? "Sending…" : "Connect"}
            </button>
          </div>
          <small class="block mt-2 text-xs text-[#72746b]">
            Codes are 6–8 characters. For the demo, enter <strong class="font-mono text-[#2b2c28]">SABICRE</strong> to link with Demo Midwife.
          </small>
        </div>
      </form>

      {#if message}
        <div
          class="p-4 rounded-xl text-xs sm:text-sm font-medium flex items-start gap-2.5 {messageType === 'success' ? 'bg-[#edf5eb] border border-[#c6dfc0] text-[#385a38]' : 'bg-[#fdf4f0] border border-[#f4cfc4] text-[#9c2d15]'}"
          role="status"
        >
          <i class="{messageType === 'success' ? 'iconoir-check-circle text-[#809474]' : 'iconoir-warning-triangle text-[#af705a]'} text-base mt-0.5 shrink-0"></i>
          <span>{message}</span>
        </div>
      {/if}
    </div>
  {/if}
</div>
