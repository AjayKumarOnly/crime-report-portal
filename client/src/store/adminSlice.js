import { createSlice } from '@reduxjs/toolkit';

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    token: localStorage.getItem('adminToken') || null,
    adminInfo: JSON.parse(localStorage.getItem('adminInfo') || 'null'),
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.adminInfo = action.payload.admin;
      localStorage.setItem('adminToken', action.payload.token);
      localStorage.setItem('adminInfo', JSON.stringify(action.payload.admin));
    },
    logout: (state) => {
      state.token = null;
      state.adminInfo = null;
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminInfo');
    },
  },
});

export const { loginSuccess, logout } = adminSlice.actions;
export default adminSlice.reducer;
