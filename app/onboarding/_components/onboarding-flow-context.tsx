"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type OnboardingPriceItem = {
  id: string;
  name: string;
  unit: string;
  price: string;
};

type CompanyDraft = {
  business_name: string;
  representative_name: string;
  business_number: string;
  address: string;
  phone: string;
  email: string;
};

type OnboardingFlowState = {
  selectedServiceIds: string[];
  setSelectedServiceIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedCategories: string[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  pricesByCategory: Record<string, OnboardingPriceItem[]>;
  setPricesByCategory: React.Dispatch<React.SetStateAction<Record<string, OnboardingPriceItem[]>>>;
  companyDraft: CompanyDraft;
  setCompanyDraft: React.Dispatch<React.SetStateAction<CompanyDraft>>;
};

const OnboardingFlowContext = createContext<OnboardingFlowState | null>(null);

export function OnboardingFlowProvider({ children }: { children: React.ReactNode }) {
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pricesByCategory, setPricesByCategory] = useState<Record<string, OnboardingPriceItem[]>>({});
  const [companyDraft, setCompanyDraft] = useState<CompanyDraft>({
    business_name: "",
    representative_name: "",
    business_number: "",
    address: "",
    phone: "",
    email: "",
  });

  const value = useMemo(
    () => ({
      selectedServiceIds,
      setSelectedServiceIds,
      selectedCategories,
      setSelectedCategories,
      pricesByCategory,
      setPricesByCategory,
      companyDraft,
      setCompanyDraft,
    }),
    [companyDraft, pricesByCategory, selectedCategories, selectedServiceIds]
  );

  return <OnboardingFlowContext.Provider value={value}>{children}</OnboardingFlowContext.Provider>;
}

export function useOnboardingFlow() {
  const ctx = useContext(OnboardingFlowContext);
  if (!ctx) throw new Error("useOnboardingFlow must be used inside OnboardingFlowProvider");
  return ctx;
}
