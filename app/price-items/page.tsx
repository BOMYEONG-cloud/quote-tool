"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { PriceItemDialog } from "@/components/price-item/price-item-dialog";
import { PriceItemList } from "@/components/price-item/price-item-list";
import { PriceItem } from "@/components/price-item/types";
import { cn } from "@/lib/utils";
import { useAuthGuard } from "@/lib/auth/use-auth-guard";
import { createClient } from "@/lib/supabase/client";

const ALL_CATEGORY = "전체" as const;

export default function PriceItemsPage() {
  useAuthGuard("require-auth");
  const supabase = useMemo(() => createClient(), []);

  const [messageTone, setMessageTone] = useState<"neutral" | "success" | "error">("neutral");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PriceItem[]>([]);

  const [session, setSession] = useState<Session | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);

  const [category, setCategory] = useState("");
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [internalName, setInternalName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [unit, setUnit] = useState("m²");
  const [costPrice, setCostPrice] = useState("");
  const [marginRate, setMarginRate] = useState("");
  const [customerPrice, setCustomerPrice] = useState("");
  const [memo, setMemo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const setErrorMessage = (nextMessage: string) => {
    setMessageTone("error");
    setMessage(nextMessage);
  };

  const setSuccessMessage = (nextMessage: string) => {
    setMessageTone("success");
    setMessage(nextMessage);
  };

  const setNeutralMessage = (nextMessage: string) => {
    setMessageTone("neutral");
    setMessage(nextMessage);
  };

  const resetForm = () => {
    setEditingId(null);
    setCategory("");
    setInternalName("");
    setCustomerName("");
    setUnit("m²");
    setCostPrice("");
    setMarginRate("");
    setCustomerPrice("");
    setMemo("");
  };

  const validateForm = () => {
    if (!category.trim()) {
      setErrorMessage("카테고리를 입력해 주세요.");
      return false;
    }
    if (!internalName.trim() || !customerName.trim()) {
      setErrorMessage("내부용 이름과 고객용 이름을 입력해 주세요.");
      return false;
    }
    if (!customerPrice || Number(customerPrice) <= 0) {
      setErrorMessage("고객가는 0보다 큰 값으로 입력해 주세요.");
      return false;
    }
    return true;
  };

  const fetchCategorySuggestions = useCallback(async () => {
    if (!session) {
      setCategorySuggestions([]);
      return;
    }

    const { data, error } = await supabase
      .from("price_items")
      .select("category")
      .order("category", { ascending: true });

    if (error) {
      setErrorMessage(`카테고리 조회 실패: ${error.message}`);
      return;
    }

    const uniqueCategories = Array.from(
      new Set(
        (data ?? [])
          .map((row) => row.category?.trim())
          .filter((value): value is string => Boolean(value))
      )
    );
    setCategorySuggestions(uniqueCategories);
  }, [session, supabase]);

  const fetchItems = useCallback(async () => {
    if (!session) {
      setItems([]);
      return;
    }

    const { data, error } = await supabase
      .from("price_items")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("usage_count", { ascending: false });

    if (error) {
      setErrorMessage(`목록 조회 실패: ${error.message}`);
      return;
    }

    setItems((data ?? []) as PriceItem[]);
  }, [session, supabase]);

  const handleStartCreate = () => {
    if (!session) {
      setErrorMessage("로그인 후 단가를 추가할 수 있습니다.");
      return;
    }
    resetForm();
    if (activeCategory !== ALL_CATEGORY) {
      setCategory(activeCategory);
    }
    setNeutralMessage("");
    setDialogOpen(true);
  };

  const handleStartEdit = (item: PriceItem) => {
    setEditingId(item.id);
    setCategory(item.category);
    setInternalName(item.internal_name);
    setCustomerName(item.customer_name);
    setUnit(item.unit);
    setCostPrice(item.cost_price == null ? "" : String(item.cost_price));
    setMarginRate(item.margin_rate == null ? "" : String(item.margin_rate));
    setCustomerPrice(String(item.customer_price));
    setMemo(item.memo ?? "");
    setNeutralMessage("");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const userId = session?.user?.id;
    if (!userId) {
      setErrorMessage("로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    setNeutralMessage(editingId ? "수정 저장 중..." : "저장 중...");

    try {
      if (editingId) {
        const { error } = await supabase
          .from("price_items")
          .update({
            category: category.trim(),
            internal_name: internalName.trim(),
            customer_name: customerName.trim(),
            unit,
            cost_price: costPrice ? Number(costPrice) : null,
            margin_rate: marginRate ? Number(marginRate) : null,
            customer_price: Number(customerPrice),
            memo: memo.trim() || null,
          })
          .eq("id", editingId);

        if (error) {
          setErrorMessage(`수정 실패: ${error.message}`);
          return;
        }
        setSuccessMessage("수정 성공!");
      } else {
        const { error } = await supabase.from("price_items").insert({
          owner_id: userId,
          category: category.trim(),
          internal_name: internalName.trim(),
          customer_name: customerName.trim(),
          unit,
          cost_price: costPrice ? Number(costPrice) : null,
          margin_rate: marginRate ? Number(marginRate) : null,
          customer_price: Number(customerPrice),
          memo: memo.trim() || null,
          is_active: true,
        });

        if (error) {
          setErrorMessage(`저장 실패: ${error.message} (code: ${error.code ?? "없음"})`);
          return;
        }
        setSuccessMessage("단가 항목 저장 성공!");
      }

      resetForm();
      setDialogOpen(false);
      await Promise.all([fetchItems(), fetchCategorySuggestions()]);
    } catch (e) {
      setErrorMessage(
        `예상치 못한 오류: ${e instanceof Error ? e.message : JSON.stringify(e)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDelete = async (id: string) => {
    const shouldDelete = window.confirm("이 항목을 비활성화할까요?");
    if (!shouldDelete) {
      setNeutralMessage("비활성화를 취소했습니다.");
      return;
    }

    setLoading(true);
    setNeutralMessage("비활성화 중...");
    try {
      const { error } = await supabase
        .from("price_items")
        .update({ is_active: false })
        .eq("id", id);

      if (error) {
        setErrorMessage(`비활성화 실패: ${error.message}`);
        return;
      }

      setSuccessMessage("비활성화 성공!");
      await Promise.all([fetchItems(), fetchCategorySuggestions()]);
    } catch (e) {
      setErrorMessage(
        `예상치 못한 오류: ${e instanceof Error ? e.message : JSON.stringify(e)}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
    fetchCategorySuggestions();
  }, [fetchItems, fetchCategorySuggestions]);

  const tabs = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const item of items) {
      const key = (item.category ?? "").trim() || "미분류";
      if (!seen.has(key)) {
        seen.add(key);
        ordered.push(key);
      }
    }
    ordered.sort((a, b) => a.localeCompare(b, "ko-KR"));
    return [ALL_CATEGORY, ...ordered];
  }, [items]);

  useEffect(() => {
    if (activeCategory !== ALL_CATEGORY && !tabs.includes(activeCategory)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveCategory(ALL_CATEGORY);
    }
  }, [tabs, activeCategory]);

  const visibleItems = useMemo(() => {
    if (activeCategory === ALL_CATEGORY) return items;
    return items.filter(
      (item) => ((item.category ?? "").trim() || "미분류") === activeCategory
    );
  }, [items, activeCategory]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">단가표</h1>
        <Button onClick={handleStartCreate} disabled={!session || loading}>
          <Plus className="h-4 w-4" />
          새 단가
        </Button>
      </div>

      {tabs.length > 1 ? (
        <nav
          className="-mx-1 flex flex-wrap gap-2 overflow-x-auto px-1"
          aria-label="단가 카테고리"
        >
          {tabs.map((tab) => {
            const active = tab === activeCategory;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveCategory(tab)}
                aria-pressed={active}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-300 bg-background text-gray-700 hover:bg-gray-50"
                )}
              >
                {tab}
              </button>
            );
          })}
        </nav>
      ) : null}

      {message ? (
        <p
          className={
            messageTone === "error"
              ? "text-sm text-red-600"
              : messageTone === "success"
                ? "text-sm text-green-600"
                : "text-sm text-muted-foreground"
          }
        >
          {message}
        </p>
      ) : null}

      {session && items.length === 0 && messageTone !== "error" && !message ? (
        <p className="text-sm text-muted-foreground">
          아직 등록한 단가가 없어요. 우측 상단{" "}
          <span className="font-medium text-gray-900">새 단가</span> 버튼으로 추가해보세요.
        </p>
      ) : null}

      {session && items.length > 0 && visibleItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          이 카테고리에 등록된 단가가 없습니다.
        </p>
      ) : null}

      <PriceItemList
        sessionExists={Boolean(session)}
        loading={loading}
        items={visibleItems}
        onStartEdit={handleStartEdit}
        onSoftDelete={handleSoftDelete}
      />

      <PriceItemDialog
        key={editingId ?? "create"}
        open={dialogOpen}
        onOpenChange={(next) => {
          setDialogOpen(next);
          if (!next) {
            resetForm();
          }
        }}
        loading={loading}
        editingId={editingId}
        category={category}
        categorySuggestions={categorySuggestions}
        internalName={internalName}
        customerName={customerName}
        unit={unit}
        costPrice={costPrice}
        marginRate={marginRate}
        customerPrice={customerPrice}
        memo={memo}
        onCategoryChange={setCategory}
        onInternalNameChange={setInternalName}
        onCustomerNameChange={setCustomerName}
        onUnitChange={setUnit}
        onCostPriceChange={setCostPrice}
        onMarginRateChange={setMarginRate}
        onCustomerPriceChange={setCustomerPrice}
        onMemoChange={setMemo}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
