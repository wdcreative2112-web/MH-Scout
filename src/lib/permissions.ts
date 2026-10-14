import { Role, UserSession } from "@/types";
import { getSession } from "@/lib/auth";

export const ROLE_PERMISSIONS = {
  ADMIN: {
    canManageUsers: true,
    canManageOrgProfile: true,
    canManageMembers: true,
    canManageGroups: true,
    canManageLeaders: true,
    canManageActivities: true,
    canManageAttendance: true,
    canManageSkills: true,
    canManageLetters: true,
    canManageNews: true,
    canManageArticles: true,
    canManageGallery: true,
    canManageFinance: true,
    canViewFinance: true,
    canViewReports: true,
    canManageSettings: true,
  },
  SEKRETARIS: {
    canManageUsers: false,
    canManageOrgProfile: false,
    canManageMembers: true,
    canManageGroups: true,
    canManageLeaders: true,
    canManageActivities: true,
    canManageAttendance: true,
    canManageSkills: true,
    canManageLetters: true,
    canManageNews: true,
    canManageArticles: true,
    canManageGallery: true,
    canManageFinance: false,
    canViewFinance: false,
    canViewReports: true,
    canManageSettings: false,
  },
  BENDAHARA: {
    canManageUsers: false,
    canManageOrgProfile: false,
    canManageMembers: false, // Read only for payment references
    canManageGroups: false,
    canManageLeaders: false,
    canManageActivities: false,
    canManageAttendance: false,
    canManageSkills: false,
    canManageLetters: false,
    canManageNews: false,
    canManageArticles: false,
    canManageGallery: false,
    canManageFinance: true,
    canViewFinance: true,
    canViewReports: true,
    canManageSettings: false,
  },
  KETUA_REGU: {
    canManageUsers: false,
    canManageOrgProfile: false,
    canManageMembers: false, // Read only for their own squad
    canManageGroups: false,
    canManageLeaders: false,
    canManageActivities: false,
    canManageAttendance: true, // Input attendance for their squad
    canManageSkills: false,
    canManageLetters: false,
    canManageNews: false,
    canManageArticles: false,
    canManageGallery: false,
    canManageFinance: false,
    canViewFinance: false,
    canViewReports: false,
    canManageSettings: false,
  },
} as const;

export function hasPermission(
  role: Role,
  permission: keyof typeof ROLE_PERMISSIONS.ADMIN
): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED: Silakan login terlebih dahulu.");
  }
  return session;
}

export async function requireRole(allowedRoles: Role[]): Promise<UserSession> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN: Anda tidak memiliki akses ke fitur ini.");
  }
  return session;
}
