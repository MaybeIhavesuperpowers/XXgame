"use strict";

(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const minimap = document.getElementById("minimap");
  const mctx = minimap.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  mctx.imageSmoothingEnabled = false;

  const W = canvas.width;
  const H = canvas.height;
  const TILE = 32;
  const SAVE_KEY = "pixel-era-five-realms-v1";
  const BACKUP_SAVE_KEY = `${SAVE_KEY}-backup`;
  const SLOT_SAVE_KEYS = [1,2,3].map(i => `${SAVE_KEY}-slot-${i}`);
  const SAVE_FORMAT = 3;
  const SLOT_NAMES = { weapon: "武器", helmet: "头盔", armor: "铠甲", boots: "靴子", amulet: "饰品" };
  const WEAPON_TYPES = ["sword", "spear", "axe", "staff", "daggers"];
  const WEAPON_NAMES = { sword: "长剑", spear: "长枪", axe: "战斧", staff: "星杖", daggers: "双刃" };
  const WEAPON_PROFILES = {
    sword: { damage: 1, speed: 1, reach: 42, width: 30, knock: 115, label: "均衡三连斩" },
    spear: { damage: .92, speed: 1.08, reach: 72, width: 18, knock: 145, label: "贯穿突刺" },
    axe: { damage: 1.42, speed: .7, reach: 53, width: 46, knock: 250, label: "裂地重劈" },
    staff: { damage: 1.08, speed: .82, reach: 160, width: 18, knock: 70, label: "星芒飞弹" },
    daggers: { damage: .68, speed: 1.65, reach: 34, width: 24, knock: 65, label: "疾影连刺" }
  };

  const MUSIC_THEMES = {
    title: { tempo: 70, wave: "triangle", lead: [45,48,52,55,52,48,43,40], bass: [33,33,36,31], color: .19 },
    camp: { tempo: 82, wave: "sine", lead: [52,55,59,64,59,55,52,59], bass: [40,43,36,40], color: .14 },
    forest: { tempo: 92, wave: "triangle", lead: [57,60,64,62,57,55,52,55], bass: [45,41,43,40], color: .2 },
    waste: { tempo: 112, wave: "sawtooth", lead: [45,45,48,50,45,53,50,48], bass: [33,31,29,33], color: .17 },
    tundra: { tempo: 76, wave: "sine", lead: [64,67,71,69,64,62,59,62], bass: [40,43,38,35], color: .2 },
    peaks: { tempo: 124, wave: "square", lead: [57,64,60,67,62,69,64,60], bass: [33,40,36,38], color: .13 },
    abyss: { tempo: 64, wave: "sawtooth", lead: [45,46,52,51,45,41,40,46], bass: [28,29,33,27], color: .12 }
  };

  const SPRITE_PATHS = {
    hero: "assets/sprites/hero-atlas.png", forest: "assets/sprites/forest-atlas.png",
    waste: "assets/sprites/waste-atlas.png", tundra: "assets/sprites/tundra-atlas.png",
    peaks: "assets/sprites/peaks-atlas.png", abyss: "assets/sprites/abyss-atlas.png",
    equipment: "assets/sprites/equipment-atlas.png", materials: "assets/sprites/materials-atlas.png", effects: "assets/sprites/effects-atlas.png",
    terrain: "assets/sprites/terrain-atlas.png", heroDirectional: "assets/sprites/hero-directional-atlas.png?v=2",
    heroRun: "assets/sprites/hero-run-atlas-v2.png?v=3", equipmentLayers: "assets/sprites/hero-equipment-layers-v2.png?v=3",
    eliteLoot: "assets/sprites/elite-loot-atlas.png?v=2", monsterEffects: "assets/sprites/monster-effects-atlas.png?v=2",
    treantRoots: "assets/sprites/treant-root-vfx-v2.png?v=3", swordWave: "assets/sprites/sword-wave-v2.png?v=3"
  };
  const ART = {};
  Object.entries(SPRITE_PATHS).forEach(([key, src]) => { const img = new Image(); img.src = src; ART[key] = img; });

  const ENEMY_ATTACKS = [
    [
      { id: "slimeLeap", name: "弹跳扑击", range: 165, windup: .48, cooldown: 1.7 },
      { id: "poisonSpore", name: "剧毒孢子", range: 260, windup: .62, cooldown: 2.2 },
      { id: "rootLine", name: "根须穿刺", range: 235, windup: .72, cooldown: 2.4 },
      { id: "boarCharge", name: "狂暴冲锋", range: 255, windup: .58, cooldown: 2.25 }
    ],
    [
      { id: "fireSpit", name: "火舌弹", range: 290, windup: .52, cooldown: 1.9 },
      { id: "tailSting", name: "蝎尾毒刺", range: 72, windup: .42, cooldown: 1.45 },
      { id: "golemSlam", name: "熔岩震地", range: 88, windup: .8, cooldown: 2.6 },
      { id: "throwKnife", name: "灼热飞刃", range: 285, windup: .45, cooldown: 1.65 }
    ],
    [
      { id: "batDive", name: "霜翼俯冲", range: 235, windup: .4, cooldown: 1.6 },
      { id: "snowball", name: "巨型雪球", range: 270, windup: .7, cooldown: 2.3 },
      { id: "wolfPounce", name: "寒牙扑袭", range: 210, windup: .38, cooldown: 1.55 },
      { id: "frostVolley", name: "三重冰晶", range: 315, windup: .65, cooldown: 2.15 }
    ],
    [
      { id: "chainBolt", name: "连锁雷球", range: 320, windup: .5, cooldown: 1.8 },
      { id: "lightningMark", name: "引雷标记", range: 290, windup: .65, cooldown: 2.35 },
      { id: "gustCone", name: "裂空风压", range: 155, windup: .55, cooldown: 2 },
      { id: "featherVolley", name: "雷羽齐射", range: 310, windup: .58, cooldown: 2.1 }
    ],
    [
      { id: "voidBolt", name: "虚空余烬", range: 310, windup: .48, cooldown: 1.75 },
      { id: "bladeWave", name: "暗界剑波", range: 245, windup: .6, cooldown: 2 },
      { id: "charmOrb", name: "魅惑魔弹", range: 300, windup: .72, cooldown: 2.45 },
      { id: "eyeBeam", name: "混沌凝视", range: 360, windup: .9, cooldown: 2.7 }
    ]
  ];

  const QUALITIES = [
    { id: "white", name: "粗糙", color: "#d5d5d5", multiplier: 1, affixes: 0 },
    { id: "green", name: "普通", color: "#65d47b", multiplier: 1.12, affixes: 1 },
    { id: "blue", name: "稀有", color: "#58b7ff", multiplier: 1.3, affixes: 2 },
    { id: "purple", name: "史诗", color: "#b16bff", multiplier: 1.58, affixes: 3 },
    { id: "gold", name: "传说", color: "#ffd05a", multiplier: 2.05, affixes: 3 }
  ];

  const BIOMES = [
    {
      id: "forest", name: "迷雾之森", subtitle: "根须在雾中低语", mechanic: "浓雾限制视野，靠近才会显形",
      color: "#4d9a5c", accent: "#9ee889", floor: "#263c2c", floor2: "#304934", wall: "#14261d",
      primary: "fluorescent_wood", ore: "rough_copper", rare: "venom_gland", primaryName: "荧光木", oreName: "粗糙铜矿", rareName: "毒孢腺体",
      monsters: [
        ["绿史莱姆", "#62c76b", 58, 34, 7], ["剧毒蘑菇", "#c768d6", 46, 42, 9],
        ["树精", "#8a7045", 38, 64, 11], ["狂暴野猪", "#9d6048", 78, 54, 12]
      ],
      boss: ["巨木守卫", "#8bc36b", 48, 760, 18], core: "verdant_core"
    },
    {
      id: "waste", name: "灼热废土", subtitle: "焚风卷过赤色荒原", mechanic: "岩浆池持续灼烧，保持移动",
      color: "#c45b37", accent: "#ffb55f", floor: "#4a2d27", floor2: "#59342a", wall: "#27181c",
      primary: "ember_sand", ore: "red_iron", rare: "ember_scale", primaryName: "焰心沙", oreName: "赤铁矿", rareName: "炽焰鳞片",
      monsters: [
        ["火焰蜥蜴", "#e86d3b", 72, 66, 13], ["沙丘蝎", "#d59d4b", 61, 74, 15],
        ["熔岩石人", "#9e4532", 38, 106, 18], ["废土强盗", "#c27c5a", 72, 82, 17]
      ],
      boss: ["焚天骨龙", "#f57a43", 58, 1250, 27], core: "flame_core"
    },
    {
      id: "tundra", name: "极寒冰原", subtitle: "永冻之地没有回声", mechanic: "冰面带有惯性，转向与急停更困难",
      color: "#58a9c7", accent: "#c1f3ff", floor: "#385767", floor2: "#426b7b", wall: "#1d3443",
      primary: "frost_crystal", ore: "mithril", rare: "frost_heart", primaryName: "极寒冰晶", oreName: "秘银矿", rareName: "冰魄",
      monsters: [
        ["冰霜蝙蝠", "#9ee7f2", 92, 80, 18], ["雪山雪人", "#d9edf0", 45, 135, 22],
        ["冰原狼", "#80a7c8", 88, 106, 23], ["游荡冰灵", "#7bd8ef", 64, 96, 25]
      ],
      boss: ["极地冰女", "#b8efff", 66, 1880, 35], core: "frost_core"
    },
    {
      id: "peaks", name: "雷鸣群峰", subtitle: "天穹在群峰间碎裂", mechanic: "随机落雷会标记当前位置，及时闪避",
      color: "#7658bb", accent: "#d4b4ff", floor: "#34304e", floor2: "#44375d", wall: "#1d1a30",
      primary: "thunder_stone", ore: "adamantite", rare: "storm_feather", primaryName: "引雷石", oreName: "精金矿", rareName: "雷羽",
      monsters: [
        ["雷暴鸟", "#baa2f0", 104, 112, 26], ["落雷石像", "#8675aa", 42, 176, 32],
        ["狂风元素", "#8dcdeb", 81, 130, 30], ["鹰身女妖", "#b07cc8", 90, 142, 34]
      ],
      boss: ["雷霆领主", "#c6a0ff", 88, 2650, 43], core: "thunder_core"
    },
    {
      id: "abyss", name: "深渊魔域", subtitle: "光明止步于此", mechanic: "点燃祭坛扩展视野，黑暗中敌人更危险",
      color: "#843e76", accent: "#ff82dc", floor: "#251c31", floor2: "#33203e", wall: "#100d1c",
      primary: "void_fragment", ore: "abyss_stone", rare: "chaos_eye", primaryName: "虚空碎片", oreName: "深渊魔石", rareName: "混沌眼核",
      monsters: [
        ["暗影小鬼", "#c44f9c", 108, 142, 34], ["虚空骑士", "#70538c", 50, 224, 45],
        ["魅魔", "#d96d9e", 83, 176, 42], ["混沌眼球", "#d94d68", 60, 196, 49]
      ],
      boss: ["混沌魔王", "#e04ba7", 72, 3900, 58], core: "chaos_core"
    }
  ];

  const MATERIAL_NAMES = {
    fluorescent_wood: "荧光木", rough_copper: "粗糙铜矿", verdant_core: "巨木核心",
    ember_sand: "焰心沙", red_iron: "赤铁矿", flame_core: "焚炎核心",
    frost_crystal: "极寒冰晶", mithril: "秘银矿", frost_core: "极寒核心",
    thunder_stone: "引雷石", adamantite: "精金矿", thunder_core: "雷霆核心",
    void_fragment: "虚空碎片", abyss_stone: "深渊魔石", chaos_core: "混沌核心",
    venom_gland: "毒孢腺体", ember_scale: "炽焰鳞片", frost_heart: "冰魄", storm_feather: "雷羽", chaos_eye: "混沌眼核"
  };

  const BASIC_AFFIXES = [
    ["critRate", "暴击率", .015, .045, "%"], ["critDamage", "暴击伤害", .08, .22, "%"],
    ["attackSpeed", "攻击速度", .035, .10, "%"], ["maxHp", "最大生命", 12, 52, ""],
    ["dodge", "闪避率", .01, .035, "%"], ["reduction", "伤害减免", .015, .05, "%"],
    ["moveSpeed", "移动速度", .025, .08, "%"], ["lifeSteal", "生命偷取", .01, .045, "%"]
  ];

  const SPECIAL_AFFIXES = [
    ["elementalDamage", "元素增伤", .04, .14, "%"], ["burnChance", "灼烧触发", .03, .12, "%"],
    ["poisonChance", "剧毒触发", .03, .12, "%"], ["frostChance", "霜冻触发", .03, .12, "%"],
    ["stunChance", "麻痹触发", .02, .08, "%"], ["executeDamage", "斩杀增伤", .05, .15, "%"],
    ["eliteDamage", "精英增伤", .06, .18, "%"], ["projectilePower", "弹体威力", .08, .25, "%"],
    ["rareFind", "稀有寻获", .05, .20, "%"]
  ];
  const AFFIXES = [...BASIC_AFFIXES, ...SPECIAL_AFFIXES];

  const LEGENDARIES = [
    ["bloodblade", "嗜血之刃", "每次攻击命中额外恢复伤害 5% 的生命值"],
    ["thunderarmor", "雷霆铠甲", "受击时有 20% 概率反击周围敌人"],
    ["starstep", "星界足迹", "闪避结束时对附近敌人造成攻击力 80% 伤害"],
    ["voidheart", "虚空之心", "生命低于 30% 时造成伤害提高 25%"]
  ];

  const SKILL_BRANCHES = [
    {
      id: "fury", name: "狂暴 · 武技", color: "#ef6757", nodes: [
        ["blade", "锋刃", "基础攻击力 +5% / 10% / 15%", 0, 3],
        ["weakness", "弱点洞悉", "暴击率 +5% / 10% / 15%", 3, 3],
        ["finisher", "终结一击", "第三段连招伤害与击退翻倍", 8, 1]
      ]
    },
    {
      id: "survival", name: "生存 · 体魄", color: "#65cf86", nodes: [
        ["toughness", "强韧", "最大生命 +10% / 20% / 30%", 0, 3],
        ["agility", "轻灵", "闪避耐力消耗 -10% / 20% / 30%", 3, 3],
        ["renewal", "复苏之风", "生命低于 20% 时持续恢复", 8, 1]
      ]
    },
    {
      id: "explore", name: "探索 · 寻宝", color: "#5eb9e9", nodes: [
        ["haste", "极速", "移动速度 +5% / 10% / 15%", 0, 3],
        ["miner", "矿脉感知", "资源开采量 +20% / 40% / 60%", 3, 3],
        ["alchemy", "点石成金", "高品质装备掉率永久提高", 8, 1]
      ]
    }
  ];

  class RNG {
    constructor(seed) {
      let h = 2166136261;
      for (let i = 0; i < String(seed).length; i++) {
        h ^= String(seed).charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      this.s = h >>> 0;
    }
    next() {
      this.s += 0x6D2B79F5;
      let t = this.s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    int(a, b) { return Math.floor(this.next() * (b - a + 1)) + a; }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  }

  const freshSave = () => ({
    version: "1.0.0", playtime: 0,
    player: { level: 1, xp: 0, hp: 120, stamina: 100, skillPoints: 0, potions: 3 },
    skills: { fury: { blade: 0, weakness: 0, finisher: 0 }, survival: { toughness: 0, agility: 0, renewal: 0 }, explore: { haste: 0, miner: 0, alchemy: 0 } },
    equipment: { equipped: { weapon: null, helmet: null, armor: null, boots: null, amulet: null }, inventory: [] },
    materials: Object.fromEntries(Object.keys(MATERIAL_NAMES).map(k => [k, 0])),
    currencies: { gold: 120, void: 0 },
    progress: { unlocked: [0], completedDepths: [0, 0, 0, 0, 0], bossKills: [0, 0, 0, 0, 0] },
    settings: { sound: true }
  });

  const game = {
    save: freshSave(), scene: "title", paused: true, world: null, biome: 0, depth: 1,
    keys: new Set(), mouse: { x: W / 2, y: H / 2 }, camera: { x: 0, y: 0 },
    player: { x: 0, y: 0, vx: 0, vy: 0, dirX: 1, dirY: 0, aimAngle: 0, radius: 12, invuln: 0, dash: 0, attackCd: 0, combo: 0, comboUntil: 0, swing: null, running: false, runKey: null, runUntil: 0, lastTap: {}, recoveryPose: 0, activeCd1: 0, activeCd2: 0 },
    enemies: [], particles: [], numbers: [], telegraphs: [], projectiles: [], impacts: [], resources: [], altars: [], groundDrops: [],
    screenShake: 0, hitStop: 0, lastTime: 0, autosave: 0, zoneTime: 0, hazardTimer: 2.5, unseenItems: 0,
    forgeTab: "craft", selectedForge: null, runLoot: { gold: 0, materials: 0, kills: 0 },
    audio: null
  };

  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const lerp = (a, b, t) => a + (b - a) * t;
  const fmt = n => Math.round(n).toLocaleString("zh-CN");
  const qualityById = id => QUALITIES.find(q => q.id === id) || QUALITIES[0];
  const branchPoints = id => Object.values(game.save.skills[id]).reduce((a, b) => a + b, 0);
  const isModalOpen = () => [...document.querySelectorAll(".modal")].some(x => !x.classList.contains("hidden"));

  function statValue(name) {
    let v = 0;
    Object.values(game.save.equipment.equipped).filter(Boolean).forEach(item => {
      if (item.main.type === name) v += itemMainValue(item);
      item.affixes.forEach(a => { if (a.type === name) v += a.value; });
    });
    return v;
  }

  function stats() {
    const s = game.save.skills;
    const levelScale = Math.pow(1.02, game.save.player.level - 1);
    const attack = (14 * levelScale + statValue("attack")) * (1 + s.fury.blade * .05);
    const maxHp = (120 * levelScale + statValue("maxHp")) * (1 + s.survival.toughness * .1);
    return {
      attack, maxHp, defense: statValue("defense"),
      critRate: .05 + statValue("critRate") + s.fury.weakness * .05,
      critDamage: 1.5 + statValue("critDamage"), attackSpeed: 1 + statValue("attackSpeed"),
      dodge: statValue("dodge"), reduction: clamp(statValue("reduction"), 0, .65),
      moveSpeed: 124 * (1 + statValue("moveSpeed") + s.explore.haste * .05),
      lifeSteal: statValue("lifeSteal")
    };
  }

  function xpNeeded(level = game.save.player.level) { return Math.round(100 * Math.pow(level, 1.5)); }

  function weaponTypeOf(item) {
    if (!item || item.slot !== "weapon") return "sword";
    if (WEAPON_TYPES.includes(item.weaponType)) return item.weaponType;
    const name = item.name || "";
    if (/枪|矛/.test(name)) return "spear";
    if (/斧/.test(name)) return "axe";
    if (/杖|法/.test(name)) return "staff";
    if (/匕|双刃/.test(name)) return "daggers";
    return "sword";
  }

  function equippedWeaponType() { return weaponTypeOf(game.save.equipment.equipped.weapon); }

  function equipmentCoords(item) {
    const row = { weapon: 0, helmet: 1, armor: 2, boots: 3, amulet: 4 }[item?.slot] ?? 0;
    const col = item?.slot === "weapon" ? WEAPON_TYPES.indexOf(weaponTypeOf(item)) : clamp(item?.region ?? 0, 0, 4);
    return { col: Math.max(0, col), row };
  }

  function materialCoords(key) {
    const biome = Math.max(0, BIOMES.findIndex(b => [b.primary, b.ore, b.rare, b.core].includes(key)));
    const b = BIOMES[biome];
    return { col: biome, row: key === b.primary ? 0 : key === b.ore ? 1 : key === b.rare ? 2 : 3 };
  }

  function itemArtHTML(item, className = "item-art") {
    const { col, row } = equipmentCoords(item);
    return `<span class="${className}" style="--art-col:${col};--art-row:${row}" aria-hidden="true"></span>`;
  }

  function materialArtHTML(key, className = "material-art") {
    const { col, row } = materialCoords(key);
    return `<span class="${className}" style="--art-col:${col};--art-row:${row}" aria-hidden="true"></span>`;
  }

  function normalizeSave(raw) {
    const base = freshSave();
    if (!raw || typeof raw !== "object") return base;
    const merged = { ...base, ...raw };
    merged.player = { ...base.player, ...(raw.player || {}) };
    merged.currencies = { ...base.currencies, ...(raw.currencies || {}) };
    merged.materials = { ...base.materials, ...(raw.materials || {}) };
    merged.progress = { ...base.progress, ...(raw.progress || {}) };
    merged.equipment = { ...base.equipment, ...(raw.equipment || {}) };
    merged.equipment.equipped = { ...base.equipment.equipped, ...((raw.equipment || {}).equipped || {}) };
    [...Object.values(merged.equipment.equipped), ...(merged.equipment.inventory || [])].filter(Boolean).forEach(item => {
      item.region = clamp(item.region ?? 0, 0, 4);
      item.affixes ||= [];
      if (item.slot === "weapon") item.weaponType = weaponTypeOf(item);
    });
    merged.skills = base.skills;
    for (const branch of Object.keys(base.skills)) merged.skills[branch] = { ...base.skills[branch], ...((raw.skills || {})[branch] || {}) };
    return merged;
  }

  function hashString(text) { let h = 2166136261; for (let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);} return (h>>>0).toString(36); }

  function snapshotSession() {
    if (game.scene !== "expedition" || !game.world || game.save.player.hp <= 0) return { scene: "camp" };
    return {
      scene: "expedition", biome: game.biome, depth: game.depth, runLoot: game.runLoot,
      player: { x:game.player.x, y:game.player.y, dirX:game.player.dirX, dirY:game.player.dirY },
      world: { seed:game.world.seed, exitLocked:game.world.exitLocked, revealed:[...game.world.revealed] },
      enemies: game.enemies.filter(e=>!e.dead).map(e=>({name:e.name,color:e.color,speed:e.speed,hp:e.hp,maxHp:e.maxHp,damage:e.damage,typeIndex:e.typeIndex,elite:e.elite,x:e.x,y:e.y,homeX:e.homeX,homeY:e.homeY,radius:e.radius,boss:e.boss,attackCd:e.attackCd,specialCd:e.specialCd,phase:e.phase,pattern:e.pattern,statuses:e.statuses})),
      resources: game.resources.map(r=>({...r})), altars: game.altars.map(a=>({...a})), groundDrops:game.groundDrops.map(d=>({...d}))
    };
  }

  function encodeSave() {
    const data = { version:SAVE_FORMAT, savedAt:Date.now(), save:game.save, session:snapshotSession() };
    return JSON.stringify({ ...data, hash:hashString(JSON.stringify(data)) });
  }

  function decodeSave(raw, source = "main") {
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.save) {
      const { hash, ...data } = parsed;
      if (hash && hash !== hashString(JSON.stringify(data))) throw new Error("checksum");
      return { save:normalizeSave(parsed.save), session:parsed.session || {scene:"camp"}, savedAt:parsed.savedAt || 0, source };
    }
    return { save:normalizeSave(parsed), session:{scene:"camp"}, savedAt:0, source, migrated:true };
  }

  function readSavedGame() {
    try { const main=decodeSave(localStorage.getItem(SAVE_KEY),"main"); if(main)return main; } catch { /* try backup */ }
    try { const backup=decodeSave(localStorage.getItem(BACKUP_SAVE_KEY),"backup"); if(backup)return backup; } catch { /* no valid save */ }
    return null;
  }

  function readSaveKey(key, source) {
    try { return decodeSave(localStorage.getItem(key), source); } catch { return null; }
  }

  function saveGame(silent = false) {
    try {
      const current=localStorage.getItem(SAVE_KEY);if(current){try{decodeSave(current);localStorage.setItem(BACKUP_SAVE_KEY,current);}catch{/* never replace a good backup with corrupt data */}}
      localStorage.setItem(SAVE_KEY,encodeSave());
      const state=$("save-state");if(state){state.textContent="已保存";state.classList.add("saved");setTimeout(()=>state.classList.remove("saved"),900);}
      if (!silent) { toast("星火已保存当前位置（F5 / Ctrl+S）"); playSfx("save"); }
      updateTitleSaveMeta();
      return true;
    } catch (err) {
      if (!silent) toast("存档失败：浏览器阻止了本地存储", "#ef6b6b");
      return false;
    }
  }

  function saveGameToSlot(index) {
    if (game.scene === "title") return;
    const key=SLOT_SAVE_KEYS[index];if(!key)return;
    try { localStorage.setItem(key,encodeSave());toast(`已写入手动存档 ${index+1}`,"#9de7ff");playSfx("save");renderSavePanel();updateTitleSaveMeta(); }
    catch { toast("手动存档失败：浏览器存储不可用","#ef6b6b"); }
  }

  function toast(text, color = "#e8d7b0") {
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = text;
    node.style.color = color;
    $("toast-stack").append(node);
    setTimeout(() => node.remove(), 2600);
  }

  const midiFreq = note => 440 * Math.pow(2,(note-69)/12);

  function ensureAudio() {
    if (!game.save.settings.sound) return null;
    try {
      if (!game.audio?.ctx) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)(), master=ctx.createGain(),music=ctx.createGain(),sfx=ctx.createGain();
        master.gain.value=.72;music.gain.value=.34;sfx.gain.value=.78;music.connect(master);sfx.connect(master);master.connect(ctx.destination);
        game.audio={ctx,master,music,sfx,musicTimer:null,theme:null,step:0};
      }
      if(game.audio.ctx.state==="suspended")game.audio.ctx.resume();
      if(game.musicTheme&&game.audio.theme!==game.musicTheme)startMusic(game.musicTheme);
      return game.audio;
    } catch { return null; }
  }

  function synthTone(freq,duration=.12,wave="square",gain=.035,when=null,channel="sfx",slide=0) {
    const a=game.audio?.ctx?game.audio:ensureAudio();if(!a)return;const t=when??a.ctx.currentTime,osc=a.ctx.createOscillator(),g=a.ctx.createGain();osc.type=wave;osc.frequency.setValueAtTime(Math.max(30,freq),t);if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(30,freq*slide),t+duration);g.gain.setValueAtTime(Math.max(.0001,gain),t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(g);g.connect(a[channel]);osc.start(t);osc.stop(t+duration+.02);
  }

  function noiseBurst(duration=.08,gain=.018,channel="sfx") {
    const a=game.audio?.ctx?game.audio:ensureAudio();if(!a)return;const length=Math.max(1,Math.floor(a.ctx.sampleRate*duration)),buffer=a.ctx.createBuffer(1,length,a.ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);const src=a.ctx.createBufferSource(),g=a.ctx.createGain();src.buffer=buffer;g.gain.value=gain;src.connect(g);g.connect(a[channel]);src.start();
  }

  function musicAccent(name,step,now,beat){if(step%8!==4)return;if(name==="title")synthTone(midiFreq(76),beat*2,"sine",.012,now,"music",1.5);else if(name==="camp")synthTone(midiFreq(71),beat*1.7,"triangle",.013,now,"music",.75);else if(name==="forest")synthTone(midiFreq(82+(step%3)),beat*.45,"sine",.01,now,"music",1.3);else if(name==="waste"){noiseBurst(.11,.009,"music");synthTone(68,beat*.7,"square",.014,now,"music",.62);}else if(name==="tundra")synthTone(midiFreq(88),beat*2.2,"sine",.014,now,"music",.5);else if(name==="peaks"){noiseBurst(.06,.014,"music");synthTone(1380,beat*.3,"square",.009,now,"music",.28);}else if(name==="abyss"){synthTone(52,beat*3,"sawtooth",.012,now,"music",.72);synthTone(55,beat*3,"sine",.009,now,"music",.68);}}

  function startMusic(name) {
    game.musicTheme=name;const a=game.audio?.ctx?game.audio:null;if(!a)return;if(a.musicTimer)clearTimeout(a.musicTimer);a.theme=name;a.step=0;
    const tick=()=>{if(!game.audio||game.audio.theme!==name)return;const theme=MUSIC_THEMES[name],beat=60/theme.tempo/2,step=a.step++,now=a.ctx.currentTime+.02,lead=theme.lead[step%theme.lead.length],bass=theme.bass[Math.floor(step/2)%theme.bass.length];synthTone(midiFreq(lead),beat*.82,theme.wave,.022*theme.color/0.2,now,"music");if(step%2===0)synthTone(midiFreq(bass),beat*1.7,name==="abyss"?"sawtooth":"triangle",.017,now,"music");if(step%4===2&&["waste","peaks"].includes(name))noiseBurst(.055,.006,"music");musicAccent(name,step,now,beat);a.musicTimer=setTimeout(tick,beat*1000);};tick();
  }

  function setMusicTheme(name){game.musicTheme=name;if(game.audio?.ctx)startMusic(name);}

  function playSfx(name) {
    if(!ensureAudio())return;const now=game.audio.ctx.currentTime;
    if(name==="save"){synthTone(520,.08,"sine",.035,now);synthTone(780,.14,"triangle",.028,now+.07);}
    else if(name==="hit"){noiseBurst(.055,.038);synthTone(125,.07,"square",.025,now,"sfx",.55);}
    else if(name==="hurt"){synthTone(115,.14,"sawtooth",.038,now,"sfx",.48);noiseBurst(.08,.022);}
    else if(name==="drop"){[520,660,830].forEach((f,i)=>synthTone(f,.12,"triangle",.028,now+i*.055));}
    else if(name==="portal"){[180,260,390,590].forEach((f,i)=>synthTone(f,.22,"sine",.02,now+i*.06));}
    else if(name==="boss"){synthTone(72,.5,"sawtooth",.045,now,"sfx",1.8);noiseBurst(.22,.032);}
    else if(name==="craft"){noiseBurst(.13,.04);synthTone(96,.2,"square",.035,now,"sfx",.7);}
  }

  function playWeaponSfx(type,combo=1){const now=ensureAudio()?.ctx.currentTime;if(now==null)return;if(type==="sword"){noiseBurst(.055,.025);synthTone(330+combo*35,.09,"sawtooth",.024,now,"sfx",1.8);}else if(type==="spear")synthTone(250,.12,"triangle",.03,now,"sfx",2.4);else if(type==="axe"){noiseBurst(.11,.04);synthTone(105,.18,"square",.04,now,"sfx",.55);}else if(type==="staff"){synthTone(520,.2,"sine",.035,now,"sfx",1.7);synthTone(780,.12,"triangle",.02,now+.04);}else{noiseBurst(.045,.019);synthTone(430+combo*45,.055,"square",.022,now,"sfx",1.5);synthTone(560+combo*50,.055,"square",.018,now+.045,"sfx",.8);}}

  function playAttackSfx(id){if(!ensureAudio())return;const now=game.audio.ctx.currentTime,v=[...id].reduce((n,c)=>n+c.charCodeAt(0),0)%9;if(/fire|golem|meteor/i.test(id)){noiseBurst(.12+v*.004,.03);synthTone(125+v*9,.16+v*.006,"sawtooth",.032,now,"sfx",.48+v*.025);}else if(/frost|snow|ice/i.test(id)){synthTone(760+v*42,.13+v*.006,"sine",.025,now,"sfx",.38+v*.018);noiseBurst(.08,.012);}else if(/bolt|lightning|chain|feather/i.test(id)){synthTone(1050+v*65,.085+v*.005,"square",.025,now,"sfx",.25+v*.015);noiseBurst(.045,.03);}else if(/void|charm|eye|blade/i.test(id)){synthTone(175+v*14,.21+v*.008,"sine",.03,now,"sfx",1.55+v*.07);synthTone(270+v*18,.18,"sawtooth",.018,now+.03,"sfx",.52+v*.025);}else if(/charge|leap|pounce|dive|slam/i.test(id)){synthTone(78+v*7,.17+v*.008,"sawtooth",.04,now,"sfx",1.55+v*.08);noiseBurst(.075+v*.005,.03);}else{synthTone(235+v*23,.1+v*.006,"triangle",.03,now,"sfx",1.25+v*.06);noiseBurst(.045+.003*v,.018);}}

  function playBossSfx(biome,pattern){playSfx("boss");const now=game.audio?.ctx?.currentTime;if(now!=null){synthTone(160+biome*54+pattern*18,.3,"triangle",.026,now+.03,"sfx",biome===4?.55:1.65);synthTone(90+pattern*14,.38,"sawtooth",.018,now+.06,"sfx",1+biome*.1);}}

  function beep(freq = 220, duration = .07, type = "square", gain = .035) { if(game.save.settings.sound)synthTone(freq,duration,type,gain); }

  function generateItem(region = game.biome, depth = game.depth, forcedMin = 0, rng = new RNG(Date.now() + Math.random())) {
    const progress = region * 5 + depth;
    let roll = rng.next() + region * .022 + depth * .012 + game.save.skills.explore.alchemy * .1;
    let qi = roll > .992 ? 4 : roll > .92 ? 3 : roll > .73 ? 2 : roll > .42 ? 1 : 0;
    qi = Math.max(qi, forcedMin);
    const q = QUALITIES[qi];
    const slot = rng.pick(Object.keys(SLOT_NAMES));
    const weaponType = slot === "weapon" ? rng.pick(WEAPON_TYPES) : null;
    const nameRoots = ["迷途", "守望", "熔火", "冰痕", "鸣雷", "虚界", "星灵", "远征"];
    const nameEnds = { weapon: ["铁剑", "长刃", "战斧"], helmet: ["面甲", "兜帽", "冠冕"], armor: ["胸甲", "旅衣", "战铠"], boots: ["行靴", "战靴", "足甲"], amulet: ["护符", "星坠", "指环"] };
    const itemSuffix = slot === "weapon" ? WEAPON_NAMES[weaponType] : rng.pick(nameEnds[slot]);
    const itemLevel = Math.max(1, game.save.player.level + region * 3 + depth - 2);
    const base = (slot === "weapon" ? 8 : slot === "armor" ? 6 : slot === "helmet" ? 4 : slot === "boots" ? 3 : 18);
    const mainType = slot === "weapon" ? "attack" : slot === "amulet" ? "maxHp" : "defense";
    const mainValue = Math.round(base * (1 + progress * .19) * q.multiplier * (mainType === "maxHp" ? 2.2 : 1));
    const affixes = [];
    const basics = [...BASIC_AFFIXES], specials = [...SPECIAL_AFFIXES];
    const specialCount = qi >= 4 ? 2 : qi >= 2 ? 1 : 0;
    const totalAffixes = q.affixes + (qi === 4 ? 1 : 0);
    for (let i = 0; i < totalAffixes; i++) {
      const pool = i >= totalAffixes - specialCount ? specials : basics;
      const a = pool.splice(rng.int(0, pool.length - 1), 1)[0];
      let value = lerp(a[2], a[3], rng.next()) * (1 + region * .12);
      if (a[0] === "maxHp") value = Math.round(value);
      affixes.push({ type: a[0], name: a[1], value, suffix: a[4], special: SPECIAL_AFFIXES.includes(a) });
    }
    const legendary = qi === 4 ? rng.pick(LEGENDARIES) : null;
    return {
      id: `${Date.now().toString(36)}-${Math.floor(rng.next() * 1e7).toString(36)}`,
      name: `${qi >= 3 ? q.name + "·" : ""}${rng.pick(nameRoots)}${itemSuffix}`,
      slot, quality: q.id, level: itemLevel, enhance: 0, weaponType,
      main: { type: mainType, value: mainValue }, affixes, region,
      legendary: legendary ? { id: legendary[0], name: legendary[1], text: legendary[2] } : null,
      lore: `在${BIOMES[region].name}的第 ${depth} 深度发现，仍残留着元素核心的微光。`
    };
  }

  function addItem(item) {
    const inv = game.save.equipment.inventory;
    if (inv.length >= 30) {
      const sell = Math.max(8, item.level * (QUALITIES.findIndex(q => q.id === item.quality) + 1) * 4);
      game.save.currencies.gold += sell;
      toast(`背包已满，${item.name} 自动分解为 ${sell} 金币`, "#f2c65d");
      return;
    }
    inv.push(item);
    game.unseenItems++;
    toast(`获得 ${qualityById(item.quality).name}装备：${item.name}`, qualityById(item.quality).color);
    playSfx("drop");
  }

  function spawnGroundDrop(kind,x,y,data={}) {
    const a=Math.random()*Math.PI*2,r=10+Math.random()*18;game.groundDrops.push({id:`drop-${Date.now()}-${Math.random()}`,kind,x:x+Math.cos(a)*r,y:y+Math.sin(a)*r,life:0,...data});playSfx("drop");
  }

  function pickupGroundDrop(drop) {
    if(drop.kind==="equipment")addItem(drop.item);
    else if(drop.kind==="potion"){if(game.save.player.potions>=8)return toast("药水袋已满（8 / 8）","#efc46d");game.save.player.potions++;toast("拾取生命药水 ×1","#8be89f");}
    else if(drop.kind==="material"){game.save.materials[drop.material]=(game.save.materials[drop.material]||0)+(drop.amount||1);game.runLoot.materials+=drop.amount||1;toast(`拾取 ${MATERIAL_NAMES[drop.material]} ×${drop.amount||1}`,BIOMES[game.biome].accent);}
    game.groundDrops=game.groundDrops.filter(d=>d!==drop);updateHUD();beep(520,.1,"triangle",.03);
  }

  function itemMainValue(item) { return item.main.value + Math.ceil(item.main.value * item.enhance * .07); }

  function startNewGame() {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(BACKUP_SAVE_KEY);
    game.save = freshSave();
    game.unseenItems = 0;
    const starter = generateItem(0, 1, 0, new RNG("starter-sword"));
    starter.name = "破旧铁剑"; starter.slot = "weapon"; starter.quality = "white"; starter.main = { type: "attack", value: 7 }; starter.affixes = [];
    starter.weaponType = "sword";
    game.save.equipment.equipped.weapon = starter;
    enterCamp(true);
    toast("破旧铁剑已握在手中。寻找五枚暴走核心。", "#fff1a8");
  }

  function continueGame() {
    openPanel("save-panel");
  }

  function loadDecodedGame(loaded) {
    if(!loaded)return toast("这个档位为空或已损坏","#ef7268");game.save=loaded.save;game.unseenItems=0;
    if(loaded.session?.scene==="expedition")restoreSession(loaded.session);else enterCamp(false);
    if(loaded.source==="backup")toast("主存档异常，已从备份恢复","#ffd36b");else if(loaded.migrated)toast("旧版存档已迁移为新版格式","#9de7ff");else toast("星火回应了你的归来");
    saveGame(true);
  }

  function updateTitleSaveMeta(){const meta=$("save-meta"),button=$("continue-btn");if(!meta||!button)return;const loaded=readSavedGame()||SLOT_SAVE_KEYS.map((k,i)=>readSaveKey(k,`slot-${i+1}`)).find(Boolean);button.disabled=!loaded;if(!loaded){meta.textContent="尚无存档";return;}const when=loaded.savedAt?new Date(loaded.savedAt).toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}):"旧版存档";meta.textContent=`${loaded.session?.scene==="expedition"?`${BIOMES[loaded.session.biome]?.name||"远征"} · 深度 ${loaded.session.depth}`:"星火营地"} · ${when} · 点击查看存档列表`;}

  function restoreSession(session){
    const biome=clamp(Number(session.biome)||0,0,4),depth=clamp(Number(session.depth)||1,1,5);game.biome=biome;game.depth=depth;game.scene="expedition";game.paused=false;game.zoneTime=0;game.runLoot=session.runLoot||{gold:0,materials:0,kills:0};
    game.world=generateMap(session.world?.seed||`${BIOMES[biome].id}-restored-${depth}`,biome,depth);game.world.exitLocked=session.world?.exitLocked??(depth===5);game.world.revealed=new Set(session.world?.revealed||[]);
    game.player.x=session.player?.x??((game.world.start.x+.5)*TILE);game.player.y=session.player?.y??((game.world.start.y+.5)*TILE);game.player.dirX=session.player?.dirX??1;game.player.dirY=session.player?.dirY??0;game.player.vx=game.player.vy=0;game.player.invuln=1.8;game.player.swing=null;game.player.statuses={};
    game.enemies=[];(session.enemies||[]).forEach(saved=>{spawnEnemy(saved.typeIndex||0,saved.x,saved.y,!!saved.boss);const e=game.enemies[game.enemies.length-1];Object.assign(e,saved,{attack:saved.boss?null:ENEMY_ATTACKS[biome][saved.typeIndex||0],state:"patrol",stateTime:0,vx:0,vy:0,dead:false,statuses:saved.statuses||{}});});
    game.resources=(session.resources||[]).map(r=>({...r}));game.altars=(session.altars||[]).map(a=>({...a}));game.groundDrops=(session.groundDrops||[]).map(d=>({...d}));game.telegraphs=[];game.projectiles=[];game.impacts=[];game.particles=[];game.numbers=[];game.camera.x=game.camera.y=0;
    $("title-screen").classList.add("hidden");$("death-panel").classList.add("hidden");$("hud").classList.remove("hidden");closeAllModals();setMusicTheme(BIOME_ART_KEYS[biome]);updateCamera(1);updateHUD();
  }

  function enterCamp(first = false) {
    game.scene = "camp"; game.paused = false; game.world = null; game.enemies = []; game.resources = []; game.telegraphs = []; game.projectiles = []; game.impacts = []; game.altars = []; game.groundDrops=[];
    const st = stats(); game.save.player.hp = st.maxHp; game.save.player.stamina = 100; game.save.player.potions = Math.max(3, game.save.player.potions);
    game.player.x = W / 2; game.player.y = H / 2 + 80; game.player.vx = game.player.vy = 0; game.camera.x = game.camera.y = 0;
    $("title-screen").classList.add("hidden"); $("death-panel").classList.add("hidden"); $("hud").classList.remove("hidden");
    setMusicTheme("camp");
    closeAllModals(); renderContinentPanel(); updateHUD(); saveGame(true);
    if (first) toast("营地现在可以自由移动；靠近星门或按 M 选择远征大陆。","#9de7ff");
  }

  function generateMap(seed, biomeIndex, depth) {
    const rng = new RNG(seed);
    const cols = 54, rows = 36;
    const tiles = Array.from({ length: rows }, () => Array(cols).fill(0));
    let x = Math.floor(cols / 2), y = Math.floor(rows / 2), carved = 0, guard = 0, last = 0;
    const target = Math.floor(cols * rows * (.43 + depth * .008));
    while (carved < target && guard++ < cols * rows * 60) {
      if (tiles[y][x] === 0) { tiles[y][x] = 1; carved++; }
      if (rng.next() < .07) {
        for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) {
          if (rng.next() < .72 && x + xx > 1 && x + xx < cols - 2 && y + yy > 1 && y + yy < rows - 2 && tiles[y + yy][x + xx] === 0) {
            tiles[y + yy][x + xx] = 1; carved++;
          }
        }
      }
      let dir = rng.next() < .62 ? last : rng.int(0, 3); last = dir;
      x = clamp(x + [1, -1, 0, 0][dir], 2, cols - 3);
      y = clamp(y + [0, 0, 1, -1][dir], 2, rows - 3);
    }
    for (let pass = 0; pass < 2; pass++) {
      const copy = tiles.map(r => [...r]);
      for (let yy = 2; yy < rows - 2; yy++) for (let xx = 2; xx < cols - 2; xx++) {
        let floors = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) floors += copy[yy + dy][xx + dx] === 1 ? 1 : 0;
        if (copy[yy][xx] === 0 && floors >= 6) tiles[yy][xx] = 1;
      }
    }
    const start = { x: Math.floor(cols / 2), y: Math.floor(rows / 2) };
    tiles[start.y][start.x] = 1;
    const distances = Array.from({ length: rows }, () => Array(cols).fill(-1));
    const queue = [start]; distances[start.y][start.x] = 0; let head = 0, far = start;
    while (head < queue.length) {
      const p = queue[head++]; if (distances[p.y][p.x] > distances[far.y][far.x]) far = p;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = p.x + dx, ny = p.y + dy;
        if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && tiles[ny][nx] === 1 && distances[ny][nx] < 0) {
          distances[ny][nx] = distances[p.y][p.x] + 1; queue.push({ x: nx, y: ny });
        }
      }
    }
    tiles[far.y][far.x] = 4;
    const floorCells = queue.filter(p => distances[p.y][p.x] > 7 && !(p.x === far.x && p.y === far.y));
    const hazards = biomeIndex === 1 ? 32 + depth * 6 : 0;
    for (let i = 0; i < hazards && floorCells.length; i++) {
      const p = rng.pick(floorCells); if (distances[p.y][p.x] > 10) tiles[p.y][p.x] = 6;
    }
    return { seed, rng, cols, rows, tiles, start, exit: far, floorCells, distances, revealed: new Set(), exitLocked: depth === 5 };
  }

  function enterFloor(biomeIndex, depth) {
    const biome = BIOMES[biomeIndex];
    game.biome = biomeIndex; game.depth = depth; game.scene = "expedition"; game.paused = false; game.zoneTime = 0;
    game.runLoot = depth === 1 ? { gold: 0, materials: 0, kills: 0 } : game.runLoot;
    const seed = `${biome.id}-${Date.now()}-${depth}-${game.save.progress.bossKills[biomeIndex]}`;
    game.world = generateMap(seed, biomeIndex, depth);
    const w = game.world;
    game.player.x = (w.start.x + .5) * TILE; game.player.y = (w.start.y + .5) * TILE;
    game.player.vx = game.player.vy = 0; game.player.invuln = 2.2; game.player.swing = null;
    game.enemies = []; game.resources = []; game.telegraphs = []; game.projectiles = []; game.impacts = []; game.altars = []; game.particles = []; game.numbers = []; game.groundDrops=[];
    const rng = w.rng;
    const occupied = new Set();
    const cellKey = p => `${p.x},${p.y}`;
    const pickCell = minDist => {
      for (let tries = 0; tries < 300; tries++) {
        const p = rng.pick(w.floorCells);
        if (w.distances[p.y][p.x] >= minDist && !occupied.has(cellKey(p)) && w.tiles[p.y][p.x] === 1) { occupied.add(cellKey(p)); return p; }
      }
      return rng.pick(w.floorCells);
    };
    const resourceCount = 10 + depth * 2;
    for (let i = 0; i < resourceCount; i++) {
      const p = pickCell(5);
      game.resources.push({ x: (p.x + .5) * TILE, y: (p.y + .5) * TILE, type: i % 3 ? biome.primary : biome.ore, rich: rng.next() > .86, gathered: false });
    }
    const count = depth === 5 ? 12 + biomeIndex * 2 : 9 + depth * 2 + biomeIndex * 2;
    for (let i = 0; i < count; i++) {
      const p = pickCell(8); spawnEnemy(i % 4, (p.x + .5) * TILE, (p.y + .5) * TILE, false);
    }
    if (depth === 5) spawnEnemy(0, (w.exit.x + .5) * TILE, (w.exit.y + .5) * TILE, true);
    if (biomeIndex === 4) {
      for (let i = 0; i < 3; i++) { const p = pickCell(7); game.altars.push({ x: (p.x + .5) * TILE, y: (p.y + .5) * TILE, lit: false }); }
    }
    game.save.player.hp = Math.min(game.save.player.hp, stats().maxHp);
    setMusicTheme(BIOME_ART_KEYS[biomeIndex]);playSfx("portal");
    closeAllModals(); updateHUD(); toast(`${biome.name} · 深度 ${depth}`, biome.accent); saveGame(true);
  }

  function spawnEnemy(typeIndex, x, y, boss) {
    const raw = boss ? BIOMES[game.biome].boss : BIOMES[game.biome].monsters[typeIndex];
    const scale = 1 + game.depth * .13 + game.biome * .17;
    const elite = !boss && Math.random() < .055 + game.depth * .012;
    const hp = Math.round(raw[3] * scale * (elite ? 1.75 : 1));
    game.enemies.push({
      name: `${elite ? "精英·" : ""}${raw[0]}`, color: raw[1], speed: raw[2] * (elite ? 1.08 : 1), hp, maxHp: hp, damage: Math.round(raw[4] * scale * (elite ? 1.3 : 1)), typeIndex, attack: boss ? null : ENEMY_ATTACKS[game.biome][typeIndex], elite,
      x, y, homeX: x, homeY: y, radius: boss ? 29 : 14, boss,
      state: "patrol", stateTime: 0, attackCd: 1 + Math.random() * 1.2, specialCd: boss ? 2 : 99, statuses: {}, statusTick: .7,
      vx: 0, vy: 0, flash: 0, hit: 0, hurtFx: 0, dead: false, phase: Math.random() * Math.PI * 2, pattern: 0, chargeHit: false
    });
  }

  function isWalkable(x, y) {
    if (!game.world) return true;
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    return tx >= 0 && ty >= 0 && tx < game.world.cols && ty < game.world.rows && game.world.tiles[ty][tx] !== 0;
  }

  function moveEntity(e, dx, dy, radius = 11) {
    if (isWalkable(e.x + dx + Math.sign(dx) * radius, e.y)) e.x += dx;
    else e.vx = 0;
    if (isWalkable(e.x, e.y + dy + Math.sign(dy) * radius)) e.y += dy;
    else e.vy = 0;
  }

  function spawnProjectile({ x, y, dx, dy, speed = 250, damage = 10, team = "enemy", effect = 5, radius = 9, life = 2.4, status = null, homing = 0, pierce = 0, owner = null, monsterFx = null }) {
    const len = Math.hypot(dx, dy) || 1;
    game.projectiles.push({ x, y, vx: dx / len * speed, vy: dy / len * speed, damage, team, effect, radius, life, status, homing, pierce, owner, monsterFx, spin: Math.random() * Math.PI * 2 });
  }

  function spawnImpact(x, y, effect = 10, size = 46, life = .28) {
    game.impacts.push({ x, y, effect, size, life, max: life, rotation: Math.random() * Math.PI * 2 });
  }

  function spawnMonsterFx(x,y,col,row,angle=0,size=82,life=.42) { game.impacts.push({x,y,monsterFx:{col,row},size,life,max:life,rotation:angle}); }

  function spawnTreantLineFx(t) {
    const angle=Math.atan2(t.y2-t.y,t.x2-t.x),length=Math.hypot(t.x2-t.x,t.y2-t.y),segments=Math.max(3,Math.ceil(length/82));
    for(let i=0;i<segments;i++){
      const pct=(i+.5)/segments;
      game.impacts.push({x:lerp(t.x,t.x2,pct),y:lerp(t.y,t.y2,pct),treantFx:true,width:length/segments*1.16,height:56,life:.52+i*.035,max:.52+i*.035,rotation:angle,phase:i});
    }
  }

  function applyPlayerStatus(status, duration = 2.5) {
    if (!status) return;
    game.player.statuses ||= {};
    game.player.statuses[status] = Math.max(game.player.statuses[status] || 0, duration);
    const labels = { burn: "灼烧", poison: "中毒", slow: "霜冻", stun: "麻痹", charm: "魅惑" };
    numberFx(game.player.x, game.player.y - 34, labels[status] || status, status === "burn" ? "#ff9b52" : status === "slow" ? "#8ee9ff" : status === "poison" ? "#9ce04e" : "#d29bff");
  }

  function applyEnemyStatus(e, status, duration = 2.5) {
    if (!status || e.dead) return;
    e.statuses ||= {};
    e.statuses[status] = Math.max(e.statuses[status] || 0, duration);
    const labels = { burn: "灼烧", poison: "中毒", slow: "霜冻", stun: "麻痹" };
    numberFx(e.x, e.y - e.radius - 20, labels[status], status === "burn" ? "#ff9b52" : status === "slow" ? "#8ee9ff" : status === "poison" ? "#9ce04e" : "#d29bff");
  }

  function offensiveMultiplier(e, projectile = false) {
    let mult = 1 + statValue("elementalDamage");
    if (projectile) mult *= 1 + statValue("projectilePower");
    if (e.elite || e.boss) mult *= 1 + statValue("eliteDamage");
    if (e.hp < e.maxHp * .25) mult *= 1 + statValue("executeDamage");
    return mult;
  }

  function rollOffensiveAffixes(e) {
    const chances = [["burnChance","burn",2.8],["poisonChance","poison",3.2],["frostChance","slow",2.4],["stunChance","stun",.6]];
    chances.forEach(([affix,status,duration]) => { if (Math.random() < statValue(affix)) applyEnemyStatus(e,status,duration); });
  }

  function playerWeaponProfile() { return WEAPON_PROFILES[equippedWeaponType()]; }

  function setPlayerAim(dx,dy) {
    const len=Math.hypot(dx,dy)||1;game.player.dirX=dx/len;game.player.dirY=dy/len;game.player.aimAngle=Math.atan2(game.player.dirY,game.player.dirX);
  }

  function attack(fromKeyboard = false) {
    if (game.scene !== "expedition" || game.paused || isModalOpen() || game.player.attackCd > 0 || game.player.dash > 0) return;
    const p = game.player; const st = stats(); const now = performance.now() / 1000; const weaponType = equippedWeaponType(); const profile = WEAPON_PROFILES[weaponType];
    p.combo = now <= p.comboUntil ? p.combo % 3 + 1 : 1; p.comboUntil = now + .62;
    let dx = p.dirX, dy = p.dirY;
    if (!fromKeyboard) {
      const wx = game.mouse.x + game.camera.x, wy = game.mouse.y + game.camera.y;
      const len = Math.hypot(wx - p.x, wy - p.y) || 1; dx = (wx - p.x) / len; dy = (wy - p.y) / len;
    }
    setPlayerAim(dx,dy);dx=p.dirX;dy=p.dirY;
    const duration = (p.combo === 3 ? .44 : p.combo === 2 ? .29 : .24) / profile.speed;
    p.attackCd = duration / st.attackSpeed;
    p.swing = { t: duration, max: duration, combo: p.combo, dx, dy, hits: new Set(), weaponType, profile, fired: false };
    p.recoveryPose=0;
    if (weaponType === "spear" && p.combo === 3) { p.vx += dx * 145; p.vy += dy * 145; }
    if (weaponType === "daggers" && p.combo === 3) moveEntity(p,dx*24,dy*24,p.radius);
    playWeaponSfx(weaponType,p.combo);
  }

  function useActiveSkill(slot=1) {
    if(game.scene!=="expedition"||game.paused||isModalOpen())return;const p=game.player,st=stats(),type=equippedWeaponType();
    if(slot===2){if(p.activeCd2>0)return toast(`星爆术冷却 ${p.activeCd2.toFixed(1)} 秒`,"#d4b0ff");if(game.save.player.stamina<45)return toast("耐力不足","#e5cf69");game.save.player.stamina-=45;p.activeCd2=9;p.recoveryPose=.55;game.enemies.filter(e=>!e.dead&&dist(e,p)<165).forEach(e=>{const a=Math.atan2(e.y-p.y,e.x-p.x),crit=Math.random()<st.critRate;damageEnemy(e,st.attack*2.15*offensiveMultiplier(e)*(crit?st.critDamage:1),crit,Math.cos(a)*230,Math.sin(a)*230);});for(let i=0;i<12;i++){const a=i/12*Math.PI*2;spawnProjectile({x:p.x,y:p.y,dx:Math.cos(a),dy:Math.sin(a),speed:235,damage:st.attack*.65,team:"player",effect:9,radius:9,life:.75,pierce:1});}spawnImpact(p.x,p.y,9,175,.55);burst(p.x,p.y,"#e4a4ff",30,230);playWeaponSfx("staff",3);return;}
    if(p.activeCd1>0)return toast(`武器战技冷却 ${p.activeCd1.toFixed(1)} 秒`,"#ffe09a");if(game.save.player.stamina<28)return toast("耐力不足","#e5cf69");game.save.player.stamina-=28;p.activeCd1=5.2;p.recoveryPose=.48;const dx=Math.cos(p.aimAngle),dy=Math.sin(p.aimAngle),hit=(e,mult,knock=180)=>{const crit=Math.random()<st.critRate;damageEnemy(e,st.attack*mult*offensiveMultiplier(e)*(crit?st.critDamage:1),crit,dx*knock,dy*knock);rollOffensiveAffixes(e);};
    if(type==="staff"){for(let i=-2;i<=2;i++){const a=p.aimAngle+i*.18;spawnProjectile({x:p.x,y:p.y,dx:Math.cos(a),dy:Math.sin(a),speed:390,damage:st.attack*1.35,team:"player",effect:3,radius:12,pierce:2});}}
    else if(type==="sword"){game.enemies.filter(e=>!e.dead&&dist(e,p)<105).forEach(e=>hit(e,1.8,250));spawnImpact(p.x,p.y,0,150,.42);}
    else if(type==="axe"){game.enemies.filter(e=>!e.dead&&dist(e,p)<135).forEach(e=>hit(e,2.45,360));spawnImpact(p.x+dx*34,p.y+dy*34,2,180,.5);game.screenShake=12;}
    else if(type==="spear"){p.vx=dx*470;p.vy=dy*470;game.enemies.filter(e=>!e.dead&&pointSegmentDistance(e.x,e.y,p.x,p.y,p.x+dx*190,p.y+dy*190)<e.radius+24).forEach(e=>hit(e,2.05,310));spawnImpact(p.x+dx*85,p.y+dy*85,1,145,.4);}
    else {moveEntity(p,dx*55,dy*55,p.radius);game.enemies.filter(e=>!e.dead&&dist(e,p)<82).forEach(e=>{hit(e,1.15,130);hit(e,.9,90);});spawnImpact(p.x,p.y,4,115,.38);}
    playWeaponSfx(type,3);
  }

  function dash() {
    if (game.scene !== "expedition" || game.paused || isModalOpen() || game.player.dash > 0) return;
    const p = game.player; const cost = 34 * (1 - game.save.skills.survival.agility * .1);
    if (game.save.player.stamina < cost) { toast("耐力不足", "#e5cf69"); return; }
    game.save.player.stamina -= cost; p.dash = .22; p.invuln = Math.max(p.invuln, .25);
    let dx = (game.keys.has("KeyD") ? 1 : 0) - (game.keys.has("KeyA") ? 1 : 0);
    let dy = (game.keys.has("KeyS") ? 1 : 0) - (game.keys.has("KeyW") ? 1 : 0);
    const len = Math.hypot(dx, dy) || 1; p.dirX = dx ? dx / len : p.dirX; p.dirY = dy ? dy / len : p.dirY;
    p.vx = p.dirX * 560; p.vy = p.dirY * 560;
    burst(p.x, p.y, "#b9eaff", 8, 120); beep(310, .08, "triangle", .03);
  }

  function usePotion() {
    if (game.scene !== "expedition" || game.paused || isModalOpen()) return;
    const st = stats();
    if (game.save.player.potions <= 0) return toast("生命药水已经用完", "#e86b6b");
    if (game.save.player.hp >= st.maxHp - 1) return toast("生命值已满");
    game.save.player.potions--; const heal = st.maxHp * .38; game.save.player.hp = Math.min(st.maxHp, game.save.player.hp + heal);
    numberFx(game.player.x, game.player.y - 22, `+${Math.round(heal)}`, "#78e88a"); burst(game.player.x, game.player.y, "#75e49a", 12, 90); beep(460, .14, "sine", .04);
  }

  function interact() {
    if (game.scene === "camp") return openPanel("continent-panel");
    if (game.scene !== "expedition" || game.paused || isModalOpen()) return;
    const p = game.player;
    const drop=game.groundDrops.filter(d=>dist(d,p)<58).sort((a,b)=>dist(a,p)-dist(b,p))[0];
    if(drop){pickupGroundDrop(drop);return;}
    const altar = game.altars.find(a => !a.lit && dist(a, p) < 48);
    if (altar) { altar.lit = true; burst(altar.x, altar.y, "#ff8ce6", 22, 145); toast("深渊祭坛已点燃，视野扩大", "#ff95e6"); beep(520, .3, "sine", .04); return; }
    const resource = game.resources.find(r => !r.gathered && dist(r, p) < 44);
    if (resource) {
      resource.gathered = true;
      const mult = 1 + game.save.skills.explore.miner * .2;
      const amount = Math.max(1, Math.round((resource.rich ? 4 : 2) * mult));
      game.save.materials[resource.type] = (game.save.materials[resource.type] || 0) + amount;
      if (resource.type === "void_fragment") game.save.currencies.void += Math.max(1, Math.floor(amount / 2));
      game.runLoot.materials += amount; numberFx(resource.x, resource.y - 18, `+${amount} ${MATERIAL_NAMES[resource.type]}`, BIOMES[game.biome].accent);
      burst(resource.x, resource.y, BIOMES[game.biome].accent, 10, 80); beep(380, .08, "square", .025); updateHUD(); return;
    }
    const ex = { x: (game.world.exit.x + .5) * TILE, y: (game.world.exit.y + .5) * TILE };
    if (dist(ex, p) < 55) {
      if (game.world.exitLocked) return toast("击败区域领主后，星门才会回应", "#ef7168");
      game.save.progress.completedDepths[game.biome] = Math.max(game.save.progress.completedDepths[game.biome], game.depth);
      if (game.depth < 5) { enterFloor(game.biome, game.depth + 1); }
      else { completeContinent(); }
    }
  }

  function completeContinent() {
    game.save.progress.bossKills[game.biome]++;
    game.save.progress.completedDepths[game.biome] = 5;
    if (game.biome < BIOMES.length - 1 && !game.save.progress.unlocked.includes(game.biome + 1)) game.save.progress.unlocked.push(game.biome + 1);
    const biome = BIOMES[game.biome];
    game.save.materials[biome.core] = (game.save.materials[biome.core] || 0) + 1;
    addItem(generateItem(game.biome, 5, 2, new RNG(Date.now())));
    toast(`${biome.name}的元素核心已重新封印！`, biome.accent); beep(660, .45, "triangle", .05);
    saveGame(true); enterCamp(false); setTimeout(() => openPanel("continent-panel"), 600);
  }

  function damagePlayer(amount, sourceX, sourceY) {
    const p = game.player; const st = stats();
    if (p.invuln > 0 || Math.random() < st.dodge) { if (p.invuln <= 0) numberFx(p.x, p.y - 20, "闪避", "#c7efff"); return false; }
    amount = Math.max(1, amount - st.defense * .35) * (1 - st.reduction);
    game.save.player.hp -= amount; p.invuln = .48; p.hurtFx = .22; game.screenShake = Math.max(game.screenShake, 7);
    const len = Math.hypot(p.x - sourceX, p.y - sourceY) || 1; p.vx += (p.x - sourceX) / len * 170; p.vy += (p.y - sourceY) / len * 170;
    numberFx(p.x, p.y - 22, `-${Math.round(amount)}`, "#ff6d67"); burst(p.x, p.y, "#f65f5f", 8, 100); spawnImpact(p.x, p.y, 10, 52); playSfx("hurt");
    if (Object.values(game.save.equipment.equipped).some(i => i && i.legendary?.id === "thunderarmor") && Math.random() < .2) {
      game.enemies.filter(e => !e.dead && dist(e, p) < 110).forEach(e => damageEnemy(e, st.attack * .7, false, 0, 0));
      burst(p.x, p.y, "#c39aff", 18, 180);
    }
    if (game.save.player.hp <= 0) die();return true;
  }

  function damageEnemy(e, amount, crit, kx, ky) {
    if (e.dead) return;
    e.hp -= amount; e.flash = .11; e.hit = .15; e.hurtFx = .2; e.state = "hit"; e.stateTime = .15;
    e.vx += kx; e.vy += ky;
    numberFx(e.x, e.y - e.radius - 7, `${crit ? "✦ " : ""}${Math.round(amount)}`, crit ? "#ffe56d" : "#fff2e6");
    burst(e.x, e.y, crit ? "#ffe36e" : "#f7d7c2", crit ? 9 : 5, crit ? 120 : 75); spawnImpact(e.x, e.y, 10, crit ? 60 : 42);
    game.hitStop = e.boss ? .055 : .035; game.screenShake = Math.max(game.screenShake, crit ? 6 : 3);
    playSfx("hit");if (e.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    e.dead = true; game.runLoot.kills++;
    const xp = Math.round((e.boss ? 150 : 14) * (1 + game.biome * .45 + game.depth * .15));
    const gold = Math.round((e.boss ? 160 : 7 + Math.random() * 9) * (1 + game.biome * .35));
    game.save.player.xp += xp; game.save.currencies.gold += gold; game.runLoot.gold += gold;
    numberFx(e.x, e.y - 28, `+${xp} XP  +${gold} ◉`, "#f8d16a"); burst(e.x, e.y, e.color, e.boss ? 35 : 13, e.boss ? 220 : 120);
    if (e.boss) {
      game.world.exitLocked = false;
      spawnGroundDrop("equipment",e.x-20,e.y,{item:generateItem(game.biome, game.depth, 2, new RNG(Date.now() + "boss1"))});
      spawnGroundDrop("equipment",e.x+20,e.y,{item:generateItem(game.biome, game.depth, 1, new RNG(Date.now() + "boss2"))});
      spawnGroundDrop("potion",e.x,e.y+18);spawnGroundDrop("potion",e.x,e.y+18);
      toast(`${e.name} 已被击败，通往营地的星门开启！`, "#ffe580");
    } else if (Math.random() < .115 + game.save.skills.explore.alchemy * .08) {
      spawnGroundDrop("equipment",e.x,e.y,{item:generateItem(game.biome, game.depth)});
    }
    const biome=BIOMES[game.biome],rareChance=e.boss?1:Math.min(.92,(e.elite?.72:.07+game.depth*.012)*(1+statValue("rareFind")));
    if(Math.random()<rareChance){const amount=e.boss?2:1;spawnGroundDrop("material",e.x,e.y,{material:biome.rare,amount});numberFx(e.x,e.y-46,`${biome.rareName} ×${amount}`,biome.accent);}
    if(!e.boss&&Math.random()<(e.elite?.24:.055))spawnGroundDrop("potion",e.x,e.y);
    checkLevelUp(); updateHUD();
  }

  function checkLevelUp() {
    let leveled = false;
    while (game.save.player.level < 50 && game.save.player.xp >= xpNeeded()) {
      game.save.player.xp -= xpNeeded(); game.save.player.level++; game.save.player.skillPoints++; leveled = true;
    }
    if (leveled) {
      const st = stats(); game.save.player.hp = st.maxHp; game.save.player.stamina = 100;
      toast(`等级提升至 ${game.save.player.level}！获得 1 技能点`, "#9de7ff"); burst(game.player.x, game.player.y, "#9feaff", 28, 200); beep(740, .32, "triangle", .05);
    }
  }

  function die() {
    game.paused = true; game.save.player.hp = 0; saveGame(true);
    $("death-summary").textContent = `本次远征击败 ${game.runLoot.kills} 名敌人，带回 ${game.runLoot.gold} 金币与 ${game.runLoot.materials} 份材料。`;
    openPanel("death-panel");
  }

  function numberFx(x, y, text, color) { game.numbers.push({ x, y, text, color, life: 1, vy: -30 }); }
  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, s = Math.random() * speed;
      game.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .35 + Math.random() * .45, max: .8, color, size: 2 + Math.random() * 4 });
    }
  }

  function addCircle(x, y, r, delay, damage, color, status = null, effect = 0) {
    game.telegraphs.push({ type: "circle", x, y, r, life: delay, max: delay, damage, color, status, effect });
  }

  function addLine(x, y, x2, y2, width, delay, damage, color, status = null, effect = 0, specialFx = null) {
    game.telegraphs.push({ type: "line", x, y, x2, y2, width, life: delay, max: delay, damage, color, status, effect, specialFx });
  }

  function addCone(x, y, angle, range, arc, delay, damage, color, status = null, effect = 0) {
    game.telegraphs.push({ type: "cone", x, y, angle, range, arc, life: delay, max: delay, damage, color, status, effect });
  }

  function fireRadial(e, count, speed, effect, damage, status = null, offset = 0) {
    for (let i = 0; i < count; i++) { const a = i / count * Math.PI * 2 + offset; spawnProjectile({ x:e.x, y:e.y, dx:Math.cos(a), dy:Math.sin(a), speed, effect, damage, status, owner:e }); }
  }

  function startCharge(e, tx, ty, speed, duration, damage, status = null) {
    const len = Math.hypot(tx - e.x, ty - e.y) || 1; e.state = "charge"; e.stateTime = duration; e.vx = (tx - e.x) / len * speed; e.vy = (ty - e.y) / len * speed; e.chargeDamage = damage; e.chargeStatus = status; e.chargeHit = false;
  }

  function bossSpecial(e) {
    const p = game.player, biome = game.biome, pattern = e.pattern++ % 4, enraged = e.hp < e.maxHp * .45;
    if (enraged && !e.enraged) { e.enraged = true; toast(`${e.name}进入元素暴走阶段！`, BIOMES[biome].accent); }
    const bonus = enraged ? 3 : 0, aim = Math.atan2(p.y - e.y, p.x - e.x);
    spawnMonsterFx(e.x+Math.cos(aim)*42,e.y+Math.sin(aim)*36,biome,pattern,aim,155,.68);
    if (biome === 0) {
      if (pattern === 0) { addCircle(p.x,p.y,58,.82,e.damage*1.2,"#82d764","stun",10); for(let i=0;i<6+bonus;i++){const a=i/(6+bonus)*Math.PI*2;addCircle(p.x+Math.cos(a)*98,p.y+Math.sin(a)*98,28,.95,e.damage*.8,"#6fbd55","poison",10);} }
      if (pattern === 1) { fireRadial(e,10+bonus,155,5,e.damage*.72,"poison",game.zoneTime); if(game.enemies.filter(x=>!x.dead&&!x.boss).length<18){for(let i=0;i<(enraged?3:2);i++){const a=i*Math.PI+(Math.random()-.5);spawnEnemy(1,e.x+Math.cos(a)*75,e.y+Math.sin(a)*75,false);}} }
      if (pattern === 2) { for(let i=0;i<4+(enraged?2:0);i++){const a=i/(4+(enraged?2:0))*Math.PI;addLine(e.x-Math.cos(a)*260,e.y-Math.sin(a)*260,e.x+Math.cos(a)*260,e.y+Math.sin(a)*260,22,.88,e.damage,"#9be071","stun",10);} }
      if (pattern === 3) { for(let i=-2-bonus;i<=2+bonus;i++){const a=aim+i*.13;spawnProjectile({x:e.x,y:e.y,dx:Math.cos(a),dy:Math.sin(a),speed:215,effect:5,damage:e.damage*.65,status:"poison",owner:e});} }
    } else if (biome === 1) {
      if (pattern === 0) addCone(e.x,e.y,aim,250,1.18,.78,e.damage*1.25,"#ff7138","burn",6);
      if (pattern === 1) for(let i=0;i<7+bonus;i++) addCircle(p.x+(Math.random()-.5)*270,p.y+(Math.random()-.5)*210,34,.65+i*.09,e.damage,"#ff723c","burn",6);
      if (pattern === 2) startCharge(e,p.x,p.y,enraged?480:410,.72,e.damage*1.45,"burn");
      if (pattern === 3) { fireRadial(e,12+bonus,190,6,e.damage*.72,"burn",game.zoneTime); for(let i=0;i<8;i++){const a=i/8*Math.PI*2;addCircle(e.x+Math.cos(a)*120,e.y+Math.sin(a)*120,30,.9,e.damage*.8,"#f05a31","burn",6);} }
    } else if (biome === 2) {
      if (pattern === 0) { for(let i=0;i<10+bonus;i++){const a=i/(10+bonus)*Math.PI*2;addCircle(e.x+Math.cos(a)*125,e.y+Math.sin(a)*125,25,.8,e.damage,"#b9efff","slow",12);} addCircle(p.x,p.y,44,1.02,e.damage*1.1,"#e2f9ff","slow",12); }
      if (pattern === 1) fireRadial(e,14+bonus,175,7,e.damage*.68,"slow",game.zoneTime);
      if (pattern === 2) for(let i=-1-(enraged?1:0);i<=1+(enraged?1:0);i++){const a=aim+i*.28;addLine(e.x,e.y,e.x+Math.cos(a)*390,e.y+Math.sin(a)*390,24,.82,e.damage*1.15,"#aeeeff","slow",7);}
      if (pattern === 3) { const a=Math.random()*Math.PI*2;e.x=p.x+Math.cos(a)*150;e.y=p.y+Math.sin(a)*150;burst(e.x,e.y,"#c8f4ff",18,150);for(let i=-2-bonus;i<=2+bonus;i++){const q=aim+Math.PI+i*.14;spawnProjectile({x:e.x,y:e.y,dx:Math.cos(q),dy:Math.sin(q),speed:245,effect:7,damage:e.damage*.72,status:"slow",owner:e});} }
    } else if (biome === 3) {
      if (pattern === 0) { addCircle(p.x,p.y,48,.68,e.damage*1.35,"#c89cff","stun",8);for(let i=0;i<7+bonus;i++)addCircle(p.x+(Math.random()-.5)*450,p.y+(Math.random()-.5)*330,32,.82+Math.random()*.3,e.damage*.85,"#a879ff","stun",8); }
      if (pattern === 1) fireRadial(e,12+bonus,230,8,e.damage*.7,"stun",game.zoneTime);
      if (pattern === 2) startCharge(e,p.x,p.y,enraged?560:470,.52,e.damage*1.3,"stun");
      if (pattern === 3) { for(let i=-2;i<=2;i++)addLine(p.x-280,p.y+i*64,p.x+280,p.y+i*64,17,.78+i*.06,e.damage,"#b47aff","stun",8);for(let i=-2;i<=2;i++)addLine(p.x+i*64,p.y-240,p.x+i*64,p.y+240,17,1.02+i*.04,e.damage,"#8c63e7","stun",8); }
    } else {
      if (pattern === 0) { fireRadial(e,14+bonus,205,9,e.damage*.7,"charm",game.zoneTime);for(let i=0;i<3;i++){const a=Math.random()*Math.PI*2;spawnProjectile({x:e.x,y:e.y,dx:Math.cos(a),dy:Math.sin(a),speed:145,effect:9,damage:e.damage*.85,status:"charm",homing:.9,owner:e});} }
      if (pattern === 1 && game.enemies.filter(x=>!x.dead&&!x.boss).length<20) for(let i=0;i<(enraged?4:3);i++){const a=i/(enraged?4:3)*Math.PI*2;spawnEnemy(i%4,e.x+Math.cos(a)*90,e.y+Math.sin(a)*90,false);}
      if (pattern === 2) for(let i=0;i<4+(enraged?2:0);i++){const a=game.zoneTime+i/(4+(enraged?2:0))*Math.PI;addLine(e.x-Math.cos(a)*330,e.y-Math.sin(a)*330,e.x+Math.cos(a)*330,e.y+Math.sin(a)*330,24,.88,e.damage*1.08,"#ee55b2","charm",9);}
      if (pattern === 3) { addCircle(p.x,p.y,78,1.02,e.damage*1.45,"#ff5cae","charm",9);for(let i=0;i<8+bonus;i++){const a=i/(8+bonus)*Math.PI*2;addCircle(p.x+Math.cos(a)*128,p.y+Math.sin(a)*128,35,.78,e.damage*.8,"#8c57d5","charm",9);} }
    }
    playBossSfx(biome,pattern);
  }

  function pointSegmentDistance(px,py,x1,y1,x2,y2){const l2=(x2-x1)**2+(y2-y1)**2;if(!l2)return Math.hypot(px-x1,py-y1);const t=clamp(((px-x1)*(x2-x1)+(py-y1)*(y2-y1))/l2,0,1);return Math.hypot(px-(x1+t*(x2-x1)),py-(y1+t*(y2-y1)));}
  function angleDelta(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}

  function updateTelegraphs(dt) {
    for (let i=game.telegraphs.length-1;i>=0;i--){const t=game.telegraphs[i];t.life-=dt;if(t.life>0)continue;const p=game.player;let hit=false;
      if(t.type==="circle")hit=Math.hypot(p.x-t.x,p.y-t.y)<t.r+p.radius;
      else if(t.type==="line")hit=pointSegmentDistance(p.x,p.y,t.x,t.y,t.x2,t.y2)<t.width+p.radius;
      else if(t.type==="cone"){const d=Math.hypot(p.x-t.x,p.y-t.y),a=Math.atan2(p.y-t.y,p.x-t.x);hit=d<t.range&&Math.abs(angleDelta(a,t.angle))<t.arc/2;}
      if(hit&&damagePlayer(t.damage,t.x,t.y))applyPlayerStatus(t.status,t.status==="stun"?.65:2.8);
      const ix=t.type==="line"?(t.x+t.x2)/2:t.x,iy=t.type==="line"?(t.y+t.y2)/2:t.y;
      if(t.specialFx==="treantRoots")spawnTreantLineFx(t);else spawnImpact(ix,iy,t.effect||0,t.type==="line"?72:Math.max(46,(t.r||42)*1.25));
      burst(ix,iy,t.color,12,120);game.screenShake=Math.max(game.screenShake,t.specialFx==="treantRoots"?8:5);game.telegraphs.splice(i,1);
    }
  }

  function performEnemyAttack(e) {
    const p=game.player,a=e.attack,id=e.pendingAttack||a?.id,tx=e.targetX,ty=e.targetY,dx=tx-e.x,dy=ty-e.y,len=Math.hypot(dx,dy)||1,bonus=Math.floor((game.depth-1)/2);
    const fx={col:game.biome,row:clamp(e.typeIndex||0,0,3)},aim=Math.atan2(dy,dx);
    const projectile=(effect,status,speed=230,mult=1,homing=0,angleOffset=0)=>{const ang=aim+angleOffset;spawnProjectile({x:e.x,y:e.y,dx:Math.cos(ang),dy:Math.sin(ang),speed,effect,damage:e.damage*mult,status,homing,owner:e,monsterFx:fx});};
    spawnMonsterFx(e.x+dx/len*34,e.y+dy/len*28,fx.col,fx.row,aim,e.boss?130:82,e.boss?.55:.4);playAttackSfx(id);if(id==="bossMelee"){addCircle(e.x,e.y,e.radius+42,.18,e.damage,"#ff8c68",null,0);}
    else if(id==="slimeLeap")startCharge(e,tx,ty,275,.48,e.damage,"poison");
    else if(id==="poisonSpore")projectile(5,"poison",155,1,0.15);
    else if(id==="rootLine")addLine(e.x,e.y,e.x+dx/len*280,e.y+dy/len*280,18,.52,e.damage,"#77c85b","stun",10,"treantRoots");
    else if(id==="boarCharge")startCharge(e,tx,ty,390,.62,e.damage*1.25,null);
    else if(id==="fireSpit")projectile(6,"burn",225,1);
    else if(id==="tailSting"){if(Math.hypot(p.x-e.x,p.y-e.y)<82&&damagePlayer(e.damage*1.15,e.x,e.y))applyPlayerStatus("poison",3.5);spawnImpact(p.x,p.y,5,42);}
    else if(id==="golemSlam"){addCircle(e.x,e.y,88,.28,e.damage*1.2,"#ff7543","burn",2);}
    else if(id==="throwKnife")projectile(4,null,300,.9);
    else if(id==="batDive")startCharge(e,tx,ty,420,.42,e.damage,"slow");
    else if(id==="snowball")projectile(7,"slow",165,1.2);
    else if(id==="wolfPounce")startCharge(e,tx,ty,450,.38,e.damage*1.05,"slow");
    else if(id==="frostVolley")for(let i=-1-bonus;i<=1+bonus;i++)projectile(7,"slow",245,.72,0,i*.15);
    else if(id==="chainBolt")projectile(8,"stun",285,.92,.25);
    else if(id==="lightningMark")addCircle(tx,ty,38,.5,e.damage*1.1,"#b47dff","stun",8);
    else if(id==="gustCone")addCone(e.x,e.y,Math.atan2(dy,dx),165,1.08,.34,e.damage,"#9ad9ec","slow",8);
    else if(id==="featherVolley")for(let i=-1-bonus;i<=1+bonus;i++)projectile(4,"stun",280,.7,0,i*.13);
    else if(id==="voidBolt")projectile(9,"burn",235,1,.2);
    else if(id==="bladeWave")projectile(0,null,255,1.15,0,0);
    else if(id==="charmOrb")projectile(9,"charm",155,.9,.8);
    else if(id==="eyeBeam")addLine(e.x,e.y,e.x+dx/len*410,e.y+dy/len*410,18,.48,e.damage*1.2,"#ef589e","charm",9);
    if(e.state!=="charge")e.state="recover";e.stateTime=.28;e.attackCd=(a?.cooldown||1.4)*(1-Math.min(.2,game.depth*.025));e.pendingAttack=null;
  }

  function updateEnemy(e,dt){if(e.dead)return;e.flash-=dt;e.hit-=dt;e.hurtFx-=dt;e.attackCd-=dt;e.specialCd-=dt;e.statusTick=(e.statusTick||0)-dt;e.statuses||={};Object.keys(e.statuses).forEach(k=>{e.statuses[k]-=dt;if(e.statuses[k]<=0)delete e.statuses[k];});if(e.statusTick<=0&&(e.statuses.burn||e.statuses.poison)){e.statusTick=.7;const dot=stats().attack*(e.statuses.burn?.12:.08);e.hp-=dot;numberFx(e.x,e.y-e.radius-8,`-${Math.ceil(dot)}`,e.statuses.burn?"#ff8a43":"#99db4d");spawnImpact(e.x,e.y,e.statuses.burn?11:13,34,.35);if(e.hp<=0){killEnemy(e);return;}}const p=game.player,dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;if(e.statuses.stun){e.vx*=Math.pow(.03,dt);e.vy*=Math.pow(.03,dt);return;}
    if(e.boss&&e.specialCd<=0&&e.state!=="charge"){bossSpecial(e);e.specialCd=Math.max(2.25,(5-game.biome*.28)*(e.hp<e.maxHp*.45?.72:1));if(e.state!=="charge"){e.state="special";e.stateTime=.55;}return;}
    if(e.state==="charge"){e.stateTime-=dt;moveEntity(e,e.vx*dt,e.vy*dt,e.radius*.65);if(!e.chargeHit&&dist(e,p)<e.radius+p.radius+8){e.chargeHit=true;if(damagePlayer(e.chargeDamage,e.x,e.y))applyPlayerStatus(e.chargeStatus,e.chargeStatus==="stun"?.6:2.5);}if(e.stateTime<=0){e.state="recover";e.stateTime=.38;e.attackCd=e.boss?.8:(e.attack?.cooldown||1.5);}return;}
    if(e.state==="hit"||e.state==="special"||e.state==="recover"){e.stateTime-=dt;moveEntity(e,e.vx*dt,e.vy*dt,e.radius*.65);e.vx*=Math.pow(.04,dt);e.vy*=Math.pow(.04,dt);if(e.stateTime<=0)e.state="chase";return;}
    if(e.state==="windup"){e.stateTime-=dt;e.vx*=.7;e.vy*=.7;if(e.stateTime<=0)performEnemyAttack(e);return;}
    const range=e.boss?e.radius+p.radius+28:e.attack.range;if(d<range&&e.attackCd<=0){e.state="windup";e.pendingAttack=e.boss?"bossMelee":e.attack.id;e.stateTime=e.boss?.42:e.attack.windup;e.targetX=p.x;e.targetY=p.y;e.vx=e.vy=0;return;}
    if(d<(e.boss?430:Math.max(300,e.attack.range+40))){e.state="chase";const speed=e.speed*(game.biome===4&&game.altars.filter(a=>a.lit).length<2?1.12:1)*(e.statuses.slow?.58:1);const preferred=e.boss?55:(e.attack.range>180?e.attack.range*.72:32);if(d>preferred){e.vx=dx/d*speed;e.vy=dy/d*speed;moveEntity(e,e.vx*dt,e.vy*dt,e.radius*.7);}else{e.vx=e.vy=0;}}
    else{e.state="patrol";e.phase+=dt;const tx=e.homeX+Math.cos(e.phase*.7)*45,ty=e.homeY+Math.sin(e.phase*.53)*45,pd=Math.hypot(tx-e.x,ty-e.y)||1;moveEntity(e,(tx-e.x)/pd*e.speed*.28*dt,(ty-e.y)/pd*e.speed*.28*dt,e.radius*.7);}
  }

  function updatePlayer(dt) {
    const p = game.player; const st = stats();
    p.invuln -= dt; p.attackCd -= dt; p.dash -= dt;p.activeCd1=Math.max(0,(p.activeCd1||0)-dt);p.activeCd2=Math.max(0,(p.activeCd2||0)-dt);p.recoveryPose=Math.max(0,(p.recoveryPose||0)-dt); p.hurtFx = Math.max(0,(p.hurtFx||0)-dt); p.statusTick = (p.statusTick||0)-dt;
    p.statuses ||= {};
    Object.keys(p.statuses).forEach(k=>{p.statuses[k]-=dt;if(p.statuses[k]<=0)delete p.statuses[k];});
    if(p.statusTick<=0&&(p.statuses.burn||p.statuses.poison)){p.statusTick=.65;const dot=p.statuses.burn?stats().maxHp*.025:stats().maxHp*.018;game.save.player.hp-=dot;numberFx(p.x,p.y-28,`-${Math.ceil(dot)}`,p.statuses.burn?"#ff8a43":"#99db4d");spawnImpact(p.x,p.y,p.statuses.burn?1:3,34,.35);if(game.save.player.hp<=0)die();}
    game.save.player.stamina = Math.min(100, game.save.player.stamina + 25 * dt);
    if (game.save.skills.survival.renewal && game.save.player.hp < st.maxHp * .2) game.save.player.hp = Math.min(st.maxHp, game.save.player.hp + st.maxHp * .05 * dt);
    let ix = (game.keys.has("KeyD") || game.keys.has("ArrowRight") ? 1 : 0) - (game.keys.has("KeyA") || game.keys.has("ArrowLeft") ? 1 : 0);
    let iy = (game.keys.has("KeyS") || game.keys.has("ArrowDown") ? 1 : 0) - (game.keys.has("KeyW") || game.keys.has("ArrowUp") ? 1 : 0);
    if(p.statuses.stun){ix=iy=0;}if(p.statuses.charm){ix*=-1;iy*=-1;}
    const len = Math.hypot(ix, iy) || 1; ix /= len; iy /= len;
    p.running=!!(p.runKey&&game.keys.has(p.runKey)&&performance.now()<p.runUntil);
    if ((ix || iy) && p.dash <= 0&&!p.swing) setPlayerAim(ix,iy);
    if (p.dash <= 0) {
      const ice = game.biome === 2 && game.scene === "expedition";
      const grip = ice ? .07 : .28;
      const statusSpeed=p.statuses.slow?.58:1;
      const pace=p.running?1.52:1;
      p.vx = lerp(p.vx, ix * st.moveSpeed*statusSpeed*pace, 1 - Math.pow(grip, dt * 12));
      p.vy = lerp(p.vy, iy * st.moveSpeed*statusSpeed*pace, 1 - Math.pow(grip, dt * 12));
    }
    moveEntity(p, p.vx * dt, p.vy * dt, p.radius);
    if(game.scene==="camp"){p.x=clamp(p.x,28,W-28);p.y=clamp(p.y,185,H-42);}
    if (p.dash > 0 && Math.random() < .6) game.particles.push({ x: p.x, y: p.y, vx: -p.vx * .08, vy: -p.vy * .08, life: .25, max: .25, color: "#aee5ff", size: 6 });
    if (p.swing) {
      p.swing.t -= dt; const swing = p.swing;
      if (swing.t < swing.max * .76 && swing.t > swing.max * .18) {
        if(swing.weaponType==="staff"&&!swing.fired){swing.fired=true;const mult=swing.combo===3?1.75:1,spread=swing.combo===3?[-.16,0,.16]:[0];spread.forEach(off=>{const a=Math.atan2(swing.dy,swing.dx)+off;spawnProjectile({x:p.x+swing.dx*18,y:p.y+swing.dy*18,dx:Math.cos(a),dy:Math.sin(a),speed:330,damage:st.attack*swing.profile.damage*mult,team:"player",effect:3,radius:11,pierce:swing.combo===3?2:0});});beep(520,.09,"sine",.03);}
        const reach=swing.profile.reach+(swing.combo===3?(swing.weaponType==="sword"?34:swing.weaponType==="axe"?22:14):0),hitX=p.x+swing.dx*reach,hitY=p.y+swing.dy*reach;
        game.enemies.forEach(e => {
          if (e.dead || swing.hits.has(e) || swing.weaponType==="staff") return;
          const radialFinisher=swing.combo===3&&["sword","axe"].includes(swing.weaponType),range=e.radius+swing.profile.width+(swing.combo===3?(swing.weaponType==="axe"?28:12):0)+(radialFinisher?reach*.65:0),distance=radialFinisher?dist(e,p):pointSegmentDistance(e.x,e.y,p.x,p.y,hitX,hitY);
          if (distance < range) {
            swing.hits.add(e); let mult = (swing.combo === 1 ? 1 : swing.combo === 2 ? 1.15 : 1.7)*swing.profile.damage;
            if (swing.combo === 3 && game.save.skills.fury.finisher) mult *= 2;
            if (Object.values(game.save.equipment.equipped).some(i => i && i.legendary?.id === "voidheart") && game.save.player.hp < st.maxHp * .3) mult *= 1.25;
            const crit = Math.random() < st.critRate; let damage = st.attack * mult * offensiveMultiplier(e) * (crit ? st.critDamage : 1);
            const knock = (swing.combo===3?swing.profile.knock*1.7:swing.profile.knock)*(game.save.skills.fury.finisher&&swing.combo===3?2:1);
            damageEnemy(e, damage, crit, swing.dx * knock, swing.dy * knock);
            rollOffensiveAffixes(e);
            spawnImpact(e.x,e.y,WEAPON_TYPES.indexOf(swing.weaponType),swing.weaponType==="axe"?72:48);
            const steal = st.lifeSteal + (Object.values(game.save.equipment.equipped).some(i => i && i.legendary?.id === "bloodblade") ? .05 : 0);
            if (steal > 0) game.save.player.hp = Math.min(st.maxHp, game.save.player.hp + damage * steal);
          }
        });
      }
      if (swing.t <= 0) {if(swing.combo===3)p.recoveryPose=.34;p.swing = null;}
    }
    if (game.scene === "expedition" && game.world) {
      const tx = Math.floor(p.x / TILE), ty = Math.floor(p.y / TILE); game.world.revealed.add(`${tx},${ty}`);
      for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) game.world.revealed.add(`${tx + xx},${ty + yy}`);
      if (game.biome === 1 && game.world.tiles[ty]?.[tx] === 6) damagePlayer(11 + game.depth * 2, p.x - 1, p.y);
    }
  }

  function updateAmbientHazard(dt) {
    if (game.scene !== "expedition" || game.biome !== 3) return;
    game.hazardTimer -= dt;
    if (game.hazardTimer <= 0) {
      game.hazardTimer = 2.4 + Math.random() * 2.5;
      const p = game.player; game.telegraphs.push({ type: "circle", x: p.x + (Math.random() - .5) * 80, y: p.y + (Math.random() - .5) * 80, r: 28, life: .82, max: .82, damage: 18 + game.depth * 4, color: "#c99cff" });
    }
  }

  function updateEffects(dt) {
    for (let i = game.particles.length - 1; i >= 0; i--) {
      const p = game.particles[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(.08, dt); p.vy *= Math.pow(.08, dt);
      if (p.life <= 0) game.particles.splice(i, 1);
    }
    for (let i = game.numbers.length - 1; i >= 0; i--) {
      const n = game.numbers[i]; n.life -= dt; n.y += n.vy * dt;
      if (n.life <= 0) game.numbers.splice(i, 1);
    }
    for(let i=game.impacts.length-1;i>=0;i--){game.impacts[i].life-=dt;if(game.impacts[i].life<=0)game.impacts.splice(i,1);}
  }

  function updateProjectiles(dt){
    for(let i=game.projectiles.length-1;i>=0;i--){const q=game.projectiles[i];q.life-=dt;q.spin+=dt*7;if(q.homing){const target=q.team==="enemy"?game.player:game.enemies.filter(e=>!e.dead).sort((a,b)=>dist(a,q)-dist(b,q))[0];if(target){const speed=Math.hypot(q.vx,q.vy),a=Math.atan2(target.y-q.y,target.x-q.x),wantedX=Math.cos(a)*speed,wantedY=Math.sin(a)*speed;q.vx=lerp(q.vx,wantedX,Math.min(1,q.homing*dt));q.vy=lerp(q.vy,wantedY,Math.min(1,q.homing*dt));}}
      q.x+=q.vx*dt;q.y+=q.vy*dt;let remove=q.life<=0||!isWalkable(q.x,q.y);
      if(!remove&&q.team==="enemy"&&dist(q,game.player)<q.radius+game.player.radius){if(damagePlayer(q.damage,q.x,q.y))applyPlayerStatus(q.status,q.status==="stun"?.65:2.8);if(q.monsterFx)spawnMonsterFx(q.x,q.y,q.monsterFx.col,q.monsterFx.row,Math.atan2(q.vy,q.vx),68,.32);else spawnImpact(q.x,q.y,q.effect,48);remove=true;}
      if(!remove&&q.team==="player"){for(const e of game.enemies){if(e.dead||q.hit?.has(e)||dist(q,e)>=q.radius+e.radius)continue;q.hit||=(new Set());q.hit.add(e);const crit=Math.random()<stats().critRate;damageEnemy(e,q.damage*offensiveMultiplier(e,true)*(crit?stats().critDamage:1),crit,q.vx*.18,q.vy*.18);rollOffensiveAffixes(e);spawnImpact(q.x,q.y,q.effect,54);if(q.pierce>0)q.pierce--;else remove=true;break;}}
      if(remove)game.projectiles.splice(i,1);
    }
  }

  function update(dt) {
    if (game.paused || game.scene === "title" || isModalOpen()) return;
    game.zoneTime += dt; game.save.playtime += dt; game.autosave += dt;
    if (game.autosave >= 30) { game.autosave = 0; saveGame(true); }
    updatePlayer(dt); updateEffects(dt);
    if (game.scene === "expedition") {
      game.enemies.forEach(e => updateEnemy(e, dt)); updateTelegraphs(dt); updateProjectiles(dt); updateAmbientHazard(dt);
      game.enemies = game.enemies.filter(e => !e.dead || e.boss || Math.random() > dt * 2);
    }
    game.screenShake = Math.max(0, game.screenShake - dt * 25);
    updateCamera(dt); updateHUD();
  }

  function updateCamera(dt) {
    let maxX = W, maxY = H;
    if (game.world) { maxX = game.world.cols * TILE; maxY = game.world.rows * TILE; }
    const tx = clamp(game.player.x - W / 2, 0, Math.max(0, maxX - W));
    const ty = clamp(game.player.y - H / 2, 0, Math.max(0, maxY - H));
    game.camera.x = lerp(game.camera.x, tx, 1 - Math.pow(.001, dt)); game.camera.y = lerp(game.camera.y, ty, 1 - Math.pow(.001, dt));
  }

  const BIOME_ART_KEYS = ["forest","waste","tundra","peaks","abyss"];
  function drawAtlasCell(img,col,row,cols,rows,x,y,w,h,{flip=false,rotation=0,alpha=1,filter="none"}={}){
    if(!img?.complete||!img.naturalWidth)return false;const sw=img.naturalWidth/cols,sh=img.naturalHeight/rows;
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(flip?-1:1,1);ctx.globalAlpha*=alpha;ctx.filter=filter;ctx.drawImage(img,col*sw,row*sh,sw,sh,-w/2,-h/2,w,h);ctx.restore();return true;
  }
  function drawBiomeObject(col,x,y,size,opts={}){return drawAtlasCell(ART[BIOME_ART_KEYS[game.biome]],col,1,5,2,x,y,size,size,opts);}
  function drawEffect(index,x,y,size,opts={}){return drawAtlasCell(ART.effects,index%5,Math.floor(index/5),5,3,x,y,size,size,opts);}
  function drawMonsterEffect(col,row,x,y,size,opts={}){return drawAtlasCell(ART.monsterEffects,col,row,5,4,x,y,size,size,opts);}
  function drawEquipmentLayer(col,row,x,y,w,h,opts={}){return drawAtlasCell(ART.equipmentLayers,col,row,5,4,x,y,w,h,opts);}
  function drawTreantEffect(frame,x,y,w,h,opts={}){return drawAtlasCell(ART.treantRoots,clamp(frame,0,3),0,4,1,x,y,w,h,opts);}
  function drawSwordWave(x,y,size,opts={}){return drawAtlasCell(ART.swordWave,0,0,1,1,x,y,size,size,opts);}

  function drawCamp(time) {
    const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,"#141b2b");grad.addColorStop(1,"#1b211f");ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=TILE)for(let x=0;x<W;x+=TILE){if(!drawAtlasCell(ART.terrain,0,0,5,2,x+TILE/2,y+TILE/2,TILE,TILE)){ctx.fillStyle="#28322b";ctx.fillRect(x,y,TILE,TILE);}}
    ctx.fillStyle="rgba(8,10,17,.74)";ctx.fillRect(0,0,W,165);
    for (let i = 0; i < 5; i++) {
      const px=170+i*235,unlocked=game.save.progress.unlocked.includes(i),img=ART[BIOME_ART_KEYS[i]],pulse=1+Math.sin(time*2+i)*.035;drawAtlasCell(img,2,1,5,2,px,102,112*pulse,112*pulse,{alpha:unlocked?1:.28,filter:unlocked?"none":"grayscale(1)"});
    }
    drawAtlasCell(ART.waste,4,1,5,2,205,492,150+Math.sin(time*5)*3,150+Math.sin(time*5)*3);drawAtlasCell(ART.forest,4,1,5,2,1050,492,145,145,{alpha:.9});
    drawPlayer(game.player, time);
    ctx.fillStyle = "#fff1bf"; ctx.font = "700 14px Microsoft YaHei"; ctx.textAlign = "center"; ctx.fillText("星门 [M]", W / 2, 188); ctx.fillText("元素铁匠铺 [B]", 205, 390); ctx.textAlign = "left";
  }

  function drawTile(tx, ty, tile, b, time) {
    const x = tx * TILE, y = ty * TILE;
    if(!drawAtlasCell(ART.terrain,game.biome,tile===0?1:0,5,2,x+TILE/2,y+TILE/2,TILE+1,TILE+1)){ctx.fillStyle=tile===0?b.wall:b.floor;ctx.fillRect(x,y,TILE,TILE);}if(tile===0)return;
    if(tile===6)drawBiomeObject(3,x+TILE/2,y+TILE/2,48+Math.sin(time*4+tx)*2);
    if (tile === 4) {
      const locked=game.world.exitLocked,pulse=1+Math.sin(time*3)*.05;drawBiomeObject(2,x+TILE/2,y-6,74*pulse,{alpha:locked?.45:1,filter:locked?"grayscale(.8)":"none"});ctx.save();ctx.translate(x+TILE/2,y+TILE/2);ctx.rotate(time*(locked?.4:1.2));ctx.strokeStyle=locked?"#a33b4f":b.accent;ctx.globalAlpha=.65;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,19+Math.sin(time*4)*3,0,Math.PI*1.5);ctx.stroke();ctx.restore();
    }
  }

  function drawResource(r, time) {
    if(r.gathered)return;const b=BIOMES[game.biome],pulse=Math.sin(time*3+r.x)*2,col=r.type===b.ore?1:0;drawBiomeObject(col,r.x,r.y-6+pulse,r.rich?66:56,{rotation:Math.sin(time*1.4+r.y)*.025});ctx.save();ctx.globalAlpha=.5+.35*Math.sin(time*5+r.x);ctx.fillStyle=b.accent;ctx.fillRect(r.x-2,r.y-30+pulse,4,4);if(r.rich){ctx.strokeStyle="#fff0a8";ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y-4,28+Math.sin(time*4)*2,0,Math.PI*2);ctx.stroke();}ctx.restore();
  }

  function drawAltar(a, time) {
    const pulse=1+Math.sin(time*4+a.x)*.045;drawBiomeObject(4,a.x,a.y-10,76*pulse,{alpha:a.lit?1:.55,filter:a.lit?"none":"grayscale(.7)"});if(a.lit){ctx.save();ctx.globalAlpha=.22+.1*Math.sin(time*5);ctx.fillStyle=BIOMES[game.biome].accent;ctx.beginPath();ctx.arc(a.x,a.y-15,48,0,Math.PI*2);ctx.fill();ctx.restore();}
  }

  function drawEnemy(e, time) {
    if(e.dead)return;const flying=(game.biome===2&&e.typeIndex===0)||(game.biome===3&&[0,2,3].includes(e.typeIndex))||(game.biome===4&&[0,2,3].includes(e.typeIndex)),slime=game.biome===0&&e.typeIndex===0,bob=flying?Math.sin(time*4+e.phase)*6:Math.sin(time*2.4+e.phase)*1.8;let sx=1,sy=1,rot=0;if(slime){sx=1+Math.sin(time*5+e.phase)*.08;sy=1-Math.sin(time*5+e.phase)*.07;}if(e.state==="windup"){sx*=.9+Math.sin(time*18)*.04;sy*=1.08;}if(e.state==="charge")rot=Math.atan2(e.vy,e.vx)*.08;
    const size=e.boss?132:(e.elite?78:66),img=ART[BIOME_ART_KEYS[game.biome]];if(e.elite)drawAtlasCell(ART.eliteLoot,game.biome,0,5,2,e.x,e.y+e.radius*.58,92+Math.sin(time*5)*4,48,{alpha:.82});ctx.save();ctx.translate(e.x,e.y+bob);ctx.scale(sx,sy);drawAtlasCell(img,e.boss?4:e.typeIndex,0,5,2,0,-size*.08,size,size,{flip:e.vx<-.5,rotation:rot,filter:e.flash>0?"brightness(3) saturate(0)":"none"});ctx.restore();
    if(e.state==="windup"){ctx.fillStyle="#ffdfb0";ctx.font="900 10px Microsoft YaHei";ctx.textAlign="center";ctx.fillText(e.boss?"重击":e.attack.name,e.x,e.y-size*.58-8);ctx.textAlign="left";}if(!e.boss&&e.hp<e.maxHp){ctx.fillStyle="#1a1015";ctx.fillRect(e.x-20,e.y-size*.48,40,5);ctx.fillStyle=e.elite?"#ffd15c":"#e45a55";ctx.fillRect(e.x-20,e.y-size*.48,40*Math.max(0,e.hp/e.maxHp),5);}Object.keys(e.statuses||{}).forEach((s,i)=>drawEffect({burn:11,slow:12,poison:13,stun:14}[s]??10,e.x-13+i*13,e.y-size*.58-19,24,{alpha:.9}));
  }

  function drawPlayer(p, time) {
    const type=equippedWeaponType(),speed=Math.hypot(p.vx,p.vy),moving=speed>12,row=p.swing?3:p.recoveryPose>0?4:moving?1:0,angle=p.swing?Math.atan2(p.swing.dy,p.swing.dx):(Number.isFinite(p.aimAngle)?p.aimAngle:Math.atan2(p.dirY,p.dirX)),ax=Math.cos(angle),ay=Math.sin(angle),dirCol=Math.abs(ax)>=Math.abs(ay)?(ax>=0?0:2):(ay>=0?1:3),cycle=p.running?12:moving?9:2.5,bob=p.dash>0?0:Math.sin(time*cycle)*(p.running?2.2:moving?1.8:1),tilt=moving?Math.sin(time*cycle)*.014:0,equipped=game.save.equipment.equipped;
    const blinkAlpha=p.invuln>0&&Math.floor(time*18)%2?.46:1;ctx.save();ctx.globalAlpha=blinkAlpha;
    if(equipped.amulet){const c=BIOMES[equipped.amulet.region||0].accent;ctx.globalAlpha=blinkAlpha*(.18+.05*Math.sin(time*5));ctx.fillStyle=c;ctx.beginPath();ctx.arc(p.x,p.y-19,35+Math.sin(time*4)*2,0,Math.PI*2);ctx.fill();ctx.globalAlpha=blinkAlpha;}
    const bodyOpts={rotation:tilt,filter:p.hurtFx>0?"brightness(1.6) saturate(.65)":"none"};
    if(p.running&&moving&&!p.swing&&p.recoveryPose<=0)drawAtlasCell(ART.heroRun,dirCol,Math.floor(time*12)%4,4,4,p.x,p.y-22+bob,82,102,bodyOpts);
    else drawAtlasCell(ART.heroDirectional,dirCol,row,4,5,p.x,p.y-22+bob,82,102,bodyOpts);
    const layerFlip=dirCol===2,backAlpha=dirCol===3?.76:1;
    if(equipped.boots){const c=equipmentCoords(equipped.boots);drawEquipmentLayer(c.col,2,p.x,p.y+9+bob,35,35,{alpha:.88*backAlpha,flip:layerFlip});}
    if(equipped.armor){const c=equipmentCoords(equipped.armor);drawEquipmentLayer(c.col,1,p.x,p.y-21+bob,48,45,{alpha:.9*backAlpha,flip:layerFlip});}
    if(equipped.helmet){const c=equipmentCoords(equipped.helmet);drawEquipmentLayer(c.col,0,p.x,p.y-47+bob,35,34,{alpha:.94*backAlpha,flip:layerFlip});}
    if(equipped.amulet&&dirCol!==3){const c=equipmentCoords(equipped.amulet);drawEquipmentLayer(c.col,3,p.x+(dirCol===0?5:dirCol===2?-5:0),p.y-28+bob,18,18,{alpha:.96,flip:layerFlip});}
    const swingProgress=p.swing?clamp(1-p.swing.t/p.swing.max,0,1):.5,swingDirection=p.swing?.combo===2?-1:1,swingArc=p.swing?swingDirection*lerp(-.68,.58,swingProgress):0,weaponAngle=angle+swingArc,wax=Math.cos(weaponAngle),way=Math.sin(weaponAngle),socket=[{x:15,y:-23},{x:8,y:-19},{x:-15,y:-23},{x:7,y:-27}][dirCol],handX=p.x+socket.x,handY=p.y+socket.y+bob,gripDistance={sword:18,spear:24,axe:19,staff:23,daggers:14}[type]||18,weaponSize=type==="spear"?50:type==="axe"?48:43,weaponX=handX+wax*gripDistance,weaponY=handY+way*gripDistance;
    if(p.swing){const effectSize=(type==="axe"?105:type==="spear"?82:type==="staff"?72:76)+(p.swing.combo===3?18:0),effectDistance=gripDistance+weaponSize*.34,effectX=handX+wax*effectDistance,effectY=handY+way*effectDistance,offset={spear:Math.PI/4,axe:0,staff:Math.PI/4,daggers:2.5}[type]||0;if(type==="sword")drawSwordWave(effectX,effectY,effectSize,{rotation:weaponAngle,alpha:.82});else drawEffect(WEAPON_TYPES.indexOf(type),effectX,effectY,effectSize,{rotation:weaponAngle+offset,alpha:.78});drawEffect(10,handX,handY,19+(p.swing.combo===3?5:0),{rotation:weaponAngle,alpha:.58});}
    if(equipped.weapon){const c=equipmentCoords(equipped.weapon),weaponRotation={sword:Math.PI/4,spear:Math.PI/4,axe:Math.PI*.75,staff:Math.PI/3,daggers:Math.PI/4}[type]||Math.PI/4;drawAtlasCell(ART.equipment,c.col,c.row,5,5,weaponX,weaponY,weaponSize,weaponSize,{rotation:weaponAngle+weaponRotation,alpha:.98});}
    ctx.restore();
    const statuses=Object.keys(p.statuses||{});statuses.forEach((s,i)=>{const idx={burn:11,slow:12,poison:13,stun:14,charm:9}[s];drawEffect(idx,p.x-18+i*12,p.y-55,25,{alpha:.82});});
  }

  function drawTelegraph(t){const pct=1-t.life/t.max;ctx.save();ctx.globalAlpha=.16+pct*.48;ctx.fillStyle=t.color;ctx.strokeStyle=t.color;ctx.lineWidth=3;if(t.type==="circle"){ctx.beginPath();ctx.arc(t.x,t.y,t.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(t.x,t.y,t.r*(.2+pct*.8),0,Math.PI*2);ctx.stroke();}else if(t.type==="line"){ctx.lineWidth=t.width*2;ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.lineTo(t.x2,t.y2);ctx.stroke();ctx.globalAlpha=.9;ctx.lineWidth=2;ctx.setLineDash([9,7]);ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.lineTo(t.x2,t.y2);ctx.stroke();if(t.specialFx==="treantRoots"){ctx.setLineDash([]);const angle=Math.atan2(t.y2-t.y,t.x2-t.x),length=Math.hypot(t.x2-t.x,t.y2-t.y),segments=Math.max(3,Math.ceil(length/88)),frame=Math.min(3,Math.floor(pct*4));for(let i=0;i<segments;i++){const q=(i+.5)/segments;drawTreantEffect(frame,lerp(t.x,t.x2,q),lerp(t.y,t.y2,q),length/segments*1.15,45+pct*14,{rotation:angle,alpha:.38+pct*.44});}}}else{ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.arc(t.x,t.y,t.range,t.angle-t.arc/2,t.angle+t.arc/2);ctx.closePath();ctx.fill();}ctx.restore();}
  function drawProjectile(q){const a=Math.atan2(q.vy,q.vx);if(q.monsterFx)drawMonsterEffect(q.monsterFx.col,q.monsterFx.row,q.x,q.y,q.radius*5.6,{rotation:a,alpha:.96});else drawEffect(q.effect,q.x,q.y,q.radius*3.8,{rotation:a+(q.team==="player"&&q.effect===3?Math.PI/4:0),alpha:.96});}
  function drawImpactFx(f){const pct=1-f.life/f.max;if(f.treantFx)drawTreantEffect(Math.min(3,Math.floor(pct*4)),f.x,f.y,f.width,f.height*(.7+pct*.3),{rotation:f.rotation,alpha:1-pct*.72});else if(f.monsterFx)drawMonsterEffect(f.monsterFx.col,f.monsterFx.row,f.x,f.y,f.size*(.65+pct*.55),{rotation:f.rotation,alpha:1-pct});else drawEffect(f.effect,f.x,f.y,f.size*(.55+pct*.65),{rotation:f.rotation,alpha:1-pct});}

  function drawGroundDrop(d,time){d.life=(d.life||0)+1/60;const bob=Math.sin(time*4+d.x*.02)*3,pulse=.78+.2*Math.sin(time*5+d.y*.03);ctx.save();ctx.globalAlpha=.2+pulse*.12;ctx.fillStyle=d.kind==="equipment"?qualityById(d.item.quality).color:d.kind==="potion"?"#79ef91":BIOMES[game.biome].accent;ctx.beginPath();ctx.ellipse(d.x,d.y+11,25,9,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;if(d.kind==="equipment"){const c=equipmentCoords(d.item);drawAtlasCell(ART.equipment,c.col,c.row,5,5,d.x,d.y-8+bob,48,48);ctx.strokeStyle=qualityById(d.item.quality).color;ctx.strokeRect(d.x-20,d.y-28+bob,40,40);}else if(d.kind==="potion")drawAtlasCell(ART.eliteLoot,game.biome,1,5,2,d.x,d.y-7+bob,46,46);else{const c=materialCoords(d.material);drawAtlasCell(ART.materials,c.col,c.row,5,4,d.x,d.y-7+bob,44,44);}ctx.restore();}

  function drawAmbient(time){const bx=game.camera.x,by=game.camera.y;ctx.save();if(game.biome===0){for(let i=0;i<8;i++){const x=bx+((i*211+time*13)% (W+260))-130,y=by+90+(i*83)%H;const g=ctx.createRadialGradient(x,y,0,x,y,90);g.addColorStop(0,"rgba(170,220,175,.09)");g.addColorStop(1,"rgba(80,130,90,0)");ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,120,38,0,0,Math.PI*2);ctx.fill();}}else{for(let i=0;i<34;i++){let x=bx+(i*97+(game.biome===3?time*150:time*(18+game.biome*13)))%W,y=by+(i*61+(game.biome===2?time*70:-time*24))%H;ctx.globalAlpha=.25+(i%5)*.1;ctx.fillStyle=game.biome===1?"#ff9b4c":game.biome===2?"#e8fbff":game.biome===3?"#a98cff":"#e34db3";if(game.biome===2){ctx.fillRect(x,y,3,7);}else if(game.biome===3){ctx.fillRect(x,y,2,12);}else{ctx.fillRect(x,y,3,3);}}}ctx.restore();}

  function drawWorld(time) {
    const w = game.world, b = BIOMES[game.biome]; ctx.fillStyle = b.wall; ctx.fillRect(0, 0, w.cols * TILE, w.rows * TILE);
    const minX = Math.max(0, Math.floor(game.camera.x / TILE) - 1), maxX = Math.min(w.cols, Math.ceil((game.camera.x + W) / TILE) + 1);
    const minY = Math.max(0, Math.floor(game.camera.y / TILE) - 1), maxY = Math.min(w.rows, Math.ceil((game.camera.y + H) / TILE) + 1);
    for (let y = minY; y < maxY; y++) for (let x = minX; x < maxX; x++) drawTile(x, y, w.tiles[y][x], b,time);
    game.resources.forEach(r => drawResource(r, time)); game.altars.forEach(a => drawAltar(a, time));game.groundDrops.forEach(d=>drawGroundDrop(d,time));
    game.telegraphs.forEach(drawTelegraph);game.projectiles.forEach(drawProjectile);
    [...game.enemies.filter(e => !e.dead), game.player].sort((a,b2) => a.y - b2.y).forEach(e => e === game.player ? drawPlayer(e, time) : drawEnemy(e, time));
    game.impacts.forEach(drawImpactFx);
    game.particles.forEach(p => { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); }); ctx.globalAlpha = 1;
    game.numbers.forEach(n => { ctx.globalAlpha = Math.max(0, n.life); ctx.font = "900 13px Microsoft YaHei"; ctx.textAlign = "center"; ctx.fillStyle = "#000"; ctx.fillText(n.text, n.x + 2, n.y + 2); ctx.fillStyle = n.color; ctx.fillText(n.text, n.x, n.y); }); ctx.globalAlpha = 1; ctx.textAlign = "left";
    drawAmbient(time);if (game.biome === 0 || game.biome === 4) drawDarkness();
  }

  function drawDarkness() {
    const lit = game.biome === 4 ? game.altars.filter(a => a.lit).length : 0;
    const radius = game.biome === 0 ? 205 : 120 + lit * 90;
    ctx.save(); const g = ctx.createRadialGradient(game.player.x, game.player.y, radius * .35, game.player.x, game.player.y, radius); g.addColorStop(0, "rgba(5,7,12,0)"); g.addColorStop(.7, game.biome === 0 ? "rgba(16,29,22,.18)" : "rgba(4,2,10,.12)"); g.addColorStop(1, game.biome === 0 ? "rgba(10,19,15,.87)" : "rgba(2,1,7,.96)"); ctx.fillStyle = g; ctx.fillRect(game.camera.x, game.camera.y, W, H); ctx.restore();
  }

  function render(timeMs) {
    const time = timeMs / 1000; ctx.save();
    const shakeX = game.screenShake ? (Math.random() - .5) * game.screenShake : 0, shakeY = game.screenShake ? (Math.random() - .5) * game.screenShake : 0;
    ctx.translate(Math.round(-game.camera.x + shakeX), Math.round(-game.camera.y + shakeY));
    if (game.scene === "camp") drawCamp(time); else if (game.scene === "expedition" && game.world) drawWorld(time); else { ctx.fillStyle = "#0b0d16"; ctx.fillRect(0,0,W,H); }
    ctx.restore(); drawMinimap();
  }

  function drawMinimap() {
    mctx.clearRect(0, 0, minimap.width, minimap.height);
    if (game.scene === "camp" || !game.world) {
      mctx.fillStyle = "#1d2230"; mctx.fillRect(0,0,150,96); mctx.fillStyle = "#f2bd58"; mctx.fillRect(72,42,6,6); mctx.fillStyle = "#9a8b78"; mctx.font = "10px Microsoft YaHei"; mctx.fillText("星火营地",54,65); return;
    }
    const w = game.world, sx = minimap.width / w.cols, sy = minimap.height / w.rows, b = BIOMES[game.biome];
    for (let y = 0; y < w.rows; y++) for (let x = 0; x < w.cols; x++) {
      if (!w.revealed.has(`${x},${y}`)) continue; const t = w.tiles[y][x]; mctx.fillStyle = t === 0 ? "#101018" : t === 4 ? (w.exitLocked ? "#e45059" : "#ffe878") : b.color; mctx.fillRect(x*sx,y*sy,Math.ceil(sx),Math.ceil(sy));
    }
    const boss = game.enemies.find(e => e.boss && !e.dead); if (boss) { mctx.fillStyle = "#ff4f62"; mctx.fillRect(boss.x/TILE*sx-2,boss.y/TILE*sy-2,5,5); }
    mctx.fillStyle = "#fff"; mctx.fillRect(game.player.x/TILE*sx-2,game.player.y/TILE*sy-2,5,5);
  }

  function loop(now) {
    const raw = Math.min(.034, (now - game.lastTime) / 1000 || 0); game.lastTime = now;
    if (game.hitStop > 0) game.hitStop -= raw; else update(raw);
    render(now); requestAnimationFrame(loop);
  }

  function updateHUD() {
    if (game.scene === "title") return;
    const st = stats(), p = game.save.player, need = xpNeeded();
    p.hp = clamp(p.hp, 0, st.maxHp);
    $("hud-level").textContent = `LV.${p.level}`;
    $("hp-fill").style.width = `${p.hp / st.maxHp * 100}%`; $("hp-text").textContent = `${fmt(p.hp)} / ${fmt(st.maxHp)}`;
    $("stamina-fill").style.width = `${p.stamina}%`; $("stamina-text").textContent = `${fmt(p.stamina)} / 100`;
    $("xp-fill").style.width = `${p.xp / need * 100}%`; $("xp-text").textContent = `${fmt(p.xp)} / ${fmt(need)}`;
    $("gold-text").textContent = fmt(game.save.currencies.gold); $("void-text").textContent = fmt(game.save.currencies.void); $("potion-text").textContent = `×${p.potions}`;
    $("bag-badge").textContent = game.unseenItems ? `+${game.unseenItems} 新 · ${game.save.equipment.inventory.length}/30` : `${game.save.equipment.inventory.length} / 30`;
    $("inventory-btn").classList.toggle("has-new", game.unseenItems > 0);
    $("return-dock-btn")?.classList.toggle("hidden",game.scene!=="expedition");
    $("sp-badge").textContent = game.save.player.skillPoints ? `${game.save.player.skillPoints} 点可用` : "0 点";
    if (game.scene === "camp") {
      $("area-name").textContent = "星火营地"; $("depth-text").textContent = "安全区 · 可自由移动"; $("quest-text").textContent = "WASD 在营地移动；按 M 选择远征，按 B 打造装备";
      $("boss-wrap").classList.add("hidden"); return;
    }
    const b = BIOMES[game.biome]; $("area-name").textContent = b.name; $("depth-text").textContent = `深度 ${game.depth} / 5 · ${b.mechanic}`;
    const boss = game.enemies.find(e => e.boss && !e.dead);
    if (boss) {
      $("boss-wrap").classList.remove("hidden"); $("boss-name").textContent = boss.name; $("boss-fill").style.width = `${Math.max(0,boss.hp / boss.maxHp * 100)}%`;
      $("quest-text").textContent = `击败区域领主「${boss.name}」，解除星门封锁`;
    } else {
      $("boss-wrap").classList.add("hidden");
      const ex = { x: (game.world.exit.x + .5) * TILE, y: (game.world.exit.y + .5) * TILE };
      const nearby = game.resources.find(r => !r.gathered && dist(r, game.player) < 55);
      const drop = game.groundDrops.find(d=>dist(d,game.player)<65);
      const altar = game.altars.find(a => !a.lit && dist(a, game.player) < 60);
      if(drop) $("quest-text").textContent=`按 E 拾取${drop.kind==="equipment"?drop.item.name:drop.kind==="potion"?"生命药水":MATERIAL_NAMES[drop.material]}`;
      else if (altar) $("quest-text").textContent = "按 E 点燃深渊祭坛，扩展视野";
      else if (nearby) $("quest-text").textContent = `按 E 开采${MATERIAL_NAMES[nearby.type]}`;
      else if (dist(ex, game.player) < 80) $("quest-text").textContent = `按 E 进入${game.depth < 5 ? "下一深度" : "返程星门"}`;
      else $("quest-text").textContent = game.depth === 5 ? "穿越迷宫，寻找盘踞核心的区域领主" : "探索地图、采集资源并寻找远端星门";
    }
  }

  function openPanel(id) {
    document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
    const panel = $(id); if (!panel) return;
    if (id === "continent-panel") renderContinentPanel();
    if (id === "character-panel") renderCharacterPanel();
    if (id === "skills-panel") renderSkills();
    if (id === "forge-panel") renderForge();
    if (id === "save-panel") renderSavePanel();
    panel.classList.remove("hidden"); game.paused = true;
  }

  function closePanel(id) {
    $(id)?.classList.add("hidden");
    if (game.scene !== "title" && $("death-panel").classList.contains("hidden")) game.paused = false;
    $("tooltip").classList.add("hidden");
  }

  function closeAllModals() {
    document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
    $("tooltip").classList.add("hidden"); if (game.scene !== "title") game.paused = false;
  }

  function renderSavePanel(){const root=$("save-slots");if(!root)return;const entries=[{name:"自动存档",loaded:readSavedGame(),auto:true},...SLOT_SAVE_KEYS.map((k,i)=>({name:`手动存档 ${i+1}`,loaded:readSaveKey(k,`slot-${i+1}`),index:i}))];root.innerHTML="";entries.forEach(entry=>{const l=entry.loaded,node=document.createElement("article"),place=l?.session?.scene==="expedition"?`${BIOMES[l.session.biome]?.name||"远征"} · 深度 ${l.session.depth}/5`:l?"星火营地":"空档位",when=l?.savedAt?new Date(l.savedAt).toLocaleString("zh-CN"):"尚未保存";node.className=`save-slot ${entry.auto?"current":""}`;node.innerHTML=`<div><h3>${entry.name}</h3><p>${place} · ${when}${l?` · LV.${l.save.player.level}`:""}</p></div><div class="save-slot-actions">${l?'<button class="load-slot primary">载入</button>':""}${game.scene!=="title"?`<button class="write-slot">${entry.auto?"覆盖自动档":"保存到此档"}</button>`:""}</div>`;node.querySelector(".load-slot")?.addEventListener("click",()=>loadDecodedGame(l));node.querySelector(".write-slot")?.addEventListener("click",()=>entry.auto?(saveGame(false),renderSavePanel()):saveGameToSlot(entry.index));root.append(node);});}

  function renderContinentPanel() {
    const grid = $("continent-grid"); grid.innerHTML = "";
    BIOMES.forEach((b, i) => {
      const unlocked = game.save.progress.unlocked.includes(i), completed = game.save.progress.completedDepths[i] || 0;
      const card = document.createElement("article"); card.className = `continent-card${unlocked ? "" : " locked"}`; card.style.setProperty("--biome", b.color);
      card.innerHTML = `<span class="continent-index">0${i+1}</span><h3>${b.name}</h3><strong>${b.subtitle}</strong><p>${b.mechanic}</p><ul><li>资源：${b.primaryName} · ${b.oreName}</li><li>领主：${b.boss[0]}</li><li>封印次数：${game.save.progress.bossKills[i] || 0}</li></ul><div class="depth-pips">${[1,2,3,4,5].map(d=>`<i class="${d<=completed?"done":""}"></i>`).join("")}</div><button ${unlocked?"":"disabled"}>${unlocked ? (completed >= 5 ? "再次远征" : "进入大陆") : "击败前域领主解锁"}</button>`;
      card.querySelector("button").addEventListener("click", () => enterFloor(i, 1)); grid.append(card);
    });
  }

  function formatStat(type, value) {
    const percents = ["critRate","critDamage","attackSpeed","dodge","reduction","moveSpeed","lifeSteal","elementalDamage","burnChance","poisonChance","frostChance","stunChance","executeDamage","eliteDamage","projectilePower","rareFind"];
    if (percents.includes(type)) return `${Math.round(value * 1000) / 10}%`;
    return fmt(value);
  }

  function itemTooltip(item) {
    const q = qualityById(item.quality); const mainName = { attack:"攻击力",defense:"防御力",maxHp:"最大生命" }[item.main.type];
    return `<div class="tooltip-top">${itemArtHTML(item,"tooltip-art")}<div><h4 style="color:${q.color}">${q.name} · ${item.name}${item.enhance?` +${item.enhance}`:""}</h4><div>${SLOT_NAMES[item.slot]}${item.slot==="weapon"?` · ${WEAPON_PROFILES[weaponTypeOf(item)].label}`:""} · 物品等级 ${item.level}</div></div></div><div style="color:#fff1b3;margin:6px 0">${mainName} +${itemMainValue(item)}</div>${item.affixes.map(a=>`<div class="${a.special?"special-affix":""}">• ${a.special?"✦ ":""}${a.name} +${formatStat(a.type,a.value)}</div>`).join("")}${item.legendary?`<div style="color:#ffd66b;margin-top:6px">◆ ${item.legendary.name}<br>${item.legendary.text}</div>`:""}<div class="lore">${item.lore}</div>`;
  }

  function bindItemTooltip(node, item) {
    node.addEventListener("pointerenter", e => {
      const tip = $("tooltip"); tip.innerHTML = itemTooltip(item); tip.classList.remove("hidden"); moveTooltip(e);
    });
    node.addEventListener("pointermove", moveTooltip); node.addEventListener("pointerleave", () => $("tooltip").classList.add("hidden"));
  }

  function moveTooltip(e) {
    const tip=$("tooltip"),shell=$("game-shell"),rect=shell.getBoundingClientRect(),scale=rect.width/W||1,pad=7,mouseX=(e.clientX-rect.left)/scale,mouseY=(e.clientY-rect.top)/scale,tipWidth=tip.offsetWidth||240,tipHeight=tip.offsetHeight||180;
    let x=mouseX+pad,y=mouseY+pad;
    if(x+tipWidth>W-6)x=mouseX-tipWidth-pad;if(y+tipHeight>H-6)y=mouseY-tipHeight-pad;
    x=clamp(x,6,W-tipWidth-6);y=clamp(y,6,H-tipHeight-6);
    tip.style.left = `${x}px`; tip.style.top = `${y}px`;
  }

  function renderCharacterPanel() {
    game.unseenItems = 0;
    const equipment = $("equipment-slots"); equipment.innerHTML = "";
    Object.entries(SLOT_NAMES).forEach(([slot, label]) => {
      const item = game.save.equipment.equipped[slot]; const node = document.createElement("div"); node.dataset.slot = slot; node.className = `equipment-slot ${item ? `quality-${item.quality}` : "empty"}`; node.innerHTML = item ? `${itemArtHTML(item)}<b>${item.name}</b><span>${item.main.type === "attack" ? "攻" : item.main.type === "defense" ? "防" : "命"} ${itemMainValue(item)}</span>` : `<span>${label}</span>`;
      if (item) { bindItemTooltip(node,item); node.addEventListener("click",()=>unequip(slot)); } equipment.append(node);
    });
    const doll = $("paperdoll-hero"); if (doll) {doll.style.setProperty("--weapon-col",WEAPON_TYPES.indexOf(equippedWeaponType()));const layers=[["helmet",0],["armor",1],["boots",2],["amulet",3]];if(!doll.querySelector(".doll-layer"))doll.innerHTML=layers.map(([slot,row])=>`<i class="doll-layer doll-${slot}" data-doll-slot="${slot}" style="--layer-row:${row}"></i>`).join("");layers.forEach(([slot])=>{const layer=doll.querySelector(`[data-doll-slot="${slot}"]`),item=game.save.equipment.equipped[slot];layer.classList.toggle("hidden",!item);if(item)layer.style.setProperty("--layer-col",clamp(item.region??0,0,4));});}
    const st = stats(); const rows = [
      ["攻击力",fmt(st.attack)],["防御力",fmt(st.defense)],["最大生命",fmt(st.maxHp)],["暴击率",formatStat("critRate",st.critRate)],
      ["暴击伤害",formatStat("critDamage",st.critDamage)],["攻击速度",formatStat("attackSpeed",st.attackSpeed-1)],["闪避率",formatStat("dodge",st.dodge)],
      ["伤害减免",formatStat("reduction",st.reduction)],["移动速度",formatStat("moveSpeed",st.moveSpeed/124-1)],["生命偷取",formatStat("lifeSteal",st.lifeSteal)],
      ["元素增伤",formatStat("elementalDamage",statValue("elementalDamage"))],["稀有寻获",formatStat("rareFind",statValue("rareFind"))]
    ];
    $("stats-list").innerHTML = rows.map(r=>`<div class="stat-row"><span>${r[0]}</span><b>${r[1]}</b></div>`).join("");
    const inv = game.save.equipment.inventory; $("inventory-count").textContent = `${inv.length} / 30`; const grid = $("inventory-grid"); grid.innerHTML = "";
    inv.forEach(item => { const n=document.createElement("div"); n.className=`item-cell quality-${item.quality}`; n.innerHTML=`${itemArtHTML(item)}<b>${item.name}</b>${item.enhance?`<span class="plus">+${item.enhance}</span>`:""}<button class="sell-btn" title="出售装备">售</button>`; bindItemTooltip(n,item); n.addEventListener("click",()=>equipItem(item.id));n.querySelector(".sell-btn").addEventListener("click",e=>{e.stopPropagation();sellItem(item.id);}); grid.append(n); });
    for(let i=inv.length;i<30;i++){const n=document.createElement("div");n.className="item-cell";grid.append(n);}
    $("materials-list").innerHTML = Object.entries(game.save.materials).filter(([,v])=>v>0).map(([k,v])=>`<div class="material">${materialArtHTML(k)}<span>${MATERIAL_NAMES[k]}</span><b>${v}</b></div>`).join("") || `<div class="hint">尚未获得材料</div>`;
    updateHUD();
  }

  function equipItem(id) {
    const inv=game.save.equipment.inventory, idx=inv.findIndex(i=>i.id===id); if(idx<0)return;
    const item=inv.splice(idx,1)[0], old=game.save.equipment.equipped[item.slot]; if(old)inv.push(old); game.save.equipment.equipped[item.slot]=item;
    game.save.player.hp=Math.min(stats().maxHp,game.save.player.hp); beep(280,.07,"square",.025); renderCharacterPanel(); saveGame(true);
  }

  function unequip(slot) {
    const inv=game.save.equipment.inventory,item=game.save.equipment.equipped[slot]; if(!item||inv.length>=30)return toast("背包已满，无法卸下");
    inv.push(item);game.save.equipment.equipped[slot]=null;game.save.player.hp=Math.min(stats().maxHp,game.save.player.hp);renderCharacterPanel();saveGame(true);
  }

  function sellItem(id){const inv=game.save.equipment.inventory,idx=inv.findIndex(i=>i.id===id);if(idx<0)return;const item=inv[idx],qi=QUALITIES.findIndex(q=>q.id===item.quality)+1,value=Math.max(10,Math.round(item.level*qi*5*(1+item.enhance*.35)));inv.splice(idx,1);game.save.currencies.gold+=value;toast(`出售 ${item.name}，获得 ${value} 金币`,"#f2c65d");beep(360,.08,"triangle",.025);renderCharacterPanel();saveGame(true);}

  function renderSkills() {
    $("sp-text").textContent=game.save.player.skillPoints;const type=equippedWeaponType(),names={sword:"回旋星斩：环身一周击退全部近敌",spear:"贯星突阵：沿瞄准方向穿透冲锋",axe:"陨星震击：大范围重击并强力击退",staff:"五芒散射：发射五枚可穿透星弹",daggers:"瞬影双杀：闪现后连续斩击"};$("active-skills").innerHTML=`<article class="active-skill" data-key="R"><strong>${WEAPON_NAMES[type]}专属战技</strong><p>${names[type]}。消耗 28 耐力，5.2 秒冷却。</p></article><article class="active-skill" data-key="F"><strong>星爆术</strong><p>引爆周身星力并发射十二道星屑。消耗 45 耐力，9 秒冷却。</p></article>`;const root=$("skill-trees");root.innerHTML="";
    SKILL_BRANCHES.forEach(branch=>{const div=document.createElement("div");div.className="skill-branch";div.style.setProperty("--branch",branch.color);div.innerHTML=`<h3>${branch.name}</h3><span class="hint">已投入 ${branchPoints(branch.id)} 点</span>`;
      branch.nodes.forEach(node=>{const [id,name,desc,req,max]=node,level=game.save.skills[branch.id][id],totalSpent=SKILL_BRANCHES.reduce((sum,b)=>sum+branchPoints(b.id),0),reqMet=req===8?totalSpent>=8:branchPoints(branch.id)>=req,available=reqMet&&(level<max);const el=document.createElement("div");el.className=`skill-node ${level?"unlocked":""} ${!available&&level<max?"locked":""}`;el.innerHTML=`<strong>${name}</strong><p>${desc}</p><span>等级 ${level} / ${max}${req?` · 需要${req===8?"总计":"本系"} ${req} 点`:""}</span>`;if(available)el.addEventListener("click",()=>buySkill(branch.id,id,max));div.append(el);});root.append(div);});
  }

  function buySkill(branch,id,max) {
    if(game.save.player.skillPoints<=0)return toast("没有可用技能点","#e86d6d");if(game.save.skills[branch][id]>=max)return;
    const oldMax=stats().maxHp;game.save.skills[branch][id]++;game.save.player.skillPoints--;const newMax=stats().maxHp;game.save.player.hp+=Math.max(0,newMax-oldMax);beep(620,.14,"triangle",.04);renderSkills();updateHUD();saveGame(true);
  }

  function renderForge() {
    document.querySelectorAll("[data-forge-tab]").forEach(b=>b.classList.toggle("active",b.dataset.forgeTab===game.forgeTab));
    if(game.forgeTab==="craft")renderCraft();else if(game.forgeTab==="enhance")renderEnhance();else renderReforge();
  }

  function renderCraft() {
    const unlocked=BIOMES.filter((_,i)=>game.save.progress.unlocked.includes(i));
    $("forge-content").innerHTML=`<div class="forge-layout"><div class="forge-side"><h3>元素配方</h3><select id="craft-region">${unlocked.map(b=>`<option value="${BIOMES.indexOf(b)}">${b.name}</option>`).join("")}</select><p class="hint">采集材料用于打造与药剂；怪物专属稀材可提高品质，领主核心可保底稀有。</p><label class="recipe-item"><span>投入怪物稀材 ×2</span><input id="use-rare" type="checkbox"></label><label class="recipe-item"><span>投入领主核心 ×1</span><input id="use-core" type="checkbox"></label><button id="potion-btn" class="full">炼制生命药水</button></div><div class="forge-main"><div id="furnace" class="furnace">♨</div><div id="craft-recipe" class="recipe-list"></div><button id="craft-btn" class="primary full">点燃熔炉</button></div></div>`;
    const select=$("craft-region");const refresh=()=>{const i=Number(select.value),b=BIOMES[i],gold=35+i*25;$("craft-recipe").innerHTML=`<div class="recipe-item">${materialArtHTML(b.primary)}<span>${b.primaryName}</span><b>${game.save.materials[b.primary]} / 6</b></div><div class="recipe-item">${materialArtHTML(b.ore)}<span>${b.oreName}</span><b>${game.save.materials[b.ore]} / 4</b></div><div class="recipe-item"><span>金币</span><b>${game.save.currencies.gold} / ${gold}</b></div><div class="recipe-item">${materialArtHTML(b.rare)}<span>${b.rareName}</span><b>${game.save.materials[b.rare]||0}</b></div><div class="recipe-item">${materialArtHTML(b.core)}<span>${MATERIAL_NAMES[b.core]}</span><b>${game.save.materials[b.core]||0}</b></div>`;};select.addEventListener("change",refresh);refresh();$("craft-btn").addEventListener("click",()=>craft(Number(select.value),$("use-core").checked,$("use-rare").checked));$("potion-btn").addEventListener("click",()=>brewPotion(Number(select.value)));
  }

  function craft(i,useCore,useRare) {
    const b=BIOMES[i],gold=35+i*25;if(game.save.materials[b.primary]<6||game.save.materials[b.ore]<4||game.save.currencies.gold<gold)return toast("打造材料不足","#ef7268");
    if(useRare&&(game.save.materials[b.rare]||0)<2)return toast(`需要 ${b.rareName} ×2`,"#ef7268");if(useCore&&(game.save.materials[b.core]||0)<1)return toast("尚未获得该领主核心","#ef7268");game.save.materials[b.primary]-=6;game.save.materials[b.ore]-=4;game.save.currencies.gold-=gold;if(useRare)game.save.materials[b.rare]-=2;if(useCore)game.save.materials[b.core]--;
    const furnace=$("furnace");furnace.classList.add("firing");game.paused=true;playSfx("craft");setTimeout(()=>{const item=generateItem(i,5,useCore?2:useRare?1:0,new RNG(Date.now()+"craft"));if(useRare&&!item.affixes.some(a=>a.special)){const rng=new RNG(Date.now()+"rare-catalyst"),a=rng.pick(SPECIAL_AFFIXES);item.affixes.push({type:a[0],name:a[1],value:lerp(a[2],a[3],rng.next())*(1+i*.12),suffix:a[4],special:true});}addItem(item);furnace.classList.remove("firing");renderCraft();updateHUD();saveGame(true);beep(item.quality==="gold"?830:520,.25,"triangle",.05);},850);
  }

  function brewPotion(i){const b=BIOMES[i];if(game.save.player.potions>=8)return toast("药水袋已装满（8 / 8）");if(game.save.materials[b.primary]<3||game.save.materials[b.ore]<1)return toast(`需要 ${b.primaryName} ×3、${b.oreName} ×1`,"#ef7268");game.save.materials[b.primary]-=3;game.save.materials[b.ore]-=1;game.save.player.potions++;toast("炼制生命药水 ×1","#8be89f");beep(480,.18,"sine",.04);renderCraft();updateHUD();saveGame(true);}

  function equippedOptions() {return Object.values(game.save.equipment.equipped).filter(Boolean).map(i=>`<option value="${i.id}">${SLOT_NAMES[i.slot]} · ${i.name} +${i.enhance}</option>`).join("");}
  function findEquipped(id){return Object.values(game.save.equipment.equipped).find(i=>i&&i.id===id);}

  function enhanceChance(level){return level<3?1:[.85,.72,.58,.42,.3,.18,.1][level-3]||.06;}
  function enhanceCosts(item){return{gold:Math.round(35*Math.pow(item.enhance+1,1.55)),ore:2+Math.floor(item.enhance/2),oreKey:BIOMES[item.region||0].ore};}
  function renderEnhance(){
    const options=equippedOptions();if(!options){$("forge-content").innerHTML=`<p class="modal-lead">请先在角色面板装备一件物品。</p>`;return;}
    $("forge-content").innerHTML=`<div class="forge-layout"><div class="forge-side"><h3>强化目标</h3><select id="enhance-item">${options}</select><p class="hint">+4 后成功率递减，+7 后失败可能降低 1 级。强化消耗装备来源大陆的矿石，但不会摧毁装备。</p></div><div class="forge-main" id="enhance-preview"></div></div>`;
    const select=$("enhance-item");const refresh=()=>{const item=findEquipped(select.value),cost=enhanceCosts(item),chance=enhanceChance(item.enhance),nextValue=item.main.value+Math.ceil(item.main.value*(item.enhance+1)*.07);$("enhance-preview").innerHTML=`<div class="selected-item quality-${item.quality}">${itemArtHTML(item,"selected-art")}<h3>${item.name} +${item.enhance}</h3><strong>${itemMainValue(item)} ➜ ${nextValue}</strong></div><div class="recipe-list"><div class="recipe-item"><span>成功率</span><b>${Math.round(chance*100)}%</b></div><div class="recipe-item"><span>金币</span><b>${game.save.currencies.gold} / ${cost.gold}</b></div><div class="recipe-item">${materialArtHTML(cost.oreKey)}<span>${MATERIAL_NAMES[cost.oreKey]}</span><b>${game.save.materials[cost.oreKey]} / ${cost.ore}</b></div></div><button id="enhance-btn" class="primary full">锤炼装备</button>`;$("enhance-btn").addEventListener("click",()=>enhanceItem(item.id));};select.addEventListener("change",refresh);refresh();
  }

  function enhanceItem(id){const item=findEquipped(id);if(!item)return;const cost=enhanceCosts(item);if(game.save.currencies.gold<cost.gold)return toast("金币不足","#ef7268");if(game.save.materials[cost.oreKey]<cost.ore)return toast(`${MATERIAL_NAMES[cost.oreKey]}不足`,"#ef7268");game.save.currencies.gold-=cost.gold;game.save.materials[cost.oreKey]-=cost.ore;const success=Math.random()<enhanceChance(item.enhance);if(success){item.enhance++;toast(`${item.name} 强化至 +${item.enhance}`,item.enhance>=7?"#ffe16f":"#9de9a4");beep(680,.18,"square",.04);}else{if(item.enhance>=7)item.enhance--;toast(`强化失败${item.enhance>=6?"，等级下降":"，等级保留"}`,"#ef6c68");beep(82,.2,"sawtooth",.04);}renderEnhance();updateHUD();saveGame(true);}

  function renderReforge(){
    const options=equippedOptions();if(!options){$("forge-content").innerHTML=`<p class="modal-lead">请先在角色面板装备一件带副词条的物品。</p>`;return;}
    $("forge-content").innerHTML=`<div class="forge-layout"><div class="forge-side"><h3>洗练目标</h3><select id="reforge-item">${options}</select><p class="hint">勾选词条可锁定。每锁定一条，额外消耗 2 枚虚空碎片。</p></div><div class="forge-main" id="reforge-preview"></div></div>`;
    const select=$("reforge-item");const refresh=()=>{const item=findEquipped(select.value);$("reforge-preview").innerHTML=`<div class="selected-item quality-${item.quality}">${itemArtHTML(item,"selected-art")}<h3>${item.name}</h3></div><div class="affix-list">${item.affixes.length?item.affixes.map((a,i)=>`<label class="affix-row ${a.special?"special-affix":""}"><span>${a.special?"✦ ":""}${a.name} +${formatStat(a.type,a.value)}</span><span>锁定 <input data-lock="${i}" type="checkbox"></span></label>`).join(""):`<p class="hint">粗糙装备没有可洗练的副词条。</p>`}</div><button id="reforge-btn" class="primary full" ${item.affixes.length?"":"disabled"}>重铸未锁词条</button>`;$("reforge-btn")?.addEventListener("click",()=>reforgeItem(item.id));};select.addEventListener("change",refresh);refresh();
  }

  function reforgeItem(id){const item=findEquipped(id);if(!item)return;const locks=[...document.querySelectorAll("[data-lock]")].filter(x=>x.checked).map(x=>Number(x.dataset.lock)),cost=1+locks.length*2;if(game.save.currencies.void<cost)return toast(`需要 ${cost} 枚虚空碎片`,"#ef72c5");game.save.currencies.void-=cost;const rng=new RNG(Date.now()+"reforge");item.affixes=item.affixes.map((old,i)=>{if(locks.includes(i))return old;const a=rng.pick(AFFIXES);let value=lerp(a[2],a[3],rng.next())*(1+(item.region||0)*.12);if(a[0]==="maxHp")value=Math.round(value);return{type:a[0],name:a[1],value,suffix:a[4],special:SPECIAL_AFFIXES.includes(a)};});toast("虚空重塑了装备词条","#d38dff");beep(430,.22,"sine",.04);renderReforge();updateHUD();saveGame(true);}

  function togglePause(){if(game.scene==="title")return;if(!$("pause-panel").classList.contains("hidden")){closePanel("pause-panel");return;}if(isModalOpen()){closeAllModals();return;}openPanel("pause-panel");}

  function handleKeyDown(e){
    if(e.code==="F5"||(e.code==="KeyS"&&(e.ctrlKey||e.metaKey))){e.preventDefault();if(game.scene!=="title")saveGame(false);return;}
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Tab"].includes(e.code))e.preventDefault();game.keys.add(e.code);if(e.repeat)return;
    if(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)){const now=performance.now(),last=game.player.lastTap[e.code]||0;if(last&&now-last<285){game.player.runKey=e.code;game.player.runUntil=now+10000;}game.player.lastTap[e.code]=now;}
    if(e.code==="Escape")return togglePause();if(game.scene==="title")return;
    if(e.code==="KeyC"||e.code==="KeyI"||e.code==="Tab")return isModalOpen()?closeAllModals():openPanel("character-panel");
    if(e.code==="KeyK")return isModalOpen()?closeAllModals():openPanel("skills-panel");
    if(e.code==="KeyM"&&game.scene==="camp")return openPanel("continent-panel");
    if(e.code==="KeyB"){if(game.scene==="camp")openPanel("forge-panel");else toast("铁匠铺只在星火营地开放");return;}
    if(e.code==="KeyL")return isModalOpen()?closeAllModals():openPanel("save-panel");
    if(e.code==="KeyT"&&game.scene==="expedition")return enterCamp(false);
    if(isModalOpen())return;if(e.code==="Space")dash();else if(e.code==="KeyQ")usePotion();else if(e.code==="KeyE")interact();else if(e.code==="KeyJ")attack(true);else if(e.code==="KeyR")useActiveSkill(1);else if(e.code==="KeyF")useActiveSkill(2);
  }

  function setupEvents(){
    $("new-game-btn").addEventListener("click",startNewGame);$("continue-btn").addEventListener("click",continueGame);updateTitleSaveMeta();setMusicTheme("title");
    document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closePanel(b.dataset.close)));
    $("skills-btn").addEventListener("click",()=>openPanel("skills-panel"));$("resume-btn").addEventListener("click",()=>closePanel("pause-panel"));$("save-btn").addEventListener("click",()=>saveGame(false));$("pause-save-list-btn").addEventListener("click",()=>openPanel("save-panel"));
    $("inventory-btn").addEventListener("click",()=>openPanel("character-panel"));$("skill-dock-btn").addEventListener("click",()=>openPanel("skills-panel"));$("map-dock-btn").addEventListener("click",()=>game.scene==="camp"?openPanel("continent-panel"):toast(`${BIOMES[game.biome].name} · 深度 ${game.depth}/5：${BIOMES[game.biome].mechanic}`,BIOMES[game.biome].accent));
    $("save-list-btn").addEventListener("click",()=>openPanel("save-panel"));$("return-dock-btn").addEventListener("click",()=>enterCamp(false));$("return-camp-btn").addEventListener("click",()=>enterCamp(false));$("revive-btn").addEventListener("click",()=>enterCamp(false));
    document.querySelectorAll("[data-forge-tab]").forEach(b=>b.addEventListener("click",()=>{game.forgeTab=b.dataset.forgeTab;renderForge();}));
    addEventListener("keydown",handleKeyDown);addEventListener("keyup",e=>{game.keys.delete(e.code);if(game.player.runKey===e.code){game.player.runKey=null;game.player.running=false;}});addEventListener("blur",()=>{game.keys.clear();game.player.running=false;});
    canvas.addEventListener("pointermove",e=>{const r=canvas.getBoundingClientRect();game.mouse.x=(e.clientX-r.left)/r.width*W;game.mouse.y=(e.clientY-r.top)/r.height*H;if(game.scene!=="title"&&!game.player.swing){const wx=game.mouse.x+game.camera.x,wy=game.mouse.y+game.camera.y;setPlayerAim(wx-game.player.x,wy-game.player.y);}});
    canvas.addEventListener("pointerdown",e=>{if(e.button===0){canvas.focus();attack(false);}});canvas.addEventListener("contextmenu",e=>e.preventDefault());
    const unlockAudio=()=>{ensureAudio();setMusicTheme(game.scene==="title"?"title":game.scene==="camp"?"camp":BIOME_ART_KEYS[game.biome]);};addEventListener("pointerdown",unlockAudio,{once:true,capture:true});addEventListener("keydown",unlockAudio,{once:true,capture:true});addEventListener("pagehide",()=>{if(game.scene!=="title")saveGame(true);});
    document.querySelectorAll("#mobile-controls button").forEach(b=>{const code=b.dataset.key;b.addEventListener("pointerdown",e=>{e.preventDefault();game.keys.add(code);if(code==="KeyJ")attack(true);if(code==="KeyR")useActiveSkill(1);if(code==="Space")dash();if(code==="KeyE")interact();});b.addEventListener("pointerup",()=>game.keys.delete(code));b.addEventListener("pointercancel",()=>game.keys.delete(code));});
  }

  function resizeShell(){const shell=$("game-shell"),scale=Math.max(.1,Math.min(innerWidth/W,innerHeight/H)),scaledW=W*scale,scaledH=H*scale;shell.style.left=`${Math.max(0,(innerWidth-scaledW)/2)}px`;shell.style.top=`${Math.max(0,(innerHeight-scaledH)/2)}px`;shell.style.transform=`scale(${scale})`;}

  addEventListener("resize",resizeShell);resizeShell();if(matchMedia("(pointer: coarse)").matches)$("mobile-controls").classList.remove("hidden");setupEvents(); updateHUD(); requestAnimationFrame(loop);
})();
