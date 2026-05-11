"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { identifyUser, initPostHog, resetPostHog } from "@/lib/posthog";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    initPostHog();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      identifyUser(user.id, user.email ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        identifyUser(session.user.id, session.user.email ?? null);
      } else {
        resetPostHog();
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  return <>{children}</>;
}
