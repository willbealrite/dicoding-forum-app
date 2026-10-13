import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOwnProfile } from '../states/authSlice';
import {
  addComment,
  clearCommentStatus,
  clearVoteStatus,
  fetchThreadDetail,
  voteOnComment,
  voteOnThread,
} from '../states/threadsSlice';
import MainNavigation from '../components/MainNavigation';
import UserAvatar from '../components/UserAvatar';
import VoteControls from '../components/VoteControls';
import stripHtml from '../utils/stripHtml';
import formatDate from '../utils/formatDate';

function ThreadDetailPage() {
  const { threadId } = useParams();
  const dispatch = useDispatch();
  const [content, setContent] = useState('');

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
  }, [
    dispatch,
    token,
    user,
  ]);

  const isCurrentThread = detail && String(detailId) === threadId;

  async function handleSubmitComment(event) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent || commentStatus === 'loading') return;

    try {
      await dispatch(
        addComment({ threadId, content: trimmedContent }),
      ).unwrap();
      setContent('');
    } catch {
      // Pesan error disediakan oleh Redux.
    }
  }

  async function handleThreadVote(voteType) {
    if (!token || !user?.id) return;

    dispatch(clearVoteStatus());

    try {
      await dispatch(
        voteOnThread({ threadId, voteType, userId: user.id }),
      ).unwrap();
    } catch {
      // Pesan error disediakan oleh Redux.
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
    detailStatus === 'idle'
    || (detailStatus === 'loading' && !isCurrentThread)
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

  if (detailStatus === 'failed' && !isCurrentThread) {
    return (
      <main className="home-placeholder">
        <MainNavigation />
        <p className="thread-error" role="alert">
          Gagal memuat detail diskusi:
          {' '}
          {detailError}
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
              {detail.owner?.name || 'Pengguna tidak diketahui'}
            </span>
            <span className="thread-author-date">
              {formatDate(detail.createdAt)}
            </span>
          </div>
        </div>

        <div className="thread-detail-body">
          {stripHtml(detail.body) || 'Thread ini tidak memiliki isi.'}
        </div>

        <VoteControls
          upVotesBy={detail.upVotesBy || []}
          downVotesBy={detail.downVotesBy || []}
          userId={user?.id}
          disabled={!token || voteStatus === 'loading'}
          onVote={handleThreadVote}
        />

        {!token ? (
          <p className="thread-feedback">
            <Link to="/login">Login</Link>
            {' '}
            untuk memberikan vote.
          </p>
        ) : null}
      </article>

      {voteStatus === 'failed' ? (
        <p className="thread-error" role="alert">
          Gagal memberikan vote:
          {' '}
          {voteError}
        </p>
      ) : null}

      <section className="comments-section" aria-labelledby="comments-heading">
        <h2 id="comments-heading">
          Komentar (
          {comments.length}
          )
        </h2>

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
                      {comment.owner?.name || 'Pengguna tidak diketahui'}
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
                  disabled={!token || voteStatus === 'loading'}
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
                  commentStatus === 'failed'
                  || commentStatus === 'succeeded'
                ) {
                  dispatch(clearCommentStatus());
                }
              }}
              placeholder="Bagikan pendapatmu..."
              rows={4}
              maxLength={1000}
              required
            />

            {commentStatus === 'failed' ? (
              <p className="thread-error" role="alert">
                {commentError}
              </p>
            ) : null}

            {commentStatus === 'succeeded' ? (
              <p className="thread-success" role="status">
                Komentar berhasil dikirim.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!content.trim() || commentStatus === 'loading'}
            >
              {commentStatus === 'loading' ? 'Mengirim...' : 'Kirim komentar'}
            </button>
          </form>
        ) : (
          <p className="thread-feedback">
            <Link to="/login">Login</Link>
            {' '}
            untuk menambahkan komentar.
          </p>
        )}
      </section>
    </main>
  );
}

export default ThreadDetailPage;
