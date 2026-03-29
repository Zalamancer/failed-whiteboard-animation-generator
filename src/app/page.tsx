"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SignInContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const handleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="text-center">
      {error && (
        <p className="mb-6 text-red-500 text-sm">
          Access denied. Only authorized accounts can sign in.
        </p>
      )}
      <button
        onClick={handleSignIn}
        className="px-8 py-3 bg-black text-white rounded-lg text-base font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
      >
        Sign In
      </button>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#ffffff" }}
    >
      <Suspense>
        <SignInContent />
      </Suspense>
    </div>
  );
}
