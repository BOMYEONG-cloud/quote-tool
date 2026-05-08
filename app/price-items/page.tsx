"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { AuthSection } from "@/components/auth/auth-section";
import { PriceItemForm } from "@/components/price-item/price-item-form";
import { PriceItemList } from "@/components/price-item/price-item-list";
import { PriceItem } from "@/components/price-item/types";
import { createClient } from "@/lib/supabase/client";

export default function PriceItemsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [messageTone, setMessageTone] = useState<"neutral" | "success" | "error">("neutral");
  const [message, setMessage] = useState("단가 항목을 입력하고 저장해보세요.");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PriceItem[]>([]);

  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  const handleSignUp = async () => {
    if (!email || !password) {
      setErrorMessage("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setErrorMessage(`회원가입 실패: ${error.message}`);
      return;
    }

    setSuccessMessage("회원가입 성공! 이제 로그인해 주세요.");
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      setErrorMessage("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMessage(`로그인 실패: ${error.message}`);
      return;
    }

    setSuccessMessage("로그인 성공!");
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setErrorMessage(`로그아웃 실패: ${error.message}`);
      return;
    }

    setSession(null);
    setItems([]);
    resetForm();
    setSuccessMessage("로그아웃 성공!");
  };

  const handleInsert = async () => {
    setLoading(true);
    setNeutralMessage("저장 중...");
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const userId = session?.user?.id;
    if (!userId) {
      setErrorMessage("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    try {
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
      resetForm();
      await Promise.all([fetchItems(), fetchCategorySuggestions()]);
    } catch (e) {
      setErrorMessage(
        `예상치 못한 오류: ${e instanceof Error ? e.message : JSON.stringify(e)}`
      );
    } finally {
      setLoading(false);
    }
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
    setNeutralMessage("수정 모드입니다. 값을 바꾼 뒤 수정 저장을 누르세요.");
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setLoading(true);
    setNeutralMessage("수정 저장 중...");
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
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
      resetForm();
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
    fetchItems();
    fetchCategorySuggestions();
  }, [fetchItems, fetchCategorySuggestions]);

  return (
    <main className="min-h-screen p-8 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">단가표 관리</h1>
      <Link className="text-sm text-blue-600 underline" href="/">
        견적 화면으로 이동
      </Link>

      <AuthSection
        session={session}
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSignUp={handleSignUp}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      <PriceItemForm
        sessionExists={Boolean(session)}
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
        onInsert={handleInsert}
        onUpdate={handleUpdate}
        onCancelEdit={() => {
          resetForm();
          setNeutralMessage("수정 모드를 취소했습니다.");
        }}
        onRefresh={fetchItems}
      />

      <p
        className={
          messageTone === "error"
            ? "text-red-600"
            : messageTone === "success"
              ? "text-green-600"
              : "text-muted-foreground"
        }
      >
        {message}
      </p>

      <PriceItemList
        sessionExists={Boolean(session)}
        loading={loading}
        items={items}
        onStartEdit={handleStartEdit}
        onSoftDelete={handleSoftDelete}
      />
    </main>
  );
}

