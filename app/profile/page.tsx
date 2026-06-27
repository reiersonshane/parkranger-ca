import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { User } from "lucide-react";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Ranger";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const joinedYear = new Date(user.created_at).getFullYear();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl shadow-park p-6 flex items-center gap-5">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-16 w-16 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-canopy/10 flex items-center justify-center shrink-0">
            <User className="h-8 w-8 text-canopy" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-bark truncate">{displayName}</h1>
          <p className="text-bark/50 font-body text-sm truncate">{user.email}</p>
          <p className="text-bark/40 font-body text-xs mt-0.5">Ranger since {joinedYear}</p>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl shadow-park p-6 text-center text-bark/40 font-body text-sm">
        Saved parks and check-ins coming soon.
      </div>

      <div className="mt-4">
        <SignOutButton />
      </div>
    </div>
  );
}
