"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { label: "시공 분야", href: "/onboarding/category" },
  { label: "카테고리", href: "/onboarding/items" },
  { label: "단가", href: "/onboarding/prices" },
  { label: "회사 정보", href: "/onboarding/company" },
];

export function OnboardingProgress({ currentStep }: { currentStep: 1 | 2 | 3 | 4 }) {
  return (
    <div className="w-full min-w-0">
      <ol className="flex w-full min-w-0 flex-wrap items-center gap-x-1 gap-y-2">
        {steps.map((step, index) => {
          const n = index + 1;
          const completed = n < currentStep;
          const current = n === currentStep;
          const canMove = n <= currentStep;
          return (
            <li key={step.href} className="flex min-w-0 max-w-full shrink-0 items-center gap-1.5">
              {canMove ? (
                <Link
                  href={step.href}
                  className="flex min-w-0 max-w-full items-center gap-1.5 rounded-md px-0.5 py-0.5"
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs",
                      completed && "border-indigo-600 bg-indigo-600 text-white",
                      current && "border-indigo-600 text-indigo-600",
                      !completed && !current && "border-gray-300 text-gray-500"
                    )}
                  >
                    {completed ? <Check className="h-3.5 w-3.5" /> : n}
                  </span>
                  <span
                    className={cn(
                      "max-w-[6.5rem] text-xs leading-tight break-words sm:max-w-none sm:text-sm",
                      current ? "font-semibold text-indigo-700" : "text-gray-600"
                    )}
                  >
                    {step.label}
                  </span>
                </Link>
              ) : (
                <div className="flex min-w-0 max-w-full items-center gap-1.5 opacity-60">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500">
                    {n}
                  </span>
                  <span className="max-w-[6.5rem] text-xs leading-tight break-words text-gray-500 sm:max-w-none sm:text-sm">
                    {step.label}
                  </span>
                </div>
              )}
              {index < steps.length - 1 ? (
                <span className="shrink-0 text-gray-300" aria-hidden="true">
                  ·
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
