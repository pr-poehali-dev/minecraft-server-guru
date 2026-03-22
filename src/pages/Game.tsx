import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Player {
  x: number; y: number;
  hp: number; maxHp: number;
  coins: number; score: number;
  flying: boolean; immortal: boolean;
  speedBoost: boolean;
}

interface Enemy {
  id: number; x: number; y: number;
  hp: number; maxHp: number; speed: number;
}

interface Coin { id: number; x: number; y: number; value: number; }
interface Item  { id: number; x: number; y: number; type: string; }
interface Particle { id: number; x: number; y: number; vx: number; vy: number; life: number; color: string; text?: string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const W = 800, H = 520;
const PLAYER_SIZE = 28;
const ENEMY_SIZE  = 26;
const COIN_SIZE   = 14;
const GROUND_Y    = H - 60;
const GRAVITY     = 0.55;
const JUMP_FORCE  = -13;
const MOVE_SPEED  = 4;
const ADMIN_PASSWORD = "admin123";

const ITEM_TYPES: Record<string, { color: string; label: string; icon: string }> = {
  shield:  { color: "#00CFFF", label: "Щит",    icon: "🛡️" },
  bomb:    { color: "#FF0080", label: "Бомба",   icon: "💣" },
  star:    { color: "#FFE600", label: "Звезда",  icon: "⭐" },
};

const PLATFORM_LIST = [
  { x: 80,  y: 360, w: 120, h: 16 },
  { x: 280, y: 300, w: 140, h: 16 },
  { x: 500, y: 250, w: 120, h: 16 },
  { x: 650, y: 370, w: 100, h: 16 },
  { x: 180, y: 200, w: 100, h: 16 },
  { x: 380, y: 160, w: 130, h: 16 },
];

function mkEnemy(id: number): Enemy {
  return {
    id, hp: 40, maxHp: 40, speed: 1.2 + Math.random(),
    x: Math.random() > 0.5 ? W + 40 : -40,
    y: GROUND_Y - ENEMY_SIZE,
  };
}
function mkCoin(id: number): Coin {
  return { id, value: 10, x: 60 + Math.random() * (W - 120), y: GROUND_Y - COIN_SIZE - Math.random() * 200 };
}
function mkItem(id: number): Item {
  const types = Object.keys(ITEM_TYPES);
  return { id, type: types[Math.floor(Math.random() * types.length)], x: 60 + Math.random() * (W - 120), y: GROUND_Y - 30 };
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef({
    player: { x: 100, y: GROUND_Y - PLAYER_SIZE, hp: 100, maxHp: 100, coins: 0, score: 0, flying: false, immortal: false, speedBoost: false } as Player,
    vy: 0,
    onGround: true,
    enemies: [] as Enemy[],
    coins: [] as Coin[],
    items: [] as Item[],
    particles: [] as Particle[],
    keys: {} as Record<string, boolean>,
    tick: 0,
    pidCounter: 1,
    gameOver: false,
    paused: false,
  });

  const [uiState, setUiState] = useState({
    hp: 100, coins: 0, score: 0, flying: false, immortal: false, speedBoost: false,
    gameOver: false, paused: false,
  });
  const [cheatLog, setCheatLog] = useState<string[]>([]);
  const [showCheats, setShowCheats] = useState(false);

  // Admin panel
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState(false);

  const rafRef = useRef<number>(0);

  // Log cheat
  const logCheat = useCallback((msg: string) => {
    setCheatLog((p) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p].slice(0, 20));
  }, []);

  // ── Cheats ─────────────────────────────────────────────────────────────────
  const cheatTeleport = useCallback(() => {
    const s = stateRef.current;
    s.player.x = W / 2; s.player.y = GROUND_Y - PLAYER_SIZE; s.vy = 0;
    addParticle(s, W / 2, GROUND_Y - PLAYER_SIZE, "#00CFFF", "ТЕЛЕПОРТ!");
    logCheat("Телепорт — перемещён в центр");
  }, [logCheat]);

  const cheatFly = useCallback(() => {
    const s = stateRef.current;
    s.player.flying = !s.player.flying;
    setUiState((u) => ({ ...u, flying: s.player.flying }));
    logCheat(s.player.flying ? "Полёт ВКЛЮЧЁН" : "Полёт ВЫКЛЮЧЁН");
  }, [logCheat]);

