import { useState } from "react";
import { api, moodOf, SPENDS, type Info, type Spend } from "../lib/api";
import PetCanvas, { type Reaction } from "./PetCanvas";

const ACTIONS: Record<Spend, { label: string; kind: Reaction["kind"]; icon: string }> = {
  1: { label: "Pet", kind: "pet", icon: "/assets/icons/heart.svg" },
  5: { label: "Treat", kind: "feed", icon: "/assets/icons/food.svg" },
  10: { label: "Feed", kind: "feed", icon: "/assets/icons/food.svg" }
};

function StatBar({ label, value, tone }: { label: string; value: number; tone: "food" | "joy" }) {
  return (
    <div className="stat">
      <div className="stat-label"><span>{label}</span><span>{Math.round(value)}</span></div>
      <div className="bar"><div className={`fill ${tone}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>
    </div>
  );
}

export default function PetCard({ info, onChange }: { info: Info | null; onChange: () => Promise<void> }) {
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function spend(coins: Spend) {
    setBusy(true);
    setError(null);
    try {
      await api.spend(coins);
      setReaction({ kind: ACTIONS[coins].kind, id: Date.now() });
      await onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const mood = info ? moodOf(info.happiness) : "neutral";
  return (
    <section className="card pet-card">
      <h2>Kith</h2>
      <PetCanvas mood={mood} reaction={reaction} />
      {info ? (
        <>
          <p className="muted mood">Feeling {mood}</p>
          <StatBar label="Happiness" value={info.happiness} tone="joy" />
        </>
      ) : (
        <p className="muted mood">Pet stats unavailable</p>
      )}
      <div className="row">
        {SPENDS.map(coins => (
          <button key={coins} onClick={() => spend(coins)} disabled={busy || (info !== null && info.coins < coins)}>
            <img src={ACTIONS[coins].icon} alt="" className="icon" /> {ACTIONS[coins].label} ({coins})
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
