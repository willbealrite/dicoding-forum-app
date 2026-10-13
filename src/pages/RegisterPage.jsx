import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthError, registerUser } from '../states/authSlice';

function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, token } = useSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch(clearAuthError());

    try {
      await dispatch(
        registerUser({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      ).unwrap();

      navigate('/login', { replace: true });
    } catch {
      // Pesan error ditampilkan dari Redux Store.
    }
  };

  if (token) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="register-heading">
        <Link to="/" className="auth-brand" aria-label="Kembali ke forum">
          DICODING COMMUNITY
        </Link>

        <div className="auth-heading">
          <p className="eyebrow">GABUNG DENGAN KOMUNITAS</p>
          <h1 id="register-heading">Join the conversation.</h1>
          <p className="auth-description">
            Buat akun dan mulai berbagi pemikiran dengan komunitas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="register-name">Nama</label>
            <input
              id="register-name"
              name="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama lengkap"
              autoComplete="name"
              maxLength={50}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
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
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimal 6 karakter"
              minLength={6}
              autoComplete="new-password"
              required
            />
            <span className="auth-hint">
              Gunakan minimal 6 karakter.
            </span>
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
            {status === 'loading' ? 'Mendaftarkan...' : 'Buat Akun'}
          </button>
        </form>

        <p className="auth-footer">
          Sudah punya akun?
          {' '}
          <Link to="/login">Login</Link>
        </p>

        <Link className="auth-back-link" to="/">
          ← Kembali ke forum
        </Link>
      </section>
    </main>
  );
}

export default RegisterPage;
