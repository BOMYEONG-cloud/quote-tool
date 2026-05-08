"use client";

import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthSectionProps = {
  session: Session | null;
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSignUp: () => Promise<void>;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
};

export function AuthSection({
  session,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSignUp,
  onSignIn,
  onSignOut,
}: AuthSectionProps) {
  return (
    <div className="w-full max-w-2xl space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">
        {session ? `로그인됨: ${session.user.email}` : "로그인 필요"}
      </p>

      {!session ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="비밀번호"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onSignUp}>
              회원가입
            </Button>
            <Button onClick={onSignIn}>로그인</Button>
          </div>
        </>
      ) : (
        <Button variant="outline" onClick={onSignOut}>
          로그아웃
        </Button>
      )}
    </div>
  );
}
