import type { MetadataRoute } from "next";

const BASE_URL = "https://parkranger.ca";

// Seed parks — expand when more are added to the DB
const SEED_PLACE_IDS = [
  "ChIJNWPHfHFzhlQRFJBGFhGEEn0", // Trout Lake Park
  "ChIJdV-JjjdzhlQRJr7BWXW8nZA", // Stanley Park
  "ChIJI7R9fklzhlQRK6p5i0XDzqo", // Queen Elizabeth Park
  "ChIJi5oIvmRzhlQRRE_igYWJtFM", // Jericho Beach Park
  "ChIJfx3BKFF0hlQRSxIEMcJn3Hs", // Kitsilano Beach Park
  "ChIJ-TCRRsVzhlQRqt_jZtXRwRE", // Strathcona Park
  "ChIJo9r3WFl0hlQRsyXJ7YNAh0M", // Vanier Park
  "ChIJFVJz05JzhlQRbNDpKi-7L0E", // Hastings Park
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/map`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/search`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...SEED_PLACE_IDS.map((id) => ({
      url: `${BASE_URL}/parks/${id}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
