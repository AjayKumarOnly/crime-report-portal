import { configureStore } from '@reduxjs/toolkit';
import reportReducer from './reportSlice';
import adminReducer from './adminSlice';

export const store = configureStore({
  reducer: {
    reports: reportReducer,
    admin: adminReducer,
  },
});

export default store;
