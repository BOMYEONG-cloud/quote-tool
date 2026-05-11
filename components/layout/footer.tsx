"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  const hideFooter =
    pathname.startsWith("/onboarding") ||
    /^\/quotes\/[^/]+\/preview$/.test(pathname);
  if (hideFooter) return null;

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <span className="shrink-0">견적노트 © 2026 열매달보름날</span>
        <span className="min-w-0 break-words">사업자등록번호: 108-25-37861</span>
        <span className="min-w-0 break-all sm:break-words">이메일: qhaud5115@gmail.com</span>
        <Link href="/terms" className="underline-offset-2 hover:underline">
          이용약관
        </Link>
        <Link href="/privacy" className="underline-offset-2 hover:underline">
          개인정보처리방침
        </Link>
      </div>
    </footer>
  );
}
