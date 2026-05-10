"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import type { Estimate, QuoteItem } from "@/components/estimate/types";
import { createClient } from "@/lib/supabase/client";
import {
  buildKakaoPlainText,
  sanitizeFilenamePart,
} from "@/lib/quote-preview/format-plain";
import { pdf } from "@react-pdf/renderer";
import { domToBlob } from "modern-screenshot";
import { QuotePdfDocument } from "@/components/estimate/preview/quote-pdf-document";
import { ItemizedPreviewBody } from "@/components/estimate/preview/quote-preview-bodies";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type QuotePreviewPanelProps = {
  estimate: Estimate;
  items: QuoteItem[];
  companyName: string | null;
  onEstimateUpdated?: (next: Estimate) => void;
};

const sentButtonClass =
  "border-blue-200 bg-blue-50 text-blue-800 shadow-none ring-1 ring-blue-200 hover:bg-blue-100";

export function QuotePreviewPanel({
  estimate,
  items,
  companyName,
  onEstimateUpdated,
}: QuotePreviewPanelProps) {
  const supabase = useMemo(() => createClient(), []);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [kakaoOpen, setKakaoOpen] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const model = useMemo(
    () => ({ estimate, items, companyName }),
    [estimate, items, companyName]
  );

  const kakaoText = useMemo(() => buildKakaoPlainText(model), [model]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const baseFilename = () => {
    const q = sanitizeFilenamePart(estimate.quote_number?.trim() || "견적");
    const p = sanitizeFilenamePart(estimate.project_name?.trim() || "현장");
    return `견적서_${q}_${p}`;
  };

  const handleCopyKakaoFromModal = async () => {
    try {
      await navigator.clipboard.writeText(kakaoText);
      setKakaoOpen(false);
      showToast("복사되었습니다");
    } catch {
      showToast("복사에 실패했습니다. 브라우저 권한을 확인해 주세요.");
    }
  };

  const handlePdf = async () => {
    setBusy("pdf");
    try {
      const blob = await pdf(
        <QuotePdfDocument estimate={estimate} items={items} companyName={companyName} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseFilename()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      showToast(
        `PDF 생성 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}`
      );
    } finally {
      setBusy(null);
    }
  };

  const handleImage = async () => {
    const el = captureRef.current;
    if (!el) {
      showToast("미리보기 영역을 찾을 수 없습니다.");
      return;
    }
    setBusy("image");
    try {
      const blob = await domToBlob(el, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseFilename()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      showToast(
        `이미지 저장 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}`
      );
    } finally {
      setBusy(null);
    }
  };

  const handleMarkSent = async () => {
    if (estimate.status === "발송됨") return;
    if (!window.confirm("견적 상태를 '발송됨'으로 변경할까요?")) return;

    setBusy("sent");
    try {
      const updatedAt = new Date().toISOString();
      const { error } = await supabase
        .from("estimates")
        .update({ status: "발송됨", updated_at: updatedAt })
        .eq("id", estimate.id);

      if (error) {
        showToast(`상태 변경 실패: ${error.message}`);
        return;
      }

      const next: Estimate = { ...estimate, status: "발송됨", updated_at: updatedAt };
      onEstimateUpdated?.(next);
      showToast("발송됨으로 변경되었습니다");
    } catch (e) {
      showToast(
        `상태 변경 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}`
      );
    } finally {
      setBusy(null);
    }
  };

  const actionBusy = busy !== null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/quotes/${estimate.id}`}>수정</Link>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="default"
          className="bg-indigo-600 hover:bg-indigo-700"
          disabled={actionBusy}
          onClick={() => void handlePdf()}
        >
          {busy === "pdf" ? "PDF 생성 중..." : "PDF 다운로드"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="default"
          className="bg-indigo-600 hover:bg-indigo-700"
          disabled={actionBusy}
          onClick={() => void handleImage()}
        >
          {busy === "image" ? "이미지 생성 중..." : "이미지 저장"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="default"
          className="bg-indigo-600 hover:bg-indigo-700"
          disabled={actionBusy}
          onClick={() => setKakaoOpen(true)}
        >
          텍스트 복사
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={sentButtonClass}
          disabled={actionBusy || estimate.status === "발송됨"}
          onClick={() => void handleMarkSent()}
        >
          {busy === "sent" ? "처리 중..." : "발송됨"}
        </Button>
      </div>

      <div
        ref={captureRef}
        id="quote-preview-capture"
        className="overflow-visible rounded-xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-black/5"
      >
        <ItemizedPreviewBody
          estimate={estimate}
          items={items}
          companyName={companyName}
        />
      </div>

      <Dialog open={kakaoOpen} onOpenChange={setKakaoOpen}>
        <DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border px-6 py-4 text-left">
            <DialogTitle>카톡용 견적</DialogTitle>
          </DialogHeader>
          <div className="max-h-[min(50vh,360px)] overflow-y-auto px-6 py-4">
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-gray-900">
              {kakaoText}
            </pre>
          </div>
          <DialogFooter className="border-t border-border px-6 py-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setKakaoOpen(false)}>
              닫기
            </Button>
            <Button
              type="button"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => void handleCopyKakaoFromModal()}
            >
              복사
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast ? (
        <div
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-sm text-white shadow-lg"
          role="status"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
