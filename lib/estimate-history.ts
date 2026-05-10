import type { SupabaseClient } from "@supabase/supabase-js";

export type EstimateHistoryAction = "생성" | "수정" | "상태 변경";

type InsertEstimateHistoryArgs = {
  supabase: SupabaseClient;
  quoteId: string;
  ownerId: string;
  action: EstimateHistoryAction;
  note?: string;
  snapshot?: Record<string, unknown>;
};

export async function insertEstimateHistory({
  supabase,
  quoteId,
  ownerId,
  action,
  note,
  snapshot,
}: InsertEstimateHistoryArgs) {
  const { error } = await supabase.from("estimate_histories").insert({
    quote_id: quoteId,
    owner_id: ownerId,
    action,
    note: note ?? null,
    snapshot: snapshot ?? null,
  });

  return { error };
}

export function formatHistoryDateTime(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
