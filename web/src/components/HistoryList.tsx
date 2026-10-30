import { useEffect, useState } from "react";
import { api, type HistoryItem } from "../lib/api";

const PAGE_SIZE = 5;

export default function HistoryList({ refreshKey }: { refreshKey: number }) {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.history(page, PAGE_SIZE), api.history(page + 1, PAGE_SIZE)])
      .then(([current, next]) => {
        if (cancelled) return;
        if (current.length === 0 && page > 0) {
          setPage(p => p - 1);
          return;
        }
        setItems(current);
        setHasNext(next.length > 0);
        setError(null);
      })
      .catch(e => !cancelled && setError((e as Error).message));
    return () => { cancelled = true; };
  }, [page, refreshKey]);

  if (error) return <p className="error">{error}</p>;
  if (!items) return <p className="muted">Loading…</p>;
  if (items.length === 0) return <p className="muted">No answers yet. Answer a question to start your history.</p>;

  return (
    <div>
      <ul className="history">
        {items.map((item, i) => (
          <li key={page * PAGE_SIZE + i}>
            <p className="question small">{item.question}</p>
            <div className="answer"><p>{item.answer}</p></div>
          </li>
        ))}
      </ul>
      {(page > 0 || hasNext) && (
        <div className="row pager">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span className="muted small">Page {page + 1}</span>
          <button disabled={!hasNext} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
