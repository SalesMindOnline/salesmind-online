import { useState } from "react";

const TOOLS = [
  { id: "pitch", label: "Pitch Simulator", icon: "🎯", desc: "Get grilled by a tough AI buyer" },
  { id: "deal", label: "Deal Review", icon: "🔍", desc: "Paste your deal notes, get coaching" },
  { id: "proposal", label: "Proposal Generator", icon: "📄", desc: "Generate executive proposals fast" },
];

async function callClaude(messages, systemPrompt) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system: systemPrompt }),
  });
  if (!res.ok) throw new Error("API error");
  const data = await res.json();
  return data.content?.[0]?.text || "No response received.";
}

// ── PITCH SIMULATOR ──────────────────────────────────────────────
function PitchSimulator() {
  const [persona, setPersona] = useState("CFO");
  const [industry, setIndustry] = useState("Telecom");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const personas = ["CFO", "CTO", "Procurement Head", "CEO", "VP Sales"];
  const industries = ["Telecom", "Banking", "Healthcare", "Manufacturing", "Government"];

  const system = `You are a tough, skeptical ${persona} at a large ${industry} enterprise. 
You are being pitched a B2B solution. Ask hard questions, challenge ROI claims, probe for weaknesses, 
push back on pricing, and demand proof. Be realistic and demanding — not rude, but definitely not easy. 
Keep responses concise (2-4 sentences). After each response, end with ONE sharp follow-up question.`;

  async function start() {
    setStarted(true);
    setLoading(true);
    const opening = [{ role: "user", content: "Begin the meeting. Greet me briefly and ask what I'm here to pitch." }];
    try {
      const reply = await callClaude(opening, system);
      setMessages([{ role: "assistant", content: reply }]);
    } catch { setMessages([{ role: "assistant", content: "Error connecting. Check your API key." }]); }
    setLoading(false);
  }

  async function send() {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const reply = await callClaude(newMessages, system);
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch { setMessages([...newMessages, { role: "assistant", content: "Connection error." }]); }
    setLoading(false);
  }

  if (!started) return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Configure Your Buyer</h2>
      <label style={styles.label}>Buyer Persona</label>
      <div style={styles.chips}>
        {personas.map(p => (
          <button key={p} onClick={() => setPersona(p)} style={{ ...styles.chip, ...(persona === p ? styles.chipActive : {}) }}>{p}</button>
        ))}
      </div>
      <label style={styles.label}>Industry</label>
      <div style={styles.chips}>
        {industries.map(i => (
          <button key={i} onClick={() => setIndustry(i)} style={{ ...styles.chip, ...(industry === i ? styles.chipActive : {}) }}>{i}</button>
        ))}
      </div>
      <div style={styles.selectedInfo}>You'll be pitching to a <strong style={{ color: "var(--accent)" }}>{persona}</strong> in <strong style={{ color: "var(--accent)" }}>{industry}</strong></div>
      <button onClick={start} style={styles.btn}>Start Simulation →</button>
    </div>
  );

  return (
    <div style={styles.card}>
      <div style={styles.chatMeta}>{persona} · {industry}</div>
      <div style={styles.chatBox}>
        {messages.map((m, i) => (
          <div key={i} style={{ ...styles.bubble, ...(m.role === "user" ? styles.bubbleUser : styles.bubbleAI) }}>
            <span style={styles.bubbleRole}>{m.role === "user" ? "YOU" : persona.toUpperCase()}</span>
            <p style={{ marginTop: 4 }}>{m.content}</p>
          </div>
        ))}
        {loading && <div style={styles.bubbleAI}><span style={styles.bubbleRole}>{persona.toUpperCase()}</span><p style={{ marginTop: 4, color: "var(--muted)" }}>Thinking...</p></div>}
      </div>
      <div style={styles.inputRow}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Type your pitch response..." style={styles.input} />
        <button onClick={send} disabled={loading} style={styles.sendBtn}>→</button>
      </div>
      <button onClick={() => { setStarted(false); setMessages([]); }} style={styles.resetBtn}>↺ Reset</button>
    </div>
  );
}

