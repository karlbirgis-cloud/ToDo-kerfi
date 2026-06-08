import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Verklisti bygginga",
    short_name: "Verklisti",
    description: "Sjónrænt verklista- og úttektarkerfi fyrir byggingar.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f4f5f7",
    theme_color: "#17202a",
    icons: []
  };
}
