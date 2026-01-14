// src/ui/treeShopUI.js
import { TREE_TYPES, getAllTreeTypes } from "../world/trees.js";

const TREE_META = {
  [TREE_TYPES.MAPLE_RED]:   { name: "Ahorn (Rot)",    price: 1, desc: "Klassischer Mini-Ahorn" },
  [TREE_TYPES.GINKGO_GOLD]: { name: "Ginkgo (Gold)",  price: 2, desc: "Rund & leuchtend" },
  [TREE_TYPES.PINE_DARK]:   { name: "Kiefer (Dunkel)",price: 2, desc: "Layer-Nadelbaum" },
  [TREE_TYPES.CHERRY_PINK]: { name: "Kirschblüte",    price: 3, desc: "Fluffig & rosa" },
  [TREE_TYPES.BAMBOO]:      { name: "Bambus",         price: 3, desc: "Cluster aus Halmen" },
  [TREE_TYPES.DEAD_TREE]:   { name: "Toter Baum",     price: 1, desc: "Dürr & mystisch" },
};

function $(id) {
  return document.getElementById(id);
}

export function initTreeShopUI({ rewards, onStartPlacing }) {
  const modal = $("tree-shop");
  const grid = $("tree-shop-grid");
  const gemsEl = $("tree-shop-gems");
  const openBtn = $("open-tree-shop");
  const closeBtn = $("tree-shop-close");

  if (!modal || !grid || !gemsEl || !openBtn || !closeBtn) {
    console.warn("TreeShop UI: Elemente fehlen im DOM");
    return;
  }

  function open() {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    render();
  }

  function close() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  function render() {
    const { gems } = rewards.getState();
    gemsEl.textContent = String(gems);

    grid.innerHTML = "";

    const types = getAllTreeTypes();
    for (const type of types) {
      const meta = TREE_META[type] || { name: type, price: 1, desc: "" };
      const owned = rewards.getTreeCount(type);
      const canBuy = rewards.canSpendGems(meta.price);

      const card = document.createElement("div");
      card.className = "tree-card";

      card.innerHTML = `
        <div class="tree-card-title">
          <span>${meta.name}</span>
          <span>💎 ${meta.price}</span>
        </div>
        <div class="tree-card-meta">
          <span>${meta.desc}</span>
          <span>Besitz: <strong>${owned}</strong></span>
        </div>
        <div class="tree-card-actions">
          <button class="tree-btn" data-action="buy">Kaufen</button>
          <button class="tree-btn secondary" data-action="place">Platzieren</button>
        </div>
      `;

      const buyBtn = card.querySelector('[data-action="buy"]');
      const placeBtn = card.querySelector('[data-action="place"]');

      buyBtn.disabled = !canBuy;
      placeBtn.disabled = owned <= 0;

      buyBtn.addEventListener("click", () => {
        if (!rewards.spendGems(meta.price)) return;
        rewards.addTree(type, 1);
        render();
      });

      placeBtn.addEventListener("click", () => {
        if (rewards.getTreeCount(type) <= 0) return;
        // NICHT sofort konsumieren: erst wenn wirklich platziert wurde.
        onStartPlacing?.(type);
        close();
      });

      grid.appendChild(card);
    }
  }

  // Events
  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);

  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.dataset && t.dataset.close === "true") close();
  });

  window.addEventListener("rewards:changed", () => {
    if (modal.classList.contains("open")) render();
  });
}