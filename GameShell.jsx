import { motion } from "framer-motion";
import { Heart, Play, RotateCcw } from "lucide-react";

export default function GameShell({
  lang,
  theme,
  title,
  subtitle,
  score,
  lives,
  progress,
  timeLeft,
  running,
  onStart,
  onRestart,
  children,
}) {
  return (
    <div
      style={{
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: 20,
        boxShadow: theme.shadow,
        backdropFilter: "blur(14px)",
        padding: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div>
          <h3 style={{ color: theme.text, fontSize: 18 }}>{title}</h3>
          <p style={{ color: theme.textLight, fontSize: 12 }}>{subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!running ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onStart}
              style={{
                minHeight: 44,
                border: "none",
                background: theme.success,
                color: "#042820",
                borderRadius: 12,
                padding: "8px 12px",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <Play size={15} />
              {lang === "te" ? "ప్రారంభం" : "Start"}
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onRestart}
              style={{
                minHeight: 44,
                border: `1px solid ${theme.border}`,
                background: "rgba(255,255,255,0.04)",
                color: theme.text,
                borderRadius: 12,
                padding: "8px 12px",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <RotateCcw size={15} />
              {lang === "te" ? "మళ్లీ" : "Restart"}
            </motion.button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
        <div style={{ background: theme.primaryLight, borderRadius: 12, padding: 8, color: theme.text }}>
          <div style={{ fontSize: 11, color: theme.textLight }}>{lang === "te" ? "స్కోర్" : "Score"}</div>
          <strong>{score}</strong>
        </div>
        <div style={{ background: theme.secondaryLight, borderRadius: 12, padding: 8, color: theme.text }}>
          <div style={{ fontSize: 11, color: theme.textLight }}>{lang === "te" ? "సమయం" : "Time"}</div>
          <strong>{timeLeft}s</strong>
        </div>
        <div style={{ background: theme.accentLight, borderRadius: 12, padding: 8, color: theme.text }}>
          <div style={{ fontSize: 11, color: theme.textLight }}>{lang === "te" ? "లైఫ్స్" : "Lives"}</div>
          <strong style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Heart size={14} fill={theme.danger} color={theme.danger} />
            {lives}
          </strong>
        </div>
      </div>

      <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 12 }}>
        <div style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%`, height: "100%", background: theme.primary, transition: "width 180ms ease" }} />
      </div>

      {children}
    </div>
  );
}
