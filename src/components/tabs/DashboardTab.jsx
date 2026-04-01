import { motion, useReducedMotion } from "framer-motion";
import { C, CARD_STYLE } from "../../data/constants";
import { normalizeSessionMetrics, defaultDailyMetrics } from "../../utils/helpers";
import { makeFadeUp } from "../shared";

export default function DashboardTab({ lang, sessionMetrics }) {
  const reduceMotion = useReducedMotion();
  const today = new Date();
  const weekDates = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - idx);
    return d.toISOString().slice(0, 10);
  }).reverse();
  const safeMetrics = normalizeSessionMetrics(sessionMetrics);

  const sums = weekDates.reduce((acc, key) => {
    const day = safeMetrics.daily[key] || defaultDailyMetrics();
    return {
      spontaneousRequests: acc.spontaneousRequests + (day.spontaneousRequests || 0),
      waits: acc.waits + (day.waits || 0),
      jointAttentionBids: acc.jointAttentionBids + (day.jointAttentionBids || 0),
      aacMessages: acc.aacMessages + (day.aacMessages || 0),
      routineCompletions: acc.routineCompletions + (day.routineCompletions || 0),
      frustrationEpisodes: acc.frustrationEpisodes + (day.frustrationEpisodes || 0),
      routine: acc.routine + (day.byType?.routine || 0),
      imitation: acc.imitation + (day.byType?.imitation || 0),
      words: acc.words + (day.byType?.words || 0),
      songs: acc.songs + (day.byType?.songs || 0),
      jointAttention: acc.jointAttention + (day.byType?.jointAttention || 0),
    };
  }, { spontaneousRequests: 0, waits: 0, jointAttentionBids: 0, aacMessages: 0, routineCompletions: 0, frustrationEpisodes: 0, routine: 0, imitation: 0, words: 0, songs: 0, jointAttention: 0 });

  const trendRows = [
    { id: "routine", label: lang === "te" ? "దినచర్య" : "Routine", value: sums.routine, color: C.success },
    { id: "imitation", label: lang === "te" ? "అనుకరణ" : "Imitation", value: sums.imitation, color: C.primary },
    { id: "words", label: lang === "te" ? "పదాలు" : "Words", value: sums.words, color: C.secondary },
    { id: "songs", label: lang === "te" ? "పాటలు" : "Songs", value: sums.songs, color: C.accent },
    { id: "jointAttention", label: lang === "te" ? "జాయింట్ అటెన్షన్" : "Joint attention", value: sums.jointAttention, color: C.purple },
  ];
  const maxTrend = Math.max(1, ...trendRows.map((r) => r.value));

  return (
    <motion.div {...makeFadeUp(reduceMotion)}>
      <div style={{ ...CARD_STYLE, borderRadius: 20, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 10 }}>
          {lang === "te" ? "వారపు కమ్యూనికేషన్ డ్యాష్‌బోర్డ్" : "Weekly Functional Communication Dashboard"}
        </div>
        <div className="responsive-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            [lang === "te" ? "స్పాంటేనియస్ రిక్వెస్ట్స్" : "Spontaneous requests", sums.spontaneousRequests],
            [lang === "te" ? "సక్సెస్‌ఫుల్ వెయిట్స్" : "Successful waits", sums.waits],
            [lang === "te" ? "జాయింట్ అటెన్షన్ బిడ్స్" : "Joint-attention bids", sums.jointAttentionBids],
            [lang === "te" ? "AAC మెసేజెస్" : "AAC-initiated messages", sums.aacMessages],
            [lang === "te" ? "రూటీన్ కంప్లీషన్స్" : "Routine completions", sums.routineCompletions],
            [lang === "te" ? "ఫ్రస్ట్రేషన్ ఎపిసోడ్స్" : "Frustration episodes", sums.frustrationEpisodes],
          ].map(([label, value]) => (
            <div key={label} style={{ borderRadius: 12, padding: 10, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)" }}>
              <div style={{ fontSize: 12, color: C.textLight }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...CARD_STYLE, borderRadius: 20, padding: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 10 }}>
          {lang === "te" ? "రూటీన్ టైప్ ట్రెండ్ (7 రోజులు)" : "Trend by routine type (last 7 days)"}
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {trendRows.map((row) => (
            <div key={row.id}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textLight, marginBottom: 4 }}>
                <span>{row.label}</span><span>{row.value}</span>
              </div>
              <div style={{ width: "100%", height: 10, borderRadius: 99, background: "rgba(255,255,255,0.06)" }}>
                <div style={{ width: `${(row.value / maxTrend) * 100}%`, height: "100%", borderRadius: 99, background: row.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
