<script lang="ts">
  import { onMount } from "svelte";
  import { sessionToken } from "#lib/auth/session.ts";
  type Item = {
    id: string;
    name: string;
    quantity?: string | null;
    checked: boolean;
  };
  const api = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
  let items = $state<Item[]>([]);
  let name = $state("");
  let quantity = $state("");
  async function load() {
    const r = await fetch(`${api}/records/groceries`, {
      headers: { Authorization: `Bearer ${sessionToken()}` },
    });
    if (r.ok) items = await r.json();
  }
  onMount(() => {
    void load();
  });
  async function add(event: SubmitEvent) {
    event.preventDefault();
    const r = await fetch(`${api}/records/groceries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken()}`,
      },
      body: JSON.stringify({ name, quantity }),
    });
    if (r.ok) {
      name = "";
      quantity = "";
      await load();
    }
  }
  async function toggle(item: Item) {
    await fetch(`${api}/records/groceries/${item.id}/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken()}`,
      },
      body: JSON.stringify({ checked: !item.checked }),
    });
    await load();
  }
</script>

<section class="mt-8 rounded-3xl bg-white border border-[#e7e4dc] p-6 sm:p-8 shadow-xs" aria-labelledby="grocery-title">
  <div class="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-[#f0ede6]">
    <div class="flex items-center gap-2.5">
      <div class="w-9 h-9 rounded-xl bg-[#809474]/15 flex items-center justify-center text-[#475842]">
        <i class="iconoir-cart text-lg"></i>
      </div>
      <div>
        <h4 id="grocery-title" class="font-serif text-lg font-semibold text-[#2b2c28]">Shopping List</h4>
        <span class="text-xs text-[#77786f]">Ingredients and provisions to stock</span>
      </div>
    </div>
    {#if items.length}
      <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f4f2ec] text-[#55574f]">
        {items.filter(i => !i.checked).length} items remaining
      </span>
    {/if}
  </div>

  <!-- Add Item Form -->
  <form class="flex flex-col sm:flex-row gap-3 mb-6" onsubmit={add}>
    <input
      bind:value={name}
      maxlength="160"
      required
      placeholder="e.g. Brown beans, Ugu leaves, Crayfish"
      class="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-[#dedad0] bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#809474]/40 focus:bg-white placeholder-[#9a988f]"
    />
    <input
      bind:value={quantity}
      maxlength="80"
      placeholder="Qty (e.g. 2 mudus, 1 bunch)"
      class="w-full sm:w-48 px-3.5 py-2.5 text-sm rounded-xl border border-[#dedad0] bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#809474]/40 focus:bg-white placeholder-[#9a988f]"
    />
    <button
      type="submit"
      class="py-2.5 px-5 text-sm font-semibold rounded-xl bg-[#809474] text-white hover:bg-[#6c8060] transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 shrink-0"
    >
      <i class="iconoir-plus text-sm"></i>
      <span>Add Item</span>
    </button>
  </form>

  <!-- Items Checkbox List -->
  {#if items.length}
    <div class="space-y-2 max-h-[360px] overflow-y-auto pr-1">
      {#each items as item (item.id)}
        <label
          class="flex items-center justify-between p-3 rounded-xl border border-[#eeece6] bg-[#faf9f6] hover:bg-[#f6f4ee] cursor-pointer transition-colors"
          class:opacity-60={item.checked}
          class:bg-[#f2efe9]={item.checked}
        >
          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              checked={item.checked}
              onchange={() => void toggle(item)}
              class="w-4 h-4 rounded text-[#809474] focus:ring-[#809474] cursor-pointer"
            />
            <span class="text-sm font-medium text-[#30312c]" class:line-through={item.checked}>
              {item.name}
            </span>
          </div>
          {#if item.quantity}
            <span class="text-xs px-2.5 py-0.5 rounded-md bg-white border border-[#e2ded5] text-[#77786f] font-medium">
              {item.quantity}
            </span>
          {/if}
        </label>
      {/each}
    </div>
  {:else}
    <div class="rounded-2xl border-2 border-dashed border-[#e2dfd5] p-6 text-center bg-[#faf9f6]">
      <p class="text-xs text-[#8e9083]">
        Your market list is empty. Add ingredients you need or generate directly from your meal plan above.
      </p>
    </div>
  {/if}
</section>