// ── DEAL REVIEW ──────────────────────────────────────────────────
function DealReview() {
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const system = `You are a senior B2B sales coach with 20+ years in enterprise telecom and ICT. 
Analyse the deal notes provided and give structured coaching feedback with:
1. Deal Health Score (0-100)
2. Top 3 Risks
3. Top 3 Opportunities  
4. Recommended Next Actions
5. One key question to ask the prospect
Be direct, practical, and specific. No fluff.`;

  async function review() {
    if (!notes.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const reply = await callClaude([{ role: "user", content: `Review this deal:\n\n${notes}` }], system);
      setResult(reply);
    } catch { setResult("Error connecting. Check your API key."); }
    setLoading(false);
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Paste Your Deal Notes</h2>
      <textarea value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="E.g. Prospect: NTT Data, Budget: $200K, Decision maker: CTO, Competitors: Cisco, Current stage: Proposal sent, Last contact: 2 weeks ago, Key concern: implementation timeline..."
        style={styles.textarea} rows={7} />
      <button onClick={review} disabled={loading || !notes.trim()} style={styles.btn}>
        {loading ? "Analysing..." : "Get Coaching Feedback →"}
      </button>
      {result && (
        <div style={styles.result}>
          <div style={styles.resultLabel}>COACHING FEEDBACK</div>
          <pre style={styles.resultText}>{result}</pre>
        </div>
      )}
    </div>
  );
}

// ── PROPOSAL GENERATOR ───────────────────────────────────────────
function ProposalGenerator() {
  const [form, setForm] = useState({ company: "", contact: "", solution: "", value: "", timeline: "", pain: "" });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const system = `You are an expert B2B proposal writer for enterprise telecom and ICT solutions. 
Write a concise, executive-level proposal with:
- Executive Summary
- Business Challenge
- Proposed Solution
- Key Benefits & ROI
- Investment Overview
- Recommended Next Steps
Use professional but direct language. No filler. Max 400 words.`;

  async function generate() {
    const prompt = `Write a B2B proposal for:
Company: ${form.company}
Contact/Role: ${form.contact}
Solution: ${form.solution}
Business Value: ${form.value}
Timeline: ${form.timeline}
Pain Point: ${form.pain}`;
    setLoading(true);
    setResult("");
    try {
      const reply = await callClaude([{ role: "user", content: prompt }], system);
      setResult(reply);
    } catch { setResult("Error connecting. Check your API key."); }
    setLoading(false);
  }

  const fields = [
    { key: "company", label: "Company Name", placeholder: "e.g. Telstra" },
    { key: "contact", label: "Contact & Role", placeholder: "e.g. Jane Smith, CTO" },
    { key: "solution", label: "Your Solution", placeholder: "e.g. VyOS Enterprise Network Platform" },
    { key: "value", label: "Key Business Value", placeholder: "e.g. 40% cost reduction, vendor independence" },
    { key: "timeline", label: "Proposed Timeline", placeholder: "e.g. 90-day pilot, then full rollout" },
    { key: "pain", label: "Main Pain Point", placeholder: "e.g. Locked into expensive vendor contracts" },
  ];

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Deal Details</h2>
      <div style={styles.formGrid}>
        {fields.map(f => (
          <div key={f.key} style={styles.formField}>
            <label style={styles.label}>{f.label}</label>
            <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
              placeholder={f.placeholder} style={styles.input} />
          </div>
        ))}
      </div>
      <button onClick={generate} disabled={loading || !form.company} style={styles.btn}>
        {loading ? "Generating..." : "Generate Proposal →"}
      </button>
      {result && (
        <div style={styles.result}>
          <div style={styles.resultLabel}>EXECUTIVE PROPOSAL</div>
          <pre style={styles.resultText}>{result}</pre>
          <button onClick={() => navigator.clipboard.writeText(result)} style={styles.copyBtn}>Copy to Clipboard</button>
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState("pitch");

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <div style={styles.logo}>SALESMIND</div>
            <div style={styles.logoSub}>AI-POWERED B2B SALES COACHING</div>
          </div>
          <div style={styles.badge}>BETA</div>
        </div>
      </header>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroTag}>YOUR AI SALES WAR ROOM</div>
        <h1 style={styles.heroTitle}>WIN MORE DEALS.<br />FASTER.</h1>
        <p style={styles.heroDesc}>Sharpen your pitch. Review your deals. Generate proposals.<br />Built for enterprise B2B sales professionals.</p>
      </section>

      {/* Nav */}
      <nav style={styles.nav}>
        {TOOLS.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            style={{ ...styles.navBtn, ...(active === t.id ? styles.navBtnActive : {}) }}>
            <span style={styles.navIcon}>{t.icon}</span>
            <span style={styles.navLabel}>{t.label}</span>
            <span style={styles.navDesc}>{t.desc}</span>
          </button>
        ))}
      </nav>

      {/* Tool */}
      <main style={styles.main}>
        {active === "pitch" && <PitchSimulator />}
        {active === "deal" && <DealReview />}
        {active === "proposal" && <ProposalGenerator />}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2025 SalesMindOnline · Built by <strong>Shah Imrul Huq Anupam</strong></p>
        <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>Author · B2B Sales, Simplified! · salesmind.online</p>
      </footer>
    </div>
  );
}

