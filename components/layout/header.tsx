"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Menu, NotebookPen, X } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppLegalBlock } from "@/components/layout/app-legal-block";
import { createClient } from "@/lib/supabase/client";

const NAV_PUBLIC: Array<{ href: string; label: string }> = [
  { href: "/quotes", label: "견적" },
  { href: "/price-items", label: "단가표" },
];
const NAV_COMPANY = { href: "/settings/company", label: "회사 정보" } as const;

export function Header() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const isOnboardingPage = pathname.startsWith("/onboarding");
  const isHome = pathname === "/";
  const isMinimalHeader = isLoginPage || isOnboardingPage;
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // SSR-safe portal: 마운트 후에만 document.body 사용
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setMenuOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const showMobileMenu = !isMinimalHeader && !isHome;

  return (
    <header className="sticky top-0 z-40 w-full min-w-0 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex min-h-12 w-full min-w-0 max-w-6xl items-center justify-between gap-2 px-4 py-1.5 sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-5 md:gap-6">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 text-gray-900"
            aria-label="견적노트 홈"
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-white"
              aria-hidden="true"
            >
              <NotebookPen className="size-4" />
            </span>
            <span className="truncate text-lg font-semibold tracking-tight">견적노트</span>
          </Link>
          {!isMinimalHeader && !isHome ? (
            <nav
              className="hidden min-w-0 items-center gap-4 text-sm font-medium text-gray-600 md:flex"
              aria-label="주요 메뉴"
            >
              {NAV_PUBLIC.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={active ? "text-gray-900" : "hover:text-gray-900"}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {session ? (
                <Link
                  href={NAV_COMPANY.href}
                  className={
                    pathname === NAV_COMPANY.href ||
                    pathname.startsWith(`${NAV_COMPANY.href}/`)
                      ? "text-gray-900"
                      : "hover:text-gray-900"
                  }
                >
                  {NAV_COMPANY.label}
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>

        <div className="hidden shrink-0 items-center gap-3 md:flex md:pl-2">
          {isHome && session ? (
            <Button
              asChild
              size="sm"
              className="bg-[#4F46E5] font-semibold text-white hover:bg-[#4338CA]"
            >
              <Link href="/quotes">대시보드</Link>
            </Button>
          ) : isHome && !session ? (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-gray-900 hover:underline"
              >
                로그인
              </Link>
              <Button
                asChild
                size="sm"
                className="bg-[#4F46E5] font-semibold text-white shadow-sm hover:bg-[#4338CA]"
              >
                <Link href="/login">무료로 시작하기 →</Link>
              </Button>
            </>
          ) : !isMinimalHeader && session ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 max-w-[11rem] gap-1.5 px-3 text-gray-800 lg:max-w-[15rem] xl:max-w-[19rem]"
                    disabled={loading}
                  >
                    <span className="min-w-0 flex-1 truncate text-left text-sm sm:text-base">
                      {session.user.email}
                    </span>
                    <ChevronDown className="size-4 shrink-0 opacity-70" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[12rem] max-w-[min(100vw-2rem,24rem)]">
                  <DropdownMenuLabel className="whitespace-normal break-all font-normal text-muted-foreground">
                    {session.user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(ev) => {
                      ev.preventDefault();
                      void handleSignOut();
                    }}
                  >
                    로그아웃
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/terms">이용약관</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/privacy">개인정보처리방침</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : !isMinimalHeader ? (
            <Button asChild>
              <Link href="/login">로그인</Link>
            </Button>
          ) : null}
        </div>

        {isHome ? (
          <div className="flex shrink-0 items-center gap-2 md:hidden">
            {session ? (
              <Button
                asChild
                size="sm"
                className="bg-[#4F46E5] font-semibold text-white hover:bg-[#4338CA]"
              >
                <Link href="/quotes">대시보드</Link>
              </Button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-gray-900 hover:underline"
                >
                  로그인
                </Link>
                <Button
                  asChild
                  size="sm"
                  className="bg-[#4F46E5] px-3 text-xs font-semibold text-white shadow-sm hover:bg-[#4338CA] sm:text-sm"
                >
                  <Link href="/login">무료로 시작하기 →</Link>
                </Button>
              </>
            )}
          </div>
        ) : showMobileMenu ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-panel"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        ) : null}
      </div>

      {showMobileMenu && menuOpen && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[60] md:hidden"
              role="dialog"
              aria-modal="true"
              id="mobile-nav-panel"
            >
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute inset-y-0 right-0 flex w-[80%] max-w-sm flex-col bg-white shadow-xl">
                <div className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
                  <span className="text-sm font-semibold text-gray-900">메뉴</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="메뉴 닫기"
                    onClick={() => setMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <nav
                  className="min-h-0 flex-1 overflow-y-auto bg-white p-2"
                  aria-label="모바일 메뉴"
                >
                  {session
                    ? [...NAV_PUBLIC, NAV_COMPANY].map((item) => {
                        const active =
                          pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className={
                              "flex min-h-11 items-center rounded-md px-3 text-sm font-medium " +
                              (active
                                ? "bg-indigo-50 text-indigo-700"
                                : "text-gray-900 hover:bg-gray-50")
                            }
                          >
                            {item.label}
                          </Link>
                        );
                      })
                    : NAV_PUBLIC.map((item) => {
                        const active =
                          pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className={
                              "flex min-h-11 items-center rounded-md px-3 text-sm font-medium " +
                              (active
                                ? "bg-indigo-50 text-indigo-700"
                                : "text-gray-900 hover:bg-gray-50")
                            }
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                </nav>

                <div className="shrink-0 border-t border-gray-100 bg-white p-4">
                  {session ? (
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">로그인 계정</p>
                        <p className="truncate text-sm font-medium text-gray-900">
                          {session.user.email}
                        </p>
                      </div>
                      <Button onClick={handleSignOut} disabled={loading} variant="outline" size="sm">
                        로그아웃
                      </Button>
                      <div className="border-t border-gray-100 pt-3">
                        <AppLegalBlock variant="menu" className="space-y-2 text-xs leading-snug" />
                      </div>
                    </div>
                  ) : (
                    <Button asChild className="w-full">
                      <Link href="/login" onClick={() => setMenuOpen(false)}>
                        로그인
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </header>
  );
}
