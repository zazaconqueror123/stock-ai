"use client";
import { useState, useRef } from "react";
import styles from "./StockApp.module.css";

const QUICK = ["AAPL","MSFT","NVDA","TSLA","AMZN","GOOGL","META","SPY","QQQ","BRK.B"];

export default function StockApp() {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  async function analyze(t) {
    const sym = (t || ticker).trim().toUpperCase();
    if (!sym) return;
    setTicker(sym); setLoading(true); setError(""); setData(null); setMessages([]);
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker: sym }) });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setHistory(h => [{ ticker: sym, signal: json.signal, time: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) }, ...h.filter(x => x.ticker !== sym)].slice(0, 8));
    } catch(e) { setError(e.message || "Error al analizar."); }
    finally { setLoading(false); }
  }

  async function sendChat() {
    if (!chatInput.trim() || !data) return;
    const q = chatInput.trim(); setChatInput(""); setChatLoading(true);
    setMessages(m => [...m, { role: "user", text: q }]);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q, context: JSON.stringify(data) }) });
      const json = await res.json();
      setMessages(m => [...m, { role: "ai", text: json.answer || "Sin respuesta." }]);
    } catch { setMessages(m => [...m, { role: "ai", text: "Error al obtener respuesta." }]); }
    finally { setChatLoading(false); }
  }

  function pillClass(s) {
    if (!s) return styles.hold;
    const u = s.toUpperCase();
    if (u === "COMPRAR" || u === "POSITIVO") return styles.buy;
    if (u === "VENDER" || u === "NEGATIVO") return styles.sell;
    return styles.hold;
  }

  const rsi = parseInt(data?.rsi) || 50;
  const rsiClass = rsi > 70 ? styles.neg : rsi < 30 ? styles.pos : styles.neu;
  const changeClass = (data?.change || "").includes("+") ? styles.pos : (data?.change || "").includes("-") ? styles.neg : "";

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <span className={styles.logo}>STOCK<span>/</span>AI</span>
        <div className={styles.statusRow}><span className={styles.dot} /><span className={styles.statusText}>EN VIVO · IA ACTIVA</span></div>
      </header>
      <div className={styles.main}>
        <aside className={styles.sidebar}>
          <div className={styles.searchSection}>
            <label className={styles.sectionLabel}>Analizar acción</label>
            <div className={styles.searchRow}>
              <input className={styles.tickerInput} value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && analyze()} placeholder="AAPL" maxLength={8} />
              <button className={styles.analyzeBtn} onClick={() => analyze()} disabled={loading}>{loading ? "..." : "IR"}</button>
            </div>
            <div className={styles.quickLabel}>ACCESOS RÁPIDOS</div>
            <div className={styles.quickRow}>{QUICK.map(t => <button key={t} className={styles.quickBtn} onClick={() => analyze(t)}>{t}</button>)}</div>
          </div>
          <div className={styles.historySection}>
            <div className={styles.sectionLabel}>HISTORIAL</div>
            {history.map(h => (
              <div key={h.ticker+h.time} className={styles.historyItem} onClick={() => analyze(h.ticker)}>
                <div><div className={styles.historyTicker}>{h.ticker}</div><div className={styles.historyTime}>{h.time}</div></div>
                <span className={`${styles.pill} ${pillClass(h.signal)}`}>{h.signal}</span>
              </div>
            ))}
            {history.length === 0 && <div className={styles.emptyHistory}>Sin búsquedas aún</div>}
          </div>
          <div className={styles.sidebarDisclaimer}>⚠ Solo informativo. No es asesoría financiera.</div>
        </aside>
        <main className={styles.content}>
          {!loading && !data && !error && (
            <div className={styles.welcome}>
              <div className={styles.welcomeIcon}>📈</div>
              <h2 className={styles.welcomeTitle}>Asistente de Análisis</h2>
              <p className={styles.welcomeText}>Ingresa un ticker para obtener análisis técnico, fundamental y señales de compra/venta.</p>
            </div>
          )}
          {loading && <div className={styles.loadingState}><div className={styles.loadingTicker}>{ticker}</div><div className={styles.loadingText}>Analizando con IA…</div></div>}
          {error && <div className={styles.errorBox}>{error}</div>}
          {data && !loading && (
            <div className={styles.resultWrap}>
              <div className={styles.resultHeader}>
                <div><div className={styles.tickerBig}>{data.ticker}</div><div className={styles.companySub}>{data.company} · {data.sector}</div></div>
                <div className={styles.signalRight}><span className={`${styles.pill} ${styles.pillLg} ${pillClass(data.signal)}`}>{data.signal}</span><div className={styles.confidence}>Confianza: {data.confidence}</div></div>
              </div>
              <div className={styles.metricsGrid}>
                {[{ label:"Precio",val:data.price,sub:data.change,subClass:changeClass },{ label:"RSI (14d)",val:data.rsi,sub:data.rsiLabel,valClass:rsiClass },{ label:"P/E Ratio",val:data.pe,sub:data.peLabel },{ label:"Cap. mercado",val:data.marketCap,sub:data.sector }].map(m => (
                  <div key={m.label} className={styles.metricCard}>
                    <div className={styles.mLabel}>{m.label}</div>
                    <div className={`${styles.mVal} ${m.valClass||""}`}>{m.val}</div>
                    <div className={`${styles.mSub} ${m.subClass||""}`}>{m.sub}</div>
                  </div>
                ))}
              </div>
              <div className={styles.twoCol}>
                <div className={styles.sectionCard}>
                  <div className={styles.cardTitle}>Indicadores técnicos</div>
                  {(data.technicals||[]).map(t => (
                    <div key={t.name} className={styles.indRow}>
                      <span className={styles.indName}>{t.name}</span><span className={styles.indVal}>{t.value}</span>
                      <span className={`${styles.pill} ${styles.pillSm} ${pillClass(t.signal)}`}>{t.signal}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.sectionCard}>
                  <div className={styles.cardTitle}>Análisis fundamental</div>
                  {(data.fundamentals||[]).map(f => (
                    <div key={f.name} className={styles.indRow}>
                      <span className={styles.indName}>{f.name}</span><span className={styles.indVal}>{f.value}</span>
                      <span className={`${styles.sigText} ${f.signal==="Positivo"?styles.pos:f.signal==="Negativo"?styles.neg:styles.neu}`}>{f.signal}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.sectionCard} style={{marginBottom:"14px"}}>
                <div className={styles.cardTitle}>Análisis completo · IA</div>
                <p className={styles.analysisText}>{data.analysis}</p>
              </div>
              <div className={styles.sectionCard} style={{marginBottom:"20px"}}>
                <div className={styles.cardTitle}>Noticias relevantes</div>
                {(data.news||[]).map((n,i) => (
                  <div key={i} className={styles.newsItem}>
                    <div className={styles.newsTitle}>{n.title}</div>
                    <div className={styles.newsMeta}>{n.source} · <span className={n.sentiment==="Positivo"?styles.pos:n.sentiment==="Negativo"?styles.neg:styles.neu}>{n.sentiment}</span></div>
                  </div>
                ))}
              </div>
              <div className={styles.sectionCard}>
                <div className={styles.cardTitle}>Preguntar sobre {data.ticker}</div>
                <div className={styles.chatRow}>
                  <input className={styles.chatInput} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key==="Enter" && !chatLoading && sendChat()} placeholder="Ej: ¿Cuáles son los riesgos principales?" disabled={chatLoading} />
                  <button className={styles.chatBtn} onClick={sendChat} disabled={chatLoading||!chatInput.trim()}>{chatLoading?"...":"→"}</button>
                </div>
                <div className={styles.chatMessages}>{messages.map((m,i) => (
                  <div key={i} className={`${styles.chatMsg} ${m.role==="user"?styles.chatUser:""}`}>
                    <div className={styles.chatLabel}>{m.role==="user"?"TÚ":"ASISTENTE"}</div>{m.text}
                  </div>
                ))}</div>
              </div>
              <div className={styles.disclaimer}>⚠ Este análisis es solo informativo. No constituye asesoría financiera.</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
