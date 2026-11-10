"use client";
import { useEffect, useState } from "react";
import { ContentStudio, type Handoff } from "./StudioContent";
import { ZaraChat, WELCOME, type Msg } from "./ZaraChat";
import { apiFetch } from "@/lib/access";
import { isPlatformEnabled } from "@/lib/studio/platforms";

/**
 * Zara (B.BOLD Core) :
 *  • onglet Discussion : chat avec Zara (idées, angles, accroches) ;
 *  • onglet Studio : posts, carrousels, stories, inspirations, styles, export ZIP, mode Série.
 * Affiché en plein écran par-dessus l'interface B.BOLD.
 *
 * Les deux onglets restent MONTÉS en permanence (l'inactif est simplement masqué) :
 * changer d'onglet ne fait perdre ni la conversation, ni le contenu en cours dans le Studio.
 */
export default function ZaraStudio({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"chat" | "studio">("chat");
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Le bandeau confirme le dépôt du brief, puis s'efface : resté affiché, il mentirait dès le contenu suivant.
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 15000);
    return () => clearTimeout(t);
  }, [notice]);

  /** Condense la conversation en un brief et le dépose dans le Studio. */
  async function goStudio() {
    if (preparing) return;
    const said = messages.filter((m) => m.content.trim() && m !== WELCOME);
    // Rien n'a été échangé : simple changement d'onglet, on ne touche pas au Studio.
    if (!said.some((m) => m.role === "user")) { setTab("studio"); return; }
    setPreparing(true); setNotice(null);
    let idea = "", platform: Handoff["platform"] = null, format: Handoff["format"] = null, viaZara = false;
    try {
      const brand = (() => { try { return localStorage.getItem("zara.activeBrand") || undefined; } catch { return undefined; } })();
      const r = await apiFetch("/api/studio/chat/brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: said, brand }) });
      const j = await r.json();
      if (r.ok && typeof j.idea === "string") {
        idea = j.idea.trim(); viaZara = j.source === "zara";
        // un réseau non proposé dans ce studio est ignoré, et son format avec lui (il n'existerait pas ailleurs)
        if (isPlatformEnabled(j.platform)) { platform = j.platform; format = j.format ?? null; }
      }
    } catch { /* réseau : on retombe sur le dernier échange ci-dessous */ }
    if (!idea) {
      // Secours : la dernière proposition de Zara, à défaut la dernière demande.
      const lastZara = [...said].reverse().find((m) => m.role === "assistant");
      const lastUser = [...said].reverse().find((m) => m.role === "user");
      idea = (lastZara?.content ?? lastUser?.content ?? "").trim().slice(0, 1500);
    }
    setPreparing(false);
    if (idea) {
      setHandoff({ idea, platform, format, nonce: Date.now() });
      setNotice(viaZara ? "Brief de ta discussion déposé dans « Ton idée de contenu ». Relis-le, ajuste, puis génère." : "Ton dernier échange avec Zara est déposé dans « Ton idée de contenu » (le résumé automatique n'a pas abouti). Relis-le avant de générer.");
    }
    setTab("studio");
  }

  return (
    <div className="zara-studio" style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#0a0008", overflowY: "auto" }}>
      {/* En-tête + onglets */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: "linear-gradient(180deg,#120010,#0a0008)", borderBottom: "1px solid rgba(201,168,76,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "13px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>🎨</span>
            <div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: 900, color: "#faf8fb", lineHeight: 1 }}>Zara</div>
              <div style={{ fontSize: 11, color: "#c9a84c", fontWeight: 600, letterSpacing: "0.08em", marginTop: 3 }}>B.BOLD · discussion & studio de contenu</div>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: "9px 18px", background: "rgba(250,248,251,0.06)", border: "1px solid rgba(250,248,251,0.15)", borderRadius: 12, color: "#faf8fb", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ← Retour aux agents
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, padding: "0 24px 0" }}>
          {([["chat", "💬 Discussion"], ["studio", "🎨 Studio"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: "10px 20px", border: 0, cursor: "pointer", fontSize: 13.5, fontWeight: 800,
              background: "transparent", color: tab === k ? "#c9a84c" : "rgba(250,248,251,0.55)",
              borderBottom: tab === k ? "2px solid #c9a84c" : "2px solid transparent",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div style={{ maxWidth: 1480, margin: "18px auto 40px", padding: "24px 28px", borderRadius: 20, background: "#ffffff", color: "#0A0A0A", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display: tab === "chat" ? "block" : "none" }}>
          <ZaraChat messages={messages} setMessages={setMessages} onGoStudio={goStudio} preparing={preparing} />
        </div>
        <div style={{ display: tab === "studio" ? "block" : "none" }}>
          {notice && (
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14, padding: "10px 14px", borderRadius: 12, border: "1px solid #c9a84c", background: "#fdf8ea", color: "#6b5413", fontSize: 12.5, fontWeight: 600 }}>
              <span>✨ {notice}</span>
              <button onClick={() => setNotice(null)} aria-label="Fermer" style={{ border: 0, background: "transparent", color: "#6b5413", cursor: "pointer", fontSize: 14, fontWeight: 800, lineHeight: 1 }}>×</button>
            </div>
          )}
          <ContentStudio handoff={handoff} onHandoffDone={() => setHandoff(null)} />
        </div>
      </div>
    </div>
  );
}
