"use client";

import { useAuthGuard } from "@/lib/auth/use-auth-guard";
import { OnboardingFlowProvider } from "@/app/onboarding/_components/onboarding-flow-context";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  useAuthGuard("require-auth", { allowOnboardingBypass: true, allowCompanySetupBypass: true });
  return <OnboardingFlowProvider>{children}</OnboardingFlowProvider>;
}
