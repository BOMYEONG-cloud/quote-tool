"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompanyAssetKind } from "@/lib/company-assets";
import {
  removeCompanyAssetObject,
  uploadCompanyAsset,
} from "@/lib/company-assets";
import { updateCompanyAssetUrls, type CompanyRow } from "@/lib/company";
import { captureEvent } from "@/lib/posthog";
import type { SupabaseClient } from "@supabase/supabase-js";

type CompanyAssetCardProps = {
  supabase: SupabaseClient;
  userId: string;
  company: CompanyRow | null;
  kind: CompanyAssetKind;
  title: string;
  /** 타이틀 옆 소형 문구로 표시되는 권장 확장자 */
  recommendedFormats?: string;
  previewUrl: string | null;
  onCompanyUpdated: (row: CompanyRow) => void;
};

export function CompanyAssetCard({
  supabase,
  userId,
  company,
  kind,
  title,
  recommendedFormats,
  previewUrl,
  onCompanyUpdated,
}: CompanyAssetCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const storedPath =
    kind === "logo"
      ? (company?.logo_url?.trim() ? company.logo_url : null)
      : (company?.stamp_url?.trim() ? company.stamp_url : null);

  const canUse = Boolean(company);

  const patchKey = kind === "logo" ? ("logo_url" as const) : ("stamp_url" as const);

  const pickAndUpload = () => {
    setLocalError(null);
    inputRef.current?.click();
  };

  const onFileSelected = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file || !company) return;

    setBusy(true);
    setLocalError(null);
    try {
      const path = await uploadCompanyAsset(supabase, userId, kind, file, storedPath);
      const next = await updateCompanyAssetUrls(supabase, userId, {
        [patchKey]: path,
      });
      captureEvent(kind === "logo" ? "company_logo_uploaded" : "company_stamp_uploaded");
      onCompanyUpdated(next);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const clearAsset = async () => {
    if (!company || !storedPath) return;
    if (!window.confirm(`${title}을(를) 삭제할까요?`)) return;

    setBusy(true);
    setLocalError(null);
    try {
      await removeCompanyAssetObject(supabase, storedPath);
      const next = await updateCompanyAssetUrls(supabase, userId, {
        [patchKey]: null,
      });
      onCompanyUpdated(next);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card size="sm">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-base leading-snug">
          <span>{title}</span>
          {recommendedFormats ? (
            <span className="text-sm font-normal text-muted-foreground">{recommendedFormats}</span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-3 pt-4">
        {!canUse ? (
          <p className="text-sm text-amber-800">
            사업자 정보를 저장한 뒤 이미지를 등록할 수 있습니다.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {previewUrl ? (
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="" className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
              없음
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!canUse || busy}
              onClick={() => void pickAndUpload()}
            >
              {busy ? "처리 중..." : storedPath ? "바꾸기" : "업로드"}
            </Button>
            {storedPath ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                disabled={busy}
                onClick={() => void clearAsset()}
              >
                삭제
              </Button>
            ) : null}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(ev) => void onFileSelected(ev.target.files)}
        />

        {localError ? <p className="text-sm text-red-600">{localError}</p> : null}
      </CardContent>
    </Card>
  );
}
