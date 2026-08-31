import { DeliveryOverview } from "@/components/delivery-overview";

const LOCATION_NAMES = ["Buðlabryggja 25-27", "Buðlabryggja 29-31"];

export default function DeliveryCombinedPage() {
  return (
    <DeliveryOverview
      locationLabel="B25-27 og B29-31"
      locationNames={LOCATION_NAMES}
      title="B25-27 og B29-31"
    />
  );
}
