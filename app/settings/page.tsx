"use client";

import Link from "next/link";
import { useAuthGuard } from "@/lib/auth/use-auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  useAuthGuard("require-auth");

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
          <CardTitle>메뉴</CardTitle>
          <CardDescription>앱 설정을 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-4">
          <Button asChild variant="outline" className="justify-start">
            <Link href="/settings/company">회사 정보</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