// ── STYLES ────────────────────────────────────────────────────────
const styles = {
  app: { minHeight: "100vh", display: "flex", flexDirection: "column" },
  header: { borderBottom: "1px solid var(--border)", padding: "16px 24px" },
  headerInner: { maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { fontFamily: "var(--font-display)", fontSize: 28, letterSpacing: 4, color: "var(--accent)" },
  logoSub: { fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 3 },
  badge: { fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--accent)", color: "#000", padding: "2px 8px", fontWeight: 600 },
  hero: { maxWidth: 900, margin: "0 auto", padding: "60px 24px 40px" },
  heroTag: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent2)", letterSpacing: 3, marginBottom: 16 },
  heroTitle: { fontFamily: "var(--font-display)", fontSize: "clamp(52px, 8vw, 96px)", lineHeight: 1, letterSpacing: 2, marginBottom: 20 },
  heroDesc: { color: "var(--muted)", fontSize: 16, lineHeight: 1.8, maxWidth: 500 },
  nav: { maxWidth: 900, margin: "0 auto", padding: "0 24px 32px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 },
  navBtn: { background: "var(--surface)", border: "1px solid var(--border)", padding: "20px", textAlign: "left", cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: 4 },
  navBtnActive: { borderColor: "var(--accent)", background: "var(--surface2)" },
  navIcon: { fontSize: 24 },
  navLabel: { fontFamily: "var(--font-display)", fontSize: 20, color: "var(--text)", letterSpacing: 1 },
  navDesc: { fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-mono)" },
  main: { maxWidth: 900, margin: "0 auto", padding: "0 24px 60px", flex: 1, width: "100%" },
  card: { background: "var(--surface)", border: "1px solid var(--border)", padding: 32 },
  cardTitle: { fontFamily: "var(--font-display)", fontSize: 32, letterSpacing: 1, marginBottom: 24 },
  label: { display: "block", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 8, marginTop: 16 },
  chips: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: { background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", padding: "6px 14px", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-body)", transition: "all 0.15s" },
  chipActive: { borderColor: "var(--accent)", color: "var(--accent)", background: "rgba(232,255,0,0.05)" },
  selectedInfo: { margin: "20px 0", fontSize: 14, color: "var(--muted)", fontFamily: "var(--font-mono)" },
  btn: { marginTop: 24, background: "var(--accent)", color: "#000", border: "none", padding: "14px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", letterSpacing: 1, width: "100%" },
  chatMeta: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent2)", letterSpacing: 2, marginBottom: 16 },
  chatBox: { minHeight: 300, maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, marginBottom: 16, padding: "4px 0" },
  bubble: { padding: "14px 16px", maxWidth: "85%" },
  bubbleAI: { background: "var(--surface2)", border: "1px solid var(--border)", alignSelf: "flex-start" },
  bubbleUser: { background: "rgba(232,255,0,0.06)", border: "1px solid rgba(232,255,0,0.2)", alignSelf: "flex-end" },
  bubbleRole: { fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: 2 },
  inputRow: { display: "flex", gap: 8 },
  input: { flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", padding: "12px 16px", fontSize: 14, fontFamily: "var(--font-body)", outline: "none" },
  sendBtn: { background: "var(--accent)", border: "none", color: "#000", padding: "12px 20px", fontSize: 18, cursor: "pointer", fontWeight: 700 },
  resetBtn: { marginTop: 12, background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", padding: "8px 16px", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-mono)" },
  textarea: { width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", padding: "14px 16px", fontSize: 14, fontFamily: "var(--font-body)", outline: "none", resize: "vertical", marginTop: 8 },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 },
  formField: { display: "flex", flexDirection: "column" },
  result: { marginTop: 28, borderTop: "1px solid var(--border)", paddingTop: 24 },
  resultLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 3, marginBottom: 16 },
  resultText: { whiteSpace: "pre-wrap", fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.8, color: "var(--text)" },
  copyBtn: { marginTop: 16, background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", padding: "8px 20px", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-mono)", letterSpacing: 1 },
  footer: { borderTop: "1px solid var(--border)", padding: "24px", textAlign: "center", fontSize: 13, color: "var(--text)" },
};
