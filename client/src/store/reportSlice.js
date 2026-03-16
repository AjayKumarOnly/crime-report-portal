import { createSlice } from '@reduxjs/toolkit';

const reportSlice = createSlice({
  name: 'reports',
  initialState: {
    list: [],
    selected: null,
    loading: false,
    error: null,
    filters: { status: '', category: '', urgency: '' },
    pagination: { page: 1, pages: 1, total: 0 },
    analytics: null,
  },
  reducers: {
    setLoading: (state, action) => { state.loading = action.payload; },
    setError: (state, action) => { state.error = action.payload; },
    setReports: (state, action) => {
      state.list = action.payload.data;
      state.pagination = action.payload.pagination;
    },
    addReport: (state, action) => {
      state.list.unshift(action.payload);
    },
    updateReport: (state, action) => {
      const idx = state.list.findIndex(r => r._id === action.payload._id);
      if (idx !== -1) state.list[idx] = action.payload;
      if (state.selected?._id === action.payload._id) state.selected = action.payload;
    },
    setSelected: (state, action) => { state.selected = action.payload; },
    setFilters: (state, action) => { state.filters = { ...state.filters, ...action.payload }; },
    setAnalytics: (state, action) => { state.analytics = action.payload; },
  },
});

export const {
  setLoading, setError, setReports, addReport,
  updateReport, setSelected, setFilters, setAnalytics,
} = reportSlice.actions;
export default reportSlice.reducer;
