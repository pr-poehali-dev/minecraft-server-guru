import { useState, useMemo } from "react";
import Icon from "@/components/ui/icon";

const SERVERS = [
  {
    id: 1,
    name: "HypixelRU",
    ip: "hypixelru.net",
    description: "Крупнейший русский сервер с мини-играми — BedWars, SkyWars, Murder Mystery и более 20 режимов!",
    mode: "Мини-игры",
    version: "1.8–1.20",
    online: 14823,
    maxOnline: 20000,
    rating: 4.9,
    votes: 12450,
    tags: ["BedWars", "SkyWars", "PvP"],
    color: "#00FF88",
    rank: 1,
    verified: true,
  },
  {
    id: 2,
    name: "CraftRealms",
    ip: "craftrealms.ru",
    description: "Сурвайвал с экономикой, приватами и дружным сообществом. Без доната — честная игра!",
    mode: "Выживание",
    version: "1.20.4",
    online: 8912,
    maxOnline: 12000,
    rating: 4.8,
    votes: 9870,
    tags: ["Выживание", "Экономика", "Приваты"],
    color: "#00CFFF",
    rank: 2,
    verified: true,
  },
  {
    id: 3,
    name: "SkyBlock Empire",
    ip: "skyblock.empire.ru",
    description: "Уникальный SkyBlock с кастомными предметами, боссами и рейдами. Стань королём островов!",
    mode: "SkyBlock",
    version: "1.19–1.20",
    online: 6234,
    maxOnline: 8000,
    rating: 4.7,
    votes: 7320,
    tags: ["SkyBlock", "Боссы", "Рейды"],
    color: "#FFE600",
    rank: 3,
    verified: true,
  },
  {
    id: 4,
    name: "AnarchyZone",
    ip: "anarchy.zone",
    description: "Классическая анархия. Никаких правил, никаких банов. Выживи если сможешь.",
    mode: "Анархия",
    version: "1.20",
    online: 4102,
    maxOnline: 5000,
    rating: 4.5,
    votes: 5100,
    tags: ["Анархия", "PvP", "Хардкор"],
    color: "#FF0080",
    rank: 4,
    verified: false,
  },
  {
    id: 5,
    name: "PixelWorld RPG",
    ip: "pixelworld.ru",
    description: "Полноценная RPG в Minecraft — классы, квесты, данжи и эпическое снаряжение!",
    mode: "RPG",
    version: "1.18–1.20",
    online: 3890,
    maxOnline: 6000,
    rating: 4.6,
    votes: 4500,
    tags: ["RPG", "Квесты", "Данжи"],
    color: "#A855F7",
    rank: 5,
    verified: true,
  },
  {
    id: 6,
    name: "BuildMaster Pro",
    ip: "buildmaster.pro",
    description: "Творческий сервер для строителей. Собственные участки, конкурсы и витрина лучших работ.",
    mode: "Творческий",
    version: "1.20.4",
    online: 2756,
    maxOnline: 4000,
    rating: 4.4,
    votes: 3200,
    tags: ["Творческий", "Строительство", "Конкурсы"],
    color: "#FF8C00",
    rank: 6,
    verified: true,
  },
  {
    id: 7,
    name: "FactionWars",
    ip: "factionwars.su",
    description: "Фракции, захват территорий, войны кланов. Стань лидером самой сильной фракции!",
    mode: "Фракции",
    version: "1.16–1.20",
    online: 2100,
    maxOnline: 3000,
    rating: 4.3,
    votes: 2800,
    tags: ["Фракции", "PvP", "Кланы"],
    color: "#FF0080",
    rank: 7,
    verified: false,
  },
  {
    id: 8,
    name: "MineCity Ultra",
    ip: "minecity.ultra",
    description: "Городской сервер с реальной экономикой, бизнесом, транспортом и выборами мэра.",
    mode: "Сити",
    version: "1.20",
    online: 1923,
    maxOnline: 3000,
    rating: 4.2,
    votes: 2100,
    tags: ["Сити", "Экономика", "Ролевые"],
    color: "#00CFFF",
    rank: 8,
    verified: true,
  },
];

