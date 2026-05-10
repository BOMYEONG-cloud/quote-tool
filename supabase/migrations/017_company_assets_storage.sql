-- V-2B-1: 회사 로고/도장 업로드용 Storage (private 버킷 + RLS)
--
-- 권장 사유: 버킷 비공개 + 앱에서만 signed URL 발급.
-- - 다른 사용자 UUID로 경로 추측 시에도 익명/타인 세션으로는 객체 읽기 불가
-- - public 버킷 + 경로 비밀 의존은 URL 유출·무단 링크 재사용 위험이 큼

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  false,
  1048576,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 객체 경로 규칙: {user_id}/logo.<ext> , {user_id}/stamp.<ext>

DROP POLICY IF EXISTS "company_assets_select_own" ON storage.objects;
CREATE POLICY "company_assets_select_own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'company-assets'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "company_assets_insert_own" ON storage.objects;
CREATE POLICY "company_assets_insert_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-assets'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "company_assets_update_own" ON storage.objects;
CREATE POLICY "company_assets_update_own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'company-assets'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'company-assets'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "company_assets_delete_own" ON storage.objects;
CREATE POLICY "company_assets_delete_own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-assets'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );
