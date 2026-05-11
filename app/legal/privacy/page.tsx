export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold text-gray-900">개인정보처리방침 (초안)</h1>
      <p className="text-sm text-muted-foreground">
        본 문서는 placeholder 방침입니다. 정식 서비스 배포 전 법무/보안 검토본으로 교체해야 합니다.
      </p>
      <section className="space-y-2 text-sm text-gray-700">
        <p>1. 수집 항목: 이메일, 견적 작성 데이터, 회사 정보</p>
        <p>2. 이용 목적: 계정 인증, 견적 기능 제공, 고객 지원</p>
        <p>3. 보관 기간: 관계 법령 및 서비스 운영 목적 범위 내 보관</p>
        <p>4. 제3자 제공: 법령상 요구되는 경우를 제외하고 동의 없이 제공하지 않음</p>
        <p>5. 이용자 권리: 열람/정정/삭제 요청 가능</p>
      </section>
    </main>
  );
}
