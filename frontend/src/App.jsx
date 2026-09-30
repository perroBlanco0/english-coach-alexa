import { useEffect, useState } from "react";
import { isAuthenticated } from "./lib/auth";
import LoginGate from "./components/LoginGate";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PracticeScreen from "./components/PracticeScreen";

export default function App() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, []);

  if (!authed) {
    return <LoginGate onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLogout={() => setAuthed(false)} />
      <PracticeScreen />
      <Footer />
    </div>
  );
}