const MODES = ["Все", "Мини-игры", "Выживание", "SkyBlock", "Анархия", "RPG", "Творческий", "Фракции", "Сити"];
const VERSIONS = ["Все версии", "1.8", "1.16", "1.18", "1.19", "1.20"];

const TABS = [
  { id: "home", label: "Главная", icon: "Home" },
  { id: "top", label: "Топ", icon: "Trophy" },
  { id: "rating", label: "Рейтинг", icon: "Star" },
  { id: "catalog", label: "Каталог", icon: "LayoutGrid" },
  { id: "add", label: "Добавить", icon: "PlusCircle" },
];

function formatOnline(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= Math.round(rating) ? "#FFE600" : "#333", fontSize: 12 }}>★</span>
      ))}
      <span className="text-xs ml-1" style={{ color: "#FFE600" }}>{rating.toFixed(1)}</span>
    </div>
  );
}

function OnlineBar({ online, max }: { online: number; max: number }) {
  const pct = Math.round((online / max) * 100);
  const color = pct > 70 ? "#FF0080" : pct > 40 ? "#FFE600" : "#00FF88";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: "#666" }}>
        <span style={{ color }}>● {formatOnline(online)} онлайн</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full rounded-full" style={{ height: 4, background: "#222" }}>
        <div
          className="rounded-full transition-all"
          style={{ width: `${pct}%`, height: 4, background: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
    </div>
  );
}

