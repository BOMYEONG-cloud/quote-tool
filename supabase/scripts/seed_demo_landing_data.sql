-- =============================================================================
-- 랜딩/스크린샷용 데모 데이터 시드
-- =============================================================================
-- 계정까지 초기화할 때
--   1) remove_demo_account.sql 실행 (데모 이메일 auth 사용자 + 앱 데이터 삭제)
--   2) Dashboard → Authentication 에서 동일 이메일 사용자를 다시 생성
--   3) 본 스크립트 실행
--
-- 계정은 유지하고 데이터만 갈아끼울 때
--   - 본 스크립트만 실행하면 됩니다 (해당 user_id 견적·단가·회사만 삭제 후 재삽입).
--
-- 실행: Supabase Dashboard → SQL Editor (postgres)
-- =============================================================================

DO $$
DECLARE
  demo_email text := 'demo.landing@quotesnote.kr'; -- ← Dashboard 생성 계정과 맞출 것
  uid uuid;
  e1 uuid;
  e2 uuid;
  e3 uuid;
BEGIN
  SELECT id
  INTO uid
  FROM auth.users
  WHERE lower(email) = lower(demo_email)
  LIMIT 1;

  IF uid IS NULL THEN
    RAISE EXCEPTION
      'auth.users 에 email=% 가 없습니다. Authentication에서 해당 이메일 사용자를 만든 뒤 다시 실행하세요.',
      demo_email;
  END IF;

  -- 데모 사용자 앱 데이터만 초기화 (다른 계정은 건드리지 않음)
  DELETE FROM public.estimates WHERE owner_id = uid;
  DELETE FROM public.price_items WHERE owner_id = uid;
  DELETE FROM public.companies WHERE user_id = uid;

  INSERT INTO public.user_profiles (
    id,
    onboarding_completed,
    terms_agreed_at,
    privacy_agreed_at
  )
  VALUES (uid, true, now(), now())
  ON CONFLICT (id) DO UPDATE
  SET
    onboarding_completed = excluded.onboarding_completed,
    terms_agreed_at = coalesce(public.user_profiles.terms_agreed_at, excluded.terms_agreed_at),
    privacy_agreed_at = coalesce(public.user_profiles.privacy_agreed_at, excluded.privacy_agreed_at);

  INSERT INTO public.companies (
    user_id,
    business_name,
    representative_name,
    business_number,
    address,
    phone,
    email,
    logo_url,
    stamp_url
  )
  VALUES (
    uid,
    '(데모) 한빛 인테리어',
    '김데모',
    '123-45-67890',
    '서울특별시 데모구 데모로 12, 3층',
    '02-0000-0000',
    'hello-demo@example.invalid',
    null,
    null
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    business_name = excluded.business_name,
    representative_name = excluded.representative_name,
    business_number = excluded.business_number,
    address = excluded.address,
    phone = excluded.phone,
    email = excluded.email,
    updated_at = now();

  -- 단가표 (internal_name 으로 견적 행에서 조회)
  INSERT INTO public.price_items (
    owner_id,
    category,
    internal_name,
    customer_name,
    unit,
    cost_price,
    margin_rate,
    customer_price,
    memo,
    is_active,
    usage_count,
    sort_order
  )
  VALUES
    (uid, '전기', '다운라이트(12W)', '거실·주방 다운라이트 시공', '개', 8500, null, 15000, '데모 단가', true, 3, 0),
    (uid, '전기', '콘센트 이설', '콘센트·스위치 이설', '개', 12000, null, 22000, '데모 단가', true, 2, 1),
    (uid, '목공', '루버선반', '루버 선반 제작·설치', 'm', 35000, null, 58000, '데모 단가', true, 1, 2),
    (uid, '타일', '욕실 타일', '욕실 벽·바닥 타일(300×600)', 'm2', 28000, null, 45000, '데모 단가', true, 4, 3),
    (uid, '방수', '욕실 방수', '욕실 액체방수 2도', 'm2', 12000, null, 22000, '데모 단가', true, 1, 4),
    (uid, '철거', '욕실 전체 철거', '욕실 타일·배관·목재 철거', '식', 450000, null, 680000, '데모 단가', true, 0, 5),
    (uid, '기타', '유리파티션', '강화유리 파티션(10mm)', 'm2', 120000, null, 185000, '데모 단가', true, 0, 6),
    (uid, '기타', '현장청소', '준공 전 입주 청소', '식', 180000, null, 280000, '데모 단가', true, 0, 7);

  -- ---------- 견적 1: 발송됨, 부가세 포함, 합계 1,100,000 ----------
  INSERT INTO public.estimates (
    owner_id,
    quote_number,
    customer_name,
    project_name,
    site_name,
    construction_type,
    validity_days,
    issued_date,
    internal_memo,
    customer_notes,
    margin_flat_amount,
    subtotal_customer,
    vat_amount,
    vat_included,
    total_amount,
    status
  )
  VALUES (
    uid,
    'Q-2026-DEMO-001',
    '데모건설 주식회사',
    '강남 오피스 리모델',
    '서울 강남구 테헤란로 000',
    '사무실',
    30,
    '2026-01-10',
    '현장 출입은 평일 09~18시. 주차 협소.',
    '계약금 30% / 중도금 40% / 잔금 30%. 계좌는 별도 안내.',
    0,
    1000000,
    100000,
    true,
    1100000,
    '발송됨'
  )
  RETURNING id INTO e1;

  INSERT INTO public.quote_items (
    quote_id,
    price_item_id,
    internal_name,
    customer_name,
    unit,
    quantity,
    unit_cost_price,
    unit_customer_price,
    subtotal_cost,
    subtotal_customer,
    sort_order
  )
  VALUES
    (
      e1,
      (SELECT id FROM public.price_items WHERE owner_id = uid AND internal_name = '다운라이트(12W)' LIMIT 1),
      '다운라이트(12W)',
      '거실·주방 다운라이트 시공',
      '개',
      20,
      8500,
      15000,
      170000,
      300000,
      0
    ),
    (
      e1,
      (SELECT id FROM public.price_items WHERE owner_id = uid AND internal_name = '콘센트 이설' LIMIT 1),
      '콘센트 이설',
      '콘센트·스위치 이설',
      '개',
      10,
      12000,
      22000,
      120000,
      220000,
      1
    ),
    (
      e1,
      (SELECT id FROM public.price_items WHERE owner_id = uid AND internal_name = '루버선반' LIMIT 1),
      '루버선반',
      '루버 선반 제작·설치',
      'm',
      10,
      35000,
      58000,
      350000,
      580000,
      2
    );

  INSERT INTO public.estimate_histories (quote_id, owner_id, action, note, snapshot)
  VALUES (
    e1,
    uid,
    '생성',
    '견적이 생성되었습니다.',
    jsonb_build_object('status', '발송됨', 'total_amount', 1100000, 'item_count', 3, 'margin_flat_amount', 0)
  );

  -- ---------- 견적 2: 임시저장, 부가세 별도, 합계 880,000 ----------
  INSERT INTO public.estimates (
    owner_id,
    quote_number,
    customer_name,
    project_name,
    site_name,
    construction_type,
    validity_days,
    issued_date,
    internal_memo,
    customer_notes,
    margin_flat_amount,
    subtotal_customer,
    vat_amount,
    vat_included,
    total_amount,
    status
  )
  VALUES (
    uid,
    'Q-2026-DEMO-002',
    '바다건축사무소',
    '부산 해운대 카페 인테리어',
    '부산 해운대구 마린시티로 00',
    '상가',
    21,
    '2026-01-18',
    '타일 샘플 2종 제출 예정.',
    null,
    0,
    800000,
    80000,
    false,
    880000,
    '임시저장'
  )
  RETURNING id INTO e2;

  INSERT INTO public.quote_items (
    quote_id,
    price_item_id,
    internal_name,
    customer_name,
    unit,
    quantity,
    unit_cost_price,
    unit_customer_price,
    subtotal_cost,
    subtotal_customer,
    sort_order
  )
  VALUES
    (
      e2,
      (SELECT id FROM public.price_items WHERE owner_id = uid AND internal_name = '욕실 타일' LIMIT 1),
      '욕실 타일',
      '욕실 벽·바닥 타일(300×600)',
      'm2',
      12,
      28000,
      45000,
      336000,
      540000,
      0
    ),
    (
      e2,
      (SELECT id FROM public.price_items WHERE owner_id = uid AND internal_name = '욕실 방수' LIMIT 1),
      '욕실 방수',
      '욕실 액체방수 2도',
      'm2',
      12,
      12000,
      22000,
      144000,
      260000,
      1
    );

  INSERT INTO public.estimate_histories (quote_id, owner_id, action, note, snapshot)
  VALUES (
    e2,
    uid,
    '생성',
    '견적이 생성되었습니다.',
    jsonb_build_object('status', '임시저장', 'total_amount', 880000, 'item_count', 2, 'margin_flat_amount', 0)
  );

  -- ---------- 견적 3: 수락됨, 일괄 마진 100,000 + 부가세 포함 합계 1,100,000 ----------
  INSERT INTO public.estimates (
    owner_id,
    quote_number,
    customer_name,
    project_name,
    site_name,
    construction_type,
    validity_days,
    issued_date,
    internal_memo,
    customer_notes,
    margin_flat_amount,
    subtotal_customer,
    vat_amount,
    vat_included,
    total_amount,
    status
  )
  VALUES (
    uid,
    'Q-2026-DEMO-003',
    '인천주택관리단지',
    '인천 연수구 아파트 욕실 리모델',
    '인천 연수구 컨벤시아대로 00',
    '주거',
    30,
    '2026-02-01',
    '동일 타입 2세대 동시 진행 검토.',
    '자재는 발주처 지정 브랜드 사용.',
    100000,
    1000000,
    100000,
    true,
    1100000,
    '수락됨'
  )
  RETURNING id INTO e3;

  INSERT INTO public.quote_items (
    quote_id,
    price_item_id,
    internal_name,
    customer_name,
    unit,
    quantity,
    unit_cost_price,
    unit_customer_price,
    subtotal_cost,
    subtotal_customer,
    sort_order
  )
  VALUES
    (
      e3,
      (SELECT id FROM public.price_items WHERE owner_id = uid AND internal_name = '욕실 전체 철거' LIMIT 1),
      '욕실 전체 철거',
      '욕실 타일·배관·목재 철거',
      '식',
      1,
      450000,
      500000,
      450000,
      500000,
      0
    ),
    (
      e3,
      (SELECT id FROM public.price_items WHERE owner_id = uid AND internal_name = '유리파티션' LIMIT 1),
      '유리파티션',
      '강화유리 파티션(10mm)',
      'm2',
      2,
      120000,
      250000,
      240000,
      500000,
      1
    );

  INSERT INTO public.estimate_histories (quote_id, owner_id, action, note, snapshot)
  VALUES (
    e3,
    uid,
    '생성',
    '견적이 생성되었습니다.',
    jsonb_build_object('status', '수락됨', 'total_amount', 1100000, 'item_count', 2, 'margin_flat_amount', 100000)
  );

  RAISE NOTICE '데모 시드 완료: user_id=%, email=%', uid, demo_email;
END $$;
