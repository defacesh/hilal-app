import * as Localization from "expo-localization";
import turkeyCitiesData from "./turkeyCities.json";

export const TURKEY_CITIES = turkeyCitiesData;

export function detectIsTurkey() {
  try {
    const locales = Localization.getLocales?.() || [];
    const calendars = Localization.getCalendars?.() || [];

    const region = locales[0]?.regionCode?.toUpperCase();
    const lang = locales[0]?.languageCode?.toLowerCase();
    const tz =
      calendars[0]?.timeZone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      "";

    if (region === "TR") return true;
    if (tz === "Europe/Istanbul" || tz === "Asia/Istanbul") return true;
    if (lang === "tr" && !region) return true;

    return false;
  } catch {
    return true;
  }
}