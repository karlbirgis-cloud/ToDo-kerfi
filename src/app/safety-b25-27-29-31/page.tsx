import { SafetyOverview } from "@/components/safety-overview";

const LOCATION_NAMES = ["Buðlabryggja 25-27", "Buðlabryggja 29-31"];

export default function SafetyB25Page() {
  return <SafetyOverview title="Öryggisúttekt B25-27 og 29-31" locationNames={LOCATION_NAMES} />;
}
