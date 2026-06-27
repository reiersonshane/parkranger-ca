import type { Metadata } from "next";
import { MapView } from "@/components/map/MapView";

export const metadata: Metadata = {
  title: "Explore Map",
  description: "Browse parks on an interactive map and discover what's nearby.",
};

export default function MapPage() {
  return <MapView />;
}
