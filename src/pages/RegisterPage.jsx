import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthError, registerUser } from "../states/authSlice";

function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, token } = useSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch(clearAuthError());

    try {
      await dispatch(registerUser({ name, email, password })).unwrap();
      navigate("/login");
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
        <h1>Join the conversation.</h1>
        <p className="auth-description">
          Buat akun dan mulai berbagi pemikiran dengan komunitas.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="name">Nama</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nama lengkap"
            autoComplete="name"
            required
          />

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
            minLength={6}
            autoComplete="new-password"
            required
          />

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Mendaftarkan..." : "Buat Akun"}
          </button>
        </form>

        <p className="auth-footer">
          Sudah punya akun? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}

export default RegisterPage;
