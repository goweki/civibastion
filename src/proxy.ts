import { NextResponse, type NextRequest } from "next/server";
import { isLocale } from "@/lib/i18n";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const firstSegment = pathname.split("/")[1];

  if (isLocale(firstSegment)) {
    return NextResponse.next();
  }

  const localizedUrl = request.nextUrl.clone();
  localizedUrl.pathname = `/en${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(localizedUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
