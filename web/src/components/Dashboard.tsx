import { useCallback, useEffect, useState } from "react";
import { api, session, type Info } from "../lib/api";
import PetCard from "./PetCard";
import QuestionCard from "./QuestionCard";
import HistoryList from "./HistoryList";

const POLL_MS = 30_000;

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setHistoryKey(k => k + 1);
    try {
      setInfo(await api.info());
      setError(null);
    } catch (e) {
      setError(`Couldn't load coins and pet stats: ${(e as Error).message}`);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  async function logout() {
    await api.logout();
    onLogout();
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="brand"><img src="/assets/logo.svg" alt="" className="logo small" /> Kith &amp; Kin</div>
        <div className="pill"><img src="/assets/icons/coin.svg" alt="" className="icon" /> {info?.coins ?? "–"}</div>
        <div className="spacer" />
        <span className="muted small">{session.username()}</span>
        <button className="link" onClick={logout}>Log out</button>
      </header>

      {error && <div className="banner error">{error}</div>}

      <main className="grid">
        <PetCard info={info} onChange={refresh} />
        <div className="stack">
          <QuestionCard onAnswered={refresh} />
          <section className="card">
            <h2>My answers</h2>
            <HistoryList refreshKey={historyKey} />
          </section>
        </div>
      </main>
    </div>
  );
}
