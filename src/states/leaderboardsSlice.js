import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../services/api";

export const fetchLeaderboards = createAsyncThunk(
  "leaderboards/fetchLeaderboards",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/leaderboards");

      if (!Array.isArray(response.leaderboards)) {
        return rejectWithValue(
          "Format data leaderboard dari API tidak sesuai.",
        );
      }

      return response.leaderboards;
    } catch (error) {
      return rejectWithValue(error.message || "Gagal memuat leaderboard.");
    }
  },
);

const leaderboardsSlice = createSlice({
  name: "leaderboards",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboards.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchLeaderboards.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchLeaderboards.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload || "Terjadi kesalahan saat memuat leaderboard.";
      });
  },
});

export default leaderboardsSlice.reducer;
