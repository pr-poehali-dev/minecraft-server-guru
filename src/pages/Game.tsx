import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

// ─── Типы ────────────────────────────────────────────────────────────────────
interface Cheats {
  fly: boolean;
  immortal: boolean;
  speed: boolean;
  noclip: boolean;
}

interface HUD {
  hp: number;
  coins: number;
  score: number;
  cheats: Cheats;
  locked: boolean;
  paused: boolean;
  blocks: number;
}

// ─── Константы ───────────────────────────────────────────────────────────────
const WORLD_SIZE   = 32;
const BLOCK_SIZE   = 1;
const PLAYER_H     = 1.7;
const GRAVITY      = -20;
const JUMP_V       = 8;
const WALK_SPEED   = 5;
const FLY_SPEED    = 10;
const SPRINT_MULT  = 1.8;

// ─── Цвета блоков ─────────────────────────────────────────────────────────────
const BLOCK_COLORS: Record<string, number> = {
  grass:     0x5a9e3a,
  dirt:      0x8b5e3c,
  stone:     0x7a7a7a,
  wood:      0x8b6914,
  leaves:    0x2d7a1f,
  sand:      0xe8d87a,
  glowstone: 0xFFD700,
  obsidian:  0x1a0a2a,
};

// ─── Генерация мира ──────────────────────────────────────────────────────────
function generateWorld() {
  const blocks: Map<string, string> = new Map();
  function key(x: number, y: number, z: number) { return `${x},${y},${z}`; }

  for (let x = -WORLD_SIZE; x <= WORLD_SIZE; x++) {
    for (let z = -WORLD_SIZE; z <= WORLD_SIZE; z++) {
      const h = Math.floor(
        Math.sin(x * 0.18) * 2.5 +
        Math.cos(z * 0.13) * 2 +
        Math.sin((x + z) * 0.09) * 1.5,
      );
      for (let y = -3; y <= h; y++) {
        if (y === h)        blocks.set(key(x, y, z), "grass");
        else if (y >= h - 2) blocks.set(key(x, y, z), "dirt");
        else                 blocks.set(key(x, y, z), "stone");
      }
    }
  }

  // Деревья
  const trees = [[3,0,3],[-5,0,7],[8,0,-4],[-10,0,-8],[15,0,5],[-7,0,-15],[12,0,12],[-18,0,3],[6,0,-18],[20,0,-10]];
  for (const [tx,,tz] of trees) {
    const bx = tx as number, bz = tz as number;
    let topY = 0;
    for (let y = 5; y >= -3; y--) { if (blocks.has(key(bx, y, bz))) { topY = y + 1; break; } }
    for (let y = topY; y < topY + 4; y++) blocks.set(key(bx, y, bz), "wood");
    for (let lx = bx - 2; lx <= bx + 2; lx++)
      for (let lz = bz - 2; lz <= bz + 2; lz++)
        for (let ly = topY + 3; ly <= topY + 5; ly++)
          if (!blocks.has(key(lx, ly, lz))) blocks.set(key(lx, ly, lz), "leaves");
  }

  // Особые блоки
  [[5,1,5],[-5,1,-5],[0,1,10],[-12,1,8],[14,1,-12]].forEach(([x,y,z]) => blocks.set(key(x,y,z), "glowstone"));

  return blocks;
}

