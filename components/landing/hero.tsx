"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-24 sm:px-5 sm:pb-20 sm:pt-28 md:pt-32 lg:px-6">
      <div className="landing-page-enter mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-semibold leading-[1.2] tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-[2.75rem] lg:leading-[1.15]">
          단가 한 번 등록,
          <br />
          견적은 1분 만에
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
          시공 사장님을 위한 견적 도구. PDF·카톡·이미지로 즉시 발송할 수 있어요.
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

      <div className="mx-auto mt-14 max-w-[min(100%,90vw)] sm:mt-16 md:mt-20 lg:max-w-[90%]">
        <div className="overflow-hidden rounded-[12px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] ring-1 ring-black/5">
          <Image
            src="/landing/01-quote-editor.png"
            alt="견적 작성 화면"
            width={1440}
            height={2200}
            sizes="(max-width: 768px) 100vw, 90vw"
            className="h-auto w-full object-cover object-top"
            priority
          />
        </div>
      </div>
    </section>
  );
}
