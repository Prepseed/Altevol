"use client";

export const ApiActions = {
  USER_DATA: "API_USER_DATA",
};

export const updateUserData = (value: Record<string, unknown>) => ({
  type: ApiActions.USER_DATA,
  value,
});
