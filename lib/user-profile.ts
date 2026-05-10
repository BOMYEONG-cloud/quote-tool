import type { SupabaseClient } from "@supabase/supabase-js";

/** Supabase `public.user_profiles` — 최소 조회 필드 */
export type UserProfileCompany = {
  company_name: string | null;
};

export async function fetchUserProfileCompany(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfileCompany | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("company_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserProfileCompany | null;
}

/**
 * 회사명만 갱신. 행이 없으면 `id`만 넣어 생성 (다른 컬럼은 DB 기본값·NULL 가정).
 */
export async function saveCompanyName(
  supabase: SupabaseClient,
  userId: string,
  rawName: string
): Promise<void> {
  const company_name = rawName.trim() === "" ? null : rawName.trim();

  const { data: existing, error: selectError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existing) {
    const { error } = await supabase
      .from("user_profiles")
      .update({ company_name })
      .eq("id", userId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("user_profiles").insert({
    id: userId,
    company_name,
  });
  if (error) throw error;
}
