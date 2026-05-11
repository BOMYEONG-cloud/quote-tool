"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EditableQuoteItem, QuoteItemList } from "@/components/estimate/quote-item-list";
import { cn } from "@/lib/utils";

export type StepState = "completed" | "current" | "pending";

export type Step = {
  number: number;
  label: string;
  state: StepState;
};

type QuoteStepsProps = {
  steps: Step[];
  onStepSelect?: (step: number) => void;
};

export function QuoteSteps({ steps, onStepSelect }: QuoteStepsProps) {
  return (
    <ol
      className="grid w-full min-w-0 grid-cols-3 gap-2"
      aria-label="견적 작성 진행 단계"
    >
      {steps.map((step) => (
        <li key={step.number} className="min-w-0" aria-current={step.state === "current" ? "step" : undefined}>
          <button
            type="button"
            className="flex w-full min-w-0 flex-col items-center gap-1 rounded-md px-0.5 py-1 text-center outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onStepSelect?.(step.number)}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                step.state === "completed" && "border-indigo-600 bg-indigo-600 text-white",
                step.state === "current" && "border-indigo-600 bg-white text-indigo-600",
                step.state === "pending" && "border-gray-300 bg-white text-gray-400"
              )}
              aria-hidden="true"
            >
              {step.state === "completed" ? <Check className="h-4 w-4" /> : step.number}
            </span>
            <span
              className={cn(
                "line-clamp-2 w-full text-xs leading-snug sm:text-sm",
                step.state === "completed" && "font-semibold text-gray-900",
                step.state === "current" && "font-semibold text-indigo-700",
                step.state === "pending" && "font-normal text-gray-500"
              )}
            >
              {step.label}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

type SiteInfoSectionProps = {
  sessionExists: boolean;
  statusLocked?: boolean;
  quoteNumber: string;
  customerName: string;
  projectName: string;
  siteName: string;
  constructionType: string;
  validityDays: string;
  issuedDate: string;
  status: string;
  onQuoteNumberChange: (value: string) => void;
  onCustomerNameChange: (value: string) => void;
  onProjectNameChange: (value: string) => void;
  onSiteNameChange: (value: string) => void;
  onConstructionTypeChange: (value: string) => void;
  onValidityDaysChange: (value: string) => void;
  onIssuedDateChange: (value: string) => void;
  onStatusChange: (value: string) => void;
};

export function SiteInfoSection({
  sessionExists,
  statusLocked = false,
  quoteNumber,
  customerName,
  projectName,
  siteName,
  constructionType,
  validityDays,
  issuedDate,
  status,
  onQuoteNumberChange,
  onCustomerNameChange,
  onProjectNameChange,
  onSiteNameChange,
  onConstructionTypeChange,
  onValidityDaysChange,
  onIssuedDateChange,
  onStatusChange,
}: SiteInfoSectionProps) {
  return (
    <section className="space-y-4" aria-labelledby="quote-section-site">
      <h3 id="quote-section-site" className="text-base font-semibold text-gray-900">
        현장 정보
      </h3>
      <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customerName">
              고객명 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              placeholder="예: 홍길동"
              disabled={!sessionExists}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectName">
              현장명 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              placeholder="예: 가나다로 12"
              disabled={!sessionExists}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteName">세부 현장명</Label>
            <Input
              id="siteName"
              value={siteName}
              onChange={(e) => onSiteNameChange(e.target.value)}
              placeholder="예: A동 2층"
              disabled={!sessionExists}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="constructionType">시공 종류</Label>
            <Input
              id="constructionType"
              value={constructionType}
              onChange={(e) => onConstructionTypeChange(e.target.value)}
              placeholder="예: 외장 패널 시공"
              disabled={!sessionExists}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">
              상태 <span className="text-red-500">*</span>
            </Label>
            <select
              id="status"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              disabled={!sessionExists || statusLocked}
              className={cn(
                "h-12 w-full rounded-md border border-input px-3 text-base",
                statusLocked ? "cursor-not-allowed bg-gray-100 text-gray-500" : "bg-background"
              )}
            >
              <option value="임시저장">임시저장</option>
              <option value="발송됨">발송됨</option>
              <option value="보류">보류</option>
              <option value="수락됨">수락됨</option>
              <option value="거절됨">거절됨</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="validityDays">
              유효일수 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="validityDays"
              type="number"
              value={validityDays}
              onChange={(e) => onValidityDaysChange(e.target.value)}
              placeholder="30"
              disabled={!sessionExists}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issuedDate">
              발행일 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="issuedDate"
              type="date"
              value={issuedDate}
              onChange={(e) => onIssuedDateChange(e.target.value)}
              disabled={!sessionExists}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quoteNumber">견적번호</Label>
            <Input
              id="quoteNumber"
              value={quoteNumber}
              onChange={(e) => onQuoteNumberChange(e.target.value)}
              placeholder="자동 생성됨"
              disabled={!sessionExists}
            />
          </div>
        </div>
    </section>
  );
}

type ItemsSectionProps = {
  sessionExists: boolean;
  loading: boolean;
  items: EditableQuoteItem[];
  categoryOptions: string[];
  marginFlatAmount?: number;
  onOpenSelector: () => void;
  onAddManual: () => void;
  onItemChange: (clientId: string, patch: Partial<EditableQuoteItem>) => void;
  onRemove: (clientId: string) => void;
  onMove: (clientId: string, direction: "up" | "down") => void;
  embedded?: boolean;
};

export function ItemsSection({
  sessionExists,
  loading,
  items,
  categoryOptions,
  marginFlatAmount = 0,
  onOpenSelector,
  onAddManual,
  onItemChange,
  onRemove,
  onMove,
  embedded = false,
}: ItemsSectionProps) {
  return (
    <section className="space-y-4" aria-labelledby="quote-section-items">
      <h3 id="quote-section-items" className="text-base font-semibold text-gray-900">
        견적 항목
      </h3>
      <div className="rounded-md border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-900">
        <p className="font-medium">항목 추가 방법</p>
        <p className="mt-1">- 단가 입력: 바로 입력하여 사용할 때</p>
        <p>- 단가표에서 선택: 자주 쓰는 항목을 재사용할 때</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="bg-indigo-600 text-white hover:bg-indigo-700"
          disabled={loading || !sessionExists}
          onClick={onAddManual}
        >
          단가 입력
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={loading || !sessionExists}
          onClick={onOpenSelector}
        >
          단가표에서 선택
        </Button>
      </div>

      <QuoteItemList
        items={items}
        categoryOptions={categoryOptions}
        marginFlatAmount={marginFlatAmount}
        loading={loading}
        onItemChange={onItemChange}
        onRemove={onRemove}
        onMove={onMove}
        embedded={embedded}
      />
    </section>
  );
}

type MarginFlatSectionProps = {
  sessionExists: boolean;
  disabled: boolean;
  enabled: boolean;
  marginFlat: string;
  marginPercentHint: string | null;
  onEnabledChange: (value: boolean) => void;
  onMarginFlatChange: (value: string) => void;
};

export function MarginFlatSection({
  sessionExists,
  disabled,
  enabled,
  marginFlat,
  marginPercentHint,
  onEnabledChange,
  onMarginFlatChange,
}: MarginFlatSectionProps) {
  return (
    <section className="space-y-2" aria-labelledby="quote-margin-flat">
      <div className="flex items-center justify-between rounded-md border bg-white px-3 py-2">
        <h3 id="quote-margin-flat" className="text-base font-semibold text-gray-900">
          일괄 마진
        </h3>
        <Switch
          id="marginFlatEnabled"
          checked={enabled}
          onCheckedChange={onEnabledChange}
          disabled={!sessionExists || disabled}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        입력한 금액만큼 고객 합계에 더해지며, 각 행은{" "}
        <strong className="font-medium text-gray-800">수량 비례로</strong> 같은 비율로 나뉘어 소계에
        더해집니다.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-xs space-y-1.5">
          <label htmlFor="marginFlatAmount" className="text-sm font-medium text-gray-900">
            마진금액(원)
          </label>
          {enabled ? (
            <Input
              id="marginFlatAmount"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              placeholder="예: 100000"
              value={marginFlat}
              onChange={(e) => onMarginFlatChange(e.target.value)}
              disabled={!sessionExists || disabled}
              className="max-w-xs tabular-nums"
            />
          ) : (
            <div className="h-10 rounded-md border border-dashed bg-gray-50 px-3 py-2 text-sm text-gray-500">
              토글을 켜면 금액 입력이 활성화됩니다.
            </div>
          )}
        </div>
        <p className="pb-2 text-sm tabular-nums text-indigo-700">
          {marginPercentHint ? (
            <>
              공급가 대비 <span className="font-semibold">{marginPercentHint}%</span> 추가
            </>
          ) : (
            "공급가 대비 0% 추가"
          )}
        </p>
      </div>
    </section>
  );
}

type TotalsSectionProps = {
  sessionExists: boolean;
  subtotalCustomer: string;
  vatAmount: string;
  vatIncluded: boolean;
  totalAmount: string;
  onVatIncludedChange: (value: boolean) => void;
};

const formatKRW = (value: string) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
};

export function TotalsSection({
  sessionExists,
  subtotalCustomer,
  vatAmount,
  vatIncluded,
  totalAmount,
  onVatIncludedChange,
}: TotalsSectionProps) {
  // UI 라벨은 "부가세 별도". 내부 vatIncluded(true=총액에 VAT 포함)와 반대.
  const vatExcluded = !vatIncluded;
  return (
    <section className="space-y-4" aria-labelledby="quote-section-totals">
      <h3 id="quote-section-totals" className="text-base font-semibold text-gray-900">
        합계
      </h3>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="vatExcluded" className="text-sm font-medium text-gray-900">
          부가세 별도
        </Label>
        <Switch
          id="vatExcluded"
          checked={vatExcluded}
          onCheckedChange={(next) => onVatIncludedChange(!next)}
          disabled={!sessionExists}
          aria-label="부가세 별도 여부"
        />
      </div>

      <div className="space-y-2 rounded-md bg-white p-4 ring-1 ring-indigo-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">공급가</span>
          <span className="font-medium text-gray-900">{formatKRW(subtotalCustomer)}원</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">부가세</span>
          <span className="font-medium text-gray-900">{formatKRW(vatAmount)}원</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between border-t border-indigo-100 pt-3">
          <span className="text-sm font-medium text-gray-900">총액</span>
          <span className="text-xl font-bold tabular-nums text-indigo-700 sm:text-2xl">
            {formatKRW(totalAmount)}원
          </span>
        </div>
      </div>
    </section>
  );
}

type PublicNotesSectionProps = {
  sessionExists: boolean;
  customerNotes: string;
  recentNotes: string[];
  onCustomerNotesChange: (value: string) => void;
  onApplyRecentNote: (value: string) => void;
};

export function PublicNotesSection({
  sessionExists,
  customerNotes,
  recentNotes,
  onCustomerNotesChange,
  onApplyRecentNote,
}: PublicNotesSectionProps) {
  return (
    <section className="space-y-4" aria-labelledby="quote-public-notes">
      <h3 id="quote-public-notes" className="text-base font-semibold text-gray-900">
        비고(견적서 하단에 노출됩니다)
      </h3>
      <textarea
        value={customerNotes}
        onChange={(e) => onCustomerNotesChange(e.target.value)}
        disabled={!sessionExists}
        rows={5}
        placeholder={`예시)\n계좌번호: OO은행 123-456-789012 예금주 ㈜OOO\n선금 30% 후 시공 시작, 잔금 70% 검수 후 7영업일 이내\n유효기간 내 진행 안 시 재견 필요`}
        className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      {recentNotes.length > 0 ? (
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-xs font-medium text-gray-700">이전 비고 불러오기</p>
          <div className="flex flex-wrap gap-2">
            {recentNotes.map((note, index) => (
              <Button
                key={`${note.slice(0, 20)}-${index}`}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onApplyRecentNote(note)}
                disabled={!sessionExists}
              >
                최근 비고 {index + 1}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

type MemoSectionProps = {
  sessionExists: boolean;
  internalMemo: string;
  onInternalMemoChange: (value: string) => void;
};

export function MemoSection({
  sessionExists,
  internalMemo,
  onInternalMemoChange,
}: MemoSectionProps) {
  return (
    <section className="space-y-4" aria-labelledby="quote-section-memo">
      <h3 id="quote-section-memo" className="text-base font-semibold text-gray-900">
        내부 메모(선택)
      </h3>
      <textarea
        id="internalMemo"
        value={internalMemo}
        onChange={(e) => onInternalMemoChange(e.target.value)}
        placeholder="내부 참고 내용을 입력하세요."
        disabled={!sessionExists}
        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
    </section>
  );
}

type SaveActionsProps = {
  sessionExists: boolean;
  loading: boolean;
  editingId: string | null;
  onInsert: () => void | Promise<void>;
  onUpdate: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onCancel: () => void;
};

export function SaveActions({
  sessionExists,
  loading,
  editingId,
  onInsert,
  onUpdate,
  onDelete,
  onCancel,
}: SaveActionsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {editingId ? (
          <>
            <Button onClick={onUpdate} disabled={loading || !sessionExists}>
              {loading ? "저장 중..." : "수정 저장"}
            </Button>
            {onDelete ? (
              <Button
                variant="destructive"
                disabled={loading || !sessionExists}
                onClick={() => void onDelete()}
              >
                삭제
              </Button>
            ) : null}
          </>
        ) : (
          <Button onClick={onInsert} disabled={loading || !sessionExists}>
            {loading ? "저장 중..." : "견적 저장"}
          </Button>
        )}
      </div>
      <Button
        variant="outline"
        className="border-gray-300 text-gray-700 sm:ml-auto"
        disabled={loading}
        onClick={onCancel}
      >
        취소
      </Button>
    </div>
  );
}
