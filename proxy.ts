import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_LOGIN_PATH = "/admin/login";
const CHECKOUT_PATH = "/checkout";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAdminLogin = pathname === ADMIN_LOGIN_PATH;
  const isCheckout =
    pathname === CHECKOUT_PATH || pathname.startsWith(`${CHECKOUT_PATH}/`);
  const sessionToken = getSessionCookie(request.headers);

  if (sessionToken) {
    return NextResponse.next();
  }

  // Guests hitting /checkout are routed to the cart instead: that's where
  // the auth modal lives and guest→account cart merging happens. The HTTP
  // redirect replaces the history entry, so "Back" from /cart returns to
  // wherever the user came from — never to a signed-out checkout.
  // `?auth=1` signals the cart page to open the sign-in modal (so a direct
  // /checkout hit still prompts auth, but a plain /cart visit does not).
  if (isCheckout) {
    const cartUrl = new URL("/cart", request.url);
    cartUrl.searchParams.set("auth", "1");
    return NextResponse.redirect(cartUrl);
  }

  if (!isAdminLogin) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/checkout", "/checkout/:path*"],
};
