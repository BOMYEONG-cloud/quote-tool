"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EstimateHistoryList } from "@/components/estimate/estimate-history-dialog";
import { PriceItemSelector } from "@/components/estimate/price-item-selector";
import {
  ItemsSection,
  MarginFlatSection,
  MemoSection,
  PublicNotesSection,
  QuoteSteps,
  SaveActions,
  SiteInfoSection,
  Step,
  TotalsSection,
} from "@/components/estimate/quote-editor-sections";
import { EditableQuoteItem } from "@/components/estimate/quote-item-list";
import { Estimate, EstimateHistory } from "@/components/estimate/types";
import { PriceItem } from "@/components/price-item/types";
import { useAuthGuard } from "@/lib/auth/use-auth-guard";
import { MANUAL_CATEGORY_CUSTOM } from "@/lib/editable-quote-category";
import { insertEstimateHistory } from "@/lib/estimate-history";
import { readLastNewQuoteValidityDays, writeLastNewQuoteValidityDays } from "@/lib/new-quote-prefs";
import { captureEvent } from "@/lib/posthog";
import { flatMarginPercentOfBase } from "@/lib/quote-margin";
import { createClient } from "@/lib/supabase/client";

type QuoteEditorProps =
  | { mode: "new" }
  | { mode: "edit"; estimateId: string };

type QuoteEditorDraft = {
  customerName: string;
  projectName: string;
  quoteNumber: string;
  siteName: string;
  constructionType: string;
  validityDays: string;
  issuedDate: string;
  internalMemo: string;
  customerNotes: string;
  marginFlatEnabled: boolean;
  marginFlatAmount: string;
  vatIncluded: boolean;
  status: string;
  quoteItems: EditableQuoteItem[];
};

