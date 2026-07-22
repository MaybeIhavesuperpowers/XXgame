(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ForgeRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function createCraftPlan(region, biome, useCore = false, useRare = false) {
    if (!biome || !biome.primary || !biome.ore || !biome.rare || !biome.core) {
      throw new TypeError("Invalid biome forge configuration");
    }
    return {
      region,
      gold: 35 + region * 25,
      materials: {
        [biome.primary]: 6,
        [biome.ore]: 4,
        ...(useRare ? { [biome.rare]: 2 } : {}),
        ...(useCore ? { [biome.core]: 1 } : {})
      },
      keys: { primary: biome.primary, ore: biome.ore, rare: biome.rare, core: biome.core },
      useCore: Boolean(useCore),
      useRare: Boolean(useRare)
    };
  }

  function validateCraftPlan(plan, balances) {
    if ((balances.gold || 0) < plan.gold) return { ok: false, reason: "gold" };
    if ((balances.materials[plan.keys.primary] || 0) < 6 || (balances.materials[plan.keys.ore] || 0) < 4) {
      return { ok: false, reason: "base" };
    }
    if (plan.useRare && (balances.materials[plan.keys.rare] || 0) < 2) return { ok: false, reason: "rare" };
    if (plan.useCore && (balances.materials[plan.keys.core] || 0) < 1) return { ok: false, reason: "core" };
    return { ok: true, reason: null };
  }

  function applyCraftPlan(plan, balances) {
    const verdict = validateCraftPlan(plan, balances);
    if (!verdict.ok) return { ...verdict, gold: balances.gold, materials: { ...balances.materials } };
    const materials = { ...balances.materials };
    for (const [key, amount] of Object.entries(plan.materials)) materials[key] = (materials[key] || 0) - amount;
    return { ok: true, reason: null, gold: balances.gold - plan.gold, materials };
  }

  return Object.freeze({ createCraftPlan, validateCraftPlan, applyCraftPlan });
});
