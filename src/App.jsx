import { useState, useEffect } from "react";

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  bg:        "#12141c",
  surface:   "#1c1f2e",
  card:      "#22253a",
  border:    "#2e3250",
  green:     "#2dff7e",
  greenDim:  "#1ab856",
  purple:    "#c44eff",
  purpleDim: "#8b2dcc",
  text:      "#f0f2ff",
  muted:     "#7a80a0",
  dim:       "#3a3f5c",
  red:       "#ff4d6a",
  gold:      "#ffd166",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INIT_BETS = [
  {
    id: 1, desc: "Will Trump visit Berlin before end of 2025?",
    creator: "Whale_DGN", side: "YES", opponent: "CryptoFox",
    amount: 1000, status: "pending_claim", time: "2h ago",
    claimedBy: "Whale_DGN", claimedSide: "YES",
    proofUrl: "https://reuters.com/trump-berlin",
    proofNote: "Reuters confirms Trump landed in Berlin Dec 12.",
  },
  {
    id: 2, desc: "Will Bitcoin hit $150k before ETH hits $10k?",
    creator: "CryptoKing", side: "YES", opponent: null,
    amount: 500, status: "open", time: "5h ago",
    claimedBy: null, proofUrl: null,
  },
  {
    id: 3, desc: "Will Partizan win the Serbian championship 2025/26?",
    creator: "NightBet", side: "NO", opponent: "SolanaFox",
    amount: 100, status: "active", time: "1d ago",
    claimedBy: null, proofUrl: null,
  },
  {
    id: 4, desc: "Will Elon Musk leave Twitter/X CEO role in 2025?",
    creator: "DegenMaster", side: "YES", opponent: "MoonRider",
    amount: 500, status: "pending_claim", time: "3h ago",
    claimedBy: "MoonRider", claimedSide: "NO",
    proofUrl: "https://techcrunch.com/elon-ceo",
    proofNote: "TechCrunch confirms Elon remains CEO as of Dec 2025.",
  },
];

const LB_STREAK = [
  { rank: 1, name: "Whale_DGN",  streak: 12, tokens: 8400,  avatar: "🐋" },
  { rank: 2, name: "CryptoKing", streak: 9,  tokens: 5200,  avatar: "👑" },
  { rank: 3, name: "NightBet",   streak: 7,  tokens: 3100,  avatar: "🦊" },
  { rank: 4, name: "SolanaFox",  streak: 5,  tokens: 2600,  avatar: "⚡" },
  { rank: 5, name: "DegenMstr",  streak: 4,  tokens: 1900,  avatar: "🎯" },
];

const LB_WHALE = [
  { rank: 1, name: "Whale_DGN",  tokens: 84000, avatar: "🐋" },
  { rank: 2, name: "BigMoney",   tokens: 61000, avatar: "💰" },
  { rank: 3, name: "CryptoKing", tokens: 52000, avatar: "👑" },
  { rank: 4, name: "NightBet",   tokens: 31000, avatar: "🦊" },
  { rank: 5, name: "SolanaFox",  tokens: 28000, avatar: "⚡" },
];

const AMOUNTS = [100, 500, 1000];

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <polygon points="50,4 92,27 92,73 50,96 8,73 8,27" fill={T.purple} opacity="0.1" />
      <polygon points="50,4 92,27 92,73 50,96 8,73 8,27" fill="none" stroke={T.purple} strokeWidth="3" />
      <ellipse cx="50" cy="44" rx="26" ry="24" fill={T.green} opacity="0.12" />
      <ellipse cx="50" cy="44" rx="26" ry="24" fill="none" stroke={T.green} strokeWidth="2.5" />
      <circle cx="40" cy="42" r="7" fill={T.green} />
      <circle cx="60" cy="42" r="7" fill={T.green} />
      <circle cx="40" cy="42" r="3" fill={T.bg} />
      <circle cx="60" cy="42" r="3" fill={T.bg} />
      <path d="M33 60 Q50 68 67 60" stroke={T.green} strokeWidth="2" fill="none" />
      <rect x="38" y="62" width="7"  height="10" rx="2" fill={T.green} />
      <rect x="47" y="62" width="6"  height="10" rx="2" fill={T.green} />
      <rect x="55" y="62" width="7"  height="10" rx="2" fill={T.green} />
      <circle cx="78" cy="22" r="11" fill={T.purple} />
      <text x="78" y="27" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Arial">7</text>
    </svg>
  );
}

