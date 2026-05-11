"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SERVICE_CATEGORIES } from "@/lib/onboarding-data";
import { captureEvent } from "@/lib/posthog";
import { OnboardingProgress } from "@/app/onboarding/_components/onboarding-progress";
import { useOnboardingFlow } from "@/app/onboarding/_components/onboarding-flow-context";

export default function OnboardingCategoryPage() {
  const router = useRouter();
  const { selectedServiceIds, setSelectedServiceIds } = useOnboardingFlow();

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <OnboardingProgress currentStep={1} />
      </div>

      <div>
        <h1 className="text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">
          어떤 시공 일을 하시나요?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">여러 개 선택할 수 있어요</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SERVICE_CATEGORIES.map((service) => {
          const active = selectedServiceIds.includes(service.id);
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => toggleService(service.id)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left ${
                active ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300 bg-white text-gray-800"
              }`}
            >
              <span className="text-sm font-medium">{service.name}</span>
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${active ? "border-white" : "border-gray-400"}`}>
                {active ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button
          disabled={selectedServiceIds.length === 0}
          onClick={() => {
            captureEvent("onboarding_category_selected", { selected_service_ids: selectedServiceIds });
            router.push("/onboarding/items");
          }}
        >
          다음
        </Button>
      </div>
    </main>
  );
}
