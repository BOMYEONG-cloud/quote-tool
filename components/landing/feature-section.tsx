"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLandingReveal } from "@/components/landing/use-landing-reveal";

type FeatureSectionProps = {
  label: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  /** 가로형 캡처 기준 내재 비율 (Next Image 용) */
  imageWidth: number;
  imageHeight: number;
  reverse?: boolean;
};

export function FeatureSection({
  label,
  title,
  description,
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  reverse,
}: FeatureSectionProps) {
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
      <div
        className={cn(
          "grid items-center gap-10 md:grid-cols-2 md:gap-14 lg:gap-16",
          reverse && "md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1"
        )}
      >
        <div className="min-w-0 space-y-3 md:space-y-4">
          <p className="text-sm font-medium tracking-wide text-muted-foreground">{label}</p>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
            {title}
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        </div>

        <div className="min-w-0 w-full">
          <div className="overflow-hidden rounded-[12px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] ring-1 ring-black/5">
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={imageWidth}
              height={imageHeight}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="h-auto w-full object-cover object-top"
              priority={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
