// CONTROL TOWER Design Tokens
// Dark Command-Center Aesthetic

export const Colors = {
  bg: "#020617",
  surface: "#0F172A",
  surfaceRaised: "#1E293B",
  border: "#334155",
  borderSubtle: "#1E293B",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",

  // Status
  green: "#10B981",
  greenBg: "rgba(16, 185, 129, 0.1)",
  greenBorder: "rgba(16, 185, 129, 0.3)",
  yellow: "#F59E0B",
  yellowBg: "rgba(245, 158, 11, 0.1)",
  yellowBorder: "rgba(245, 158, 11, 0.3)",
  orange: "#F97316",
  orangeBg: "rgba(249, 115, 22, 0.1)",
  orangeBorder: "rgba(249, 115, 22, 0.3)",
  red: "#EF4444",
  redBg: "rgba(239, 68, 68, 0.1)",
  redBorder: "rgba(239, 68, 68, 0.3)",
  blue: "#3B82F6",
  blueBg: "rgba(59, 130, 246, 0.1)",
  blueBorder: "rgba(59, 130, 246, 0.3)",
  purple: "#8B5CF6",
  purpleBg: "rgba(139, 92, 246, 0.1)",
  purpleBorder: "rgba(139, 92, 246, 0.3)",

  white: "#FFFFFF",
  black: "#000000",
};

export const Fonts = {
  display: "Audiowide",
  body: "Manrope",
  bodyMedium: "Manrope-Medium",
  bodySemiBold: "Manrope-SemiBold",
  bodyBold: "Manrope-Bold",
  bodyExtraBold: "Manrope-ExtraBold",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 100,
};

export type StatusType = "approved" | "denied" | "pending" | "held" | "escalated";
export type RiskTier = "low" | "medium" | "high" | "critical";

export const statusColor = (status: string) => {
  switch (status) {
    case "approved": return Colors.green;
    case "denied": return Colors.red;
    case "pending": return Colors.blue;
    case "held": return Colors.yellow;
    case "escalated": return Colors.orange;
    default: return Colors.textSecondary;
  }
};

export const statusBg = (status: string) => {
  switch (status) {
    case "approved": return Colors.greenBg;
    case "denied": return Colors.redBg;
    case "pending": return Colors.blueBg;
    case "held": return Colors.yellowBg;
    case "escalated": return Colors.orangeBg;
    default: return Colors.surfaceRaised;
  }
};

export const riskColor = (risk: string) => {
  switch (risk) {
    case "low": return Colors.green;
    case "medium": return Colors.yellow;
    case "high": return Colors.orange;
    case "critical": return Colors.red;
    default: return Colors.textSecondary;
  }
};

export const trustColor = (level: string) => {
  switch (level) {
    case "trusted": return Colors.green;
    case "expanded": return Colors.blue;
    case "operational": return Colors.blue;
    case "supervised": return Colors.yellow;
    case "restricted": return Colors.red;
    default: return Colors.textSecondary;
  }
};

export const strategyColor = (mode: string) => {
  switch (mode) {
    case "ECONOMY": return Colors.green;
    case "STANDARD": return Colors.blue;
    case "REASONING": return Colors.blue;
    case "RESEARCH": return Colors.purple;
    case "PANEL": return Colors.purple;
    case "AGGREGATE": return Colors.orange;
    case "ESCALATE": return Colors.red;
    default: return Colors.textSecondary;
  }
};
