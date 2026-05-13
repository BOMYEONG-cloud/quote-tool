"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LandingPage } from "@/components/landing/landing-page";

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        router.replace("/quotes");
        return;
      }
      setCheckingSession(false);
    });

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  if (checkingSession) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] w-full min-w-0 items-center justify-center px-4">
        <p className="text-sm text-muted-foreground sm:text-base">불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="min-w-0 flex-1">
      <LandingPage />
    </main>
  );
}
