import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-soil text-white/60 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🌲</span>
              <span className="font-display font-bold text-white text-lg">ParkRanger</span>
            </div>
            <p className="text-sm max-w-xs font-body leading-relaxed">
              Where communities come alive. Find parks, discover what&apos;s happening, and connect with your neighbourhood.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12 text-sm font-body">
            <div className="flex flex-col gap-3">
              <span className="text-white font-semibold text-xs uppercase tracking-wider">Explore</span>
              <Link href="/map"    className="hover:text-white transition-colors">Park Map</Link>
              <Link href="/search" className="hover:text-white transition-colors">Find a Park</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-white font-semibold text-xs uppercase tracking-wider">About</span>
              <Link href="/about"   className="hover:text-white transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms"   className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-xs font-body">
          <p>© {new Date().getFullYear()} ParkRanger.ca — Park data provided by Google Places.</p>
        </div>
      </div>
    </footer>
  );
}
