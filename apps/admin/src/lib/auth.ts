"use server";

import { User } from "@ekonsilio/types";
import axios from "axios";
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import { API_URL, AUTH_TOKEN_KEY } from "./constants";
import { removeAuthCookie, setAuthCookie } from "./cookies";

/**
 * Get the Google authentication URL from the backend
 */
export async function getGoogleAuthUrl(): Promise<string> {
  // In a real implementation, we would fetch the URL from the backend
  // But since the backend doesn't have an endpoint for this yet, we'll construct it directly
  return `${API_URL}/auth/google`;
}

/**
 * Handle the Google authentication callback
 * @param token JWT token received from the callback
 */
export async function handleGoogleCallback(token: string): Promise<void> {
  if (!token) {
    throw new Error("No token provided");
  }
  // Also set the token as a cookie for server-side access
  await setAuthCookie(token);
}

/**
 * Fetch the user profile from the backend
 */
export async function fetchUserProfile(): Promise<User> {
  const cookieStore = await cookies();

  const token = cookieStore.get(AUTH_TOKEN_KEY);

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await axios.get(`${API_URL}/auth/profile`, {
    withCredentials: true,
  });

  if (!response.data?.length) {
    throw new Error("Failed to fetch user profile");
  }

  return response.data;
}

/**
 * Logout the user
 */
export async function logout(): Promise<void> {
  // Remove the cookie for server-side
  await removeAuthCookie();
}

/**
 * Get the authentication token
 */
export async function getAuthToken(): Promise<RequestCookie | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_KEY);
}
