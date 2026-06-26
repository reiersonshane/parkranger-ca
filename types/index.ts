// ─── Google Places ────────────────────────────────────────────────────────────

export interface GoogleParkPhoto {
  name: string;
  widthPx: number;
  heightPx: number;
  authorAttributions: { displayName: string; uri: string }[];
}

export interface GoogleParkHours {
  openNow: boolean;
  periods?: {
    open:  { day: number; hour: number; minute: number };
    close: { day: number; hour: number; minute: number };
  }[];
  weekdayDescriptions?: string[];
}

export interface GooglePark {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  location: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  currentOpeningHours?: GoogleParkHours;
  regularOpeningHours?: GoogleParkHours;
  photos?: GoogleParkPhoto[];
  types?: string[];
  editorialSummary?: { text: string };
  websiteUri?: string;
  nationalPhoneNumber?: string;
  amenities?: ParkAmenity[];
}

// ─── Amenities ────────────────────────────────────────────────────────────────

export type AmenityKey =
  | "washroom"
  | "dog_friendly"
  | "sports_field"
  | "playground"
  | "picnic"
  | "water_fountain"
  | "parking"
  | "transit"
  | "shade"
  | "beach";

export interface ParkAmenity {
  key: AmenityKey;
  label: string;
  icon: string;
}

// ─── Community (our DB) ───────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface CheckIn {
  id: string;
  park_id: string;
  user_id: string;
  note: string | null;
  created_at: string;
  expires_at: string;
  user?: UserProfile;
}

export interface ParkEvent {
  id: string;
  park_id: string;
  created_by: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  recurrence: "none" | "daily" | "weekly";
  created_at: string;
  creator?: UserProfile;
}

export interface ParkTip {
  id: string;
  park_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author?: UserProfile;
}

export interface SavedPark {
  user_id: string;
  google_place_id: string;
  saved_at: string;
}

// ─── Composed types ───────────────────────────────────────────────────────────

export interface ParkDetail {
  google: GooglePark;
  checkins: CheckIn[];
  checkinCount: number;
  events: ParkEvent[];
  tips: ParkTip[];
  isSaved?: boolean;
  isCheckedIn?: boolean;
}

export interface ParkSummary {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  ratingCount?: number;
  photoUrl?: string;
  location: { lat: number; lng: number };
  amenities: ParkAmenity[];
  checkinCount?: number;
  isOpen?: boolean;
}

// ─── API Response shapes ──────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: { message: string; code?: string };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
