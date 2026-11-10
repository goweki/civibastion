import { ImageResponse } from "next/og";
import { isLocale } from "@/lib/i18n";

export const alt = "CiviBastion — Open security infrastructure for sovereign AI";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: routeLocale } = await params;
  const locale = isLocale(routeLocale) ? routeLocale : "en";
  const copy =
    locale === "sw"
      ? {
          eyebrow: "MIUNDOMBINU HURIA YA USALAMA",
          title: "Usalama wa AI huru, kwa watu wanaoiendesha.",
          subtitle: "Udhibiti wa ndani. Ushahidi ulio wazi. Uwezo wa pamoja.",
          footer: "Huria • Ya ndani • Kwa watu",
        }
      : {
          eyebrow: "OPEN SECURITY INFRASTRUCTURE",
          title: "Security for sovereign AI, built for the people who run it.",
          subtitle: "Local control. Clear evidence. Shared capability.",
          footer: "Open source • Local-first • Human-centered",
        };

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "#f7f8f4",
          color: "#172521",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          overflow: "hidden",
          padding: "64px 76px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#dce8df",
            borderRadius: "999px",
            height: "540px",
            position: "absolute",
            right: "-170px",
            top: "-230px",
            width: "540px",
          }}
        />
        <div style={{ alignItems: "center", display: "flex", gap: "18px" }}>
          <svg height="62" viewBox="0 0 64 64" width="62">
            <path
              d="M32 3.5 57 13v17.6c0 14.8-10 24.9-25 30C17 55.5 7 45.4 7 30.6V13L32 3.5Z"
              fill="#123B35"
            />
            <path
              d="M32 11.5 49 18v12.4c0 10.1-6.2 17.4-17 21.7-10.8-4.3-17-11.6-17-21.7V18l17-6.5Z"
              fill="#F7F8F4"
            />
            <path
              d="M21 39V29.5a11 11 0 0 1 22 0V39h-5v-9.5a6 6 0 0 0-12 0V39h-5Z"
              fill="#123B35"
            />
            <path d="M19 39h26v5H19z" fill="#C9773C" />
          </svg>
          <span
            style={{
              color: "#123b35",
              fontSize: "34px",
              fontWeight: 700,
              letterSpacing: "-1px",
            }}
          >
            CiviBastion
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "22px", maxWidth: "940px" }}>
          <span
            style={{
              color: "#85451f",
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "3px",
            }}
          >
            {copy.eyebrow}
          </span>
          <span
            style={{
              color: "#172521",
              fontSize: "62px",
              fontWeight: 700,
              letterSpacing: "-3px",
              lineHeight: 1.08,
            }}
          >
            {copy.title}
          </span>
          <span style={{ color: "#5b6d65", fontSize: "26px" }}>{copy.subtitle}</span>
        </div>
        <div
          style={{
            borderTop: "2px solid #dce4dc",
            color: "#5b6d65",
            display: "flex",
            fontSize: "18px",
            paddingTop: "20px",
          }}
        >
          {copy.footer}
        </div>
      </div>
    ),
    size,
  );
}
