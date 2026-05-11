"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import type { Estimate, QuoteItem } from "@/components/estimate/types";
import type { CompanyRow } from "@/lib/company";
import { createClient } from "@/lib/supabase/client";
import { insertEstimateHistory } from "@/lib/estimate-history";
import { captureEvent } from "@/lib/posthog";
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
  company: CompanyRow | null;
  companyLogoSignedUrl?: string | null;
  companyStampSignedUrl?: string | null;
  onEstimateUpdated?: (next: Estimate) => void;
};

const sentButtonClass =
  "border-blue-200 bg-blue-50 text-blue-800 shadow-none ring-1 ring-blue-200 hover:bg-blue-100";

export function QuotePreviewPanel({
  estimate,
  items,
  company,
  companyLogoSignedUrl = null,
  companyStampSignedUrl = null,
  onEstimateUpdated,
}: QuotePreviewPanelProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [kakaoOpen, setKakaoOpen] = useState(false);
  const [companyRequiredOpen, setCompanyRequiredOpen] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const model = useMemo(
    () => ({ estimate, items, company }),
    [estimate, items, company]
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

  const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("이미지 변환에 실패했습니다."));
      reader.readAsDataURL(blob);
    });

  const blobToPngDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(blob);
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas 컨텍스트를 만들 수 없습니다.");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("이미지 디코딩에 실패했습니다."));
      };
      img.src = objectUrl;
    });

  const signedUrlToDataUrl = async (signedUrl: string | null): Promise<string | null> => {
    if (!signedUrl) return null;
    const res = await fetch(signedUrl);
    if (!res.ok) {
      throw new Error(`이미지 로드 실패 (${res.status})`);
    }
    const blob = await res.blob();
    // react-pdf에서 webp 렌더링이 불안정해 PNG로 정규화한다.
    if (blob.type === "image/webp") {
      return blobToPngDataUrl(blob);
    }
    return blobToDataUrl(blob);
  };

  const handleCopyKakaoFromModal = async () => {
    try {
      await navigator.clipboard.writeText(kakaoText);
      setKakaoOpen(false);
      captureEvent("quote_kakao_text_copied", { quote_id: estimate.id });
      showToast("복사되었습니다");
    } catch {
      showToast("복사에 실패했습니다. 브라우저 권한을 확인해 주세요.");
    }
  };

  const handlePdf = async () => {
    if (company === null) {
      setCompanyRequiredOpen(true);
      return;
    }
    setBusy("pdf");
    try {
      const [logoDataUrl, stampDataUrl] = await Promise.all([
        signedUrlToDataUrl(companyLogoSignedUrl),
        signedUrlToDataUrl(companyStampSignedUrl),
      ]);
      const blob = await pdf(
        <QuotePdfDocument
          estimate={estimate}
          items={items}
          company={company}
          logoDataUrl={logoDataUrl}
          stampDataUrl={stampDataUrl}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseFilename()}.pdf`;
      a.click();
      captureEvent("quote_pdf_downloaded", { quote_id: estimate.id });
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
    if (company === null) {
      setCompanyRequiredOpen(true);
      return;
    }
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
      captureEvent("quote_image_saved", { quote_id: estimate.id });
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

      const { data: authData } = await supabase.auth.getUser();
      const ownerId = authData.user?.id;
      if (ownerId) {
        await insertEstimateHistory({
          supabase,
          quoteId: estimate.id,
          ownerId,
          action: "상태 변경",
          note: `상태 변경: ${estimate.status} -> 발송됨`,
          snapshot: { from: estimate.status, to: "발송됨" },
        });
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

  const handleUpdateStatus = async (nextStatus: "수락됨" | "보류") => {
    if (estimate.status === nextStatus) return;
    setBusy(nextStatus);
    try {
      const updatedAt = new Date().toISOString();
      const { error } = await supabase
        .from("estimates")
        .update({ status: nextStatus, updated_at: updatedAt })
        .eq("id", estimate.id);
      if (error) {
        showToast(`상태 변경 실패: ${error.message}`);
        return;
      }
      const { data: authData } = await supabase.auth.getUser();
      const ownerId = authData.user?.id;
      if (ownerId) {
        await insertEstimateHistory({
          supabase,
          quoteId: estimate.id,
          ownerId,
          action: "상태 변경",
          note: `상태 변경: ${estimate.status} -> ${nextStatus}`,
          snapshot: { from: estimate.status, to: nextStatus },
        });
      }
      onEstimateUpdated?.({ ...estimate, status: nextStatus, updated_at: updatedAt });
      showToast(`${nextStatus} 상태로 변경되었습니다`);
    } catch (e) {
      showToast(`상태 변경 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}`);
    } finally {
      setBusy(null);
    }
  };

  const actionBusy = busy !== null;

  return (
    <div className="flex min-w-0 w-full max-w-full flex-col gap-4">
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
          variant="outline"
          disabled={actionBusy}
          onClick={() => void handleImage()}
        >
          {busy === "image" ? "이미지 생성 중..." : "이미지 저장"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={actionBusy}
          onClick={() => {
            if (company === null) {
              setCompanyRequiredOpen(true);
              return;
            }
            setKakaoOpen(true);
          }}
        >
          카톡용 복사
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

      {estimate.status === "발송됨" ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-900">
            발송 이후 상태를 바로 추적하세요.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={actionBusy}
              onClick={() => void handleUpdateStatus("수락됨")}
            >
              수락됨 처리
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={actionBusy}
              onClick={() => void handleUpdateStatus("보류")}
            >
              보류 처리
            </Button>
            <Button asChild type="button" size="sm" variant="outline">
              <Link href="/quotes">목록으로 돌아가기</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <div
        ref={captureRef}
        id="quote-preview-capture"
        className="min-w-0 w-full max-w-full overflow-visible rounded-xl border border-gray-200 bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-6"
      >
        <ItemizedPreviewBody
          estimate={estimate}
          items={items}
          company={company}
          logoSignedUrl={companyLogoSignedUrl}
          stampSignedUrl={companyStampSignedUrl}
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

      <Dialog open={companyRequiredOpen} onOpenChange={setCompanyRequiredOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>회사 정보 필요</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            회사 정보를 먼저 등록해주세요. 등록하시겠습니까?
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setCompanyRequiredOpen(false)}>
              취소
            </Button>
            <Button
              type="button"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                setCompanyRequiredOpen(false);
                router.push("/settings/company");
              }}
            >
              회사 정보 등록
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
