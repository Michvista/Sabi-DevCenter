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

<section class="food-log planner" aria-labelledby="grocery-title">
  <div class="food-log-heading">
    <div>
      <span class="food-kicker">MARKET LIST</span>
      <h4 id="grocery-title">Grocery list</h4>
    </div>
  </div>
  <form class="planner-form grocery-form" onsubmit={add}>
    <label
      >Food<input
        bind:value={name}
        maxlength="160"
        required
        placeholder="e.g. beans"
      /></label
    ><label
      >Quantity<input
        bind:value={quantity}
        maxlength="80"
        placeholder="Optional"
      /></label
    ><button type="submit">Add item</button>
  </form>
  {#if items.length}<ul class="planner-list">
      {#each items as item (item.id)}<li>
          <label
            ><input
              type="checkbox"
              checked={item.checked}
              onchange={() => void toggle(item)}
            /><span class:done={item.checked}
              >{item.name}{item.quantity ? ` · ${item.quantity}` : ""}</span
            ></label
          >
        </li>{/each}
    </ul>{:else}<p class="food-log">
      Your list is private to your account. You can add items here or generate
      from your meal plan.
    </p>{/if}
</section>
