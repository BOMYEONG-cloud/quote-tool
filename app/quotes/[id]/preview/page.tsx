"use client";

import Link from "next/link";
import { use } from "react";
import { useEffect, useMemo, useState } from "react";
import { QuotePreviewPanel } from "@/components/estimate/preview/quote-preview-panel";
import type { Estimate, QuoteItem } from "@/components/estimate/types";
import { CompanyNameHint } from "@/components/profile/company-name-hint";
import { Button } from "@/components/ui/button";
import { useAuthGuard } from "@/lib/auth/use-auth-guard";
import { fetchCompanyByUserId, type CompanyRow } from "@/lib/company";
import { createSignedCompanyAssetUrl } from "@/lib/company-assets";
import { createClient } from "@/lib/supabase/client";

type PreviewPageProps = {
  params: Promise<{ id: string }>;
};

export default function QuotePreviewPage({ params }: PreviewPageProps) {
  const { id: estimateId } = use(params);
  useAuthGuard("require-auth");

  const supabase = useMemo(() => createClient(), []);
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyLogoSignedUrl, setCompanyLogoSignedUrl] = useState<string | null>(null);
  const [companyStampSignedUrl, setCompanyStampSignedUrl] = useState<string | null>(null);

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const applyCompany = async (userId: string | undefined) => {
      if (!userId) {
        setCompany(null);
        setCompanyLoading(false);
        return;
      }
      setCompanyLoading(true);
      try {
        const row = await fetchCompanyByUserId(supabase, userId);
        if (!cancelled) setCompany(row);
      } catch {
        if (!cancelled) setCompany(null);
      } finally {
        if (!cancelled) setCompanyLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      void applyCompany(session?.user?.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applyCompany(session?.user?.id);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!company?.logo_url?.trim() && !company?.stamp_url?.trim()) {
        if (!cancelled) {
          setCompanyLogoSignedUrl(null);
          setCompanyStampSignedUrl(null);
        }
        return;
      }
      const [logo, stamp] = await Promise.all([
        createSignedCompanyAssetUrl(supabase, company.logo_url),
        createSignedCompanyAssetUrl(supabase, company.stamp_url),
      ]);
      if (!cancelled) {
        setCompanyLogoSignedUrl(logo);
        setCompanyStampSignedUrl(stamp);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, company?.logo_url, company?.stamp_url]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setDataLoading(true);
      setLoadError(null);

      const { data: est, error: estErr } = await supabase
        .from("estimates")
        .select("*")
        .eq("id", estimateId)
        .maybeSingle();

      if (cancelled) return;

      if (estErr || !est) {
        setEstimate(null);
        setQuoteItems([]);
        setLoadError(estErr?.message ?? "견적을 찾을 수 없습니다.");
        setDataLoading(false);
        return;
      }

      const { data: rows, error: itemsErr } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", estimateId)
        .order("sort_order", { ascending: true });

      if (cancelled) return;

      if (itemsErr) {
        setEstimate(null);
        setQuoteItems([]);
        setLoadError(itemsErr.message);
        setDataLoading(false);
        return;
      }

      setEstimate(est as Estimate);
      setQuoteItems((rows ?? []) as QuoteItem[]);
      setDataLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [estimateId, supabase]);

  const titleLine = estimate
    ? `${estimate.quote_number?.trim() || "견적"} - ${estimate.project_name?.trim() || "현장"}`
    : "견적서 보기";

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900 md:text-2xl">
          {dataLoading ? "견적서 보기" : titleLine}
        </h1>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/quotes">목록</Link>
        </Button>
      </div>

      <CompanyNameHint company={company} loading={companyLoading} />

      {loadError ? (
        <p className="text-sm text-red-600">{loadError}</p>
      ) : null}

      {!loadError && estimate ? (
        <QuotePreviewPanel
          estimate={estimate}
          items={quoteItems}
          company={company}
          companyLogoSignedUrl={companyLogoSignedUrl}
          companyStampSignedUrl={companyStampSignedUrl}
          onEstimateUpdated={setEstimate}
        />
      ) : null}

      {!loadError && !estimate && !dataLoading ? (
        <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
      ) : null}
    </main>
  );
}
