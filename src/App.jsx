import { useEffect, useMemo, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import { fetchOwnProfile, logoutUser } from "./states/authSlice";
import {
  addComment,
  clearCommentStatus,
  clearCreateStatus,
  clearVoteStatus,
  createThread,
  fetchThreads,
  fetchThreadDetail,
  voteOnComment,
  voteOnThread,
} from "./states/threadsSlice";

function stripHtml(html) {
  if (!html) return "";

  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}

function formatDate(dateString) {
  if (!dateString) return "Waktu tidak tersedia";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Waktu tidak tersedia";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function UserAvatar({ user, size = "medium" }) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState(null);
  const name = user?.name?.trim() || "Pengguna";
  const initial = name.charAt(0).toUpperCase() || "?";
  const avatarUrl = user?.avatar;

  if (avatarUrl && failedAvatarUrl !== avatarUrl) {
    return (
      <img
        key={avatarUrl}
        className={`user-avatar user-avatar-${size}`}
        src={avatarUrl}
        alt={`Avatar ${name}`}
        onError={() => setFailedAvatarUrl(avatarUrl)}
      />
    );
  }

  return (
    <span
      className={`user-avatar user-avatar-fallback user-avatar-${size}`}
      role="img"
      aria-label={`Avatar ${name}`}
    >
      {initial}
    </span>
  );
}

function MainNavigation() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);

  function handleLogout() {
    dispatch(logoutUser());
    navigate("/login", { replace: true });
  }

  return (
    <nav className="page-navigation" aria-label="Navigasi utama">
      <Link to="/">Forum Diskusi</Link>
      <Link to="/leaderboards">Leaderboard</Link>

      {token ? (
        <div className="navigation-user">
          <span>{user?.name ? `Halo, ${user.name}` : "Sudah login"}</span>
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

function VoteControls({
  upVotesBy = [],
  downVotesBy = [],
  userId,
  disabled,
  onVote,
}) {
  const hasUpvoted = Boolean(
    userId && upVotesBy.some((id) => String(id) === String(userId)),
  );

  const hasDownvoted = Boolean(
    userId && downVotesBy.some((id) => String(id) === String(userId)),
  );

  return (
    <div className="vote-controls" aria-label="Voting">
      <button
        type="button"
        className={hasUpvoted ? "vote-button active" : "vote-button"}
        aria-pressed={hasUpvoted}
        disabled={disabled}
        onClick={() => onVote("up-vote")}
      >
        ▲ {upVotesBy.length}
      </button>

      <button
        type="button"
        className={hasDownvoted ? "vote-button active" : "vote-button"}
        aria-pressed={hasDownvoted}
        disabled={disabled}
        onClick={() => onVote("down-vote")}
      >
        ▼ {downVotesBy.length}
      </button>

      <button
        type="button"
        className="vote-button"
        disabled={disabled || (!hasUpvoted && !hasDownvoted)}
        onClick={() => onVote("neutral-vote")}
      >
        Netral
      </button>
    </div>
  );
}

function HomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, token } = useSelector((state) => state.auth);
  const { items, status, error, createStatus, createError } = useSelector(
    (state) => state.threads,
  );

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (token && !user) dispatch(fetchOwnProfile());
  }, [dispatch, token, user]);

  useEffect(() => {
    if (status === "idle") dispatch(fetchThreads());
  }, [dispatch, status]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set();

    items.forEach((thread) => {
      const threadCategory =
        typeof thread.category === "string" ? thread.category.trim() : "";

      if (threadCategory) {
        uniqueCategories.add(threadCategory);
      }
    });

    return [...uniqueCategories].sort((a, b) => a.localeCompare(b, "id"));
  }, [items]);

  const filteredThreads = useMemo(() => {
    if (selectedCategory === "all") return items;

    return items.filter(
      (thread) =>
        typeof thread.category === "string" &&
        thread.category.trim() === selectedCategory,
    );
  }, [items, selectedCategory]);

  async function handleCreateThread(event) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle || !trimmedBody || createStatus === "loading") return;

    try {
      const newThread = await dispatch(
        createThread({
          title: trimmedTitle,
          body: trimmedBody,
          category,
        }),
      ).unwrap();

      setTitle("");
      setBody("");
      setCategory("");
      dispatch(clearCreateStatus());

      if (newThread?.id) navigate(`/threads/${newThread.id}`);
    } catch {
      // Pesan error disediakan oleh Redux.
    }
  }

  function handleFormChange(setValue) {
    return (event) => {
      setValue(event.target.value);

      if (createStatus !== "idle") {
        dispatch(clearCreateStatus());
      }
    };
  }

  return (
    <main className="home-placeholder">
      <MainNavigation />

      <p className="eyebrow">DICODING COMMUNITY</p>
      <h1>Forum Diskusi</h1>

      <p>
        {token
          ? `Selamat datang, ${user?.name || "pengguna"}!`
          : "Selamat datang di forum diskusi."}
      </p>

      <section
        className="create-thread-section"
        aria-labelledby="create-thread-heading"
      >
        <h2 id="create-thread-heading">Buat Diskusi Baru</h2>

        {token ? (
          <form className="comment-form" onSubmit={handleCreateThread}>
            <label htmlFor="thread-title">Judul diskusi</label>
            <input
              id="thread-title"
              name="title"
              value={title}
              onChange={handleFormChange(setTitle)}
              placeholder="Tuliskan judul diskusi"
              maxLength={100}
              required
            />

            <label htmlFor="thread-body">Isi diskusi</label>
            <textarea
              id="thread-body"
              name="body"
              value={body}
              onChange={handleFormChange(setBody)}
              placeholder="Ceritakan hal yang ingin kamu diskusikan..."
              rows={5}
              maxLength={5000}
              required
            />

            <label htmlFor="thread-category">Kategori (opsional)</label>
            <input
              id="thread-category"
              name="category"
              value={category}
              onChange={handleFormChange(setCategory)}
              placeholder="Contoh: react"
              maxLength={50}
            />

            {createStatus === "failed" ? (
              <p className="thread-error" role="alert">
                Gagal membuat thread: {createError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={
                !title.trim() || !body.trim() || createStatus === "loading"
              }
            >
              {createStatus === "loading"
                ? "Menerbitkan diskusi..."
                : "Terbitkan Diskusi"}
            </button>
          </form>
        ) : (
          <p className="thread-feedback">
            <Link to="/login">Login</Link> untuk membuat diskusi baru.
          </p>
        )}
      </section>

      <section className="thread-section" aria-labelledby="thread-heading">
        <h2 id="thread-heading">Diskusi Terbaru</h2>

        <div className="category-filter">
          <label htmlFor="thread-category-filter">
            Filter berdasarkan kategori
          </label>

          <select
            id="thread-category-filter"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            <option value="all">Semua kategori</option>

            {categories.map((itemCategory) => (
              <option key={itemCategory} value={itemCategory}>
                {itemCategory}
              </option>
            ))}
          </select>

          {selectedCategory !== "all" ? (
            <button
              type="button"
              className="category-reset-button"
              onClick={() => setSelectedCategory("all")}
            >
              Reset filter
            </button>
          ) : null}
        </div>

        {status === "idle" || status === "loading" ? (
          <p className="thread-feedback" role="status">
            Memuat diskusi...
          </p>
        ) : null}

        {status === "failed" ? (
          <p className="thread-error" role="alert">
            Gagal memuat diskusi: {error}
          </p>
        ) : null}

        {status === "succeeded" && items.length === 0 ? (
          <p className="thread-feedback">Belum ada thread diskusi.</p>
        ) : null}

        {status === "succeeded" &&
        items.length > 0 &&
        filteredThreads.length === 0 ? (
          <p className="thread-feedback">
            Tidak ada diskusi dalam kategori ini.
          </p>
        ) : null}

        {status === "succeeded" && filteredThreads.length > 0 ? (
          <div className="thread-list">
            {filteredThreads.map((thread) => {
              const bodyText = stripHtml(thread.body);

              return (
                <article className="thread-card" key={thread.id}>
                  <h3>
                    <Link
                      className="thread-title-link"
                      to={`/threads/${thread.id}`}
                    >
                      {thread.title}
                    </Link>
                  </h3>

                  {thread.category ? (
                    <span className="thread-category-label">
                      {thread.category}
                    </span>
                  ) : null}

                  {bodyText ? (
                    <p className="thread-body">
                      {bodyText.length > 180
                        ? `${bodyText.slice(0, 180)}…`
                        : bodyText}
                    </p>
                  ) : null}

                  <div className="thread-meta">
                    <span>
                      Oleh: {thread.owner?.name || "Pengguna tidak diketahui"}
                    </span>
                    <span>{formatDate(thread.createdAt)}</span>
                    <span>{thread.totalComments ?? 0} komentar</span>
                  </div>

                  <Link
                    className="thread-detail-link"
                    to={`/threads/${thread.id}`}
                  >
                    Baca diskusi
                  </Link>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function ThreadDetailPage() {
  const { threadId } = useParams();
  const dispatch = useDispatch();
  const [content, setContent] = useState("");

  const { token, user } = useSelector((state) => state.auth);
  const {
    detail,
    detailId,
    detailStatus,
    detailError,
    commentStatus,
    commentError,
    voteStatus,
    voteError,
  } = useSelector((state) => state.threads);

  useEffect(() => {
    if (threadId) dispatch(fetchThreadDetail(threadId));
  }, [dispatch, threadId]);

  useEffect(() => {
    if (token && !user) dispatch(fetchOwnProfile());
  }, [dispatch, token, user]);

  const isCurrentThread = detail && String(detailId) === threadId;

  async function handleSubmitComment(event) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent || commentStatus === "loading") return;

    try {
      await dispatch(
        addComment({ threadId, content: trimmedContent }),
      ).unwrap();
      setContent("");
    } catch {
      // Pesan error disediakan oleh Redux.
    }
  }

  async function handleThreadVote(voteType) {
    console.log("Vote diklik:", voteType);
    console.log("User tersedia:", Boolean(user));
    console.log("User ID tersedia:", Boolean(user?.id));
    console.log("Token tersedia:", Boolean(token));

    if (!token || !user?.id) return;

    dispatch(clearVoteStatus());

    try {
      await dispatch(
        voteOnThread({ threadId, voteType, userId: user.id }),
      ).unwrap();
      console.log("Vote berhasil");
    } catch (error) {
      console.error("Vote gagal:", error);
    }
  }

  async function handleCommentVote(commentId, voteType) {
    if (!token || !user?.id) return;

    dispatch(clearVoteStatus());

    try {
      await dispatch(
        voteOnComment({
          threadId,
          commentId,
          voteType,
          userId: user.id,
        }),
      ).unwrap();
    } catch {
      // Pesan error disediakan oleh Redux.
    }
  }

  if (
    detailStatus === "idle" ||
    (detailStatus === "loading" && !isCurrentThread)
  ) {
    return (
      <main className="home-placeholder">
        <MainNavigation />
        <p className="thread-feedback" role="status">
          Memuat detail diskusi...
        </p>
      </main>
    );
  }

  if (detailStatus === "failed" && !isCurrentThread) {
    return (
      <main className="home-placeholder">
        <MainNavigation />
        <p className="thread-error" role="alert">
          Gagal memuat detail diskusi: {detailError}
        </p>
        <Link to="/">Kembali ke daftar diskusi</Link>
      </main>
    );
  }

  if (!isCurrentThread) {
    return (
      <main className="home-placeholder">
        <MainNavigation />
        <p className="thread-feedback" role="status">
          Memuat detail diskusi...
        </p>
      </main>
    );
  }

  const comments = Array.isArray(detail.comments) ? detail.comments : [];

  return (
    <main className="home-placeholder">
      <MainNavigation />

      <Link className="back-link" to="/">
        ← Kembali ke daftar diskusi
      </Link>

      <article className="thread-detail">
        <p className="eyebrow">DICODING COMMUNITY</p>
        <h1>{detail.title}</h1>

        <div className="thread-author">
          <UserAvatar user={detail.owner} />
          <div className="thread-author-info">
            <span className="thread-author-name">
              {detail.owner?.name || "Pengguna tidak diketahui"}
            </span>
            <span className="thread-author-date">
              {formatDate(detail.createdAt)}
            </span>
          </div>
        </div>

        <div className="thread-detail-body">
          {stripHtml(detail.body) || "Thread ini tidak memiliki isi."}
        </div>

        <VoteControls
          upVotesBy={detail.upVotesBy || []}
          downVotesBy={detail.downVotesBy || []}
          userId={user?.id}
          disabled={!token || voteStatus === "loading"}
          onVote={handleThreadVote}
        />

        {!token ? (
          <p className="thread-feedback">
            <Link to="/login">Login</Link> untuk memberikan vote.
          </p>
        ) : null}
      </article>

      {voteStatus === "failed" ? (
        <p className="thread-error" role="alert">
          Gagal memberikan vote: {voteError}
        </p>
      ) : null}

      <section className="comments-section" aria-labelledby="comments-heading">
        <h2 id="comments-heading">Komentar ({comments.length})</h2>

        {comments.length === 0 ? (
          <p className="thread-feedback">Belum ada komentar.</p>
        ) : (
          <div className="comment-list">
            {comments.map((comment) => (
              <article className="comment-card" key={comment.id}>
                <p className="comment-content">{stripHtml(comment.content)}</p>

                <div className="comment-author">
                  <UserAvatar user={comment.owner} size="small" />
                  <div className="comment-author-info">
                    <span className="thread-author-name">
                      {comment.owner?.name || "Pengguna tidak diketahui"}
                    </span>
                    <span className="thread-author-date">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                </div>

                <VoteControls
                  upVotesBy={comment.upVotesBy || []}
                  downVotesBy={comment.downVotesBy || []}
                  userId={user?.id}
                  disabled={!token || voteStatus === "loading"}
                  onVote={(voteType) => handleCommentVote(comment.id, voteType)}
                />
              </article>
            ))}
          </div>
        )}

        {token ? (
          <form className="comment-form" onSubmit={handleSubmitComment}>
            <h3>Tulis komentar</h3>

            <label htmlFor="comment-content">Isi komentar</label>
            <textarea
              id="comment-content"
              name="content"
              value={content}
              onChange={(event) => {
                setContent(event.target.value);

                if (
                  commentStatus === "failed" ||
                  commentStatus === "succeeded"
                ) {
                  dispatch(clearCommentStatus());
                }
              }}
              placeholder="Bagikan pendapatmu..."
              rows={4}
              maxLength={1000}
              required
            />

            {commentStatus === "failed" ? (
              <p className="thread-error" role="alert">
                {commentError}
              </p>
            ) : null}

            {commentStatus === "succeeded" ? (
              <p className="thread-success" role="status">
                Komentar berhasil dikirim.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!content.trim() || commentStatus === "loading"}
            >
              {commentStatus === "loading" ? "Mengirim..." : "Kirim komentar"}
            </button>
          </form>
        ) : (
          <p className="thread-feedback">
            <Link to="/login">Login</Link> untuk menambahkan komentar.
          </p>
        )}
      </section>
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/threads/:threadId" element={<ThreadDetailPage />} />
      <Route path="/leaderboards" element={<LeaderboardPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
