import { motion } from "framer-motion";

export default function SyllableBubble({ bubble, theme, reduceMotion, onTap, onExit }) {
  return (
    <motion.button
      key={bubble.id}
      initial={{ y: -bubble.height - 20, opacity: 0.92, scale: 0.95 }}
      animate={{ y: bubble.endY, opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.75 }}
      transition={{
        duration: reduceMotion ? 0.8 : bubble.duration,
        ease: "linear",
      }}
      whileTap={reduceMotion ? {} : { scale: 0.95 }}
      onClick={() => onTap(bubble)}
      onAnimationComplete={() => onExit(bubble)}
      style={{
        position: "absolute",
        left: `${bubble.x}%`,
        transform: "translateX(-50%)",
        width: bubble.width,
        height: bubble.height,
        minWidth: 44,
        minHeight: 44,
        borderRadius: 999,
        border: `1px solid ${bubble.isTarget ? theme.secondary : theme.border}`,
        color: theme.text,
        background: bubble.isTarget ? theme.secondaryLight : "rgba(255,255,255,0.08)",
        boxShadow: "0 8px 22px rgba(5,10,25,.35)",
        fontSize: bubble.fontSize,
        fontWeight: 800,
        cursor: "pointer",
        userSelect: "none",
      }}
      aria-label={`Syllable ${bubble.text}`}
    >
      {bubble.text}
    </motion.button>
  );
}
