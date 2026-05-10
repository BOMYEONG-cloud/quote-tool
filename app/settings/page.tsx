"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthGuard } from "@/lib/auth/use-auth-guard";
import { createClient } from "@/lib/supabase/client";
import { fetchUserProfileCompany, saveCompanyName } from "@/lib/user-profile";

export default function SettingsPage() {
  useAuthGuard("require-auth");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [messageTone, setMessageTone] = useState<"neutral" | "success" | "error">("neutral");
  const [message, setMessage] = useState("");

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
        const row = await fetchUserProfileCompany(supabase, session.user.id);
        if (cancelled) return;
        setCompanyName(row?.company_name?.trim() ?? "");
      } catch (e) {
        if (cancelled) return;
        setMessageTone("error");
        setMessage(
          `프로필을 불러오지 못했습니다: ${e instanceof Error ? e.message : String(e)}`
        );
      } finally {
        if (!cancelled) setInitialLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setSaving(true);
    setMessageTone("neutral");
    setMessage("저장 중...");
    try {
      await saveCompanyName(supabase, session.user.id, companyName);
      setMessageTone("success");
      setMessage("저장했습니다. 이후 견적서에 회사명이 자동으로 표시됩니다.");
      router.refresh();
    } catch (err) {
      setMessageTone("error");
      setMessage(`저장 실패: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">설정</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/quotes">견적 목록</Link>
        </Button>
      </div>

      <Card size="sm">
        <CardHeader className="border-b border-border">
          <CardTitle>회사 정보</CardTitle>
          <CardDescription>
            견적서 상단·하단에 들어갈 회사명입니다. 정식 사업자 정보는 이후 버전에서
            다룰 예정입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {!session?.user?.id ? (
            <p className="text-sm text-muted-foreground">세션을 확인하는 중입니다.</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="company-name">회사명</Label>
                <Input
                  id="company-name"
                  name="companyName"
                  autoComplete="organization"
                  placeholder="예: 주식회사 ○○건설"
                  value={companyName}
                  onChange={(ev) => setCompanyName(ev.target.value)}
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

              <Button type="submit" disabled={!initialLoaded || saving}>
                {saving ? "저장 중..." : "저장"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
