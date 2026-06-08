"use client";

import { useRouter } from "next/navigation";
import { HardHat, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && session) router.replace("/dashboard");
  }, [isLoading, session, router]);

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
        <form
          className="grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!supabase) {
              router.push("/dashboard");
              return;
            }

            setError("");
            setIsSubmitting(true);
            const form = new FormData(event.currentTarget);
            const email = String(form.get("email"));
            const password = String(form.get("password"));
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            setIsSubmitting(false);

            if (signInError) {
              setError("Netfang eða lykilorð er rangt.");
              return;
            }

            router.replace("/dashboard");
          }}
        >
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Netfang
            <input name="email" type="email" autoComplete="email" className="touch-target rounded-md border border-slate-300 px-3 outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20" required />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Lykilorð
            <input name="password" type="password" autoComplete="current-password" className="touch-target rounded-md border border-slate-300 px-3 outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20" required />
          </label>
          {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
          <Button disabled={isSubmitting}><LogIn className="h-4 w-4" /> {isSubmitting ? "Skrái inn..." : "Skrá inn"}</Button>
        </form>
      </Card>
    </main>
  );
}
