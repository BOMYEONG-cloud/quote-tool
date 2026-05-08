"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { AuthSection } from "@/components/auth/auth-section";
import { EstimateForm } from "@/components/estimate/estimate-form";
import { EstimateList } from "@/components/estimate/estimate-list";
import { PriceItemSelector } from "@/components/estimate/price-item-selector";
import { EditableQuoteItem, QuoteItemList } from "@/components/estimate/quote-item-list";
import { Estimate } from "@/components/estimate/types";
import { PriceItem } from "@/components/price-item/types";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const supabase = useMemo(() => createClient(), []);

  const [messageTone, setMessageTone] = useState<"neutral" | "success" | "error">("neutral");
  const [message, setMessage] = useState("데이터를 입력하고 저장해보세요.");
  const [loading, setLoading] = useState(false);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [quoteItems, setQuoteItems] = useState<EditableQuoteItem[]>([]);

  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [siteName, setSiteName] = useState("");
  const [constructionType, setConstructionType] = useState("");
  const [validityDays, setValidityDays] = useState("30");
  const [issuedDate, setIssuedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [internalMemo, setInternalMemo] = useState("");
  const [subtotalCustomer, setSubtotalCustomer] = useState("0");
  const [vatAmount, setVatAmount] = useState("0");
  const [vatIncluded, setVatIncluded] = useState(false);
  const [totalAmount, setTotalAmount] = useState("0");
  const [status, setStatus] = useState("임시저장");
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setQuoteNumber("");
    setCustomerName("");
    setProjectName("");
    setSiteName("");
    setConstructionType("");
    setValidityDays("30");
    setIssuedDate(new Date().toISOString().slice(0, 10));
    setInternalMemo("");
    setSubtotalCustomer("0");
    setVatAmount("0");
    setVatIncluded(false);
    setTotalAmount("0");
    setStatus("임시저장");
    setQuoteItems([]);
  };

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

  const validateForm = () => {
    if (!customerName || !projectName) {
      setErrorMessage("고객명, 현장명을 모두 입력해 주세요.");
      return false;
    }
    if (quoteItems.length === 0) {
      setErrorMessage("견적 항목을 최소 1개 이상 추가해 주세요.");
      return false;
    }
    if (!totalAmount || Number(totalAmount) <= 0) {
      setErrorMessage("총액이 0보다 커야 합니다.");
      return false;
    }
    return true;
  };

  const buildQuoteItemPayload = (quoteId: string) =>
    quoteItems.map((item, index) => ({
      quote_id: quoteId,
      price_item_id: item.price_item_id,
      internal_name: item.internal_name,
      customer_name: item.customer_name,
      unit: item.unit,
      quantity: item.quantity,
      unit_cost_price: item.unit_cost_price,
      unit_customer_price: item.unit_customer_price,
      subtotal_cost: item.subtotal_cost,
      subtotal_customer: item.subtotal_customer,
      sort_order: index,
    }));

  const fetchEstimates = useCallback(async () => {
    if (!session) {
      setEstimates([]);
      return;
    }

    const { data, error } = await supabase
      .from("estimates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(`목록 조회 실패: ${error.message}`);
      return;
    }

    setEstimates((data ?? []) as Estimate[]);
  }, [session, supabase]);

  useEffect(() => {
    const nextSubtotal = quoteItems.reduce((acc, item) => acc + (item.subtotal_customer || 0), 0);
    setSubtotalCustomer(String(nextSubtotal));
    setTotalAmount(String(nextSubtotal));
  }, [quoteItems]);

  const fetchPriceItems = useCallback(async () => {
    if (!session) {
      setPriceItems([]);
      return;
    }

    const { data, error } = await supabase
      .from("price_items")
      .select("*")
      .eq("is_active", true)
      .order("usage_count", { ascending: false });

    if (error) {
      setErrorMessage(`단가표 조회 실패: ${error.message}`);
      return;
    }

    setPriceItems((data ?? []) as PriceItem[]);
  }, [session, supabase]);

  const loadQuoteItems = useCallback(
    async (quoteId: string) => {
      const { data, error } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", quoteId)
        .order("sort_order", { ascending: true });

      if (error) {
        setErrorMessage(`견적 항목 조회 실패: ${error.message}`);
        return;
      }

      const mapped: EditableQuoteItem[] = (data ?? []).map((item) => ({
        client_id: item.id,
        price_item_id: item.price_item_id,
        internal_name: item.internal_name,
        customer_name: item.customer_name,
        unit: item.unit,
        quantity: Number(item.quantity ?? 0),
        unit_cost_price: item.unit_cost_price == null ? null : Number(item.unit_cost_price),
        unit_customer_price: Number(item.unit_customer_price ?? 0),
        subtotal_cost: item.subtotal_cost == null ? null : Number(item.subtotal_cost),
        subtotal_customer: Number(item.subtotal_customer ?? 0),
        sort_order: Number(item.sort_order ?? 0),
      }));

      setQuoteItems(mapped);
    },
    [supabase]
  );

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
    setEstimates([]);
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
      const { data: insertedEstimate, error: insertEstimateError } = await supabase
        .from("estimates")
        .insert({
          quote_number: quoteNumber.trim() || null,
          customer_name: customerName,
          project_name: projectName,
          site_name: siteName.trim() || null,
          construction_type: constructionType.trim() || null,
          validity_days: Number(validityDays || 30),
          issued_date: issuedDate,
          internal_memo: internalMemo.trim() || null,
          subtotal_customer: Number(subtotalCustomer || 0),
          vat_amount: Number(vatAmount || 0),
          vat_included: vatIncluded,
          total_amount: Number(totalAmount || 0),
          status,
          owner_id: userId,
        })
        .select("id")
        .single();

      if (insertEstimateError || !insertedEstimate) {
        setErrorMessage(
          `저장 실패: ${insertEstimateError?.message ?? "견적 헤더 생성 실패"} (code: ${
            insertEstimateError?.code ?? "없음"
          })`
        );
        return;
      }

      const quoteItemPayload = buildQuoteItemPayload(insertedEstimate.id);
      const { error: insertItemsError } = await supabase.from("quote_items").insert(quoteItemPayload);

      if (insertItemsError) {
        await supabase.from("estimates").delete().eq("id", insertedEstimate.id);
        setErrorMessage(`저장 실패(항목): ${insertItemsError.message}`);
        return;
      }

      setSuccessMessage("저장 성공! 목록을 새로 불러옵니다.");
      resetForm();
      await fetchEstimates();
    } catch (e) {
      setErrorMessage(
        `예상치 못한 오류: ${e instanceof Error ? e.message : JSON.stringify(e)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (item: Estimate) => {
    setEditingId(item.id);
    setQuoteNumber(item.quote_number ?? "");
    setCustomerName(item.customer_name);
    setProjectName(item.project_name);
    setSiteName(item.site_name ?? "");
    setConstructionType(item.construction_type ?? "");
    setValidityDays(String(item.validity_days ?? 30));
    setIssuedDate(item.issued_date ?? new Date().toISOString().slice(0, 10));
    setInternalMemo(item.internal_memo ?? "");
    setSubtotalCustomer(String(item.subtotal_customer ?? 0));
    setVatAmount(String(item.vat_amount ?? 0));
    setVatIncluded(Boolean(item.vat_included));
    setTotalAmount(String(item.total_amount ?? 0));
    setStatus(item.status);
    void loadQuoteItems(item.id);
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
      const { error: updateEstimateError } = await supabase
        .from("estimates")
        .update({
          quote_number: quoteNumber.trim() || null,
          customer_name: customerName,
          project_name: projectName,
          site_name: siteName.trim() || null,
          construction_type: constructionType.trim() || null,
          validity_days: Number(validityDays || 30),
          issued_date: issuedDate,
          internal_memo: internalMemo.trim() || null,
          subtotal_customer: Number(subtotalCustomer || 0),
          vat_amount: Number(vatAmount || 0),
          vat_included: vatIncluded,
          total_amount: Number(totalAmount || 0),
          status,
        })
        .eq("id", editingId);

      if (updateEstimateError) {
        setErrorMessage(`수정 실패: ${updateEstimateError.message}`);
        return;
      }

      const { error: deleteItemsError } = await supabase
        .from("quote_items")
        .delete()
        .eq("quote_id", editingId);

      if (deleteItemsError) {
        setErrorMessage(`수정 실패(기존 항목 삭제): ${deleteItemsError.message}`);
        return;
      }

      const quoteItemPayload = buildQuoteItemPayload(editingId);
      const { error: insertItemsError } = await supabase.from("quote_items").insert(quoteItemPayload);

      if (insertItemsError) {
        setErrorMessage(`수정 실패(항목 저장): ${insertItemsError.message}`);
        return;
      }

      setSuccessMessage("수정 성공!");
      resetForm();
      await fetchEstimates();
    } catch (e) {
      setErrorMessage(
        `예상치 못한 오류: ${e instanceof Error ? e.message : JSON.stringify(e)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = window.confirm("이 견적을 정말 삭제할까요?");
    if (!shouldDelete) {
      setNeutralMessage("삭제를 취소했습니다.");
      return;
    }

    setLoading(true);
    setNeutralMessage("삭제 중...");

    try {
      const { error } = await supabase.from("estimates").delete().eq("id", id);

      if (error) {
        setErrorMessage(`삭제 실패: ${error.message}`);
        return;
      }

      setSuccessMessage("삭제 성공!");
      await fetchEstimates();
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
    fetchEstimates();
    fetchPriceItems();
  }, [fetchEstimates, fetchPriceItems]);

  return (
    <main className="min-h-screen p-8 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">안녕하세요, 견적서 SaaS 시작합니다!</h1>
      <Link className="text-sm text-blue-600 underline" href="/price-items">
        단가표 화면으로 이동
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

      <EstimateForm
        sessionExists={Boolean(session)}
        loading={loading}
        editingId={editingId}
        quoteNumber={quoteNumber}
        customerName={customerName}
        projectName={projectName}
        siteName={siteName}
        constructionType={constructionType}
        validityDays={validityDays}
        issuedDate={issuedDate}
        internalMemo={internalMemo}
        subtotalCustomer={subtotalCustomer}
        vatAmount={vatAmount}
        vatIncluded={vatIncluded}
        totalAmount={totalAmount}
        status={status}
        onQuoteNumberChange={setQuoteNumber}
        onCustomerNameChange={setCustomerName}
        onProjectNameChange={setProjectName}
        onSiteNameChange={setSiteName}
        onConstructionTypeChange={setConstructionType}
        onValidityDaysChange={setValidityDays}
        onIssuedDateChange={setIssuedDate}
        onInternalMemoChange={setInternalMemo}
        onSubtotalCustomerChange={setSubtotalCustomer}
        onVatAmountChange={setVatAmount}
        onVatIncludedChange={setVatIncluded}
        onTotalAmountChange={setTotalAmount}
        onStatusChange={setStatus}
        onOpenPriceItemSelector={() => {
          if (!session) {
            setErrorMessage("로그인 후 단가표를 선택할 수 있습니다.");
            return;
          }
          setSelectorOpen(true);
        }}
        onInsert={handleInsert}
        onUpdate={handleUpdate}
        onCancelEdit={() => {
          resetForm();
          setNeutralMessage("수정 모드를 취소했습니다.");
        }}
        onRefresh={fetchEstimates}
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

      <EstimateList
        sessionExists={Boolean(session)}
        loading={loading}
        estimates={estimates}
        onStartEdit={handleStartEdit}
        onDelete={handleDelete}
      />

      <QuoteItemList
        items={quoteItems}
        loading={loading}
        onQuantityChange={(clientId, quantity) => {
          const safeQuantity = Number.isFinite(quantity) && quantity >= 0 ? quantity : 0;
          setQuoteItems((prev) =>
            prev.map((item) =>
              item.client_id === clientId
                ? {
                    ...item,
                    quantity: safeQuantity,
                    subtotal_cost:
                      item.unit_cost_price == null ? null : Number((safeQuantity * item.unit_cost_price).toFixed(2)),
                    subtotal_customer: Number((safeQuantity * item.unit_customer_price).toFixed(2)),
                  }
                : item
            )
          );
        }}
        onRemove={(clientId) => {
          setQuoteItems((prev) => prev.filter((item) => item.client_id !== clientId));
        }}
      />

      <PriceItemSelector
        open={selectorOpen}
        loading={loading}
        items={priceItems}
        onClose={() => setSelectorOpen(false)}
        onConfirm={(selected) => {
          setSelectorOpen(false);
          setQuoteItems((prev) => {
            const baseOrder = prev.length;
            const additions: EditableQuoteItem[] = selected.map((item, index) => ({
              client_id: `${item.id}-${Date.now()}-${index}`,
              price_item_id: item.id,
              internal_name: item.internal_name,
              customer_name: item.customer_name,
              unit: item.unit,
              quantity: 1,
              unit_cost_price: item.cost_price,
              unit_customer_price: item.customer_price,
              subtotal_cost: item.cost_price == null ? null : item.cost_price,
              subtotal_customer: item.customer_price,
              sort_order: baseOrder + index,
            }));
            return [...prev, ...additions];
          });
          setNeutralMessage(`${selected.length}개 항목이 견적에 추가되었습니다.`);
        }}
      />
    </main>
  );
}