"use client";

export const UiActions = {
  FooterSize: "UI_FOOTER",
  SiderActive: "UI_SIDEBAR_ACTIVE",
};

export const updateFooter = (value: number) => ({
  type: UiActions.FooterSize,
  value,
});

export const updateSiderActive = (value: boolean) => ({
  type: UiActions.SiderActive,
  value,
});
