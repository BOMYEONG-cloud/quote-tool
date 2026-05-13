-- =============================================================================
-- 전체 초기화: 앱 데이터 + 로그인 계정(auth.users) 삭제
-- =============================================================================
-- ⚠️  되돌릴 수 없습니다. 프로덕션/스테이징 실행 전 반드시 백업하세요.
--
-- 실행 위치: Supabase Dashboard → SQL Editor (postgres 권한)
-- 로컬: `supabase db reset` 은 마이그레이션만 재적용하고 이 스크립트는 포함하지 않습니다.
--        로컬 전체 초기화는 보통 `supabase db reset` 만으로 충분합니다.
--
-- 참고: auth 스키마 삭제는 Dashboard의 Authentication > Users에서 일괄 삭제와
--       동일한 효과를 SQL로 낼 때 사용합니다.
--
-- Storage: Supabase는 `storage.objects` 직접 DELETE를 막습니다 (protect_delete).
--   이 스크립트 실행 전 또는 후에 Dashboard → Storage → 버킷 `company-assets` 에서
--   객체를 비우거나, Storage API / CLI로 삭제하세요. (미삭제 시 고아 파일만 남음)
-- =============================================================================

BEGIN;

-- 1) Storage — SQL 삭제 불가. 위 주석대로 대시보드 또는 API로 처리하세요.

-- 2) 견적 관련 (estimates 삭제 시 quote_items, estimate_histories는 CASCADE 가정)
--    CASCADE가 없으면 아래 두 줄의 주석을 해제해 먼저 비우세요.
-- DELETE FROM public.estimate_histories;
-- DELETE FROM public.quote_items;
DELETE FROM public.estimates;

-- 3) 단가표
DELETE FROM public.price_items;

-- 4) 회사 프로필·사용자 확장 프로필 (auth.users 삭제 전에 남아 있으면 FK 오류 가능)
DELETE FROM public.companies;
DELETE FROM public.user_profiles;

-- 5) 로그인 계정 (연관된 auth.identities, auth.sessions 등은 보통 CASCADE)
DELETE FROM auth.users;

COMMIT;

-- 실행 후: Authentication에서 사용자 수 0인지 확인하고, Storage `company-assets` 는
--          대시보드에서 비었는지 확인하세요.
