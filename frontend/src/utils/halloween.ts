export const HALLOWEEN_EMAIL = "halloween@gmail.com";
export const RASPBERRY_LEMONADE_ID = "raspberry-lemonade";
export function isHalloweenAccount(profile: { email?: string } | null | undefined) {
  return profile?.email?.trim().toLowerCase() === HALLOWEEN_EMAIL;
}
