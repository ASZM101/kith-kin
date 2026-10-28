import { useEffect, useState } from "react";
import { api, type HistoryPage } from "../lib/api";

const PAGE_SIZE = 5;

export default function HistoryList({ refreshKey }: { refreshKey: number }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<HistoryPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.history(page, PAGE_SIZE).then(setData).catch(e => setError(e.message));
  }, [page, refreshKey]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;
  if (data.total === 0) return <p className="muted">No answers yet. Answer a question to start your history.</p>;

  const pages = Math.ceil(data.total / PAGE_SIZE);
  return (
    <div>
      <ul className="history">
        {data.items.map(item => (
          <li key={item.question}>
            <p className="question small">{item.question}</p>
            {item.answers.map(a => (
              <div key={a.answered_at + a.username} className="answer">
                <strong>{a.username}</strong> <span className="muted small">{new Date(a.answered_at).toLocaleDateString()}</span>
                <p>{a.answer}</p>
              </div>
            ))}
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <div className="row pager">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Newer</button>
          <span className="muted small">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Older</button>
        </div>
      )}
    </div>
  );
}
