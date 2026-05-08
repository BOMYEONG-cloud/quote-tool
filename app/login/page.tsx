"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthGuard } from "@/lib/auth/use-auth-guard";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  useAuthGuard("redirect-if-authed");
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("로그인 후 견적/단가 관리를 사용할 수 있어요.");
  const [isError, setIsError] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      setIsError(true);
      setMessage("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setIsError(true);
        setMessage(`로그인 실패: ${error.message}`);
        return;
      }
      setIsError(false);
      setMessage("로그인 성공! 상단 메뉴에서 견적/단가표로 이동해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setIsError(true);
      setMessage("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setIsError(true);
        setMessage(`회원가입 실패: ${error.message}`);
        return;
      }
      setIsError(false);
      setMessage("회원가입 성공! 이제 로그인해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center gap-4 p-4">
      <h1 className="text-2xl font-semibold text-gray-900">로그인</h1>
      <p className={isError ? "text-sm text-red-600" : "text-sm text-muted-foreground"}>{message}</p>

      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          disabled={loading}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSignIn} disabled={loading}>
          로그인
        </Button>
        <Button
          variant="outline"
          className="border-gray-400 bg-background font-medium text-gray-900 hover:bg-gray-50"
          onClick={handleSignUp}
          disabled={loading}
        >
          회원가입
        </Button>
      </div>
    </main>
  );
}

