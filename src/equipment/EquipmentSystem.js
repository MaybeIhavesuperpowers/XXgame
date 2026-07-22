"use strict";

(() => {
  const ns = window.PixelEquipment = window.PixelEquipment || {};

  class EquipmentSystem {
    constructor({ rig, catalog, registry, renderer }) {
      this.rig = rig;
      this.catalog = catalog;
      this.registry = registry;
      this.renderer = renderer;
    }

    static async fetchJson(url) {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`Unable to load ${url}: HTTP ${response.status}`);
      return response.json();
    }

    static validateConfig(rig, catalogConfig, registry) {
      const errors = [];
      const requiredAnimations = ["idle", "walk", "attack", "hurt"];
      const requiredDirections = ["up", "down", "left", "right"];
      const requiredAnchors = ["bodyAnchor", "headAnchor", "leftHandAnchor", "rightHandAnchor", "backAnchor"];
      requiredAnimations.forEach(name => {
        const animation = rig.animations?.[name];
        if (!animation) return errors.push(`Missing animation: ${name}`);
        requiredDirections.forEach(direction => {
          if (!animation.directions?.[direction]?.length) errors.push(`Animation ${name} is missing ${direction} frames`);
        });
      });
      requiredDirections.forEach(direction => requiredAnchors.forEach(anchor => {
        if (!rig.anchors?.default?.[direction]?.[anchor]) errors.push(`Missing ${direction}.${anchor}`);
      }));
      (catalogConfig.items || []).forEach(item => {
        const parts = item.parts?.length ? item.parts : [{ sheet: item.sheet || `equipment:${item.id}`, anchor: item.anchor }];
        parts.forEach((part, index) => {
        if (part.kind !== "aura" && !registry.has(part.sheet)) errors.push(`${item.id}.parts[${index}] references unknown sheet ${part.sheet}`);
        const anchor = part.anchor || item.anchor;
        if (anchor && !requiredDirections.some(direction => rig.anchors?.default?.[direction]?.[anchor])) {
          errors.push(`${item.id}.parts[${index}] references unknown anchor ${anchor}`);
        }
        });
      });
      if (errors.length) throw new Error(`Invalid equipment configuration:\n${errors.join("\n")}`);
    }

    static async load({ rigUrl, catalogUrl }) {
      const absoluteRigUrl = new URL(rigUrl, document.baseURI);
      const absoluteCatalogUrl = new URL(catalogUrl, document.baseURI);
      const [rig, catalogConfig] = await Promise.all([
        EquipmentSystem.fetchJson(absoluteRigUrl), EquipmentSystem.fetchJson(absoluteCatalogUrl)
      ]);
      const resolveSheets = (configs, baseUrl) => configs.map(config => ({ ...config, src: new URL(config.src, baseUrl).href }));
      const standaloneSheets = (catalogConfig.items || []).filter(item => !item.parts?.length && item.sprite).map(item => ({
        id: item.sheet || `equipment:${item.id}`, src: new URL(item.sprite, absoluteCatalogUrl).href,
        columns: item.spriteSheet?.columns || 1, rows: item.spriteSheet?.rows || 1
      }));
      const registry = new ns.SpriteSheetRegistry([
        ...resolveSheets(rig.spriteSheets || [], absoluteRigUrl),
        ...resolveSheets(catalogConfig.spriteSheets || [], absoluteCatalogUrl),
        ...standaloneSheets
      ]);
      EquipmentSystem.validateConfig(rig, catalogConfig, registry);
      await registry.loadAll();
      const catalog = new ns.EquipmentCatalog(catalogConfig);
      const renderer = new ns.LayeredCharacterRenderer({ registry, layerOrder: rig.layerOrder });
      return new EquipmentSystem({ rig, catalog, registry, renderer });
    }

    createCharacter(id, options = {}) {
      return new ns.Character({ id, rig: this.rig, ...options });
    }

    createEquipment(definitionId, instance = {}) {
      return this.catalog.create(definitionId, instance);
    }

    equip(character, definitionId, instance = {}) {
      const equipment = this.createEquipment(definitionId, instance);
      return { equipped: equipment, replaced: character.equip(equipment) };
    }
  }

  ns.EquipmentSystem = EquipmentSystem;
})();
