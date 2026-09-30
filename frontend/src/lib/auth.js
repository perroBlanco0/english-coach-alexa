import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";

const USER_ID_KEY = "english-coach:user-id";

const pool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
});

export function signUp(email, password) {
  return new Promise((resolve, reject) => {
    pool.signUp(
      email,
      password,
      [new CognitoUserAttribute({ Name: "email", Value: email })],
      null,
      (err, result) => (err ? reject(err) : resolve(result))
    );
  });
}

export function confirmSignUp(email, code) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: pool });
    user.confirmRegistration(code, true, (err, result) =>
      err ? reject(err) : resolve(result)
    );
  });
}

export function login(email, password) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: pool });
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });
    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        localStorage.setItem(USER_ID_KEY, session.getIdToken().payload.sub);
        localStorage.setItem(
          "english-coach:session",
          JSON.stringify({ email, at: Date.now() })
        );
        resolve(session);
      },
      onFailure: (err) => reject(err),
    });
  });
}

export function forgotPassword(email) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: pool });
    user.forgotPassword({
      onSuccess: resolve,
      onFailure: reject,
    });
  });
}

export function confirmForgotPassword(email, code, newPassword) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: pool });
    user.confirmPassword(code, newPassword, {
      onSuccess: resolve,
      onFailure: reject,
    });
  });
}

// Cognito returns its error strings in English (and sometimes leaks internal
// wording, e.g. raw "Incorrect username or password."). The rest of the UI
// is in Spanish, so those never get shown to the user directly.
const COGNITO_ERROR_MESSAGES = {
  NotAuthorizedException: "Usuario o contraseña incorrectos.",
  UserNotFoundException: "No existe una cuenta con ese usuario o correo.",
  UsernameExistsException: "Ya existe una cuenta con ese correo.",
  InvalidPasswordException:
    "La contraseña no cumple los requisitos mínimos (8 caracteres, mayúscula, minúscula y número).",
  InvalidParameterException: "Revisa los datos ingresados e intenta de nuevo.",
  CodeMismatchException: "El código ingresado no es correcto.",
  ExpiredCodeException: "El código expiró. Solicita uno nuevo.",
  LimitExceededException: "Demasiados intentos. Espera unos minutos e intenta de nuevo.",
  UserNotConfirmedException: "Tu cuenta aún no está confirmada. Revisa tu correo.",
  PasswordResetRequiredException: "Debes restablecer tu contraseña antes de continuar.",
  TooManyRequestsException: "Demasiadas solicitudes. Intenta de nuevo en unos minutos.",
};

export function translateAuthError(err) {
  if (!err) return "Ocurrió un error inesperado. Intenta de nuevo.";
  return COGNITO_ERROR_MESSAGES[err.code || err.name] || "Ocurrió un error. Intenta de nuevo.";
}

export function logout() {
  const user = pool.getCurrentUser();
  if (user) user.signOut();
  localStorage.removeItem("english-coach:session");
}

export function getSession() {
  try {
    const raw = localStorage.getItem("english-coach:session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(pool.getCurrentUser()) && Boolean(getSession());
}

// Stable per-user identifier used to track pronunciation progress across
// sessions (see server.py's ProgressTable). Set to the Cognito `sub` on
// login — falls back to a random UUID only if auth hasn't run yet.
export function getUserId() {
  try {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}
