"use client";

import { ApiActions } from "../actions/ApiActions";

const initialState = {
  userData: {} as Record<string, unknown>,
};

const ApiReducer = (
  state = initialState,
  action: { type: string; value: Record<string, unknown> }
) => {
  switch (action.type) {
    case ApiActions.USER_DATA:
      return { ...state, userData: action.value };
    default:
      return state;
  }
};

export default ApiReducer;
