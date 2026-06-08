"use client";

import { useRouter } from "next/navigation";
import { HardHat, LogIn } from "lucide-react";
import { Button, Card } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-ink text-white"><HardHat className="h-6 w-6" /></span>
          <div>
            <h1 className="text-2xl font-bold text-ink">Verklisti</h1>
            <p className="text-sm text-slate-500">Innskráning fyrir byggingarverkefni</p>
          </div>
        </div>
        <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); router.push("/dashboard"); }}>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Netfang
            <input type="email" defaultValue="jon@example.com" className="touch-target rounded-md border border-slate-300 px-3 outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Lykilorð
            <input type="password" defaultValue="demo-demo" className="touch-target rounded-md border border-slate-300 px-3 outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20" />
          </label>
          <Button><LogIn className="h-4 w-4" /> Skrá inn</Button>
        </form>
      </Card>
    </main>
  );
}
