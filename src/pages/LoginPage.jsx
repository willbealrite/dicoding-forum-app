import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthError, loginUser } from "../states/authSlice";

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, token } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch(clearAuthError());

    try {
      await dispatch(loginUser({ email, password })).unwrap();
      navigate("/");
    } catch {
      // Pesan error ditampilkan dari Redux Store.
    }
  };

  if (token) {
    navigate("/");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">DICODING COMMUNITY</p>
        <h1>Welcome back.</h1>
        <p className="auth-description">
          Masuk untuk melanjutkan percakapan dan berbagi ide.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nama@email.com"
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimal 6 karakter"
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Memproses..." : "Login"}
          </button>
        </form>

        <p className="auth-footer">
          Belum punya akun? <Link to="/register">Daftar sekarang</Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