function ServerCard({ server, index, compact = false }: { server: typeof SERVERS[0]; index: number; compact?: boolean }) {
  const rankColors = ["#FFE600", "#C0C0C0", "#CD7F32"];
  const rankColor = rankColors[index] || server.color;
  const [copied, setCopied] = useState(false);

  function copyIp() {
    navigator.clipboard.writeText(server.ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="server-card rounded-xl border p-5 flex flex-col gap-3 cursor-pointer animate-fade-in-up"
      style={{
        background: "linear-gradient(135deg, #111 0%, #0d0d0d 100%)",
        borderColor: "#1a1a1a",
        animationDelay: `${index * 0.07}s`,
        animationFillMode: "both",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = server.color;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${server.color}33, 0 8px 32px rgba(0,0,0,0.5)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#1a1a1a";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="font-pixel text-xs flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ width: 36, height: 36, background: "#0a0a0a", color: rankColor, border: `1px solid ${rankColor}33`, fontSize: 10 }}
          >
            #{server.rank}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base" style={{ color: "#F0F0F0" }}>{server.name}</span>
              {server.verified && <span style={{ color: server.color, fontSize: 14 }}>✓</span>}
            </div>
            <div className="text-xs font-mono mt-0.5" style={{ color: "#444" }}>{server.ip}</div>
          </div>
        </div>
        <div
          className="text-xs px-2 py-1 rounded-md font-semibold flex-shrink-0"
          style={{ background: `${server.color}18`, color: server.color, border: `1px solid ${server.color}33` }}
        >
          {server.mode}
        </div>
      </div>

      {!compact && (
        <p className="text-sm leading-relaxed" style={{ color: "#888" }}>{server.description}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {server.tags.map((tag) => (
          <span key={tag} className="tag" style={{ background: "#1a1a1a", color: "#666", border: "1px solid #222" }}>
            {tag}
          </span>
        ))}
        <span className="tag" style={{ background: "#1a1a1a", color: "#555", border: "1px solid #222" }}>
          {server.version}
        </span>
      </div>

      <OnlineBar online={server.online} max={server.maxOnline} />

      <div className="flex items-center justify-between pt-1">
        <StarRating rating={server.rating} />
        <div className="flex items-center gap-1 text-xs" style={{ color: "#555" }}>
          <Icon name="ThumbsUp" size={12} />
          <span>{server.votes.toLocaleString()}</span>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); copyIp(); }}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95"
        style={{
          background: copied ? `${server.color}22` : "#0a0a0a",
          color: copied ? server.color : "#555",
          border: `1px solid ${copied ? server.color + "66" : "#222"}`,
          boxShadow: copied ? `0 0 12px ${server.color}44` : "none",
        }}
      >
        <Icon name={copied ? "Check" : "Copy"} size={13} />
        {copied ? "Скопировано!" : server.ip}
      </button>
    </div>
  );
}

function AddServerSection() {
  const [form, setForm] = useState({ name: "", ip: "", mode: "", version: "", description: "", discord: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in-up">
        <div className="text-6xl mb-6 animate-float">🎉</div>
        <div className="font-pixel text-sm mb-3" style={{ color: "#00FF88", textShadow: "0 0 20px #00FF88" }}>ЗАЯВКА ОТПРАВЛЕНА!</div>
        <p className="text-sm text-center max-w-sm" style={{ color: "#666" }}>
          Мы рассмотрим твою заявку и добавим сервер в каталог в течение 24 часов.
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name: "", ip: "", mode: "", version: "", description: "", discord: "" }); }}
          className="mt-8 font-pixel text-xs px-6 py-3 rounded-xl transition-all hover:scale-105"
          style={{ background: "#111", color: "#00FF88", border: "1px solid #00FF8833" }}
        >
          ← ПОДАТЬ ЕЩЁ ЗАЯВКУ
        </button>
      </div>
    );
  }

  const inputStyle = {
    background: "#111",
    border: "1px solid #222",
    color: "#F0F0F0",
    outline: "none",
    fontFamily: "Rubik, sans-serif",
    borderRadius: 10,
    padding: "10px 14px",
    width: "100%",
    fontSize: 14,
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <span className="font-pixel text-xs" style={{ color: "#00FF88", textShadow: "0 0 10px #00FF88" }}>➕ ДОБАВИТЬ СЕРВЕР</span>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #00FF8833, transparent)" }} />
      </div>

      {/* Banner */}
      <div className="rounded-2xl p-6 mb-8 text-center" style={{ background: "linear-gradient(135deg, #0d1a0f, #0a0a0a)", border: "1px solid #00FF8822" }}>
        <div className="font-pixel text-xs mb-2" style={{ color: "#00FF88" }}>🚀 РАЗМЕСТИ СВОЙ СЕРВЕР БЕСПЛАТНО</div>
        <p className="text-sm" style={{ color: "#666" }}>Тысячи игроков ищут серверы прямо сейчас. Попади в каталог и увеличь онлайн!</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-xl mx-auto">
        {/* Name */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: "#555" }}>НАЗВАНИЕ СЕРВЕРА *</label>
          <input
            required
            placeholder="Например: MyCraft"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = "#00FF88"; e.target.style.boxShadow = "0 0 12px rgba(0,255,136,0.2)"; }}
            onBlur={(e) => { e.target.style.borderColor = "#222"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        {/* IP */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: "#555" }}>IP АДРЕС СЕРВЕРА *</label>
          <input
            required
            placeholder="play.mycraft.ru"
            value={form.ip}
            onChange={(e) => setForm({ ...form, ip: e.target.value })}
            style={{ ...inputStyle, fontFamily: "monospace" }}
            onFocus={(e) => { e.target.style.borderColor = "#00FF88"; e.target.style.boxShadow = "0 0 12px rgba(0,255,136,0.2)"; }}
            onBlur={(e) => { e.target.style.borderColor = "#222"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        {/* Mode + Version */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#555" }}>РЕЖИМ ИГРЫ *</label>
            <select
              required
              value={form.mode}
              onChange={(e) => setForm({ ...form, mode: e.target.value })}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={(e) => { e.target.style.borderColor = "#00FF88"; }}
              onBlur={(e) => { e.target.style.borderColor = "#222"; }}
            >
              <option value="" style={{ background: "#111" }}>Выбрать...</option>
              {MODES.slice(1).map((m) => <option key={m} value={m} style={{ background: "#111" }}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#555" }}>ВЕРСИЯ</label>
            <input
              placeholder="1.20.4"
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "#00FF88"; e.target.style.boxShadow = "0 0 12px rgba(0,255,136,0.2)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#222"; e.target.style.boxShadow = "none"; }}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: "#555" }}>ОПИСАНИЕ *</label>
          <textarea
            required
            rows={3}
            placeholder="Расскажи об особенностях сервера — режимы, фишки, атмосфера..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{ ...inputStyle, resize: "vertical" }}
            onFocus={(e) => { e.target.style.borderColor = "#00FF88"; e.target.style.boxShadow = "0 0 12px rgba(0,255,136,0.2)"; }}
            onBlur={(e) => { e.target.style.borderColor = "#222"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        {/* Discord */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: "#555" }}>DISCORD / КОНТАКТ</label>
          <input
            placeholder="discord.gg/myserver"
            value={form.discord}
            onChange={(e) => setForm({ ...form, discord: e.target.value })}
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = "#00CFFF"; e.target.style.boxShadow = "0 0 12px rgba(0,207,255,0.2)"; }}
            onBlur={(e) => { e.target.style.borderColor = "#222"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        <button
          type="submit"
          className="font-pixel text-xs py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-95 mt-2"
          style={{ background: "linear-gradient(135deg, #00FF88, #00CFFF)", color: "#080808", boxShadow: "0 0 24px rgba(0,255,136,0.3)" }}
        >
          ▶ ОТПРАВИТЬ ЗАЯВКУ
        </button>
      </form>
    </div>
  );
}

function HeroSection({ onExplore }: { onExplore: () => void }) {
  const totalOnline = SERVERS.reduce((s, r) => s + r.online, 0);

  return (
    <div
      className="hero-grid relative overflow-hidden rounded-2xl p-8 md:p-14 mb-10 text-center"
      style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #0d0d0d 100%)", border: "1px solid #1a1a1a" }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full animate-float"
          style={{ width: 300, height: 300, background: "radial-gradient(circle, rgba(0,255,136,0.08) 0%, transparent 70%)", top: -100, left: -100 }}
        />
        <div
          className="absolute rounded-full animate-float"
          style={{ width: 250, height: 250, background: "radial-gradient(circle, rgba(255,0,128,0.08) 0%, transparent 70%)", bottom: -80, right: -80, animationDelay: "1.5s" }}
        />
      </div>

      <div className="relative z-10">
        <div className="font-pixel text-xs mb-4 animate-fade-in-up" style={{ color: "#00FF88", letterSpacing: "0.2em" }}>
          ⚡ MINECRAFT SERVERS
        </div>
        <h1
          className="font-pixel leading-tight mb-4 animate-fade-in-up delay-100"
          style={{ fontSize: "clamp(18px, 4vw, 36px)", lineHeight: 1.4 }}
        >
          <span className="gradient-text">НАЙДИ СВОЙ</span>
          <br />
          <span style={{ color: "#F0F0F0" }}>СЕРВЕР</span>
          <br />
          <span style={{ color: "#00FF88", textShadow: "0 0 20px #00FF88" }}>ПО ВКУСУ</span>
        </h1>
        <p className="text-base mb-8 animate-fade-in-up delay-200 max-w-lg mx-auto" style={{ color: "#666" }}>
          Лучшие Minecraft серверы для игры на ПК — рейтинг, отзывы, онлайн в реальном времени
        </p>

        <div className="flex justify-center gap-8 mb-8 animate-fade-in-up delay-300">
          {[
            { label: "Серверов", value: SERVERS.length, color: "#00FF88" },
            { label: "Игроков онлайн", value: formatOnline(totalOnline), color: "#00CFFF" },
            { label: "Голосов", value: "44k+", color: "#FF0080" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-pixel text-xl font-bold" style={{ color: s.color, textShadow: `0 0 10px ${s.color}` }}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: "#555" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={onExplore}
          className="font-pixel text-xs px-8 py-4 rounded-xl transition-all hover:scale-105 active:scale-95 animate-fade-in-up delay-400"
          style={{ background: "linear-gradient(135deg, #00FF88, #00CFFF)", color: "#080808", boxShadow: "0 0 24px rgba(0,255,136,0.4)" }}
        >
          ▶ СМОТРЕТЬ СЕРВЕРЫ
        </button>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange, mode, onMode, version, onVersion }: {
  value: string; onChange: (v: string) => void;
  mode: string; onMode: (v: string) => void;
  version: string; onVersion: (v: string) => void;
}) {
  return (
    <div className="mb-8 flex flex-col gap-3">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#00FF88" }}>
          <Icon name="Search" size={18} />
        </div>
        <input
          type="text"
          placeholder="Поиск сервера по названию или IP..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="neon-input w-full rounded-xl pl-11 pr-4 py-3.5 text-sm transition-all"
          style={{ background: "#111", border: "1px solid #222", color: "#F0F0F0", outline: "none", fontFamily: "Rubik, sans-serif" }}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-60"
            style={{ color: "#666" }}
          >
            <Icon name="X" size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => onMode(m)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all font-medium"
              style={{
                background: mode === m ? "#00FF88" : "#111",
                color: mode === m ? "#080808" : "#666",
                border: `1px solid ${mode === m ? "#00FF88" : "#222"}`,
                boxShadow: mode === m ? "0 0 10px rgba(0,255,136,0.3)" : "none",
              }}
            >
              {m}
            </button>
          ))}
        </div>
        <select
          value={version}
          onChange={(e) => onVersion(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer"
          style={{ background: "#111", color: "#666", border: "1px solid #222", outline: "none", fontFamily: "Rubik, sans-serif" }}
        >
          {VERSIONS.map((v) => (
            <option key={v} value={v} style={{ background: "#111" }}>{v}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TopSection({ servers }: { servers: typeof SERVERS }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="font-pixel text-xs" style={{ color: "#FFE600", textShadow: "0 0 10px #FFE600" }}>🏆 ТОП СЕРВЕРОВ</span>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #FFE60033, transparent)" }} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servers.slice(0, 3).map((s, i) => (
          <div key={s.id} className="relative">
            {i === 0 && (
              <div
                className="absolute -top-2 -right-2 z-10 font-pixel text-xs px-2 py-1 rounded-lg"
                style={{ background: "#FFE600", color: "#080808" }}
              >
                👑 #1
              </div>
            )}
            <ServerCard server={s} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RatingSection({ servers }: { servers: typeof SERVERS }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="font-pixel text-xs" style={{ color: "#00CFFF", textShadow: "0 0 10px #00CFFF" }}>⭐ РЕЙТИНГ</span>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #00CFFF33, transparent)" }} />
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1a1a1a" }}>
        {servers.map((s, i) => (
          <div
            key={s.id}
            className="flex items-center gap-4 px-4 py-3 transition-all cursor-pointer animate-fade-in-up"
            style={{
              background: i % 2 === 0 ? "#0d0d0d" : "#111",
              borderBottom: i < servers.length - 1 ? "1px solid #1a1a1a" : "none",
              animationDelay: `${i * 0.05}s`,
              animationFillMode: "both",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#151515"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "#0d0d0d" : "#111"; }}
          >
            <div
              className="font-pixel text-xs w-8 text-center flex-shrink-0"
              style={{ color: i < 3 ? (["#FFE600","#C0C0C0","#CD7F32"][i]) : "#444" }}
            >
              #{s.rank}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm truncate" style={{ color: "#F0F0F0" }}>{s.name}</span>
                {s.verified && <span style={{ color: s.color, fontSize: 12 }}>✓</span>}
              </div>
              <div className="text-xs" style={{ color: "#444" }}>{s.mode}</div>
            </div>
            <div className="text-sm font-bold hidden sm:block" style={{ color: "#00FF88", minWidth: 60, textAlign: "right" }}>
              {formatOnline(s.online)}
            </div>
            <div className="hidden md:flex items-center gap-1 min-w-[90px]">
              <StarRating rating={s.rating} />
            </div>
            <div className="text-xs flex-shrink-0" style={{ color: "#555" }}>
              {s.votes.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CatalogSection({ servers, search, onSearch, mode, onMode, version, onVersion }: {
  servers: typeof SERVERS;
  search: string; onSearch: (v: string) => void;
  mode: string; onMode: (v: string) => void;
  version: string; onVersion: (v: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="font-pixel text-xs" style={{ color: "#FF0080", textShadow: "0 0 10px #FF0080" }}>📦 КАТАЛОГ</span>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #FF008033, transparent)" }} />
        <span className="text-xs" style={{ color: "#444" }}>{servers.length} серверов</span>
      </div>
      <SearchBar value={search} onChange={onSearch} mode={mode} onMode={onMode} version={version} onVersion={onVersion} />
      {servers.length === 0 ? (
        <div className="text-center py-16 animate-fade-in-up">
          <div className="font-pixel text-4xl mb-4">🔍</div>
          <div className="font-pixel text-xs" style={{ color: "#444" }}>Серверы не найдены</div>
          <div className="text-sm mt-2" style={{ color: "#333" }}>Попробуй другой запрос</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servers.map((s, i) => (
            <ServerCard key={s.id} server={s} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Index() {
  const [tab, setTab] = useState("home");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("Все");
  const [version, setVersion] = useState("Все версии");

  const filtered = useMemo(() => {
    return SERVERS.filter((s) => {
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.ip.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase());
      const matchMode = mode === "Все" || s.mode === mode;
      const matchVersion = version === "Все версии" || s.version.includes(version);
      return matchSearch && matchMode && matchVersion;
    });
  }, [search, mode, version]);

  const sortedByRating = useMemo(() => [...SERVERS].sort((a, b) => b.rating - a.rating || b.votes - a.votes), []);

  return (
    <div className="min-h-screen scanlines" style={{ background: "#080808" }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{ background: "rgba(8,8,8,0.9)", borderBottom: "1px solid #1a1a1a" }}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <button onClick={() => setTab("home")} className="flex items-center gap-2">
              <span className="font-pixel text-xs" style={{ color: "#00FF88", textShadow: "0 0 10px #00FF88" }}>⛏</span>
              <span className="font-pixel hidden sm:block" style={{ color: "#F0F0F0", fontSize: 10 }}>
                MC<span style={{ color: "#00FF88" }}>SERVERS</span>
              </span>
            </button>

            <div className="flex items-center gap-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    color: tab === t.id ? "#00FF88" : "#555",
                    background: tab === t.id ? "rgba(0,255,136,0.08)" : "transparent",
                    textShadow: tab === t.id ? "0 0 8px #00FF88" : "none",
                  }}
                >
                  <Icon name={t.icon} size={14} />
                  <span className="hidden sm:block">{t.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setTab("catalog")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all"
              style={{ color: "#444", border: "1px solid #1a1a1a", background: "#111" }}
            >
              <Icon name="Search" size={14} />
              <span className="hidden sm:block" style={{ color: "#333" }}>Поиск</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {tab === "home" && (
          <>
            <HeroSection onExplore={() => setTab("catalog")} />
            <TopSection servers={SERVERS} />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-10">
              {[
                { icon: "Server", label: "Серверов", val: String(SERVERS.length), color: "#00FF88" },
                { icon: "Users", label: "Онлайн сейчас", val: formatOnline(SERVERS.reduce((s, r) => s + r.online, 0)), color: "#00CFFF" },
                { icon: "Star", label: "Средний рейтинг", val: "4.6", color: "#FFE600" },
                { icon: "ThumbsUp", label: "Всего голосов", val: "44k+", color: "#FF0080" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4 text-center animate-fade-in-up"
                  style={{ background: "#111", border: "1px solid #1a1a1a", animationDelay: `${i * 0.1}s`, animationFillMode: "both" }}
                >
                  <div className="flex justify-center mb-2" style={{ color: stat.color }}>
                    <Icon name={stat.icon} size={20} />
                  </div>
                  <div className="font-pixel text-sm font-bold" style={{ color: stat.color, textShadow: `0 0 10px ${stat.color}` }}>{stat.val}</div>
                  <div className="text-xs mt-1" style={{ color: "#444" }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-6">
              <span className="font-pixel text-xs" style={{ color: "#A855F7", textShadow: "0 0 10px #A855F7" }}>🎮 ВСЕ СЕРВЕРЫ</span>
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #A855F733, transparent)" }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SERVERS.slice(3, 7).map((s, i) => <ServerCard key={s.id} server={s} index={i + 3} />)}
            </div>
            <div className="flex justify-center gap-4 mt-6 flex-wrap">
              <button
                onClick={() => setTab("catalog")}
                className="font-pixel text-xs px-6 py-3 rounded-xl transition-all hover:scale-105"
                style={{ background: "#111", color: "#00FF88", border: "1px solid #00FF8833" }}
              >
                ПОКАЗАТЬ ВСЕ СЕРВЕРЫ →
              </button>
              <button
                onClick={() => setTab("add")}
                className="font-pixel text-xs px-6 py-3 rounded-xl transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #00FF8822, #00CFFF11)", color: "#00FF88", border: "1px solid #00FF8833" }}
              >
                ➕ ДОБАВИТЬ СЕРВЕР
              </button>
            </div>
          </>
        )}

        {tab === "top" && <TopSection servers={SERVERS} />}
        {tab === "rating" && <RatingSection servers={sortedByRating} />}
        {tab === "catalog" && (
          <CatalogSection
            servers={filtered}
            search={search} onSearch={setSearch}
            mode={mode} onMode={setMode}
            version={version} onVersion={setVersion}
          />
        )}
        {tab === "add" && <AddServerSection />}
      </main>

      {/* Game promo banner */}
      <div className="max-w-5xl mx-auto px-4 mb-4">
        <div className="rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: "linear-gradient(135deg, #0a0a1a, #1a0a1a)", border: "1px solid #FF008033" }}>
          <div>
            <div className="font-pixel text-xs mb-1" style={{ color: "#FF0080", fontSize: 10 }}>🎮 МИНИ-ИГРА</div>
            <div className="text-sm font-semibold" style={{ color: "#F0F0F0" }}>Roblox-style игра с читами</div>
            <div className="text-xs mt-0.5" style={{ color: "#555" }}>Телепорт, полёт, бессмертие, бесконечные монеты</div>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <a href="/game" className="font-pixel text-xs px-5 py-2.5 rounded-xl transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #FF0080, #FF4080)", color: "#fff", boxShadow: "0 0 16px rgba(255,0,128,0.3)", fontSize: 9 }}>
              ▶ ИГРАТЬ
            </a>
            <a href="/admin" className="font-pixel text-xs px-5 py-2.5 rounded-xl transition-all hover:scale-105"
              style={{ background: "#1a0a0a", color: "#FF0080", border: "1px solid #FF008033", fontSize: 9 }}>
              👑 АДМИНКА
            </a>
          </div>
        </div>
      </div>

      <footer className="text-center py-8 mt-2" style={{ borderTop: "1px solid #1a1a1a" }}>
        <div className="font-pixel text-xs mb-2" style={{ color: "#222" }}>⛏ MCSERVERS</div>
        <div className="text-xs" style={{ color: "#333" }}>Лучший каталог Minecraft серверов для ПК</div>
      </footer>
    </div>
  );
}