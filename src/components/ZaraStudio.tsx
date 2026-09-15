"use client";
import { useState } from "react";
import { ContentStudio } from "./StudioContent";
import { ZaraChat } from "./ZaraChat";

/**
 * Zara (B.BOLD Core) — reprend l'interface de Léa (NAIOM) :
 *  • onglet Discussion : chat avec Zara (idées, angles, accroches) ;
 *  • onglet Studio : posts 4:5, carrousels 4:5, stories 9:16, inspirations,
 *    styles, fond GPT Image, export ZIP, mode Série.
 * Affiché en plein écran par-dessus l'interface B.BOLD.
 */
export default function ZaraStudio({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"chat" | "studio">("chat");
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
        {tab === "chat" ? <ZaraChat onGoStudio={() => setTab("studio")} /> : <ContentStudio />}
      </div>
    </div>
  );
}
