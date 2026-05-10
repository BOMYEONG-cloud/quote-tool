"use client";

import dynamic from "next/dynamic";
import type { Address } from "react-daum-postcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DaumPostcodeEmbed = dynamic(
  () => import("react-daum-postcode").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
        주소 검색 불러오는 중…
      </div>
    ),
  }
);

type DaumAddressDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (fullLine: string) => void;
};

export function DaumAddressDialog({ open, onOpenChange, onSelect }: DaumAddressDialogProps) {
  const handleComplete = (data: Address) => {
    const road = data.roadAddress?.trim();
    const jibun = data.jibunAddress?.trim();
    const base = road || jibun || data.address?.trim() || "";
    const extra =
      data.buildingName?.trim() && base && !base.includes(data.buildingName)
        ? ` (${data.buildingName})`
        : "";
    const zip = data.zonecode?.trim();
    const line = [zip ? `(${zip})` : "", base + extra].filter(Boolean).join(" ");
    onSelect(line.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-4 py-3 text-left">
          <DialogTitle>주소 검색</DialogTitle>
        </DialogHeader>
        <div className="h-[420px] w-full overflow-hidden">
          {open ? (
            <DaumPostcodeEmbed onComplete={handleComplete} style={{ height: "100%", width: "100%" }} />
          ) : null}
        </div>
        <DialogFooter className="border-t border-border px-4 py-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
