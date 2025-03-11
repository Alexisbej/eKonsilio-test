"use server";

import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, COOKIE_MAX_AGE } from "./constants";

/**
 * Set the authentication token as a cookie
 * @param token JWT token to store
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}

/**
 * Remove the authentication cookie
 */
export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(AUTH_COOKIE_NAME);
}

/**
 * Get the authentication token from cookies
 */
export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();

  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}
