export type HubRoleKey = "operator" | "employee" | "manager" | "admin";

export interface HubUserProfile {
  id: string;
  email: string;
  fullName: string;
  jobTitle: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HubDepartment {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface HubSystemLink {
  id: string;
  title: string;
  description: string;
  targetUrl: string;
  imageUrl: string | null;
  accentColor: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface HubBanner {
  id: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  imageUrl: string | null;
  tone: "info" | "success" | "warning";
  sortOrder: number;
  isActive: boolean;
}

export interface HubNotice {
  id: string;
  title: string;
  body: string;
  severity: "critical" | "important" | "info";
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface HubNoticeRead {
  id: string;
  noticeId: string;
  userId: string;
  readAt: string;
}

export interface HubDocument {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileName: string;
  mimeType: string | null;
  storageBucket: string;
  storagePath: string;
  fileSize: number | null;
  isRestricted: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface ViewerContext {
  userId: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  roleKeys: HubRoleKey[];
  departmentIds: string[];
  profile: HubUserProfile | null;
}

export interface GroupedSystemLinks {
  department: HubDepartment;
  items: HubSystemLink[];
}

export interface HubHomeData {
  notices: HubNotice[];
  noticeReads: HubNoticeRead[];
  banners: HubBanner[];
  departments: HubDepartment[];
  systems: HubSystemLink[];
  systemDepartmentMap: Array<{
    systemLinkId: string;
    departmentId: string;
    isPrimary: boolean;
    sortOrder: number;
  }>;
  documents: HubDocument[];
  documentDepartmentMap: Array<{
    documentId: string;
    departmentId: string;
  }>;
  loadError: string | null;
}
