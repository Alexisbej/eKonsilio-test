"use client";

import { handleGoogleCallback } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// Create a component that uses useSearchParams inside Suspense
function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Google OAuth returns a code parameter, not a token
    const code = searchParams.get("code");
    const token = searchParams.get("token");

    // If we have a token directly, use it (this happens when redirected from backend)
    if (token) {
      const completeAuth = async () => {
        try {
          // Process the token and get user data
          await handleGoogleCallback(token);

          // Redirect to dashboard after successful authentication
          router.push(ROUTES.DASHBOARD);
        } catch (err) {
          console.error("Authentication error:", err);
          setError("Failed to complete authentication");
        }
      };

      completeAuth();
      return;
    }

    // If we have a code but no token, we need to exchange the code for a token
    if (code) {
      // The backend should handle the code exchange
      // Redirect to the backend callback endpoint with the code
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      window.location.href = `${API_URL}/auth/google/callback?code=${code}`;
      return;
    }

    // If we have neither code nor token, show an error
    setError("No authentication code or token received");
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <div className="text-center">
            <h1 className="text-xl font-bold text-red-600">
              Authentication Error
            </h1>
            <p className="mt-2 text-gray-600">{error}</p>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <div className="text-center">
          <h1 className="text-xl font-bold">Completing Authentication</h1>
          <p className="mt-2 text-gray-600">
            Please wait while we complete your sign-in...
          </p>
        </div>
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <div className="text-center">
          <h1 className="text-xl font-bold">Loading</h1>
          <p className="mt-2 text-gray-600">Please wait...</p>
        </div>
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