  const cheatImmortal = useCallback(() => {
    const s = stateRef.current;
    s.player.immortal = !s.player.immortal;
    setUiState((u) => ({ ...u, immortal: s.player.immortal }));
    logCheat(s.player.immortal ? "Бессмертие ВКЛЮЧЕНО" : "Бессмертие ВЫКЛЮЧЕНО");
  }, [logCheat]);

  const cheatMoney = useCallback((amount = 1000) => {
    const s = stateRef.current;
    s.player.coins += amount;
    addParticle(s, s.player.x, s.player.y, "#FFE600", `+${amount}💰`);
    setUiState((u) => ({ ...u, coins: s.player.coins }));
    logCheat(`+${amount} монет`);
  }, [logCheat]);

  const cheatKillAll = useCallback(() => {
    const s = stateRef.current;
    const n = s.enemies.length;
    s.enemies.forEach((e) => addParticle(s, e.x, e.y, "#FF0080", "💀"));
    s.enemies = [];
    logCheat(`Убито врагов: ${n}`);
  }, [logCheat]);

  const cheatSpawnItem = useCallback((type: string) => {
    const s = stateRef.current;
    s.items.push({ id: s.pidCounter++, type, x: s.player.x + 40, y: s.player.y });
    logCheat(`Заспавнен предмет: ${ITEM_TYPES[type]?.label}`);
  }, [logCheat]);

  const cheatSpeed = useCallback(() => {
    const s = stateRef.current;
    s.player.speedBoost = !s.player.speedBoost;
    setUiState((u) => ({ ...u, speedBoost: s.player.speedBoost }));
    logCheat(s.player.speedBoost ? "Скорость x3 ВКЛЮЧЕНА" : "Скорость x3 ВЫКЛЮЧЕНА");
  }, [logCheat]);

  const cheatFullHp = useCallback(() => {
    const s = stateRef.current;
    s.player.hp = s.player.maxHp;
    setUiState((u) => ({ ...u, hp: s.player.maxHp }));
    addParticle(s, s.player.x, s.player.y, "#00FF88", "+100 HP");
    logCheat("Здоровье восстановлено");
  }, [logCheat]);

  const cheatSpawnEnemy = useCallback((n = 3) => {
    const s = stateRef.current;
    for (let i = 0; i < n; i++) s.enemies.push(mkEnemy(s.pidCounter++));
    logCheat(`Заспавнено врагов: ${n}`);
  }, [logCheat]);

  // ── Particles ───────────────────────────────────────────────────────────────
  function addParticle(s: typeof stateRef.current, x: number, y: number, color: string, text?: string) {
    for (let i = 0; i < (text ? 1 : 6); i++) {
      s.particles.push({
        id: s.pidCounter++, x, y,
        vx: text ? 0 : (Math.random() - 0.5) * 4,
        vy: text ? -2.5 : -2 - Math.random() * 3,
        life: text ? 60 : 30 + Math.random() * 20,
        color, text,
      });
    }
  }

  // ── Game loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const s = stateRef.current;

    // Spawn initial
    for (let i = 0; i < 6; i++) s.coins.push(mkCoin(s.pidCounter++));
    for (let i = 0; i < 2; i++) s.enemies.push(mkEnemy(s.pidCounter++));
    for (let i = 0; i < 2; i++) s.items.push(mkItem(s.pidCounter++));

    function onKey(e: KeyboardEvent, down: boolean) {
      s.keys[e.key] = down;
      if (down && (e.key === " " || e.key === "ArrowUp" || e.key === "w") && s.onGround && !s.player.flying) {
        s.vy = JUMP_FORCE;
        s.onGround = false;
      }
    }
    window.addEventListener("keydown", (e) => onKey(e, true));
    window.addEventListener("keyup",   (e) => onKey(e, false));

    function loop() {
      if (!s.paused && !s.gameOver) tick();
      render();
      rafRef.current = requestAnimationFrame(loop);
    }

