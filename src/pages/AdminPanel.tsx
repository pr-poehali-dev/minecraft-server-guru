import { useState } from "react";
import Icon from "@/components/ui/icon";

const ADMIN_PASSWORD = "admin123";

const FAKE_PLAYERS = [
  { id: 1, name: "ProGamer_X",    score: 9840,  coins: 3200, deaths: 2,  cheats: false, online: true,  joined: "5 мин назад" },
  { id: 2, name: "SkyBlock_King", score: 7210,  coins: 1850, deaths: 5,  cheats: false, online: true,  joined: "12 мин назад" },
  { id: 3, name: "NoobSlayer",    score: 5400,  coins: 800,  deaths: 14, cheats: true,  online: true,  joined: "23 мин назад" },
  { id: 4, name: "CraftMaster",   score: 4120,  coins: 600,  deaths: 8,  cheats: false, online: false, joined: "1 час назад" },
  { id: 5, name: "DarkSword99",   score: 3890,  coins: 430,  deaths: 21, cheats: true,  online: false, joined: "2 часа назад" },
  { id: 6, name: "PixelHero",     score: 2100,  coins: 200,  deaths: 30, cheats: false, online: false, joined: "5 часов назад" },
];

const GAME_SETTINGS_DEFAULT = {
  enemySpeed: 1.2,
  coinsPerMap: 6,
  playerMaxHp: 100,
  enemyDamage: 10,
  spawnRate: 300,
};

