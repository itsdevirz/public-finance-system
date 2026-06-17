import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message ?? "خطا در ورود. دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.title}>سامانه جامع نظام مالی</h2>
        <p style={styles.subtitle}>برای ادامه وارد شوید</p>

        {error && <div style={styles.error}>{error}</div>}

        <label style={styles.label}>نام کاربری</label>
        <input
          style={styles.input}
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          disabled={loading}
        />

        <label style={styles.label}>رمز عبور</label>
        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          disabled={loading}
        />

        <button style={{ ...styles.button, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
          {loading ? "در حال ورود..." : "ورود"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f0f4f8",
    fontFamily: "Tahoma",
    direction: "rtl",
  },
  card: {
    background: "white",
    padding: "40px 36px",
    borderRadius: 12,
    boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: 380,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  title: {
    margin: 0,
    color: "#1e3a5f",
    fontSize: 20,
    textAlign: "center",
  },
  subtitle: {
    margin: "0 0 8px",
    color: "#666",
    fontSize: 13,
    textAlign: "center",
  },
  label: {
    fontSize: 13,
    color: "#333",
    marginBottom: 2,
  },
  input: {
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
    outline: "none",
    direction: "ltr",
  },
  button: {
    marginTop: 8,
    padding: "11px",
    background: "#1e3a5f",
    color: "white",
    border: "none",
    borderRadius: 6,
    fontSize: 15,
    cursor: "pointer",
  },
  error: {
    background: "#fff0f0",
    color: "#c0392b",
    border: "1px solid #f5c6cb",
    borderRadius: 6,
    padding: "8px 12px",
    fontSize: 13,
  },
};
