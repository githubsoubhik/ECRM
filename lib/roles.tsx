// lib/roles.ts
export const roleRoutes: Record<string, string[]> = {
  admin: [
    "/dashboard",
    "/dashboard/Clients",
    "/dashboard/projects",
    "/dashboard/Tasks",
    "/dashboard/TaskManagement",
    "/dashboard/ClientOnboardingForm",
    "/dashboard/Team",
    "/dashboard/leads",
    "/dashboard/Finance",
    "/dashboard/Billing",
    "/dashboard/reports",
    "/dashboard/AnnouncementManagement",
    "/dashboard/Announcements",
    "/dashboard/Messages",
    "/dashboard/Calendar",
    "/dashboard/Attendance",
    "/dashboard/AttendanceManagement",
    "/dashboard/settings",
    "/dashboard/support",
  ],
  hr: [
    "/dashboard",
    "/dashboard/Clients",
    "/dashboard/projects",
    "/dashboard/Tasks",
    "/dashboard/TaskManagement",
    "/dashboard/Team",
    "/dashboard/leads",
    "/dashboard/reports",
    "/dashboard/Announcements",
    "/dashboard/Messages",
    "/dashboard/Calendar",
    "/dashboard/Attendance",
    "/dashboard/support",
  ],
  employee: [
    "/dashboard",
    "/dashboard/Team",
    // "/dashboard/Announcements",
    // "/dashboard/Messages",
    // "/dashboard/Calendar",
    "/dashboard/Attendance",
    // "/dashboard/support",
  ],
};



export function canAccess(role: string | undefined, path: string): boolean {
  if (!role) return false;
  const key = role.toLowerCase().trim();
  const allowedRoutes = roleRoutes[key];
  if (!allowedRoutes) return false;

  const targetPath = path.toLowerCase().replace(/\/+$/, "");

  return allowedRoutes.some((route) => {
    const r = route.toLowerCase().replace(/\/+$/, "");
    
    // Exact match always grants access
    if (targetPath === r) return true;

    // Only allow prefix matching if the base route is NOT the root '/dashboard'
    if (r !== "/dashboard" && targetPath.startsWith(r + "/")) {
      return true;
    }

    return false;
  });
}