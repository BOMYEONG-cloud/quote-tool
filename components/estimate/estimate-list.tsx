"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Estimate } from "@/components/estimate/types";

type EstimateListProps = {
  sessionExists: boolean;
  loading: boolean;
  estimates: Estimate[];
  onStartEdit: (item: Estimate) => void;
  onDelete: (id: string) => Promise<void>;
};

export function EstimateList({
  sessionExists,
  loading,
  estimates,
  onStartEdit,
  onDelete,
}: EstimateListProps) {
  return (
    <section className="w-full max-w-2xl">
      <h2 className="mb-3 text-xl font-semibold">저장된 견적 목록</h2>

      {!sessionExists ? (
        <p className="text-sm text-muted-foreground">로그인 후 견적 목록을 확인할 수 있습니다.</p>
      ) : estimates.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 저장된 견적이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {estimates.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-base">{item.project_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>고객명: {item.customer_name}</p>
                <p>금액: {Number(item.amount || 0).toLocaleString()}원</p>
                <p>상태: {item.status}</p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    onClick={() => onStartEdit(item)}
                  >
                    수정
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={loading}
                    onClick={() => onDelete(item.id)}
                  >
                    삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </ul>
      )}
    </section>
  );
}
