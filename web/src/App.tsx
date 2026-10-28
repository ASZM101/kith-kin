import { useEffect, useState } from "react";
import { session, setUnauthorizedHandler } from "./lib/api";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => Boolean(session.token()));

  useEffect(() => {
    setUnauthorizedHandler(() => setLoggedIn(false));
  }, []);

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  return <Dashboard onLogout={() => setLoggedIn(false)} />;
}
