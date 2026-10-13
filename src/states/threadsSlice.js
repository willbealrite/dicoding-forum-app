import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

const allowedVotes = [
  'up-vote',
  'down-vote',
  'neutral-vote',
];

function getVoteType(item, userId) {
  if (!item || userId == null) return null;

  if ((item.upVotesBy || []).some((id) => String(id) === String(userId))) {
    return 'up-vote';
  }

  if ((item.downVotesBy || []).some((id) => String(id) === String(userId))) {
    return 'down-vote';
  }

  return null;
}

function getEffectiveVoteType(currentVote, requestedVote) {
  return currentVote === requestedVote ? 'neutral-vote' : requestedVote;
}

function applyVoteLocally(item, userId, requestedVote) {
  if (!item || userId == null) return item;

  const currentVote = getVoteType(item, userId);
  const effectiveVote = getEffectiveVoteType(currentVote, requestedVote);

  const userIdString = String(userId);

  const upVotesBy = (item.upVotesBy || []).filter(
    (id) => String(id) !== userIdString,
  );

  const downVotesBy = (item.downVotesBy || []).filter(
    (id) => String(id) !== userIdString,
  );

  if (effectiveVote === 'up-vote') {
    upVotesBy.push(userId);
  } else if (effectiveVote === 'down-vote') {
    downVotesBy.push(userId);
  }

  return {
    ...item,
    upVotesBy,
    downVotesBy,
  };
}

function captureVoteData(item) {
  if (!item) return null;

  return {
    upVotesBy: [...(item.upVotesBy || [])],
    downVotesBy: [...(item.downVotesBy || [])],
  };
}

function captureVoteState(state, threadId, commentId = null) {
  const detailMatches = state.detail && String(state.detailId) === String(threadId);

  const targetComment = commentId !== null && detailMatches
    ? state.detail.comments?.find(
      (comment) => String(comment.id) === String(commentId),
    )
    : null;

  const targetThread = state.items.find(
    (thread) => String(thread.id) === String(threadId),
  );

  return {
    detail: detailMatches ? captureVoteData(state.detail) : null,
    thread: captureVoteData(targetThread),
    comment: captureVoteData(targetComment),
  };
}

function restoreVoteState(state, threadId, snapshot, commentId = null) {
  if (
    snapshot.detail
    && state.detail
    && String(state.detailId) === String(threadId)
  ) {
    if (commentId === null) {
      state.detail.upVotesBy = [...snapshot.detail.upVotesBy];
      state.detail.downVotesBy = [...snapshot.detail.downVotesBy];
    } else if (snapshot.comment && Array.isArray(state.detail.comments)) {
      state.detail.comments = state.detail.comments.map((comment) => (String(comment.id) === String(commentId)
        ? {
          ...comment,
          upVotesBy: [...snapshot.comment.upVotesBy],
          downVotesBy: [...snapshot.comment.downVotesBy],
        }
        : comment));
    }
  }

  if (commentId === null && snapshot.thread) {
    state.items = state.items.map((thread) => (String(thread.id) === String(threadId)
      ? {
        ...thread,
        upVotesBy: [...snapshot.thread.upVotesBy],
        downVotesBy: [...snapshot.thread.downVotesBy],
      }
      : thread));
  }
}

export const fetchThreads = createAsyncThunk(
  'threads/fetchThreads',
  async (_, { rejectWithValue }) => {
    try {
      const [threadResponse, userResponse] = await Promise.all([api.get('/threads'), api.get('/users')]);

      const { threads } = threadResponse;
      const { users } = userResponse;

      if (!Array.isArray(threads) || !Array.isArray(users)) {
        return rejectWithValue(
          'Format data thread atau pengguna dari API tidak sesuai.',
        );
      }

      const userMap = new Map(users.map((user) => [user.id, user]));

      return threads.map((thread) => ({
        ...thread,
        owner: userMap.get(thread.ownerId) || null,
      }));
    } catch (error) {
      return rejectWithValue(error.message || 'Gagal mengambil daftar thread.');
    }
  },
  {
    condition: (_, { getState }) => getState().threads.status === 'idle',
  },
);

