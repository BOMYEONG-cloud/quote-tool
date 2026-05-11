import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { CompanyRow } from "@/lib/company";

type CompanyNameHintProps = {
  company: CompanyRow | null;
  loading?: boolean;
};

/**
 * companies 행이 없을 때 견적 출력·보기 화면 상단 안내.
 */
export function CompanyNameHint({ company, loading }: CompanyNameHintProps) {
  if (company !== null) return null;

  return (
    <div
      className={
        "min-w-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950 " +
        (loading ? "opacity-90" : "")
      }
      role="status"
      aria-busy={loading || undefined}
    >
      <p className="mb-3 leading-relaxed">
        회사 정보를 등록하면 견적서에 사업자 정보가 표시됩니다.
      </p>
      <Button asChild size="sm" variant="outline" className="border-amber-400 bg-white">
        <Link href="/settings/company">회사 정보 등록</Link>
      </Button>
    </div>
  );
}
