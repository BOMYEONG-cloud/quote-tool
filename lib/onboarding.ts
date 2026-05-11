import type { SupabaseClient } from "@supabase/supabase-js";

export type OnboardingItemInput = {
  category: string;
  item_name: string;
  unit: string;
  customer_price: number | null;
};

export async function isOnboardingCompleted(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.onboarding_completed);
}

export async function setOnboardingCompleted(
  supabase: SupabaseClient,
  userId: string,
  completed: boolean
): Promise<void> {
  const { error } = await supabase.from("user_profiles").upsert(
    {
      id: userId,
      onboarding_completed: completed,
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}

export async function insertOnboardingPriceItems(
  supabase: SupabaseClient,
  userId: string,
  items: OnboardingItemInput[]
): Promise<void> {
  if (items.length === 0) return;
  const normalized = items
    .map((item) => ({
      category: item.category.trim(),
      item_name: item.item_name.trim(),
      unit: item.unit.trim(),
      customer_price: item.customer_price,
    }))
    .filter((item) => item.category && item.item_name && item.unit);
  if (normalized.length === 0) return;

  const unique = Array.from(
    new Map(normalized.map((v) => [`${v.category}:${v.item_name}:${v.unit}`, v])).values()
  );
  const rows = unique.map((item) => ({
    owner_id: userId,
    category: item.category,
    internal_name: item.item_name,
    customer_name: item.item_name,
    unit: item.unit,
    cost_price: null,
    margin_rate: null,
    customer_price: item.customer_price ?? 0,
    memo: "온보딩에서 추가됨",
    is_active: true,
  }));
  const { error } = await supabase.from("price_items").insert(rows);
  if (error) throw error;
}
