"use client";

import { configureStore, combineReducers } from "@reduxjs/toolkit";
import api from "./reducers/ApiReducers";
import ui from "./reducers/UiReducers";

const store = configureStore({
  reducer: combineReducers({ api, ui }),
});

export type RootState = ReturnType<typeof store.getState>;
export default store;
