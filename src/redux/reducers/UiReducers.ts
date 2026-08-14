"use client";

import { UiActions } from "../actions/UiActions";

const initialState = {
  FooterSize: 0,
  SiderActive: true,
};

const UiReducer = (
  state = initialState,
  action: { type: string; value: number | boolean }
) => {
  switch (action.type) {
    case UiActions.FooterSize:
      return { ...state, FooterSize: action.value as number };
    case UiActions.SiderActive:
      return { ...state, SiderActive: action.value as boolean };
    default:
      return state;
  }
};

export default UiReducer;
