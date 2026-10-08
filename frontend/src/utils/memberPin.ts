export const MEMBER_PIN_LENGTH = 6;

export function sanitizeMemberPin(value: string): string {
  return value.replace(/\D/g, "").slice(0, MEMBER_PIN_LENGTH);
}

export function isValidMemberPin(value: string): boolean {
  return /^\d{6}$/.test(value);
}
