import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthError, loginUser } from '../states/authSlice';

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, token } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch(clearAuthError());

    try {
      await dispatch(
        loginUser({
          email: email.trim(),
          password,
        }),
      ).unwrap();

      navigate('/', { replace: true });
    } catch {
      // Pesan error ditampilkan dari Redux Store.
    }
  };

  if (token) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-heading">
        <Link to="/" className="auth-brand" aria-label="Kembali ke forum">
          DICODING COMMUNITY
        </Link>

        <div className="auth-heading">
          <p className="eyebrow">SELAMAT DATANG KEMBALI</p>
          <h1 id="login-heading">Welcome back.</h1>
          <p className="auth-description">
            Masuk untuk melanjutkan percakapan dan berbagi ide.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            className="auth-submit"
            type="submit"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Memproses...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          Belum punya akun?
          {' '}
          <Link to="/register">Daftar sekarang</Link>
        </p>

        <Link className="auth-back-link" to="/">
          ← Kembali ke forum
        </Link>
      </section>
    </main>
  );
}

export default LoginPage;
