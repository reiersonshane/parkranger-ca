export default function ParkDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto pb-16">
      {/* Photo skeleton */}
      <div className="w-full aspect-video skeleton" />

      <div className="px-4 pt-6 space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <div className="skeleton h-8 w-3/4" />
          <div className="skeleton h-4 w-1/3" />
        </div>

        {/* Address */}
        <div className="skeleton h-4 w-2/3" />

        {/* Hours */}
        <div className="skeleton h-12 w-full rounded-xl" />

        {/* Amenities */}
        <div className="space-y-2">
          <div className="skeleton h-5 w-24" />
          <div className="flex gap-2">
            <div className="skeleton h-8 w-24 rounded-full" />
            <div className="skeleton h-8 w-28 rounded-full" />
            <div className="skeleton h-8 w-20 rounded-full" />
          </div>
        </div>

        {/* About */}
        <div className="space-y-2">
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton h-4 w-4/6" />
        </div>

        {/* Map */}
        <div className="skeleton w-full aspect-video rounded-2xl" />

        {/* Button */}
        <div className="skeleton h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
