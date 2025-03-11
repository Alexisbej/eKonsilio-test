/**
 * Application-wide constants
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const AUTH_TOKEN_KEY = "auth_token";
export const AUTH_COOKIE_NAME = "auth_token";

export const COOKIE_MAX_AGE = 60 * 60 * 24; // 1 day in seconds

export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  HOME: "/",
  AUTH: {
    GOOGLE_CALLBACK: "/auth/google/callback",
  },
  API: {
    PROFILE: "/api/auth/profile",
    GOOGLE_AUTH: "/auth/google",
  },
};
