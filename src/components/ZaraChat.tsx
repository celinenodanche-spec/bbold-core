"use client";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { apiFetch } from "@/lib/access";

export interface Msg { role: "user" | "assistant"; content: string }

/** Message d'accueil. Objet unique : le parent le reconnaît par identité pour l'exclure du brief. */
export const WELCOME: Msg = { role: "assistant", content: "Salut 👋 Je suis Zara. Dis-moi ce que tu veux publier (un sujet, une offre, une envie) et on trouve ensemble l'angle, le format et l'accroche. Quand c'est prêt, j'envoie le brief au Studio pour créer les visuels." };

/**
 * Onglet Discussion de Zara. La conversation vit dans le parent (ZaraStudio) :
 * elle survit au passage dans le Studio, et c'est lui qui la condense en brief.
 */
export function ZaraChat({ messages, setMessages, onGoStudio, preparing = false }: {
  messages: Msg[]; setMessages: Dispatch<SetStateAction<Msg[]>>; onGoStudio?: () => void; preparing?: boolean;
}) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || busy || preparing) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", content: "" }]); setInput(""); setBusy(true); setError(null);
    try {
      // l'accueil est un texte d'interface, pas un tour de conversation : on ne l'envoie pas au modèle
      const payload = next.filter((m) => m !== WELCOME && m.content.trim());
      const r = await apiFetch("/api/studio/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: payload, brand: (() => { try { return localStorage.getItem("zara.activeBrand") || undefined; } catch { return undefined; } })() }) });
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
      if (!acc.trim()) throw new Error("réponse vide");
    } catch (e) {
      // On revient à l'état d'avant l'envoi : une réponse ratée ou tronquée ne doit pas rester
      // dans l'historique (elle polluerait le brief envoyé au Studio). Le message retourne dans le champ.
      setMessages(messages);
      setInput(text);
      setError("Zara n'a pas pu répondre (" + (e instanceof Error && e.message ? e.message.slice(0, 200) : "erreur") + "). Ton message est toujours dans le champ : renvoie-le.");
    } finally { setBusy(false); }
  }
  const hasBrief = messages.some((m) => m.role === "user" && m.content.trim());

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
      {error && <div style={{ margin: "8px 0 0", padding: "8px 12px", borderRadius: 10, border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c", fontSize: 12.5 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, paddingTop: 12, marginTop: 8, borderTop: "1px solid #E2DFE9" }}>
        <textarea value={input} onChange={(e) => { setInput(e.target.value); if (error) setError(null); }} rows={2}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
          placeholder="Écris à Zara… (ex. « Idées de posts pour lancer mon offre de branding »)"
          style={{ flex: 1, resize: "none", border: "1px solid #E2DFE9", borderRadius: 12, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", color: "#0A0A0A", background: "#fff" }} />
        <button onClick={send} disabled={busy || preparing || !input.trim()}
          style={{ padding: "0 20px", borderRadius: 12, background: "#0A0A0A", color: "#fff", fontSize: 14, fontWeight: 700, cursor: busy ? "default" : "pointer", opacity: busy || preparing || !input.trim() ? 0.5 : 1, border: 0 }}>
          {busy ? "…" : "Envoyer"}
        </button>
      </div>
      {onGoStudio && (
        <button onClick={onGoStudio} disabled={busy || preparing}
          style={{ marginTop: 10, alignSelf: "center", padding: "8px 18px", borderRadius: 999, border: "1px solid #c9a84c", background: hasBrief ? "#c9a84c" : "#fff", color: hasBrief ? "#1a1400" : "#8a6d1a", fontSize: 12.5, fontWeight: 700, cursor: busy || preparing ? "default" : "pointer", opacity: busy || preparing ? 0.6 : 1 }}>
          {preparing ? "Zara prépare le brief pour le Studio…" : hasBrief ? "🎨 Envoyer ce brief au Studio →" : "🎨 Passer au Studio →"}
        </button>
      )}
    </div>
  );
}
