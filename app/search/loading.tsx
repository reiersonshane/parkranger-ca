export default function SearchLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="skeleton h-8 w-32 mb-6" />
      <div className="skeleton h-12 w-full rounded-xl mb-8" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-4 p-4 rounded-2xl border border-meadow/20 bg-white">
            <div className="skeleton h-24 w-24 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
              <div className="skeleton h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
