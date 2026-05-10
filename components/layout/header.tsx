"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, NotebookPen, X } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS: Array<{ href: string; label: string }> = [
  { href: "/quotes", label: "견적" },
  { href: "/price-items", label: "단가표" },
];

export function Header() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
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

  const showMobileMenu = !isLoginPage;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-semibold text-gray-900"
            aria-label="견적노트 홈"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-white"
              aria-hidden="true"
            >
              <NotebookPen className="h-4 w-4" />
            </span>
            견적노트
          </Link>
          {!isLoginPage ? (
            <nav
              className="hidden items-center gap-4 text-base text-gray-600 md:flex"
              aria-label="주요 메뉴"
            >
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-gray-900">
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              <span className="max-w-64 truncate text-sm text-muted-foreground">
                {session.user.email}
              </span>
              <Button asChild variant="ghost" size="sm" className="text-gray-700">
                <Link href="/settings">설정</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut} disabled={loading}>
                로그아웃
              </Button>
            </>
          ) : !isLoginPage ? (
            <Button asChild size="sm">
              <Link href="/login">로그인</Link>
            </Button>
          ) : null}
        </div>

        {showMobileMenu ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
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
                <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
                  <span className="text-base font-semibold text-gray-900">메뉴</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="메뉴 닫기"
                    onClick={() => setMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <nav className="flex flex-col gap-1 bg-white p-2" aria-label="모바일 메뉴">
                  {NAV_ITEMS.map((item) => {
                    const active =
                      pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={
                          "flex min-h-12 items-center rounded-md px-3 text-base font-medium " +
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

                <Separator />

                <div className="mt-auto flex flex-col gap-3 bg-white p-4">
                  {session ? (
                    <>
                      <p className="text-sm text-muted-foreground">로그인 계정</p>
                      <p className="truncate text-sm font-medium text-gray-900">
                        {session.user.email}
                      </p>
                      <Button asChild variant="outline">
                        <Link href="/settings" onClick={() => setMenuOpen(false)}>
                          설정
                        </Link>
                      </Button>
                      <Button onClick={handleSignOut} disabled={loading} variant="outline">
                        로그아웃
                      </Button>
                    </>
                  ) : (
                    <Button asChild>
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
