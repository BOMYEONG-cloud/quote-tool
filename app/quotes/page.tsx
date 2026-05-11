"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  EstimateHistoryDialog,
} from "@/components/estimate/estimate-history-dialog";
import { EstimateList } from "@/components/estimate/estimate-list";
import {
  ESTIMATE_STATUS_OPTIONS,
  EstimateStatus,
  EstimateStatusDialog,
} from "@/components/estimate/estimate-status-dialog";
import { Estimate } from "@/components/estimate/types";
import type { EstimateHistory } from "@/components/estimate/types";
import { insertEstimateHistory } from "@/lib/estimate-history";
import { cn } from "@/lib/utils";
import { useAuthGuard } from "@/lib/auth/use-auth-guard";
import { createClient } from "@/lib/supabase/client";

const STATUS_FILTER_ALL = "전체" as const;
const STATUS_FILTERS = [STATUS_FILTER_ALL, ...ESTIMATE_STATUS_OPTIONS] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const filterChipClass: Record<StatusFilter, { active: string; inactive: string }> = {
  전체: {
    active: "border-indigo-600 bg-indigo-600 text-white",
    inactive: "border-gray-300 bg-background text-gray-700 hover:bg-gray-50",
  },
  임시저장: {
    active: "border-gray-700 bg-gray-700 text-white",
    inactive: "border-gray-300 bg-background text-gray-700 hover:bg-gray-50",
  },
  발송됨: {
    active: "border-blue-600 bg-blue-600 text-white",
    inactive: "border-gray-300 bg-background text-gray-700 hover:bg-blue-50",
  },
  보류: {
    active: "border-amber-600 bg-amber-600 text-white",
    inactive: "border-gray-300 bg-background text-gray-700 hover:bg-amber-50",
  },
  수락됨: {
    active: "border-emerald-600 bg-emerald-600 text-white",
    inactive: "border-gray-300 bg-background text-gray-700 hover:bg-emerald-50",
  },
  거절됨: {
    active: "border-red-600 bg-red-600 text-white",
    inactive: "border-gray-300 bg-background text-gray-700 hover:bg-red-50",
  },
};

