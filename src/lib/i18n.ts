export const locales = ["en", "sw"] as const;

export type Locale = (typeof locales)[number];

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "sw";
}
