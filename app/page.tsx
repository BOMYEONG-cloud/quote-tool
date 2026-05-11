"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        router.replace("/quotes");
        return;
      }
      setCheckingSession(false);
    });

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  if (checkingSession) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] w-full min-w-0 items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full min-w-0 max-w-5xl px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-10">
      <section className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50 to-white px-5 py-8 sm:px-8 sm:py-10">
        <p className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
          시공·인테리어 팀을 위한 모바일 견적 도구
        </p>
        <h1 className="mt-4 text-2xl font-semibold leading-snug text-gray-900 sm:text-3xl">
          견적은 빠르게 작성하고,
          <br />한 곳에서 모아 관리하고, 바로 발송하세요
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
          견적노트는 디지털이 익숙하지 않아도 쉽게 쓰도록 구성했습니다. 복잡한 메뉴 없이
          새 견적 작성, 견적 목록 관리, PDF/카카오 발송까지 하나의 흐름으로 끝낼 수 있습니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild size="lg" className="h-12 px-6">
            <Link href="/login">1분 안에 시작하기</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-6">
            <Link href="/quotes/new">바로 견적 작성하기</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-6">
            <Link href="/quotes">기존 사용자: 견적 목록</Link>
          </Button>
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          {
            title: "빠르게 작성",
            body: "고객명·현장명부터 입력하고 단가표 선택만으로 견적서를 빠르게 완성합니다.",
          },
          {
            title: "모아서 관리",
            body: "견적 목록에서 상태별로 필터하고, 최근 업데이트와 수정 히스토리를 바로 확인합니다.",
          },
          {
            title: "다양하게 발송",
            body: "미리보기, PDF 다운로드, 카카오 안내문 복사까지 한 화면에서 처리할 수 있습니다.",
          },
        ].map((item) => (
          <article key={item.title} className="rounded-xl border bg-white px-4 py-4">
            <h2 className="text-base font-semibold text-gray-900">{item.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border bg-white px-5 py-6 sm:px-8">
        <h2 className="text-base font-semibold text-gray-900 sm:text-lg">왜 먼저 도입하기 쉬운가요?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            {
              title: "학습 부담이 낮음",
              body: "엑셀 대체 관점으로 구성해 처음 써도 바로 입력-저장-발송 흐름을 따라갈 수 있습니다.",
            },
            {
              title: "데이터는 계정별로 관리",
              body: "작성한 견적은 계정 기준으로 분리되어 목록/상태/히스토리로 추적할 수 있습니다.",
            },
            {
              title: "현장 전달에 바로 사용",
              body: "미리보기 확인 후 PDF/카카오 안내문으로 고객 전달까지 한 번에 처리됩니다.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-xl border bg-gray-50 px-4 py-4">
              <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border bg-white px-5 py-6 sm:px-8">
        <h2 className="text-base font-semibold text-gray-900 sm:text-lg">3단계로 끝나는 견적 운영</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["1", "시작", "고객명/현장명 입력 후 단가표를 불러오거나 직접 항목을 추가합니다."],
            ["2", "작성", "수량·단가를 조정하고 합계/부가세를 확인해 견적서를 완성합니다."],
            ["3", "발송", "미리보기에서 PDF/카톡 공유 후 상태를 발송됨으로 전환해 추적합니다."],
          ].map(([step, title, body]) => (
            <li key={step} className="rounded-xl border px-4 py-4">
              <p className="text-xs font-semibold text-indigo-700">STEP {step}</p>
              <h3 className="mt-1 text-base font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-600">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8 rounded-2xl border bg-white px-5 py-6 sm:px-8">
        <h2 className="text-base font-semibold text-gray-900 sm:text-lg">실제 페이지로 보는 사용 흐름</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-lg border bg-gray-50 p-3">
            <p className="text-xs font-medium text-indigo-700">01 새 견적 페이지</p>
            <div className="mt-2 overflow-hidden rounded-md border bg-white">
              <Image
                src="/landing-quote-editor.svg"
                alt="새 견적 페이지 미리보기"
                width={640}
                height={420}
                className="h-auto w-full"
              />
            </div>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              현장 정보 입력 + 단가표에서 선택/단가 입력
            </p>
            <p className="mt-1 text-sm text-gray-600">필수 항목부터 입력하고 바로 저장합니다.</p>
          </article>

          <article className="rounded-lg border bg-gray-50 p-3">
            <p className="text-xs font-medium text-indigo-700">02 견적 목록 페이지</p>
            <div className="mt-2 overflow-hidden rounded-md border bg-white">
              <Image
                src="/landing-quote-list.svg"
                alt="견적 목록 페이지 미리보기"
                width={640}
                height={420}
                className="h-auto w-full"
              />
            </div>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              상태 필터 + 견적번호/최근 업데이트 + 히스토리
            </p>
            <p className="mt-1 text-sm text-gray-600">작성한 견적을 한눈에 보고 관리합니다.</p>
          </article>

          <article className="rounded-lg border bg-gray-50 p-3">
            <p className="text-xs font-medium text-indigo-700">03 견적 미리보기 페이지</p>
            <div className="mt-2 overflow-hidden rounded-md border bg-white">
              <Image
                src="/landing-quote-preview.svg"
                alt="견적 미리보기 페이지 미리보기"
                width={640}
                height={420}
                className="h-auto w-full"
              />
            </div>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              미리보기 확인 후 PDF 다운로드/카카오 공유
            </p>
            <p className="mt-1 text-sm text-gray-600">고객에게 전달하기 전 최종 확인이 쉽습니다.</p>
          </article>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/quotes/new">새 견적 바로 작성</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/quotes">견적 목록 보기</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
