"use client";

import { LandingHero } from "@/components/landing/hero";
import { FeatureSection } from "@/components/landing/feature-section";
import { LandingPricingCta } from "@/components/landing/pricing-cta";
import { LandingMobileFriendlySection } from "@/components/landing/mobile-friendly-section";

/** 비로그인 홈(/) — 세션 리다이렉트는 page.tsx 에서 처리 */
export function LandingPage() {
  return (
    <div className="min-w-0 bg-white text-foreground">
      <LandingHero />

      <FeatureSection
        label="01"
        title="단가 관리"
        description="한 번 등록하면 평생 활용. 시공 분야별로 자주 쓰는 카테고리를 자동으로 셋업해드려요."
        imageSrc="/landing/03-price-items.png"
        imageAlt="단가표 화면"
        imageWidth={1440}
        imageHeight={2200}
      />

      <FeatureSection
        label="02"
        title="빠른 견적 작성"
        description="단가표에서 골라서 5초 만에 항목 추가. 마진율·부가세 자동 계산."
        imageSrc="/landing/01-quote-editor.png"
        imageAlt="견적 작성 화면"
        imageWidth={1440}
        imageHeight={2200}
        reverse
      />

      <FeatureSection
        label="03"
        title="견적서 자동 출력"
        description="정식 견적서 PDF, 카톡용 텍스트, 이미지를 한 번에. 회사 로고·도장 자동 포함."
        imageSrc="/landing/04-quote-preview.png"
        imageAlt="견적서 미리보기"
        imageWidth={1440}
        imageHeight={2200}
      />

      <LandingMobileFriendlySection />

      <LandingPricingCta />
    </div>
  );
}