    function tick() {
      s.tick++;
      const p = s.player;
      const speed = (p.speedBoost ? MOVE_SPEED * 3 : MOVE_SPEED);

      // Move
      if (s.keys["ArrowLeft"]  || s.keys["a"]) p.x -= speed;
      if (s.keys["ArrowRight"] || s.keys["d"]) p.x += speed;
      p.x = Math.max(0, Math.min(W - PLAYER_SIZE, p.x));

      // Flying
      if (p.flying) {
        if (s.keys["ArrowUp"]   || s.keys["w"]) p.y -= speed;
        if (s.keys["ArrowDown"] || s.keys["s"]) p.y += speed;
        p.y = Math.max(0, Math.min(GROUND_Y - PLAYER_SIZE, p.y));
        s.vy = 0; s.onGround = false;
      } else {
        // Gravity
        s.vy += GRAVITY;
        p.y += s.vy;

        // Ground
        if (p.y >= GROUND_Y - PLAYER_SIZE) {
          p.y = GROUND_Y - PLAYER_SIZE; s.vy = 0; s.onGround = true;
        }

        // Platforms
        for (const pl of PLATFORM_LIST) {
          const prevY = p.y - s.vy;
          if (
            p.x + PLAYER_SIZE > pl.x && p.x < pl.x + pl.w &&
            prevY + PLAYER_SIZE <= pl.y && p.y + PLAYER_SIZE >= pl.y && s.vy >= 0
          ) {
            p.y = pl.y - PLAYER_SIZE; s.vy = 0; s.onGround = true;
          }
        }
      }

      // Coins
      s.coins = s.coins.filter((c) => {
        if (dist(p.x + PLAYER_SIZE / 2, p.y + PLAYER_SIZE / 2, c.x, c.y) < PLAYER_SIZE) {
          p.coins += c.value; p.score += c.value;
          addParticle(s, c.x, c.y, "#FFE600", `+${c.value}`);
          return false;
        }
        return true;
      });
      while (s.coins.length < 5) s.coins.push(mkCoin(s.pidCounter++));

      // Items
      s.items = s.items.filter((it) => {
        if (dist(p.x + PLAYER_SIZE / 2, p.y + PLAYER_SIZE / 2, it.x, it.y) < PLAYER_SIZE + 10) {
          addParticle(s, it.x, it.y, ITEM_TYPES[it.type]?.color || "#fff", ITEM_TYPES[it.type]?.icon);
          if (it.type === "star") { p.score += 100; p.coins += 50; }
          if (it.type === "shield") p.immortal = true;
          if (it.type === "bomb") {
            s.enemies.forEach((e) => { if (dist(e.x, e.y, it.x, it.y) < 120) { e.hp = 0; } });
            s.enemies = s.enemies.filter((e) => e.hp > 0);
          }
          return false;
        }
        return true;
      });
      while (s.items.length < 2) s.items.push(mkItem(s.pidCounter++));

      // Enemies
      if (s.tick % 300 === 0 && s.enemies.length < 6) s.enemies.push(mkEnemy(s.pidCounter++));
      s.enemies.forEach((e) => {
        const dir = p.x > e.x ? 1 : -1;
        e.x += dir * e.speed;
        if (dist(p.x + PLAYER_SIZE / 2, p.y + PLAYER_SIZE / 2, e.x + ENEMY_SIZE / 2, e.y + ENEMY_SIZE / 2) < PLAYER_SIZE && !p.immortal) {
          if (s.tick % 40 === 0) { p.hp -= 10; }
        }
      });
      if (p.hp <= 0 && !p.immortal) {
        s.gameOver = true;
        setUiState((u) => ({ ...u, gameOver: true }));
      }

      // Particles
      s.particles = s.particles.filter((pt) => { pt.x += pt.vx; pt.y += pt.vy; pt.life--; return pt.life > 0; });

      // Sync UI every 6 ticks
      if (s.tick % 6 === 0) {
        setUiState((u) => ({
          ...u, hp: p.hp, coins: p.coins, score: p.score,
          flying: p.flying, immortal: p.immortal, speedBoost: p.speedBoost,
        }));
      }
    }

    function render() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      const p = s.player;

      // Background
      ctx.fillStyle = "#0a1628";
      ctx.fillRect(0, 0, W, H);

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#0a1628");
      sky.addColorStop(1, "#1a0a28");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = "rgba(0,255,136,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Ground
      const grd = ctx.createLinearGradient(0, GROUND_Y, 0, H);
      grd.addColorStop(0, "#1a4a2a");
      grd.addColorStop(1, "#0a2a12");
      ctx.fillStyle = grd;
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
      ctx.strokeStyle = "#00FF88";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#00FF88"; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(W, GROUND_Y); ctx.stroke();
      ctx.shadowBlur = 0;

      // Platforms
      for (const pl of PLATFORM_LIST) {
        ctx.fillStyle = "#1a3a4a";
        ctx.beginPath(); ctx.roundRect(pl.x, pl.y, pl.w, pl.h, 4); ctx.fill();
        ctx.strokeStyle = "#00CFFF"; ctx.lineWidth = 1.5;
        ctx.shadowColor = "#00CFFF"; ctx.shadowBlur = 6;
        ctx.stroke(); ctx.shadowBlur = 0;
      }