export default function QuotesPage() {
  useAuthGuard("require-auth");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageTone, setMessageTone] = useState<"neutral" | "success" | "error">("neutral");
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(STATUS_FILTER_ALL);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"updated_desc" | "total_desc" | "total_asc">("updated_desc");

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Estimate | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<Estimate | null>(null);
  const [historyItems, setHistoryItems] = useState<EstimateHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const setErrorMessage = (next: string) => {
    setMessageTone("error");
    setMessage(next);
  };
  const setSuccessMessage = (next: string) => {
    setMessageTone("success");
    setMessage(next);
  };
  const setNeutralMessage = (next: string) => {
    setMessageTone("neutral");
    setMessage(next);
  };

  const fetchEstimates = useCallback(async () => {
    if (!session) {
      setEstimates([]);
      return;
    }

    const { data, error } = await supabase
      .from("estimates")
      .select("*")
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(`목록 조회 실패: ${error.message}`);
      return;
    }

    setEstimates((data ?? []) as Estimate[]);
  }, [session, supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEstimates();
  }, [fetchEstimates]);

  const handleDelete = async (id: string) => {
    const shouldDelete = window.confirm("이 견적을 정말 삭제할까요?");
    if (!shouldDelete) {
      setNeutralMessage("삭제를 취소했습니다.");
      return;
    }

    setLoading(true);
    setNeutralMessage("삭제 중...");

    try {
      const { error } = await supabase.from("estimates").delete().eq("id", id);
      if (error) {
        setErrorMessage(`삭제 실패: ${error.message}`);
        return;
      }
      setSuccessMessage("삭제 성공!");
      await fetchEstimates();
    } catch (e) {
      setErrorMessage(
        `예상치 못한 오류: ${e instanceof Error ? e.message : JSON.stringify(e)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusClick = (item: Estimate) => {
    setStatusTarget(item);
    setStatusDialogOpen(true);
  };

  const handleStatusSubmit = async (nextStatus: EstimateStatus) => {
    if (!statusTarget) return;
    if (nextStatus === statusTarget.status) {
      setStatusDialogOpen(false);
      return;
    }

    setLoading(true);
    setNeutralMessage("상태 변경 중...");
    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from("estimates")
        .update({ status: nextStatus, updated_at: nowIso })
        .eq("id", statusTarget.id);

      if (error) {
        setErrorMessage(`상태 변경 실패: ${error.message}`);
        return;
      }

      const ownerId = session?.user?.id;
      if (ownerId) {
        await insertEstimateHistory({
          supabase,
          quoteId: statusTarget.id,
          ownerId,
          action: "상태 변경",
          note: `상태 변경: ${statusTarget.status} -> ${nextStatus}`,
          snapshot: { from: statusTarget.status, to: nextStatus },
        });
      }

      setStatusDialogOpen(false);
      setSuccessMessage("상태가 변경되었습니다.");
      await fetchEstimates();
    } catch (e) {
      setErrorMessage(
        `예상치 못한 오류: ${e instanceof Error ? e.message : JSON.stringify(e)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const openHistory = async (estimate: Estimate) => {
    setHistoryTarget(estimate);
    setHistoryDialogOpen(true);
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("estimate_histories")
        .select("*")
        .eq("quote_id", estimate.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        setErrorMessage(`히스토리 조회 실패: ${error.message}`);
        setHistoryItems([]);
        return;
      }
      setHistoryItems((data ?? []) as EstimateHistory[]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of estimates) {
      const key = item.status ?? "임시저장";
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [estimates]);

  const visibleEstimates = useMemo(() => {
    const q = searchTerm.trim().toLocaleLowerCase();
    const filteredByStatus =
      statusFilter === STATUS_FILTER_ALL
        ? estimates
        : estimates.filter((item) => item.status === statusFilter);

    const filteredByQuery = !q
      ? filteredByStatus
      : filteredByStatus.filter((item) => {
          const haystack = [
            item.project_name ?? "",
            item.customer_name ?? "",
            item.quote_number ?? "",
          ]
            .join(" ")
            .toLocaleLowerCase();
          return haystack.includes(q);
        });

    const sorted = filteredByQuery.slice();
    if (sortBy === "total_desc") {
      sorted.sort((a, b) => Number(b.total_amount ?? 0) - Number(a.total_amount ?? 0));
      return sorted;
    }
    if (sortBy === "total_asc") {
      sorted.sort((a, b) => Number(a.total_amount ?? 0) - Number(b.total_amount ?? 0));
      return sorted;
    }
    sorted.sort((a, b) => {
      const aUpdated = new Date(a.updated_at ?? a.created_at ?? 0).getTime();
      const bUpdated = new Date(b.updated_at ?? b.created_at ?? 0).getTime();
      return bUpdated - aUpdated;
    });
    return sorted;
  }, [estimates, searchTerm, sortBy, statusFilter]);

  const showEmptyState = Boolean(session) && estimates.length === 0 && messageTone !== "error";
  const showFilteredEmpty =
    Boolean(session) && estimates.length > 0 && visibleEstimates.length === 0;

  const targetLabel = statusTarget
    ? statusTarget.project_name?.trim() || statusTarget.quote_number?.trim() || "선택한 견적"
    : "";

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">견적 목록</h1>
        <Button asChild disabled={!session}>
          <Link href="/quotes/new">새 견적</Link>
        </Button>
      </div>

      {session && estimates.length > 0 ? (
        <>
          <nav className="flex flex-wrap gap-2" aria-label="견적 상태 필터">
            {STATUS_FILTERS.map((filter) => {
              const active = statusFilter === filter;
              const count =
                filter === STATUS_FILTER_ALL ? estimates.length : statusCounts[filter] ?? 0;
              const cls = filterChipClass[filter];
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  aria-pressed={active}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    active ? cls.active : cls.inactive
                  )}
                >
                  {filter}
                  <span
                    className={cn(
                      "ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs",
                      active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              type="search"
              placeholder="현장명, 고객명, 견적번호 검색"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-10 rounded-md border border-gray-300 px-3 text-sm outline-none ring-indigo-500 transition focus:ring-2"
            />
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as "updated_desc" | "total_desc" | "total_asc")
              }
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none ring-indigo-500 transition focus:ring-2"
              aria-label="견적 정렬"
            >
              <option value="updated_desc">최근 업데이트순</option>
              <option value="total_desc">금액 높은순</option>
              <option value="total_asc">금액 낮은순</option>
            </select>
          </div>
        </>
      ) : null}

      {message ? (
        <p
          className={
            messageTone === "error"
              ? "text-sm text-red-600"
              : messageTone === "success"
                ? "text-sm text-green-600"
                : "text-sm text-muted-foreground"
          }
        >
          {message}
        </p>
      ) : null}

      {showEmptyState ? (
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            아직 작성한 견적이 없어요. 아래 시작 버튼으로 운영 준비를 한 번에 진행해보세요.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/quotes/new">새 견적 작성</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/price-items">단가표 등록</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/settings/company">회사 정보 설정</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {showFilteredEmpty ? (
        <p className="text-sm text-muted-foreground">
          {searchTerm.trim()
            ? "검색 조건에 맞는 견적이 없습니다. 검색어를 바꾸거나 상태 필터를 초기화해보세요."
            : statusFilter === STATUS_FILTER_ALL
              ? "표시할 견적이 없습니다."
              : `${statusFilter} 상태의 견적이 없습니다.`}
        </p>
      ) : null}

      <EstimateList
        sessionExists={Boolean(session)}
        loading={loading}
        estimates={visibleEstimates}
        onStartEdit={(item) => router.push(`/quotes/${item.id}`)}
        onDelete={handleDelete}
        onStatusClick={handleStatusClick}
        onOpenHistory={(item) => void openHistory(item)}
      />

      <EstimateStatusDialog
        key={statusTarget ? `${statusTarget.id}-${statusTarget.status}` : "no-target"}
        open={statusDialogOpen}
        onOpenChange={(next) => {
          setStatusDialogOpen(next);
          if (!next) setStatusTarget(null);
        }}
        loading={loading}
        currentStatus={statusTarget?.status ?? ""}
        estimateLabel={targetLabel}
        onSubmit={handleStatusSubmit}
      />

      <EstimateHistoryDialog
        open={historyDialogOpen}
        onOpenChange={(next) => {
          setHistoryDialogOpen(next);
          if (!next) {
            setHistoryTarget(null);
            setHistoryItems([]);
          }
        }}
        title={
          historyTarget
            ? `${historyTarget.project_name?.trim() || "견적"} 수정 히스토리`
            : "수정 히스토리"
        }
        items={historyItems}
        loading={historyLoading}
      />
    </main>
  );
}