// ─── Основной компонент ──────────────────────────────────────────────────────
export default function Game() {
  const mountRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gRef = useRef<any>(null);

  const [hud, setHud] = useState<HUD>({
    hp: 100, coins: 0, score: 0,
    cheats: { fly: false, immortal: false, speed: false, noclip: false },
    locked: false, paused: false, blocks: 0,
  });
  const [showCheats, setShowCheats] = useState(false);
  const [cheatLog, setCheatLog]     = useState<string[]>([]);
  const [selectedBlock, setSelectedBlock] = useState("grass");
  const [notification, setNotification]   = useState<string | null>(null);

  const notify = useCallback((msg: string) => {
    setNotification(msg);
    setCheatLog((p) => [msg, ...p].slice(0, 12));
    setTimeout(() => setNotification(null), 2000);
  }, []);

  // ── Читы ──────────────────────────────────────────────────────────────────
  const toggleFly = useCallback(() => {
    const g = gRef.current; if (!g) return;
    g.cheats.fly = !g.cheats.fly;
    if (g.cheats.fly) g.vel.y = 0;
    setHud((h) => ({ ...h, cheats: { ...h.cheats, fly: g.cheats.fly } }));
    notify(g.cheats.fly ? "✈ Полёт ВКЛЮЧЁН" : "✈ Полёт ВЫКЛЮЧЁН");
  }, [notify]);

  const toggleImmortal = useCallback(() => {
    const g = gRef.current; if (!g) return;
    g.cheats.immortal = !g.cheats.immortal;
    setHud((h) => ({ ...h, cheats: { ...h.cheats, immortal: g.cheats.immortal } }));
    notify(g.cheats.immortal ? "⭐ Бессмертие ВКЛЮЧЕНО" : "⭐ Бессмертие ВЫКЛЮЧЕНО");
  }, [notify]);

  const toggleSpeed = useCallback(() => {
    const g = gRef.current; if (!g) return;
    g.cheats.speed = !g.cheats.speed;
    setHud((h) => ({ ...h, cheats: { ...h.cheats, speed: g.cheats.speed } }));
    notify(g.cheats.speed ? "⚡ Скорость x3 ВКЛЮЧЕНА" : "⚡ Скорость x3 ВЫКЛЮЧЕНА");
  }, [notify]);

  const toggleNoclip = useCallback(() => {
    const g = gRef.current; if (!g) return;
    g.cheats.noclip = !g.cheats.noclip;
    setHud((h) => ({ ...h, cheats: { ...h.cheats, noclip: g.cheats.noclip } }));
    notify(g.cheats.noclip ? "👻 Noclip ВКЛЮЧЁН" : "👻 Noclip ВЫКЛЮЧЁН");
  }, [notify]);

  const cheatFullHp = useCallback(() => {
    const g = gRef.current; if (!g) return;
    g.hp = 100;
    setHud((h) => ({ ...h, hp: 100 }));
    notify("💊 Здоровье восстановлено");
  }, [notify]);

  const cheatAddCoins = useCallback((n: number) => {
    const g = gRef.current; if (!g) return;
    g.coins_count += n;
    setHud((h) => ({ ...h, coins: g.coins_count }));
    notify(`💰 +${n} монет`);
  }, [notify]);

  const cheatTeleport = useCallback(() => {
    const g = gRef.current; if (!g) return;
    g.pos.set(0, 10, 0);
    g.vel.set(0, 0, 0);
    notify("📍 Телепорт на спавн");
  }, [notify]);

  const cheatKillEnemies = useCallback(() => {
    const g = gRef.current; if (!g) return;
    g.enemies.forEach((e: { mesh: THREE.Mesh }) => g.scene.remove(e.mesh));
    g.enemies = [];
    notify("💀 Все враги уничтожены");
  }, [notify]);

  // ── Three.js init ──────────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 20, 60);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.05, 200);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.2);
    sun.position.set(20, 40, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { near: 0.5, far: 100, left: -40, right: 40, top: 40, bottom: -40 });
    scene.add(sun);

    // Raycaster
    const raycaster = new THREE.Raycaster();

    // Blocks
    const blocks = generateWorld();
    const blockMeshes: Map<string, THREE.Mesh> = new Map();
    const glowMeshes: THREE.Mesh[] = [];
    const geom = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    const matCache = new Map<string, THREE.MeshLambertMaterial>();

    function getMat(type: string) {
      if (matCache.has(type)) return matCache.get(type)!;
      const mat = new THREE.MeshLambertMaterial({ color: BLOCK_COLORS[type] ?? 0x888888 });
      if (type === "leaves") { mat.transparent = true; mat.opacity = 0.85; }
      matCache.set(type, mat);
      return mat;
    }

    blocks.forEach((type, k) => {
      const [x, y, z] = k.split(",").map(Number);
      const mesh = new THREE.Mesh(geom, getMat(type));
      mesh.position.set(x, y, z);
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData = { blockKey: k, blockType: type };
      scene.add(mesh);
      blockMeshes.set(k, mesh);
      if (type === "glowstone") glowMeshes.push(mesh);
    });

    // Coins
    const coinGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const coinMat = new THREE.MeshLambertMaterial({ color: 0xFFE600 });
    const coins: THREE.Mesh[] = [];
    [[2,3,2],[-3,4,5],[7,5,-3],[-8,3,-6],[10,4,8],[-12,3,2],[5,6,-12],[15,4,5],[-6,5,15],[1,3,-10],[18,3,-5],[-15,4,-10],[8,5,18],[-4,3,-18],[12,3,-14]].forEach(([cx,cy,cz]) => {
      const c = new THREE.Mesh(coinGeo, coinMat);
      c.position.set(cx, cy, cz);
      scene.add(c); coins.push(c);
    });

    // Enemies
    const enemyGeo = new THREE.BoxGeometry(0.8, 1.6, 0.8);
    const enemyMat = new THREE.MeshLambertMaterial({ color: 0xFF2244 });
    const enemies: { mesh: THREE.Mesh }[] = [];
    [[10,5,10],[-10,5,-10],[15,5,-8],[-8,5,15]].forEach(([ex,ey,ez]) => {
      const m = new THREE.Mesh(enemyGeo, enemyMat);
      m.position.set(ex, ey, ez);
      scene.add(m); enemies.push({ mesh: m });
    });

    // Stars
    const sv: number[] = [];
    for (let i = 0; i < 300; i++) sv.push((Math.random()-0.5)*400, 50+Math.random()*100, (Math.random()-0.5)*400);
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(sv, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.3 })));

    // Player state
    const pos   = new THREE.Vector3(0, 8, 0);
    const vel   = new THREE.Vector3();
    const cheats: Cheats = { fly: false, immortal: false, speed: false, noclip: false };
    const keys: Record<string, boolean> = {};
    const clock = new THREE.Clock();
    let yaw = 0, pitch = 0, onGround = false;
    let hp = 100, coins_count = 0, score = 0;
    let locked = false, paused = false, damageCooldown = 0;
    const selectedBlockType = "grass";

    gRef.current = { scene, camera, renderer, blocks, blockMeshes, coins, enemies, pos, vel, yaw, pitch, onGround, hp, coins_count, score, cheats, keys, locked, paused, selectedBlock: selectedBlockType, raf: 0, clock, raycaster, glowMeshes, damageCooldown };

    // Pointer lock
    function onPLChange() {
      locked = document.pointerLockElement === renderer.domElement;
      gRef.current.locked = locked;
      setHud((h) => ({ ...h, locked }));
    }
    function onMouseMove(e: MouseEvent) {
      if (!locked || paused) return;
      yaw   -= e.movementX * 0.002;
      pitch -= e.movementY * 0.002;
      pitch  = Math.max(-Math.PI/2+0.01, Math.min(Math.PI/2-0.01, pitch));
      gRef.current.yaw = yaw; gRef.current.pitch = pitch;
    }
    function onMouseDown(e: MouseEvent) {
      if (!locked || paused) return;
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const hits = raycaster.intersectObjects(Array.from(blockMeshes.values()));
      if (!hits.length || hits[0].distance > 5) return;
      const hit = hits[0];
      const bk  = (hit.object as THREE.Mesh).userData.blockKey as string;

      if (e.button === 0) {
        scene.remove(hit.object);
        blockMeshes.delete(bk); blocks.delete(bk);
        score += 5;
        setHud((h) => ({ ...h, score, blocks: blockMeshes.size }));
      } else if (e.button === 2 && hit.face) {
        const n  = hit.face.normal.clone().round();
        const bp = hit.object.position.clone().add(n);
        const nk = `${Math.round(bp.x)},${Math.round(bp.y)},${Math.round(bp.z)}`;
        if (!blocks.has(nk)) {
          const nm = new THREE.Mesh(geom, getMat(gRef.current.selectedBlock));
          nm.position.copy(bp);
          nm.castShadow = true; nm.receiveShadow = true;
          nm.userData = { blockKey: nk, blockType: gRef.current.selectedBlock };
          scene.add(nm); blockMeshes.set(nk, nm); blocks.set(nk, gRef.current.selectedBlock);
          setHud((h) => ({ ...h, blocks: blockMeshes.size }));
        }
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      keys[e.code] = true;
      if (!locked || paused) return;
      if (e.code === "Space" && onGround && !cheats.fly) { vel.y = JUMP_V; onGround = false; }
      if (e.code === "Space" && cheats.fly) vel.y = FLY_SPEED * 0.6;
      if (e.code === "ShiftLeft" && cheats.fly) vel.y = -FLY_SPEED * 0.6;
    }
    function onKeyUp(e: KeyboardEvent) {
      keys[e.code] = false;
      if ((e.code === "Space" || e.code === "ShiftLeft") && cheats.fly) vel.y = 0;
      if (e.code === "Escape") { paused = !paused; gRef.current.paused = paused; setHud((h) => ({ ...h, paused })); }
    }

    document.addEventListener("pointerlockchange", onPLChange);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    renderer.domElement.addEventListener("click", () => { if (!locked) renderer.domElement.requestPointerLock(); });
    renderer.domElement.addEventListener("contextmenu", (e) => e.preventDefault());

    // Collision
    function blockAt(x: number, y: number, z: number) {
      return blocks.has(`${Math.round(x)},${Math.round(y)},${Math.round(z)}`);
    }
    function resolveCollision(p: THREE.Vector3, noclip: boolean) {
      if (noclip) return false;
      let g = false; const r = 0.3;
      if (blockAt(p.x,p.y-0.1,p.z)||blockAt(p.x+r,p.y-0.1,p.z)||blockAt(p.x-r,p.y-0.1,p.z)||blockAt(p.x,p.y-0.1,p.z+r)||blockAt(p.x,p.y-0.1,p.z-r)) {
        p.y = Math.ceil(p.y - 0.1) + 0.1; vel.y = 0; g = true;
      }
      if (blockAt(p.x,p.y+PLAYER_H,p.z)) { p.y -= 0.05; if (vel.y > 0) vel.y = 0; }
      if (blockAt(p.x+r,p.y+0.5,p.z)||blockAt(p.x+r,p.y+1.2,p.z)) { p.x -= 0.05; vel.x = 0; }
      if (blockAt(p.x-r,p.y+0.5,p.z)||blockAt(p.x-r,p.y+1.2,p.z)) { p.x += 0.05; vel.x = 0; }
      if (blockAt(p.x,p.y+0.5,p.z+r)||blockAt(p.x,p.y+1.2,p.z+r)) { p.z -= 0.05; vel.z = 0; }
      if (blockAt(p.x,p.y+0.5,p.z-r)||blockAt(p.x,p.y+1.2,p.z-r)) { p.z += 0.05; vel.z = 0; }
      return g;
    }

    // Game loop
    let hudTick = 0;
    function animate() {
      gRef.current.raf = requestAnimationFrame(animate);
      const dt   = Math.min(clock.getDelta(), 0.05);
      const time = clock.elapsedTime;

      if (paused) { renderer.render(scene, camera); return; }

      const speed = cheats.fly ? FLY_SPEED : WALK_SPEED;
      const spd   = speed * (cheats.speed ? SPRINT_MULT * 2 : (keys["ShiftLeft"] && !cheats.fly ? SPRINT_MULT : 1));

      const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
      const right   = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
      const move    = new THREE.Vector3();
      if (keys["KeyW"]||keys["ArrowUp"])    move.addScaledVector(forward,  1);
      if (keys["KeyS"]||keys["ArrowDown"])  move.addScaledVector(forward, -1);
      if (keys["KeyA"]||keys["ArrowLeft"])  move.addScaledVector(right,   -1);
      if (keys["KeyD"]||keys["ArrowRight"]) move.addScaledVector(right,    1);
      if (move.lengthSq() > 0) { move.normalize().multiplyScalar(spd); vel.x = move.x; vel.z = move.z; }
      else { vel.x *= 0.82; vel.z *= 0.82; }

      if (cheats.fly) { if (!keys["Space"] && !keys["ShiftLeft"]) vel.y *= 0.85; }
      else vel.y += GRAVITY * dt;

      pos.x += vel.x * dt; pos.z += vel.z * dt; pos.y += vel.y * dt;

      const gr = resolveCollision(pos, cheats.noclip);
      if (gr) onGround = true; else if (!cheats.fly) onGround = false;

      if (pos.y < -20) { pos.set(0, 10, 0); vel.set(0, 0, 0); if (!cheats.immortal) { hp = Math.max(0, hp - 20); } }
      const B = WORLD_SIZE + 2;
      if (!cheats.noclip) { pos.x = Math.max(-B, Math.min(B, pos.x)); pos.z = Math.max(-B, Math.min(B, pos.z)); }

      camera.position.set(pos.x, pos.y + PLAYER_H, pos.z);
      camera.rotation.set(0, 0, 0, "YXZ");
      camera.rotation.y = yaw; camera.rotation.x = pitch;

      // Coins
      for (let i = coins.length - 1; i >= 0; i--) {
        coins[i].rotation.y += dt * 2;
        coins[i].position.y += Math.sin(time * 2 + i) * 0.002;
        if (pos.distanceTo(coins[i].position) < 1.2) {
          scene.remove(coins[i]); coins.splice(i, 1);
          coins_count += 10; score += 10;
          gRef.current.coins_count = coins_count; gRef.current.score = score;
          hudTick = 0;
        }
      }

      // Glowstone glow
      for (let i = 0; i < glowMeshes.length; i++) {
        const mat = (glowMeshes[i] as THREE.Mesh).material as THREE.MeshLambertMaterial;
        mat.emissive?.setHex(0xFFD700);
        mat.emissiveIntensity = 0.5 + Math.sin(time * 3 + i) * 0.3;
      }

      // Enemies
      damageCooldown = Math.max(0, damageCooldown - dt);
      for (const enemy of enemies) {
        const dir = pos.clone().sub(enemy.mesh.position); dir.y = 0;
        if (dir.length() > 0.5) { dir.normalize().multiplyScalar(2.5 * dt); enemy.mesh.position.add(dir); }
        enemy.mesh.rotation.y += dt;
        if (pos.distanceTo(enemy.mesh.position) < 1.5 && damageCooldown <= 0 && !cheats.immortal) {
          hp = Math.max(0, hp - 8); damageCooldown = 1.0;
        }
      }
      gRef.current.hp = hp; gRef.current.damageCooldown = damageCooldown;

      hudTick++;
      if (hudTick % 6 === 0) setHud((h) => ({ ...h, hp, coins: coins_count, score, locked, paused, blocks: blockMeshes.size }));

      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(gRef.current?.raf ?? 0);
      document.removeEventListener("pointerlockchange", onPLChange);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
   
  }, []);

  useEffect(() => { if (gRef.current) gRef.current.selectedBlock = selectedBlock; }, [selectedBlock]);

  const hpColor    = hud.hp > 60 ? "#00FF88" : hud.hp > 30 ? "#FFE600" : "#FF0080";
  const BLOCK_LIST = Object.keys(BLOCK_COLORS);

  return (
    <div className="relative w-full" style={{ height: "100dvh", background: "#000", overflow: "hidden" }}>

      {/* Viewport */}
      <div ref={mountRef} className="absolute inset-0" style={{ cursor: hud.locked ? "none" : "default" }} />

      {/* Crosshair */}
      {hud.locked && !hud.paused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{ position: "relative", width: 24, height: 24 }}>
            <div style={{ position: "absolute", left: 11, top: 4, width: 2, height: 16, background: "rgba(255,255,255,0.85)", borderRadius: 1 }} />
            <div style={{ position: "absolute", top: 11, left: 4, width: 16, height: 2, background: "rgba(255,255,255,0.85)", borderRadius: 1 }} />
          </div>
        </div>
      )}

      {/* HUD верхний левый */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ color: hpColor, fontSize: 16 }}>❤</span>
          <div style={{ width: 80, height: 6, background: "#222", borderRadius: 3 }}>
            <div style={{ width: `${hud.hp}%`, height: 6, background: hpColor, borderRadius: 3, boxShadow: `0 0 6px ${hpColor}`, transition: "width 0.3s" }} />
          </div>
          <span className="font-pixel" style={{ color: hpColor, fontSize: 10 }}>{hud.hp}</span>
        </div>
        <div className="flex gap-2">
          {[{ icon: "💰", val: hud.coins, color: "#FFE600" }, { icon: "⭐", val: hud.score, color: "#00CFFF" }].map((s) => (
            <div key={s.icon} className="px-3 py-1.5 rounded-xl flex items-center gap-1.5" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: 14 }}>{s.icon}</span>
              <span className="font-pixel" style={{ color: s.color, fontSize: 10 }}>{s.val}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {hud.cheats.fly      && <span className="font-pixel px-2 py-0.5 rounded" style={{ background: "#00CFFF22", color: "#00CFFF", border: "1px solid #00CFFF44", fontSize: 9 }}>✈ ПОЛЁТ</span>}
          {hud.cheats.immortal && <span className="font-pixel px-2 py-0.5 rounded" style={{ background: "#FFE60022", color: "#FFE600", border: "1px solid #FFE60044", fontSize: 9 }}>⭐ БЕССМ.</span>}
          {hud.cheats.speed    && <span className="font-pixel px-2 py-0.5 rounded" style={{ background: "#FF008022", color: "#FF0080", border: "1px solid #FF008044", fontSize: 9 }}>⚡ СКОР.</span>}
          {hud.cheats.noclip   && <span className="font-pixel px-2 py-0.5 rounded" style={{ background: "#A855F722", color: "#A855F7", border: "1px solid #A855F744", fontSize: 9 }}>👻 NOCLIP</span>}
        </div>
      </div>

      {/* Верхний правый */}
      <div className="absolute top-3 right-3 flex gap-2">
        <a href="/" className="font-pixel px-3 py-2 rounded-xl transition-all hover:scale-105"
          style={{ background: "rgba(0,0,0,0.7)", color: "#555", border: "1px solid rgba(255,255,255,0.1)", fontSize: 9 }}>
          ← КАТАЛОГ
        </a>
        <button onClick={() => setShowCheats(!showCheats)}
          className="font-pixel px-3 py-2 rounded-xl transition-all hover:scale-105"
          style={{ background: showCheats ? "rgba(0,255,136,0.15)" : "rgba(0,0,0,0.7)", color: "#00FF88", border: "1px solid rgba(0,255,136,0.3)", fontSize: 9 }}>
          ⚡ ЧИТЫ
        </button>
      </div>

      {/* Hotbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-auto">
        {BLOCK_LIST.map((b) => (
          <button key={b} onClick={() => setSelectedBlock(b)}
            className="rounded-lg transition-all hover:scale-110"
            title={b}
            style={{
              width: 44, height: 44,
              background: `#${BLOCK_COLORS[b].toString(16).padStart(6, "0")}`,
              border: selectedBlock === b ? "2px solid #fff" : "2px solid rgba(255,255,255,0.2)",
              boxShadow: selectedBlock === b ? "0 0 12px rgba(255,255,255,0.4)" : "none",
              opacity: selectedBlock === b ? 1 : 0.65,
            }} />
        ))}
      </div>

      {/* Block hint */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none">
        <span className="font-pixel px-3 py-1 rounded-lg" style={{ background: "rgba(0,0,0,0.6)", color: "#888", fontSize: 9 }}>
          [{selectedBlock}] &nbsp; ЛКМ — сломать &nbsp; ПКМ — поставить
        </span>
      </div>

      {/* Cheat panel */}
      {showCheats && (
        <div className="absolute top-14 right-3 w-52 flex flex-col gap-1.5 animate-fade-in-up"
          style={{ background: "rgba(8,8,8,0.92)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: 16, padding: 12, backdropFilter: "blur(8px)" }}>
          <div className="font-pixel mb-1" style={{ color: "#00FF88", fontSize: 9 }}>⚡ ПАНЕЛЬ ЧИТОВ</div>
          {[
            { label: "✈ Полёт",        action: toggleFly,       active: hud.cheats.fly,      color: "#00CFFF" },
            { label: "⭐ Бессмертие",  action: toggleImmortal,  active: hud.cheats.immortal, color: "#FFE600" },
            { label: "⚡ Скорость x3", action: toggleSpeed,     active: hud.cheats.speed,    color: "#FF0080" },
            { label: "👻 Noclip",      action: toggleNoclip,    active: hud.cheats.noclip,   color: "#A855F7" },
          ].map((ch) => (
            <button key={ch.label} onClick={ch.action}
              className="text-xs px-3 py-2 rounded-lg text-left transition-all hover:scale-[1.02] font-medium"
              style={{ background: ch.active ? `${ch.color}22` : "rgba(255,255,255,0.04)", color: ch.active ? ch.color : "#666", border: `1px solid ${ch.active ? ch.color+"55" : "rgba(255,255,255,0.08)"}`, boxShadow: ch.active ? `0 0 8px ${ch.color}44` : "none" }}>
              {ch.label} <span style={{ opacity: 0.5, fontSize: 10 }}>{ch.active ? "ВКЛ" : "ВЫКЛ"}</span>
            </button>
          ))}
          <div className="h-px my-1" style={{ background: "rgba(255,255,255,0.06)" }} />
          {[
            { label: "💊 Полное HP",          action: cheatFullHp },
            { label: "💰 +500 монет",         action: () => cheatAddCoins(500) },
            { label: "💰 +5000 монет",        action: () => cheatAddCoins(5000) },
            { label: "📍 Телепорт на спавн",  action: cheatTeleport },
            { label: "💀 Убить врагов",       action: cheatKillEnemies },
          ].map((ch) => (
            <button key={ch.label} onClick={ch.action}
              className="text-xs px-3 py-2 rounded-lg text-left transition-all hover:scale-[1.02]"
              style={{ background: "rgba(255,255,255,0.04)", color: "#888", border: "1px solid rgba(255,255,255,0.08)" }}>
              {ch.label}
            </button>
          ))}
          {cheatLog.length > 0 && (
            <div className="mt-1 rounded-lg p-2" style={{ background: "rgba(0,0,0,0.4)", maxHeight: 90, overflowY: "auto" }}>
              {cheatLog.map((l, i) => <div key={i} style={{ color: "#444", fontSize: 9, lineHeight: 1.7 }}>{l}</div>)}
            </div>
          )}
        </div>
      )}

      {/* Overlay: click to play */}
      {!hud.locked && !hud.paused && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)", cursor: "pointer" }}
          onClick={() => { const c = mountRef.current?.querySelector("canvas") as HTMLElement | null; c?.requestPointerLock?.(); }}>
          <div className="text-center animate-fade-in-up px-6">
            <div className="font-pixel mb-4" style={{ color: "#00FF88", textShadow: "0 0 20px #00FF88", fontSize: 20 }}>⛏ MINECRAFT 3D</div>
            <div className="text-sm mb-6" style={{ color: "#888" }}>Нажми чтобы начать играть</div>
            <div className="flex flex-col gap-1.5 text-xs max-w-xs mx-auto text-left mb-6" style={{ color: "#555" }}>
              {[["WASD / Стрелки","Движение"],["Мышь","Обзор"],["Пробел","Прыжок / подъём"],["Shift","Спуск (полёт)"],["ЛКМ","Сломать блок"],["ПКМ","Поставить блок"],["ESC","Пауза"]].map(([k,v]) => (
                <div key={k} className="flex gap-2"><span className="px-1.5 rounded font-mono" style={{ background: "#111", color: "#555", border: "1px solid #333", minWidth: 120 }}>{k}</span><span>{v}</span></div>
              ))}
            </div>
            <div className="font-pixel px-6 py-3 rounded-xl inline-block"
              style={{ background: "linear-gradient(135deg, #00FF88, #00CFFF)", color: "#080808", boxShadow: "0 0 24px rgba(0,255,136,0.4)", fontSize: 10 }}>
              ▶ ИГРАТЬ
            </div>
          </div>
        </div>
      )}

      {/* Пауза */}
      {hud.paused && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="text-center animate-fade-in-up">
            <div className="font-pixel mb-4" style={{ color: "#00FF88", textShadow: "0 0 20px #00FF88", fontSize: 18 }}>⏸ ПАУЗА</div>
            <div className="text-sm" style={{ color: "#555" }}>ESC — продолжить</div>
          </div>
        </div>
      )}

      {/* Notification toast */}
      {notification && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none animate-fade-in-up">
          <div className="font-pixel px-4 py-2 rounded-xl" style={{ background: "rgba(0,255,136,0.15)", color: "#00FF88", border: "1px solid rgba(0,255,136,0.3)", fontSize: 10, backdropFilter: "blur(4px)" }}>
            {notification}
          </div>
        </div>
      )}
    </div>
  );
}
