import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export default function TermsPage() {
  const content = readFileSync(join(process.cwd(), "content/terms.md"), "utf8");

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-4 px-4 py-6 sm:px-5 sm:py-8">
      <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">이용약관</h1>
      <p className="text-xs text-muted-foreground">시행일: 2026년 5월 18일</p>
      <article className="min-w-0 rounded-lg border bg-white p-4">
        <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800">
          {content}
        </pre>
      </article>
      <div>
        <Link href="/" className="text-sm text-indigo-700 underline-offset-2 hover:underline">
          목록으로
        </Link>
      </div>
    </main>
  );
}
