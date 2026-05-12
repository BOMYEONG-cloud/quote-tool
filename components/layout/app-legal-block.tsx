import Link from "next/link";
import { cn } from "@/lib/utils";

/** 하단 고정 CTA가 있을 때 푸터 대신 노출하는 법적·연락 정보 (모바일 햄버거·도킹 바 등에서 재사용) */
export function AppLegalBlock({
  className,
  variant = "compact",
}: {
  className?: string;
  variant?: "compact" | "menu";
}) {
  if (variant === "menu") {
    return (
      <div className={cn("space-y-3 text-sm text-muted-foreground", className)}>
        <p className="text-xs font-medium text-foreground">앱 정보</p>
        <p>견적노트 © 2026 열매달보름날</p>
        <p>사업자등록번호: 108-25-37861</p>
        <p className="break-all">이메일: qhaud5115@gmail.com</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/terms" className="text-indigo-700 underline-offset-2 hover:underline">
            이용약관
          </Link>
          <Link href="/privacy" className="text-indigo-700 underline-offset-2 hover:underline">
            개인정보처리방침
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-center text-[0.7rem] leading-snug text-muted-foreground sm:gap-x-4 sm:text-xs",
        className
      )}
    >
      <span className="shrink-0">© 2026 열매달보름날</span>
      <Link href="/terms" className="shrink-0 underline-offset-2 hover:underline">
        이용약관
      </Link>
      <Link href="/privacy" className="shrink-0 underline-offset-2 hover:underline">
        개인정보
      </Link>
    </div>
  );
}
