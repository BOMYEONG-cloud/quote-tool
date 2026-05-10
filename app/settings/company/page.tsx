"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { CompanyAssetCard } from "@/components/settings/company-asset-card";
import { DaumAddressDialog } from "@/components/settings/daum-address-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthGuard } from "@/lib/auth/use-auth-guard";
import {
  fetchCompanyByUserId,
  formatBusinessRegNumber,
  formatKoreanPhone,
  type CompanyRow,
  upsertCompanyForUser,
} from "@/lib/company";
import { createSignedCompanyAssetUrl } from "@/lib/company-assets";
import { createClient } from "@/lib/supabase/client";

export default function CompanySettingsPage() {
  useAuthGuard("require-auth");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [messageTone, setMessageTone] = useState<"neutral" | "success" | "error">("neutral");
  const [message, setMessage] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [addressSearchOpen, setAddressSearchOpen] = useState(false);

  const [companyRow, setCompanyRow] = useState<CompanyRow | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [stampPreviewUrl, setStampPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session?.user?.id) return;

    let cancelled = false;
    (async () => {
      try {
        const row = await fetchCompanyByUserId(supabase, session.user.id);
        if (cancelled) return;
        setCompanyRow(row ?? null);
        if (row) {
          setBusinessName(row.business_name ?? "");
          setRepresentativeName(row.representative_name ?? "");
          setBusinessNumber(row.business_number ?? "");
          setAddress(row.address ?? "");
          setPhone(formatKoreanPhone(row.phone ?? ""));
          setEmail(row.email ?? "");
        }
      } catch (e) {
        if (cancelled) return;
        setMessageTone("error");
        setMessage(
          `회사 정보를 불러오지 못했습니다: ${e instanceof Error ? e.message : String(e)}`
        );
      } finally {
        if (!cancelled) setInitialLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, supabase]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (!session?.user?.id) {
        if (!cancelled) {
          setLogoPreviewUrl(null);
          setStampPreviewUrl(null);
        }
        return;
      }
      const [logo, stamp] = await Promise.all([
        createSignedCompanyAssetUrl(supabase, companyRow?.logo_url ?? null),
        createSignedCompanyAssetUrl(supabase, companyRow?.stamp_url ?? null),
      ]);
      if (!cancelled) {
        setLogoPreviewUrl(logo);
        setStampPreviewUrl(stamp);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, supabase, companyRow?.logo_url, companyRow?.stamp_url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    const name = businessName.trim();
    if (!name) {
      setMessageTone("error");
      setMessage("사업자명/회사명을 입력해 주세요.");
      return;
    }

    setSaving(true);
    setMessageTone("neutral");
    setMessage("저장 중...");
    try {
      await upsertCompanyForUser(supabase, session.user.id, {
        business_name: name,
        representative_name: representativeName.trim() || null,
        business_number: businessNumber.trim() || null,
        address: address.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
      });
      const refreshed = await fetchCompanyByUserId(supabase, session.user.id);
      setCompanyRow(refreshed ?? null);
      router.push("/quotes");
    } catch (err) {
      setMessageTone("error");
      setMessage(`저장 실패: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">회사 정보</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/quotes">견적 목록</Link>
        </Button>
      </div>

      <Card size="sm">
        <CardHeader className="border-b border-border">
          <CardTitle>사업자 정보</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {!session?.user?.id ? (
            <p className="text-sm text-muted-foreground">세션을 확인하는 중입니다.</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="business-name">
                  사업자명/회사명 <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="business-name"
                  name="businessName"
                  autoComplete="organization"
                  placeholder="예: 주식회사 ○○건설"
                  value={businessName}
                  onChange={(ev) => setBusinessName(ev.target.value)}
                  disabled={!initialLoaded || saving}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="representative-name">대표자명</Label>
                <Input
                  id="representative-name"
                  name="representativeName"
                  autoComplete="name"
                  value={representativeName}
                  onChange={(ev) => setRepresentativeName(ev.target.value)}
                  disabled={!initialLoaded || saving}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="business-number">사업자등록번호</Label>
                <Input
                  id="business-number"
                  name="businessNumber"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="10-123-45678"
                  value={businessNumber}
                  onChange={(ev) => setBusinessNumber(formatBusinessRegNumber(ev.target.value))}
                  disabled={!initialLoaded || saving}
                  className="tabular-nums"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="address">주소</Label>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    name="address"
                    autoComplete="street-address"
                    value={address}
                    onChange={(ev) => setAddress(ev.target.value)}
                    disabled={!initialLoaded || saving}
                    className="min-w-0 flex-1"
                    placeholder="주소 검색 또는 직접 입력"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!initialLoaded || saving}
                    onClick={() => setAddressSearchOpen(true)}
                    className="shrink-0"
                  >
                    주소 검색
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">연락처</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="010-1234-5678"
                  value={phone}
                  onChange={(ev) => setPhone(formatKoreanPhone(ev.target.value))}
                  disabled={!initialLoaded || saving}
                  className="tabular-nums"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  disabled={!initialLoaded || saving}
                />
              </div>

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

              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="submit" disabled={!initialLoaded || saving}>
                  {saving ? "저장 중..." : "저장"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => router.back()}
                >
                  취소
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {session?.user?.id ? (
        <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="min-w-0">
            <CompanyAssetCard
              supabase={supabase}
              userId={session.user.id}
              company={companyRow}
              kind="logo"
              title="회사 로고"
              recommendedFormats="JPG · PNG · WebP"
              previewUrl={logoPreviewUrl}
              onCompanyUpdated={(row) => setCompanyRow(row)}
            />
          </div>
          <div className="min-w-0">
            <CompanyAssetCard
              supabase={supabase}
              userId={session.user.id}
              company={companyRow}
              kind="stamp"
              title="회사 도장"
              recommendedFormats="PNG · WebP · JPG"
              previewUrl={stampPreviewUrl}
              onCompanyUpdated={(row) => setCompanyRow(row)}
            />
          </div>
        </div>
      ) : null}

      <DaumAddressDialog
        open={addressSearchOpen}
        onOpenChange={setAddressSearchOpen}
        onSelect={(line) => setAddress(line)}
      />
    </main>
  );
}
