import { useCallback, useEffect, useState } from "react";
import { api, type Info } from "../lib/api";
import PetCard from "./PetCard";
import QuestionCard from "./QuestionCard";
import HistoryList from "./HistoryList";

const POLL_MS = 30_000;

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setInfo(await api.info());
      setHistoryKey(k => k + 1);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  // No realtime backend: poll so the partner's actions show up
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  async function logout() {
    await api.logout();
    onLogout();
  }

  if (!info) return <div className="center muted">{error ?? "Loading dashboard…"}</div>;

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="brand"><img src="/assets/logo.svg" alt="" className="logo small" /> Kith &amp; Kin</div>
        <div className="pill"><img src="/assets/icons/streak.svg" alt="" className="icon" /> {info.streak} day streak</div>
        <div className="pill"><img src="/assets/icons/coin.svg" alt="" className="icon" /> {info.coins}</div>
        <div className="spacer" />
        <span className="muted small">{info.username}{info.partner ? ` & ${info.partner}` : ""}</span>
        <button className="link" onClick={logout}>Log out</button>
      </header>

      {error && <div className="banner error">{error}</div>}

      <main className="grid">
        <PetCard info={info} onChange={setInfo} />
        <div className="stack">
          <QuestionCard onAnswered={refresh} />
          <section className="card">
            <h2>Our answers</h2>
            <HistoryList refreshKey={historyKey} />
          </section>
        </div>
      </main>
    </div>
  );
}
