"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type AuthGuardMode = "require-auth" | "redirect-if-authed";

/**
 * 세션 상태에 따라 자동 리다이렉트.
 * - "require-auth": 세션 없으면 /login으로 이동 (보호된 페이지용)
 * - "redirect-if-authed": 세션 있으면 /quotes로 이동 (로그인 페이지용)
 *
 * onAuthStateChange를 구독하므로 로그아웃·로그인 시 즉시 반영됨.
 */
export function useAuthGuard(mode: AuthGuardMode) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    const target = mode === "require-auth" ? "/login" : "/quotes";
    let cancelled = false;

    const decide = (session: Session | null) => {
      if (cancelled) return;
      if (mode === "require-auth" && !session) {
        router.replace(target);
      } else if (mode === "redirect-if-authed" && session) {
        router.replace(target);
      }
    };

    supabase.auth.getSession().then(({ data }) => decide(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => decide(nextSession));

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [mode, router, supabase]);
}
