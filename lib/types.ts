export type ReportStatus = "new" | "reviewed" | "in_progress" | "resolved" | "closed";
export type ReportSeverity = "low" | "medium" | "high" | "critical";
export type ConditionType =
  | "pothole"
  | "flooding"
  | "bridge_damage"
  | "road_erosion"
  | "missing_guardrail"
  | "landslide"
  | "damaged_culvert"
  | "other";

export interface RoadReportPhoto {
  id: number;
  report_id: number;
  storage_path: string;
  public_url: string;
  uploaded_at: string;
}

export interface RoadReport {
  id: number;
  reference_number: string;
  title: string | null;
  county: string;
  community: string;
  latitude: number | null;
  longitude: number | null;
  ip_address: string | null;
  condition_type: ConditionType;
  severity: ReportSeverity;
  description: string;
  status: ReportStatus;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  admin_notes: string | null;
  submitted_at: string;
  updated_at: string;
  resolved_at: string | null;
  photos?: RoadReportPhoto[];
}

export const CONDITION_LABELS: Record<ConditionType, string> = {
  pothole: "Pothole",
  flooding: "Flooding",
  bridge_damage: "Bridge Damage",
  road_erosion: "Road Erosion",
  missing_guardrail: "Missing Guardrail",
  landslide: "Landslide",
  damaged_culvert: "Damaged Culvert",
  other: "Other",
};

export const SEVERITY_LABELS: Record<ReportSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  new: "New",
  reviewed: "Reviewed",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const SEVERITY_COLORS: Record<ReportSeverity, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export const STATUS_COLORS: Record<ReportStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewed: "bg-purple-100 text-purple-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};
