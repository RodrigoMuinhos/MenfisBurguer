import { ROSA, VERDE } from "@/utils/theme";

export const inputStyle = (err?: boolean) => ({
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  outline: "none",
  background: "#fff",
  border: `1.5px solid ${err ? "#DC2626" : ROSA}`,
  color: VERDE,
  fontFamily: "inherit",
  fontSize: "16px",
  boxSizing: "border-box" as const,
});
