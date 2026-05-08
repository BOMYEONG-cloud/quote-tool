"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const ESTIMATE_STATUS_OPTIONS = [
  "임시저장",
  "발송됨",
  "보류",
  "수락됨",
  "거절됨",
] as const;

export type EstimateStatus = (typeof ESTIMATE_STATUS_OPTIONS)[number];

const statusOptionClass: Record<EstimateStatus, string> = {
  임시저장: "ring-gray-200 hover:bg-gray-50 data-[active=true]:bg-gray-100 data-[active=true]:ring-gray-400",
  발송됨: "ring-blue-200 hover:bg-blue-50 data-[active=true]:bg-blue-50 data-[active=true]:ring-blue-400",
  보류: "ring-amber-200 hover:bg-amber-50 data-[active=true]:bg-amber-50 data-[active=true]:ring-amber-400",
  수락됨: "ring-emerald-200 hover:bg-emerald-50 data-[active=true]:bg-emerald-50 data-[active=true]:ring-emerald-400",
  거절됨: "ring-red-200 hover:bg-red-50 data-[active=true]:bg-red-50 data-[active=true]:ring-red-400",
};

type EstimateStatusDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  currentStatus: string;
  estimateLabel?: string;
  onSubmit: (nextStatus: EstimateStatus) => void | Promise<void>;
};

export function EstimateStatusDialog({
  open,
  onOpenChange,
  loading,
  currentStatus,
  estimateLabel,
  onSubmit,
}: EstimateStatusDialogProps) {
  const [selected, setSelected] = useState<EstimateStatus>(() => {
    return (ESTIMATE_STATUS_OPTIONS as readonly string[]).includes(currentStatus)
      ? (currentStatus as EstimateStatus)
      : "임시저장";
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-[calc(100%-1.5rem)] max-w-md flex-col gap-0 overflow-hidden p-0"
      >
        <div className="shrink-0 border-b border-border px-5 py-4">
          <DialogTitle>견적 상태 변경</DialogTitle>
          <DialogDescription className="mt-1 truncate">
            {estimateLabel ? `${estimateLabel} ` : ""}새 상태를 선택하세요.
          </DialogDescription>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div role="radiogroup" aria-label="상태 옵션" className="grid grid-cols-1 gap-2">
            {ESTIMATE_STATUS_OPTIONS.map((option) => {
              const active = selected === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  data-active={active}
                  onClick={() => setSelected(option)}
                  className={cn(
                    "flex items-center justify-between rounded-md bg-background px-4 py-3 text-base font-medium ring-1 transition-colors",
                    statusOptionClass[option]
                  )}
                >
                  <span>{option}</span>
                  {active ? (
                    <span className="text-sm font-medium text-indigo-600">선택됨</span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-600">
            <p className="flex items-center gap-2 font-medium text-gray-700">
              <Send className="h-4 w-4" />
              알림톡 발송
            </p>
            <p className="mt-1 text-xs text-gray-500">
              상태 변경과 함께 고객에게 알림톡을 보내는 기능은 곧 제공됩니다.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-background px-5 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="border-gray-300 text-gray-700"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            disabled={loading || selected === currentStatus}
            onClick={() => void onSubmit(selected)}
          >
            {loading ? "저장 중..." : "상태 저장"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