export function QuoteEditor(props: QuoteEditorProps) {
  useAuthGuard("require-auth");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const editingId = props.mode === "edit" ? props.estimateId : null;

  const [session, setSession] = useState<Session | null>(null);
  const [messageTone, setMessageTone] = useState<"neutral" | "success" | "error">("neutral");
  const [message, setMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<EstimateHistory[]>([]);
  const [currentFormStep, setCurrentFormStep] = useState<1 | 2 | 3>(1);
  const [recentCustomerNotes, setRecentCustomerNotes] = useState<string[]>([]);

  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [quoteItems, setQuoteItems] = useState<EditableQuoteItem[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [siteName, setSiteName] = useState("");
  const [constructionType, setConstructionType] = useState("");
  const [validityDays, setValidityDays] = useState("30");
  /** 새 견적: 기기 임시보관에서 유효일수 읽기 전에는 저장 스킵 */
  const [newQuotePrefsReady, setNewQuotePrefsReady] = useState(() => props.mode === "edit");
  const [issuedDate, setIssuedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [internalMemo, setInternalMemo] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [marginFlatEnabled, setMarginFlatEnabled] = useState(false);
  const [marginFlatAmount, setMarginFlatAmount] = useState("");
  const [vatIncluded, setVatIncluded] = useState(false);
  const [status, setStatus] = useState("임시저장");
  const draftKey = editingId ? `quote-editor-draft:${editingId}` : "quote-editor-draft:new";

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of priceItems) {
      const c = p.category?.trim();
      if (c) set.add(c);
    }
    const list = [...set].sort((a, b) => a.localeCompare(b, "ko-KR"));
    list.push(MANUAL_CATEGORY_CUSTOM);
    return list;
  }, [priceItems]);

  const recalcQuoteItem = useCallback((item: EditableQuoteItem): EditableQuoteItem => {
    const quantity = Number.isFinite(item.quantity) && item.quantity >= 0 ? item.quantity : 0;
    const unitCostPrice =
      item.unit_cost_price == null || !Number.isFinite(item.unit_cost_price)
        ? null
        : item.unit_cost_price;
    const unitCustomerPrice =
      Number.isFinite(item.unit_customer_price) && item.unit_customer_price >= 0
        ? item.unit_customer_price
        : 0;

    let marginRate: number | null = null;
    if (
      unitCostPrice != null &&
      Number.isFinite(unitCostPrice) &&
      unitCostPrice >= 0 &&
      unitCustomerPrice > 0
    ) {
      marginRate = Number(
        (((unitCustomerPrice - unitCostPrice) / unitCustomerPrice) * 100).toFixed(2)
      );
    }

    return {
      ...item,
      quantity,
      unit_cost_price: unitCostPrice,
      margin_rate: marginRate,
      unit_customer_price: unitCustomerPrice,
      subtotal_cost: unitCostPrice == null ? null : Number((quantity * unitCostPrice).toFixed(2)),
      subtotal_customer: Number((quantity * unitCustomerPrice).toFixed(2)),
    };
  }, []);

  const applyDraft = useCallback(
    (parsed: Partial<QuoteEditorDraft>) => {
      if (typeof parsed.customerName === "string") setCustomerName(parsed.customerName);
      if (typeof parsed.projectName === "string") setProjectName(parsed.projectName);
      if (typeof parsed.quoteNumber === "string") setQuoteNumber(parsed.quoteNumber);
      if (typeof parsed.siteName === "string") setSiteName(parsed.siteName);
      if (typeof parsed.constructionType === "string") setConstructionType(parsed.constructionType);
      if (typeof parsed.validityDays === "string") setValidityDays(parsed.validityDays);
      if (typeof parsed.issuedDate === "string") setIssuedDate(parsed.issuedDate);
      if (typeof parsed.internalMemo === "string") setInternalMemo(parsed.internalMemo);
      if (typeof parsed.customerNotes === "string") setCustomerNotes(parsed.customerNotes);
      if (typeof parsed.marginFlatEnabled === "boolean") setMarginFlatEnabled(parsed.marginFlatEnabled);
      if (typeof parsed.marginFlatAmount === "string") setMarginFlatAmount(parsed.marginFlatAmount);
      if (typeof parsed.vatIncluded === "boolean") setVatIncluded(parsed.vatIncluded);
      if (typeof parsed.status === "string") setStatus(parsed.status);
      if (Array.isArray(parsed.quoteItems)) {
        setQuoteItems(parsed.quoteItems.map((item) => recalcQuoteItem(item as EditableQuoteItem)));
      }
    },
    [recalcQuoteItem]
  );

  const setErrorMessage = (next: string) => {
    setMessageTone("error");
    setMessage(next);
  };
  const setSuccessMessage = (next: string) => {
    setMessageTone("success");
    setMessage(next);
  };
  const setNeutralMessage = (next: string) => {
    setMessageTone("neutral");
    setMessage(next);
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!customerName || !projectName) {
      errors.push("고객명, 현장명을 모두 입력해 주세요.");
    }
    if (quoteItems.length === 0) {
      errors.push("견적 항목을 최소 1개 이상 추가해 주세요.");
    }
    if (!totalAmount || Number(totalAmount) <= 0) {
      errors.push("총액이 0보다 커야 합니다.");
    }
    for (const item of quoteItems) {
      if (item.quantity <= 0) {
        errors.push("모든 견적 항목의 수량은 0보다 커야 합니다.");
        break;
      }
      if (item.is_manual) {
        if (!item.category.trim()) {
          errors.push("단가 입력 항목의 카테고리를 선택해 주세요.");
          break;
        }
        const resolvedCategory =
          item.category === MANUAL_CATEGORY_CUSTOM
            ? item.custom_category.trim()
            : item.category.trim();
        if (!resolvedCategory) {
          errors.push("직접 입력 카테고리 이름을 입력해 주세요.");
          break;
        }
        if (!item.unit.trim()) {
          errors.push("단가 입력 항목의 단위를 선택하거나 입력해 주세요.");
          break;
        }
        if (!item.customer_name.trim()) {
          errors.push("단가 입력 항목의 고객용 이름을 입력해 주세요.");
          break;
        }
        if (item.unit_customer_price <= 0) {
          errors.push("단가 입력 항목의 고객용 단가를 입력해 주세요.");
          break;
        }
      }
    }
    setValidationErrors(errors);
    if (errors.length > 0) {
      setErrorMessage(errors[0]);
      return false;
    }
    return true;
  };

  const validateStepBeforeNext = (step: 1 | 2 | 3) => {
    if (step === 1) {
      const errors: string[] = [];
      if (!customerName.trim() || !projectName.trim()) {
        errors.push("고객명, 현장명을 모두 입력해 주세요.");
      }
      setValidationErrors(errors);
      if (errors.length > 0) {
        setErrorMessage(errors[0]);
        return false;
      }
      return true;
    }

    if (step === 2) {
      const errors: string[] = [];
      if (quoteItems.length === 0) {
        errors.push("견적 항목을 최소 1개 이상 추가해 주세요.");
      }
      if (!totalAmount || Number(totalAmount) <= 0) {
        errors.push("총액이 0보다 커야 합니다.");
      }
      for (const item of quoteItems) {
        if (item.quantity <= 0) {
          errors.push("모든 견적 항목의 수량은 0보다 커야 합니다.");
          break;
        }
        if (item.is_manual) {
          if (!item.category.trim()) {
            errors.push("단가 입력 항목의 카테고리를 선택해 주세요.");
            break;
          }
          const resolvedCategory =
            item.category === MANUAL_CATEGORY_CUSTOM
              ? item.custom_category.trim()
              : item.category.trim();
          if (!resolvedCategory) {
            errors.push("직접 입력 카테고리 이름을 입력해 주세요.");
            break;
          }
          if (!item.unit.trim()) {
            errors.push("단가 입력 항목의 단위를 선택하거나 입력해 주세요.");
            break;
          }
          if (!item.customer_name.trim()) {
            errors.push("단가 입력 항목의 고객용 이름을 입력해 주세요.");
            break;
          }
          if (item.unit_customer_price <= 0) {
            errors.push("단가 입력 항목의 고객용 단가를 입력해 주세요.");
            break;
          }
        }
      }
      setValidationErrors(errors);
      if (errors.length > 0) {
        setErrorMessage(errors[0]);
        return false;
      }
      return true;
    }

    return true;
  };

  const prepareQuoteItemsForSave = async (userId: string, quoteId: string) => {
    const payload: Array<{
      quote_id: string;
      price_item_id: string | null;
      internal_name: string;
      customer_name: string;
      unit: string;
      quantity: number;
      unit_cost_price: number | null;
      unit_customer_price: number;
      subtotal_cost: number | null;
      subtotal_customer: number;
      sort_order: number;
    }> = [];

    const ordered = quoteItems.slice().sort((a, b) => a.sort_order - b.sort_order);
    for (let index = 0; index < ordered.length; index += 1) {
      const item = ordered[index];
      let linkedPriceItemId = item.price_item_id;
      const resolvedCategory =
        item.category === MANUAL_CATEGORY_CUSTOM
          ? item.custom_category.trim()
          : item.category.trim();

      if (item.is_manual && item.save_to_price_items) {
        const unitCustomerPrice = item.unit_customer_price;

        if (item.price_item_id) {
          const { error: updatePriceItemError } = await supabase
            .from("price_items")
            .update({
              category: resolvedCategory || "기타",
              internal_name: item.internal_name.trim() || item.customer_name.trim(),
              customer_name: item.customer_name.trim(),
              unit: item.unit,
              cost_price: item.unit_cost_price,
              margin_rate: item.margin_rate,
              customer_price: unitCustomerPrice,
            })
            .eq("id", item.price_item_id)
            .eq("owner_id", userId);

          if (updatePriceItemError) {
            throw new Error(`단가표 수정 실패: ${updatePriceItemError.message}`);
          }
          linkedPriceItemId = item.price_item_id;
        } else {
          const { data: insertedPriceItem, error: insertPriceItemError } = await supabase
            .from("price_items")
            .insert({
              owner_id: userId,
              category: resolvedCategory || "기타",
              internal_name: item.internal_name.trim() || item.customer_name.trim(),
              customer_name: item.customer_name.trim(),
              unit: item.unit,
              cost_price: item.unit_cost_price,
              margin_rate: item.margin_rate,
              customer_price: unitCustomerPrice,
              memo: "견적 단가 입력에서 저장됨",
              is_active: true,
            })
            .select("id")
            .single();

          if (insertPriceItemError || !insertedPriceItem) {
            throw new Error(
              `단가표 저장 실패: ${insertPriceItemError?.message ?? "price_items insert 실패"}`
            );
          }
          linkedPriceItemId = insertedPriceItem.id;
        }
      }

      payload.push({
        quote_id: quoteId,
        price_item_id: linkedPriceItemId,
        internal_name: item.internal_name.trim(),
        customer_name: item.customer_name.trim(),
        unit: item.unit,
        quantity: item.quantity,
        unit_cost_price: item.unit_cost_price,
        unit_customer_price: item.unit_customer_price,
        subtotal_cost: item.subtotal_cost,
        subtotal_customer: item.subtotal_customer,
        sort_order: index,
      });
    }

    return payload;
  };

  const fetchNextQuoteNumber = useCallback(async () => {
    const year = new Date().getFullYear();
    const prefix = `Q-${year}-`;
    const { data, error } = await supabase
      .from("estimates")
      .select("quote_number")
      .like("quote_number", `${prefix}%`)
      .order("quote_number", { ascending: false })
      .limit(1);

    if (error) {
      return `${prefix}0001`;
    }

    const latest = (data ?? [])[0]?.quote_number as string | null | undefined;
    if (!latest) return `${prefix}0001`;

    const tail = latest.slice(prefix.length);
    const parsed = Number.parseInt(tail, 10);
    const next = Number.isFinite(parsed) && parsed > 0 ? parsed + 1 : 1;
    return `${prefix}${String(next).padStart(4, "0")}`;
  }, [supabase]);

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

  const loadEstimate = useCallback(
    async (id: string) => {
      const { data: estimate, error: estimateError } = await supabase
        .from("estimates")
        .select("*")
        .eq("id", id)
        .single();

      if (estimateError || !estimate) {
        setErrorMessage(`견적 조회 실패: ${estimateError?.message ?? "데이터 없음"}`);
        return;
      }

      const item = estimate as Estimate;
      setQuoteNumber(item.quote_number ?? "");
      setCustomerName(item.customer_name);
      setProjectName(item.project_name);
      setSiteName(item.site_name ?? "");
      setConstructionType(item.construction_type ?? "");
      setValidityDays(String(item.validity_days ?? 30));
      setIssuedDate(item.issued_date ?? new Date().toISOString().slice(0, 10));
      setInternalMemo(item.internal_memo ?? "");
      setCustomerNotes(item.customer_notes ?? "");
      {
        const mf = Number(item.margin_flat_amount ?? 0);
        setMarginFlatEnabled(mf > 0);
        setMarginFlatAmount(mf > 0 ? String(Math.round(mf)) : "");
      }
      setVatIncluded(Boolean(item.vat_included));
      setStatus(item.status);

      const { data: items, error: itemsError } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", id)
        .order("sort_order", { ascending: true });

      if (itemsError) {
        setErrorMessage(`견적 항목 조회 실패: ${itemsError.message}`);
        return;
      }

      const mapped: EditableQuoteItem[] = (items ?? []).map((row) =>
        recalcQuoteItem({
          client_id: row.id,
          is_manual: row.price_item_id == null,
          category: "기타",
          custom_category: "",
          price_item_id: row.price_item_id,
          internal_name: row.internal_name,
          customer_name: row.customer_name,
          unit: row.unit,
          quantity: Number(row.quantity ?? 0),
          unit_cost_price: row.unit_cost_price == null ? null : Number(row.unit_cost_price),
          margin_rate: null,
          unit_customer_price: Number(row.unit_customer_price ?? 0),
          subtotal_cost: row.subtotal_cost == null ? null : Number(row.subtotal_cost),
          subtotal_customer: Number(row.subtotal_customer ?? 0),
          sort_order: Number(row.sort_order ?? 0),
          save_to_price_items: false,
        })
      );

      setQuoteItems(mapped);
    },
    [supabase, recalcQuoteItem]
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPriceItems();
  }, [fetchPriceItems]);

  useEffect(() => {
    if (editingId && session) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadEstimate(editingId);
    }
  }, [editingId, session, loadEstimate]);

  useEffect(() => {
    if (!editingId || !session) return;

    let cancelled = false;
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const { data, error } = await supabase
          .from("estimate_histories")
          .select("*")
          .eq("quote_id", editingId)
          .order("created_at", { ascending: false })
          .limit(100);
        if (cancelled) return;
        if (error) {
          setErrorMessage(`히스토리 조회 실패: ${error.message}`);
          setHistoryItems([]);
          return;
        }
        setHistoryItems((data ?? []) as EstimateHistory[]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };
    void fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [editingId, session, supabase]);

  useEffect(() => {
    if (editingId) return;
    const last = readLastNewQuoteValidityDays();
    if (last !== null) {
      // 새 견적: 마지막 입력 유효일수 복원 (기기 임시보관)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 일회성 초기 동기화
      setValidityDays(String(last));
    }
    queueMicrotask(() => {
      setNewQuotePrefsReady(true);
    });
  }, [editingId]);

  useEffect(() => {
    if (editingId || !newQuotePrefsReady) return;
    const n = Number.parseInt(validityDays, 10);
    writeLastNewQuoteValidityDays(Number.isFinite(n) && n > 0 ? n : 30);
  }, [validityDays, editingId, newQuotePrefsReady]);

  useEffect(() => {
    if (editingId || !session) return;
    captureEvent("quote_creation_started");
    let cancelled = false;
    void fetchNextQuoteNumber().then((next) => {
      if (cancelled) return;
      // 사용자가 이미 직접 입력했다면 덮어쓰지 않음
      setQuoteNumber((current) => (current.trim() === "" ? next : current));
    });
    return () => {
      cancelled = true;
    };
  }, [editingId, session, fetchNextQuoteNumber]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const fetchRecentNotes = async () => {
      const { data, error } = await supabase
        .from("estimates")
        .select("customer_notes")
        .not("customer_notes", "is", null)
        .order("updated_at", { ascending: false })
        .limit(8);
      if (cancelled || error) return;
      const unique = Array.from(
        new Set(
          (data ?? [])
            .map((row) => (row.customer_notes ?? "").trim())
            .filter((v) => v.length > 0)
        )
      ).slice(0, 5);
      setRecentCustomerNotes(unique);
    };
    void fetchRecentNotes();
    return () => {
      cancelled = true;
    };
  }, [session, supabase]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<QuoteEditorDraft>;
      queueMicrotask(() => {
        applyDraft(parsed);
        setNeutralMessage("이 기기에 임시 보관된 작성 내용을 복구했습니다.");
      });
    } catch {
      // ignore invalid local draft
    }
  }, [applyDraft, draftKey]);

  useEffect(() => {
    const payload: QuoteEditorDraft = {
      customerName,
      projectName,
      quoteNumber,
      siteName,
      constructionType,
      validityDays,
      issuedDate,
      internalMemo,
      customerNotes,
      marginFlatEnabled,
      marginFlatAmount,
      vatIncluded,
      status,
      quoteItems,
    };
    try {
      window.localStorage.setItem(draftKey, JSON.stringify(payload));
    } catch {
      // ignore localStorage write errors
    }
  }, [
    constructionType,
    customerName,
    customerNotes,
    marginFlatEnabled,
    draftKey,
    internalMemo,
    issuedDate,
    marginFlatAmount,
    projectName,
    quoteItems,
    quoteNumber,
    siteName,
    status,
    validityDays,
    vatIncluded,
  ]);

  const marginFlatParsed = Math.max(0, Number.parseFloat(marginFlatAmount) || 0);
  const activeMarginFlatParsed = marginFlatEnabled ? marginFlatParsed : 0;
  const baseItemsSupplySum = quoteItems.reduce((acc, item) => acc + (item.subtotal_customer || 0), 0);
  const marginPctOfBase = flatMarginPercentOfBase(baseItemsSupplySum, activeMarginFlatParsed);
  const marginPercentHint = marginPctOfBase != null ? String(marginPctOfBase) : null;

  const { subtotalCustomer, vatAmount, totalAmount } = useMemo(() => {
    const itemsSum = baseItemsSupplySum + activeMarginFlatParsed;

    let subtotal: number;
    let vat: number;
    let total: number;

    if (vatIncluded) {
      total = itemsSum;
      subtotal = Number((itemsSum / 1.1).toFixed(2));
      vat = Number((total - subtotal).toFixed(2));
    } else {
      subtotal = itemsSum;
      vat = Number((subtotal * 0.1).toFixed(2));
      total = Number((subtotal + vat).toFixed(2));
    }

    return {
      subtotalCustomer: String(subtotal),
      vatAmount: String(vat),
      totalAmount: String(total),
    };
  }, [vatIncluded, baseItemsSupplySum, activeMarginFlatParsed]);

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
      const mf = marginFlatEnabled ? Math.max(0, Number.parseFloat(marginFlatAmount) || 0) : 0;
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
          customer_notes: customerNotes.trim() || null,
          margin_flat_amount: mf,
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

      const quoteItemPayload = await prepareQuoteItemsForSave(userId, insertedEstimate.id);
      const { error: insertItemsError } = await supabase.from("quote_items").insert(quoteItemPayload);

      if (insertItemsError) {
        await supabase.from("estimates").delete().eq("id", insertedEstimate.id);
        setErrorMessage(`저장 실패(항목): ${insertItemsError.message}`);
        return;
      }

      await insertEstimateHistory({
        supabase,
        quoteId: insertedEstimate.id,
        ownerId: userId,
        action: "생성",
        note: "견적이 생성되었습니다.",
        snapshot: {
          status,
          total_amount: Number(totalAmount || 0),
          item_count: quoteItems.length,
          margin_flat_amount: mf,
        },
      });

      window.localStorage.removeItem(draftKey);
      setValidationErrors([]);
      captureEvent("quote_created", { item_count: quoteItems.length });
      setSuccessMessage("저장 성공!");
      router.push(`/quotes/${insertedEstimate.id}/preview`);
    } catch (e) {
      setErrorMessage(
        `예상치 못한 오류: ${e instanceof Error ? e.message : JSON.stringify(e)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    setLoading(true);
    setNeutralMessage("수정 저장 중...");

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
      const mf = marginFlatEnabled ? Math.max(0, Number.parseFloat(marginFlatAmount) || 0) : 0;
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
          customer_notes: customerNotes.trim() || null,
          margin_flat_amount: mf,
          subtotal_customer: Number(subtotalCustomer || 0),
          vat_amount: Number(vatAmount || 0),
          vat_included: vatIncluded,
          total_amount: Number(totalAmount || 0),
          status,
          updated_at: new Date().toISOString(),
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

      const quoteItemPayload = await prepareQuoteItemsForSave(userId, editingId);
      const { error: insertItemsError } = await supabase.from("quote_items").insert(quoteItemPayload);

      if (insertItemsError) {
        setErrorMessage(`수정 실패(항목 저장): ${insertItemsError.message}`);
        return;
      }

      await insertEstimateHistory({
        supabase,
        quoteId: editingId,
        ownerId: userId,
        action: "수정",
        note: "견적 내용이 수정되었습니다.",
        snapshot: {
          status,
          total_amount: Number(totalAmount || 0),
          item_count: quoteItems.length,
          margin_flat_amount: mf,
        },
      });

      window.localStorage.removeItem(draftKey);
      setValidationErrors([]);
      captureEvent("quote_updated", { item_count: quoteItems.length });
      setSuccessMessage("수정 성공!");
      router.push(`/quotes/${editingId}/preview`);
    } catch (e) {
      setErrorMessage(
        `예상치 못한 오류: ${e instanceof Error ? e.message : JSON.stringify(e)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEstimate = async () => {
    if (!editingId) return;
    const ok = window.confirm("이 견적을 정말 삭제할까요?");
    if (!ok) {
      setNeutralMessage("삭제를 취소했습니다.");
      return;
    }

    setLoading(true);
    setNeutralMessage("삭제 중...");
    try {
      const { error } = await supabase.from("estimates").delete().eq("id", editingId);
      if (error) {
        setErrorMessage(`삭제 실패: ${error.message}`);
        return;
      }
      router.push("/quotes");
    } catch (e) {
      setErrorMessage(
        `예상치 못한 오류: ${e instanceof Error ? e.message : JSON.stringify(e)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSelector = () => {
    if (!session) {
      setErrorMessage("로그인 후 단가표를 선택할 수 있습니다.");
      return;
    }
    void fetchPriceItems();
    setSelectorOpen(true);
  };

  const handleLoadLatestEstimateItems = async () => {
    if (!session) {
      setErrorMessage("로그인이 필요합니다.");
      return;
    }
    setLoading(true);
    setNeutralMessage("직전 견적 항목 불러오는 중...");
    try {
      const { data: latestEstimate, error: latestError } = await supabase
        .from("estimates")
        .select("id")
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestError || !latestEstimate?.id) {
        setErrorMessage("불러올 이전 견적이 없습니다.");
        return;
      }
      const { data: rows, error: rowsError } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", latestEstimate.id)
        .order("sort_order", { ascending: true });
      if (rowsError) {
        setErrorMessage(`직전 견적 항목 조회 실패: ${rowsError.message}`);
        return;
      }
      const mapped: EditableQuoteItem[] = (rows ?? []).map((row, index) =>
        recalcQuoteItem({
          client_id: `latest-${row.id}-${Date.now()}-${index}`,
          is_manual: row.price_item_id == null,
          category: "기타",
          custom_category: "",
          price_item_id: row.price_item_id,
          internal_name: row.internal_name,
          customer_name: row.customer_name,
          unit: row.unit,
          quantity: Number(row.quantity ?? 0),
          unit_cost_price: row.unit_cost_price == null ? null : Number(row.unit_cost_price),
          margin_rate: null,
          unit_customer_price: Number(row.unit_customer_price ?? 0),
          subtotal_cost: row.subtotal_cost == null ? null : Number(row.subtotal_cost),
          subtotal_customer: Number(row.subtotal_customer ?? 0),
          sort_order: index,
          save_to_price_items: false,
        })
      );
      if (mapped.length === 0) {
        setErrorMessage("직전 견적에 항목이 없습니다.");
        return;
      }
      setQuoteItems(mapped);
      setSuccessMessage(`직전 견적 항목 ${mapped.length}개를 불러왔습니다.`);
    } catch (e) {
      setErrorMessage(
        `예상치 못한 오류: ${e instanceof Error ? e.message : JSON.stringify(e)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddManual = (prefillCustomerName?: string) => {
    if (!session) {
      setErrorMessage("로그인 후 단가 입력으로 항목을 추가할 수 있습니다.");
      return;
    }
    const name = prefillCustomerName?.trim() ?? "";
    setQuoteItems((prev) => {
      const defaultCategory =
        categoryOptions.find((c) => c !== MANUAL_CATEGORY_CUSTOM) ??
        categoryOptions[0] ??
        "기타";
      const newItem: EditableQuoteItem = {
        client_id: `manual-${Date.now()}`,
        price_item_id: null,
        is_manual: true,
        category: defaultCategory,
        custom_category: "",
        internal_name: "",
        customer_name: name,
        unit: "",
        quantity: 1,
        unit_cost_price: null,
        margin_rate: null,
        unit_customer_price: 0,
        subtotal_cost: null,
        subtotal_customer: 0,
        sort_order: 0,
        save_to_price_items: true,
      };
      const shifted = prev
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item, index) => ({ ...item, sort_order: index + 1 }));
      return [recalcQuoteItem(newItem), ...shifted];
    });
  };

  const handleAddPriceItemAsEditableManual = useCallback(
    (item: PriceItem) => {
      if (!session) {
        setErrorMessage("로그인 후 항목을 추가할 수 있습니다.");
        return;
      }
      setQuoteItems((prev) => {
        const addition = recalcQuoteItem({
          client_id: `manual-from-${item.id}-${Date.now()}`,
          is_manual: true,
          category: item.category ?? "기타",
          custom_category: "",
          price_item_id: item.id,
          internal_name: item.internal_name,
          customer_name: item.customer_name,
          unit: item.unit,
          quantity: 1,
          unit_cost_price: item.cost_price,
          margin_rate: item.margin_rate,
          unit_customer_price: item.customer_price,
          subtotal_cost: item.cost_price == null ? null : item.cost_price,
          subtotal_customer: item.customer_price,
          sort_order: 0,
          save_to_price_items: true,
        });
        const shifted = prev
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((row, index) => ({ ...row, sort_order: index + 1 }));
        return [addition, ...shifted];
      });
      setNeutralMessage(`「${item.customer_name}」 단가를 아래에서 수정한 뒤 견적에 반영할 수 있어요.`);
    },
    [recalcQuoteItem, session]
  );

  const handleAddFromPriceItem = useCallback(
    (item: PriceItem) => {
      if (!session) {
        setErrorMessage("로그인 후 항목을 추가할 수 있습니다.");
        return;
      }
      setQuoteItems((prev) => {
        const addition = recalcQuoteItem({
          client_id: `${item.id}-${Date.now()}`,
          is_manual: false,
          category: item.category ?? "기타",
          custom_category: "",
          price_item_id: item.id,
          internal_name: item.internal_name,
          customer_name: item.customer_name,
          unit: item.unit,
          quantity: 1,
          unit_cost_price: item.cost_price,
          margin_rate: item.margin_rate,
          unit_customer_price: item.customer_price,
          subtotal_cost: item.cost_price == null ? null : item.cost_price,
          subtotal_customer: item.customer_price,
          sort_order: 0,
          save_to_price_items: false,
        });
        const shifted = prev
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((row, index) => ({ ...row, sort_order: index + 1 }));
        return [addition, ...shifted];
      });
      setNeutralMessage(`「${item.customer_name}」 항목을 추가했습니다.`);
    },
    [recalcQuoteItem, session]
  );

  const handleMoveItem = (clientId: string, direction: "up" | "down") => {
    setQuoteItems((prev) => {
      const ordered = prev.slice().sort((a, b) => a.sort_order - b.sort_order);
      const index = ordered.findIndex((item) => item.client_id === clientId);
      if (index === -1) return prev;
      const swapWith = direction === "up" ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= ordered.length) return prev;
      const next = ordered.slice();
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next.map((item, i) => ({ ...item, sort_order: i }));
    });
  };

  const editorTitle = (() => {
    if (!editingId) return "새 견적";
    const name = projectName.trim();
    return name || "견적 수정";
  })();

  const stateOf = (n: number): Step["state"] => {
    if (currentFormStep > n) return "completed";
    if (currentFormStep === n) return "current";
    return "pending";
  };

  const steps: Step[] = [
    { number: 1, label: "현장 정보", state: stateOf(1) },
    { number: 2, label: "견적 항목", state: stateOf(2) },
    { number: 3, label: "비고 및 메모", state: stateOf(3) },
  ];

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-4 p-4 pb-6 sm:gap-5 sm:p-5 sm:pb-8">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">{editorTitle}</h1>
        {!editingId ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={() => router.push("/quotes")} disabled={loading}>
              목록
            </Button>
          </div>
        ) : null}
      </div>

      <QuoteSteps steps={steps} />

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="touch-manipulation"
          disabled={loading}
          onClick={() => void handleLoadLatestEstimateItems()}
        >
          직전 견적 항목 불러오기
        </Button>
        <Button
          variant="outline"
          className="touch-manipulation"
          disabled={loading}
          onClick={() => {
            window.localStorage.removeItem(draftKey);
            setNeutralMessage("임시 보관된 작성 내용을 삭제했습니다.");
          }}
        >
          임시 작성 내용 삭제
        </Button>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
        작성 내용은 이 기기에서 자동으로 임시 보관됩니다. 저장 완료 시 자동으로 정리됩니다.
      </p>

      <Card>
        <CardContent className="space-y-0 px-0 py-0">
          {currentFormStep === 1 ? (
            <div className="px-4 py-2.5 sm:px-5 sm:py-3">
              <SiteInfoSection
                sessionExists={Boolean(session)}
                statusLocked={!editingId}
                quoteNumber={quoteNumber}
                customerName={customerName}
                projectName={projectName}
                siteName={siteName}
                constructionType={constructionType}
                validityDays={validityDays}
                issuedDate={issuedDate}
                status={status}
                onQuoteNumberChange={setQuoteNumber}
                onCustomerNameChange={setCustomerName}
                onProjectNameChange={setProjectName}
                onSiteNameChange={setSiteName}
                onConstructionTypeChange={setConstructionType}
                onValidityDaysChange={setValidityDays}
                onIssuedDateChange={setIssuedDate}
                onStatusChange={setStatus}
              />
            </div>
          ) : null}

          {currentFormStep === 2 ? (
            <div className="px-4 py-2.5 sm:px-5 sm:py-3">
              <div className="space-y-4">
                <ItemsSection
                  sessionExists={Boolean(session)}
                  loading={loading}
                  items={quoteItems}
                  categoryOptions={categoryOptions}
                  marginFlatAmount={activeMarginFlatParsed}
                  priceItems={priceItems}
                  embedded
                  onOpenSelector={handleOpenSelector}
                  onAddFromPriceItem={handleAddFromPriceItem}
                  onAddPriceItemAsEditableManual={handleAddPriceItemAsEditableManual}
                  onAddManual={handleAddManual}
                  onItemChange={(clientId, patch) => {
                    setQuoteItems((prev) =>
                      prev.map((item) =>
                        item.client_id === clientId ? recalcQuoteItem({ ...item, ...patch }) : item
                      )
                    );
                  }}
                  onRemove={(clientId) => {
                    setQuoteItems((prev) =>
                      prev
                        .filter((item) => item.client_id !== clientId)
                        .slice()
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((item, index) => ({ ...item, sort_order: index }))
                    );
                  }}
                  onMove={handleMoveItem}
                />
                <div className="bg-indigo-50/60 space-y-4 rounded-lg p-3 sm:p-4">
                  <TotalsSection
                    sessionExists={Boolean(session)}
                    subtotalCustomer={subtotalCustomer}
                    vatAmount={vatAmount}
                    vatIncluded={vatIncluded}
                    totalAmount={totalAmount}
                    onVatIncludedChange={setVatIncluded}
                  />
                  <MarginFlatSection
                    sessionExists={Boolean(session)}
                    disabled={loading}
                    enabled={marginFlatEnabled}
                    marginFlat={marginFlatAmount}
                    marginPercentHint={marginPercentHint}
                    onEnabledChange={(next) => {
                      setMarginFlatEnabled(next);
                      if (!next) setMarginFlatAmount("");
                    }}
                    onMarginFlatChange={setMarginFlatAmount}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {currentFormStep === 3 ? (
            <div className="space-y-4 px-4 py-2.5 sm:space-y-5 sm:px-5 sm:py-3">
              <PublicNotesSection
                sessionExists={Boolean(session)}
                customerNotes={customerNotes}
                recentNotes={recentCustomerNotes}
                onCustomerNotesChange={setCustomerNotes}
                onApplyRecentNote={setCustomerNotes}
              />
              <MemoSection
                sessionExists={Boolean(session)}
                internalMemo={internalMemo}
                onInternalMemoChange={setInternalMemo}
              />
              {editingId ? (
                <section className="space-y-3" aria-labelledby="quote-edit-history">
                  <h3 id="quote-edit-history" className="text-base font-semibold text-gray-900 sm:text-lg">
                    수정 히스토리
                  </h3>
                  <EstimateHistoryList
                    items={historyItems}
                    loading={historyLoading}
                    emptyText="아직 수정 히스토리가 없습니다."
                  />
                </section>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-stretch justify-between gap-3 sm:items-center">
        <Button
          variant="outline"
          className="min-h-11 min-w-[5.5rem] flex-1 touch-manipulation px-4 text-base font-semibold sm:flex-initial sm:min-w-[7rem]"
          disabled={currentFormStep === 1}
          onClick={() => setCurrentFormStep((prev) => (prev === 1 ? prev : ((prev - 1) as 1 | 2 | 3)))}
        >
          이전
        </Button>
        {currentFormStep === 3 && editingId ? null : (
          <Button
            className="min-h-11 min-w-[5.5rem] flex-1 touch-manipulation bg-indigo-600 px-4 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 sm:flex-initial sm:min-w-[7rem]"
            disabled={
              currentFormStep === 3 && !editingId ? loading || !session : false
            }
            onClick={() => {
              if (currentFormStep === 3 && !editingId) {
                void handleInsert();
                return;
              }
              if (!validateStepBeforeNext(currentFormStep)) return;
              setCurrentFormStep((prev) => (prev === 3 ? prev : ((prev + 1) as 1 | 2 | 3)));
            }}
          >
            {currentFormStep === 3 && !editingId
              ? loading
                ? "저장 중..."
                : "견적 완료"
              : "다음"}
          </Button>
        )}
      </div>

      {message ? (
        <p
          className={
            messageTone === "error"
              ? "text-sm text-red-600 sm:text-base"
              : messageTone === "success"
                ? "text-sm text-green-600 sm:text-base"
                : "text-sm text-muted-foreground sm:text-base"
          }
        >
          {message}
        </p>
      ) : null}

      {validationErrors.length > 0 ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-semibold text-red-700">저장 전에 아래 항목을 확인해 주세요.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
            {validationErrors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {currentFormStep === 3 && editingId ? (
        <SaveActions
          sessionExists={Boolean(session)}
          loading={loading}
          onUpdate={handleUpdate}
          onDelete={handleDeleteEstimate}
        />
      ) : null}

      <PriceItemSelector
        open={selectorOpen}
        loading={loading}
        items={priceItems}
        onClose={() => setSelectorOpen(false)}
        onConfirm={(selected) => {
          setSelectorOpen(false);
          setQuoteItems((prev) => {
            const additions: EditableQuoteItem[] = selected.map((item, index) =>
              recalcQuoteItem({
                client_id: `${item.id}-${Date.now()}-${index}`,
                is_manual: false,
                category: item.category ?? "기타",
                custom_category: "",
                price_item_id: item.id,
                internal_name: item.internal_name,
                customer_name: item.customer_name,
                unit: item.unit,
                quantity: 1,
                unit_cost_price: item.cost_price,
                margin_rate: item.margin_rate,
                unit_customer_price: item.customer_price,
                subtotal_cost: item.cost_price == null ? null : item.cost_price,
                subtotal_customer: item.customer_price,
                sort_order: index,
                save_to_price_items: false,
              })
            );
            const offset = additions.length;
            const shifted = prev
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((item, index) => ({ ...item, sort_order: offset + index }));
            return [...additions, ...shifted];
          });
          setNeutralMessage(`${selected.length}개 항목이 견적에 추가되었습니다.`);
        }}
      />
    </main>
  );
}