// ─── Status Pill ──────────────────────────────────────────────────────────────
function Pill({ status }) {
  const map = {
    open:          { label: "Open",          bg: "rgba(45,255,126,0.12)",  color: T.green  },
    active:        { label: "Active",        bg: "rgba(255,209,102,0.12)", color: T.gold   },
    pending_claim: { label: "Claim Pending", bg: "rgba(196,78,255,0.12)",  color: T.purple },
    resolved:      { label: "Resolved",      bg: "rgba(122,128,160,0.1)",  color: T.muted  },
    draw:          { label: "Draw",          bg: "rgba(122,128,160,0.1)",  color: T.muted  },
  };
  const s = map[status] || map.open;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: s.bg, color: s.color,
      border: `1px solid ${s.color}33`,
      padding: "3px 9px", borderRadius: "20px",
      fontSize: "0.68rem", fontWeight: 600, whiteSpace: "nowrap",
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

// ─── Ticker ───────────────────────────────────────────────────────────────────
function Ticker() {
  const items = [
    "🔥 BTC $150k bet — 1000 $FREE",
    "⚡ New: Trump Berlin visit bet",
    "🏆 CryptoKing on 9-win streak",
    "💰 500 $FREE claimed by NightBet",
    "🎯 Partizan championship — place your bet",
  ];
  return (
    <div style={{ background: T.purple, padding: "5px 0", overflow: "hidden" }}>
      <div style={{
        display: "flex", gap: "48px", whiteSpace: "nowrap",
        animation: "ticker 22s linear infinite",
        color: "white", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.03em",
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ display: "flex", gap: "48px", flexShrink: 0 }}>
            {items.map((t, j) => <span key={j}>{t}</span>)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ tab, setTab }) {
  const tabs = [
    { id: "bet",   icon: "＋", label: "New Bet"   },
    { id: "live",  icon: "🔴", label: "Live Bets" },
    { id: "board", icon: "🏆", label: "Rankings"  },
    { id: "admin", icon: "⚙",  label: "Admin"     },
  ];
  return (
    <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Logo size={40} />
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: T.text, letterSpacing: "-0.02em", lineHeight: 1 }}>
              FREEDOM <span style={{ color: T.purple }}>BETS</span>
            </div>
            <div style={{ fontSize: "0.6rem", color: T.muted, letterSpacing: "0.07em", fontWeight: 500, marginTop: "2px" }}>
              DEGENSAFE.FUN · POWERED BY $FREE
            </div>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "rgba(255,77,106,0.1)", border: `1px solid ${T.red}44`,
          borderRadius: "20px", padding: "5px 10px",
        }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: T.red, animation: "pulse 1.5s infinite", flexShrink: 0 }} />
          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: T.red }}>LIVE</span>
          <span style={{ fontSize: "0.68rem", color: T.muted, fontWeight: 600 }}>3 bets</span>
        </div>
      </div>
      <div style={{ display: "flex", padding: "0 12px" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "10px 6px 12px",
            background: "transparent", border: "none",
            borderBottom: tab === t.id ? `2px solid ${T.green}` : "2px solid transparent",
            color: tab === t.id ? T.green : T.muted,
            fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.02em",
            cursor: "pointer", transition: "all 0.2s",
          }}>
            <div style={{ marginBottom: "2px" }}>{t.icon}</div>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar() {
  return (
    <div style={{ display: "flex", gap: "1px", background: T.border }}>
      {[
        { label: "Total Bets",  value: "247",          icon: "🎯" },
        { label: "Prize Pool",  value: "42,000 $FREE", icon: "💰" },
        { label: "Resolved",    value: "189",          icon: "✅" },
      ].map(s => (
        <div key={s.label} style={{ flex: 1, background: T.surface, padding: "10px 12px", textAlign: "center" }}>
          <div style={{ fontSize: "0.62rem", color: T.muted, marginBottom: "2px" }}>{s.icon} {s.label}</div>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: T.text }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Shared: Section header — defined OUTSIDE any component (fixes re-mount bug) ──
function SectionHeader({ title, count }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
      <div style={{ fontSize: "0.85rem", fontWeight: 800, color: T.text }}>{title}</div>
      {count > 0 && (
        <span style={{ background: T.purple, color: "white", fontSize: "0.62rem", fontWeight: 700, padding: "2px 8px", borderRadius: "20px" }}>
          {count}
        </span>
      )}
    </div>
  );
}

// ─── Place Bet ────────────────────────────────────────────────────────────────
function BetForm() {
  const [desc, setDesc]     = useState("");
  const [amount, setAmount] = useState(500);
  const [side, setSide]     = useState("YES");
  const [done, setDone]     = useState(false);

  const handleSubmit = () => {
    if (!desc.trim()) return;
    setDone(true);
    setTimeout(() => { setDone(false); setDesc(""); }, 3000);
  };

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: T.text }}>Place a Bet</div>
        <div style={{ fontSize: "0.75rem", color: T.muted, marginTop: "2px" }}>Bet on any real-world outcome using $FREE tokens</div>
      </div>

      {/* Description card */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "12px", overflow: "hidden", marginBottom: "12px" }}>
        <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📝</span>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: T.text }}>Bet Description</span>
        </div>
        <div style={{ padding: "14px" }}>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value.slice(0, 200))}
            placeholder='e.g. "Will Trump visit Berlin before end of 2025?"'
            rows={3}
            style={{
              width: "100%", background: T.surface,
              border: `1px solid ${T.border}`, borderRadius: "8px",
              color: T.text, fontSize: "0.88rem",
              padding: "11px 12px", resize: "none", outline: "none",
              boxSizing: "border-box", lineHeight: 1.6, fontFamily: "inherit",
              transition: "border-color 0.2s",
            }}
            onFocus={e => { e.target.style.borderColor = T.green; }}
            onBlur={e => { e.target.style.borderColor = T.border; }}
          />
          <div style={{
            marginTop: "8px", padding: "10px 12px",
            background: "rgba(255,209,102,0.06)",
            border: "1px solid rgba(255,209,102,0.2)",
            borderRadius: "8px", display: "flex", gap: "8px",
          }}>
            <span style={{ flexShrink: 0 }}>⚠️</span>
            <div style={{ fontSize: "0.75rem", color: "#c8a84a", lineHeight: 1.55 }}>
              Bet must have a <strong>clear, verifiable YES/NO outcome.</strong> Ambiguous bets that reach arbitration will be declared a{" "}
              <span style={{ color: T.red, fontWeight: 700 }}>DRAW</span> and tokens returned to both players.
            </div>
          </div>
        </div>
      </div>

      {/* Stake card */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "12px", overflow: "hidden", marginBottom: "12px" }}>
        <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: "8px" }}>
          <span>💎</span>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: T.text }}>Stake Amount</span>
        </div>
        <div style={{ padding: "14px", display: "flex", gap: "8px" }}>
          {AMOUNTS.map(a => (
            <button key={a} onClick={() => setAmount(a)} style={{
              flex: 1, padding: "14px 0",
              background: amount === a ? "rgba(45,255,126,0.1)" : T.surface,
              border: `2px solid ${amount === a ? T.green : T.border}`,
              borderRadius: "10px",
              color: amount === a ? T.green : T.muted,
              fontSize: "1.05rem", fontWeight: 800,
              cursor: "pointer", transition: "all 0.18s",
            }}>
              {a.toLocaleString()}
              <div style={{ fontSize: "0.58rem", fontWeight: 600, marginTop: "2px", opacity: 0.7 }}>$FREE</div>
            </button>
          ))}
        </div>
      </div>

      {/* Side card */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "12px", overflow: "hidden", marginBottom: "12px" }}>
        <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: "8px" }}>
          <span>⚔️</span>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: T.text }}>Your Prediction</span>
        </div>
        <div style={{ padding: "14px", display: "flex", gap: "10px" }}>
          {[
            { v: "YES", label: "YES", sub: "I think it will happen",     color: T.green, bg: "rgba(45,255,126,0.08)",  icon: "✅" },
            { v: "NO",  label: "NO",  sub: "I think it won't happen",    color: T.red,   bg: "rgba(255,77,106,0.08)",  icon: "❌" },
          ].map(s => (
            <button key={s.v} onClick={() => setSide(s.v)} style={{
              flex: 1, padding: "14px 10px",
              background: side === s.v ? s.bg : T.surface,
              border: `2px solid ${side === s.v ? s.color : T.border}`,
              borderRadius: "10px", textAlign: "left",
              cursor: "pointer", transition: "all 0.18s",
            }}>
              <div style={{ fontSize: "1.4rem", marginBottom: "4px" }}>{s.icon}</div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: side === s.v ? s.color : T.muted }}>{s.label}</div>
              <div style={{ fontSize: "0.65rem", color: T.muted, marginTop: "2px" }}>{s.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "14px", marginBottom: "14px" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: T.muted, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Bet Summary</div>
        {[
          ["Your stake",       `${amount.toLocaleString()} $FREE`,        T.text  ],
          ["Potential return", `${(amount * 1.9).toLocaleString()} $FREE`, T.green ],
          ["Platform fee",     "5%",                                        T.muted ],
          ["Net profit",       `+${(amount * 0.9).toLocaleString()} $FREE`, T.green],
        ].map(([k, v, c]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: "0.78rem", color: T.muted }}>{k}</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: c }}>{v}</span>
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} style={{
        width: "100%", padding: "16px",
        background: done ? T.greenDim : `linear-gradient(135deg, ${T.purple}, ${T.purpleDim})`,
        border: "none", borderRadius: "12px",
        color: "white", fontSize: "1rem", fontWeight: 800,
        letterSpacing: "0.02em", cursor: "pointer", transition: "all 0.3s",
        boxShadow: done ? `0 4px 20px ${T.green}44` : `0 4px 20px ${T.purple}44`,
      }}>
        {done ? "✅  Bet Placed Successfully!" : `Lock ${amount.toLocaleString()} $FREE · Predict ${side}`}
      </button>
      <div style={{ textAlign: "center", marginTop: "8px", fontSize: "0.68rem", color: T.dim }}>
        🔐 Signed via Phantom Wallet · Solana blockchain
      </div>
    </div>
  );
}

