import Link from "next/link";
import { Button } from "@/components/ui/button";

type CompanyNameHintProps = {
  companyName: string | null | undefined;
  /** 프로필 조회 중 (안내는 유지하고 살짝 비활성 느낌만 줄 수 있음) */
  loading?: boolean;
};

/**
 * 회사명 미입력 시 견적 출력·보기 화면 상단 안내.
 * 로딩 중에도 표시해 조회 지연 시 빈 화면이 되지 않게 함.
 */
export function CompanyNameHint({ companyName, loading }: CompanyNameHintProps) {
  if (companyName?.trim()) return null;

  return (
    <div
      className={
        "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 " +
        (loading ? "opacity-90" : "")
      }
      role="status"
      aria-busy={loading || undefined}
    >
      <p className="mb-3 leading-relaxed">
        회사명을 입력하면 견적서에 자동 표시됩니다.
      </p>
      <Button asChild size="sm" variant="outline" className="border-amber-400 bg-white">
        <Link href="/settings">회사명 입력하기</Link>
      </Button>
    </div>
  );
}
