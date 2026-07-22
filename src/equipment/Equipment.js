"use strict";

(() => {
  const ns = window.PixelEquipment = window.PixelEquipment || {};
  const VALID_LAYERS = new Set(["body", "hair", "helmet", "armor", "weapon", "shield", "effect"]);

  const mergePart = (base, override) => ({
    ...base,
    ...override,
    source: { ...(base.source || {}), ...(override?.source || {}) },
    offset: { ...(base.offset || {}), ...(override?.offset || {}) },
    size: override?.size || base.size
  });

  class Equipment {
    constructor(config, instance = {}) {
      if (!config?.id) throw new Error("Equipment requires an id");
      if (!config.slot) throw new Error(`Equipment ${config.id} requires a slot`);
      if (!VALID_LAYERS.has(config.layer)) throw new Error(`Equipment ${config.id} has invalid layer ${config.layer}`);
      this.definition = config;
      this.id = instance.instanceId || config.id;
      this.definitionId = config.id;
      this.type = config.type || config.layer;
      this.slot = config.slot;
      this.layer = config.layer;
      this.tags = Object.freeze([...(config.tags || [])]);
      this.stats = Object.freeze({ ...(instance.stats || {}) });
      this.tint = instance.tint || null;
    }

    resolveParts(animation, direction) {
      const definition = this.definition;
      const animationOverride = definition.animations?.[animation] || definition.animations?.default || {};
      const directionOverride = definition.directions?.[direction] || {};
      const parts = definition.parts?.length ? definition.parts : [{
        sheet: definition.sheet || `equipment:${definition.id}`,
        source: definition.source || { col: 0, row: 0 },
        offset: definition.offset || { x: 0, y: 0 },
        size: definition.size || [32, 32],
        origin: definition.origin
      }];
      return parts.map(part => {
        const partDirection = part.directions?.[direction] || {};
        const partAnimation = part.animations?.[animation] || {};
        return mergePart(mergePart(mergePart(part, directionOverride), animationOverride), mergePart(partDirection, partAnimation));
      });
    }
  }

  class EquipmentCatalog {
    constructor(config = {}) {
      this.version = config.version || 1;
      this.definitions = new Map();
      (config.items || []).forEach(item => {
        if (this.definitions.has(item.id)) throw new Error(`Duplicate equipment id: ${item.id}`);
        this.definitions.set(item.id, Object.freeze(item));
      });
    }

    has(id) {
      return this.definitions.has(id);
    }

    getDefinition(id) {
      const definition = this.definitions.get(id);
      if (!definition) throw new Error(`Unknown equipment definition: ${id}`);
      return definition;
    }

    create(id, instance = {}) {
      return new Equipment(this.getDefinition(id), instance);
    }

    list(filter = {}) {
      return [...this.definitions.values()].filter(item =>
        (!filter.slot || item.slot === filter.slot) &&
        (!filter.layer || item.layer === filter.layer) &&
        (!filter.tag || item.tags?.includes(filter.tag))
      );
    }
  }

  ns.Equipment = Equipment;
  ns.EquipmentCatalog = EquipmentCatalog;
  ns.EQUIPMENT_LAYERS = Object.freeze([...VALID_LAYERS]);
})();
