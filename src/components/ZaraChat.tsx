"use client";
import { useEffect, useRef, useState } from "react";

interface Msg { role: "user" | "assistant"; content: string }

/** Onglet Discussion de Zara : chat conversationnel (comme le chat de Léa). */
export function ZaraChat({ onGoStudio }: { onGoStudio?: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Salut 👋 Je suis Zara. Dis-moi ce que tu veux publier — un sujet, une offre, une envie — et on trouve ensemble l'angle, le format et l'accroche. Quand c'est prêt, on file dans le Studio pour créer les visuels." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next); setInput(""); setBusy(true);
    setMessages((m) => [...m, { role: "assistant", content: "" }]);
    try {
      const r = await fetch("/api/studio/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
      if (!r.ok || !r.body) throw new Error(await r.text());
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: acc }; return c; });
      }
    } catch (e) {
      setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: "Oups, je n'ai pas pu répondre : " + (e instanceof Error ? e.message : "erreur") }; return c; });
    } finally { setBusy(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "min(70vh, 720px)" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 2px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "82%" }}>
            <div style={{
              whiteSpace: "pre-wrap", lineHeight: 1.5, fontSize: 14,
              padding: "11px 14px", borderRadius: 16,
              background: m.role === "user" ? "#0A0A0A" : "#F3F0F7",
              color: m.role === "user" ? "#fff" : "#1a1a1a",
              borderTopRightRadius: m.role === "user" ? 4 : 16,
              borderTopLeftRadius: m.role === "user" ? 16 : 4,
            }}>{m.content || (busy && i === messages.length - 1 ? "…" : "")}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid #E2DFE9" }}>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
          placeholder="Écris à Zara… (ex. « Idées de posts pour lancer mon offre de branding »)"
          style={{ flex: 1, resize: "none", border: "1px solid #E2DFE9", borderRadius: 12, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", color: "#0A0A0A" }} />
        <button onClick={send} disabled={busy || !input.trim()}
          style={{ padding: "0 20px", borderRadius: 12, background: "#0A0A0A", color: "#fff", fontSize: 14, fontWeight: 700, cursor: busy ? "default" : "pointer", opacity: busy || !input.trim() ? 0.5 : 1, border: 0 }}>
          {busy ? "…" : "Envoyer"}
        </button>
      </div>
      {onGoStudio && (
        <button onClick={onGoStudio} style={{ marginTop: 10, alignSelf: "center", padding: "8px 18px", borderRadius: 999, border: "1px solid #c9a84c", background: "#fff", color: "#8a6d1a", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
          🎨 Passer au Studio pour créer les visuels →
        </button>
      )}
    </div>
  );
}