export const fetchThreadDetail = createAsyncThunk(
  'threads/fetchThreadDetail',
  async (threadId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/threads/${threadId}`);
      const { detailThread } = response;

      if (!detailThread || !detailThread.id) {
        return rejectWithValue(
          'Data detail thread tidak ditemukan pada respons API.',
        );
      }

      return detailThread;
    } catch (error) {
      return rejectWithValue(error.message || 'Gagal mengambil detail thread.');
    }
  },
  {
    condition: (threadId, { getState }) => {
      const { detailId, detailStatus } = getState().threads;

      return !(
        String(detailId) === String(threadId)
        && (detailStatus === 'loading' || detailStatus === 'succeeded')
      );
    },
  },
);

export const createThread = createAsyncThunk(
  'threads/createThread',
  async ({ title, body, category }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;

      if (!token) {
        return rejectWithValue('Silakan login untuk membuat thread.');
      }

      const payload = {
        title: title.trim(),
        body: body.trim(),
      };

      if (category.trim()) {
        payload.category = category.trim();
      }

      const response = await api.post('/threads', payload, token);

      if (!response.thread) {
        return rejectWithValue(
          'Respons API tidak berisi data thread yang dibuat.',
        );
      }

      return response.thread;
    } catch (error) {
      return rejectWithValue(error.message || 'Gagal membuat thread.');
    }
  },
);

async function submitVote(path, threadId, token) {
  await api.post(path, null, token);

  const response = await api.get(`/threads/${threadId}`);

  if (!response.detailThread) {
    throw new Error('Data detail thread tidak ditemukan setelah voting.');
  }

  return {
    threadId,
    detailThread: response.detailThread,
  };
}

export const voteOnThread = createAsyncThunk(
  'threads/voteOnThread',
  async ({ threadId, voteType }, { getState, rejectWithValue }) => {
    try {
      const { token, user } = getState().auth;
      const state = getState().threads;

      if (!token || !user?.id) {
        return rejectWithValue('Silakan login untuk memberikan vote.');
      }

      if (!allowedVotes.includes(voteType)) {
        return rejectWithValue('Jenis vote tidak valid.');
      }

      const currentThread = state.detail && String(state.detailId) === String(threadId)
        ? state.detail
        : state.items.find(
          (thread) => String(thread.id) === String(threadId),
        );

      const voteKey = `thread:${threadId}`;
      const snapshot = state.voteSnapshots[voteKey];
      const voteSource = snapshot?.detail || snapshot?.thread || currentThread;
      const currentVote = getVoteType(voteSource, user.id);
      const effectiveVoteType = getEffectiveVoteType(currentVote, voteType);

      const result = await submitVote(
        `/threads/${threadId}/${effectiveVoteType}`,
        threadId,
        token,
      );

      return {
        ...result,
        userId: user.id,
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Gagal memberikan vote.');
    }
  },
  {
    condition: ({ threadId }, { getState }) => {
      const state = getState().threads;
      return !state.pendingVotes[`thread:${threadId}`];
    },
  },
);

export const voteOnComment = createAsyncThunk(
  'threads/voteOnComment',
  async ({ threadId, commentId, voteType }, { getState, rejectWithValue }) => {
    try {
      const { token, user } = getState().auth;
      const state = getState().threads;

      if (!token || !user?.id) {
        return rejectWithValue('Silakan login untuk memberikan vote.');
      }

      if (!allowedVotes.includes(voteType)) {
        return rejectWithValue('Jenis vote tidak valid.');
      }

      const currentComment = state.detail && String(state.detailId) === String(threadId)
        ? state.detail.comments?.find(
          (comment) => String(comment.id) === String(commentId),
        )
        : null;

      const voteKey = `comment:${threadId}:${commentId}`;
      const snapshot = state.voteSnapshots[voteKey];
      const voteSource = snapshot?.comment || currentComment;
      const currentVote = getVoteType(voteSource, user.id);
      const effectiveVoteType = getEffectiveVoteType(currentVote, voteType);

      const result = await submitVote(
        `/threads/${threadId}/comments/${commentId}/${effectiveVoteType}`,
        threadId,
        token,
      );

      return {
        ...result,
        userId: user.id,
        commentId,
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Gagal memberikan vote.');
    }
  },
  {
    condition: ({ threadId, commentId }, { getState }) => {
      const state = getState().threads;
      return !state.pendingVotes[`comment:${threadId}:${commentId}`];
    },
  },
);

export const addComment = createAsyncThunk(
  'threads/addComment',
  async ({ threadId, content }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;

      if (!token) {
        return rejectWithValue('Silakan login untuk menambahkan komentar.');
      }

      const response = await api.post(
        `/threads/${threadId}/comments`,
        { content },
        token,
      );

      if (!response.comment) {
        return rejectWithValue('Respons API tidak berisi data komentar.');
      }

      return {
        threadId,
        comment: response.comment,
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Gagal mengirim komentar.');
    }
  },
);

const threadsSlice = createSlice({
  name: 'threads',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
    detail: null,
    detailId: null,
    detailStatus: 'idle',
    detailError: null,
    commentStatus: 'idle',
    commentError: null,
    voteStatus: 'idle',
    voteError: null,
    createStatus: 'idle',
    createError: null,
    pendingVotes: {},
    voteSnapshots: {},
  },
  reducers: {
    clearCommentStatus(state) {
      state.commentStatus = 'idle';
      state.commentError = null;
    },
    clearVoteStatus(state) {
      state.voteStatus = 'idle';
      state.voteError = null;
    },
    clearCreateStatus(state) {
      state.createStatus = 'idle';
      state.createError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchThreads.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchThreads.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchThreads.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Terjadi kesalahan saat mengambil thread.';
      })
      .addCase(fetchThreadDetail.pending, (state, action) => {
        state.detailStatus = 'loading';
        state.detailError = null;
        state.detailId = action.meta.arg;
        state.detail = null;
        state.commentStatus = 'idle';
        state.commentError = null;
        state.voteStatus = 'idle';
        state.voteError = null;
      })
      .addCase(fetchThreadDetail.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.detail = action.payload;
        state.detailId = action.payload.id;
      })
      .addCase(fetchThreadDetail.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.detailError = action.payload || 'Terjadi kesalahan saat mengambil detail thread.';
      })
      .addCase(createThread.pending, (state) => {
        state.createStatus = 'loading';
        state.createError = null;
      })
      .addCase(createThread.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';

        const newThread = action.payload;
        const exists = state.items.some((thread) => thread.id === newThread.id);

        if (!exists) {
          state.items.unshift({
            ...newThread,
            owner: newThread.owner || null,
            totalComments: newThread.totalComments ?? 0,
          });
        }
      })
      .addCase(createThread.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.createError = action.payload || 'Terjadi kesalahan saat membuat thread.';
      })
      .addCase(addComment.pending, (state) => {
        state.commentStatus = 'loading';
        state.commentError = null;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.commentStatus = 'succeeded';

        const { threadId, comment } = action.payload;

        if (
          state.detail
          && String(state.detailId) === String(threadId)
          && Array.isArray(state.detail.comments)
        ) {
          const exists = state.detail.comments.some(
            (item) => item.id === comment.id,
          );

          if (!exists) {
            state.detail.comments.push(comment);
            state.detail.totalComments = (state.detail.totalComments || 0) + 1;
          }
        }

        state.items = state.items.map((thread) => (String(thread.id) === String(threadId)
          ? {
            ...thread,
            totalComments: (thread.totalComments || 0) + 1,
          }
          : thread));
      })
      .addCase(addComment.rejected, (state, action) => {
        state.commentStatus = 'failed';
        state.commentError = action.payload || 'Terjadi kesalahan saat mengirim komentar.';
      })
      .addCase(voteOnThread.pending, (state, action) => {
        const { threadId, userId } = action.meta.arg;
        const key = `thread:${threadId}`;

        state.voteStatus = 'loading';
        state.voteError = null;
        state.pendingVotes[key] = action.meta.requestId;

        if (userId != null) {
          state.voteSnapshots[key] = captureVoteState(state, threadId);

          const detailMatches = state.detail && String(state.detailId) === String(threadId);

          if (detailMatches) {
            state.detail = applyVoteLocally(
              state.detail,
              userId,
              action.meta.arg.voteType,
            );
          }

          state.items = state.items.map((thread) => (String(thread.id) === String(threadId)
            ? applyVoteLocally(thread, userId, action.meta.arg.voteType)
            : thread));
        }
      })
      .addCase(voteOnThread.fulfilled, (state, action) => {
        const { threadId, detailThread } = action.payload;
        const key = `thread:${threadId}`;

        if (state.pendingVotes[key] !== action.meta.requestId) return;

        state.voteStatus = 'succeeded';
        delete state.pendingVotes[key];
        delete state.voteSnapshots[key];

        if (String(state.detailId) === String(threadId)) {
          state.detail = detailThread;
        }

        state.items = state.items.map((thread) => (String(thread.id) === String(threadId)
          ? {
            ...thread,
            upVotesBy: detailThread.upVotesBy || [],
            downVotesBy: detailThread.downVotesBy || [],
          }
          : thread));
      })
      .addCase(voteOnThread.rejected, (state, action) => {
        const { threadId } = action.meta.arg;
        const key = `thread:${threadId}`;

        if (state.pendingVotes[key] !== action.meta.requestId) return;

        state.voteStatus = 'failed';
        state.voteError = action.payload || 'Terjadi kesalahan saat memberikan vote.';

        const snapshot = state.voteSnapshots[key];
        if (snapshot) {
          restoreVoteState(state, threadId, snapshot);
        }

        delete state.pendingVotes[key];
        delete state.voteSnapshots[key];
      })
      .addCase(voteOnComment.pending, (state, action) => {
        const { threadId, commentId, userId } = action.meta.arg;
        const key = `comment:${threadId}:${commentId}`;

        state.voteStatus = 'loading';
        state.voteError = null;
        state.pendingVotes[key] = action.meta.requestId;

        if (userId != null) {
          state.voteSnapshots[key] = captureVoteState(
            state,
            threadId,
            commentId,
          );

          if (
            state.detail
            && String(state.detailId) === String(threadId)
            && Array.isArray(state.detail.comments)
          ) {
            state.detail.comments = state.detail.comments.map((comment) => (String(comment.id) === String(commentId)
              ? applyVoteLocally(comment, userId, action.meta.arg.voteType)
              : comment));
          }
        }
      })
      .addCase(voteOnComment.fulfilled, (state, action) => {
        const { threadId, detailThread, commentId } = action.payload;
        const key = `comment:${threadId}:${commentId}`;

        if (state.pendingVotes[key] !== action.meta.requestId) return;

        state.voteStatus = 'succeeded';
        delete state.pendingVotes[key];
        delete state.voteSnapshots[key];

        if (String(state.detailId) === String(threadId)) {
          state.detail = detailThread;
        }

        state.items = state.items.map((thread) => (String(thread.id) === String(threadId)
          ? {
            ...thread,
            upVotesBy: detailThread.upVotesBy || [],
            downVotesBy: detailThread.downVotesBy || [],
          }
          : thread));
      })
      .addCase(voteOnComment.rejected, (state, action) => {
        const { threadId, commentId } = action.meta.arg;
        const key = `comment:${threadId}:${commentId}`;

        if (state.pendingVotes[key] !== action.meta.requestId) return;

        state.voteStatus = 'failed';
        state.voteError = action.payload || 'Terjadi kesalahan saat memberikan vote.';

        const snapshot = state.voteSnapshots[key];
        if (snapshot) {
          restoreVoteState(state, threadId, snapshot, commentId);
        }

        delete state.pendingVotes[key];
        delete state.voteSnapshots[key];
      });
  },
});

export const { clearCommentStatus, clearVoteStatus, clearCreateStatus } = threadsSlice.actions;

export default threadsSlice.reducer;
