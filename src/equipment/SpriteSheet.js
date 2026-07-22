"use strict";

(() => {
  const ns = window.PixelEquipment = window.PixelEquipment || {};

  class ImageAssetCache {
    constructor() {
      this.images = new Map();
      this.pending = new Map();
    }

    load(src) {
      if (this.images.has(src)) return Promise.resolve(this.images.get(src));
      if (this.pending.has(src)) return this.pending.get(src);
      const request = new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => {
          this.images.set(src, image);
          this.pending.delete(src);
          resolve(image);
        };
        image.onerror = () => {
          this.pending.delete(src);
          reject(new Error(`Unable to load sprite sheet: ${src}`));
        };
        image.src = src;
      });
      this.pending.set(src, request);
      return request;
    }
  }

  class SpriteSheet {
    constructor(config, assetCache) {
      if (!config?.id || !config?.src) throw new Error("SpriteSheet requires id and src");
      this.id = config.id;
      this.src = config.src;
      this.columns = Math.max(1, Number(config.columns) || 1);
      this.rows = Math.max(1, Number(config.rows) || 1);
      this.pixelScale = Math.max(1, Number(config.pixelScale) || 1);
      this.assetCache = assetCache;
      this.image = null;
    }

    async load() {
      this.image = await this.assetCache.load(this.src);
      return this;
    }

    get ready() {
      return Boolean(this.image?.complete && this.image.naturalWidth);
    }

    sourceRect(frame = {}) {
      if (!this.ready) return null;
      if (Array.isArray(frame.rect) && frame.rect.length === 4) {
        return {
          x: Math.round(frame.rect[0]), y: Math.round(frame.rect[1]),
          width: Math.round(frame.rect[2]), height: Math.round(frame.rect[3])
        };
      }
      const cellWidth = this.image.naturalWidth / this.columns;
      const cellHeight = this.image.naturalHeight / this.rows;
      const sub = frame.subRect || [0, 0, 1, 1];
      // Generated atlases are not always evenly divisible by their grid. Round
      // shared cell boundaries (rather than width and origin independently) so
      // adjacent frames can never overlap or sample a one-pixel seam.
      const x0 = Math.round(((Number(frame.col) || 0) + sub[0]) * cellWidth);
      const y0 = Math.round(((Number(frame.row) || 0) + sub[1]) * cellHeight);
      const x1 = Math.round(((Number(frame.col) || 0) + sub[0] + sub[2]) * cellWidth);
      const y1 = Math.round(((Number(frame.row) || 0) + sub[1] + sub[3]) * cellHeight);
      return {
        x: x0, y: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0)
      };
    }

    draw(ctx, frame, transform = {}) {
      const source = this.sourceRect(frame);
      if (!source) return false;
      const width = Math.max(1, Math.round(transform.width || source.width));
      const height = Math.max(1, Math.round(transform.height || source.height));
      const originX = Number.isFinite(transform.originX) ? transform.originX : .5;
      const originY = Number.isFinite(transform.originY) ? transform.originY : .5;
      const x = Math.round(transform.x || 0);
      const y = Math.round(transform.y || 0);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha *= transform.alpha ?? 1;
      ctx.filter = transform.filter || "none";
      ctx.translate(x, y);
      ctx.rotate(transform.rotation || 0);
      ctx.scale(transform.flipX ? -1 : 1, transform.flipY ? -1 : 1);
      ctx.drawImage(
        this.image, source.x, source.y, source.width, source.height,
        Math.round(-width * originX), Math.round(-height * originY), width, height
      );
      ctx.restore();
      return true;
    }
  }

  class SpriteSheetRegistry {
    constructor(configs = []) {
      this.assetCache = new ImageAssetCache();
      this.sheets = new Map();
      configs.forEach(config => this.register(config));
    }

    register(config) {
      const existing = this.sheets.get(config.id);
      if (existing) {
        if (existing.src !== config.src) throw new Error(`Conflicting sprite sheet id: ${config.id}`);
        return existing;
      }
      const sheet = new SpriteSheet(config, this.assetCache);
      this.sheets.set(sheet.id, sheet);
      return sheet;
    }

    get(id) {
      const sheet = this.sheets.get(id);
      if (!sheet) throw new Error(`Unknown sprite sheet: ${id}`);
      return sheet;
    }

    has(id) {
      return this.sheets.has(id);
    }

    async loadAll() {
      await Promise.all([...this.sheets.values()].map(sheet => sheet.load()));
      return this;
    }
  }

  ns.ImageAssetCache = ImageAssetCache;
  ns.SpriteSheet = SpriteSheet;
  ns.SpriteSheetRegistry = SpriteSheetRegistry;
})();
