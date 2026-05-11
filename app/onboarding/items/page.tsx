"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SERVICE_CATEGORIES } from "@/lib/onboarding-data";
import { captureEvent } from "@/lib/posthog";
import { OnboardingProgress } from "@/app/onboarding/_components/onboarding-progress";
import { useOnboardingFlow } from "@/app/onboarding/_components/onboarding-flow-context";

export default function OnboardingItemsPage() {
  const router = useRouter();
  const { selectedServiceIds, selectedCategories, setSelectedCategories } = useOnboardingFlow();
  const selectedServices = useMemo(
    () => SERVICE_CATEGORIES.filter((service) => selectedServiceIds.includes(service.id)),
    [selectedServiceIds]
  );
  const [openIds, setOpenIds] = useState<string[]>(selectedServices[0] ? [selectedServices[0].id] : []);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) => (prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]));
  };

  const addCustomCategory = (serviceId: string) => {
    const raw = (customInputs[serviceId] ?? "").trim();
    if (!raw) return;
    setSelectedCategories((prev) => (prev.includes(raw) ? prev : [...prev, raw]));
    setCustomInputs((prev) => ({ ...prev, [serviceId]: "" }));
  };

  if (selectedServiceIds.length === 0) {
    return (
      <main className="mx-auto w-full min-w-0 max-w-3xl p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">먼저 시공 분야를 선택해 주세요.</p>
        <Button className="mt-3" variant="outline" onClick={() => router.replace("/onboarding/category")}>
          1단계로 이동
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <OnboardingProgress currentStep={2} />
      <div>
        <h1 className="text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">
          어떤 카테고리가 견적서에 자주 들어가나요?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">골라주시면 단가표에 자동으로 추가돼요</p>
      </div>

      <div className="space-y-3">
        {selectedServices.map((service) => {
          const opened = openIds.includes(service.id);
          const selectedCount = service.suggestedCategories.filter((name) => selectedCategories.includes(name)).length;
          return (
            <section key={service.id} className="rounded-lg border">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3"
                onClick={() => toggleOpen(service.id)}
              >
                <span className="text-sm font-medium">{service.name}</span>
                <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                  {selectedCount}개 선택
                  <ChevronDown className={`h-4 w-4 transition-transform ${opened ? "rotate-180" : ""}`} />
                </span>
              </button>
              {opened ? (
                <div className="space-y-3 border-t px-4 py-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {service.suggestedCategories.map((category) => {
                      const active = selectedCategories.includes(category);
                      return (
                        <button
                          key={`${service.id}-${category}`}
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className={`rounded-md border px-3 py-2 text-left text-sm ${
                            active ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-300"
                          }`}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      value={customInputs[service.id] ?? ""}
                      onChange={(e) => setCustomInputs((prev) => ({ ...prev, [service.id]: e.target.value }))}
                      placeholder="직접 추가할 카테고리"
                      className="h-9 min-w-[220px] rounded-md border px-3 text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={() => addCustomCategory(service.id)}>
                      직접 추가
                    </Button>
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/onboarding/category")}>
          이전
        </Button>
        <Button
          disabled={selectedCategories.length === 0}
          onClick={() => {
            captureEvent("onboarding_items_selected", { selected_categories_count: selectedCategories.length });
            router.push("/onboarding/prices");
          }}
        >
          다음
        </Button>
      </div>
    </main>
  );
}
