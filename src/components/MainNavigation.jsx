import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../states/authSlice';

function MainNavigation() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);

  function handleLogout() {
    dispatch(logoutUser());
    navigate('/login', { replace: true });
  }

  return (
    <nav className="page-navigation" aria-label="Navigasi utama">
      <Link to="/">Forum Diskusi</Link>
      <Link to="/leaderboards">Leaderboard</Link>

      {token ? (
        <div className="navigation-user">
          <span>{user?.name ? `Halo, ${user.name}` : 'Sudah login'}</span>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
        <div className="navigation-auth">
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      )}
    </nav>
  );
}

export default MainNavigation;
