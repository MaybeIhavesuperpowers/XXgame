"use strict";

(() => {
  const ns = window.PixelEquipment = window.PixelEquipment || {};
  const DIRECTIONS = ["up", "down", "left", "right"];

  class Character {
    constructor({ id, rig, x = 0, y = 0, direction = "down" }) {
      if (!id || !rig?.animations || !rig?.anchors) throw new Error("Character requires id and a valid rig");
      this.id = id;
      this.rig = rig;
      this.x = x;
      this.y = y;
      this.direction = DIRECTIONS.includes(direction) ? direction : "down";
      this.animation = rig.defaultAnimation || "idle";
      this.animationTime = 0;
      this.frameIndex = 0;
      this.equipment = new Map();
      this.pose = Object.create(null);
      this.visible = true;
      this.alpha = 1;
      this.filter = "none";
    }

    setPosition(x, y) {
      this.x = Math.round(x);
      this.y = Math.round(y);
      return this;
    }

    setDirection(direction) {
      if (DIRECTIONS.includes(direction)) this.direction = direction;
      return this;
    }

    setAnimation(name, { restart = false } = {}) {
      const next = this.rig.animations[name] ? name : this.rig.defaultAnimation || "idle";
      if (restart || next !== this.animation) {
        this.animation = next;
        this.animationTime = 0;
        this.frameIndex = 0;
      }
      return this;
    }

    update(deltaSeconds) {
      const animation = this.getAnimation();
      const frames = this.framesFor(animation, this.direction);
      if (!frames.length) return this;
      this.animationTime += Math.max(0, deltaSeconds || 0);
      const fps = Math.max(.01, Number(animation.fps) || 1);
      const rawFrame = Math.floor(this.animationTime * fps);
      this.frameIndex = animation.loop === false ? Math.min(frames.length - 1, rawFrame) : rawFrame % frames.length;
      return this;
    }

    getAnimation() {
      return this.rig.animations[this.animation] || this.rig.animations[this.rig.defaultAnimation] || this.rig.animations.idle;
    }

    framesFor(animation = this.getAnimation(), direction = this.direction) {
      return animation.directions?.[direction] || animation.directions?.down || animation.frames || [];
    }

    getBodyFrame() {
      const animation = this.getAnimation();
      const frames = this.framesFor(animation);
      return frames[this.frameIndex % Math.max(1, frames.length)] || null;
    }

    getAnchor(name) {
      const defaults = this.rig.anchors.default || {};
      const base = defaults[this.direction]?.[name] || defaults.down?.[name] || { x: 0, y: 0, rotation: 0 };
      const animationConfig = this.rig.anchors.animations?.[this.animation];
      const frames = animationConfig?.frames || [];
      const frame = frames[this.frameIndex % Math.max(1, frames.length)] || {};
      const allOverride = frame.all?.[name] || {};
      const directionOverride = frame[this.direction]?.[name] || {};
      return {
        x: Number(base.x || 0) + Number(allOverride.x || 0) + Number(directionOverride.x || 0),
        y: Number(base.y || 0) + Number(allOverride.y || 0) + Number(directionOverride.y || 0),
        rotation: Number(base.rotation || 0) + Number(allOverride.rotation || 0) + Number(directionOverride.rotation || 0),
        scaleX: Number(directionOverride.scaleX ?? allOverride.scaleX ?? base.scaleX ?? 1),
        scaleY: Number(directionOverride.scaleY ?? allOverride.scaleY ?? base.scaleY ?? 1)
      };
    }

    getWorldAnchor(name) {
      const anchor = this.getAnchor(name);
      return { ...anchor, x: Math.round(this.x + anchor.x), y: Math.round(this.y + anchor.y) };
    }

    equip(equipment) {
      if (!(equipment instanceof ns.Equipment)) throw new Error("Character.equip expects an Equipment instance");
      const previous = this.equipment.get(equipment.slot) || null;
      this.equipment.set(equipment.slot, equipment);
      return previous;
    }

    unequip(slot) {
      const previous = this.equipment.get(slot) || null;
      this.equipment.delete(slot);
      return previous;
    }

    clearEquipment() {
      this.equipment.clear();
      return this;
    }

    equipmentList() {
      return [...this.equipment.values()];
    }
  }

  ns.Character = Character;
  ns.CHARACTER_DIRECTIONS = Object.freeze([...DIRECTIONS]);
})();
