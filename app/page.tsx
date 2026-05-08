"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { AuthSection } from "@/components/estimate/auth-section";
import { EstimateForm } from "@/components/estimate/estimate-form";
import { EstimateList } from "@/components/estimate/estimate-list";
import { Estimate } from "@/components/estimate/types";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const supabase = useMemo(() => createClient(), []);

  const [messageTone, setMessageTone] = useState<"neutral" | "success" | "error">("neutral");
  const [message, setMessage] = useState("데이터를 입력하고 저장해보세요.");
  const [loading, setLoading] = useState(false);
  const [estimates, setEstimates] = useState<Estimate[]>([]);

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
    if (!customerName || !projectName || !totalAmount || Number(totalAmount) <= 0) {
      setErrorMessage("고객명, 현장명, 총액(0보다 큰 값)을 모두 입력해 주세요.");
      return false;
    }
    return true;
  };

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
      const { error } = await supabase.from("estimates").insert({
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
      });

      if (error) {
        setErrorMessage(`저장 실패: ${error.message} (code: ${error.code ?? "없음"})`);
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

      if (error) {
        setErrorMessage(`수정 실패: ${error.message}`);
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
  }, [fetchEstimates]);

  return (
    <main className="min-h-screen p-8 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">안녕하세요, 견적서 SaaS 시작합니다!</h1>

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
    </main>
  );
}