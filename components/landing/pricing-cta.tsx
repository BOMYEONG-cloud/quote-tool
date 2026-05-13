"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLandingReveal } from "@/components/landing/use-landing-reveal";

export function LandingPricingCta() {
  const { ref, visible } = useLandingReveal("0px 0px -5% 0px", 0.1);

  return (
    <section
      ref={ref}
      className={cn(
        "mx-auto w-full max-w-6xl px-4 py-20 sm:px-5 md:py-28 lg:px-6",
        "transition-all duration-500 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      )}
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold tracking-wide text-[#4F46E5]">지금 베타 진행 중</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
          무료로 사용해보세요
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          신용카드 필요 없습니다. 가입 후 바로 시작.
        </p>
        <div className="mt-10 flex justify-center sm:mt-12">
          <Button
            asChild
            size="lg"
            className="h-12 min-w-[12rem] rounded-lg bg-[#4F46E5] px-8 text-base font-semibold text-white shadow-sm hover:bg-[#4338CA] sm:h-14 sm:min-w-[14rem] sm:text-lg"
          >
            <Link href="/login">무료로 시작하기 →</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
