import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOwnProfile } from '../states/authSlice';
import {
  clearCreateStatus,
  fetchThreads,
  createThread,
} from '../states/threadsSlice';
import MainNavigation from '../components/MainNavigation';

import stripHtml from '../utils/stripHtml';
import formatDate from '../utils/formatDate';

function HomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, token } = useSelector((state) => state.auth);
  const {
    items, status, error, createStatus, createError,
  } = useSelector(
    (state) => state.threads,
  );

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (token && !user) dispatch(fetchOwnProfile());
  }, [
    dispatch,
    token,
    user,
  ]);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchThreads());
  }, [dispatch, status]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set();

    items.forEach((thread) => {
      const threadCategory = typeof thread.category === 'string' ? thread.category.trim() : '';

      if (threadCategory) {
        uniqueCategories.add(threadCategory);
      }
    });

    return [...uniqueCategories].sort((a, b) => a.localeCompare(b, 'id'));
  }, [items]);

  const filteredThreads = useMemo(() => {
    if (selectedCategory === 'all') return items;

    return items.filter(
      (thread) => typeof thread.category === 'string'
        && thread.category.trim() === selectedCategory,
    );
  }, [items, selectedCategory]);

  async function handleCreateThread(event) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle || !trimmedBody || createStatus === 'loading') return;

    try {
      const newThread = await dispatch(
        createThread({
          title: trimmedTitle,
          body: trimmedBody,
          category,
        }),
      ).unwrap();

      setTitle('');
      setBody('');
      setCategory('');
      dispatch(clearCreateStatus());

      if (newThread?.id) navigate(`/threads/${newThread.id}`);
    } catch {
      // Pesan error disediakan oleh Redux.
    }
  }

  function handleFormChange(setValue) {
    return (event) => {
      setValue(event.target.value);

      if (createStatus !== 'idle') {
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
          ? `Selamat datang, ${user?.name || 'pengguna'}!`
          : 'Selamat datang di forum diskusi.'}
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

            {createStatus === 'failed' ? (
              <p className="thread-error" role="alert">
                Gagal membuat thread:
                {' '}
                {createError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={
                !title.trim() || !body.trim() || createStatus === 'loading'
              }
            >
              {createStatus === 'loading'
                ? 'Menerbitkan diskusi...'
                : 'Terbitkan Diskusi'}
            </button>
          </form>
        ) : (
          <p className="thread-feedback">
            <Link to="/login">Login</Link>
            {' '}
            untuk membuat diskusi baru.
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

          {selectedCategory !== 'all' ? (
            <button
              type="button"
              className="category-reset-button"
              onClick={() => setSelectedCategory('all')}
            >
              Reset filter
            </button>
          ) : null}
        </div>

        {status === 'idle' || status === 'loading' ? (
          <p className="thread-feedback" role="status">
            Memuat diskusi...
          </p>
        ) : null}

        {status === 'failed' ? (
          <p className="thread-error" role="alert">
            Gagal memuat diskusi:
            {' '}
            {error}
          </p>
        ) : null}

        {status === 'succeeded' && items.length === 0 ? (
          <p className="thread-feedback">Belum ada thread diskusi.</p>
        ) : null}

        {status === 'succeeded'
        && items.length > 0
        && filteredThreads.length === 0 ? (
            <p className="thread-feedback">
              Tidak ada diskusi dalam kategori ini.
            </p>
          ) : null}

        {status === 'succeeded' && filteredThreads.length > 0 ? (
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
                      Oleh:
                      {' '}
                      {thread.owner?.name || 'Pengguna tidak diketahui'}
                    </span>
                    <span>{formatDate(thread.createdAt)}</span>
                    <span>
                      {thread.totalComments ?? 0}
                      {' '}
                      komentar
                    </span>
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

export default HomePage;
