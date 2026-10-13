import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

const getStoredToken = () => localStorage.getItem('accessToken');

const initialState = {
  token: getStoredToken(),
  user: null,
  status: 'idle',
  error: null,
};

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      return await api.post('/register', {
        name,
        email,
        password,
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/login', {
        email,
        password,
      });

      const { token } = response;

      if (!token) {
        return rejectWithValue('Token tidak ditemukan pada respons login.');
      }

      const profile = await api.get('/users/me', token);

      localStorage.setItem('accessToken', token);

      return {
        token,
        user: profile.user,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchOwnProfile = createAsyncThunk(
  'auth/fetchOwnProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;

      if (!token) {
        return rejectWithValue('Silakan login terlebih dahulu.');
      }

      const response = await api.get('/users/me', token);

      return response.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchOwnProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchOwnProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(fetchOwnProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearAuthError, logout } = authSlice.actions;

export const logoutUser = () => (dispatch) => {
  localStorage.removeItem('accessToken');
  dispatch(logout());
};

export default authSlice.reducer;
