"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import type { Session } from "@supabase/supabase-js";
import { fetchCompanyByUserId } from "@/lib/company";
import { isOnboardingCompleted } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/client";

type AuthGuardMode = "require-auth" | "redirect-if-authed";
type AuthGuardOptions = {
  allowOnboardingBypass?: boolean;
  allowCompanySetupBypass?: boolean;
};

/**
 * 세션 상태에 따라 자동 리다이렉트.
 * - "require-auth": 세션 없으면 /login으로 이동 (보호된 페이지용)
 * - "redirect-if-authed": 세션 있으면 /quotes로 이동 (로그인 페이지용)
 *
 * onAuthStateChange를 구독하므로 로그아웃·로그인 시 즉시 반영됨.
 */
export function useAuthGuard(mode: AuthGuardMode, options: AuthGuardOptions = {}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const target = mode === "require-auth" ? "/login" : "/quotes";
    let cancelled = false;

    const isOnboardingRoute = pathname.startsWith("/onboarding");
    const isCompanySettingsRoute = pathname === "/settings/company";

    const decide = async (session: Session | null) => {
      if (cancelled) return;
      if (mode === "require-auth" && !session) {
        router.replace(target);
        return;
      }
      if (mode === "redirect-if-authed" && session) {
        const onboardingDone = await isOnboardingCompleted(supabase, session.user.id);
        if (!onboardingDone) {
          router.replace("/onboarding/category");
          return;
        }
        const company = await fetchCompanyByUserId(supabase, session.user.id);
        if (!company) {
          router.replace("/settings/company");
          return;
        }
        router.replace(target);
        return;
      }
      if (mode === "require-auth" && session) {
        if (!options.allowOnboardingBypass && !isOnboardingRoute && pathname !== "/login") {
          const onboardingDone = await isOnboardingCompleted(supabase, session.user.id);
          if (!onboardingDone) {
            router.replace("/onboarding/category");
            return;
          }
        }
        if (
          !options.allowCompanySetupBypass &&
          !isCompanySettingsRoute &&
          !isOnboardingRoute
        ) {
          const company = await fetchCompanyByUserId(supabase, session.user.id);
          if (!company) {
            router.replace("/settings/company");
          }
        }
      }
    };

    supabase.auth.getSession().then(({ data }) => void decide(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void decide(nextSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [mode, options.allowCompanySetupBypass, options.allowOnboardingBypass, pathname, router, supabase]);
}
