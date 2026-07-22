"use strict";

(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const minimap = document.getElementById("minimap");
  const mctx = minimap.getContext("2d");
  const worldMap = document.getElementById("world-map");
  const mapCtx = worldMap.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  mctx.imageSmoothingEnabled = false;
  mapCtx.imageSmoothingEnabled = false;

  const W = canvas.width;
  const H = canvas.height;
  const TILE = 32;
  const SAVE_KEY = "pixel-era-five-realms-v1";
  const BACKUP_SAVE_KEY = `${SAVE_KEY}-backup`;
  const SLOT_SAVE_KEYS = [1,2,3].map(i => `${SAVE_KEY}-slot-${i}`);
  const MUSIC_PREF_KEY = `${SAVE_KEY}-music-enabled`;
  const MUSIC_VOLUME_PREF_KEY = `${SAVE_KEY}-music-volume`;
  const SOUND_PREF_KEY = `${SAVE_KEY}-sound-enabled`;
  const SAVE_FORMAT = 4;
  const INVENTORY_CAPACITY = 120;
  const INVENTORY_PAGE_SIZE = 30;
  const POTION_CAPACITY = 99;
  const SHOW_WORN_HELMETS = false;
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
  const STAGE_MUSIC_KEYS = ["forest","waste","tundra","peaks","abyss"];
  const STAGE_TRACK_NAMES = [
    ["雾灯序曲","孢子回声","根脉低语","兽径追猎","古木王庭"],
    ["赤沙行军","熔炉余烬","蝎影残阳","焚风围猎","骨龙天火"],
    ["初雪无声","冰湖月影","狼群长夜","极光挽歌","寒冠王座"],
    ["远雷将至","断崖风歌","云海电鸣","天穹裂阵","雷神领域"],
    ["暮色边界","虚空脉搏","魅影回廊","混沌凝视","终焉魔域"]
  ];
  const BGM_TRACKS = {
    title:{src:"assets/audio/bgm/title-am-town.mp3",title:"Title Theme"},
    camp:{src:"assets/audio/bgm/camp-town-theme.mp3",title:"Town Theme RPG"},
    forest:{src:"assets/audio/bgm/forest-iremos.ogg",title:"Iremos Forest"},
    waste:{src:"assets/audio/bgm/waste-lava-dungeon.mp3",title:"Lava Dungeon Battle"},
    tundra:{src:"assets/audio/bgm/tundra-snow-globe.ogg",title:"Snow Globe"},
    peaks:{src:"assets/audio/bgm/peaks-thunderous-fall.mp3",title:"Thunderous Fall"},
    abyss:{src:"assets/audio/bgm/abyss-infinite-darkness.mp3",title:"Infinite Darkness"},
    boss:{src:"assets/audio/bgm/boss-jrpg-loop.mp3",title:"Epic Rock Battle"}
  };
  const DEPTH_MUSIC_VARIANTS = [
    { tempo:-4, transpose:0, rotate:0, pulse:[1,0,0,0,1,0,0,0] },
    { tempo:2, transpose:2, rotate:2, pulse:[1,0,1,0,1,0,0,1] },
    { tempo:7, transpose:-2, rotate:4, pulse:[1,0,0,1,1,0,1,0] },
    { tempo:12, transpose:3, rotate:1, pulse:[1,1,0,1,1,0,1,0] },
    { tempo:17, transpose:-5, rotate:3, pulse:[1,0,1,1,1,0,1,1] }
  ];

  function stageMusicKey(biome,depth){return `${STAGE_MUSIC_KEYS[clamp(biome,0,4)]}-${clamp(depth,1,5)}`;}
  function resolveBgmTrack(name){if(BGM_TRACKS[name])return BGM_TRACKS[name];const match=/^(forest|waste|tundra|peaks|abyss)-(\d)$/.exec(name||"");if(!match)return BGM_TRACKS.title;return Number(match[2])===5?BGM_TRACKS.boss:BGM_TRACKS[match[1]];}
  function resolveMusicTheme(name){
    if(MUSIC_THEMES[name])return {...MUSIC_THEMES[name],key:name,biomeKey:name,depth:0,trackName:name==="title"?"五域远征":name==="camp"?"星火余烬":name};
    const match=/^(forest|waste|tundra|peaks|abyss)-(\d)$/.exec(name||"");if(!match)return resolveMusicTheme("title");
    const biome=STAGE_MUSIC_KEYS.indexOf(match[1]),depth=clamp(Number(match[2]),1,5),base=MUSIC_THEMES[match[1]],variant=DEPTH_MUSIC_VARIANTS[depth-1],rotate=variant.rotate%base.lead.length;
    const lead=base.lead.slice(rotate).concat(base.lead.slice(0,rotate)).map((note,i)=>note+variant.transpose+(depth>=4&&i%4===3?2:0));
    const bass=base.bass.map((note,i)=>note+Math.round(variant.transpose/2)+(depth===5&&i%2?-2:0));
    return {...base,key:name,biomeKey:match[1],depth,tempo:base.tempo+variant.tempo+biome*2,lead,bass,pulse:variant.pulse,trackName:STAGE_TRACK_NAMES[biome][depth-1]};
  }

  const SPRITE_PATHS = {
    keyArt: "assets/pixel-era-key-art.png",
    heroBase: "assets/sprites/hero-base-layered-atlas.png?v=2", forest: "assets/sprites/forest-atlas.png",
    waste: "assets/sprites/waste-atlas.png", tundra: "assets/sprites/tundra-atlas.png",
    peaks: "assets/sprites/peaks-atlas.png", abyss: "assets/sprites/abyss-atlas.png",
    equipment: "assets/sprites/equipment-atlas-v2.png?v=2", materials: "assets/sprites/materials-atlas.png", effects: "assets/sprites/effects-atlas-transparent-v2.png?v=2",
    terrain: "assets/sprites/terrain-atlas.png", heroBaseWalk: "assets/sprites/hero-base-walk-atlas.png?v=2",
    heroBaseRun: "assets/sprites/hero-base-run-atlas.png?v=2", armorDirectional: "assets/sprites/armor-forest-overlay-directional-v1.png?v=2",
    armorWalk: "assets/sprites/armor-forest-overlay-walk-v1.png?v=2", armorRun: "assets/sprites/armor-forest-overlay-run-v1.png?v=2",
    wearableEquipment: "assets/sprites/wearable-equipment-atlas-v1.png?v=2", helmetDirectional: "assets/sprites/helmet-directional-atlas-v3.png?v=1",
    eliteLoot: "assets/sprites/elite-loot-atlas.png?v=2", monsterEffects: "assets/sprites/monster-effects-atlas-v2.png?v=3",
    treantRoots: "assets/sprites/treant-root-vfx-transparent-v2.png?v=4", swordWave: "assets/sprites/sword-wave-v2.png?v=3"
  };
  const ART = {};
  Object.keys(SPRITE_PATHS).forEach(key => { const img = new Image(); img.decoding = "async"; ART[key] = img; });

  function preloadArt() {
    document.documentElement.dataset.artState = "loading";
    document.documentElement.dataset.artFailures = "";
    return Promise.all(Object.entries(SPRITE_PATHS).map(([key, src]) => new Promise((resolve, reject) => {
      const image = ART[key];
      image.onload = () => resolve({ key, width:image.naturalWidth, height:image.naturalHeight });
      image.onerror = () => reject(new Error(`无法加载美术资源：${src}`));
      image.src = src;
    }))).then(results => {
      document.documentElement.dataset.artState = "ready";
      document.documentElement.dataset.artCount = String(results.length);
      return results;
    }).catch(error => {
      document.documentElement.dataset.artState = "error";
      document.documentElement.dataset.artFailures = error.message;
      throw error;
    });
  }

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
    tutorial: { interactions: {} },
    settings: { sound: readSoundPreference(), music: readMusicPreference(), bgmVolume: readBgmVolumePreference() }
  });

  const game = {
    save: freshSave(), scene: "title", paused: true, world: null, biome: 0, depth: 1,
    keys: new Set(), camera: { x: 0, y: 0 },
    player: { x: 0, y: 0, vx: 0, vy: 0, dirX: 1, dirY: 0, aimAngle: 0, aimTarget: null, aimLockUntil: 0, radius: 12, invuln: 0, dash: 0, attackCd: 0, combo: 0, comboUntil: 0, swing: null, weaponDrawn: 0, running: false, runKey: null, runUntil: 0, lastTap: {}, recoveryPose: 0, activeCd1: 0, activeCd2: 0 },
    enemies: [], particles: [], numbers: [], telegraphs: [], projectiles: [], impacts: [], resources: [], altars: [], groundDrops: [],
    screenShake: 0, hitStop: 0, lastTime: 0, autosave: 0, zoneTime: 0, hazardTimer: 2.5, unseenItems: 0,
    forgeTab: "craft", selectedForge: 0, forgeCatalysts: { rare: false, core: false }, inventoryPage: 0, inventoryTab: "equipment", mapZoom: 1, runLoot: { gold: 0, materials: 0, kills: 0 },
    audio: null, equipmentSystem: null, playerVisual: null, paperdollVisual: null, visualEquipmentSignature: ""
  };

  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const lerp = (a, b, t) => a + (b - a) * t;
  const fmt = n => Math.round(n).toLocaleString("zh-CN");
  const qualityById = id => QUALITIES.find(q => q.id === id) || QUALITIES[0];

  function readMusicPreference(){try{return localStorage.getItem(MUSIC_PREF_KEY)!=="off";}catch{return true;}}
  function readSoundPreference(){try{return localStorage.getItem(SOUND_PREF_KEY)!=="off";}catch{return true;}}
  function readBgmVolumePreference(){try{const raw=localStorage.getItem(MUSIC_VOLUME_PREF_KEY);if(raw===null)return .72;const value=Number(raw);return Number.isFinite(value)&&value>=0&&value<=1?value:.72;}catch{return .72;}}
  function stripQualityPrefix(name){return String(name||"").replace(/^(?:(?:粗糙|普通|稀有|史诗|传说)[·・•\s-]+)+/,"");}
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

  async function initializeEquipmentRendering() {
    if (!window.PixelEquipment?.EquipmentSystem) throw new Error("Equipment rendering modules are unavailable");
    const system = await window.PixelEquipment.EquipmentSystem.load({
      rigUrl: "data/characters/player-rig.json?v=5",
      catalogUrl: "data/equipment/equipment-catalog.json?v=5"
    });
    game.equipmentSystem = system;
    game.playerVisual = system.createCharacter("local-player", { x: game.player.x, y: game.player.y, direction: "down" });
    game.paperdollVisual = system.createCharacter("paperdoll-player", { x: 90, y: 168, direction: "down" });
    game.visualEquipmentSignature = "";
    document.documentElement.dataset.equipmentRenderer = "layered-anchor-v1";
    document.documentElement.dataset.equipmentConfig = system.configSource;
  }

  function visualEquipmentDefinitions() {
    const equipped = game.save.equipment.equipped;
    return [
      equipped.weapon && [`weapon_${weaponTypeOf(equipped.weapon)}`, equipped.weapon],
      SHOW_WORN_HELMETS && equipped.helmet && [`helmet_${clamp(equipped.helmet.region ?? 0, 0, 4)}`, equipped.helmet],
      equipped.armor && [`armor_${clamp(equipped.armor.region ?? 0, 0, 4)}`, equipped.armor],
      equipped.boots && [`boots_${clamp(equipped.boots.region ?? 0, 0, 4)}`, equipped.boots],
      equipped.amulet && [`amulet_${clamp(equipped.amulet.region ?? 0, 0, 4)}`, equipped.amulet]
    ].filter(Boolean);
  }

  function syncVisualEquipment() {
    const character = game.playerVisual, system = game.equipmentSystem;
    if (!character || !system) return;
    const definitions = visualEquipmentDefinitions();
    const signature = definitions.map(([definitionId, item]) => `${definitionId}:${item.id}`).join("|");
    if (signature === game.visualEquipmentSignature) return;
    [character, game.paperdollVisual].filter(Boolean).forEach(target => {
      target.clearEquipment();
      definitions.forEach(([definitionId, item]) => {
        if (system.catalog.has(definitionId)) target.equip(system.createEquipment(definitionId, { instanceId: item.id, stats: item.main }));
      });
    });
    game.visualEquipmentSignature = signature;
  }

  function axeSpinAngle(progress){const eased=progress<.12?progress/.12*.08:.08+(progress-.12)/.88*.92;return eased*Math.PI*2;}
  function weaponSwingArc(type,combo,progress){if(type==="axe"&&combo===3)return-.72;if(type==="spear"){if(combo===1)return lerp(-.12,.14,progress);if(combo===2)return lerp(.7,-.82,progress);if(combo===3)return 0;}if(type==="daggers"&&combo===3){const phase=Math.min(2,Math.floor(progress*3));return[-.38,.42,-.18][phase]+Math.sin(progress*Math.PI*6)*.16;}const direction=combo===2?-1:1;return direction*lerp(-.68,.58,progress);}

  function syncLayeredPlayerVisual(deltaSeconds = 0) {
    const character = game.playerVisual, p = game.player;
    if (!character) return null;
    const speed = Math.hypot(p.vx, p.vy), moving = speed > 12;
    const aimAngle = p.swing ? Math.atan2(p.swing.dy, p.swing.dx) : (Number.isFinite(p.aimAngle) ? p.aimAngle : Math.atan2(p.dirY, p.dirX));
    const ax = Math.cos(aimAngle), ay = Math.sin(aimAngle);
    const direction = Math.abs(ax) >= Math.abs(ay) ? (ax >= 0 ? "right" : "left") : (ay >= 0 ? "down" : "up");
    const state = p.swing || p.weaponDrawn > 0 ? "attack" : p.hurtFx > .11 ? "hurt" : p.running && moving ? "run" : moving ? "walk" : "idle";
    const newSwing = Boolean(p.swing && character.pose.swingObject !== p.swing);
    character.setPosition(p.x, p.y).setDirection(direction).setAnimation(state, { restart: newSwing });
    if (p.swing) character.pose.swingObject = p.swing; else character.pose.swingObject = null;
    const swingProgress = p.swing ? clamp(1 - p.swing.t / p.swing.max, 0, 1) : .5;
    const swingArc = p.swing ? weaponSwingArc(p.swing.weaponType,p.swing.combo,swingProgress) : 0;
    character.pose.aimAngle = aimAngle;
    character.pose.weaponAngle = aimAngle + swingArc;
    character.pose.attackProgress = swingProgress;
    character.pose.worldRotation = p.swing?.weaponType === "axe" && p.swing.combo === 3 ? axeSpinAngle(swingProgress) : 0;
    character.pose.rotationPivotY = -22;
    document.documentElement.dataset.playerWorldRotation=character.pose.worldRotation.toFixed(3);
    character.alpha = p.invuln > 0 && Math.floor(performance.now() / 55) % 2 ? .46 : 1;
    character.filter = p.hurtFx > 0 ? "brightness(1.6) saturate(.65)" : "none";
    syncVisualEquipment();
    const visualWeapon = character.equipment.get("rightHand");
    const resolvedWeapon = visualWeapon?.resolveParts(character.animation, character.direction)?.[0];
    document.documentElement.dataset.weaponMount = resolvedWeapon?.anchor || visualWeapon?.definition.anchor || "none";
    if (deltaSeconds > 0) character.update(deltaSeconds);
    if (p.swing && character.animation === "attack") {
      const frames=character.framesFor(character.getAnimation(),character.direction),mapped=Math.min(frames.length-1,Math.floor(swingProgress*frames.length));
      character.frameIndex=Math.max(0,mapped);
    }
    const visualState = `${character.animation}:${character.frameIndex}:${character.equipmentList().length}`;
    if (document.documentElement.dataset.playerVisual !== visualState) document.documentElement.dataset.playerVisual = visualState;
    return character;
  }

  function renderPaperdoll(deltaSeconds = 0) {
    const canvas = $("paperdoll-canvas"), character = game.paperdollVisual, system = game.equipmentSystem;
    if (!canvas) return;
    const paperCtx = canvas.getContext("2d");
    paperCtx.setTransform(1, 0, 0, 1, 0, 0);
    paperCtx.clearRect(0, 0, canvas.width, canvas.height);
    paperCtx.imageSmoothingEnabled = false;
    if (!character || !system) {
      if (ART.heroBase?.complete && ART.heroBase.naturalWidth) {
        const sw = ART.heroBase.naturalWidth / 4, sh = ART.heroBase.naturalHeight / 5;
        paperCtx.drawImage(ART.heroBase, sw, 0, sw, sh, 49, 54, 82, 102);
      }
      return;
    }
    syncVisualEquipment();
    const bob = Math.round(Math.sin(performance.now() / 360));
    character.setPosition(90, 168 + bob).setDirection("down").setAnimation("idle");
    character.pose.aimAngle = Math.PI / 2;
    character.pose.weaponAngle = Math.PI / 2;
    character.alpha = 1;
    character.filter = "none";
    if (deltaSeconds > 0) character.update(deltaSeconds);
    paperCtx.save();
    paperCtx.translate(90, 171);
    paperCtx.scale(1.55, 1.55);
    paperCtx.translate(-90, -168);
    system.renderer.render(paperCtx, character);
    paperCtx.restore();
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
    merged.tutorial = { ...base.tutorial, ...(raw.tutorial || {}), interactions: { ...base.tutorial.interactions, ...((raw.tutorial || {}).interactions || {}) } };
    merged.settings = { ...base.settings, ...(raw.settings || {}) };
    merged.equipment = { ...base.equipment, ...(raw.equipment || {}) };
    merged.equipment.equipped = { ...base.equipment.equipped, ...((raw.equipment || {}).equipped || {}) };
    [...Object.values(merged.equipment.equipped), ...(merged.equipment.inventory || [])].filter(Boolean).forEach(item => {
      item.region = clamp(item.region ?? 0, 0, 4);
      item.name = stripQualityPrefix(item.name);
      item.affixes ||= [];
      if (item.slot === "weapon") item.weaponType = weaponTypeOf(item);
    });
    merged.settings.bgmVolume=clamp(Number(merged.settings.bgmVolume ?? .72),0,1);
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
      world: { seed:game.world.seed, exit:game.world.exit, exitSpawned:game.world.exitSpawned, exitLocked:game.world.exitLocked, revealed:[...game.world.revealed] },
      enemies: game.enemies.filter(e=>!e.dead).map(e=>({name:e.name,color:e.color,speed:e.speed,hp:e.hp,maxHp:e.maxHp,damage:e.damage,typeIndex:e.typeIndex,elite:e.elite,x:e.x,y:e.y,homeX:e.homeX,homeY:e.homeY,radius:e.radius,boss:e.boss,attackCd:e.attackCd,specialCd:e.specialCd,phase:e.phase,pattern:e.pattern,statuses:e.statuses})),
      resources: game.resources.map(r=>({...r})), altars: game.altars.map(a=>({...a})), groundDrops:game.groundDrops.map(d=>({...d}))
    };
  }

  function encodeSaveData(save, session, savedAt = Date.now()) {
    const data = { version:SAVE_FORMAT, savedAt, save, session };
    return JSON.stringify({ ...data, hash:hashString(JSON.stringify(data)) });
  }

  function encodeSave() { return encodeSaveData(game.save, snapshotSession()); }

  function createFullUnlockTestSave() {
    const save = freshSave();
    save.player = { level:50, xp:0, hp:9999, stamina:100, skillPoints:99, potions:POTION_CAPACITY };
    save.skills = {
      fury:{blade:3,weakness:3,finisher:1},
      survival:{toughness:3,agility:3,renewal:1},
      explore:{haste:3,miner:3,alchemy:1}
    };
    save.progress = { unlocked:[0,1,2,3,4], completedDepths:[5,5,5,5,5], bossKills:[9,9,9,9,9] };
    Object.keys(save.materials).forEach(key => { save.materials[key] = 999; });
    save.currencies = { gold:999999, void:9999 };
    save.tutorial.interactions = { forge:true, "equipment-drop":true, "potion-drop":true, "material-drop":true, altar:true, resource:true, portal:true };
    const weapons = WEAPON_TYPES.map((type,index) => {
      const legendary = LEGENDARIES[index % LEGENDARIES.length];
      return {
        id:`test-legendary-${type}`, name:`星火试炼${WEAPON_NAMES[type]}`, slot:"weapon", quality:"gold",
        level:50, enhance:15, weaponType:type, region:index,
        main:{type:"attack",value:108+index*14},
        affixes:[
          {type:"critRate",name:"暴击率",value:.09,suffix:"%",special:false},
          {type:"attackSpeed",name:"攻击速度",value:.14,suffix:"%",special:false},
          {type:"elementalDamage",name:"元素增伤",value:.22,suffix:"%",special:true},
          {type:"eliteDamage",name:"精英增伤",value:.25,suffix:"%",special:true}
        ],
        legendary:{id:legendary[0],name:legendary[1],text:legendary[2]},
        lore:"全解锁验收档专用传说武器。"
      };
    });
    const gear = (slot,name,mainType,value,region,legendaryIndex) => {
      const legendary=LEGENDARIES[legendaryIndex%LEGENDARIES.length];
      return {id:`test-legendary-${slot}`,name,slot,quality:"gold",level:50,enhance:15,region,main:{type:mainType,value},affixes:[{type:"maxHp",name:"最大生命",value:90,suffix:"",special:false},{type:"reduction",name:"伤害减免",value:.08,suffix:"%",special:false},{type:"rareFind",name:"稀有寻获",value:.2,suffix:"%",special:true}],legendary:{id:legendary[0],name:legendary[1],text:legendary[2]},lore:"全解锁验收档专用装备。"};
    };
    save.equipment.equipped = {
      weapon:weapons[0],
      helmet:gear("helmet","星火试炼面甲","defense",58,4,0),
      armor:gear("armor","星火试炼战铠","defense",94,4,1),
      boots:gear("boots","星火试炼战靴","defense",52,4,2),
      amulet:gear("amulet","星火试炼星坠","maxHp",260,4,3)
    };
    save.equipment.inventory = weapons.slice(1);
    return normalizeSave(save);
  }

  function installFullUnlockTestSave() {
    const raw = encodeSaveData(createFullUnlockTestSave(), {scene:"camp"});
    try {
      localStorage.setItem(SLOT_SAVE_KEYS[2], raw);
      const loaded = decodeSave(raw, "full-unlock-test");
      loadDecodedGame(loaded);
      document.documentElement.dataset.qaLast = "full-save-loaded";
      game.qaUpdateStatus?.();
      toast("全解锁测试档已载入，并写入手动存档 3", "#a5f0ce");
    } catch {
      toast("无法创建测试档：浏览器本地存储不可用", "#ef7268");
    }
  }

  function ensureFullUnlockTestSlot() {
    try {
      if (localStorage.getItem(SLOT_SAVE_KEYS[2])) return false;
      localStorage.setItem(SLOT_SAVE_KEYS[2], encodeSaveData(createFullUnlockTestSave(), {scene:"camp"}));
      document.documentElement.dataset.testSaveSlot="3";
      return true;
    } catch { return false; }
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
    if (!game.save.settings.sound && !game.save.settings.music) return null;
    try {
      if (!game.audio?.ctx) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)(), master=ctx.createGain(),music=ctx.createGain(),sfx=ctx.createGain();
        master.gain.value=.82;music.gain.value=.62;sfx.gain.value=.82;music.connect(master);sfx.connect(master);master.connect(ctx.destination);
        const bgm=new Audio();bgm.loop=true;bgm.preload="auto";bgm.volume=game.save.settings.bgmVolume;
        game.audio={ctx,master,music,sfx,bgm,musicTimer:null,theme:null,step:0};
      }
      game.audio.sfx.gain.value=game.save.settings.sound?.82:0;
      game.audio.music.gain.value=game.save.settings.music?.62*game.save.settings.bgmVolume:0;
      game.audio.bgm.volume=game.save.settings.bgmVolume;
      if(game.audio.ctx.state==="suspended")game.audio.ctx.resume();
      if(game.save.settings.music&&game.musicTheme&&(game.audio.theme!==game.musicTheme||game.audio.bgm?.paused))startMusic(game.musicTheme);
      return game.audio;
    } catch { return null; }
  }

  function synthTone(freq,duration=.12,wave="square",gain=.035,when=null,channel="sfx",slide=0) {
    const a=game.audio?.ctx?game.audio:ensureAudio();if(!a)return;const t=when??a.ctx.currentTime,osc=a.ctx.createOscillator(),g=a.ctx.createGain();osc.type=wave;osc.frequency.setValueAtTime(Math.max(30,freq),t);if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(30,freq*slide),t+duration);g.gain.setValueAtTime(Math.max(.0001,gain),t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(g);g.connect(a[channel]);osc.start(t);osc.stop(t+duration+.02);
  }

  function noiseBurst(duration=.08,gain=.018,channel="sfx") {
    const a=game.audio?.ctx?game.audio:ensureAudio();if(!a)return;const length=Math.max(1,Math.floor(a.ctx.sampleRate*duration)),buffer=a.ctx.createBuffer(1,length,a.ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);const src=a.ctx.createBufferSource(),g=a.ctx.createGain();src.buffer=buffer;g.gain.value=gain;src.connect(g);g.connect(a[channel]);src.start();
  }

  function synthPad(notes,duration,wave="sine",gain=.009,when=null){
    const a=game.audio?.ctx?game.audio:ensureAudio();if(!a)return;const start=when??a.ctx.currentTime,attack=Math.min(.7,duration*.18),release=Math.min(1.2,duration*.28);
    notes.forEach((note,i)=>{const osc=a.ctx.createOscillator(),g=a.ctx.createGain(),detune=(i-1)*4;osc.type=wave;osc.frequency.value=midiFreq(note);osc.detune.value=detune;g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),start+attack);g.gain.setValueAtTime(Math.max(.0002,gain*.82),Math.max(start+attack,start+duration-release));g.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(g);g.connect(a.music);osc.start(start);osc.stop(start+duration+.03);});
  }

  function musicAccent(theme,step,now,beat){if(step%8!==4)return;const name=theme.biomeKey,depth=theme.depth||0;if(name==="title")synthTone(midiFreq(76),beat*2,"sine",.014,now,"music",1.5);else if(name==="camp")synthTone(midiFreq(71),beat*1.7,"triangle",.015,now,"music",.75);else if(name==="forest")synthTone(midiFreq(80+depth),beat*.7,"sine",.012,now,"music",1.3);else if(name==="waste"){noiseBurst(.11,.008+depth*.001,"music");synthTone(68+depth*5,beat*.8,"square",.012,now,"music",.62);}else if(name==="tundra")synthTone(midiFreq(86+depth),beat*2.2,"sine",.014,now,"music",.5);else if(name==="peaks"){noiseBurst(.06,.011+depth*.001,"music");synthTone(1260+depth*55,beat*.34,"square",.008,now,"music",.28);}else if(name==="abyss"){synthTone(48+depth*2,beat*3,"sawtooth",.011,now,"music",.72);synthTone(53+depth,beat*3,"sine",.008,now,"music",.68);}}

  function startMusic(name) {
    game.musicTheme=name;const a=game.audio?.ctx?game.audio:null;const track=resolveBgmTrack(name);document.documentElement.dataset.bgmTrack=track.title;document.documentElement.dataset.bgmKey=name;if(!a?.bgm)return;if(a.musicTimer)clearTimeout(a.musicTimer);a.theme=name;
    if(!game.save.settings.music){a.bgm.pause();a.bgm.muted=true;a.music.gain.value=0;document.documentElement.dataset.bgmState="muted";return;}
    a.bgm.muted=false;a.music.gain.value=.62*game.save.settings.bgmVolume;
    if(a.bgm.dataset.key!==name){a.bgm.pause();a.bgm.src=track.src;a.bgm.dataset.key=name;a.bgm.load();}
    a.bgm.volume=game.save.settings.bgmVolume;a.bgm.onplaying=()=>{document.documentElement.dataset.bgmState=game.save.settings.music?"playing":"muted";};a.bgm.onerror=()=>{document.documentElement.dataset.bgmState="error";};document.documentElement.dataset.bgmState="loading";
    const pending=a.bgm.play();if(pending)pending.catch(()=>{document.documentElement.dataset.bgmState="blocked";});
  }

  function setMusicTheme(name){game.musicTheme=name;if(game.audio?.ctx&&(game.audio.theme!==name||game.audio.bgm?.paused))startMusic(name);}

  function updateSettingsControls(){const music=$("settings-music-toggle"),sound=$("settings-sound-toggle"),slider=$("bgm-volume"),text=$("bgm-volume-text"),enabled=game.save.settings.music!==false,soundEnabled=game.save.settings.sound!==false,volume=Math.round(game.save.settings.bgmVolume*100);if(music){music.textContent=enabled?"开启":"关闭";music.setAttribute("aria-checked",String(enabled));}if(sound){sound.textContent=soundEnabled?"开启":"关闭";sound.setAttribute("aria-checked",String(soundEnabled));}if(slider)slider.value=String(volume);if(text)text.textContent=`${volume}%`;document.documentElement.dataset.musicEnabled=String(enabled);document.documentElement.dataset.bgmVolume=String(volume);document.documentElement.dataset.soundEnabled=String(soundEnabled);}

  function setMusicEnabled(enabled,announce=true){game.save.settings.music=Boolean(enabled);try{localStorage.setItem(MUSIC_PREF_KEY,enabled?"on":"off");}catch{}const a=game.audio;if(a?.bgm){a.bgm.muted=!enabled;if(!enabled){a.bgm.pause();a.music.gain.value=0;document.documentElement.dataset.bgmState="muted";}else{a.music.gain.value=.62*game.save.settings.bgmVolume;startMusic(game.musicTheme||"title");}}else if(enabled){ensureAudio();startMusic(game.musicTheme||"title");}else document.documentElement.dataset.bgmState="muted";updateSettingsControls();if(game.scene!=="title")saveGame(true);if(announce)toast(enabled?"背景音乐已开启":"背景音乐已关闭",enabled?"#9de7ff":"#b7b3bd");game.qaUpdateStatus?.();}

  function setBgmVolume(value,announce=false){const volume=clamp(Number(value)||0,0,1);game.save.settings.bgmVolume=volume;try{localStorage.setItem(MUSIC_VOLUME_PREF_KEY,String(volume));}catch{}if(game.audio){game.audio.music.gain.value=game.save.settings.music?.62*volume:0;if(game.audio.bgm)game.audio.bgm.volume=volume;}updateSettingsControls();if(game.scene!=="title")saveGame(true);if(announce)toast(`背景音乐音量 ${Math.round(volume*100)}%`,"#ffe09a");}

  function setSoundEnabled(enabled,announce=true){game.save.settings.sound=Boolean(enabled);try{localStorage.setItem(SOUND_PREF_KEY,enabled?"on":"off");}catch{}if(game.audio?.sfx)game.audio.sfx.gain.value=enabled?.82:0;updateSettingsControls();if(game.scene!=="title")saveGame(true);if(announce)toast(enabled?"战斗音效已开启":"战斗音效已关闭",enabled?"#9de7ff":"#b7b3bd");}

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

  function generateItem(region = game.biome, depth = game.depth, forcedMin = 0, rng = new RNG(Date.now() + Math.random()), maxQuality = 4) {
    const progress = region * 5 + depth;
    let roll = rng.next() + region * .022 + depth * .012 + game.save.skills.explore.alchemy * .1;
    let qi = roll > .992 ? 4 : roll > .92 ? 3 : roll > .73 ? 2 : roll > .42 ? 1 : 0;
    qi = clamp(Math.max(qi, forcedMin),0,maxQuality);
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
      name: `${rng.pick(nameRoots)}${itemSuffix}`,
      slot, quality: q.id, level: itemLevel, enhance: 0, weaponType,
      main: { type: mainType, value: mainValue }, affixes, region,
      legendary: legendary ? { id: legendary[0], name: legendary[1], text: legendary[2] } : null,
      lore: `在${BIOMES[region].name}的第 ${depth} 深度发现，仍残留着元素核心的微光。`
    };
  }

  function addItem(item) {
    const inv = game.save.equipment.inventory;
    if (inv.length >= INVENTORY_CAPACITY) {
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
    else if(drop.kind==="potion"){if(game.save.player.potions>=POTION_CAPACITY)return toast(`药水袋已满（${POTION_CAPACITY} / ${POTION_CAPACITY}）`,"#efc46d");game.save.player.potions++;toast("拾取生命药水 ×1","#8be89f");}
    else if(drop.kind==="material"){game.save.materials[drop.material]=(game.save.materials[drop.material]||0)+(drop.amount||1);game.runLoot.materials+=drop.amount||1;toast(`拾取 ${MATERIAL_NAMES[drop.material]} ×${drop.amount||1}`,BIOMES[game.biome].accent);}
    game.groundDrops=game.groundDrops.filter(d=>d!==drop);updateHUD();beep(520,.1,"triangle",.03);
  }

  function itemMainValue(item) { return item.main.value + Math.ceil(item.main.value * item.enhance * .07); }

  function startNewGame() {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(BACKUP_SAVE_KEY);
    game.save = freshSave();
    setMusicEnabled(game.save.settings.music,false);
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
    if(!loaded)return toast("这个档位为空或已损坏","#ef7268");game.save=loaded.save;game.save.settings.music=readMusicPreference();game.save.settings.sound=readSoundPreference();game.save.settings.bgmVolume=readBgmVolumePreference();game.unseenItems=0;setMusicEnabled(game.save.settings.music,false);setSoundEnabled(game.save.settings.sound,false);setBgmVolume(game.save.settings.bgmVolume);
    if(loaded.session?.scene==="expedition")restoreSession(loaded.session);else enterCamp(false);
    if(loaded.source==="backup")toast("主存档异常，已从备份恢复","#ffd36b");else if(loaded.source==="full-unlock-template")toast("已载入内置全解锁测试档","#a5f0ce");else if(loaded.migrated)toast("旧版存档已迁移为新版格式","#9de7ff");else toast("星火回应了你的归来");
    saveGame(true);
  }

  function updateTitleSaveMeta(){const meta=$("save-meta"),button=$("continue-btn");if(!meta||!button)return;const loaded=readSavedGame()||SLOT_SAVE_KEYS.map((k,i)=>readSaveKey(k,`slot-${i+1}`)).find(Boolean);button.disabled=!loaded;if(!loaded){meta.textContent="尚无存档";return;}const when=loaded.savedAt?new Date(loaded.savedAt).toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}):"旧版存档";meta.textContent=`${loaded.session?.scene==="expedition"?`${BIOMES[loaded.session.biome]?.name||"远征"} · 深度 ${loaded.session.depth}`:"星火营地"} · ${when} · 点击查看存档列表`;}

  function restoreSession(session){
    const biome=clamp(Number(session.biome)||0,0,4),depth=clamp(Number(session.depth)||1,1,5);game.biome=biome;game.depth=depth;game.scene="expedition";game.paused=false;game.zoneTime=0;game.runLoot=session.runLoot||{gold:0,materials:0,kills:0};
    game.world=generateMap(session.world?.seed||`${BIOMES[biome].id}-restored-${depth}`,biome,depth);game.world.revealed=new Set(session.world?.revealed||[]);
    const savedWorld=session.world||{};if(savedWorld.exit){game.world.exit={...savedWorld.exit};game.world.exitSpawned=true;game.world.exitLocked=!!savedWorld.exitLocked;game.world.tiles[game.world.exit.y][game.world.exit.x]=4;}else if(savedWorld.exitLocked===false){game.world.exit={...game.world.fallbackExit};game.world.exitSpawned=true;game.world.exitLocked=false;game.world.tiles[game.world.exit.y][game.world.exit.x]=4;}
    game.player.x=session.player?.x??((game.world.start.x+.5)*TILE);game.player.y=session.player?.y??((game.world.start.y+.5)*TILE);game.player.dirX=session.player?.dirX??1;game.player.dirY=session.player?.dirY??0;game.player.vx=game.player.vy=0;game.player.invuln=1.8;game.player.swing=null;game.player.weaponDrawn=0;game.player.statuses={};
    game.enemies=[];(session.enemies||[]).forEach(saved=>{spawnEnemy(saved.typeIndex||0,saved.x,saved.y,!!saved.boss);const e=game.enemies[game.enemies.length-1];Object.assign(e,saved,{attack:saved.boss?null:ENEMY_ATTACKS[biome][saved.typeIndex||0],state:"patrol",stateTime:0,vx:0,vy:0,dead:false,statuses:saved.statuses||{}});});
    // Legacy saves may contain fixed map resources. Materials now come from
    // defeated monsters, so old resource nodes are deliberately retired.
    game.resources=[];game.altars=(session.altars||[]).map(a=>({...a}));game.groundDrops=(session.groundDrops||[]).map(d=>({...d}));game.telegraphs=[];game.projectiles=[];game.impacts=[];game.particles=[];game.numbers=[];game.camera.x=game.camera.y=0;
    const floorCleared=depth<5&&!game.enemies.some(e=>!e.dead&&!e.boss),bossCleared=depth===5&&!game.enemies.some(e=>!e.dead&&e.boss);
    if(!game.world.exitSpawned&&(floorCleared||bossCleared))spawnExitNearPlayer(false);
    $("title-screen").classList.add("hidden");$("death-panel").classList.add("hidden");$("hud").classList.remove("hidden");closeAllModals();setMusicTheme(stageMusicKey(biome,depth));updateCamera(1);updateHUD();
  }

  function enterCamp(first = false) {
    game.scene = "camp"; game.paused = false; game.world = null; game.enemies = []; game.resources = []; game.telegraphs = []; game.projectiles = []; game.impacts = []; game.altars = []; game.groundDrops=[];
    const st = stats(); game.save.player.hp = st.maxHp; game.save.player.stamina = 100; game.save.player.potions = Math.max(3, game.save.player.potions);
    game.player.x = W / 2; game.player.y = H / 2 + 80; game.player.vx = game.player.vy = 0; game.player.swing = null; game.player.weaponDrawn = 0; game.camera.x = game.camera.y = 0;
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
    const floorCells = queue.filter(p => distances[p.y][p.x] > 7 && !(p.x === far.x && p.y === far.y));
    const hazards = biomeIndex === 1 ? 32 + depth * 6 : 0;
    for (let i = 0; i < hazards && floorCells.length; i++) {
      const p = rng.pick(floorCells); if (distances[p.y][p.x] > 10) tiles[p.y][p.x] = 6;
    }
    return { seed, rng, cols, rows, tiles, start, exit: null, fallbackExit: far, exitSpawned: false, floorCells, walkableCells: queue, explorableCount: queue.length, distances, revealed: new Set(), exitLocked: true };
  }

  function enterFloor(biomeIndex, depth) {
    const biome = BIOMES[biomeIndex];
    game.biome = biomeIndex; game.depth = depth; game.scene = "expedition"; game.paused = false; game.zoneTime = 0;
    game.runLoot = depth === 1 ? { gold: 0, materials: 0, kills: 0 } : game.runLoot;
    const seed = `${biome.id}-${Date.now()}-${depth}-${game.save.progress.bossKills[biomeIndex]}`;
    game.world = generateMap(seed, biomeIndex, depth);
    const w = game.world;
    game.player.x = (w.start.x + .5) * TILE; game.player.y = (w.start.y + .5) * TILE;
    game.player.vx = game.player.vy = 0; game.player.invuln = 2.2; game.player.swing = null; game.player.weaponDrawn = 0;
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
    // Field resources were replaced by monster-carried material drops so every
    // scene pickup has a combat source and uses the same pickup presentation.
    const count = depth === 5 ? 12 + biomeIndex * 2 : 9 + depth * 2 + biomeIndex * 2;
    for (let i = 0; i < count; i++) {
      const p = pickCell(8); spawnEnemy(i % 4, (p.x + .5) * TILE, (p.y + .5) * TILE, false);
    }
    if (depth === 5) spawnEnemy(0, (w.fallbackExit.x + .5) * TILE, (w.fallbackExit.y + .5) * TILE, true);
    if (biomeIndex === 4) {
      for (let i = 0; i < 3; i++) { const p = pickCell(7); game.altars.push({ x: (p.x + .5) * TILE, y: (p.y + .5) * TILE, lit: false }); }
    }
    game.save.player.hp = Math.min(game.save.player.hp, stats().maxHp);
    setMusicTheme(stageMusicKey(biomeIndex,depth));playSfx("portal");
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

  function spawnProjectile({ x, y, dx, dy, speed = 250, damage = 10, team = "enemy", effect = 5, radius = 9, life = 2.4, status = null, homing = 0, pierce = 0, owner = null, monsterFx = null, playerFx = null }) {
    const len = Math.hypot(dx, dy) || 1;
    game.projectiles.push({ x, y, vx: dx / len * speed, vy: dy / len * speed, damage, team, effect, radius, life, status, homing, pierce, owner, monsterFx, playerFx, spin: Math.random() * Math.PI * 2 });
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

  function hasAutoAimLine(target){if(!game.world)return true;const p=game.player,dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy),steps=Math.max(1,Math.ceil(d/18));for(let i=1;i<steps;i++){const t=i/steps;if(!isWalkable(p.x+dx*t,p.y+dy*t))return false;}return true;}

  function autoAimRange(){const type=equippedWeaponType();return type==="staff"?540:type==="spear"?460:380;}

  function autoAimTarget(force=false){const p=game.player,now=performance.now(),range=autoAimRange(),valid=e=>e&&!e.dead&&e.hp>0&&dist(e,p)<=range&&hasAutoAimLine(e);if(!force&&valid(p.aimTarget)&&now<(p.aimLockUntil||0))return p.aimTarget;const facing=Number.isFinite(p.aimAngle)?p.aimAngle:Math.atan2(p.dirY,p.dirX),candidates=game.enemies.filter(valid).map(e=>{const d=dist(e,p),angle=Math.atan2(e.y-p.y,e.x-p.x),delta=Math.abs(Math.atan2(Math.sin(angle-facing),Math.cos(angle-facing))),threat=(e.boss?125:e.elite?52:0)+(e.state==="windup"?46:0)+(e.attack?.range>180?14:0);return{e,score:d+delta*34-threat};}).sort((a,b)=>a.score-b.score);const chosen=candidates[0]?.e||null;p.aimTarget=chosen;p.aimLockUntil=chosen?now+(force?520:260):0;document.documentElement.dataset.autoAimTarget=chosen?.name||"none";return chosen;}

  function updateAutoAim(force=false){const p=game.player;if(game.scene!=="expedition"||p.swing)return null;const target=autoAimTarget(force);if(target){setPlayerAim(target.x-p.x,target.y-p.y);document.documentElement.dataset.autoAimAngle=p.aimAngle.toFixed(3);}return target;}

  function attack() {
    if (game.scene !== "expedition" || game.paused || isModalOpen() || game.player.attackCd > 0 || game.player.dash > 0) return;
    const p = game.player; const st = stats(); const now = performance.now() / 1000; const weaponType = equippedWeaponType(); const profile = WEAPON_PROFILES[weaponType];
    p.combo = now <= p.comboUntil ? p.combo % 3 + 1 : 1; p.comboUntil = now + .62;
    updateAutoAim(true);let dx = p.dirX, dy = p.dirY;
    setPlayerAim(dx,dy);dx=p.dirX;dy=p.dirY;
    const finisherDuration={sword:.4,spear:.36,axe:.64,staff:.44,daggers:.5}[weaponType],duration = (p.combo === 3 ? finisherDuration : p.combo === 2 ? .29 : .24) / profile.speed;
    p.attackCd = duration / st.attackSpeed;
    p.swing = { t: duration, max: duration, combo: p.combo, dx, dy, hits: new Set(), weaponType, profile, fired: false, daggerStage:0, daggerHits:[new Set(),new Set(),new Set()], comboFx:`${weaponType}-${p.combo}` };
    document.documentElement.dataset.comboFx=p.swing.comboFx;
    p.recoveryPose=0;
    if (weaponType === "spear" && p.combo === 3) { p.dash=Math.max(p.dash,.22);p.invuln=Math.max(p.invuln,.12);p.vx=dx*500;p.vy=dy*500; }
    playWeaponSfx(weaponType,p.combo);
  }

  function useActiveSkill(slot=1) {
    if(game.scene!=="expedition"||game.paused||isModalOpen())return;const p=game.player,st=stats(),type=equippedWeaponType();
    if(slot===2){if(p.activeCd2>0)return toast(`星爆术冷却 ${p.activeCd2.toFixed(1)} 秒`,"#d4b0ff");if(game.save.player.stamina<45)return toast("耐力不足","#e5cf69");game.save.player.stamina-=45;p.activeCd2=9;p.recoveryPose=.55;game.enemies.filter(e=>!e.dead&&dist(e,p)<165).forEach(e=>{const a=Math.atan2(e.y-p.y,e.x-p.x),crit=Math.random()<st.critRate;damageEnemy(e,st.attack*2.15*offensiveMultiplier(e)*(crit?st.critDamage:1),crit,Math.cos(a)*230,Math.sin(a)*230);});for(let i=0;i<12;i++){const a=i/12*Math.PI*2;spawnProjectile({x:p.x,y:p.y,dx:Math.cos(a),dy:Math.sin(a),speed:235,damage:st.attack*.65,team:"player",effect:9,radius:9,life:.75,pierce:1});}spawnImpact(p.x,p.y,9,175,.55);burst(p.x,p.y,"#e4a4ff",30,230);playWeaponSfx("staff",3);return;}
    if(p.activeCd1>0)return toast(`武器战技冷却 ${p.activeCd1.toFixed(1)} 秒`,"#ffe09a");if(game.save.player.stamina<28)return toast("耐力不足","#e5cf69");updateAutoAim(true);game.save.player.stamina-=28;p.activeCd1=5.2;p.recoveryPose=.48;p.weaponDrawn=.48;const dx=Math.cos(p.aimAngle),dy=Math.sin(p.aimAngle),hit=(e,mult,knock=180)=>{const crit=Math.random()<st.critRate;damageEnemy(e,st.attack*mult*offensiveMultiplier(e)*(crit?st.critDamage:1),crit,dx*knock,dy*knock);rollOffensiveAffixes(e);};
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
    if (game.scene === "camp") {
      if(Math.hypot(game.player.x-205,game.player.y-492)<145)return openPanel("forge-panel");
      return openPanel("continent-panel");
    }
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
    if(!game.world.exit){if(location.search.includes("qa=1"))markQa("interact:none",{ok:true,phase:"empty-interaction"});return;}
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

  function explorationPercent() {
    const w=game.world;if(!w)return 100;let explored=0;
    for(const key of w.revealed){const [x,y]=key.split(",").map(Number);if(x>=0&&y>=0&&x<w.cols&&y<w.rows&&w.tiles[y][x]!==0)explored++;}
    return clamp(Math.round(explored/Math.max(1,w.explorableCount)*100),0,100);
  }

  function spawnExitNearPlayer(announce=true) {
    const w=game.world;if(!w||w.exitSpawned)return;
    const px=Math.floor(game.player.x/TILE),py=Math.floor(game.player.y/TILE);
    const candidates=w.walkableCells.filter(cell=>{const d=Math.hypot(cell.x-px,cell.y-py);return d>=2.2&&d<=5.2&&w.tiles[cell.y][cell.x]===1;}).sort((a,b)=>Math.abs(Math.hypot(a.x-px,a.y-py)-3.4)-Math.abs(Math.hypot(b.x-px,b.y-py)-3.4));
    const exit=candidates[0]||w.walkableCells.find(cell=>w.tiles[cell.y][cell.x]===1&&!(cell.x===px&&cell.y===py))||w.fallbackExit;
    w.exit={x:exit.x,y:exit.y};w.exitSpawned=true;w.exitLocked=false;w.tiles[exit.y][exit.x]=4;
    for(let yy=-2;yy<=2;yy++)for(let xx=-2;xx<=2;xx++)w.revealed.add(`${exit.x+xx},${exit.y+yy}`);
    const ex=(exit.x+.5)*TILE,ey=(exit.y+.5)*TILE;burst(ex,ey,BIOMES[game.biome].accent,28,190);playSfx("portal");
    if(announce)toast(game.depth<5?"最后一个敌人已倒下，下一层星门在你附近显现！":"区域核心崩解，返程星门在你附近显现！","#ffe580");
  }

  function killEnemy(e) {
    e.dead = true; game.runLoot.kills++;
    const xp = Math.round((e.boss ? 150 : 14) * (1 + game.biome * .45 + game.depth * .15));
    const gold = Math.round((e.boss ? 160 : 7 + Math.random() * 9) * (1 + game.biome * .35));
    game.save.player.xp += xp; game.save.currencies.gold += gold; game.runLoot.gold += gold;
    numberFx(e.x, e.y - 28, `+${xp} XP  +${gold} ◉`, "#f8d16a"); burst(e.x, e.y, e.color, e.boss ? 35 : 13, e.boss ? 220 : 120);
    if (e.boss) {
      spawnGroundDrop("equipment",e.x-20,e.y,{item:generateItem(game.biome, game.depth, 2, new RNG(Date.now() + "boss1"))});
      spawnGroundDrop("equipment",e.x+20,e.y,{item:generateItem(game.biome, game.depth, 1, new RNG(Date.now() + "boss2"))});
      spawnGroundDrop("potion",e.x,e.y+18);spawnGroundDrop("potion",e.x,e.y+18);
      spawnGroundDrop("material",e.x,e.y-20,{material:BIOMES[game.biome].core,amount:1});
      spawnExitNearPlayer(true);
    } else if (Math.random() < .115 + game.save.skills.explore.alchemy * .08) {
      spawnGroundDrop("equipment",e.x,e.y,{item:generateItem(game.biome, game.depth, 0, new RNG(Date.now()+e.name+e.x), 3)});
    }
    const biome=BIOMES[game.biome],rareChance=e.boss?1:Math.min(.92,(e.elite?.72:.07+game.depth*.012)*(1+statValue("rareFind")));
    if(!e.boss){const material=Math.random()<.3?biome.ore:biome.primary,amount=e.elite?2:1;spawnGroundDrop("material",e.x,e.y,{material,amount});}
    if(Math.random()<rareChance){const amount=e.boss?2:1;spawnGroundDrop("material",e.x,e.y,{material:biome.rare,amount});numberFx(e.x,e.y-46,`${biome.rareName} ×${amount}`,biome.accent);}
    if(!e.boss&&Math.random()<(e.elite?.24:.055))spawnGroundDrop("potion",e.x,e.y);
    if(!e.boss&&game.depth<5&&!game.enemies.some(enemy=>!enemy.dead&&!enemy.boss))spawnExitNearPlayer(true);
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

  function emitBossMoveFx(e,dt){
    if(!e.boss||Math.hypot(e.vx||0,e.vy||0)<18)return;e.moveFxTick=(e.moveFxTick||0)-dt;if(e.moveFxTick>0)return;e.moveFxTick=.075;
    const kinds=["leaf","ember","ice","spark","void"],colors=["#8fd56e","#ff8b43","#d9f7ff","#c69aff","#f15abd"],kind=kinds[game.biome],color=colors[game.biome],speed=Math.hypot(e.vx,e.vy)||1;
    for(let i=0;i<2;i++){const side=(Math.random()-.5)*e.radius*1.15;game.particles.push({x:e.x-e.vx/speed*e.radius*.55-e.vy/speed*side,y:e.y+e.radius*.52-e.vy/speed*e.radius*.18+e.vx/speed*side,vx:-e.vx*.12+(Math.random()-.5)*45,vy:-25-Math.random()*35,life:.42+Math.random()*.3,max:.72,color,size:4+Math.random()*5,kind,rotation:Math.random()*Math.PI*2,spin:(Math.random()-.5)*8});}
  }

  function addCircle(x, y, r, delay, damage, color, status = null, effect = 0, monsterFx = null) {
    game.telegraphs.push({ type: "circle", x, y, r, life: delay, max: delay, damage, color, status, effect, monsterFx });
  }

  function addLine(x, y, x2, y2, width, delay, damage, color, status = null, effect = 0, specialFx = null, monsterFx = null) {
    game.telegraphs.push({ type: "line", x, y, x2, y2, width, life: delay, max: delay, damage, color, status, effect, specialFx, monsterFx });
  }

  function addCone(x, y, angle, range, arc, delay, damage, color, status = null, effect = 0, monsterFx = null) {
    game.telegraphs.push({ type: "cone", x, y, angle, range, arc, life: delay, max: delay, damage, color, status, effect, monsterFx });
  }

  function fireRadial(e, count, speed, effect, damage, status = null, offset = 0, monsterFx = null) {
    for (let i = 0; i < count; i++) { const a = i / count * Math.PI * 2 + offset; spawnProjectile({ x:e.x, y:e.y, dx:Math.cos(a), dy:Math.sin(a), speed, effect, damage, status, owner:e, monsterFx }); }
  }

  function startCharge(e, tx, ty, speed, duration, damage, status = null, monsterFx = null) {
    const len = Math.hypot(tx - e.x, ty - e.y) || 1; e.state = "charge"; e.stateTime = duration; e.vx = (tx - e.x) / len * speed; e.vy = (ty - e.y) / len * speed; e.chargeDamage = damage; e.chargeStatus = status; e.chargeHit = false; e.chargeMonsterFx = monsterFx;
  }

  function bossSpecial(e) {
    const p = game.player, biome = game.biome, pattern = e.pattern++ % 4, enraged = e.hp < e.maxHp * .45;
    if (enraged && !e.enraged) { e.enraged = true; toast(`${e.name}进入元素暴走阶段！`, BIOMES[biome].accent); }
    const bonus = enraged ? 3 : 0, aim = Math.atan2(p.y - e.y, p.x - e.x), bossFx = { col: biome, row: pattern };
    e.activeBossFx=bossFx;
    const circle = (...args) => addCircle(...args, bossFx);
    const line = (...args) => addLine(...args, null, bossFx);
    const cone = (...args) => addCone(...args, bossFx);
    const radial = (...args) => fireRadial(...args, bossFx);
    const charge = (...args) => startCharge(...args, bossFx);
    spawnMonsterFx(e.x+Math.cos(aim)*42,e.y+Math.sin(aim)*36,biome,pattern,aim,155,.68);
    if (biome === 0) {
      if (pattern === 0) { circle(p.x,p.y,58,.82,e.damage*1.2,"#82d764","stun",10); for(let i=0;i<6+bonus;i++){const a=i/(6+bonus)*Math.PI*2;circle(p.x+Math.cos(a)*98,p.y+Math.sin(a)*98,28,.95,e.damage*.8,"#6fbd55","poison",10);} }
      if (pattern === 1) { radial(e,10+bonus,155,5,e.damage*.72,"poison",game.zoneTime); if(game.enemies.filter(x=>!x.dead&&!x.boss).length<18){for(let i=0;i<(enraged?3:2);i++){const a=i*Math.PI+(Math.random()-.5);spawnEnemy(1,e.x+Math.cos(a)*75,e.y+Math.sin(a)*75,false);}} }
      if (pattern === 2) { for(let i=0;i<4+(enraged?2:0);i++){const a=i/(4+(enraged?2:0))*Math.PI;line(e.x-Math.cos(a)*260,e.y-Math.sin(a)*260,e.x+Math.cos(a)*260,e.y+Math.sin(a)*260,22,.88,e.damage,"#9be071","stun",10);} }
      if (pattern === 3) { for(let i=-2-bonus;i<=2+bonus;i++){const a=aim+i*.13;spawnProjectile({x:e.x,y:e.y,dx:Math.cos(a),dy:Math.sin(a),speed:215,effect:5,damage:e.damage*.65,status:"poison",owner:e,monsterFx:bossFx});} }
    } else if (biome === 1) {
      if (pattern === 0) cone(e.x,e.y,aim,250,1.18,.78,e.damage*1.25,"#ff7138","burn",6);
      if (pattern === 1) for(let i=0;i<7+bonus;i++) circle(p.x+(Math.random()-.5)*270,p.y+(Math.random()-.5)*210,34,.65+i*.09,e.damage,"#ff723c","burn",6);
      if (pattern === 2) charge(e,p.x,p.y,enraged?480:410,.72,e.damage*1.45,"burn");
      if (pattern === 3) { radial(e,12+bonus,190,6,e.damage*.72,"burn",game.zoneTime); for(let i=0;i<8;i++){const a=i/8*Math.PI*2;circle(e.x+Math.cos(a)*120,e.y+Math.sin(a)*120,30,.9,e.damage*.8,"#f05a31","burn",6);} }
    } else if (biome === 2) {
      if (pattern === 0) { for(let i=0;i<10+bonus;i++){const a=i/(10+bonus)*Math.PI*2;circle(e.x+Math.cos(a)*125,e.y+Math.sin(a)*125,25,.8,e.damage,"#b9efff","slow",12);} circle(p.x,p.y,44,1.02,e.damage*1.1,"#e2f9ff","slow",12); }
      if (pattern === 1) radial(e,14+bonus,175,7,e.damage*.68,"slow",game.zoneTime);
      if (pattern === 2) for(let i=-1-(enraged?1:0);i<=1+(enraged?1:0);i++){const a=aim+i*.28;line(e.x,e.y,e.x+Math.cos(a)*390,e.y+Math.sin(a)*390,24,.82,e.damage*1.15,"#aeeeff","slow",7);}
      if (pattern === 3) { const a=Math.random()*Math.PI*2;e.x=p.x+Math.cos(a)*150;e.y=p.y+Math.sin(a)*150;burst(e.x,e.y,"#c8f4ff",18,150);for(let i=-2-bonus;i<=2+bonus;i++){const q=aim+Math.PI+i*.14;spawnProjectile({x:e.x,y:e.y,dx:Math.cos(q),dy:Math.sin(q),speed:245,effect:7,damage:e.damage*.72,status:"slow",owner:e,monsterFx:bossFx});} }
    } else if (biome === 3) {
      if (pattern === 0) { circle(p.x,p.y,48,.68,e.damage*1.35,"#c89cff","stun",8);for(let i=0;i<7+bonus;i++)circle(p.x+(Math.random()-.5)*450,p.y+(Math.random()-.5)*330,32,.82+Math.random()*.3,e.damage*.85,"#a879ff","stun",8); }
      if (pattern === 1) radial(e,12+bonus,230,8,e.damage*.7,"stun",game.zoneTime);
      if (pattern === 2) charge(e,p.x,p.y,enraged?560:470,.52,e.damage*1.3,"stun");
      if (pattern === 3) { for(let i=-2;i<=2;i++)line(p.x-280,p.y+i*64,p.x+280,p.y+i*64,17,.78+i*.06,e.damage,"#b47aff","stun",8);for(let i=-2;i<=2;i++)line(p.x+i*64,p.y-240,p.x+i*64,p.y+240,17,1.02+i*.04,e.damage,"#8c63e7","stun",8); }
    } else {
      if (pattern === 0) { radial(e,14+bonus,205,9,e.damage*.7,"charm",game.zoneTime);for(let i=0;i<3;i++){const a=Math.random()*Math.PI*2;spawnProjectile({x:e.x,y:e.y,dx:Math.cos(a),dy:Math.sin(a),speed:145,effect:9,damage:e.damage*.85,status:"charm",homing:.9,owner:e,monsterFx:bossFx});} }
      if (pattern === 1 && game.enemies.filter(x=>!x.dead&&!x.boss).length<20) for(let i=0;i<(enraged?4:3);i++){const a=i/(enraged?4:3)*Math.PI*2;spawnEnemy(i%4,e.x+Math.cos(a)*90,e.y+Math.sin(a)*90,false);}
      if (pattern === 2) for(let i=0;i<4+(enraged?2:0);i++){const a=game.zoneTime+i/(4+(enraged?2:0))*Math.PI;line(e.x-Math.cos(a)*330,e.y-Math.sin(a)*330,e.x+Math.cos(a)*330,e.y+Math.sin(a)*330,24,.88,e.damage*1.08,"#ee55b2","charm",9);}
      if (pattern === 3) { circle(p.x,p.y,78,1.02,e.damage*1.45,"#ff5cae","charm",9);for(let i=0;i<8+bonus;i++){const a=i/(8+bonus)*Math.PI*2;circle(p.x+Math.cos(a)*128,p.y+Math.sin(a)*128,35,.78,e.damage*.8,"#8c57d5","charm",9);} }
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
      if(t.specialFx==="treantRoots")spawnTreantLineFx(t);
      if(t.monsterFx)spawnTelegraphMonsterImpacts(t);
      else if(t.specialFx!=="treantRoots")spawnImpact(ix,iy,t.effect||0,t.type==="line"?72:Math.max(46,(t.r||42)*1.25));
      burst(ix,iy,t.color,12,120);game.screenShake=Math.max(game.screenShake,t.specialFx==="treantRoots"?8:5);game.telegraphs.splice(i,1);
    }
  }

  function spawnTelegraphMonsterImpacts(t) {
    const fx=t.monsterFx;if(!fx)return;
    if(t.type==="line"){
      const length=Math.hypot(t.x2-t.x,t.y2-t.y),angle=Math.atan2(t.y2-t.y,t.x2-t.x),count=clamp(Math.ceil(length/96),3,8);
      for(let i=0;i<count;i++){const q=(i+.5)/count;spawnMonsterFx(lerp(t.x,t.x2,q),lerp(t.y,t.y2,q),fx.col,fx.row,angle,Math.max(72,length/count*1.06),.46+i*.025);}
    }else if(t.type==="cone"){
      for(const q of [.28,.52,.78])spawnMonsterFx(t.x+Math.cos(t.angle)*t.range*q,t.y+Math.sin(t.angle)*t.range*q,fx.col,fx.row,t.angle,68+q*42,.46);
    }else{
      spawnMonsterFx(t.x,t.y,fx.col,fx.row,0,Math.max(82,t.r*1.55),.5);
      if(t.r>46)for(let i=0;i<4;i++){const a=i*Math.PI/2;spawnMonsterFx(t.x+Math.cos(a)*t.r*.72,t.y+Math.sin(a)*t.r*.72,fx.col,fx.row,a,54,.4+i*.025);}
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

  function updateEnemy(e,dt){if(e.dead)return;e.flash-=dt;e.hit-=dt;e.hurtFx-=dt;e.launchFx=Math.max(0,(e.launchFx||0)-dt);e.attackCd-=dt;e.specialCd-=dt;e.statusTick=(e.statusTick||0)-dt;e.statuses||={};Object.keys(e.statuses).forEach(k=>{e.statuses[k]-=dt;if(e.statuses[k]<=0)delete e.statuses[k];});if(e.statusTick<=0&&(e.statuses.burn||e.statuses.poison)){e.statusTick=.7;const dot=stats().attack*(e.statuses.burn?.12:.08);e.hp-=dot;numberFx(e.x,e.y-e.radius-8,`-${Math.ceil(dot)}`,e.statuses.burn?"#ff8a43":"#99db4d");spawnImpact(e.x,e.y,e.statuses.burn?11:13,34,.35);if(e.hp<=0){killEnemy(e);return;}}const p=game.player,dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;if(e.statuses.stun){e.vx*=Math.pow(.03,dt);e.vy*=Math.pow(.03,dt);return;}
    if(e.boss&&e.specialCd<=0&&e.state!=="charge"){bossSpecial(e);e.specialCd=Math.max(2.25,(5-game.biome*.28)*(e.hp<e.maxHp*.45?.72:1));if(e.state!=="charge"){e.state="special";e.stateTime=.55;}return;}
    if(e.state==="charge"){
      e.stateTime-=dt;moveEntity(e,e.vx*dt,e.vy*dt,e.radius*.65);emitBossMoveFx(e,dt);
      e.chargeFxTick=(e.chargeFxTick||0)-dt;
      if(e.chargeMonsterFx&&e.chargeFxTick<=0){e.chargeFxTick=.09;spawnMonsterFx(e.x,e.y,e.chargeMonsterFx.col,e.chargeMonsterFx.row,Math.atan2(e.vy,e.vx),e.boss?118:72,.28);}
      if(!e.chargeHit&&dist(e,p)<e.radius+p.radius+8){e.chargeHit=true;if(damagePlayer(e.chargeDamage,e.x,e.y))applyPlayerStatus(e.chargeStatus,e.chargeStatus==="stun"?.6:2.5);if(e.chargeMonsterFx)spawnMonsterFx(p.x,p.y,e.chargeMonsterFx.col,e.chargeMonsterFx.row,Math.atan2(e.vy,e.vx),145,.48);}
      if(e.stateTime<=0){if(e.chargeMonsterFx)spawnMonsterFx(e.x,e.y,e.chargeMonsterFx.col,e.chargeMonsterFx.row,Math.atan2(e.vy,e.vx),155,.5);e.chargeMonsterFx=null;e.state="recover";e.stateTime=.38;e.attackCd=e.boss?.8:(e.attack?.cooldown||1.5);}return;
    }
    if(e.state==="hit"||e.state==="special"||e.state==="recover"){e.stateTime-=dt;moveEntity(e,e.vx*dt,e.vy*dt,e.radius*.65);e.vx*=Math.pow(.04,dt);e.vy*=Math.pow(.04,dt);if(e.stateTime<=0)e.state="chase";return;}
    if(e.state==="windup"){e.stateTime-=dt;e.vx*=.7;e.vy*=.7;if(e.stateTime<=0)performEnemyAttack(e);return;}
    const range=e.boss?e.radius+p.radius+28:e.attack.range;if(d<range&&e.attackCd<=0){e.state="windup";e.pendingAttack=e.boss?"bossMelee":e.attack.id;e.stateTime=e.boss?.42:e.attack.windup;e.targetX=p.x;e.targetY=p.y;e.vx=e.vy=0;return;}
    if(d<(e.boss?430:Math.max(300,e.attack.range+40))){e.state="chase";const speed=e.speed*(game.biome===4&&game.altars.filter(a=>a.lit).length<2?1.12:1)*(e.statuses.slow?.58:1);const preferred=e.boss?55:(e.attack.range>180?e.attack.range*.72:32);if(d>preferred){e.vx=dx/d*speed;e.vy=dy/d*speed;moveEntity(e,e.vx*dt,e.vy*dt,e.radius*.7);emitBossMoveFx(e,dt);}else{e.vx=e.vy=0;}}
    else{e.state="patrol";e.phase+=dt;const tx=e.homeX+Math.cos(e.phase*.7)*45,ty=e.homeY+Math.sin(e.phase*.53)*45,pd=Math.hypot(tx-e.x,ty-e.y)||1;e.vx=(tx-e.x)/pd*e.speed*.28;e.vy=(ty-e.y)/pd*e.speed*.28;moveEntity(e,e.vx*dt,e.vy*dt,e.radius*.7);emitBossMoveFx(e,dt);}
  }

  function updatePlayer(dt) {
    const p = game.player; const st = stats();
    p.invuln -= dt; p.attackCd -= dt; p.dash -= dt;p.weaponDrawn=Math.max(0,(p.weaponDrawn||0)-dt);p.activeCd1=Math.max(0,(p.activeCd1||0)-dt);p.activeCd2=Math.max(0,(p.activeCd2||0)-dt);p.recoveryPose=Math.max(0,(p.recoveryPose||0)-dt); p.hurtFx = Math.max(0,(p.hurtFx||0)-dt); p.statusTick = (p.statusTick||0)-dt;
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
    if(game.scene==="expedition"&&!p.swing)updateAutoAim(false);
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
      p.swing.t -= dt; const swing = p.swing,progress=clamp(1-swing.t/swing.max,0,1);
      if (swing.t < swing.max * .76 && swing.t > swing.max * .18) {
        if(swing.weaponType==="staff"&&!swing.fired){swing.fired=true;const mult=swing.combo===3?1.75:1,spread=swing.combo===3?[-.16,0,.16]:[0];spread.forEach(off=>{const a=Math.atan2(swing.dy,swing.dx)+off;spawnProjectile({x:p.x+swing.dx*18,y:p.y+swing.dy*18,dx:Math.cos(a),dy:Math.sin(a),speed:330,damage:st.attack*swing.profile.damage*mult,team:"player",effect:3,radius:11,pierce:swing.combo===3?2:0});});beep(520,.09,"sine",.03);}
        if(swing.weaponType==="sword"&&swing.combo===3&&!swing.fired){swing.fired=true;spawnProjectile({x:p.x+swing.dx*24,y:p.y+swing.dy*24,dx:swing.dx,dy:swing.dy,speed:405,damage:st.attack*1.8,team:"player",effect:0,radius:18,life:1.15,pierce:3,playerFx:"swordWave"});burst(p.x+swing.dx*30,p.y+swing.dy*30,"#bfefff",13,155);}
        if(swing.weaponType==="daggers"&&swing.combo===3){const thresholds=[.24,.5,.73];while(swing.daggerStage<3&&progress>=thresholds[swing.daggerStage]){const stage=swing.daggerStage++,stageHits=swing.daggerHits[stage],reach=swing.profile.reach+18+stage*5,hitX=p.x+swing.dx*reach,hitY=p.y+swing.dy*reach;moveEntity(p,swing.dx*7,swing.dy*7,p.radius);game.enemies.forEach(e=>{if(e.dead||stageHits.has(e)||pointSegmentDistance(e.x,e.y,p.x,p.y,hitX,hitY)>=e.radius+swing.profile.width+8)return;stageHits.add(e);let mult=[.62,.68,.92][stage]*swing.profile.damage;if(game.save.skills.fury.finisher)mult*=1.22;const crit=Math.random()<st.critRate,damage=st.attack*mult*offensiveMultiplier(e)*(crit?st.critDamage:1);damageEnemy(e,damage,crit,swing.dx*(70+stage*30),swing.dy*(70+stage*30));rollOffensiveAffixes(e);spawnImpact(e.x,e.y,4,44+stage*9,.22);});burst(p.x+swing.dx*reach,p.y+swing.dy*reach,stage===2?"#efb4ff":"#d6e9ff",7+stage*3,105+stage*20);}}
        if(!["staff"].includes(swing.weaponType)&&!(swing.weaponType==="sword"&&swing.combo===3)&&!(swing.weaponType==="daggers"&&swing.combo===3)){
          const reach=swing.profile.reach+(swing.combo===3?(swing.weaponType==="axe"?22:14):0),hitX=p.x+swing.dx*reach,hitY=p.y+swing.dy*reach;
          game.enemies.forEach(e => {
            if (e.dead || swing.hits.has(e)) return;
            const radialFinisher=swing.combo===3&&swing.weaponType==="axe",range=e.radius+swing.profile.width+(swing.combo===3?(swing.weaponType==="axe"?28:12):0)+(radialFinisher?reach*.65:0),distance=radialFinisher?dist(e,p):pointSegmentDistance(e.x,e.y,p.x,p.y,hitX,hitY);
            if (distance < range) {
              swing.hits.add(e); let mult = (swing.combo === 1 ? 1 : swing.combo === 2 ? 1.15 : 1.7)*swing.profile.damage;
              if (swing.combo === 3 && game.save.skills.fury.finisher) mult *= 2;
              if (Object.values(game.save.equipment.equipped).some(i => i && i.legendary?.id === "voidheart") && game.save.player.hp < st.maxHp * .3) mult *= 1.25;
              const crit = Math.random() < st.critRate; let damage = st.attack * mult * offensiveMultiplier(e) * (crit ? st.critDamage : 1);
              const knock = (swing.combo===3?swing.profile.knock*1.7:swing.profile.knock)*(game.save.skills.fury.finisher&&swing.combo===3?2:1);
              damageEnemy(e, damage, crit, swing.dx * knock, swing.dy * knock);
              if(swing.weaponType==="spear"&&swing.combo===2){e.launchFx=.42;applyEnemyStatus(e,"stun",.36);}
              rollOffensiveAffixes(e);
              spawnImpact(e.x,e.y,WEAPON_TYPES.indexOf(swing.weaponType),swing.weaponType==="axe"?72:48);
              const steal = st.lifeSteal + (Object.values(game.save.equipment.equipped).some(i => i && i.legendary?.id === "bloodblade") ? .05 : 0);
              if (steal > 0) game.save.player.hp = Math.min(st.maxHp, game.save.player.hp + damage * steal);
            }
          });
        }
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
      const p = game.particles[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rotation=(p.rotation||0)+(p.spin||0)*dt;p.vx *= Math.pow(.08, dt); p.vy *= Math.pow(.08, dt);
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
    updatePlayer(dt); syncLayeredPlayerVisual(dt); updateEffects(dt);
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
    const dw=Math.max(1,Math.round(w)),dh=Math.max(1,Math.round(h));ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x),Math.round(y));ctx.rotate(rotation);ctx.scale(flip?-1:1,1);ctx.globalAlpha*=alpha;ctx.filter=filter;ctx.drawImage(img,Math.round(col*sw),Math.round(row*sh),Math.round(sw),Math.round(sh),Math.round(-dw/2),Math.round(-dh/2),dw,dh);ctx.restore();return true;
  }
  function drawAtlasSubCell(img,col,row,cols,rows,subRect,x,y,w,h,{flip=false,rotation=0,alpha=1,filter="none",originX=.5,originY=.5}={}){
    if(!img?.complete||!img.naturalWidth)return false;const cellW=img.naturalWidth/cols,cellH=img.naturalHeight/rows,[sx,sy,sw,sh]=subRect;
    const x0=Math.round((col+sx)*cellW),y0=Math.round((row+sy)*cellH),x1=Math.round((col+sx+sw)*cellW),y1=Math.round((row+sy+sh)*cellH);
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(rotation);ctx.scale(flip?-1:1,1);ctx.globalAlpha*=alpha;ctx.filter=filter;ctx.imageSmoothingEnabled=false;
    ctx.drawImage(img,x0,y0,Math.max(1,x1-x0),Math.max(1,y1-y0),Math.round(-w*originX),Math.round(-h*originY),Math.round(w),Math.round(h));ctx.restore();return true;
  }
  function drawBiomeObject(col,x,y,size,opts={}){return drawAtlasCell(ART[BIOME_ART_KEYS[game.biome]],col,1,5,2,x,y,size,size,opts);}
  function drawEffect(index,x,y,size,opts={}){return drawAtlasCell(ART.effects,index%5,Math.floor(index/5),5,3,x,y,size,size,opts);}
  function drawMonsterEffect(col,row,x,y,size,opts={}){return drawAtlasCell(ART.monsterEffects,col,row,5,4,x,y,size,size,opts);}
  function drawTreantEffect(frame,x,y,w,h,opts={}){return drawAtlasCell(ART.treantRoots,clamp(frame,0,3),0,4,1,x,y,w,h,opts);}
  function drawSwordWave(x,y,size,opts={}){return drawAtlasCell(ART.swordWave,0,0,1,1,x,y,size,size,opts);}

  function drawCamp(time) {
    const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,"#141b2b");grad.addColorStop(1,"#1b211f");ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=TILE)for(let x=0;x<W;x+=TILE){if(!drawAtlasCell(ART.terrain,0,0,5,2,x+TILE/2,y+TILE/2,TILE,TILE)){ctx.fillStyle="#28322b";ctx.fillRect(x,y,TILE,TILE);}}
    drawAtlasCell(ART.waste,4,1,5,2,205,492,150+Math.sin(time*5)*3,150+Math.sin(time*5)*3);drawAtlasCell(ART.forest,4,1,5,2,1050,492,145,145,{alpha:.9});
    for(let i=0;i<9;i++){const x=145+i*137,y=170+(i%3)*34;ctx.save();ctx.globalAlpha=.18+.12*Math.sin(time*2+i);ctx.fillStyle=i%2?"#ffd56d":"#9ee8c1";ctx.fillRect(x,y,3,3);ctx.restore();}
    drawPlayer(game.player, time);
    ctx.fillStyle = "#fff1bf"; ctx.font = "700 14px Microsoft YaHei"; ctx.textAlign = "center"; ctx.fillText("元素铁匠铺 [B]", 205, 390); ctx.textAlign = "left";
    if(Math.hypot(game.player.x-205,game.player.y-492)<145)drawWorldHint(205,580,"E · 打开元素锻炉","#ffd978");
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

  function drawWorldHint(x,y,text,color="#fff1b3"){
    ctx.save();ctx.font="900 11px Microsoft YaHei";ctx.textAlign="center";ctx.textBaseline="middle";ctx.lineWidth=4;ctx.lineJoin="round";ctx.strokeStyle="rgba(4,5,9,.9)";ctx.strokeText(text,Math.round(x),Math.round(y));ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=5;ctx.fillText(text,Math.round(x),Math.round(y));ctx.restore();
  }

  function drawWorldInteractionLabels(){
    const p=game.player,b=BIOMES[game.biome];
    const placed=[];
    game.groundDrops.filter(d=>dist(d,p)<135).sort((a,c)=>a.y-c.y||a.x-c.x).forEach(d=>{
      let labelY=d.y-(d.kind==="equipment"?49:43);
      while(placed.some(label=>Math.abs(label.x-d.x)<118&&Math.abs(label.y-labelY)<15))labelY-=15;
      placed.push({x:d.x,y:labelY});
      if(d.kind==="equipment"){const q=qualityById(d.item.quality);drawWorldHint(d.x,labelY,`${q.name} ${d.item.name}`,q.color);}
      else if(d.kind==="potion")drawWorldHint(d.x,labelY,"生命药水","#79ef91");
      else{const isCore=d.material===b.core,isRare=d.material===b.rare,color=isCore?"#ffe06e":isRare?"#d78dff":d.material===b.ore?"#9ccfff":b.accent;drawWorldHint(d.x,labelY,`${MATERIAL_NAMES[d.material]} ×${d.amount||1}`,color);}
    });
    const altar=game.altars.find(a=>!a.lit&&dist(a,p)<80);if(altar)drawWorldHint(altar.x,altar.y-62,"E · 点燃祭坛","#ff92e1");
    if(game.world?.exit){const ex=(game.world.exit.x+.5)*TILE,ey=(game.world.exit.y+.5)*TILE;if(Math.hypot(ex-p.x,ey-p.y)<95)drawWorldHint(ex,ey-58,game.depth<5?"E · 前往下一深度":"E · 返回星火营地",b.accent);}
  }

  function drawBossFootFx(e,time){
    const pulse=.5+.5*Math.sin(time*5+e.phase);ctx.save();ctx.translate(Math.round(e.x),Math.round(e.y+e.radius*.55));ctx.globalAlpha=.34+pulse*.16;ctx.lineWidth=2;
    if(game.biome===0){ctx.strokeStyle="#84d66c";for(let i=0;i<4;i++){const a=i*Math.PI/2+time*.08;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(Math.cos(a+.7)*34,Math.sin(a+.7)*14,Math.cos(a)*58,Math.sin(a)*22);ctx.stroke();}}
    else if(game.biome===1){const g=ctx.createRadialGradient(0,0,2,0,0,58);g.addColorStop(0,"rgba(255,210,80,.55)");g.addColorStop(.45,"rgba(255,82,35,.28)");g.addColorStop(1,"rgba(255,40,20,0)");ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,58,23,0,0,Math.PI*2);ctx.fill();}
    else if(game.biome===2){ctx.strokeStyle="#d8f8ff";for(let i=0;i<7;i++){const a=i/7*Math.PI*2;ctx.beginPath();ctx.moveTo(Math.cos(a)*28,Math.sin(a)*11);ctx.lineTo(Math.cos(a)*54,Math.sin(a)*21);ctx.lineTo(Math.cos(a+.16)*43,Math.sin(a+.16)*17);ctx.stroke();}}
    else if(game.biome===3){ctx.strokeStyle="#c89cff";for(let i=0;i<5;i++){const a=i/5*Math.PI*2+time*.3,r=32+i%2*12;ctx.beginPath();ctx.moveTo(Math.cos(a)*12,Math.sin(a)*5);ctx.lineTo(Math.cos(a+.13)*r*.55,Math.sin(a+.13)*r*.25);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r*.42);ctx.stroke();}}
    else{ctx.strokeStyle="#f25bb7";ctx.beginPath();ctx.ellipse(0,0,44+pulse*8,17+pulse*3,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha*=.65;ctx.beginPath();ctx.ellipse(0,0,27-pulse*4,9-pulse,0,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }

  function drawEnemy(e, time) {
    if(e.dead)return;const flying=(game.biome===2&&e.typeIndex===0)||(game.biome===3&&[0,2,3].includes(e.typeIndex))||(game.biome===4&&[0,2,3].includes(e.typeIndex)),slime=game.biome===0&&e.typeIndex===0,launch=(e.launchFx||0)>0?Math.sin(clamp(e.launchFx/.42,0,1)*Math.PI)*24:0,bob=(flying?Math.sin(time*4+e.phase)*6:Math.sin(time*2.4+e.phase)*1.8)-launch;let sx=1,sy=1,rot=0;if(slime){sx=1+Math.sin(time*5+e.phase)*.08;sy=1-Math.sin(time*5+e.phase)*.07;}if(e.state==="windup"){sx*=.9+Math.sin(time*18)*.04;sy*=1.08;}if(e.state==="charge")rot=Math.atan2(e.vy,e.vx)*.08;
    const size=e.boss?132:(e.elite?78:66),img=ART[BIOME_ART_KEYS[game.biome]];if(e.boss)drawBossFootFx(e,time);
    if(e.boss&&e.activeBossFx&&(e.state==="special"||e.state==="charge"))drawMonsterEffect(e.activeBossFx.col,e.activeBossFx.row,e.x,e.y-8,168+Math.sin(time*14)*16,{rotation:time*.45,alpha:.42});
    if(e.elite)drawAtlasCell(ART.eliteLoot,game.biome,0,5,2,e.x,e.y+e.radius*.58,92+Math.sin(time*5)*4,48,{alpha:.82});ctx.save();ctx.translate(e.x,e.y+bob);ctx.scale(sx,sy);drawAtlasCell(img,e.boss?4:e.typeIndex,0,5,2,0,-size*.08,size,size,{flip:e.vx<-.5,rotation:rot,filter:e.flash>0?"brightness(3) saturate(0)":"none"});ctx.restore();
    if(e.state==="windup"){ctx.fillStyle="#ffdfb0";ctx.font="900 10px Microsoft YaHei";ctx.textAlign="center";ctx.fillText(e.boss?"重击":e.attack.name,e.x,e.y-size*.58-8);ctx.textAlign="left";}if(!e.boss&&e.hp<e.maxHp){ctx.fillStyle="#1a1015";ctx.fillRect(e.x-20,e.y-size*.48,40,5);ctx.fillStyle=e.elite?"#ffd15c":"#e45a55";ctx.fillRect(e.x-20,e.y-size*.48,40*Math.max(0,e.hp/e.maxHp),5);}Object.keys(e.statuses||{}).forEach((s,i)=>drawEffect({burn:11,slow:12,poison:13,stun:14}[s]??10,e.x-13+i*13,e.y-size*.58-19,24,{alpha:.9}));
  }

  function drawPlayer(p, time) {
    if (game.equipmentSystem && game.playerVisual) return drawLayeredPlayer(p, time);
    return drawPlayerEmergency(p, time);
  }

  function drawPlayerEmergency(p, time) {
    const angle = Number.isFinite(p.aimAngle) ? p.aimAngle : Math.atan2(p.dirY, p.dirX);
    const ax = Math.cos(angle), ay = Math.sin(angle);
    const col = Math.abs(ax) >= Math.abs(ay) ? (ax >= 0 ? 0 : 2) : (ay >= 0 ? 1 : 3);
    const speed=Math.hypot(p.vx,p.vy),moving=speed>12,running=Boolean(p.running&&moving),hurt=Boolean(p.hurtFx>.11),attack=Boolean(p.swing||p.weaponDrawn>0);
    const walkFrame=Math.floor(time*7)%2,runFrame=Math.floor(time*12)%4,attackProgress=p.swing?clamp(1-p.swing.t/p.swing.max,0,1):0;
    const directionalRow=attack?2+Math.min(2,Math.floor(attackProgress*3)):hurt?4:0;
    const sheet=running?ART.heroBaseRun:moving&&!attack&&!hurt?ART.heroBaseWalk:ART.heroBase;
    const rows=running?4:moving&&!attack&&!hurt?2:5,frameRow=running?runFrame:moving&&!attack&&!hurt?walkFrame:directionalRow;
    const flashFilter=p.hurtFx>0?"brightness(1.6) saturate(.65)":"none";
    const equipped=game.save.equipment.equipped,themeFilter=region=>["none","hue-rotate(235deg) saturate(1.45) brightness(1.05)","hue-rotate(75deg) saturate(.75) brightness(1.35)","hue-rotate(120deg) saturate(1.1) brightness(1.15)","hue-rotate(170deg) saturate(.9) brightness(.72) contrast(1.15)"][clamp(region??0,0,4)];
    const weaponType=equipped.weapon?weaponTypeOf(equipped.weapon):null,weaponCol=Math.max(0,WEAPON_TYPES.indexOf(weaponType)),weaponOrigin={sword:[.33,.58],spear:[.31,.63],axe:[.27,.59],staff:[.16,.60],daggers:[.34,.54]}[weaponType],weaponSize=weaponType==="spear"?60:weaponType==="daggers"?48:weaponType==="staff"?58:56;
    if(equipped.weapon&&!attack){const backSocket=[{x:-10,y:-29},{x:0,y:-29},{x:10,y:-29},{x:0,y:-30}][col];drawAtlasSubCell(ART.wearableEquipment,weaponCol,2,5,3,[0,0,1,1],p.x+backSocket.x,p.y+backSocket.y,weaponSize,weaponSize,{rotation:0,filter:flashFilter,originX:weaponOrigin[0],originY:weaponOrigin[1]});}
    drawAtlasCell(sheet,col,frameRow,4,rows,p.x,p.y-22,82,102,{filter:flashFilter});

    const armorSheet=running?ART.armorRun:moving&&!attack&&!hurt?ART.armorWalk:ART.armorDirectional;
    if(equipped.armor)drawAtlasSubCell(armorSheet,col,frameRow,4,rows,[0,0,1,.72],p.x,p.y-22,82,73,{originY:.7,filter:themeFilter(equipped.armor.region)});
    if(equipped.boots)drawAtlasSubCell(armorSheet,col,frameRow,4,rows,[0,.72,1,.28],p.x,p.y+14,82,29,{filter:themeFilter(equipped.boots.region)});
    if(SHOW_WORN_HELMETS&&equipped.helmet){const socket=[{x:12,y:-38},{x:6,y:-38},{x:-6,y:-38},{x:-8,y:-38}][col];drawAtlasCell(ART.helmetDirectional,clamp(equipped.helmet.region??0,0,4),col,5,4,p.x+socket.x,p.y+socket.y,48,48,{filter:flashFilter});}
    if(equipped.amulet){ctx.save();ctx.globalAlpha=.24+.06*Math.sin(time*5);ctx.strokeStyle=BIOMES[equipped.amulet.region||0].accent;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y-22,30+Math.sin(time*4)*2,0,Math.PI*2);ctx.stroke();ctx.restore();}
    if(equipped.weapon&&attack){const swingArc=p.swing?weaponSwingArc(weaponType,p.swing.combo,attackProgress):0,weaponAngle=angle+swingArc,socket=[{x:15,y:-23},{x:9,y:-19},{x:-15,y:-23},{x:7,y:-27}][col];drawAtlasSubCell(ART.wearableEquipment,weaponCol,2,5,3,[0,0,1,1],p.x+socket.x,p.y+socket.y,weaponSize,weaponSize,{rotation:weaponAngle+Math.PI/4,filter:flashFilter,originX:weaponOrigin[0],originY:weaponOrigin[1]});}
  }

  function drawComboAttackEffect(type,combo,progress,hand,weaponAngle){const alpha=Math.max(.08,Math.sin(progress*Math.PI)),aim=game.player.swing?Math.atan2(game.player.swing.dy,game.player.swing.dx):weaponAngle,ax=Math.cos(aim),ay=Math.sin(aim),px=-ay,py=ax,at=(distance)=>({x:Math.round(hand.x+ax*distance),y:Math.round(hand.y+ay*distance)}),stroke=(x1,y1,x2,y2,color,width)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(Math.round(x1),Math.round(y1));ctx.lineTo(Math.round(x2),Math.round(y2));ctx.stroke();};ctx.save();ctx.globalAlpha*=alpha;ctx.lineCap="round";ctx.lineJoin="round";ctx.shadowBlur=9;
    if(type==="sword"){const point=at(combo===3?54:34),color=combo===1?"#dff5ff":combo===2?"#ffe5a0":"#bdeeff";ctx.shadowColor=color;if(combo===3){drawSwordWave(point.x,point.y,108+progress*24,{rotation:aim,alpha:.88});stroke(hand.x+px*18,hand.y+py*18,point.x+px*22,point.y+py*22,color,3);}else{drawEffect(combo-1,point.x,point.y,68+combo*10,{rotation:weaponAngle,alpha:.72});ctx.beginPath();ctx.arc(hand.x,hand.y,35+combo*5,aim+(combo===1?-1.05:.12),aim+(combo===1?.62:-.8),combo===2);ctx.strokeStyle=color;ctx.lineWidth=4;ctx.stroke();}}
    else if(type==="spear"){const point=at(combo===3?72:50),color=combo===2?"#8edfff":"#fff0bd";ctx.shadowColor=color;stroke(hand.x,hand.y,point.x,point.y,color,combo===3?6:3);stroke(hand.x+px*5,hand.y+py*5,point.x+px*(combo===2?22:7),point.y+py*(combo===2?22:7),"#87bfff",2);drawEffect(combo===2?7:1,point.x,point.y,combo===3?96:62,{rotation:aim+Math.PI/4,alpha:.72});}
    else if(type==="axe"){const point=at(42),color="#d9ecf2";ctx.shadowColor=color;if(combo===3){const cx=Math.round(game.player.x),cy=Math.round(game.player.y-22),spin=axeSpinAngle(progress),radius=54+Math.sin(progress*Math.PI)*13,trailStart=spin-1.12;ctx.globalAlpha*=.9;ctx.strokeStyle="#d9ecf2";ctx.lineWidth=6;ctx.beginPath();ctx.arc(cx,cy,radius,trailStart,spin+.18);ctx.stroke();ctx.strokeStyle="#7894a4";ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,radius-10,trailStart-.22,spin-.08);ctx.stroke();ctx.strokeStyle="#f3fbff";ctx.lineWidth=2;ctx.setLineDash([10,7]);ctx.lineDashOffset=-progress*42;ctx.beginPath();ctx.arc(cx,cy,radius+8,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);for(let i=0;i<6;i++){const a=spin-i*.2,r=radius+10-i*2;stroke(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.56,cx+Math.cos(a)*(r+14),cy+Math.sin(a)*(r+14)*.56,i%2?"#8aa2ad":"#e9f6f7",2);}ctx.fillStyle="#8b7154";ctx.globalAlpha*=.48;for(let i=0;i<7;i++){const a=i/7*Math.PI*2+spin*.22,r=30+(i%3)*11;ctx.fillRect(Math.round(cx+Math.cos(a)*r)-2,Math.round(game.player.y+8+Math.sin(a)*5)-2,4+(i%2)*2,3);}}else{ctx.shadowColor=color;drawEffect(2,point.x,point.y,82+combo*10,{rotation:weaponAngle,alpha:.7});ctx.strokeStyle=color;ctx.lineWidth=4;ctx.beginPath();ctx.arc(game.player.x,game.player.y-12,44,aim-.9,aim+.72);ctx.stroke();}}
    else if(type==="staff"){const point=at(43),color=combo===1?"#a9ddff":combo===2?"#bca9ff":"#f3b8ff";ctx.shadowColor=color;drawEffect(3,point.x,point.y,58+combo*18,{rotation:weaponAngle+Math.PI/4,alpha:.82});ctx.strokeStyle=color;ctx.lineWidth=2;for(let i=0;i<combo;i++){const a=progress*5+i*Math.PI*2/combo;ctx.beginPath();ctx.arc(point.x+Math.cos(a)*(18+combo*3),point.y+Math.sin(a)*(18+combo*3),3+i,0,Math.PI*2);ctx.stroke();}}
    else{const point=at(29),color=combo===3?"#efb9ff":"#dbe5ff";ctx.shadowColor=color;drawEffect(4,point.x,point.y,56+combo*12,{rotation:weaponAngle+2.5,alpha:.72});const strikes=combo===3?3:combo;for(let i=0;i<strikes;i++){const off=(i-(strikes-1)/2)*12,reach=31+i*7;stroke(hand.x+px*off,hand.y+py*off,hand.x+ax*reach+px*(off+8),hand.y+ay*reach+py*(off+8),color,3);}}
    ctx.restore();
  }

  function drawLayeredPlayer(p, time) {
    const character = syncLayeredPlayerVisual(0), renderer = game.equipmentSystem.renderer;
    renderer.render(ctx, character);
    if (p.swing) {
      const type = equippedWeaponType(), weaponAngle = character.pose.weaponAngle + Number(character.pose.worldRotation || 0);
      const wax = Math.cos(weaponAngle), way = Math.sin(weaponAngle);
      const hand = renderer.getWorldAnchor(character, "rightHandAnchor");
      // Every combo effect uses the same frame-level hand socket as the
      // weapon grip; effects therefore cannot drift away from the hand.
      drawComboAttackEffect(type,p.swing.combo,character.pose.attackProgress,hand,weaponAngle);
    }
    Object.keys(p.statuses || {}).forEach((status, index) => {
      const effectIndex = { burn:11, slow:12, poison:13, stun:14, charm:9 }[status];
      drawEffect(effectIndex, Math.round(p.x - 18 + index * 12), Math.round(p.y - 55), 25, { alpha:.82 });
    });
  }

  function drawTelegraph(t){
    const pct=clamp(1-t.life/t.max,0,1),pulse=.86+Math.sin(performance.now()*.012)*.14;
    ctx.save();ctx.fillStyle=t.color;ctx.strokeStyle=t.color;ctx.shadowColor=t.color;ctx.shadowBlur=8;ctx.lineCap="round";ctx.lineJoin="round";
    if(t.type==="circle"){
      ctx.globalAlpha=.045+pct*.07;ctx.beginPath();ctx.arc(t.x,t.y,t.r,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=.38+pct*.48;ctx.lineWidth=2;ctx.setLineDash([8,6]);ctx.lineDashOffset=-pct*36;ctx.beginPath();ctx.arc(t.x,t.y,t.r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      ctx.globalAlpha=.72;ctx.lineWidth=2;ctx.beginPath();ctx.arc(t.x,t.y,t.r*(.18+pct*.78),0,Math.PI*2);ctx.stroke();
      for(let i=0;i<8;i++){const a=i/8*Math.PI*2+pct*.55;ctx.globalAlpha=.45+pct*.35;ctx.beginPath();ctx.moveTo(t.x+Math.cos(a)*t.r*.84,t.y+Math.sin(a)*t.r*.84);ctx.lineTo(t.x+Math.cos(a)*t.r*1.08,t.y+Math.sin(a)*t.r*1.08);ctx.stroke();}
    }else if(t.type==="line"){
      const dx=t.x2-t.x,dy=t.y2-t.y,length=Math.hypot(dx,dy)||1,ux=dx/length,uy=dy/length,nx=-uy,ny=ux,half=t.width*.62;
      ctx.globalAlpha=.055+pct*.07;ctx.lineWidth=Math.max(4,t.width*1.15);ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.lineTo(t.x2,t.y2);ctx.stroke();
      ctx.globalAlpha=.52+pct*.35;ctx.lineWidth=2;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(t.x+nx*half*side,t.y+ny*half*side);ctx.lineTo(t.x2+nx*half*side,t.y2+ny*half*side);ctx.stroke();}
      ctx.globalAlpha=.78;ctx.setLineDash([10,9]);ctx.lineDashOffset=-pct*44;ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.lineTo(t.x2,t.y2);ctx.stroke();ctx.setLineDash([]);
      const chevrons=clamp(Math.floor(length/78),3,8);for(let i=1;i<=chevrons;i++){const q=i/(chevrons+1),cx=lerp(t.x,t.x2,q),cy=lerp(t.y,t.y2,q),back=8;ctx.globalAlpha=.48+pct*.38;ctx.beginPath();ctx.moveTo(cx-ux*back+nx*7,cy-uy*back+ny*7);ctx.lineTo(cx,cy);ctx.lineTo(cx-ux*back-nx*7,cy-uy*back-ny*7);ctx.stroke();}
      if(t.specialFx==="treantRoots"){const angle=Math.atan2(t.y2-t.y,t.x2-t.x),length=Math.hypot(t.x2-t.x,t.y2-t.y),segments=Math.max(3,Math.ceil(length/88)),frame=Math.min(3,Math.floor(pct*4));for(let i=0;i<segments;i++){const q=(i+.5)/segments;drawTreantEffect(frame,lerp(t.x,t.x2,q),lerp(t.y,t.y2,q),length/segments*1.15,45+pct*14,{rotation:angle,alpha:.38+pct*.44});}}
    }else{
      const a0=t.angle-t.arc/2,a1=t.angle+t.arc/2;ctx.globalAlpha=.04+pct*.065;ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.arc(t.x,t.y,t.range,a0,a1);ctx.closePath();ctx.fill();
      ctx.globalAlpha=.48+pct*.4;ctx.lineWidth=2;ctx.setLineDash([9,7]);ctx.lineDashOffset=-pct*34;ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.lineTo(t.x+Math.cos(a0)*t.range,t.y+Math.sin(a0)*t.range);ctx.arc(t.x,t.y,t.range,a0,a1);ctx.lineTo(t.x,t.y);ctx.stroke();ctx.setLineDash([]);
      ctx.globalAlpha=.68;for(const q of [.34,.67]){ctx.beginPath();ctx.arc(t.x,t.y,t.range*q,a0,a1);ctx.stroke();}
      const sweep=lerp(a0,a1,pct);ctx.globalAlpha=.8;ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.lineTo(t.x+Math.cos(sweep)*t.range,t.y+Math.sin(sweep)*t.range);ctx.stroke();
    }
    if(t.monsterFx)drawMonsterTelegraphSprites(t,pct,pulse);
    ctx.restore();
  }

  function drawMonsterTelegraphSprites(t,pct,pulse){
    const fx=t.monsterFx,alpha=.3+pct*.48;
    if(t.type==="line"){
      const length=Math.hypot(t.x2-t.x,t.y2-t.y),angle=Math.atan2(t.y2-t.y,t.x2-t.x),count=clamp(Math.ceil(length/92),3,8),size=Math.max(58,length/count*1.03)*pulse;
      for(let i=0;i<count;i++){const q=(i+.5)/count;drawMonsterEffect(fx.col,fx.row,lerp(t.x,t.x2,q),lerp(t.y,t.y2,q),size,{rotation:angle,alpha});}
    }else if(t.type==="cone"){
      for(const q of [.28,.52,.78])drawMonsterEffect(fx.col,fx.row,t.x+Math.cos(t.angle)*t.range*q,t.y+Math.sin(t.angle)*t.range*q,(54+q*40)*pulse,{rotation:t.angle,alpha});
      for(const side of [-1,1]){const a=t.angle+side*t.arc*.43;drawMonsterEffect(fx.col,fx.row,t.x+Math.cos(a)*t.range*.68,t.y+Math.sin(a)*t.range*.68,66*pulse,{rotation:a,alpha:alpha*.78});}
    }else{
      const count=clamp(Math.ceil(t.r/20),4,9),ring=t.r*(.48+pct*.42),size=clamp(t.r*.78,42,92)*pulse;
      drawMonsterEffect(fx.col,fx.row,t.x,t.y,Math.max(58,t.r*1.12)*pulse,{rotation:pct*Math.PI*.45,alpha:alpha*.72});
      for(let i=0;i<count;i++){const a=i/count*Math.PI*2+pct*.45;drawMonsterEffect(fx.col,fx.row,t.x+Math.cos(a)*ring,t.y+Math.sin(a)*ring,size,{rotation:a,alpha});}
    }
  }
  function drawProjectile(q){const a=Math.atan2(q.vy,q.vx);if(q.playerFx==="swordWave")drawSwordWave(q.x,q.y,q.radius*5.7,{rotation:a,alpha:.96});else if(q.monsterFx)drawMonsterEffect(q.monsterFx.col,q.monsterFx.row,q.x,q.y,q.radius*5.6,{rotation:a,alpha:.96});else drawEffect(q.effect,q.x,q.y,q.radius*3.8,{rotation:a+(q.team==="player"&&q.effect===3?Math.PI/4:0),alpha:.96});}
  function drawImpactFx(f){const pct=1-f.life/f.max;if(f.treantFx)drawTreantEffect(Math.min(3,Math.floor(pct*4)),f.x,f.y,f.width,f.height*(.7+pct*.3),{rotation:f.rotation,alpha:1-pct*.72});else if(f.monsterFx)drawMonsterEffect(f.monsterFx.col,f.monsterFx.row,f.x,f.y,f.size*(.65+pct*.55),{rotation:f.rotation,alpha:1-pct});else drawEffect(f.effect,f.x,f.y,f.size*(.55+pct*.65),{rotation:f.rotation,alpha:1-pct});}

  function drawParticleFx(p){
    ctx.save();ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.translate(Math.round(p.x),Math.round(p.y));ctx.rotate(p.rotation||0);ctx.fillStyle=p.color;ctx.strokeStyle=p.color;ctx.lineWidth=2;const s=Math.max(2,Math.round(p.size));
    if(p.kind==="leaf"){ctx.fillRect(-s/2,-1,s,3);ctx.fillRect(-1,-s/2,3,s);}
    else if(p.kind==="ember"){ctx.fillRect(-s/3,-s/2,Math.max(2,s/2),s);ctx.globalAlpha*=.35;ctx.fillRect(-s,-s,s*2,s*2);}
    else if(p.kind==="ice"){ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(s*.65,s*.65);ctx.lineTo(-s*.65,s*.65);ctx.closePath();ctx.stroke();}
    else if(p.kind==="spark"){ctx.beginPath();ctx.moveTo(-s,-s*.5);ctx.lineTo(0,-1);ctx.lineTo(-2,s*.35);ctx.lineTo(s,s);ctx.stroke();}
    else if(p.kind==="void"){ctx.beginPath();ctx.arc(0,0,s*.8,0,Math.PI*1.55);ctx.stroke();}
    else ctx.fillRect(-s/2,-s/2,s,s);ctx.restore();
  }

  function drawGroundDrop(d,time){d.life=(d.life||0)+1/60;const bob=Math.sin(time*4+d.x*.02)*3,pulse=.78+.2*Math.sin(time*5+d.y*.03);ctx.save();ctx.globalAlpha=.2+pulse*.12;ctx.fillStyle=d.kind==="equipment"?qualityById(d.item.quality).color:d.kind==="potion"?"#79ef91":BIOMES[game.biome].accent;ctx.beginPath();ctx.ellipse(d.x,d.y+11,25,9,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;if(d.kind==="equipment"){const c=equipmentCoords(d.item);drawAtlasCell(ART.equipment,c.col,c.row,5,5,d.x,d.y-8+bob,48,48);ctx.strokeStyle=qualityById(d.item.quality).color;ctx.strokeRect(d.x-20,d.y-28+bob,40,40);}else if(d.kind==="potion")drawAtlasCell(ART.eliteLoot,game.biome,1,5,2,d.x,d.y-7+bob,46,46);else{const c=materialCoords(d.material);drawAtlasCell(ART.materials,c.col,c.row,5,4,d.x,d.y-7+bob,44,44);}ctx.restore();}

  function drawAmbient(time){const bx=game.camera.x,by=game.camera.y;ctx.save();if(game.biome===0){for(let i=0;i<8;i++){const x=bx+((i*211+time*13)% (W+260))-130,y=by+90+(i*83)%H;const g=ctx.createRadialGradient(x,y,0,x,y,90);g.addColorStop(0,"rgba(170,220,175,.09)");g.addColorStop(1,"rgba(80,130,90,0)");ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,120,38,0,0,Math.PI*2);ctx.fill();}}else{for(let i=0;i<34;i++){let x=bx+(i*97+(game.biome===3?time*150:time*(18+game.biome*13)))%W,y=by+(i*61+(game.biome===2?time*70:-time*24))%H;ctx.globalAlpha=.25+(i%5)*.1;ctx.fillStyle=game.biome===1?"#ff9b4c":game.biome===2?"#e8fbff":game.biome===3?"#a98cff":"#e34db3";if(game.biome===2){ctx.fillRect(x,y,3,7);}else if(game.biome===3){ctx.fillRect(x,y,2,12);}else{ctx.fillRect(x,y,3,3);}}}ctx.restore();}

  function drawWorld(time) {
    const w = game.world, b = BIOMES[game.biome]; ctx.fillStyle = b.wall; ctx.fillRect(0, 0, w.cols * TILE, w.rows * TILE);
    const minX = Math.max(0, Math.floor(game.camera.x / TILE) - 1), maxX = Math.min(w.cols, Math.ceil((game.camera.x + W) / TILE) + 1);
    const minY = Math.max(0, Math.floor(game.camera.y / TILE) - 1), maxY = Math.min(w.rows, Math.ceil((game.camera.y + H) / TILE) + 1);
    for (let y = minY; y < maxY; y++) for (let x = minX; x < maxX; x++) drawTile(x, y, w.tiles[y][x], b,time);
    game.resources.forEach(r => drawResource(r, time)); game.altars.forEach(a => drawAltar(a, time));game.groundDrops.forEach(d=>drawGroundDrop(d,time));
    // Darkness belongs to the environment pass. Drawing it before actors and
    // combat VFX keeps abyss/forest attacks emissive instead of hiding bosses,
    // projectiles and telegraphs behind a nearly opaque post-process layer.
    drawAmbient(time);if (game.biome === 0 || game.biome === 4) drawDarkness();
    game.telegraphs.forEach(drawTelegraph);game.projectiles.forEach(drawProjectile);
    [...game.enemies.filter(e => !e.dead), game.player].sort((a,b2) => a.y - b2.y).forEach(e => e === game.player ? drawPlayer(e, time) : drawEnemy(e, time));
    game.impacts.forEach(drawImpactFx);
    game.particles.forEach(drawParticleFx);ctx.globalAlpha = 1;
    game.numbers.forEach(n => { ctx.globalAlpha = Math.max(0, n.life); ctx.font = "900 13px Microsoft YaHei"; ctx.textAlign = "center"; ctx.fillStyle = "#000"; ctx.fillText(n.text, n.x + 2, n.y + 2); ctx.fillStyle = n.color; ctx.fillText(n.text, n.x, n.y); }); ctx.globalAlpha = 1; ctx.textAlign = "left";drawWorldInteractionLabels();
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
    ctx.restore(); drawMinimap();if(!$("map-panel").classList.contains("hidden"))drawWorldMap();
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

  function drawWorldMap() {
    mapCtx.clearRect(0,0,worldMap.width,worldMap.height);mapCtx.fillStyle="#070910";mapCtx.fillRect(0,0,worldMap.width,worldMap.height);
    if(game.scene!=="expedition"||!game.world){mapCtx.fillStyle="#b8ad9d";mapCtx.font="700 18px Microsoft YaHei";mapCtx.textAlign="center";mapCtx.fillText("星火营地无需区域地图",worldMap.width/2,worldMap.height/2);mapCtx.textAlign="left";return;}
    const w=game.world,zoom=game.mapZoom,visibleCols=w.cols/zoom,visibleRows=w.rows/zoom,centerX=game.player.x/TILE,centerY=game.player.y/TILE,startX=clamp(centerX-visibleCols/2,0,Math.max(0,w.cols-visibleCols)),startY=clamp(centerY-visibleRows/2,0,Math.max(0,w.rows-visibleRows)),sx=worldMap.width/visibleCols,sy=worldMap.height/visibleRows,b=BIOMES[game.biome];
    const toScreen=(x,y)=>({x:(x-startX)*sx,y:(y-startY)*sy});
    const minX=Math.floor(startX),maxX=Math.min(w.cols,Math.ceil(startX+visibleCols)),minY=Math.floor(startY),maxY=Math.min(w.rows,Math.ceil(startY+visibleRows));
    for(let y=minY;y<maxY;y++)for(let x=minX;x<maxX;x++){const pt=toScreen(x,y),known=w.revealed.has(`${x},${y}`),tile=w.tiles[y][x];mapCtx.fillStyle=!known?"#090a10":tile===0?"#14121a":tile===4?"#f3c756":tile===6?"#d75934":b.color;mapCtx.fillRect(Math.floor(pt.x),Math.floor(pt.y),Math.ceil(sx+.4),Math.ceil(sy+.4));if(known&&zoom>=2.5){mapCtx.strokeStyle="rgba(255,255,255,.04)";mapCtx.strokeRect(Math.floor(pt.x),Math.floor(pt.y),Math.ceil(sx),Math.ceil(sy));}}
    const marker=(x,y,color,size)=>{const pt=toScreen(x/TILE,y/TILE);if(pt.x<0||pt.y<0||pt.x>worldMap.width||pt.y>worldMap.height)return;mapCtx.fillStyle=color;mapCtx.fillRect(pt.x-size/2,pt.y-size/2,size,size);};
    game.resources.filter(r=>!r.gathered&&w.revealed.has(`${Math.floor(r.x/TILE)},${Math.floor(r.y/TILE)}`)).forEach(r=>marker(r.x,r.y,"#68e8e0",zoom>1?6:4));
    game.groundDrops.filter(d=>w.revealed.has(`${Math.floor(d.x/TILE)},${Math.floor(d.y/TILE)}`)).forEach(d=>marker(d.x,d.y,"#d78dff",zoom>1?6:4));
    game.enemies.filter(e=>!e.dead&&w.revealed.has(`${Math.floor(e.x/TILE)},${Math.floor(e.y/TILE)}`)).forEach(e=>marker(e.x,e.y,e.boss?"#ff3559":"#e86d67",e.boss?10:6));
    if(w.exit)marker((w.exit.x+.5)*TILE,(w.exit.y+.5)*TILE,"#ffe35e",10);
    marker(game.player.x,game.player.y,"#ffffff",9);mapCtx.strokeStyle=BIOMES[game.biome].accent;mapCtx.lineWidth=2;mapCtx.strokeRect(1,1,worldMap.width-2,worldMap.height-2);
    $("map-progress").textContent=`探索进度 ${explorationPercent()}% · 敌人 ${game.enemies.filter(e=>!e.dead).length} · 资源 ${game.resources.filter(r=>!r.gathered).length}`;$("map-zoom-text").textContent=`${zoom.toFixed(1)}×`;
  }

  function setMapZoom(value){game.mapZoom=clamp(Math.round(value*2)/2,1,4);drawWorldMap();}

  function loop(now) {
    const raw = Math.min(.034, (now - game.lastTime) / 1000 || 0); game.lastTime = now;
    if (game.hitStop > 0) game.hitStop -= raw; else update(raw);
    render(now);
    if (!$("character-panel").classList.contains("hidden")) renderPaperdoll(raw);
    requestAnimationFrame(loop);
  }

  function nearbyInteractionGuide(){
    const p=game.player;
    if(game.scene==="camp"){
      if(Math.hypot(p.x-205,p.y-492)<145)return {id:"forge",title:"发现元素锻炉",text:"按 E 打开锻造界面，材料可用于打造、强化、重铸和炼制药剂。"};
      return null;
    }
    if(game.scene!=="expedition")return null;
    const drop=game.groundDrops.find(d=>dist(d,p)<65);
    if(drop)return {id:drop.kind==="equipment"?"equipment-drop":drop.kind==="potion"?"potion-drop":"material-drop",title:drop.kind==="equipment"?"发现掉落装备":drop.kind==="potion"?"发现生命药水":"发现稀有材料",text:`靠近后按 E ${drop.kind==="equipment"?"拾取并放入装备背包":drop.kind==="potion"?"拾取并补充药水袋":"拾取并用于高级锻造"}。`};
    const altar=game.altars.find(a=>!a.lit&&dist(a,p)<60);if(altar)return {id:"altar",title:"发现深渊祭坛",text:"按 E 点燃祭坛，扩大黑暗区域中的可见范围。"};
    const resource=game.resources.find(r=>!r.gathered&&dist(r,p)<55);if(resource)return {id:"resource",title:"发现可采集资源",text:`按 E 采集${MATERIAL_NAMES[resource.type]}，可用于锻造和药剂。`};
    if(game.world?.exit){const ex={x:(game.world.exit.x+.5)*TILE,y:(game.world.exit.y+.5)*TILE};if(dist(ex,p)<80)return {id:"portal",title:"发现远征星门",text:`按 E ${game.depth<5?"前往下一深度":"返回星火营地"}。`};}
    return null;
  }

  function updateInteractionGuide(){
    const candidate=nearbyInteractionGuide();if(!candidate||game.save.tutorial.interactions[candidate.id]||isModalOpen())return;
    game.save.tutorial.interactions[candidate.id]=true;document.documentElement.dataset.lastInteractionHint=candidate.id;saveGame(true);
  }

  function updateHUD() {
    if (game.scene === "title") return;
    updateInteractionGuide();
    const st = stats(), p = game.save.player, need = xpNeeded();
    p.hp = clamp(p.hp, 0, st.maxHp);
    $("hud-level").textContent = `LV.${p.level}`;
    $("hp-fill").style.width = `${p.hp / st.maxHp * 100}%`; $("hp-text").textContent = `${fmt(p.hp)} / ${fmt(st.maxHp)}`;
    $("stamina-fill").style.width = `${p.stamina}%`; $("stamina-text").textContent = `${fmt(p.stamina)} / 100`;
    $("xp-fill").style.width = `${p.xp / need * 100}%`; $("xp-text").textContent = `${fmt(p.xp)} / ${fmt(need)}`;
    $("gold-text").textContent = fmt(game.save.currencies.gold); $("void-text").textContent = fmt(game.save.currencies.void);
    $("bag-badge").textContent = game.unseenItems ? `+${game.unseenItems} · ${game.save.equipment.inventory.length}/${INVENTORY_CAPACITY}` : `${game.save.equipment.inventory.length} / ${INVENTORY_CAPACITY}`;
    $("inventory-btn").dataset.tooltip=`背包 · ${game.unseenItems?`+${game.unseenItems} · `:""}${game.save.equipment.inventory.length} / ${INVENTORY_CAPACITY}`;
    $("inventory-btn").classList.toggle("has-new", game.unseenItems > 0);
    $("forge-dock-btn")?.classList.toggle("hidden",game.scene!=="camp");
    $("return-dock-btn")?.classList.toggle("hidden",game.scene!=="expedition");
    $("sp-badge").textContent = game.save.player.skillPoints ? `${game.save.player.skillPoints} 点可用` : "0 点";
    $("skill-dock-btn").dataset.tooltip=game.save.player.skillPoints?`战技 / 天赋 · ${game.save.player.skillPoints} 点可用`:"战技 / 天赋";
    if (game.scene === "camp") {
      $("area-name").textContent = "星火营地"; $("depth-text").textContent = "安全区 · 可自由移动"; $("explore-text").textContent="探索 100%"; $("quest-text").textContent = "WASD 在营地移动；按 M 选择远征，按 B 打造装备";
      $("boss-wrap").classList.add("hidden"); return;
    }
    const b = BIOMES[game.biome],explored=explorationPercent(),track=resolveBgmTrack(stageMusicKey(game.biome,game.depth)).title; $("area-name").textContent = b.name; $("depth-text").textContent = `深度 ${game.depth} / 5 · ♫ ${track}`;$("explore-text").textContent=`探索 ${explored}%`;
    const boss = game.enemies.find(e => e.boss && !e.dead);
    if (boss) {
      $("boss-wrap").classList.remove("hidden"); $("boss-name").textContent = boss.name; $("boss-fill").style.width = `${Math.max(0,boss.hp / boss.maxHp * 100)}%`;
      $("quest-text").textContent = `击败区域领主「${boss.name}」，解除星门封锁`;
    } else {
      $("boss-wrap").classList.add("hidden");
      const ex = game.world.exit?{ x: (game.world.exit.x + .5) * TILE, y: (game.world.exit.y + .5) * TILE }:null;
      const drop = game.groundDrops.find(d=>dist(d,game.player)<65);
      const altar = game.altars.find(a => !a.lit && dist(a, game.player) < 60);
      if(drop) $("quest-text").textContent=`按 E 拾取${drop.kind==="equipment"?drop.item.name:drop.kind==="potion"?"生命药水":MATERIAL_NAMES[drop.material]}`;
      else if (altar) $("quest-text").textContent = "按 E 点燃深渊祭坛，扩展视野";
      else if (ex&&dist(ex, game.player) < 80) $("quest-text").textContent = `按 E 进入${game.depth < 5 ? "下一深度" : "返程星门"}`;
      else if(ex)$("quest-text").textContent=`星门已在附近出现 · 地图探索 ${explored}%`;
      else {const remaining=game.enemies.filter(e=>!e.dead&&!e.boss).length;$("quest-text").textContent=game.depth===5?"穿越迷宫，寻找盘踞核心的区域领主":`清除本层敌人：剩余 ${remaining} · 探索 ${explored}%`;}
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
    if (id === "settings-panel") renderSettingsPanel();
    panel.classList.remove("hidden");
    if (id === "map-panel") drawWorldMap();
    game.paused = true;
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

  function renderSavePanel(){
    const root=$("save-slots");if(!root)return;
    const template={save:createFullUnlockTestSave(),session:{scene:"camp"},savedAt:0,source:"full-unlock-template"};
    const entries=[
      {name:"自动存档",loaded:readSavedGame(),auto:true},
      ...SLOT_SAVE_KEYS.map((key,index)=>({name:`手动存档 ${index+1}`,loaded:readSaveKey(key,`slot-${index+1}`),index})),
      {name:"全解锁测试档（内置）",loaded:template,template:true}
    ];
    root.innerHTML="";
    entries.forEach(entry=>{
      const loaded=entry.loaded,node=document.createElement("article");
      const place=entry.template?"五域 25 层全通关 · 五把传说武器 · 药水 99":loaded?.session?.scene==="expedition"?`${BIOMES[loaded.session.biome]?.name||"远征"} · 深度 ${loaded.session.depth}/5`:loaded?"星火营地":"空档位";
      const when=entry.template?"随时可重置":loaded?.savedAt?new Date(loaded.savedAt).toLocaleString("zh-CN"):"尚未保存";
      node.className=`save-slot ${entry.auto?"current":""} ${entry.template?"test-template":""}`;
      node.innerHTML=`<div><h3>${entry.name}</h3><p>${place} · ${when}${loaded?` · LV.${loaded.save.player.level}`:""}</p></div><div class="save-slot-actions">${loaded?`<button class="load-slot primary">${entry.template?"载入测试档":"载入"}</button>`:""}${game.scene!=="title"&&!entry.template?`<button class="write-slot">${entry.auto?"覆盖自动档":"保存到此档"}</button>`:""}</div>`;
      const loadButton=node.querySelector(".load-slot"),writeButton=node.querySelector(".write-slot");
      if(loadButton){loadButton.type="button";loadButton.onclick=event=>{event.preventDefault();event.stopPropagation();entry.template?installFullUnlockTestSave():loadDecodedGame(loaded);};}
      if(writeButton){writeButton.type="button";writeButton.onclick=event=>{event.preventDefault();event.stopPropagation();entry.auto?(saveGame(false),renderSavePanel()):saveGameToSlot(entry.index);};}
      root.append(node);
    });
  }

  function renderSettingsPanel(){updateSettingsControls();const root=$("settings-save-summary");if(!root)return;const entries=[{name:"自动存档",loaded:readSavedGame()},...SLOT_SAVE_KEYS.map((key,index)=>({name:`手动存档 ${index+1}`,loaded:readSaveKey(key,`slot-${index+1}`)}))];root.innerHTML=entries.map(entry=>{const l=entry.loaded,place=l?.session?.scene==="expedition"?`${BIOMES[l.session.biome]?.name||"远征"} 深度 ${l.session.depth}`:l?"星火营地":"空档位",when=l?.savedAt?new Date(l.savedAt).toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}):"—";return`<p><strong>${entry.name}</strong><span>${place} · ${when}</span></p>`;}).join("");}

  function renderContinentPanel() {
    const root=$("continent-hotspots"),info=$("continent-info"),zones=[
      {left:4,top:3,width:39,height:48,shape:"polygon(5% 28%,25% 7%,72% 5%,98% 42%,88% 80%,55% 100%,18% 89%,0 60%)"},
      {left:2,top:46,width:48,height:54,shape:"polygon(9% 12%,55% 0,91% 24%,100% 67%,74% 96%,29% 100%,0 72%)"},
      {left:42,top:2,width:34,height:45,shape:"polygon(24% 0,72% 8%,100% 43%,80% 88%,42% 100%,0 70%,4% 25%)"},
      {left:61,top:27,width:39,height:47,shape:"polygon(28% 0,74% 8%,100% 37%,94% 76%,59% 100%,15% 83%,0 48%)"},
      {left:41,top:56,width:45,height:44,shape:"polygon(20% 0,71% 3%,100% 35%,88% 78%,55% 100%,13% 87%,0 48%)"}
    ];root.innerHTML="";
    const showInfo=(i,selecting=false)=>{const b=BIOMES[i],unlocked=game.save.progress.unlocked.includes(i),completed=game.save.progress.completedDepths[i]||0,maxDepth=unlocked?Math.min(5,Math.max(1,completed+1)):0;info.style.setProperty("--biome",b.color);info.classList.toggle("selecting",selecting&&unlocked);info.innerHTML=`<h3>0${i+1} · ${b.name}</h3><p>${b.subtitle} · ${b.mechanic}<br>资源：${b.primaryName}、${b.oreName}　领主：${b.boss[0]}<br>${unlocked?`已通过深度 ${completed}/5 · ${selecting?"选择出发深度":"点击大陆选择关卡"}`:"击败前一领域领主后解锁"}</p><div class="depth-pips">${[1,2,3,4,5].map(d=>`<i class="${d<=completed?"done":""}" style="--biome:${b.color}"></i>`).join("")}</div>${selecting&&unlocked?`<div class="depth-select" aria-label="${b.name}关卡选择">${[1,2,3,4,5].map(d=>`<button type="button" data-depth="${d}" ${d>maxDepth?"disabled":""} class="${d<=completed?"cleared":d===completed+1?"frontier":""}"><b>${d}</b><small>${d<=completed?"已通关":d===completed+1?"继续推进":"未解锁"}</small></button>`).join("")}</div>`:""}`;if(selecting)info.querySelectorAll("[data-depth]").forEach(depthButton=>depthButton.addEventListener("click",()=>{const depth=Number(depthButton.dataset.depth);document.documentElement.dataset.qaLast=`map-enter:${i}:${depth}`;enterFloor(i,depth);game.qaUpdateStatus?.();}));};
    BIOMES.forEach((b,i)=>{const unlocked=game.save.progress.unlocked.includes(i),zone=zones[i],button=document.createElement("button");button.className=`continent-hotspot continent-${i}${unlocked?"":" locked"}`;button.style.setProperty("--left",`${zone.left}%`);button.style.setProperty("--top",`${zone.top}%`);button.style.setProperty("--width",`${zone.width}%`);button.style.setProperty("--height",`${zone.height}%`);button.style.setProperty("--shape",zone.shape);button.style.setProperty("--biome",b.color);button.disabled=!unlocked;button.setAttribute("aria-label",`${b.name}，${unlocked?"选择关卡":"尚未解锁"}`);button.innerHTML=`<span>${unlocked?b.name:`${b.name} · 锁定`}</span>`;button.addEventListener("pointerenter",()=>{if(!info.classList.contains("selecting"))showInfo(i);});button.addEventListener("focus",()=>{if(!info.classList.contains("selecting"))showInfo(i);});button.addEventListener("click",()=>showInfo(i,true));root.append(button);});
    showInfo(Math.max(0,...game.save.progress.unlocked));
  }

  function formatStat(type, value) {
    const percents = ["critRate","critDamage","attackSpeed","dodge","reduction","moveSpeed","lifeSteal","elementalDamage","burnChance","poisonChance","frostChance","stunChance","executeDamage","eliteDamage","projectilePower","rareFind"];
    if (percents.includes(type)) return `${Math.round(value * 1000) / 10}%`;
    return fmt(value);
  }

  function itemTooltipCard(item,label="") {
    const q=qualityById(item.quality),mainName={attack:"攻击力",defense:"防御力",maxHp:"最大生命"}[item.main.type];
    return `${label?`<span class="compare-label">${label}</span>`:""}<div class="tooltip-top">${itemArtHTML(item,"tooltip-art")}<div><h4 style="color:${q.color}">${q.name} · ${item.name}${item.enhance?` +${item.enhance}`:""}</h4><div>${SLOT_NAMES[item.slot]}${item.slot==="weapon"?` · ${WEAPON_PROFILES[weaponTypeOf(item)].label}`:""} · 物品等级 ${item.level}</div></div></div><div style="color:#fff1b3;margin:6px 0">${mainName} +${itemMainValue(item)}</div>${item.affixes.map(a=>`<div class="${a.special?"special-affix":""}">• ${a.special?"✦ ":""}${a.name} +${formatStat(a.type,a.value)}</div>`).join("")}${item.legendary?`<div style="color:#ffd66b;margin-top:6px">◆ ${item.legendary.name}<br>${item.legendary.text}</div>`:""}${label?"":`<div class="lore">${item.lore}</div>`}`;
  }

  function itemTooltip(item,equipped=null){if(!equipped||equipped.id===item.id)return itemTooltipCard(item);const delta=itemMainValue(item)-itemMainValue(equipped),affixDelta=item.affixes.length-equipped.affixes.length,deltaClass=delta>0?"compare-up":delta<0?"compare-down":"compare-even";return `<div class="item-comparison"><div class="compare-card">${itemTooltipCard(item,"背包装备")}</div><div class="compare-card">${itemTooltipCard(equipped,"当前穿戴")}</div><div class="compare-delta ${deltaClass}">主属性 ${delta>0?"+":""}${delta}　·　词条数 ${affixDelta>0?"+":""}${affixDelta}</div></div>`;}

  function bindItemTooltip(node, item, equipped = null) {
    node.addEventListener("pointerenter", e => {
      const tip = $("tooltip"); tip.innerHTML = itemTooltip(item,equipped); tip.classList.toggle("compare",!!equipped&&equipped.id!==item.id);tip.classList.remove("hidden"); moveTooltip(e);
    });
    node.addEventListener("pointermove", moveTooltip); node.addEventListener("pointerleave", () => {$("tooltip").classList.add("hidden");$("tooltip").classList.remove("compare");});
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
    document.querySelectorAll("[data-inventory-tab]").forEach(button=>{const active=button.dataset.inventoryTab===game.inventoryTab;button.classList.toggle("active",active);button.setAttribute("aria-selected",String(active));button.onclick=()=>{game.inventoryTab=button.dataset.inventoryTab;renderCharacterPanel();};});
    document.querySelectorAll("[data-inventory-pane]").forEach(pane=>pane.classList.toggle("active",pane.dataset.inventoryPane===game.inventoryTab));
    const equipment = $("equipment-slots"); equipment.innerHTML = "";
    Object.entries(SLOT_NAMES).forEach(([slot, label]) => {
      const item = game.save.equipment.equipped[slot]; const node = document.createElement("div"); node.dataset.slot = slot; node.className = `equipment-slot ${item ? `quality-${item.quality}` : "empty"}`; node.innerHTML = item ? `${itemArtHTML(item)}<b>${item.name}</b><span>${item.main.type === "attack" ? "攻" : item.main.type === "defense" ? "防" : "命"} ${itemMainValue(item)}</span>` : `<span>${label}</span>`;
      if (item) { bindItemTooltip(node,item); node.addEventListener("click",()=>unequip(slot)); } equipment.append(node);
    });
    renderPaperdoll(0);
    const st = stats(); const rows = [
      ["攻击力",fmt(st.attack)],["防御力",fmt(st.defense)],["最大生命",fmt(st.maxHp)],["暴击率",formatStat("critRate",st.critRate)],
      ["暴击伤害",formatStat("critDamage",st.critDamage)],["攻击速度",formatStat("attackSpeed",st.attackSpeed-1)],["闪避率",formatStat("dodge",st.dodge)],
      ["伤害减免",formatStat("reduction",st.reduction)],["移动速度",formatStat("moveSpeed",st.moveSpeed/124-1)],["生命偷取",formatStat("lifeSteal",st.lifeSteal)],
      ["元素增伤",formatStat("elementalDamage",statValue("elementalDamage"))],["稀有寻获",formatStat("rareFind",statValue("rareFind"))]
    ];
    $("stats-list").innerHTML = rows.map(r=>`<div class="stat-row"><span>${r[0]}</span><b>${r[1]}</b></div>`).join("");
    const inv=game.save.equipment.inventory,pageCount=Math.ceil(INVENTORY_CAPACITY/INVENTORY_PAGE_SIZE);game.inventoryPage=clamp(game.inventoryPage,0,pageCount-1);const pageItems=inv.slice(game.inventoryPage*INVENTORY_PAGE_SIZE,(game.inventoryPage+1)*INVENTORY_PAGE_SIZE);$("inventory-count").textContent=`${inv.length} / ${INVENTORY_CAPACITY}`;$("inventory-page").textContent=`${game.inventoryPage+1} / ${pageCount}`;$("inventory-prev").disabled=game.inventoryPage<=0;$("inventory-next").disabled=game.inventoryPage>=pageCount-1;const grid=$("inventory-grid");grid.innerHTML="";
    pageItems.forEach(item=>{const n=document.createElement("div");n.className=`item-cell quality-${item.quality}`;n.innerHTML=`${itemArtHTML(item)}<b>${item.name}</b>${item.enhance?`<span class="plus">+${item.enhance}</span>`:""}<button class="sell-btn" title="出售装备">售</button>`;bindItemTooltip(n,item,game.save.equipment.equipped[item.slot]);n.addEventListener("click",()=>equipItem(item.id));n.querySelector(".sell-btn").addEventListener("click",e=>{e.stopPropagation();sellItem(item.id);});grid.append(n);});
    for(let i=pageItems.length;i<INVENTORY_PAGE_SIZE;i++){const n=document.createElement("div");n.className="item-cell";grid.append(n);}
    $("inventory-prev").onclick=()=>{game.inventoryPage=Math.max(0,game.inventoryPage-1);renderCharacterPanel();};$("inventory-next").onclick=()=>{game.inventoryPage=Math.min(pageCount-1,game.inventoryPage+1);renderCharacterPanel();};const bulkSelect=$("bulk-quality"),bulkButton=$("bulk-sell-btn"),refreshBulk=()=>{const q=bulkSelect.value,count=inv.filter(item=>item.quality===q).length;bulkButton.textContent=`出售该品质（${count}）`;bulkButton.disabled=!count;};bulkSelect.onchange=refreshBulk;bulkButton.onclick=()=>sellQuality(bulkSelect.value);refreshBulk();
    const materialEntries=Object.entries(game.save.materials),materialTotal=materialEntries.reduce((sum,[,value])=>sum+value,0);$("material-count").textContent=fmt(materialTotal);
    $("materials-list").innerHTML = materialEntries.map(([k,v])=>`<div class="material${v?"":" empty"}">${materialArtHTML(k)}<span>${MATERIAL_NAMES[k]}</span><b>${v}</b></div>`).join("");
    $("consumable-count").textContent=String(game.save.player.potions);$("consumables-list").innerHTML=`<div class="consumable-card"><span class="item-art" aria-hidden="true"></span><span>生命药水<small>恢复 38% 最大生命，Q 快捷使用</small></span><b>×${game.save.player.potions}</b></div><div class="consumable-card"><span class="material-art" style="--art-col:4;--art-row:3" aria-hidden="true"></span><span>卷轴栏位<small>预留：临时增益与传送卷轴</small></span><b>开发中</b></div><div class="consumable-card"><span class="material-art" style="--art-col:3;--art-row:3" aria-hidden="true"></span><span>战斗道具栏位<small>预留：投掷物与元素药剂</small></span><b>开发中</b></div>`;
    updateHUD();
  }

  function equipItem(id) {
    const inv=game.save.equipment.inventory, idx=inv.findIndex(i=>i.id===id); if(idx<0)return;
    const item=inv.splice(idx,1)[0], old=game.save.equipment.equipped[item.slot]; if(old)inv.push(old); game.save.equipment.equipped[item.slot]=item;
    game.save.player.hp=Math.min(stats().maxHp,game.save.player.hp); beep(280,.07,"square",.025); renderCharacterPanel(); saveGame(true);
  }

  function unequip(slot) {
    const inv=game.save.equipment.inventory,item=game.save.equipment.equipped[slot]; if(!item||inv.length>=INVENTORY_CAPACITY)return toast("背包已满，无法卸下");
    inv.push(item);game.save.equipment.equipped[slot]=null;game.save.player.hp=Math.min(stats().maxHp,game.save.player.hp);renderCharacterPanel();saveGame(true);
  }

  function sellValue(item){const qi=QUALITIES.findIndex(q=>q.id===item.quality)+1;return Math.max(10,Math.round(item.level*qi*5*(1+item.enhance*.35)));}
  function sellItem(id){const inv=game.save.equipment.inventory,idx=inv.findIndex(i=>i.id===id);if(idx<0)return;const item=inv[idx],value=sellValue(item);inv.splice(idx,1);game.save.currencies.gold+=value;toast(`出售 ${item.name}，获得 ${value} 金币`,"#f2c65d");beep(360,.08,"triangle",.025);renderCharacterPanel();saveGame(true);}
  function sellQuality(quality){const inv=game.save.equipment.inventory,items=inv.filter(item=>item.quality===quality);if(!items.length)return toast("该品质没有可出售装备");const value=items.reduce((sum,item)=>sum+sellValue(item),0),ids=new Set(items.map(item=>item.id));game.save.equipment.inventory=inv.filter(item=>!ids.has(item.id));game.inventoryPage=Math.min(game.inventoryPage,Math.max(0,Math.ceil(game.save.equipment.inventory.length/INVENTORY_PAGE_SIZE)-1));game.save.currencies.gold+=value;toast(`批量出售 ${items.length} 件装备，获得 ${value} 金币`,"#f2c65d");beep(410,.13,"triangle",.035);renderCharacterPanel();saveGame(true);}

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

  function markQa(last, detail = null) {
    if (document.documentElement.dataset.qaMode !== "enabled") return;
    document.documentElement.dataset.qaLast = last;
    if (detail) document.documentElement.dataset.qaForgeReport = JSON.stringify(detail);
    game.qaUpdateStatus?.();
  }

  function renderCraft() {
    const unlocked=BIOMES.filter((_,i)=>game.save.progress.unlocked.includes(i));
    const unlockedIndices=unlocked.map(b=>BIOMES.indexOf(b));if(!unlockedIndices.includes(Number(game.selectedForge)))game.selectedForge=unlockedIndices[0]??0;
    $("forge-content").innerHTML=`<div class="forge-layout"><div class="forge-side"><h3>元素配方</h3><select id="craft-region">${unlocked.map(b=>{const i=BIOMES.indexOf(b);return`<option value="${i}" ${i===Number(game.selectedForge)?"selected":""}>${b.name}</option>`;}).join("")}</select><p class="hint">怪物掉落材料用于打造与药剂；专属稀材可提高品质，领主核心可保底稀有。</p><label class="recipe-item"><span>投入怪物稀材 ×2</span><input id="use-rare" type="checkbox" ${game.forgeCatalysts.rare?"checked":""}></label><label class="recipe-item"><span>投入领主核心 ×1</span><input id="use-core" type="checkbox" ${game.forgeCatalysts.core?"checked":""}></label><button id="potion-btn" class="full">炼制生命药水</button></div><div class="forge-main"><div id="furnace" class="furnace">♨</div><div id="craft-recipe" class="recipe-list"></div><button id="craft-btn" class="primary full">点燃熔炉</button></div></div>`;
    const select=$("craft-region"),rare=$("use-rare"),core=$("use-core");
    const refresh=()=>{const i=Number(select.value),b=BIOMES[i],gold=35+i*25;game.selectedForge=i;document.documentElement.dataset.forgeRegion=String(i);$("craft-recipe").innerHTML=`<div class="recipe-item">${materialArtHTML(b.primary)}<span>${b.primaryName}</span><b>${game.save.materials[b.primary]} / 6</b></div><div class="recipe-item">${materialArtHTML(b.ore)}<span>${b.oreName}</span><b>${game.save.materials[b.ore]} / 4</b></div><div class="recipe-item"><span>金币</span><b>${game.save.currencies.gold} / ${gold}</b></div><div class="recipe-item">${materialArtHTML(b.rare)}<span>${b.rareName}</span><b>${game.save.materials[b.rare]||0}</b></div><div class="recipe-item">${materialArtHTML(b.core)}<span>${MATERIAL_NAMES[b.core]}</span><b>${game.save.materials[b.core]||0}</b></div>`;game.qaUpdateStatus?.();};
    select.addEventListener("change",()=>{refresh();markQa(`forge-select:${game.selectedForge}`,{ok:true,phase:"select",region:game.selectedForge});});rare.addEventListener("change",()=>game.forgeCatalysts.rare=rare.checked);core.addEventListener("change",()=>game.forgeCatalysts.core=core.checked);refresh();$("craft-btn").addEventListener("click",()=>craft(game.selectedForge,core.checked,rare.checked));$("potion-btn").addEventListener("click",()=>brewPotion(game.selectedForge));
  }

  function craft(i,useCore,useRare) {
    const b=BIOMES[i],plan=ForgeRules.createCraftPlan(i,b,useCore,useRare),verdict=ForgeRules.validateCraftPlan(plan,{gold:game.save.currencies.gold,materials:game.save.materials}),gold=plan.gold;
    if(!verdict.ok){markQa(`craft-failed:${verdict.reason}`,{ok:false,reason:verdict.reason,region:i});if(verdict.reason==="rare")return toast(`需要 ${b.rareName} ×2`,"#ef7268");if(verdict.reason==="core")return toast("尚未获得该领主核心","#ef7268");return toast(verdict.reason==="gold"?"打造金币不足":"打造材料不足","#ef7268");}
    const before={inventory:game.save.equipment.inventory.length,gold:game.save.currencies.gold,primary:game.save.materials[b.primary],ore:game.save.materials[b.ore],rare:game.save.materials[b.rare]||0,core:game.save.materials[b.core]||0};
    const charged=ForgeRules.applyCraftPlan(plan,{gold:game.save.currencies.gold,materials:game.save.materials});game.save.materials=charged.materials;game.save.currencies.gold=charged.gold;
    markQa("craft-queued",{ok:true,phase:"queued",region:i,useCore,useRare,before});
    const furnace=$("furnace");furnace.classList.add("firing");game.paused=true;playSfx("craft");setTimeout(()=>{const item=generateItem(i,5,useCore?2:useRare?1:0,new RNG(Date.now()+"craft"));if(useRare&&!item.affixes.some(a=>a.special)){const rng=new RNG(Date.now()+"rare-catalyst"),a=rng.pick(SPECIAL_AFFIXES);item.affixes.push({type:a[0],name:a[1],value:lerp(a[2],a[3],rng.next())*(1+i*.12),suffix:a[4],special:true});}addItem(item);furnace.classList.remove("firing");renderCraft();updateHUD();saveGame(true);const after={inventory:game.save.equipment.inventory.length,gold:game.save.currencies.gold,primary:game.save.materials[b.primary],ore:game.save.materials[b.ore],rare:game.save.materials[b.rare]||0,core:game.save.materials[b.core]||0};const report={ok:true,phase:"complete",region:i,useCore,useRare,before,after,item:{id:item.id,slot:item.slot,quality:item.quality,affixes:item.affixes.length,specialAffixes:item.affixes.filter(a=>a.special).length,legendary:Boolean(item.legendary)}};markQa(`craft-success:r${i}:q${item.quality}:a${item.affixes.length}:s${report.item.specialAffixes}`,report);beep(item.quality==="gold"?830:520,.25,"triangle",.05);},850);
  }

  function brewPotion(i){const b=BIOMES[i];if(game.save.player.potions>=POTION_CAPACITY)return toast(`药水袋已装满（${POTION_CAPACITY} / ${POTION_CAPACITY}）`);if(game.save.materials[b.primary]<3||game.save.materials[b.ore]<1)return toast(`需要 ${b.primaryName} ×3、${b.oreName} ×1`,"#ef7268");game.save.materials[b.primary]-=3;game.save.materials[b.ore]-=1;game.save.player.potions++;toast("炼制生命药水 ×1","#8be89f");beep(480,.18,"sine",.04);renderCraft();updateHUD();saveGame(true);}

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
    if(e.code==="Tab"){
      if(!$("map-panel").classList.contains("hidden"))return closePanel("map-panel");
      if(isModalOpen())closeAllModals();
      if(game.scene==="expedition")return openPanel("map-panel");
      return toast("区域地图会在进入远征后开放；营地请按 M 查看大陆");
    }
    if(e.code==="KeyC"||e.code==="KeyI")return isModalOpen()?closeAllModals():openPanel("character-panel");
    if(e.code==="KeyK")return isModalOpen()?closeAllModals():openPanel("skills-panel");
    if(e.code==="KeyM"&&game.scene==="camp")return openPanel("continent-panel");
    if(e.code==="KeyB"){if(game.scene==="camp")openPanel("forge-panel");else toast("铁匠铺只在星火营地开放");return;}
    if(e.code==="KeyL")return isModalOpen()?closeAllModals():openPanel("save-panel");
    if(e.code==="KeyT"&&game.scene==="expedition")return enterCamp(false);
    if(isModalOpen())return;if(e.code==="Space")dash();else if(e.code==="KeyQ")usePotion();else if(e.code==="KeyE")interact();else if(e.code==="KeyJ")attack();else if(e.code==="KeyR")useActiveSkill(1);else if(e.code==="KeyF")useActiveSkill(2);
  }

  function setupEvents(){
    $("new-game-btn").addEventListener("click",startNewGame);$("continue-btn").addEventListener("click",continueGame);updateTitleSaveMeta();setMusicTheme("title");
    updateSettingsControls();
    document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closePanel(b.dataset.close)));
    $("skills-btn").addEventListener("click",()=>openPanel("skills-panel"));$("resume-btn").addEventListener("click",()=>closePanel("pause-panel"));$("save-btn").addEventListener("click",()=>saveGame(false));$("pause-save-list-btn").addEventListener("click",()=>openPanel("save-panel"));$("pause-settings-btn").addEventListener("click",()=>openPanel("settings-panel"));
    $("inventory-btn").addEventListener("click",()=>openPanel("character-panel"));$("skill-dock-btn").addEventListener("click",()=>openPanel("skills-panel"));$("map-dock-btn").addEventListener("click",()=>game.scene==="camp"?openPanel("continent-panel"):openPanel("map-panel"));
    $("forge-dock-btn").addEventListener("click",()=>game.scene==="camp"?openPanel("forge-panel"):toast("铁匠铺只在星火营地开放"));
    $("map-zoom-out").addEventListener("click",()=>setMapZoom(game.mapZoom-.5));$("map-zoom-in").addEventListener("click",()=>setMapZoom(game.mapZoom+.5));$("map-zoom-reset").addEventListener("click",()=>setMapZoom(1));worldMap.addEventListener("wheel",e=>{e.preventDefault();setMapZoom(game.mapZoom+(e.deltaY<0?.5:-.5));},{passive:false});
    $("save-list-btn").addEventListener("click",()=>openPanel("save-panel"));$("settings-dock-btn").addEventListener("click",()=>openPanel("settings-panel"));$("title-settings-btn").addEventListener("click",()=>openPanel("settings-panel"));$("settings-save-list-btn").addEventListener("click",()=>openPanel("save-panel"));$("settings-music-toggle").addEventListener("click",()=>setMusicEnabled(game.save.settings.music===false));$("settings-sound-toggle").addEventListener("click",()=>setSoundEnabled(game.save.settings.sound===false));$("bgm-volume").addEventListener("input",e=>setBgmVolume(Number(e.target.value)/100));$("return-dock-btn").addEventListener("click",()=>enterCamp(false));$("return-camp-btn").addEventListener("click",()=>enterCamp(false));$("revive-btn").addEventListener("click",()=>enterCamp(false));
    document.querySelectorAll("[data-forge-tab]").forEach(b=>b.addEventListener("click",()=>{game.forgeTab=b.dataset.forgeTab;renderForge();}));
    addEventListener("keydown",handleKeyDown);addEventListener("keyup",e=>{game.keys.delete(e.code);if(game.player.runKey===e.code){game.player.runKey=null;game.player.running=false;}});addEventListener("blur",()=>{game.keys.clear();game.player.running=false;});
    canvas.addEventListener("pointerdown",e=>{if(e.button===0)canvas.focus();});
    const currentMusicKey=()=>game.scene==="title"?"title":game.scene==="camp"?"camp":stageMusicKey(game.biome,game.depth),unlockAudio=()=>{ensureAudio();setMusicTheme(currentMusicKey());};addEventListener("pointerdown",unlockAudio,{once:true,capture:true});addEventListener("keydown",unlockAudio,{once:true,capture:true});addEventListener("focus",()=>{if(game.audio?.ctx){ensureAudio();if(game.save.settings.music&&game.audio.theme!==currentMusicKey())startMusic(currentMusicKey());}});addEventListener("pagehide",()=>{if(game.scene!=="title")saveGame(true);});
    document.querySelectorAll("#mobile-controls button").forEach(b=>{const code=b.dataset.key;b.addEventListener("pointerdown",e=>{e.preventDefault();game.keys.add(code);if(code==="KeyJ")attack();if(code==="KeyR")useActiveSkill(1);if(code==="Space")dash();if(code==="KeyE")interact();});b.addEventListener("pointerup",()=>game.keys.delete(code));b.addEventListener("pointercancel",()=>game.keys.delete(code));});
  }

  function resizeShell(){const shell=$("game-shell"),scale=Math.max(.1,Math.min(innerWidth/W,innerHeight/H)),scaledW=W*scale,scaledH=H*scale;shell.style.left=`${Math.max(0,(innerWidth-scaledW)/2)}px`;shell.style.top=`${Math.max(0,(innerHeight-scaledH)/2)}px`;shell.style.transform=`scale(${scale})`;}

  function setupQaHarness() {
    const localHost=["127.0.0.1","localhost","::1"].includes(location.hostname),requested=new URLSearchParams(location.search).has("qa");
    if(!localHost||!requested)return;
    const panel=$("qa-panel"),biomeSelect=$("qa-biome"),depthSelect=$("qa-depth");
    let qaWeaponIndex=-1,qaDirectionIndex=-1;
    panel.classList.remove("hidden");document.documentElement.dataset.qaMode="enabled";
    biomeSelect.innerHTML=BIOMES.map((b,i)=>`<option value="${i}">${i+1}. ${b.name}</option>`).join("");
    const ensureExpedition=()=>{const biome=Number(biomeSelect.value)||0,depth=clamp(Number(depthSelect.value)||1,1,5);if(game.scene!=="expedition"||game.biome!==biome||game.depth!==depth)enterFloor(biome,depth);game.save.player.hp=stats().maxHp;game.player.statuses={};game.player.invuln=60;$("death-panel").classList.add("hidden");game.paused=false;return{biome,depth};};
    const qaItem=(slot,index,region=0)=>{const weaponType=WEAPON_TYPES[index%WEAPON_TYPES.length],item=generateItem(region,5,Math.min(4,index%5),new RNG(`qa-${slot}-${index}-${region}`));item.id=`qa-${slot}-${index}-${region}`;item.slot=slot;item.region=region;item.enhance=index%10;item.quality=QUALITIES[index%QUALITIES.length].id;if(slot==="weapon"){item.weaponType=weaponType;item.name=`验收${WEAPON_NAMES[weaponType]}`;item.main={type:"attack",value:28+region*8+index};}else{item.name=`验收${SLOT_NAMES[slot]} ${index+1}`;item.main={type:slot==="amulet"?"maxHp":"defense",value:slot==="amulet"?55+index:14+region*4+index};}return item;};
    const updateQaStatus=()=>{const living=game.enemies.filter(e=>!e.dead).length,exit=game.world?.exit,exitDistance=exit?Math.round(Math.hypot((exit.x+.5)*TILE-game.player.x,(exit.y+.5)*TILE-game.player.y)):null,status=`${game.scene==="expedition"?`${game.biome+1}-${game.depth}`:game.scene} · 敌${living} · 弹${game.projectiles.length} · 预警${game.telegraphs.length} · 特效${game.impacts.length}`,inventory=game.save.equipment.inventory.length,materials=Object.values(game.save.materials).reduce((sum,value)=>sum+(Number(value)||0),0),last=document.documentElement.dataset.qaLast||"ready",openPanel=[...document.querySelectorAll(".overlay:not(.hidden)")].map(node=>node.id).filter(Boolean).join(",")||"none",bgm=`${document.documentElement.dataset.bgmKey||game.musicTheme||"none"}:${document.documentElement.dataset.bgmState||"idle"}`;$("qa-status").textContent=status;const snapshot={scene:game.scene,biome:game.biome,depth:game.depth,living,projectiles:game.projectiles.length,telegraphs:game.telegraphs.length,impacts:game.impacts.length,drops:game.groundDrops.length,inventory,inventoryTab:game.inventoryTab,forgeRegion:Number(game.selectedForge),materials,gold:game.save.currencies.gold,void:game.save.currencies.void,potions:game.save.player.potions,visual:document.documentElement.dataset.playerVisual||"",weaponMount:document.documentElement.dataset.weaponMount||"none",openPanel,last,bgm,exitDistance,exitLocked:game.world?.exitLocked??null};document.documentElement.dataset.qaSnapshot=JSON.stringify(snapshot);document.title=`像素纪元：五域远征 | QA scene=${game.scene} inv=${inventory} g=${snapshot.gold} mat=${materials} pot=${snapshot.potions} tab=${game.inventoryTab} panel=${openPanel} forge=${snapshot.forgeRegion} bgm=${bgm} last=${last}`;};
    game.qaUpdateStatus=updateQaStatus;
    $("qa-enter").onclick=()=>{const {biome,depth}=ensureExpedition();document.documentElement.dataset.qaLast=`stage:${biome}:${depth}`;updateQaStatus();};
    $("qa-loadout").onclick=()=>{
      if(game.scene==="title")startNewGame();game.save.progress.unlocked=[0,1,2,3,4];game.save.progress.completedDepths=[5,4,3,2,1];Object.keys(game.save.materials).forEach(key=>game.save.materials[key]=99);game.save.currencies.gold=99999;game.save.currencies.void=99;game.save.player.skillPoints=12;
      const slots=Object.keys(SLOT_NAMES),region=Number(biomeSelect.value)||0;game.save.equipment.equipped={weapon:qaItem("weapon",4,region),helmet:qaItem("helmet",4,region),armor:qaItem("armor",4,region),boots:qaItem("boots",4,region),amulet:qaItem("amulet",4,region)};game.save.equipment.inventory=Array.from({length:68},(_,i)=>qaItem(slots[i%slots.length],i, i%5));game.visualEquipmentSignature="";game.unseenItems=game.save.equipment.inventory.length;game.save.player.hp=stats().maxHp;updateHUD();if(!$("character-panel").classList.contains("hidden"))renderCharacterPanel();document.documentElement.dataset.qaLast="loadout";updateQaStatus();toast("验收装备、五品质背包和全部材料已就绪","#a5f0ce");
    };
    $("qa-full-save").onclick=installFullUnlockTestSave;
    $("qa-mob-fx").onclick=()=>{ensureExpedition();game.enemies=[];game.projectiles=[];game.telegraphs=[];game.impacts=[];game.player.invuln=60;const attacks=[];for(let i=0;i<4;i++){const angle=i/4*Math.PI*2;spawnEnemy(i,game.player.x+Math.cos(angle)*60,game.player.y+Math.sin(angle)*60,false);const e=game.enemies[game.enemies.length-1];if(i===0&&!e.elite){e.elite=true;e.name=`精英·${e.name}`;e.hp=e.maxHp=Math.round(e.maxHp*1.75);}e.pendingAttack=e.attack.id;e.targetX=game.player.x;e.targetY=game.player.y;performEnemyAttack(e);attacks.push(e.attack.id);}const report={kind:"mobs",biome:game.biome,attacks,projectiles:game.projectiles.length,telegraphs:game.telegraphs.length,impacts:game.impacts.length};document.documentElement.dataset.qaLastEffect=JSON.stringify(report);document.documentElement.dataset.qaLast=`mobs:b${game.biome}:a${attacks.length}:pr${report.projectiles}:tg${report.telegraphs}:im${report.impacts}`;updateQaStatus();};
    $("qa-boss-fx").onclick=()=>{ensureExpedition();game.projectiles=[];game.telegraphs=[];game.impacts=[];let boss=game.enemies.find(e=>e.boss&&!e.dead);game.enemies=game.enemies.filter(e=>e===boss);if(!boss){spawnEnemy(0,game.player.x+120,game.player.y,true);boss=game.enemies[game.enemies.length-1];}boss.x=game.player.x+120;boss.y=game.player.y;boss.vx=boss.vy=0;boss.state="idle";boss.stateTime=0;boss.specialCd=999;boss.hp=boss.maxHp;const pattern=boss.pattern%4;game.player.invuln=60;bossSpecial(boss);const report={kind:"boss",biome:game.biome,pattern,projectiles:game.projectiles.length,telegraphs:game.telegraphs.length,impacts:game.impacts.length,boundProjectiles:game.projectiles.filter(q=>q.monsterFx).length,boundTelegraphs:game.telegraphs.filter(t=>t.monsterFx).length,boundImpacts:game.impacts.filter(f=>f.monsterFx).length,telegraphTypes:game.telegraphs.map(t=>t.type)};document.documentElement.dataset.qaLastEffect=JSON.stringify(report);document.documentElement.dataset.qaLast=`boss:b${report.biome}:p${report.pattern}:fx${report.boundProjectiles+report.boundTelegraphs+report.boundImpacts}:pr${report.projectiles}:tg${report.telegraphs}:im${report.impacts}`;updateQaStatus();};
    $("qa-drops").onclick=()=>{ensureExpedition();const b=BIOMES[game.biome],p=game.player;game.groundDrops=[];spawnGroundDrop("equipment",p.x-18,p.y,{item:qaItem("weapon",game.biome,game.biome)});spawnGroundDrop("material",p.x,p.y-18,{material:b.rare,amount:2});spawnGroundDrop("potion",p.x+18,p.y);document.documentElement.dataset.qaLast="drops";updateQaStatus();};
    $("qa-actions").onclick=()=>{ensureExpedition();const report={walk:[],run:[],attack:[],hurt:[]},sample=key=>report[key].push({visual:document.documentElement.dataset.playerVisual||"",mount:document.documentElement.dataset.weaponMount||"none"}),moves=[{code:"KeyD",dx:1,dy:0},{code:"KeyA",dx:-1,dy:0},{code:"KeyS",dx:0,dy:1},{code:"KeyW",dx:0,dy:-1}];let move=moves[0];if(game.world){const s=game.world.start;game.player.x=(s.x+.5)*TILE;game.player.y=(s.y+.5)*TILE;move=moves.find(m=>game.world.tiles[s.y+m.dy]?.[s.x+m.dx]!==0)||move;}game.player.vx=game.player.vy=0;setPlayerAim(move.dx,move.dy);game.player.invuln=0;game.player.swing=null;game.player.weaponDrawn=0;game.player.runKey=null;game.keys.add(move.code);let elapsed=0;const timer=setInterval(()=>{elapsed+=60;if(elapsed<=480)sample("walk");else if(elapsed===540){game.player.runKey=move.code;game.player.runUntil=performance.now()+900;}else if(elapsed<=1020)sample("run");else if(elapsed===1080){game.keys.delete(move.code);game.player.running=false;game.player.attackCd=0;attack();syncLayeredPlayerVisual(0);sample("attack");}else if(elapsed<=1440)sample("attack");else if(elapsed===1500){game.player.invuln=0;damagePlayer(Math.max(8,stats().maxHp*.12),game.player.x-50,game.player.y);}else if(elapsed<=1800)sample("hurt");else{clearInterval(timer);game.keys.delete(move.code);document.documentElement.dataset.qaActionReport=JSON.stringify(report);document.documentElement.dataset.qaLast="actions-complete";updateQaStatus();}},60);};
    $("qa-weapon").onclick=()=>{ensureExpedition();qaWeaponIndex=(qaWeaponIndex+1)%WEAPON_TYPES.length;const type=WEAPON_TYPES[qaWeaponIndex],item=qaItem("weapon",qaWeaponIndex,game.biome);item.weaponType=type;item.name=`验收${WEAPON_NAMES[type]}`;game.save.equipment.equipped.weapon=item;game.visualEquipmentSignature="";game.enemies=[];game.projectiles=[];game.telegraphs=[];game.impacts=[];spawnEnemy(0,game.player.x+60,game.player.y,false);game.player.attackCd=0;game.player.activeCd1=0;game.player.activeCd2=0;game.save.player.stamina=100;setPlayerAim(1,0);syncVisualEquipment();document.documentElement.dataset.qaLast=`weapon:${type}`;updateQaStatus();};
    $("qa-combos").onclick=()=>{ensureExpedition();game.enemies=[];game.projectiles=[];game.impacts=[];spawnEnemy(0,game.player.x+52,game.player.y,false);const target=game.enemies[game.enemies.length-1];target.hp=target.maxHp=1e8;target.speed=0;target.attackCd=999;const report=[],total=WEAPON_TYPES.length*3;let step=0;const timer=setInterval(()=>{if(step>=total){clearInterval(timer);document.documentElement.dataset.qaComboReport=JSON.stringify(report);document.documentElement.dataset.qaLast=`combos-complete:${report.length}`;updateQaStatus();return;}const weaponIndex=Math.floor(step/3),combo=step%3+1,type=WEAPON_TYPES[weaponIndex],item=qaItem("weapon",weaponIndex,game.biome);item.weaponType=type;game.save.equipment.equipped.weapon=item;game.visualEquipmentSignature="";game.player.swing=null;game.player.dash=0;game.player.attackCd=0;game.player.combo=combo-1;game.player.comboUntil=performance.now()/1000+1;game.player.aimTarget=target;game.player.aimLockUntil=performance.now()+1000;setPlayerAim(target.x-game.player.x,target.y-game.player.y);syncVisualEquipment();attack();report.push({type,combo,fx:game.player.swing?.comboFx||null,autoAim:document.documentElement.dataset.autoAimTarget||"none"});document.documentElement.dataset.qaLast=`combo:${type}:${combo}`;updateQaStatus();step++;},720);};
    $("qa-axe-spin").onclick=()=>{ensureExpedition();game.enemies=[];game.projectiles=[];game.impacts=[];spawnEnemy(0,game.player.x+62,game.player.y,false);const target=game.enemies[game.enemies.length-1],item=qaItem("weapon",2,game.biome);target.hp=target.maxHp=1e8;target.speed=0;target.attackCd=999;item.weaponType="axe";game.save.equipment.equipped.weapon=item;game.visualEquipmentSignature="";game.player.swing=null;game.player.dash=0;game.player.attackCd=0;game.player.combo=2;game.player.comboUntil=performance.now()/1000+1;game.player.aimTarget=target;game.player.aimLockUntil=performance.now()+1200;setPlayerAim(1,0);syncVisualEquipment();attack();document.documentElement.dataset.qaLast="axe-spin";updateQaStatus();};
    $("qa-direction").onclick=()=>{ensureExpedition();const dirs=[{name:"right",x:1,y:0},{name:"down",x:0,y:1},{name:"left",x:-1,y:0},{name:"up",x:0,y:-1}],dir=dirs[qaDirectionIndex=(qaDirectionIndex+1)%dirs.length];game.player.vx=game.player.vy=0;game.player.swing=null;setPlayerAim(dir.x,dir.y);syncLayeredPlayerVisual(0);document.documentElement.dataset.qaLast=`direction:${dir.name}`;updateQaStatus();};
    $("qa-hurt").onclick=()=>{ensureExpedition();game.player.invuln=0;damagePlayer(Math.max(8,stats().maxHp*.12),game.player.x-50,game.player.y);document.documentElement.dataset.qaLast="hurt";updateQaStatus();};
    $("qa-clear").onclick=()=>{ensureExpedition();const living=game.enemies.filter(e=>!e.dead);if(!living.length&&game.world?.exit&&!game.world.exitLocked){const before=`${game.biome}:${game.depth}`,exit=game.world.exit;game.groundDrops=[];game.player.x=(exit.x+.5)*TILE;game.player.y=(exit.y+.5)*TILE;interact();document.documentElement.dataset.qaLast=`portal:${before}->${game.scene}:${game.biome}:${game.depth}`;updateQaStatus();return;}game.projectiles=[];game.telegraphs=[];game.player.statuses={};game.player.invuln=60;living.slice().forEach(killEnemy);document.documentElement.dataset.qaLast=`clear:${Boolean(game.world?.exitSpawned)}`;updateQaStatus();};
    setInterval(updateQaStatus,300);updateQaStatus();
  }

  async function bootGame() {
    document.documentElement.dataset.bootState = "loading";
    const bootStatus=$("boot-status");
    try {
      const [, equipmentResult] = await Promise.all([
        preloadArt(),
        initializeEquipmentRendering().then(() => true).catch(error => {
          console.error("Layered equipment renderer failed to initialize; using the clean base-character emergency renderer.", error);
          document.documentElement.dataset.equipmentRenderer="layered-unavailable";
          return false;
        })
      ]);
      document.documentElement.dataset.bootState = "ready";
      document.documentElement.dataset.bootRenderer = equipmentResult ? "layered" : "emergency";
      if(bootStatus)bootStatus.textContent=equipmentResult?"资源加载完成 · 分层装备系统就绪":"资源加载完成 · 已启用兼容渲染模式";
    } catch (error) {
      console.error("Required game art failed to load.", error);
      document.documentElement.dataset.bootState = "error";
      if(bootStatus){bootStatus.textContent="资源加载失败，请刷新页面重试";bootStatus.classList.add("error");}
      return;
    }
    addEventListener("resize",resizeShell);resizeShell();
    if(matchMedia("(pointer: coarse)").matches)$("mobile-controls").classList.remove("hidden");
    setupEvents();ensureFullUnlockTestSlot();setupQaHarness();$("new-game-btn").disabled=false;updateTitleSaveMeta();updateHUD();requestAnimationFrame(loop);
  }

  bootGame();
})();
