import Link from "next/link";
import { Search, Map, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

interface NavBarProps {
  className?: string;
}

export async function NavBar({ className }: NavBarProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full bg-canopy/95 backdrop-blur-sm border-b border-white/10",
      className
    )}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl leading-none">🌲</span>
          <span className="font-display font-bold text-white text-lg tracking-tight hidden sm:block">
            ParkRanger
          </span>
          <span className="font-display font-bold text-white text-lg tracking-tight sm:hidden">
            PR
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/map" className="text-white/80 hover:text-white text-sm font-body font-medium transition-colors flex items-center gap-1.5">
            <Map className="h-4 w-4" />
            Explore Map
          </Link>
          <Link href="/search" className="text-white/80 hover:text-white text-sm font-body font-medium transition-colors flex items-center gap-1.5">
            <Search className="h-4 w-4" />
            Find a Park
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="md:hidden p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href={user ? "/profile" : "/login"}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={user ? "Profile" : "Sign in"}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Profile" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <User className="h-5 w-5" />
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── Mobile bottom navigation ─────────────────────────────────────────────────

export function MobileBottomNav() {
  const items = [
    { href: "/",        icon: "🏠", label: "Home"    },
    { href: "/map",     icon: "🗺️", label: "Map"     },
    { href: "/profile", icon: "❤️", label: "Saved"   },
    { href: "/profile", icon: "👤", label: "Profile"  },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-meadow/30 safe-area-pb">
      <div className="flex">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex-1 flex flex-col items-center py-2 text-bark/50 hover:text-canopy transition-colors"
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-2xs font-body mt-0.5">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
