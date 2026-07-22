# 分层装备挂载系统

## 目录结构

```text
assets/sprites/
  hero-base-layered-atlas.png           # imagegen 生成并去底的 4×5 基础动作
  hero-base-walk-atlas.png              # 4×2 两帧走路
  hero-base-run-atlas.png               # 4×4 四帧跑步
  hero-modular-parts-v3.png             # 头盔/护甲/手臂/鞋/武器部件
data/characters/player-rig.json         # 动画、四方向帧、逐帧锚点、渲染层级
data/equipment/equipment-catalog.json   # 装备定义与部件裁切配置
src/equipment/
  SpriteSheet.js                        # 图集裁切、图片缓存、最近邻绘制
  Equipment.js                          # Equipment 与 EquipmentCatalog
  Character.js                          # 动画状态、方向、逐帧锚点、装备槽
  LayeredCharacterRenderer.js           # 命令收集、层级排序、锚点变换、绘制
  EquipmentSystem.js                    # JSON/图片加载与对象工厂
demo/
  equipment-system.html                 # 最小可运行 Canvas 示例
  equipment-demo.js
```

## 坐标约定

- `Character.x/y` 是脚下的世界整数坐标，也是网络同步时应发送的根节点坐标。
- 所有锚点都相对根节点保存，不写世界绝对坐标。
- `headAnchor`、`bodyAnchor`、`leftHandAnchor`、`rightHandAnchor`、`backAnchor` 是标准挂点；系统也允许增加 `leftFootAnchor` 等自定义挂点。
- `anchors.default` 保存四方向基础挂点；`anchors.animations.<state>.frames` 只保存当前动画帧的差量。
- 装备的 `offset` 是相对挂点的局部偏移。武器使用 `rotationMode: "weapon"`，偏移和贴图围绕同一握点旋转。
- `origin` 是装备贴图内部的锚点比例。武器把 `origin` 放在握柄上，再将握柄和 `rightHandAnchor` 重合，不再靠目测中心偏移。
- Renderer 在提交 Canvas 前统一 `Math.round()`，并始终关闭 `imageSmoothingEnabled`。

## 类职责

### SpriteSheet

- 统一管理任意行列数的图集。
- 支持完整格、像素矩形和 `subRect` 半格裁切。
- 图片按 URL 缓存；多个角色和上千件装备共享同一 `HTMLImageElement`。
- `draw()` 内部强制整数目标坐标和最近邻渲染。
- 非整除图集按共享格边界取整，避免相邻帧重叠采到一像素接缝。

### Equipment

- 定义是只读 JSON；实例只保存实例 ID、随机词条、染色等运行时数据。
- 一件装备可由多个部件组成。例如护甲由胸甲、左臂、右臂三个部件组成，分别挂到身体和双手。
- `resolveParts(animation, direction)` 可按动作、方向覆盖素材、偏移、层级。
- 静态刚性装备只需一张图；需要形变的披风或裙甲可在 `frames` 中提供与角色动作同索引的帧。

### Character

- 保存位置、方向、当前动画、动画时间、当前帧和装备槽。
- `getAnchor()` 将基础挂点与当前动画帧差量合并。
- `equip()`/`unequip()` 不依赖游戏背包实现，因此可复用于玩家、NPC、敌人和远端多人角色。

### LayeredCharacterRenderer

渲染器先生成命令，再按层级排序，最后一次性绘制：

```js
render(ctx, character) {
  drawShadow();
  drawBody();
  drawHair();
  drawArmor();
  drawHelmet();
  drawWeapon();
  drawShield();
  drawEffect();
}
```

实际顺序可通过 `zByDirection` 改变。例如朝上时武器减去 50 层级，自动进入身体后方；朝下时保持在身体前方。

### EquipmentSystem

- 并行读取角色 rig 和装备 catalog JSON。
- 合并图集定义并预加载去重后的资源。
- 启动时校验必需动画、四方向、标准锚点、装备图集与挂点引用，错误配置会在加载期失败，不会拖到战斗中才报错。
- 提供角色与装备工厂，不保存任何单例角色状态。

## 装备 JSON 示例

```json
{
  "id": "fire_sword",
  "type": "weapon",
  "slot": "rightHand",
  "layer": "weapon",
  "anchor": "rightHandAnchor",
  "rotationMode": "weapon",
  "rotation": 45,
  "sprite": "fire_sword.png",
  "spriteSheet": { "columns": 4, "rows": 1 },
  "size": [48, 48],
  "origin": { "x": 0.16, "y": 0.86 },
  "offset": { "x": 0, "y": 0 },
  "zByDirection": { "up": -50 },
  "directions": {
    "up": { "source": { "col": 3, "row": 0 } },
    "down": { "source": { "col": 1, "row": 0 } },
    "left": { "source": { "col": 2, "row": 0 } },
    "right": { "source": { "col": 0, "row": 0 } }
  }
}
```

只有一张独立图片时可直接使用 `sprite`；Loader 会为它建立一格图集。批量装备则在 catalog 的 `spriteSheets` 中注册共享图集，并通过 `parts[].sheet/source` 裁切。一件护甲可拆成胸甲、左右手臂、披风等多个 part，分别绑定 `bodyAnchor`、手部挂点和 `backAnchor`。

如果装备本身拥有逐帧素材，在 part 上增加：

```json
{
  "frames": {
    "walk": {
      "right": [
        { "source": { "col": 0, "row": 0 } },
        { "source": { "col": 1, "row": 0 } }
      ]
    }
  }
}
```

Renderer 使用 `Character.frameIndex` 读取同索引装备帧，因此身体和装备不会出现不同步。

## 完整换装流程

```js
const system = await PixelEquipment.EquipmentSystem.load({
  rigUrl: "data/characters/player-rig.json",
  catalogUrl: "data/equipment/equipment-catalog.json"
});

const character = system.createCharacter("player-42", { x: 320, y: 240 });
const sword = system.createEquipment("weapon_sword", {
  instanceId: "drop-88421",
  stats: { attack: 37, fireDamage: 12 }
});

character.equip(sword);
character.setDirection("right").setAnimation("walk");
character.update(deltaSeconds);
system.renderer.render(ctx, character);
```

正式游戏中的随机装备仍保存原本的属性、强化和词条。绘制适配层只把 `weaponType`、`region`、槽位映射到 catalog definition ID，不把属性逻辑耦合进 Renderer。

## 扩展到 1000 件装备

- 一套主题图集可容纳数十至数百个部件；一千件装备只增加 catalog 行和图集格，不增加 Renderer 分支。
- 定义对象在 `EquipmentCatalog` 中共享，掉落实例只保存差异数据，避免复制 JSON。
- 图片缓存按 URL 去重；100 名角色穿同一把剑只占一份图片内存。
- 动画帧和锚点属于 rig，可被同骨架的多人角色共享。
- 多人同步只发送 `characterId`、根坐标、方向、动画状态/时间、装备 definition ID 与实例外观参数；客户端本地重建所有挂点。
- 新体型创建新的 rig；装备可通过标签和可用 rig 列表控制兼容性，不需要修改 Renderer。

## 素材制作规范

- 图集单元格尺寸必须一致，并在导出前把透明边界固定。
- 角色根节点统一放在脚下中心；同一动作每帧不得改变画布尺寸。
- 刚性物件使用单图 + 锚点；只有需要弯曲或遮挡变化的披风、长裙等才制作逐帧装备图。
- 四方向素材使用 `up/down/left/right` 明确配置，不依赖运行时猜测或盲目镜像。
- 禁止 CSS/Canvas 平滑缩放；开发分辨率、目标尺寸和锚点均使用整数。