export default function AdminPanel() {
  const [unlocked, setUnlocked] = useState(false);
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [players, setPlayers] = useState(FAKE_PLAYERS);
  const [settings, setSettings] = useState(GAME_SETTINGS_DEFAULT);
  const [saved, setSaved] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [sentAnnouncement, setSentAnnouncement] = useState<string | null>(null);
  const [bannedIds, setBannedIds] = useState<number[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  function login() {
    if (pass === ADMIN_PASSWORD) { setUnlocked(true); setError(false); }
    else { setError(true); }
  }

  function notify(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  }

  function banPlayer(id: number) {
    setBannedIds((p) => [...p, id]);
    setPlayers((p) => p.map((pl) => pl.id === id ? { ...pl, online: false } : pl));
    notify("Игрок заблокирован");
  }

  function giveCoins(id: number, amount: number) {
    setPlayers((p) => p.map((pl) => pl.id === id ? { ...pl, coins: pl.coins + amount } : pl));
    notify(`+${amount} монет выдано`);
  }

  function resetScore(id: number) {
    setPlayers((p) => p.map((pl) => pl.id === id ? { ...pl, score: 0, coins: 0 } : pl));
    notify("Счёт сброшен");
  }

  function saveSettings() {
    setSaved(true);
    notify("Настройки сохранены!");
    setTimeout(() => setSaved(false), 2000);
  }

  function sendAnnouncement() {
    if (!announcement.trim()) return;
    setSentAnnouncement(announcement);
    setAnnouncement("");
    notify("Объявление отправлено всем игрокам!");
  }

  const onlinePlayers = players.filter((p) => p.online && !bannedIds.includes(p.id));
  const totalCoins = players.reduce((s, p) => s + p.coins, 0);
  const cheatersCount = players.filter((p) => p.cheats).length;

  const inputCls = {
    background: "#111", border: "1px solid #222", color: "#F0F0F0",
    outline: "none", borderRadius: 8, padding: "8px 12px",
    width: "100%", fontSize: 13, fontFamily: "Rubik, sans-serif",
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="rounded-2xl p-8 text-center" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
            <div className="text-5xl mb-4">👑</div>
            <div className="font-pixel text-xs mb-2" style={{ color: "#FF0080", textShadow: "0 0 10px #FF0080" }}>ADMIN PANEL</div>
            <p className="text-sm mb-6" style={{ color: "#555" }}>Введи пароль для входа</p>

            <input
              type="password"
              placeholder="Пароль..."
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              style={{ ...inputCls, marginBottom: 12, textAlign: "center", letterSpacing: "0.2em" }}
              onFocus={(e) => { e.target.style.borderColor = "#FF0080"; e.target.style.boxShadow = "0 0 12px rgba(255,0,128,0.2)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#222"; e.target.style.boxShadow = "none"; }}
            />

            {error && (
              <div className="text-xs mb-3 animate-fade-in-up" style={{ color: "#FF0080" }}>
                ❌ Неверный пароль
              </div>
            )}

            <button
              onClick={login}
              className="w-full font-pixel text-xs py-3 rounded-xl transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #FF0080, #FF4080)", color: "#fff", boxShadow: "0 0 20px rgba(255,0,128,0.3)", fontSize: 10 }}
            >
              ВОЙТИ
            </button>

            <div className="mt-4 text-xs" style={{ color: "#333" }}>Подсказка: admin123</div>

            <a href="/game" className="block mt-6 text-xs" style={{ color: "#444" }}>← Вернуться в игру</a>
          </div>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: "dashboard", label: "Дашборд",    icon: "LayoutDashboard" },
    { id: "players",   label: "Игроки",      icon: "Users" },
    { id: "settings",  label: "Настройки",   icon: "Settings" },
    { id: "broadcast", label: "Объявления",  icon: "Megaphone" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#080808" }}>
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-xl text-sm font-semibold animate-fade-in-up"
          style={{ background: "#00FF8822", color: "#00FF88", border: "1px solid #00FF8844", boxShadow: "0 0 20px rgba(0,255,136,0.2)" }}>
          ✓ {notification}
        </div>
      )}

      {/* Nav */}
      <nav className="sticky top-0 z-40 backdrop-blur-md" style={{ background: "rgba(8,8,8,0.95)", borderBottom: "1px solid #1a1a1a" }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <span className="font-pixel text-xs" style={{ color: "#FF0080", textShadow: "0 0 10px #FF0080", fontSize: 10 }}>👑 ADMIN PANEL</span>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#00FF8822", color: "#00FF88", border: "1px solid #00FF8833" }}>● Онлайн</span>
            </div>
            <div className="flex items-center gap-1">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{ color: tab === t.id ? "#FF0080" : "#555", background: tab === t.id ? "rgba(255,0,128,0.08)" : "transparent" }}>
                  <Icon name={t.icon} size={13} />
                  <span className="hidden sm:block">{t.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <a href="/game" className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ color: "#444", border: "1px solid #1a1a1a", background: "#0d0d0d" }}>
                🎮 Игра
              </a>
              <button onClick={() => setUnlocked(false)} className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ color: "#FF0080", border: "1px solid #FF008033", background: "#1a0a0a" }}>
                Выйти
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div className="animate-fade-in-up">
            <div className="font-pixel text-xs mb-6" style={{ color: "#FF0080", fontSize: 10 }}>📊 ДАШБОРД</div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { icon: "Users",     label: "Онлайн",        val: onlinePlayers.length, color: "#00FF88" },
                { icon: "Coins",     label: "Монет в игре",  val: totalCoins.toLocaleString(), color: "#FFE600" },
                { icon: "Skull",     label: "Читеры",        val: cheatersCount, color: "#FF0080" },
                { icon: "Activity",  label: "Всего игроков", val: players.length, color: "#00CFFF" },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-4 text-center" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                  <div className="flex justify-center mb-2" style={{ color: s.color }}>
                    <Icon name={s.icon} size={22} />
                  </div>
                  <div className="font-pixel text-lg font-bold" style={{ color: s.color, textShadow: `0 0 10px ${s.color}` }}>{s.val}</div>
                  <div className="text-xs mt-1" style={{ color: "#444" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Top players */}
            <div className="font-pixel text-xs mb-4" style={{ color: "#555", fontSize: 9 }}>🏆 ТОП ИГРОКОВ</div>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1a1a1a" }}>
              {[...players].sort((a, b) => b.score - a.score).slice(0, 5).map((p, i) => (
                <div key={p.id} className="flex items-center gap-4 px-4 py-3" style={{ background: i % 2 === 0 ? "#0d0d0d" : "#111", borderBottom: "1px solid #1a1a1a" }}>
                  <div className="font-pixel text-xs w-6" style={{ color: i < 3 ? ["#FFE600","#C0C0C0","#CD7F32"][i] : "#444", fontSize: 9 }}>#{i + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: "#F0F0F0" }}>{p.name}</span>
                      {p.cheats && <span className="text-xs px-1 rounded" style={{ background: "#FF008022", color: "#FF0080" }}>чит</span>}
                      {bannedIds.includes(p.id) && <span className="text-xs px-1 rounded" style={{ background: "#33333322", color: "#555" }}>бан</span>}
                    </div>
                  </div>
                  <div className="font-pixel text-xs" style={{ color: "#00CFFF", fontSize: 10 }}>{p.score.toLocaleString()} очков</div>
                  <div className="text-xs" style={{ color: "#FFE600" }}>💰 {p.coins}</div>
                  <div className="flex items-center gap-1">
                    <div className="rounded-full" style={{ width: 8, height: 8, background: p.online && !bannedIds.includes(p.id) ? "#00FF88" : "#333", boxShadow: p.online && !bannedIds.includes(p.id) ? "0 0 6px #00FF88" : "none" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Sent announcement */}
            {sentAnnouncement && (
              <div className="mt-6 rounded-xl p-4" style={{ background: "#0a1a0a", border: "1px solid #00FF8833" }}>
                <div className="text-xs mb-1" style={{ color: "#555" }}>Последнее объявление:</div>
                <div className="text-sm" style={{ color: "#00FF88" }}>📢 {sentAnnouncement}</div>
              </div>
            )}
          </div>
        )}

        {/* PLAYERS */}
        {tab === "players" && (
          <div className="animate-fade-in-up">
            <div className="font-pixel text-xs mb-6" style={{ color: "#FF0080", fontSize: 10 }}>👥 УПРАВЛЕНИЕ ИГРОКАМИ</div>
            <div className="flex flex-col gap-3">
              {players.map((p) => {
                const isBanned = bannedIds.includes(p.id);
                return (
                  <div key={p.id} className="rounded-xl p-4" style={{ background: "#111", border: `1px solid ${p.cheats ? "#FF008033" : "#1a1a1a"}` }}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, background: p.online && !isBanned ? "#00FF88" : "#333", boxShadow: p.online && !isBanned ? "0 0 6px #00FF88" : "none" }} />
                          <span className="font-bold text-sm" style={{ color: isBanned ? "#444" : "#F0F0F0" }}>{p.name}</span>
                          {p.cheats && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#FF008022", color: "#FF0080", border: "1px solid #FF008044" }}>⚠ ЧИТЕР</span>}
                          {isBanned && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#22222222", color: "#555", border: "1px solid #333" }}>🔒 БАН</span>}
                        </div>
                        <div className="flex gap-4 text-xs flex-wrap" style={{ color: "#555" }}>
                          <span>⭐ {p.score.toLocaleString()}</span>
                          <span>💰 {p.coins}</span>
                          <span>💀 Смертей: {p.deaths}</span>
                          <span>🕐 {p.joined}</span>
                        </div>
                      </div>
                      {!isBanned && (
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => giveCoins(p.id, 500)} className="text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                            style={{ background: "#FFE60011", color: "#FFE600", border: "1px solid #FFE60033" }}>
                            💰 +500
                          </button>
                          <button onClick={() => resetScore(p.id)} className="text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                            style={{ background: "#00CFFF11", color: "#00CFFF", border: "1px solid #00CFFF33" }}>
                            ↺ Сброс
                          </button>
                          <button onClick={() => banPlayer(p.id)} className="text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                            style={{ background: "#FF008011", color: "#FF0080", border: "1px solid #FF008033" }}>
                            🔒 Бан
                          </button>
                        </div>
                      )}
                      {isBanned && (
                        <button onClick={() => setBannedIds((b) => b.filter((id) => id !== p.id))} className="text-xs px-3 py-1.5 rounded-lg transition-all"
                          style={{ background: "#111", color: "#555", border: "1px solid #222" }}>
                          Разбанить
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <div className="animate-fade-in-up max-w-lg">
            <div className="font-pixel text-xs mb-6" style={{ color: "#FF0080", fontSize: 10 }}>⚙️ НАСТРОЙКИ ИГРЫ</div>
            <div className="flex flex-col gap-5">
              {[
                { key: "enemySpeed",    label: "Скорость врагов",    min: 0.5,  max: 5,   step: 0.1 },
                { key: "coinsPerMap",   label: "Монет на карте",      min: 1,    max: 20,  step: 1 },
                { key: "playerMaxHp",  label: "Макс. HP игрока",     min: 50,   max: 500, step: 10 },
                { key: "enemyDamage",  label: "Урон врагов",         min: 1,    max: 50,  step: 1 },
                { key: "spawnRate",    label: "Спавн врагов (тики)", min: 100,  max: 600, step: 50 },
              ].map((field) => (
                <div key={field.key}>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-semibold" style={{ color: "#666" }}>{field.label}</label>
                    <span className="font-pixel text-xs" style={{ color: "#00FF88", fontSize: 10 }}>{settings[field.key as keyof typeof settings]}</span>
                  </div>
                  <input
                    type="range"
                    min={field.min} max={field.max} step={field.step}
                    value={settings[field.key as keyof typeof settings]}
                    onChange={(e) => setSettings((s) => ({ ...s, [field.key]: parseFloat(e.target.value) }))}
                    className="w-full"
                    style={{ accentColor: "#00FF88" }}
                  />
                  <div className="flex justify-between text-xs mt-1" style={{ color: "#333" }}>
                    <span>{field.min}</span><span>{field.max}</span>
                  </div>
                </div>
              ))}

              <button onClick={saveSettings} className="font-pixel text-xs py-3 rounded-xl transition-all hover:scale-105 mt-2"
                style={{ background: saved ? "#00FF8822" : "linear-gradient(135deg, #FF0080, #FF4080)", color: saved ? "#00FF88" : "#fff", border: saved ? "1px solid #00FF8844" : "none", fontSize: 10, boxShadow: "0 0 20px rgba(255,0,128,0.3)" }}>
                {saved ? "✓ СОХРАНЕНО!" : "СОХРАНИТЬ НАСТРОЙКИ"}
              </button>
            </div>
          </div>
        )}

        {/* BROADCAST */}
        {tab === "broadcast" && (
          <div className="animate-fade-in-up max-w-lg">
            <div className="font-pixel text-xs mb-6" style={{ color: "#FF0080", fontSize: 10 }}>📢 ОБЪЯВЛЕНИЯ</div>

            <div className="rounded-xl p-5 mb-6" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
              <label className="text-xs font-semibold mb-3 block" style={{ color: "#555" }}>СООБЩЕНИЕ ВСЕМ ИГРОКАМ</label>
              <textarea
                rows={4}
                placeholder="Введи объявление — например: Сервер уходит на обслуживание через 10 минут!"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                style={{ ...inputCls, resize: "vertical" }}
                onFocus={(e) => { e.target.style.borderColor = "#FF0080"; }}
                onBlur={(e) => { e.target.style.borderColor = "#222"; }}
              />
              <button onClick={sendAnnouncement} disabled={!announcement.trim()} className="mt-3 w-full font-pixel text-xs py-3 rounded-xl transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #FF0080, #FF4080)", color: "#fff", fontSize: 10, boxShadow: "0 0 20px rgba(255,0,128,0.3)" }}>
                📢 ОТПРАВИТЬ ВСЕМ
              </button>
            </div>

            {/* Quick messages */}
            <div className="font-pixel text-xs mb-3" style={{ color: "#555", fontSize: 9 }}>БЫСТРЫЕ СООБЩЕНИЯ</div>
            <div className="flex flex-col gap-2">
              {[
                "⚠️ Сервер уходит на обслуживание через 5 минут!",
                "🎉 Двойные монеты на следующий час!",
                "⚡ Началось событие — убивай боссов!",
                "🔧 Обновление установлено. Добро пожаловать!",
              ].map((msg) => (
                <button key={msg} onClick={() => { setAnnouncement(msg); }}
                  className="text-left text-sm px-4 py-3 rounded-xl transition-all hover:scale-[1.01]"
                  style={{ background: "#0d0d0d", color: "#888", border: "1px solid #1a1a1a" }}>
                  {msg}
                </button>
              ))}
            </div>

            {sentAnnouncement && (
              <div className="mt-6 rounded-xl p-4" style={{ background: "#0a1a0a", border: "1px solid #00FF8833" }}>
                <div className="text-xs mb-1" style={{ color: "#555" }}>Последнее отправленное:</div>
                <div className="text-sm" style={{ color: "#00FF88" }}>📢 {sentAnnouncement}</div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
