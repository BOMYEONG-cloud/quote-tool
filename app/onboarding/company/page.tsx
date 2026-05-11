"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { insertOnboardingPriceItems, setOnboardingCompleted } from "@/lib/onboarding";
import { captureEvent } from "@/lib/posthog";
import { upsertCompanyForUser } from "@/lib/company";
import { OnboardingProgress } from "@/app/onboarding/_components/onboarding-progress";
import { useOnboardingFlow } from "@/app/onboarding/_components/onboarding-flow-context";

export default function OnboardingCompanyPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { pricesByCategory, companyDraft, setCompanyDraft } = useOnboardingFlow();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  const collectedItems = useMemo(
    () =>
      Object.entries(pricesByCategory).flatMap(([category, items]) =>
        items.map((item) => ({
          category,
          item_name: item.name,
          unit: item.unit,
          customer_price: item.price.trim() ? Number(item.price) : null,
        }))
      ),
    [pricesByCategory]
  );

  const finalize = async () => {
    setLoading(true);
    setMessage("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        setMessage("로그인이 필요합니다.");
        return;
      }
      await insertOnboardingPriceItems(supabase, userId, collectedItems);
      if (!companyDraft.business_name.trim()) {
        setMessage("회사명은 필수입니다.");
        return;
      }
      await upsertCompanyForUser(supabase, userId, {
        business_name: companyDraft.business_name,
        representative_name: companyDraft.representative_name || null,
        business_number: companyDraft.business_number || null,
        address: companyDraft.address || null,
        phone: companyDraft.phone || null,
        email: companyDraft.email || null,
      });
      await setOnboardingCompleted(supabase, userId, true);
      captureEvent("onboarding_company_submitted", { has_company_name: true });
      captureEvent("onboarding_completed");
      setMessage("온보딩 완료! 첫 견적을 만들어보세요");
      router.replace("/quotes");
    } catch (e) {
      setMessage(`완료 처리 중 오류: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <OnboardingProgress currentStep={4} />
      <div>
        <h1 className="text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">
          마지막이에요. 회사 정보를 입력해주세요
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          회사명만 필수예요. 나머지는 나중에 채울 수 있어요.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border p-4">
        <input
          value={companyDraft.business_name}
          onChange={(e) => setCompanyDraft((prev) => ({ ...prev, business_name: e.target.value }))}
          placeholder="회사명(필수)"
          className="h-10 rounded-md border px-3 text-sm"
        />
        <input
          value={companyDraft.representative_name}
          onChange={(e) => setCompanyDraft((prev) => ({ ...prev, representative_name: e.target.value }))}
          placeholder="대표자명"
          className="h-10 rounded-md border px-3 text-sm"
        />
        <input
          value={companyDraft.business_number}
          onChange={(e) => setCompanyDraft((prev) => ({ ...prev, business_number: e.target.value }))}
          placeholder="사업자등록번호"
          className="h-10 rounded-md border px-3 text-sm"
        />
        <input
          value={companyDraft.address}
          onChange={(e) => setCompanyDraft((prev) => ({ ...prev, address: e.target.value }))}
          placeholder="주소"
          className="h-10 rounded-md border px-3 text-sm"
        />
        <input
          value={companyDraft.phone}
          onChange={(e) => setCompanyDraft((prev) => ({ ...prev, phone: e.target.value }))}
          placeholder="연락처"
          className="h-10 rounded-md border px-3 text-sm"
        />
        <input
          value={companyDraft.email}
          onChange={(e) => setCompanyDraft((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="이메일"
          className="h-10 rounded-md border px-3 text-sm"
        />
        <p className="text-xs text-muted-foreground">로고/도장은 나중에 설정의 회사 정보에서 업로드할 수 있어요.</p>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => router.push("/onboarding/prices")} disabled={loading}>
          이전
        </Button>
        <Button disabled={loading || companyDraft.business_name.trim().length < 1} onClick={() => void finalize()}>
          완료
        </Button>
      </div>
    </main>
  );
}
