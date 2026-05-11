"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OnboardingProgress } from "@/app/onboarding/_components/onboarding-progress";
import { type OnboardingPriceItem, useOnboardingFlow } from "@/app/onboarding/_components/onboarding-flow-context";
import { captureEvent } from "@/lib/posthog";

const UNIT_OPTIONS = ["식", "평", "m²", "m", "개", "kg", "L", "통", "박스", "시간", "일"];

type DraftInput = { name: string; unit: string; price: string };

export default function OnboardingPricesPage() {
  const router = useRouter();
  const { selectedCategories, pricesByCategory, setPricesByCategory } = useOnboardingFlow();
  const [drafts, setDrafts] = useState<Record<string, DraftInput>>({});

  const categories = useMemo(() => Array.from(new Set(selectedCategories)), [selectedCategories]);

  const addItem = (category: string) => {
    const draft = drafts[category] ?? { name: "", unit: "식", price: "" };
    const name = draft.name.trim();
    if (!name) return;
    const next: OnboardingPriceItem = {
      id: `${category}-${Date.now()}`,
      name,
      unit: draft.unit || "식",
      price: draft.price.trim(),
    };
    setPricesByCategory((prev) => ({
      ...prev,
      [category]: [...(prev[category] ?? []), next],
    }));
    setDrafts((prev) => ({ ...prev, [category]: { name: "", unit: draft.unit || "식", price: "" } }));
  };

  const removeItem = (category: string, id: string) => {
    setPricesByCategory((prev) => ({
      ...prev,
      [category]: (prev[category] ?? []).filter((item) => item.id !== id),
    }));
  };

  if (categories.length === 0) {
    return (
      <main className="mx-auto w-full min-w-0 max-w-3xl p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">먼저 카테고리를 선택해 주세요.</p>
        <Button className="mt-3" variant="outline" onClick={() => router.replace("/onboarding/items")}>
          2단계로 이동
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <OnboardingProgress currentStep={3} />
      <div>
        <h1 className="text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">
          각 카테고리에 항목을 추가해보세요
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">단가는 비워두셔도 OK. 나중에 채울 수 있어요.</p>
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          const items = pricesByCategory[category] ?? [];
          const draft = drafts[category] ?? { name: "", unit: "식", price: "" };
          return (
            <section key={category} className="rounded-lg border p-4">
              <h2 className="text-base font-semibold text-gray-900">{category}</h2>
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_140px_140px_auto]">
                <input
                  value={draft.name}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [category]: { ...draft, name: e.target.value } }))
                  }
                  placeholder="항목명"
                  className="h-10 rounded-md border px-3 text-sm"
                />
                <select
                  value={draft.unit}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [category]: { ...draft, unit: e.target.value } }))
                  }
                  className="h-10 rounded-md border px-3 text-sm"
                >
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                <input
                  value={draft.price}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [category]: { ...draft, price: e.target.value } }))
                  }
                  placeholder="단가"
                  inputMode="numeric"
                  className="h-10 rounded-md border px-3 text-sm"
                />
                <Button size="sm" onClick={() => addItem(category)}>
                  추가
                </Button>
              </div>
              <ul className="mt-3 space-y-2">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
                    <span>
                      {item.name} · {item.unit} · {item.price ? `${Number(item.price).toLocaleString()}원` : "단가 미입력"}
                    </span>
                    <button className="text-xs text-red-600" onClick={() => removeItem(category, item.id)}>
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/onboarding/items")}>
          이전
        </Button>
        <Button
          onClick={() => {
            const totalItems = Object.values(pricesByCategory).reduce((acc, list) => acc + list.length, 0);
            captureEvent("onboarding_prices_entered", { total_items: totalItems });
            router.push("/onboarding/company");
          }}
        >
          다음
        </Button>
      </div>
    </main>
  );
}
