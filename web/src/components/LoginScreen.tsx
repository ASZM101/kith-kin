import { useState, type FormEvent } from "react";
import { api } from "../lib/api";

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.login(username, password);
      onLogin();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center">
      <form className="card narrow" onSubmit={submit}>
        <img src="/assets/logo.svg" alt="" className="logo" />
        <h1>Kith &amp; Kin</h1>
        <p className="muted">Stay close while you're far apart.</p>

        <label>
          Username
          <input value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>

        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={busy}>Log in</button>
      </form>
    </div>
  );
}
