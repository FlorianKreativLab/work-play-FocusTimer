// src/core/rewards.js
const STORAGE_KEY = "focus_rewards_v1";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { gems: 0, trees: {} };
    const data = JSON.parse(raw);
    return {
      gems: Number(data.gems) || 0,
      trees: typeof data.trees === "object" && data.trees ? data.trees : {},
    };
  } catch {
    return { gems: 0, trees: {} };
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("rewards:changed", { detail: state }));
}

const state = load();

export const rewards = {
  getGems() {
    return state.gems;
  },
  addGems(n = 1) {
    state.gems += Math.max(0, Number(n) || 0);
    save(state);
  },
  canSpendGems(n) {
    return state.gems >= (Number(n) || 0);
  },
  spendGems(n) {
    const cost = Math.max(0, Number(n) || 0);
    if (state.gems < cost) return false;
    state.gems -= cost;
    save(state);
    return true;
  },

  // Tree inventory
  getTreeCount(type) {
    return Number(state.trees[type] || 0);
  },
  addTree(type, amount = 1) {
    const a = Math.max(0, Number(amount) || 0);
    state.trees[type] = (Number(state.trees[type]) || 0) + a;
    save(state);
  },
  consumeTree(type, amount = 1) {
    const a = Math.max(0, Number(amount) || 0);
    const have = Number(state.trees[type] || 0);
    if (have < a) return false;
    state.trees[type] = have - a;
    save(state);
    return true;
  },

  // For UI
  getState() {
    return { gems: state.gems, trees: { ...state.trees } };
  },
};