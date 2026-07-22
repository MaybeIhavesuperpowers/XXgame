"use strict";

(async () => {
  const canvas = document.getElementById("demo-canvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const status = document.getElementById("status");

  try {
    const forceEmbeddedFallback = new URLSearchParams(location.search).has("fallback");
    const system = await PixelEquipment.EquipmentSystem.load({
      rigUrl: forceEmbeddedFallback ? "../data/characters/missing-rig.json" : "../data/characters/player-rig.json",
      catalogUrl: forceEmbeddedFallback ? "../data/equipment/missing-catalog.json" : "../data/equipment/equipment-catalog.json"
    });
    document.documentElement.dataset.equipmentConfig = system.configSource;
    const character = system.createCharacter("demo-player", { x: 320, y: 235, direction: "down" });
    const controls = {
      animation: document.getElementById("animation"), direction: document.getElementById("direction"),
      weapon: document.getElementById("weapon"), armor: document.getElementById("armor"), helmet: document.getElementById("helmet")
    };

    const equipSelection = (slot, definitionId) => {
      character.unequip(slot);
      if (definitionId) character.equip(system.createEquipment(definitionId));
    };
    const refreshEquipment = () => {
      equipSelection("rightHand", controls.weapon.value);
      equipSelection("body", controls.armor.value);
      equipSelection("head", controls.helmet.value);
      const themeIndex = controls.armor.value ? Math.max(0, Number(controls.armor.value.slice(-1)) || 0) : null;
      // Boots use the lower fitted region of the same animation template, so
      // they can have an independent theme without becoming a rigid sticker.
      equipSelection("feet", themeIndex === null ? "" : `boots_${themeIndex}`);
      equipSelection("neck", themeIndex === null ? "" : `amulet_${themeIndex}`);
    };
    Object.values(controls).forEach(control => control.addEventListener("change", refreshEquipment));
    refreshEquipment();
    status.textContent = `已启用：${system.configSource} · JSON 装备目录 · 每帧锚点 · 四方向 · 整数像素坐标`;

    let previous = performance.now();
    const directionAngles = { right:0, down:Math.PI/2, left:Math.PI, up:-Math.PI/2 };
    const frame = now => {
      const delta = Math.min(.05, (now - previous) / 1000); previous = now;
      character.setDirection(controls.direction.value).setAnimation(controls.animation.value);
      character.pose.aimAngle = directionAngles[character.direction];
      character.pose.weaponAngle = character.pose.aimAngle + (character.animation === "attack" ? Math.sin(character.animationTime * 12) * .65 : 0);
      character.update(delta);
      document.documentElement.dataset.demoVisual = `${character.animation}:${character.frameIndex}:${character.equipmentList().length}`;
      ctx.fillStyle = "#202733"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#2d3743"; for(let y=0;y<canvas.height;y+=32)for(let x=0;x<canvas.width;x+=32)ctx.fillRect(x,y,31,31);
      // The production renderer stays at 1x. The showcase uses a strict integer 2x
      // transform so attachment errors remain easy to inspect without smoothing.
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.translate(character.x, character.y);
      ctx.scale(2, 2);
      ctx.translate(-character.x, -character.y);
      system.renderer.render(ctx, character);
      ["headAnchor","bodyAnchor","leftHandAnchor","rightHandAnchor","backAnchor"].forEach((name,index) => {
        const anchor = character.getWorldAnchor(name);ctx.fillStyle=["#ffeb73","#72e5ff","#70ef8d","#ff7979","#d589ff"][index];ctx.fillRect(anchor.x-1,anchor.y-1,2,2);
      });
      ctx.restore();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  } catch (error) {
    status.textContent = `载入失败：${error.message}`;
    status.style.color = "#ff8c86";
    console.error(error);
  }
})();
