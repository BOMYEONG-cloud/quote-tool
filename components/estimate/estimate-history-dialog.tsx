"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EstimateHistory } from "@/components/estimate/types";
import { formatHistoryDateTime } from "@/lib/estimate-history";

function actionChipClass(action: string): string {
  if (action === "생성") return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
  if (action === "상태 변경") return "bg-blue-50 text-blue-800 ring-1 ring-blue-200";
  return "bg-gray-100 text-gray-800 ring-1 ring-gray-200";
}

type EstimateHistoryListProps = {
  items: EstimateHistory[];
  loading?: boolean;
  emptyText?: string;
};

export function EstimateHistoryList({
  items,
  loading = false,
  emptyText = "수정 히스토리가 없습니다.",
}: EstimateHistoryListProps) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">히스토리 불러오는 중...</p>;
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((entry) => (
        <li key={entry.id} className="rounded-md border border-border px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${actionChipClass(entry.action)}`}
            >
              {entry.action}
            </span>
            <span className="text-xs text-gray-500 tabular-nums">
              {formatHistoryDateTime(entry.created_at)}
            </span>
          </div>
          {entry.note?.trim() ? (
            <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{entry.note}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

type EstimateHistoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  items: EstimateHistory[];
  loading?: boolean;
};

export function EstimateHistoryDialog({
  open,
  onOpenChange,
  title = "수정 히스토리",
  items,
  loading = false,
}: EstimateHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <EstimateHistoryList items={items} loading={loading} />
      </DialogContent>
    </Dialog>
  );
}
