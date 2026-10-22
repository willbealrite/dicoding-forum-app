/* eslint-disable react/jsx-props-no-spreading */
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { clearAuthError, registerUser } from '../states/authSlice';

function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, token } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async ({ name, email, password }) => {
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

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="auth-field">
            <label htmlFor="register-name">Nama</label>
            <input
              id="register-name"
              type="text"
              placeholder="Nama lengkap"
              autoComplete="name"
              maxLength={50}
              required
              {...register('name', {
                required: true,
                maxLength: 50,
              })}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              placeholder="nama@email.com"
              autoComplete="email"
              required
              {...register('email', {
                required: true,
              })}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              placeholder="Minimal 6 karakter"
              minLength={6}
              autoComplete="new-password"
              required
              {...register('password', {
                required: true,
                minLength: 6,
              })}
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
