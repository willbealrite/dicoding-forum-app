import { describe, it, expect } from 'vitest';
import threadsReducer, {
  fetchThreads,
  voteOnThread,
} from './threadsSlice';

describe('threadsReducer', () => {
  it('mengubah status menjadi loading saat fetchThreads pending', () => {
    const nextState = threadsReducer(
      undefined,
      { type: fetchThreads.pending.type },
    );

    expect(nextState.status).toBe('loading');
    expect(nextState.error).toBeNull();
  });

  it('menyimpan daftar thread saat fetchThreads fulfilled', () => {
    const threads = [
      {
        id: 'thread-1',
        title: 'Belajar React',
        owner: { id: 'user-1' },
      },
      {
        id: 'thread-2',
        title: 'Belajar Redux',
        owner: { id: 'user-2' },
      },
    ];

    const nextState = threadsReducer(
      undefined,
      fetchThreads.fulfilled(threads),
    );

    expect(nextState.status).toBe('succeeded');
    expect(nextState.items).toEqual(threads);
  });

  it('menerapkan optimistic vote saat voteOnThread pending', () => {
    const initialState = {
      items: [
        {
          id: 'thread-1',
          upVotesBy: [],
          downVotesBy: [],
        },
      ],
      status: 'succeeded',
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
    };

    const action = {
      type: voteOnThread.pending.type,
      meta: {
        arg: {
          threadId: 'thread-1',
          userId: 'user-1',
          voteType: 'up-vote',
        },
        requestId: 'request-1',
      },
    };

    const nextState = threadsReducer(initialState, action);

    expect(nextState.items[0].upVotesBy).toContain('user-1');
    expect(nextState.pendingVotes['thread:thread-1']).toBe('request-1');
    expect(nextState.voteStatus).toBe('loading');
  });

  it('memulihkan vote sebelumnya saat voteOnThread rejected', () => {
    const initialState = {
      items: [
        {
          id: 'thread-1',
          upVotesBy: ['user-1'],
          downVotesBy: [],
        },
      ],
      status: 'succeeded',
      error: null,
      detail: null,
      detailId: null,
      detailStatus: 'idle',
      detailError: null,
      commentStatus: 'idle',
      commentError: null,
      voteStatus: 'loading',
      voteError: null,
      createStatus: 'idle',
      createError: null,
      pendingVotes: {
        'thread:thread-1': 'request-1',
      },
      voteSnapshots: {
        'thread:thread-1': {
          detail: null,
          thread: {
            upVotesBy: ['user-1'],
            downVotesBy: [],
          },
          comment: null,
        },
      },
    };

    const action = {
      type: voteOnThread.rejected.type,
      payload: 'Gagal memberikan vote.',
      meta: {
        arg: { threadId: 'thread-1' },
        requestId: 'request-1',
        rejectedWithValue: true,
      },
    };

    const nextState = threadsReducer(initialState, action);

    expect(nextState.items[0].upVotesBy).toEqual(['user-1']);
    expect(nextState.items[0].downVotesBy).toEqual([]);
    expect(nextState.voteStatus).toBe('failed');
    expect(nextState.voteError).toBe('Gagal memberikan vote.');
    expect(nextState.pendingVotes['thread:thread-1']).toBeUndefined();
    expect(nextState.voteSnapshots['thread:thread-1']).toBeUndefined();
  });
});
