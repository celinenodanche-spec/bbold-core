"use client";
import { ContentStudio } from "./StudioContent";

/**
 * Studio de Zara (B.BOLD Core) — reprend exactement le studio de Léa (NAIOM) :
 * posts 4:5, carrousels 4:5, stories 9:16, modèles d'inspiration, styles
 * éditoriaux, fond GPT Image, export ZIP et mode Série.
 * Affiché en plein écran par-dessus l'interface B.BOLD.
 */
export default function ZaraStudio({ onClose }: { onClose: () => void }) {
  return (
    <div className="zara-studio" style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#0a0008", overflowY: "auto" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 22px", background: "linear-gradient(180deg,#120010,#0a0008)", borderBottom: "1px solid rgba(201,168,76,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>🎨</span>
          <div>
            <div style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: 900, color: "#faf8fb", lineHeight: 1 }}>Zara — Studio</div>
            <div style={{ fontSize: 11, color: "#c9a84c", fontWeight: 600, letterSpacing: "0.08em", marginTop: 3 }}>B.BOLD · posts, carrousels & stories prêts à publier</div>
          </div>
        </div>
        <button onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: "rgba(250,248,251,0.06)", border: "1px solid rgba(250,248,251,0.15)", borderRadius: 12, color: "#faf8fb", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          ← Retour aux agents
        </button>
      </div>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px", borderRadius: 20, background: "#ffffff", color: "#0A0A0A", marginTop: 18, marginBottom: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <ContentStudio />
      </div>
    </div>
  );
}
