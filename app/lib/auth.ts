import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export type SessionPayload = {
  userId: string;
  role: "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST";
  hospitalId: string;
};

/**
 * Reads the medicore_session cookie from the incoming request,
 * verifies it, and returns the user info. Returns null if the
 * user isn't signed in or the token is invalid.
 */
export function getSession(req: NextRequest): SessionPayload | null {
  try {
    const token = req.cookies.get("medicore_session")?.value;
    if (!token) return null;

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
      role: SessionPayload["role"];
      hospitalId: string;
    };

    return {
      userId: payload.sub,
      role: payload.role,
      hospitalId: payload.hospitalId,
    };
  } catch {
    return null;
  }
}

/**
 * Returns a Response with a 401 Unauthorized error.
 * Used as a quick "short-circuit" in API routes.
 */
export function unauthorized() {
  return new Response(
    JSON.stringify({ message: "Unauthorized. Please sign in." }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}