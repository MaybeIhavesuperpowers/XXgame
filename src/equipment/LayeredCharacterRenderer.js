"use strict";

(() => {
  const ns = window.PixelEquipment = window.PixelEquipment || {};
  const DEG_TO_RAD = Math.PI / 180;
  const DEFAULT_LAYER_ORDER = Object.freeze({
    shadow: -100, body: 0, hair: 10, armor: 20, shield: 25, helmet: 30, weapon: 40, effect: 50
  });

  const rotatePoint = (x, y, angle) => ({
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle)
  });

  class LayeredCharacterRenderer {
    constructor({ registry, layerOrder = {} }) {
      if (!(registry instanceof ns.SpriteSheetRegistry)) throw new Error("Renderer requires a SpriteSheetRegistry");
      this.registry = registry;
      this.layerOrder = { ...DEFAULT_LAYER_ORDER, ...layerOrder };
    }

    render(ctx, character) {
      if (!character?.visible) return;
      const commands = [];
      commands.push({ kind: "shadow", layer: "shadow", order: this.layerOrder.shadow });
      this.collectBody(commands, character);
      this.collectRigLayers(commands, character);
      character.equipmentList().forEach(equipment => this.collectEquipment(commands, character, equipment));
      commands.sort((a, b) => a.order - b.order || a.sequence - b.sequence);

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha *= character.alpha;
      ctx.filter = character.filter;
      commands.forEach(command => this.drawCommand(ctx, character, command));
      ctx.restore();
    }

    collectBody(commands, character) {
      const frame = character.getBodyFrame();
      if (!frame) return;
      commands.push({
        kind: "sprite", layer: "body", order: this.layerOrder.body,
        sequence: 0, sheet: frame.sheet, source: frame.source || frame,
        anchor: frame.anchor || "bodyAnchor", offset: frame.offset || { x: 0, y: 0 },
        size: frame.size || character.rig.renderSize, origin: frame.origin || { x: .5, y: .5 },
        rotation: Number(frame.rotation || 0) * DEG_TO_RAD, flipX: Boolean(frame.flipX)
      });
    }

    collectRigLayers(commands, character) {
      (character.rig.layers || []).filter(layer => layer.id !== "body" && layer.visible !== false).forEach((layer, index) => {
        const animationFrames = layer.animations?.[character.animation]?.[character.direction] || layer.frames?.[character.direction] || [];
        const frame = animationFrames[character.frameIndex % Math.max(1, animationFrames.length)] || layer.source;
        if (!frame || !layer.sheet) return;
        commands.push({
          kind: "sprite", layer: layer.layer || layer.id,
          order: this.orderFor(layer.layer || layer.id, character.direction, layer), sequence: 10 + index,
          sheet: layer.sheet, source: frame.source || frame, anchor: layer.anchor || "bodyAnchor",
          offset: layer.offset || { x: 0, y: 0 }, size: layer.size || character.rig.renderSize,
          origin: layer.origin || { x: .5, y: .5 }, rotation: Number(layer.rotation || 0) * DEG_TO_RAD,
          flipX: Boolean(layer.flipXByDirection?.[character.direction])
        });
      });
    }

    collectEquipment(commands, character, equipment) {
      equipment.resolveParts(character.animation, character.direction).forEach((part, index) => {
        const frames = part.frames?.[character.animation]?.[character.direction]
          || part.frames?.[character.animation]?.default
          || part.frames?.default?.[character.direction]
          || [];
        const frame = frames.length ? frames[character.frameIndex % frames.length] : null;
        const frameSource = frame ? (frame.source || frame) : null;
        const source = frame && typeof frameSource === "object"
          ? { ...(part.source || {}), ...frameSource }
          : frameSource || part.source;
        if (!source && part.kind !== "aura") return;
        const layer = part.layer || equipment.layer;
        const anchorName = part.anchor || equipment.definition.anchor || "bodyAnchor";
        const defaultOrigin = anchorName.includes("Hand") ? { x: .5, y: .78 }
          : anchorName.includes("Foot") ? { x: .5, y: .76 } : { x: .5, y: .5 };
        commands.push({
          kind: part.kind || "sprite", layer,
          order: this.orderFor(layer, character.direction, equipment.definition, part),
          sequence: 100 + index, sheet: frame?.sheet || part.sheet, source,
          anchor: anchorName,
          offset: part.offset || { x: 0, y: 0 }, offsetSpace: part.offsetSpace || "anchor",
          size: frame?.size || part.size || [32, 32], origin: frame?.origin || part.origin || defaultOrigin,
          rotation: Number(part.rotation ?? equipment.definition.rotation ?? 0) * DEG_TO_RAD,
          rotationMode: part.rotationMode || equipment.definition.rotationMode || "anchor",
          flipX: Boolean(part.flipXByDirection?.[character.direction]),
          alpha: frame?.alpha ?? part.alpha ?? 1, effect: frame?.effect || part.effect || null,
          filter: frame?.filter || part.filter || equipment.definition.filter || null
        });
      });
    }

    orderFor(layer, direction, ...configs) {
      let order = this.layerOrder[layer] ?? 0;
      configs.forEach(config => {
        order += Number(config?.zOffset || 0);
        order += Number(config?.zByDirection?.[direction] || 0);
      });
      return order;
    }

    drawCommand(ctx, character, command) {
      if (command.kind === "shadow") return this.drawShadow(ctx, character);
      const anchor = character.getWorldAnchor(command.anchor);
      let rotation = anchor.rotation + command.rotation;
      if (command.rotationMode === "aim") rotation = Number(character.pose.aimAngle || 0) + command.rotation;
      if (command.rotationMode === "weapon") rotation = Number(character.pose.weaponAngle ?? character.pose.aimAngle ?? 0) + command.rotation;
      const rawOffset = { x: Number(command.offset.x || 0), y: Number(command.offset.y || 0) };
      const offset = command.offsetSpace === "world" ? rawOffset : rotatePoint(rawOffset.x, rawOffset.y, rotation - command.rotation);
      const x = Math.round(anchor.x + offset.x);
      const y = Math.round(anchor.y + offset.y);
      if (command.kind === "aura") return this.drawEffect(ctx, { ...command, x, y, rotation });
      const sheet = this.registry.get(command.sheet);
      const filters = [character.filter, command.filter].filter(filter => filter && filter !== "none").join(" ") || "none";
      sheet.draw(ctx, command.source, {
        x, y, width: command.size[0], height: command.size[1],
        originX: command.origin.x, originY: command.origin.y, rotation,
        flipX: command.flipX, alpha: command.alpha, filter: filters
      });
    }

    drawShadow(ctx, character) {
      const shadow = character.rig.shadow || { width: 38, height: 11, y: 12, alpha: .28 };
      ctx.save();
      ctx.globalAlpha *= shadow.alpha ?? .28;
      ctx.fillStyle = shadow.color || "#050609";
      ctx.beginPath();
      ctx.ellipse(Math.round(character.x), Math.round(character.y + shadow.y), Math.round(shadow.width / 2), Math.round(shadow.height / 2), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawEffect(ctx, command) {
      const effect = command.effect || {};
      const radius = Math.max(2, Math.round(effect.radius || command.size?.[0] / 2 || 24));
      ctx.save();
      ctx.globalAlpha *= command.alpha ?? effect.alpha ?? .35;
      ctx.strokeStyle = effect.color || "#d38dff";
      ctx.lineWidth = Math.max(1, Math.round(effect.lineWidth || 2));
      ctx.beginPath();
      ctx.arc(command.x, command.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    getWorldAnchor(character, name) {
      return character.getWorldAnchor(name);
    }
  }

  ns.LayeredCharacterRenderer = LayeredCharacterRenderer;
  ns.DEFAULT_LAYER_ORDER = DEFAULT_LAYER_ORDER;
})();
