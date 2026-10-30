import { useEffect, useState, type FormEvent } from "react";
import { api } from "../lib/api";

export default function QuestionCard({ onAnswered }: { onAnswered: () => void }) {
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    api.question()
      .then(q => !cancelled && setQuestion(q))
      .catch(e => !cancelled && setError((e as Error).message));
    return () => { cancelled = true; };
  }, [reloadKey]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!question) return;
    setBusy(true);
    setError(null);
    try {
      await api.answer(question, answer.trim());
      setAnswer("");
      setNotice("Answer saved!");
      onAnswered();
      setReloadKey(k => k + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2>Question</h2>
      {question ? <p className="question">{question}</p> : <p className="muted">Loading…</p>}

      <form onSubmit={submit}>
        <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={3} maxLength={2000} required placeholder="Your answer…" />
        <div className="row">
          <button className="primary" disabled={busy || !question}>Answer (+{api.rewards.answer} coins)</button>
          <button type="button" onClick={() => { setNotice(null); setReloadKey(k => k + 1); }}>Different question</button>
        </div>
      </form>

      {notice && <p className="success small">{notice}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
