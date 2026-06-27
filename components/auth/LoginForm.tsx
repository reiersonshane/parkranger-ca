"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, Loader2 } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // On success, browser redirects — no need to reset loading
  }

  if (sent) {
    return (
      <div className="bg-white rounded-2xl shadow-park p-6 text-center">
        <Mail className="h-10 w-10 text-canopy mx-auto mb-3" />
        <h2 className="font-display font-semibold text-bark text-lg">Check your email</h2>
        <p className="text-bark/60 font-body text-sm mt-2">
          We sent a magic link to <strong>{email}</strong>. Click it to sign in — no password needed.
        </p>
        <button
          onClick={() => { setSent(false); setEmail(""); }}
          className="mt-4 text-canopy font-body text-sm underline underline-offset-2"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-park p-6 space-y-4">
      {error && (
        <p className="text-red-600 text-sm font-body text-center">{error}</p>
      )}

      {/* Google OAuth */}
      <button
        onClick={handleGoogle}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-meadow/30 rounded-xl font-body text-sm font-medium text-bark hover:bg-sky/30 transition-colors disabled:opacity-60"
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-meadow/20" />
        <span className="text-bark/40 text-xs font-body">or</span>
        <div className="flex-1 h-px bg-meadow/20" />
      </div>

      {/* Magic link */}
      <form onSubmit={handleMagicLink} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full px-4 py-3 rounded-xl border border-meadow/30 bg-parchment font-body text-sm text-bark placeholder:text-bark/40 focus:outline-none focus:ring-2 focus:ring-canopy/30"
        />
        <button
          type="submit"
          disabled={loading || !email}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-canopy text-white rounded-xl font-body text-sm font-medium hover:bg-leaf transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Send magic link
        </button>
      </form>

      <p className="text-bark/40 font-body text-xs text-center">
        By signing in you agree to our terms of service.
      </p>
    </div>
  );
}
