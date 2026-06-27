"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthConfirm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  useEffect(() => {
    // Invalidate the router cache so the NavBar re-renders with the new session
    router.refresh();
    router.replace(next);
  }, [router, next]);

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center">
      <p className="text-bark/50 font-body text-sm">Signing you in…</p>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense>
      <AuthConfirm />
    </Suspense>
  );
}
