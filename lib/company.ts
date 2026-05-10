import type { SupabaseClient } from "@supabase/supabase-js";

/** `public.companies` — 견적·PDF·카톡용 (V-2A) */
export type CompanyRow = {
  id: string;
  user_id: string;
  business_name: string;
  representative_name: string | null;
  business_number: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  stamp_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanyUpsertInput = {
  business_name: string;
  representative_name: string | null;
  business_number: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
};

export async function fetchCompanyByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<CompanyRow | null> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as CompanyRow | null;
}

export async function upsertCompanyForUser(
  supabase: SupabaseClient,
  userId: string,
  input: CompanyUpsertInput
): Promise<void> {
  const { error } = await supabase.from("companies").upsert(
    {
      user_id: userId,
      business_name: input.business_name.trim(),
      representative_name: input.representative_name?.trim() || null,
      business_number: input.business_number?.trim() || null,
      address: input.address?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}

export async function updateCompanyAssetUrls(
  supabase: SupabaseClient,
  userId: string,
  patch: Partial<Pick<CompanyRow, "logo_url" | "stamp_url">>
): Promise<CompanyRow> {
  const { data, error } = await supabase
    .from("companies")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("회사 정보를 먼저 저장해 주세요.");
  return data as CompanyRow;
}

/** 사업자등록번호: 숫자만 최대 10자리 → 10-XXX-XXXXX */
export function formatBusinessRegNumber(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
}

/** 휴대폰 등: 숫자만 최대 11자리 → XXX-XXXX-XXXX */
export function formatKoreanPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}
