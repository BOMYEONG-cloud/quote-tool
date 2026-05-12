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
      <ol
        className="grid w-full min-w-0 grid-cols-4 gap-2"
        aria-label="온보딩 진행 단계"
      >
        {steps.map((step, index) => {
          const n = index + 1;
          const completed = n < currentStep;
          const current = n === currentStep;
          const canMove = n <= currentStep;
          const circle = (
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                completed && "border-indigo-600 bg-indigo-600 text-white",
                current && "border-indigo-600 bg-white text-indigo-600",
                !completed && !current && "border-gray-300 bg-white text-gray-400"
              )}
              aria-hidden="true"
            >
              {completed ? <Check className="h-4 w-4" /> : n}
            </span>
          );
          const label = (
            <span
              className={cn(
                "line-clamp-2 w-full text-center text-sm leading-snug sm:text-base",
                completed && "font-semibold text-gray-900",
                current && "font-semibold text-indigo-700",
                !completed && !current && "font-normal text-gray-500"
              )}
            >
              {step.label}
            </span>
          );
          return (
            <li
              key={step.href}
              className="min-w-0"
              aria-current={current ? "step" : undefined}
            >
              {canMove ? (
                <Link
                  href={step.href}
                  className="flex w-full min-w-0 flex-col items-center gap-0.5 rounded-md px-0.5 py-0 text-center outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {circle}
                  {label}
                </Link>
              ) : (
                <div className="flex w-full min-w-0 flex-col items-center gap-0.5 rounded-md px-0.5 py-0 text-center opacity-60">
                  {circle}
                  {label}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