// ─── Bet Card ─────────────────────────────────────────────────────────────────
function BetCard({ bet, onClaim }) {
  const sideColor = bet.side === "YES" ? T.green : T.red;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "12px", overflow: "hidden" }}>
      <div style={{ height: "3px", background: bet.side === "YES" ? `linear-gradient(90deg,${T.green},${T.greenDim})` : `linear-gradient(90deg,${T.red},#cc2244)` }} />
      <div style={{ padding: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", gap: "10px" }}>
          <div style={{ fontSize: "0.88rem", fontWeight: 600, color: T.text, lineHeight: 1.5, flex: 1 }}>{bet.desc}</div>
          <Pill status={bet.status} />
        </div>
        <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
          {[
            { icon: "👤", label: bet.creator },
            { icon: "🎯", label: bet.side, color: sideColor },
            { icon: "💰", label: `${bet.amount.toLocaleString()} $FREE`, color: T.gold },
            { icon: "⏱",  label: bet.time },
          ].map((m, i) => (
            <span key={i} style={{
              display: "flex", alignItems: "center", gap: "4px",
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: "6px", padding: "4px 8px",
              fontSize: "0.7rem", color: m.color || T.muted, fontWeight: 600,
            }}>
              {m.icon} {m.label}
            </span>
          ))}
        </div>
        {bet.status === "open" && (
          <button style={{
            width: "100%", padding: "10px",
            background: `linear-gradient(135deg,${T.green},${T.greenDim})`,
            border: "none", borderRadius: "8px",
            color: "#0a1a0a", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer",
          }}>Accept Bet →</button>
        )}
        {bet.status === "active" && onClaim && (
          <button onClick={onClaim} style={{
            width: "100%", padding: "10px",
            background: `linear-gradient(135deg,${T.purple},${T.purpleDim})`,
            border: "none", borderRadius: "8px",
            color: "white", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer",
          }}>🏆 Claim Victory</button>
        )}
        {bet.status === "pending_claim" && bet.claimedBy && (
          <div style={{ padding: "9px 12px", background: `rgba(196,78,255,0.08)`, border: `1px solid ${T.purple}44`, borderRadius: "8px" }}>
            <span style={{ fontSize: "0.73rem", color: T.purple, fontWeight: 600 }}>
              ⏳ <strong>{bet.claimedBy}</strong> claimed {bet.claimedSide} win · Awaiting admin review
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Live Bets ────────────────────────────────────────────────────────────────
function LiveBets({ bets, setBets }) {
  const [claimId, setClaimId]     = useState(null);
  const [proofUrl, setProofUrl]   = useState("");
  const [proofNote, setProofNote] = useState("");
  const [claimSide, setClaimSide] = useState("YES");
  const [sent, setSent]           = useState(false);

  const open   = bets.filter(b => b.status === "open");
  const active = bets.filter(b => ["active", "pending_claim"].includes(b.status));

  const handleSubmitClaim = (betId) => {
    if (!proofUrl.trim()) return;
    setBets(prev => prev.map(b =>
      b.id === betId
        ? { ...b, status: "pending_claim", claimedBy: "You", claimedSide: claimSide, proofUrl, proofNote }
        : b
    ));
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setClaimId(null);
      setProofUrl("");
      setProofNote("");
    }, 2600);
  };

  return (
    <div style={{ padding: "16px" }}>

      {/* Open bets */}
      <div style={{ marginBottom: "20px" }}>
        <SectionHeader title="Open — Waiting for Opponent" count={open.length} />
        {open.length === 0
          ? <div style={{ textAlign: "center", padding: "24px", background: T.card, border: `1px solid ${T.border}`, borderRadius: "12px", color: T.muted, fontSize: "0.82rem" }}>No open bets right now.</div>
          : <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{open.map(b => <BetCard key={b.id} bet={b} />)}</div>
        }
      </div>

      {/* Active + pending claims */}
      <div style={{ marginBottom: "20px" }}>
        <SectionHeader title="Active & Pending Claims" count={active.length} />
        {active.length === 0
          ? <div style={{ textAlign: "center", padding: "24px", background: T.card, border: `1px solid ${T.border}`, borderRadius: "12px", color: T.muted, fontSize: "0.82rem" }}>No active bets.</div>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {active.map(b => (
                <div key={b.id}>
                  <BetCard
                    bet={b}
                    onClaim={b.status === "active"
                      ? () => { setClaimId(b.id); setProofUrl(""); setProofNote(""); setSent(false); }
                      : null}
                  />

                  {/* Claim Victory drawer */}
                  {claimId === b.id && (
                    <div style={{
                      background: T.card,
                      border: `1px solid ${T.purple}55`,
                      borderTop: `3px solid ${T.purple}`,
                      borderRadius: "0 0 12px 12px",
                      padding: "16px",
                      marginTop: "-2px",
                    }}>
                      <div style={{ fontSize: "0.95rem", fontWeight: 800, color: T.text, marginBottom: "14px" }}>🏆 Claim Victory</div>

                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>I Won On Side</div>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                        {["YES", "NO"].map(s => (
                          <button key={s} onClick={() => setClaimSide(s)} style={{
                            flex: 1, padding: "11px",
                            background: claimSide === s ? (s === "YES" ? "rgba(45,255,126,0.1)" : "rgba(255,77,106,0.1)") : T.surface,
                            border: `2px solid ${claimSide === s ? (s === "YES" ? T.green : T.red) : T.border}`,
                            borderRadius: "8px",
                            color: claimSide === s ? (s === "YES" ? T.green : T.red) : T.muted,
                            fontSize: "0.95rem", fontWeight: 800, cursor: "pointer",
                          }}>
                            {s === "YES" ? "✅ YES" : "❌ NO"}
                          </button>
                        ))}
                      </div>

                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Proof Link *</div>
                      <input
                        value={proofUrl}
                        onChange={e => setProofUrl(e.target.value)}
                        placeholder="https://reuters.com/article-confirming-outcome"
                        style={{
                          width: "100%", padding: "11px 12px", marginBottom: "10px",
                          background: T.surface, border: `1px solid ${proofUrl ? T.green : T.border}`,
                          borderRadius: "8px", color: T.text, fontSize: "0.82rem",
                          outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                          transition: "border-color 0.2s",
                        }}
                        onFocus={e => { e.target.style.borderColor = T.green; }}
                        onBlur={e => { e.target.style.borderColor = proofUrl ? T.green : T.border; }}
                      />

                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Explanation (optional)</div>
                      <textarea
                        value={proofNote}
                        onChange={e => setProofNote(e.target.value.slice(0, 300))}
                        placeholder="Briefly explain what the link proves..."
                        rows={2}
                        style={{
                          width: "100%", padding: "11px 12px", marginBottom: "12px",
                          background: T.surface, border: `1px solid ${T.border}`,
                          borderRadius: "8px", color: T.text, fontSize: "0.82rem",
                          outline: "none", resize: "none", boxSizing: "border-box",
                          lineHeight: 1.5, fontFamily: "inherit",
                        }}
                        onFocus={e => { e.target.style.borderColor = T.green; }}
                        onBlur={e => { e.target.style.borderColor = T.border; }}
                      />

                      <div style={{
                        padding: "10px 12px", marginBottom: "14px",
                        background: "rgba(45,255,126,0.04)",
                        border: `1px solid ${T.green}22`,
                        borderLeft: `3px solid ${T.green}55`,
                        borderRadius: "8px",
                      }}>
                        <div style={{ fontSize: "0.73rem", color: T.muted, lineHeight: 1.65 }}>
                          Your claim will be reviewed by admin. Opponent has{" "}
                          <strong style={{ color: T.text }}>24 hours</strong> to counter-claim.
                          Admin resolves within <strong style={{ color: T.text }}>48 hours</strong>.
                          Ambiguous claims may result in a{" "}
                          <span style={{ color: T.red, fontWeight: 700 }}>DRAW</span>.
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => setClaimId(null)} style={{
                          padding: "11px 16px", background: "transparent",
                          border: `1px solid ${T.border}`, borderRadius: "8px",
                          color: T.muted, fontSize: "0.8rem", fontWeight: 700, cursor: "pointer",
                        }}>Cancel</button>
                        <button onClick={() => handleSubmitClaim(b.id)} style={{
                          flex: 1, padding: "11px",
                          background: sent ? T.greenDim : proofUrl ? `linear-gradient(135deg,${T.purple},${T.purpleDim})` : T.dim,
                          border: "none", borderRadius: "8px",
                          color: "white", fontSize: "0.85rem", fontWeight: 800,
                          cursor: proofUrl ? "pointer" : "not-allowed",
                          transition: "all 0.3s",
                        }}>
                          {sent ? "✅ Submitted to Admin!" : "Submit Claim →"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
function Leaderboard() {
  const [tab, setTab] = useState("streak");
  const data = tab === "streak" ? LB_STREAK : LB_WHALE;
  const podiumOrder = [data[1], data[0], data[2]]; // 2nd, 1st, 3rd
  const podiumHeights = [80, 100, 65];
  const podiumColors  = [T.muted, T.gold, "#cd7f32"];
  const podiumLabels  = ["2nd", "1st", "3rd"];

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: T.text }}>Leaderboard</div>
        <div style={{ fontSize: "0.75rem", color: T.muted, marginTop: "2px" }}>Top performers in the Freedom Betting Arena</div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", background: T.card, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "4px", marginBottom: "16px" }}>
        {[
          { id: "streak", label: "🔥 Win Streak" },
          { id: "whale",  label: "🐋 Token Whale" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "9px 8px",
            background: tab === t.id ? `linear-gradient(135deg,${T.purple},${T.purpleDim})` : "transparent",
            border: "none", borderRadius: "7px",
            color: tab === t.id ? "white" : T.muted,
            fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Podium */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", alignItems: "flex-end" }}>
        {podiumOrder.map((e, i) => {
          if (!e) return <div key={i} style={{ flex: 1 }} />;
          return (
            <div key={e.rank} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", marginBottom: "4px" }}>{e.avatar}</div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: T.text, marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {e.name}
              </div>
              <div style={{
                height: `${podiumHeights[i]}px`,
                background: `linear-gradient(180deg,${podiumColors[i]}22,${podiumColors[i]}0a)`,
                border: `1px solid ${podiumColors[i]}44`,
                borderRadius: "8px 8px 0 0",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", gap: "2px",
              }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, color: podiumColors[i] }}>{podiumLabels[i]}</div>
                <div style={{ fontSize: "0.6rem", color: T.muted }}>
                  {tab === "streak" ? `${e.streak} wins` : `${(e.tokens / 1000).toFixed(0)}k`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full list */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "12px", overflow: "hidden" }}>
        {data.map((e, i) => (
          <div key={e.rank} style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "13px 14px",
            borderBottom: i < data.length - 1 ? `1px solid ${T.border}` : "none",
            background: i === 0 ? "rgba(255,209,102,0.04)" : "transparent",
          }}>
            <div style={{ width: "28px", textAlign: "center", fontSize: i === 0 ? "1.3rem" : "0.82rem", color: ["#ffd700", "#c0c0c0", "#cd7f32", T.muted, T.muted][i] }}>
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${e.rank}`}
            </div>
            <div style={{ fontSize: "1.3rem" }}>{e.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: i === 0 ? T.gold : T.text }}>{e.name}</div>
              {tab === "streak" && (
                <div style={{ fontSize: "0.65rem", color: T.muted }}>{e.tokens.toLocaleString()} tokens won total</div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              {tab === "streak"
                ? <>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: T.red }}>🔥 {e.streak}</div>
                    <div style={{ fontSize: "0.6rem", color: T.muted }}>WIN STREAK</div>
                  </>
                : <>
                    <div style={{ fontSize: "0.9rem", fontWeight: 800, color: T.gold }}>{e.tokens.toLocaleString()}</div>
                    <div style={{ fontSize: "0.6rem", color: T.muted }}>$FREE WON</div>
                  </>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
function PlayerSide({ name, side, amount }) {
  const color = side === "YES" ? T.green : T.red;
  return (
    <div style={{ flex: 1, background: T.surface, border: `1px solid ${color}44`, borderRadius: "8px", padding: "10px", textAlign: "center" }}>
      <div style={{ fontSize: "0.72rem", color: T.muted, marginBottom: "3px" }}>{name}</div>
      <div style={{ fontSize: "1rem", fontWeight: 800, color }}>{side}</div>
      <div style={{ fontSize: "0.65rem", color: T.gold, marginTop: "2px" }}>{amount.toLocaleString()} $FREE</div>
    </div>
  );
}

function AdminPanel({ bets, setBets }) {
  const [pin, setPin]         = useState("");
  const [ok, setOk]           = useState(false);
  const [err, setErr]         = useState(false);
  const [verdict, setVerdict] = useState({});
  const [confirmed, setConf]  = useState({});

  const pending  = bets.filter(b => b.status === "pending_claim");
  const resolved = bets.filter(b => ["resolved", "draw"].includes(b.status));

  const handleUnlock = () => {
    if (pin === "1234") { setOk(true); setErr(false); }
    else { setErr(true); setPin(""); }
  };

  const handleResolve = (betId) => {
    const v = verdict[betId];
    if (!v) return;
    setBets(prev => prev.map(b =>
      b.id === betId
        ? { ...b, status: v === "DRAW" ? "draw" : "resolved", winner: v === "DRAW" ? null : v }
        : b
    ));
    setConf(prev => ({ ...prev, [betId]: v }));
  };

  if (!ok) {
    return (
      <div style={{ padding: "52px 24px", textAlign: "center" }}>
        <Logo size={58} />
        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: T.text, marginTop: "14px" }}>Admin Panel</div>
        <div style={{ fontSize: "0.78rem", color: T.muted, marginBottom: "28px", marginTop: "4px" }}>Enter your PIN to access the admin panel</div>
        <input
          type="password"
          value={pin}
          onChange={e => { setPin(e.target.value); setErr(false); }}
          onKeyDown={e => e.key === "Enter" && handleUnlock()}
          placeholder="••••"
          style={{
            width: "160px", padding: "14px", display: "block", margin: "0 auto 10px",
            background: T.card, border: `2px solid ${err ? T.red : T.border}`,
            borderRadius: "10px", color: T.text,
            fontSize: "1.5rem", textAlign: "center", letterSpacing: "0.4em",
            outline: "none", fontFamily: "inherit", transition: "border-color 0.2s",
          }}
        />
        {err && <div style={{ fontSize: "0.78rem", color: T.red, fontWeight: 600, marginBottom: "12px" }}>❌ Incorrect PIN</div>}
        <button onClick={handleUnlock} style={{
          padding: "13px 36px",
          background: `linear-gradient(135deg,${T.purple},${T.purpleDim})`,
          border: "none", borderRadius: "10px", color: "white",
          fontSize: "0.95rem", fontWeight: 800, cursor: "pointer",
          boxShadow: `0 4px 16px ${T.purple}44`,
        }}>Unlock Admin →</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: T.text }}>Claim Review</div>
          <div style={{ fontSize: "0.73rem", color: T.muted, marginTop: "2px" }}>Review player claims and declare results</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(45,255,126,0.08)", border: `1px solid ${T.green}33`, borderRadius: "20px", padding: "5px 10px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: T.green, animation: "pulse 1.5s infinite", flexShrink: 0 }} />
          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: T.green }}>ADMIN</span>
        </div>
      </div>

      {pending.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px", background: T.card, border: `1px solid ${T.border}`, borderRadius: "12px", color: T.muted, marginBottom: "16px" }}>
          ✅ No pending claims to review
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {pending.map(bet => {
          const isDone = !!confirmed[bet.id];
          return (
            <div key={bet.id} style={{
              background: T.card,
              border: `1px solid ${isDone ? T.border : T.purple + "55"}`,
              borderTop: `3px solid ${isDone ? T.border : T.purple}`,
              borderRadius: "12px", overflow: "hidden",
              opacity: isDone ? 0.5 : 1, transition: "opacity 0.4s",
            }}>
              <div style={{ padding: "14px" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, color: T.text, lineHeight: 1.5, marginBottom: "12px" }}>
                  {bet.desc}
                </div>

                {/* VS row */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
                  <PlayerSide name={bet.creator}         side={bet.side}                          amount={bet.amount} />
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: T.dim }}>VS</div>
                  <PlayerSide name={bet.opponent || "???"} side={bet.side === "YES" ? "NO" : "YES"} amount={bet.amount} />
                </div>

                {/* Claim details */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.purple}`, borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: T.text }}>
                      Claim by <span style={{ color: T.purple }}>{bet.claimedBy}</span>
                      {" "}— claims <span style={{ color: bet.claimedSide === "YES" ? T.green : T.red, fontWeight: 800 }}>{bet.claimedSide}</span> wins
                    </span>
                  </div>

                  <div style={{ fontSize: "0.68rem", fontWeight: 600, color: T.muted, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    🔗 Proof Link — Tap to Verify:
                  </div>
                  <a href={bet.proofUrl} target="_blank" rel="noreferrer" style={{
                    display: "block", padding: "9px 11px",
                    background: T.card, border: "1px solid rgba(79,195,247,0.3)",
                    borderRadius: "6px", color: "#4fc3f7",
                    fontSize: "0.75rem", textDecoration: "none",
                    wordBreak: "break-all", lineHeight: 1.45, marginBottom: "8px", fontWeight: 500,
                  }}>
                    🌐 {bet.proofUrl}
                  </a>

                  {bet.proofNote && (
                    <div style={{ fontSize: "0.75rem", color: T.muted, fontStyle: "italic", lineHeight: 1.5, padding: "8px 10px", background: T.card, borderRadius: "6px" }}>
                      "{bet.proofNote}"
                    </div>
                  )}
                </div>

                {/* Verdict or result */}
                {!isDone ? (
                  <>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Your Verdict</div>
                    <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                      {[
                        { v: "YES",  label: "YES Wins", icon: "✅", color: T.green,  bg: "rgba(45,255,126,0.08)"  },
                        { v: "NO",   label: "NO Wins",  icon: "❌", color: T.red,    bg: "rgba(255,77,106,0.08)"  },
                        { v: "DRAW", label: "Draw",     icon: "🤝", color: T.muted,  bg: "rgba(122,128,160,0.08)" },
                      ].map(opt => (
                        <button key={opt.v}
                          onClick={() => setVerdict(prev => ({ ...prev, [bet.id]: opt.v }))}
                          style={{
                            flex: 1, padding: "10px 4px",
                            background: verdict[bet.id] === opt.v ? opt.bg : T.surface,
                            border: `2px solid ${verdict[bet.id] === opt.v ? opt.color : T.border}`,
                            borderRadius: "8px",
                            color: verdict[bet.id] === opt.v ? opt.color : T.muted,
                            fontSize: "0.7rem", fontWeight: 700,
                            cursor: "pointer", transition: "all 0.18s",
                          }}>
                          <div style={{ fontSize: "1.1rem", marginBottom: "3px" }}>{opt.icon}</div>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handleResolve(bet.id)}
                      disabled={!verdict[bet.id]}
                      style={{
                        width: "100%", padding: "14px",
                        background: verdict[bet.id] ? `linear-gradient(135deg,${T.purple},${T.purpleDim})` : T.dim,
                        border: "none", borderRadius: "10px",
                        color: verdict[bet.id] ? "white" : T.muted,
                        fontSize: "0.9rem", fontWeight: 800,
                        cursor: verdict[bet.id] ? "pointer" : "not-allowed",
                        transition: "all 0.2s",
                        boxShadow: verdict[bet.id] ? `0 4px 16px ${T.purple}44` : "none",
                      }}>
                      {verdict[bet.id]
                        ? `⚡ Confirm — ${verdict[bet.id] === "DRAW" ? "Declare Draw" : `${verdict[bet.id]} Wins · Release Funds`}`
                        : "Select a verdict first"}
                    </button>
                  </>
                ) : (
                  <div style={{
                    padding: "14px", textAlign: "center",
                    background: confirmed[bet.id] === "DRAW"
                      ? "rgba(122,128,160,0.08)"
                      : confirmed[bet.id] === "YES"
                        ? "rgba(45,255,126,0.08)"
                        : "rgba(255,77,106,0.08)",
                    border: `1px solid ${confirmed[bet.id] === "DRAW" ? T.muted : confirmed[bet.id] === "YES" ? T.green : T.red}44`,
                    borderRadius: "10px",
                    color: confirmed[bet.id] === "DRAW" ? T.muted : confirmed[bet.id] === "YES" ? T.green : T.red,
                    fontSize: "0.88rem", fontWeight: 700,
                  }}>
                    {confirmed[bet.id] === "DRAW"
                      ? "🤝 Draw Declared — Tokens Returned"
                      : `✅ ${confirmed[bet.id]} Wins — Funds Released`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {resolved.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 800, color: T.text, marginBottom: "10px" }}>Resolved History</div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "12px", overflow: "hidden" }}>
            {resolved.map((b, i) => (
              <div key={b.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "11px 14px",
                borderBottom: i < resolved.length - 1 ? `1px solid ${T.border}` : "none",
              }}>
                <div style={{ fontSize: "0.8rem", color: T.muted, flex: 1, marginRight: "10px", lineHeight: 1.45 }}>{b.desc}</div>
                <Pill status={b.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "24px", textAlign: "center", paddingBottom: "8px" }}>
        <div style={{ fontSize: "0.6rem", color: T.dim, letterSpacing: "0.1em" }}>DEGENSAFE.FUN · PROJECT FREEDOM · @DGNPROJECT</div>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]   = useState("bet");
  const [bets, setBets] = useState(INIT_BETS);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
      *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: ${T.bg}; font-family: 'Outfit', sans-serif; }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: ${T.bg}; }
      ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
      @keyframes ticker {
        from { transform: translateX(0); }
        to   { transform: translateX(-33.33%); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%      { opacity: 0.5; transform: scale(0.85); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, maxWidth: "430px", margin: "0 auto", fontFamily: "'Outfit', sans-serif" }}>
      <Ticker />
      <Header tab={tab} setTab={setTab} />
      <StatsBar />
      <div style={{ paddingBottom: "24px" }}>
        {tab === "bet"   && <BetForm />}
        {tab === "live"  && <LiveBets bets={bets} setBets={setBets} />}
        {tab === "board" && <Leaderboard />}
        {tab === "admin" && <AdminPanel bets={bets} setBets={setBets} />}
      </div>
    </div>
  );
}
