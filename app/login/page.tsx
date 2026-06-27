import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to ParkRanger to save parks, post events, and check in.",
};

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/profile");

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl leading-none">🌲</span>
          <h1 className="font-display text-2xl font-bold text-bark mt-3">
            Welcome to ParkRanger
          </h1>
          <p className="text-bark/60 font-body text-sm mt-1">
            Sign in to save parks, check in, and post events
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
