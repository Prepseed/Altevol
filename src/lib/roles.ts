export const MEMBER_ROLES = [
  "user",
  "student",
  "parent",
  "grandparent",
  "guardian",
] as const;

export const PLAYER_ROLES = ["user", "student"] as const;

export const FAMILY_ROLES = [
  "student",
  "parent",
  "grandparent",
  "guardian",
] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number];
export type PlayerRole = (typeof PLAYER_ROLES)[number];
export type FamilyRole = (typeof FAMILY_ROLES)[number];

export function isMemberRole(role: unknown): role is MemberRole {
  return MEMBER_ROLES.includes(role as MemberRole);
}

export function isFamilyRole(role: unknown): role is FamilyRole {
  return FAMILY_ROLES.includes(role as FamilyRole);
}
