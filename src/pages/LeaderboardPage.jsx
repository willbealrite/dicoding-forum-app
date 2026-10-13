import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchLeaderboards } from "../states/leaderboardsSlice";

function LeaderboardPage() {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector((state) => state.leaderboards);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchLeaderboards());
    }
  }, [dispatch, status]);

  return (
    <main className="home-placeholder">
      <nav className="page-navigation" aria-label="Navigasi utama">
        <Link to="/">Forum Diskusi</Link>
        <Link to="/leaderboards" aria-current="page">
          Leaderboard
        </Link>
      </nav>

      <p className="eyebrow">DICODING COMMUNITY</p>
      <h1>Leaderboard</h1>
      <p>Pengguna dengan skor tertinggi di forum diskusi.</p>

      {status === "idle" || status === "loading" ? (
        <p className="thread-feedback" role="status">
          Memuat leaderboard...
        </p>
      ) : null}

      {status === "failed" ? (
        <div>
          <p className="thread-error" role="alert">
            Gagal memuat leaderboard: {error}
          </p>
          <button type="button" onClick={() => dispatch(fetchLeaderboards())}>
            Coba lagi
          </button>
        </div>
      ) : null}

      {status === "succeeded" && items.length === 0 ? (
        <p className="thread-feedback">Belum ada data leaderboard.</p>
      ) : null}

      {status === "succeeded" && items.length > 0 ? (
        <section
          className="leaderboard-list"
          aria-label="Daftar peringkat pengguna"
        >
          {items.map((entry, index) => {
            const name = entry.user?.name || "Pengguna";
            const avatar = entry.user?.avatar;
            const initial = name.trim().charAt(0).toUpperCase() || "?";

            return (
              <article
                className="leaderboard-card"
                key={entry.user?.id || `${name}-${index}`}
              >
                <span className="leaderboard-rank">{index + 1}</span>

                {avatar ? (
                  <img
                    className="user-avatar"
                    src={avatar}
                    alt={`Avatar ${name}`}
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                      event.currentTarget.nextElementSibling.hidden = false;
                    }}
                  />
                ) : null}

                <span
                  className={`user-avatar user-avatar-fallback${avatar ? " leaderboard-avatar-fallback" : ""}`}
                  role="img"
                  aria-label={`Avatar ${name}`}
                  hidden={Boolean(avatar)}
                >
                  {initial}
                </span>

                <span className="leaderboard-name">{name}</span>

                <span className="leaderboard-score">
                  {entry.score ?? 0} poin
                </span>
              </article>
            );
          })}
        </section>
      ) : null}
    </main>
  );
}

export default LeaderboardPage;
