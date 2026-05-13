"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useAuthGuard } from "@/lib/auth/use-auth-guard";
import { OnboardingFlowProvider } from "@/app/onboarding/_components/onboarding-flow-context";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  useAuthGuard("require-auth", { allowOnboardingBypass: true, allowCompanySetupBypass: true });
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.replace("/login");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <OnboardingFlowProvider>
      <div className="border-b border-border/80 bg-muted/40">
        <div className="mx-auto flex max-w-6xl items-center justify-end px-4 py-2 sm:px-5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-muted-foreground"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
          >
            {signingOut ? "로그아웃 중…" : "로그아웃"}
          </Button>
        </div>
      </div>
      {children}
    </OnboardingFlowProvider>
  );
}
