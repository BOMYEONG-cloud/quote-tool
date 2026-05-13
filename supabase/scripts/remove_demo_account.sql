-- =============================================================================
-- 데모 계정 삭제 (앱 데이터 + auth.users)
-- =============================================================================
-- 대상: demo_email 과 일치하는 auth.users 1명 (기본: demo.landing@quotesnote.kr)
--
-- 실행 후: Supabase Dashboard → Authentication 에서 동일 이메일 사용자를 다시 만든 뒤
--          supabase/scripts/seed_demo_landing_data.sql 을 실행해 데모 데이터를 채우세요.
--
-- 실행: Dashboard → SQL Editor (postgres)
-- Storage: company-assets 에 해당 user_id 경로 파일이 있으면 대시보드에서 수동 삭제
--         (SQL 로 storage.objects 직접 삭제는 Supabase 에서 막힐 수 있음)
-- =============================================================================

DO $$
DECLARE
  demo_email text := 'demo.landing@quotesnote.kr';
  uid uuid;
BEGIN
  SELECT id
  INTO uid
  FROM auth.users
  WHERE lower(email) = lower(demo_email)
  LIMIT 1;

  IF uid IS NULL THEN
    RAISE NOTICE '삭제할 사용자 없음 (email=%).', demo_email;
    RETURN;
  END IF;

  DELETE FROM public.estimates WHERE owner_id = uid;
  DELETE FROM public.price_items WHERE owner_id = uid;
  DELETE FROM public.companies WHERE user_id = uid;
  DELETE FROM public.user_profiles WHERE id = uid;

  DELETE FROM auth.users WHERE id = uid;

  RAISE NOTICE '데모 계정 삭제 완료: %. 동일 이메일로 사용자를 다 만든 뒤 seed_demo_landing_data.sql 을 실행하세요.', demo_email;
END $$;
