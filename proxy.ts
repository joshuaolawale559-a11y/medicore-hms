import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

type Role = "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST";

type TokenPayload = {
  sub: string;
  role: Role;
  hospitalId: string;
};

// Route prefix → roles allowed.
const ROUTE_PERMISSIONS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/dashboard/staff", roles: ["ADMIN"] },
  { prefix: "/dashboard/billing", roles: ["ADMIN", "RECEPTIONIST"] },
  { prefix: "/dashboard/pharmacy", roles: ["ADMIN", "PHARMACIST"] },
  { prefix: "/dashboard/wards", roles: ["ADMIN", "NURSE"] },
  {
    prefix: "/dashboard/patients",
    roles: ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"],
  },
  {
    prefix: "/dashboard/appointments",
    roles: ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"],
  },
  {
    prefix: "/dashboard",
    roles: ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST", "PHARMACIST"],
  },
];

async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

function requiredRoles(pathname: string): Role[] | null {
  const matched = ROUTE_PERMISSIONS.find(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/")
  );
  return matched ? matched.roles : null;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get("medicore_session")?.value;
  const payload = token ? await verifyToken(token) : null;

  const allowedRoles = requiredRoles(pathname);

  // Not a protected route → let it through (login, register, marketing pages)
  if (!allowedRoles) {
    return NextResponse.next();
  }

  // Protected route + no valid session → login
  if (!payload) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Protected route + wrong role → their own dashboard
  if (!allowedRoles.includes(payload.role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Protected route + right role → no-cache headers so Back after
  // logout forces a fresh request
  const res = NextResponse.next();
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, max-age=0"
  );
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};