      // Coins
      for (const c of s.coins) {
        ctx.save();
        ctx.shadowColor = "#FFE600"; ctx.shadowBlur = 10;
        ctx.fillStyle = "#FFE600";
        ctx.beginPath(); ctx.arc(c.x, c.y, COIN_SIZE / 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff8"; ctx.font = "bold 9px Rubik";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("$", c.x, c.y);
        ctx.restore();
      }

      // Items
      for (const it of s.items) {
        const info = ITEM_TYPES[it.type];
        ctx.save();
        ctx.shadowColor = info.color; ctx.shadowBlur = 12;
        ctx.fillStyle = info.color + "33";
        ctx.beginPath(); ctx.arc(it.x, it.y, 16, 0, Math.PI * 2); ctx.fill();
        ctx.font = "18px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(info.icon, it.x, it.y);
        ctx.restore();
      }

      // Enemies
      for (const e of s.enemies) {
        ctx.save();
        ctx.shadowColor = "#FF0080"; ctx.shadowBlur = 12;
        // Body
        ctx.fillStyle = "#FF0080";
        ctx.beginPath(); ctx.roundRect(e.x, e.y, ENEMY_SIZE, ENEMY_SIZE, 6); ctx.fill();
        // Eyes
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(e.x + 7, e.y + 9, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(e.x + 19, e.y + 9, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.arc(e.x + 8, e.y + 9, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(e.x + 20, e.y + 9, 2, 0, Math.PI * 2); ctx.fill();
        // HP bar
        ctx.fillStyle = "#333"; ctx.fillRect(e.x, e.y - 8, ENEMY_SIZE, 4);
        ctx.fillStyle = "#FF0080"; ctx.shadowBlur = 4;
        ctx.fillRect(e.x, e.y - 8, ENEMY_SIZE * (e.hp / e.maxHp), 4);
        ctx.restore();
      }

      // Player
      ctx.save();
      const pc = p.immortal ? "#FFE600" : p.flying ? "#00CFFF" : "#00FF88";
      ctx.shadowColor = pc; ctx.shadowBlur = p.immortal ? 20 : 12;

      // Body
      ctx.fillStyle = pc;
      ctx.beginPath(); ctx.roundRect(p.x, p.y, PLAYER_SIZE, PLAYER_SIZE, 6); ctx.fill();

      // Face
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(p.x + 8, p.y + 10, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x + 20, p.y + 10, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.arc(p.x + 9, p.y + 10, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x + 21, p.y + 10, 2, 0, Math.PI * 2); ctx.fill();

      // Fly wings
      if (p.flying) {
        ctx.fillStyle = "#00CFFF88";
        ctx.beginPath(); ctx.ellipse(p.x - 8, p.y + 14, 10, 6, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(p.x + PLAYER_SIZE + 8, p.y + 14, 10, 6, 0.4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      // Particles
      for (const pt of s.particles) {
        ctx.save();
        const alpha = pt.life / 60;
        if (pt.text) {
          ctx.globalAlpha = Math.min(1, alpha * 2);
          ctx.fillStyle = pt.color;
          ctx.font = "bold 13px Rubik";
          ctx.textAlign = "center";
          ctx.shadowColor = pt.color; ctx.shadowBlur = 8;
          ctx.fillText(pt.text, pt.x, pt.y);
        } else {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = pt.color;
          ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }

      // Game over overlay
      if (s.gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#FF0080"; ctx.shadowColor = "#FF0080"; ctx.shadowBlur = 24;
        ctx.font = "bold 36px 'Press Start 2P', monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("GAME OVER", W / 2, H / 2 - 20);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#888"; ctx.font = "14px Rubik";
        ctx.fillText("Нажми R чтобы начать заново", W / 2, H / 2 + 24);
      }

      // Pause overlay
      if (s.paused && !s.gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#00FF88"; ctx.shadowColor = "#00FF88"; ctx.shadowBlur = 20;
        ctx.font = "bold 28px 'Press Start 2P', monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("ПАУЗА", W / 2, H / 2);
      }
    }

    // Keys
    function onKeyGlobal(e: KeyboardEvent) {
      if (e.key === "r" || e.key === "R") restart();
      if (e.key === "Escape") { s.paused = !s.paused; setUiState((u) => ({ ...u, paused: s.paused })); }
    }
    window.addEventListener("keydown", onKeyGlobal);

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKeyGlobal);
    };
  }, []);

  function restart() {
    const s = stateRef.current;
    s.player = { x: 100, y: GROUND_Y - PLAYER_SIZE, hp: 100, maxHp: 100, coins: 0, score: 0, flying: false, immortal: false, speedBoost: false };
    s.vy = 0; s.onGround = true;
    s.enemies = []; s.coins = []; s.items = []; s.particles = [];
    for (let i = 0; i < 6; i++) s.coins.push(mkCoin(s.pidCounter++));
    for (let i = 0; i < 2; i++) s.enemies.push(mkEnemy(s.pidCounter++));
    for (let i = 0; i < 2; i++) s.items.push(mkItem(s.pidCounter++));
    s.gameOver = false; s.paused = false;
    setUiState({ hp: 100, coins: 0, score: 0, flying: false, immortal: false, speedBoost: false, gameOver: false, paused: false });
  }

  function togglePause() {
    const s = stateRef.current;
    s.paused = !s.paused;
    setUiState((u) => ({ ...u, paused: s.paused }));
  }

  function handleAdminLogin() {
    if (adminPass === ADMIN_PASSWORD) {
      setAdminUnlocked(true); setAdminError(false);
    } else {
      setAdminError(true);
    }
  }

  // ─── UI ───────────────────────────────────────────────────────────────────
  const hpPct = (uiState.hp / 100) * 100;
  const hpColor = hpPct > 50 ? "#00FF88" : hpPct > 25 ? "#FFE600" : "#FF0080";

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-4 pb-8 px-2" style={{ background: "#080808" }}>
      {/* Header */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-3 px-1">
        <a href="/" className="flex items-center gap-2 group">
          <span className="font-pixel text-xs" style={{ color: "#00FF88" }}>⛏</span>
          <span className="font-pixel text-xs hidden sm:block" style={{ color: "#555", fontSize: 9 }}>MC<span style={{ color: "#00FF88" }}>SERVERS</span></span>
        </a>
        <div className="font-pixel text-xs" style={{ color: "#FF0080", textShadow: "0 0 10px #FF0080", fontSize: 11 }}>🎮 ROBLOX STYLE</div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdmin(true)}
            className="font-pixel text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105"
            style={{ background: "#1a0a0a", color: "#FF0080", border: "1px solid #FF008033", fontSize: 9 }}
          >
            👑 ADMIN
          </button>
          <button
            onClick={() => setShowCheats(!showCheats)}
            className="font-pixel text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105"
            style={{ background: "#0a1a0a", color: "#00FF88", border: "1px solid #00FF8833", fontSize: 9 }}
          >
            ⚡ ЧИТЫ
          </button>
        </div>
      </div>

      {/* Game + Cheats side by side */}
      <div className="flex gap-4 w-full max-w-5xl">

        {/* Canvas + HUD */}
        <div className="flex flex-col" style={{ flex: "0 0 auto" }}>
          {/* HUD */}
          <div className="flex items-center gap-4 mb-2 px-1 flex-wrap">
            {/* HP */}
            <div className="flex items-center gap-2 min-w-[140px]">
              <span className="text-xs font-bold" style={{ color: "#FF0080" }}>❤️</span>
              <div className="flex-1 rounded-full" style={{ height: 8, background: "#222", minWidth: 80 }}>
                <div className="rounded-full transition-all" style={{ width: `${hpPct}%`, height: 8, background: hpColor, boxShadow: `0 0 8px ${hpColor}` }} />
              </div>
              <span className="text-xs font-bold" style={{ color: hpColor }}>{uiState.hp}</span>
            </div>
            {/* Coins */}
            <div className="flex items-center gap-1">
              <span style={{ color: "#FFE600", fontSize: 14 }}>💰</span>
              <span className="font-pixel text-xs" style={{ color: "#FFE600", fontSize: 11 }}>{uiState.coins}</span>
            </div>
            {/* Score */}
            <div className="flex items-center gap-1">
              <span style={{ color: "#00CFFF", fontSize: 14 }}>⭐</span>
              <span className="font-pixel text-xs" style={{ color: "#00CFFF", fontSize: 11 }}>{uiState.score}</span>
            </div>
            {/* Status icons */}
            <div className="flex gap-2 ml-auto">
              {uiState.flying   && <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#00CFFF22", color: "#00CFFF", border: "1px solid #00CFFF44" }}>✈ Полёт</span>}
              {uiState.immortal && <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#FFE60022", color: "#FFE600", border: "1px solid #FFE60044" }}>⭐ Бессмертие</span>}
              {uiState.speedBoost && <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#FF008022", color: "#FF0080", border: "1px solid #FF008044" }}>⚡ Скорость</span>}
              <button onClick={togglePause} className="text-xs px-2 py-0.5 rounded transition-all" style={{ background: "#111", color: "#555", border: "1px solid #222" }}>
                {uiState.paused ? "▶" : "⏸"}
              </button>
              <button onClick={restart} className="text-xs px-2 py-0.5 rounded transition-all" style={{ background: "#111", color: "#555", border: "1px solid #222" }}>↺</button>
            </div>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={W} height={H}
            className="rounded-xl"
            style={{ border: "1px solid #1a1a1a", display: "block", maxWidth: "100%" }}
          />

          {/* Controls hint */}
          <div className="flex gap-4 mt-2 justify-center flex-wrap">
            {[["← →", "Движение"], ["↑ / W", "Прыжок"], ["↑↓", "Полёт (читы)"], ["ESC", "Пауза"], ["R", "Рестарт"]].map(([k, v]) => (
              <div key={k} className="flex items-center gap-1">
                <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: "#111", color: "#555", border: "1px solid #222" }}>{k}</span>
                <span className="text-xs" style={{ color: "#333" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cheat panel */}
        {showCheats && (
          <div className="flex flex-col gap-2 animate-fade-in-up" style={{ width: 200, flexShrink: 0 }}>
            <div className="font-pixel text-xs mb-1" style={{ color: "#00FF88", fontSize: 9 }}>⚡ ЧИТЫ</div>

            {[
              { label: "💊 Полное HP",      action: cheatFullHp,           color: "#00FF88" },
              { label: "✈ Полёт",           action: cheatFly,              color: "#00CFFF", active: uiState.flying },
              { label: "⭐ Бессмертие",     action: cheatImmortal,         color: "#FFE600", active: uiState.immortal },
              { label: "⚡ Скорость x3",    action: cheatSpeed,            color: "#FF0080", active: uiState.speedBoost },
              { label: "📍 Телепорт",       action: cheatTeleport,         color: "#00CFFF" },
              { label: "💰 +1000 монет",    action: () => cheatMoney(1000),color: "#FFE600" },
              { label: "💰 +10000 монет",   action: () => cheatMoney(10000),color: "#FFE600" },
              { label: "💀 Убить всех",     action: cheatKillAll,          color: "#FF0080" },
              { label: "👿 +3 врага",       action: () => cheatSpawnEnemy(3), color: "#FF0080" },
              { label: "🛡️ Спавн: щит",    action: () => cheatSpawnItem("shield"), color: "#00CFFF" },
              { label: "💣 Спавн: бомба",   action: () => cheatSpawnItem("bomb"),   color: "#FF0080" },
              { label: "⭐ Спавн: звезда",  action: () => cheatSpawnItem("star"),   color: "#FFE600" },
            ].map((ch) => (
              <button
                key={ch.label}
                onClick={ch.action}
                className="text-xs px-3 py-2 rounded-lg text-left transition-all hover:scale-[1.03] active:scale-95 font-medium"
                style={{
                  background: ch.active ? `${ch.color}22` : "#111",
                  color: ch.active ? ch.color : "#888",
                  border: `1px solid ${ch.active ? ch.color + "55" : "#1a1a1a"}`,
                  boxShadow: ch.active ? `0 0 8px ${ch.color}44` : "none",
                }}
              >
                {ch.label}
                {ch.active !== undefined && (
                  <span className="ml-1 text-xs opacity-60">{ch.active ? "ВКЛ" : "ВЫКЛ"}</span>
                )}
              </button>
            ))}

            {/* Log */}
            <div className="mt-2 rounded-lg p-2 flex flex-col gap-1" style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", maxHeight: 160, overflowY: "auto" }}>
              <div className="font-pixel text-xs mb-1" style={{ color: "#333", fontSize: 8 }}>ЛОГ ЧИТОВ</div>
              {cheatLog.length === 0 && <div className="text-xs" style={{ color: "#333" }}>Пусто</div>}
              {cheatLog.map((l, i) => (
                <div key={i} className="text-xs" style={{ color: "#555", fontSize: 10 }}>{l}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
