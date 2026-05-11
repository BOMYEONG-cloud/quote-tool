export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold text-gray-900">이용약관 (초안)</h1>
      <p className="text-sm text-muted-foreground">
        본 문서는 placeholder 약관입니다. 정식 서비스 배포 전 법무 검토본으로 교체해야 합니다.
      </p>
      <section className="space-y-2 text-sm text-gray-700">
        <p>1. 서비스 목적: 견적/단가 관리 도구 제공</p>
        <p>2. 계정 책임: 계정 보안 및 접근 권한 관리는 사용자 책임</p>
        <p>3. 이용 제한: 불법적 목적, 타인 권리 침해 금지</p>
        <p>4. 면책: 시스템 점검/장애에 따른 일시 중단 가능</p>
        <p>5. 약관 변경: 변경 시 공지 후 적용</p>
      </section>
    </main>
  );
}
