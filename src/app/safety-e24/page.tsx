import { SafetyOverview } from "@/components/safety-overview";

const LOCATION_NAMES = ["Endilsbryggja 24"];

export default function SafetyE24Page() {
  return <SafetyOverview title="Öryggisúttekt E24" locationNames={LOCATION_NAMES} />;
}
