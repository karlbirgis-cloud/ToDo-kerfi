"use client";

import Link from "next/link";
import { Building2, ClipboardList, FolderKanban, Layers3, MapPinned, Settings2, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, PageHeader } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";

const adminLinks = [
  { href: "/admin/projects", label: "Verkefni", icon: FolderKanban },
  { href: "/admin/locations", label: "Götur", icon: MapPinned },
  { href: "/admin/units", label: "Íbúðir / rými", icon: Layers3 },
  { href: "/admin/categories", label: "Flokkar", icon: Settings2 },
  { href: "/admin/inspection-types", label: "Tegund úttektarlista", icon: ClipboardList },
  { href: "/admin/users", label: "Notendur", icon: UsersRound },
  { href: "/admin/responsible-parties", label: "Ábyrgðaraðilar", icon: Building2 }
];

export default function AdminPage() {
  const { data, resetDemoData } = useAppData();
  return (
    <AppShell>
      <PageHeader title="Admin" kicker="Kerfisstillingar" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
        {adminLinks.map((item) => {
          const Icon = item.icon;
          return <Link key={item.href} href={item.href}><Card className="h-full transition hover:border-slate-400"><Icon className="mb-3 h-6 w-6 text-blueprint" /><h2 className="font-bold">{item.label}</h2></Card></Link>;
        })}
      </div>
      <Card className="mt-6">
        <h2 className="font-bold">Virkni kerfisins</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          <Metric label="Verkefni" value={data.projects.length} />
          <Metric label="Rými" value={data.units.length} />
          <Metric label="Atriði" value={data.tasks.length} />
          <Metric label="Notendur" value={data.profiles.length} />
          <Metric label="Ábyrgðaraðilar" value={data.responsible_parties.length} />
        </div>
        <button onClick={resetDemoData} className="touch-target mt-4 rounded-md border border-slate-300 px-4 text-sm font-bold">Endurstilla demo gögn</button>
      </Card>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-md bg-slate-50 p-3"><p className="text-2xl font-bold">{value}</p><p className="text-sm text-slate-500">{label}</p></div>;
}
