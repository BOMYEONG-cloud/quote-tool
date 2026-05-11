"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthGuard } from "@/lib/auth/use-auth-guard";
import { captureEvent } from "@/lib/posthog";
import { createClient } from "@/lib/supabase/client";

function SocialIcon({ provider }: { provider: "kakao" }) {
  if (provider === "kakao") {
    return (
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#FEE500]">
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
          <path
            fill="#3A1D1D"
            d="M12 4c-4.6 0-8.3 2.9-8.3 6.6 0 2.4 1.6 4.5 4 5.7l-.9 3.3c-.1.2.2.4.4.3l3.9-2.5c.3 0 .6.1.9.1 4.6 0 8.3-2.9 8.3-6.6S16.6 4 12 4z"
          />
        </svg>
      </span>
    );
  }
}

function SocialButton({
  provider,
  loading,
  onClick,
}: {
  provider: "kakao";
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-full p-0 disabled:cursor-not-allowed disabled:opacity-60"
      aria-label="카카오 로그인"
    >
      <SocialIcon provider={provider} />
    </button>
  );
}

export default function LoginPage() {
  useAuthGuard("redirect-if-authed", { allowOnboardingBypass: true, allowCompanySetupBypass: true });
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [kakaoConsentOpen, setKakaoConsentOpen] = useState(false);
  const [kakaoModalTerms, setKakaoModalTerms] = useState(false);
  const [kakaoModalPrivacy, setKakaoModalPrivacy] = useState(false);

  const startKakaoOAuth = async () => {
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/quotes`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo },
      });
      if (error) {
        setIsError(true);
        setMessage(`카카오 로그인 실패: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const hasAllKakaoModalConsents = kakaoModalTerms && kakaoModalPrivacy;

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user?.id) return;
      const pending = window.localStorage.getItem("kakao-consent-pending");
      if (pending !== "1") return;
      const now = new Date().toISOString();
      const { error } = await supabase.from("user_profiles").upsert(
        {
          id: session.user.id,
          terms_agreed_at: now,
          privacy_agreed_at: now,
        },
        { onConflict: "id" }
      );
      if (!error) {
        window.localStorage.setItem("kakao-consent-ever", "1");
        window.localStorage.removeItem("kakao-consent-pending");
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

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
    if (!showPasswordConfirm) {
      setShowPasswordConfirm(true);
      setIsError(false);
      setMessage("회원가입을 위해 비밀번호 확인을 입력해 주세요.");
      return;
    }
    if (!passwordConfirm) {
      setIsError(true);
      setMessage("비밀번호 확인을 입력해 주세요.");
      return;
    }
    if (password !== passwordConfirm) {
      setIsError(true);
      setMessage("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    if (!agreeTerms || !agreePrivacy) {
      setIsError(true);
      setMessage("회원가입을 위해 필수 동의 항목을 모두 체크해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setIsError(true);
        setMessage(`회원가입 실패: ${error.message}`);
        return;
      }
      const userId = data.user?.id;
      if (userId) {
        const { error: profileError } = await supabase.from("user_profiles").upsert(
          {
            id: userId,
            terms_agreed_at: now,
            privacy_agreed_at: now,
          },
          { onConflict: "id" }
        );
        if (profileError) {
          setIsError(true);
          setMessage(`동의 기록 저장 실패: ${profileError.message}`);
          return;
        }
      }
      captureEvent("signup_completed", { signup_method: "email" });
      setIsError(false);
      setMessage("회원가입 성공! 이제 로그인해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full min-w-0 max-w-md flex-col justify-center gap-4 p-4 sm:p-6">
      <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">로그인</h1>

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
      {showPasswordConfirm ? (
        <div className="space-y-2">
          <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
          <Input
            id="passwordConfirm"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="비밀번호 다시 입력"
            disabled={loading}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
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
        {message ? (
          <p className={isError ? "text-sm text-red-600" : "text-sm text-muted-foreground"}>{message}</p>
        ) : null}
      </div>

      <div className="space-y-2 rounded-md border p-3">
        <p className="text-sm font-medium text-gray-900">회원가입 필수 동의</p>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
          <span>
            이용약관에 동의합니다 (필수) <Link href="/terms" className="underline">[보기]</Link>
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} />
          <span>
            개인정보 수집·이용에 동의합니다 (필수) <Link href="/privacy" className="underline">[보기]</Link>
          </span>
        </label>
      </div>

      <div className="space-y-2 rounded-md border p-3">
        <p className="text-sm font-medium text-gray-900">카카오 계정으로 시작</p>
        <div className="grid grid-cols-1 gap-2">
          <SocialButton
            provider="kakao"
            loading={loading}
            onClick={() => {
              const alreadyConsented = window.localStorage.getItem("kakao-consent-ever") === "1";
              if (alreadyConsented) {
                void startKakaoOAuth();
                return;
              }
              setKakaoConsentOpen(true);
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          카카오 OAuth Provider 설정이 완료되어야 동작합니다.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        로그인/회원가입을 진행하면{" "}
        <Link href="/terms" className="underline">
          이용약관
        </Link>{" "}
        및{" "}
        <Link href="/privacy" className="underline">
          개인정보처리방침
        </Link>
        에 동의한 것으로 간주됩니다.
      </p>

      <Dialog open={kakaoConsentOpen} onOpenChange={setKakaoConsentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>카카오 가입 전 필수 동의</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={kakaoModalTerms}
                onChange={(e) => setKakaoModalTerms(e.target.checked)}
              />
              <span>
                이용약관에 동의합니다 (필수){" "}
                <Link href="/terms" className="underline">
                  [보기]
                </Link>
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={kakaoModalPrivacy}
                onChange={(e) => setKakaoModalPrivacy(e.target.checked)}
              />
              <span>
                개인정보 수집·이용에 동의합니다 (필수){" "}
                <Link href="/privacy" className="underline">
                  [보기]
                </Link>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKakaoConsentOpen(false)}>
              취소
            </Button>
            <Button
              disabled={!hasAllKakaoModalConsents || loading}
              onClick={() => {
                window.localStorage.setItem("kakao-consent-pending", "1");
                captureEvent("signup_completed", { signup_method: "kakao" });
                setKakaoConsentOpen(false);
                void startKakaoOAuth();
              }}
              className="bg-[#FEE500] text-[#191919] hover:bg-[#f7da00]"
            >
              카카오로 계속하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

