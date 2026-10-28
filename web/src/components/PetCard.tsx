import { useState } from "react";
import { api, moodOf, type Info } from "../lib/api";
import PetCanvas, { type Reaction } from "./PetCanvas";

function StatBar({ label, value, tone }: { label: string; value: number; tone: "food" | "joy" }) {
  return (
    <div className="stat">
      <div className="stat-label"><span>{label}</span><span>{Math.round(value)}</span></div>
      <div className="bar"><div className={`fill ${tone}`} style={{ width: `${value}%` }} /></div>
    </div>
  );
}

export default function PetCard({ info, onChange }: { info: Info; onChange: (info: Info) => void }) {
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(kind: "feed" | "pet") {
    setError(null);
    try {
      onChange(kind === "feed" ? await api.feed() : await api.pet());
      setReaction({ kind, id: Date.now() });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const { pet, coins } = info;
  const mood = moodOf(pet);
  return (
    <section className="card pet-card">
      <h2>{pet.name}</h2>
      <PetCanvas mood={mood} reaction={reaction} />
      <p className="muted mood">Feeling {mood}</p>
      <StatBar label="Fullness" value={pet.hunger} tone="food" />
      <StatBar label="Happiness" value={pet.happiness} tone="joy" />
      <div className="row">
        <button onClick={() => act("feed")} disabled={coins < api.costs.feed}>
          <img src="/assets/icons/food.svg" alt="" className="icon" /> Feed ({api.costs.feed})
        </button>
        <button onClick={() => act("pet")} disabled={coins < api.costs.pet}>
          <img src="/assets/icons/heart.svg" alt="" className="icon" /> Pet ({api.costs.pet})
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
