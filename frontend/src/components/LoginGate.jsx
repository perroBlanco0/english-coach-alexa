import { useState } from "react";
import { Lock, LogIn, UserPlus } from "lucide-react";
import {
  login,
  signUp,
  confirmSignUp,
  forgotPassword,
  confirmForgotPassword,
  translateAuthError,
} from "../lib/auth";

function validateRequired(value, label) {
  if (!value.trim()) return `Ingresa ${label}.`;
  return null;
}

function validatePassword(password) {
  if (!password) return "Ingresa tu contraseña.";
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  return null;
}

// mode: "login" | "signup" | "confirm" | "forgot" | "reset"
export default function LoginGate({ onSuccess }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setInfo("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const fieldError =
      validateRequired(email, "tu usuario o correo") || validatePassword(password);
    if (fieldError) return setError(fieldError);

    setBusy(true);
    try {
      await login(email.trim(), password);
      onSuccess();
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    const fieldError =
      validateRequired(email, "tu correo") || validatePassword(password);
    if (fieldError) return setError(fieldError);
    if (password !== confirmPassword) {
      return setError("Las contraseñas no coinciden.");
    }

    setBusy(true);
    try {
      await signUp(email.trim(), password);
      switchMode("confirm");
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError("");
    const fieldError = validateRequired(code, "el código de confirmación");
    if (fieldError) return setError(fieldError);

    setBusy(true);
    try {
      await confirmSignUp(email.trim(), code.trim());
      await login(email.trim(), password);
      onSuccess();
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError("");
    const fieldError = validateRequired(email, "tu usuario o correo");
    if (fieldError) return setError(fieldError);

    setBusy(true);
    try {
      await forgotPassword(email.trim());
      switchMode("reset");
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    const fieldError =
      validateRequired(code, "el código recibido") || validatePassword(newPassword);
    if (fieldError) return setError(fieldError);
    if (newPassword !== confirmNewPassword) {
      return setError("Las contraseñas no coinciden.");
    }

    setBusy(true);
    try {
      await confirmForgotPassword(email.trim(), code.trim(), newPassword);
      await login(email.trim(), newPassword);
      onSuccess();
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = {
    login: handleLogin,
    signup: handleSignUp,
    confirm: handleConfirm,
    forgot: handleForgot,
    reset: handleReset,
  }[mode];

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <img
            src="/brand/logo.png"
            alt="perroBlanco0"
            className="w-20 h-20 rounded-full ring-2 ring-brand-indigo/50 shadow-lg shadow-indigo-500/20"
          />
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight">English Coach AI</h1>
            <p className="text-sm text-slate-400">
              Practica tu pronunciación en inglés en voz alta y recibe corrección al instante
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-brand-surface/80 backdrop-blur border border-brand-border rounded-3xl p-6 shadow-xl shadow-black/40 space-y-4"
        >
          <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
            <Lock size={16} className="text-brand-violet" />
            {mode === "login" && "Iniciar sesión"}
            {mode === "signup" && "Crear cuenta"}
            {mode === "confirm" && "Confirma tu correo"}
            {mode === "forgot" && "Recuperar contraseña"}
            {mode === "reset" && "Elige una nueva contraseña"}
          </div>

          {(mode === "login" || mode === "signup" || mode === "forgot") && (
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Usuario o correo</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                className="w-full bg-brand-surface2 border border-brand-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-indigo transition"
                placeholder="demo o tu@correo.com"
              />
            </div>
          )}

          {(mode === "login" || mode === "signup") && (
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full bg-brand-surface2 border border-brand-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-indigo transition"
                placeholder="••••••••"
              />
              {mode === "signup" && (
                <p className="text-[11px] text-slate-500">Mínimo 8 caracteres.</p>
              )}
            </div>
          )}

          {mode === "signup" && (
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full bg-brand-surface2 border border-brand-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-indigo transition"
                placeholder="••••••••"
              />
            </div>
          )}

          {mode === "confirm" && (
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Código enviado a {email}</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-brand-surface2 border border-brand-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-indigo transition"
                placeholder="123456"
              />
            </div>
          )}

          {mode === "reset" && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Código enviado a {email}</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-brand-surface2 border border-brand-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-indigo transition"
                  placeholder="123456"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Nueva contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-brand-surface2 border border-brand-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-indigo transition"
                  placeholder="••••••••"
                />
                <p className="text-[11px] text-slate-500">Mínimo 8 caracteres.</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-brand-surface2 border border-brand-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-indigo transition"
                  placeholder="••••••••"
                />
              </div>
            </>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}
          {info && !error && <p className="text-xs text-brand-success">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-brand-accent hover:opacity-90 active:scale-[0.98] transition rounded-full py-3 text-sm font-semibold disabled:opacity-50"
          >
            {mode === "signup" ? <UserPlus size={16} /> : <LogIn size={16} />}
            {busy
              ? "Espera..."
              : mode === "login"
              ? "Entrar"
              : mode === "signup"
              ? "Crear cuenta"
              : mode === "confirm"
              ? "Confirmar"
              : mode === "forgot"
              ? "Enviar código"
              : "Guardar y entrar"}
          </button>

          {mode === "login" && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="w-full text-xs text-slate-400 hover:text-slate-200 transition"
              >
                ¿Olvidaste tu contraseña?
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="w-full text-xs text-slate-400 hover:text-slate-200 transition"
              >
                ¿No tienes cuenta? Crear una
              </button>
            </div>
          )}
          {mode === "signup" && (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="w-full text-xs text-slate-400 hover:text-slate-200 transition"
            >
              Ya tengo cuenta
            </button>
          )}
          {(mode === "forgot" || mode === "reset") && (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="w-full text-xs text-slate-400 hover:text-slate-200 transition"
            >
              Volver a iniciar sesión
            </button>
          )}
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Built by{" "}
          <span className="text-slate-300 font-medium">Byron González</span> · Cloud &amp; AI
          Architect
        </p>
      </div>
    </div>
  );
}
