"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Estimate } from "@/components/estimate/types";
import { formatHistoryDateTime } from "@/lib/estimate-history";
import { cn } from "@/lib/utils";

type EstimateListProps = {
  sessionExists: boolean;
  loading: boolean;
  estimates: Estimate[];
  onStartEdit: (item: Estimate) => void;
  onDelete: (id: string) => Promise<void>;
  onStatusClick?: (item: Estimate) => void;
  onOpenHistory?: (item: Estimate) => void;
};

const statusBadgeClass: Record<string, string> = {
  임시저장: "bg-gray-100 text-gray-800 ring-1 ring-gray-200",
  발송됨: "bg-blue-50 text-blue-800 ring-1 ring-blue-200",
  보류: "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
  수락됨: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  거절됨: "bg-red-50 text-red-800 ring-1 ring-red-200",
};

function StatusBadge({
  status,
  onClick,
  disabled,
}: {
  status: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const cls = statusBadgeClass[status] ?? "bg-gray-100 text-gray-800 ring-1 ring-gray-200";
  const baseCls =
    "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium";

  if (!onClick) {
    return <span className={cn(baseCls, cls)}>{status}</span>;
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={`${status} 상태 변경`}
      className={cn(
        baseCls,
        cls,
        "cursor-pointer transition-shadow hover:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
      )}
    >
      {status}
    </button>
  );
}

export function EstimateList({
  sessionExists,
  loading,
  estimates,
  onStartEdit,
  onDelete,
  onStatusClick,
  onOpenHistory,
}: EstimateListProps) {
  return (
    <section className="w-full max-w-2xl">
      {!sessionExists ? (
        <p className="text-sm text-muted-foreground">로그인 후 견적 목록을 확인할 수 있습니다.</p>
      ) : estimates.length === 0 ? null : (
        <>
          <p className="mb-2 text-xs text-gray-500">검색 결과 {estimates.length}건</p>
          <ul className="space-y-2">
            {estimates.map((item) => {
            const customerLabel = item.customer_name?.trim() ?? "";
            const siteSubLabel = item.site_name?.trim() ?? "";
            const subInfoParts = [customerLabel, siteSubLabel].filter((value) => value.length > 0);

            return (
              <li key={item.id}>
                <Card>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge
                        status={item.status}
                        disabled={loading}
                        onClick={onStatusClick ? () => onStatusClick(item) : undefined}
                      />
                      <span className="text-xs text-gray-500 tabular-nums">
                        {item.quote_number?.trim() ? item.quote_number : "견적번호 미입력"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="min-w-0 flex-1 text-base font-semibold leading-snug text-gray-900 sm:text-lg">
                        {item.project_name?.trim() || "현장명 미입력"}
                      </p>
                      <span className="shrink-0 text-base font-bold tabular-nums text-indigo-600 sm:text-lg">
                        {Number(item.total_amount || 0).toLocaleString()}원
                      </span>
                    </div>

                    {subInfoParts.length > 0 ? (
                      <p className="text-sm text-gray-600">{subInfoParts.join(" · ")}</p>
                    ) : null}

                    <Separator />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {onOpenHistory ? (
                        <button
                          type="button"
                          onClick={() => onOpenHistory(item)}
                          className="text-xs text-gray-500 underline-offset-2 hover:underline tabular-nums"
                        >
                          최근 업데이트 {formatHistoryDateTime(item.updated_at)}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500 tabular-nums">
                          최근 업데이트 {formatHistoryDateTime(item.updated_at)}
                        </span>
                      )}
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button asChild variant="default" size="sm">
                          <Link href={`/quotes/${item.id}/preview`}>견적서 보기</Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={loading}
                          onClick={() => onStartEdit(item)}
                        >
                          수정
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={loading}
                          onClick={() => onDelete(item.id)}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
