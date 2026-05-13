"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLandingReveal } from "@/components/landing/use-landing-reveal";

export function LandingMobileFriendlySection() {
  const { ref, visible } = useLandingReveal();

  return (
    <section
      ref={ref}
      className={cn(
        "mx-auto w-full max-w-6xl px-4 py-20 sm:px-5 md:py-24 lg:px-6",
        "transition-all duration-500 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      )}
    >
      <div className="mx-auto max-w-2xl text-center md:max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          현장에서도 견적 작성
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:mt-4 sm:text-lg">
          모바일에서도 동일한 기능을 사용할 수 있어요.
        </p>
      </div>
      <div className="mx-auto mt-10 max-w-md sm:mt-12 md:max-w-lg">
        <div className="overflow-hidden rounded-[12px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] ring-1 ring-black/5">
          <Image
            src="/landing/05-mobile.png"
            alt="모바일 견적 목록 화면"
            width={430}
            height={932}
            sizes="(max-width: 768px) 100vw, 28rem"
            className="h-auto w-full object-cover object-top"
          />
        </div>
      </div>
    </section>
  );
}
