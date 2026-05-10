import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Estimate, QuoteItem } from "@/components/estimate/types";
import {
  displayCompanyLabel,
  formatIssuedDate,
  formatValidityLine,
  itemizedDocumentTitle,
} from "@/lib/quote-preview/format-plain";
import { computeQuoteTotals } from "@/lib/quote-preview/totals";

Font.register({
  family: "Pretendard",
  src: "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static/Pretendard-Regular.otf",
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Pretendard",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 40,
    color: "#111827",
  },
  docHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  docHeaderSide: { flex: 1 },
  docHeaderRight: { flex: 1, alignItems: "flex-end" },
  title: { flex: 2, fontSize: 18, textAlign: "center", fontWeight: 600 },
  quoteNumTop: { fontSize: 9, textAlign: "right", color: "#6b7280", paddingTop: 2 },
  company: { fontSize: 11, textAlign: "center", marginBottom: 12 },
  hr: { borderBottomWidth: 1, borderBottomColor: "#d1d5db", marginVertical: 10 },
  row: { flexDirection: "row", marginBottom: 4 },
  dt: { width: 72, color: "#4b5563" },
  dd: { flex: 1 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
    paddingBottom: 4,
    marginTop: 8,
    marginBottom: 4,
    fontWeight: 600,
  },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", paddingVertical: 4 },
  colName: { width: "32%" },
  colUnit: { width: "10%", textAlign: "center" },
  colPrice: { width: "18%", textAlign: "right" },
  colQty: { width: "12%", textAlign: "center" },
  colSub: { width: "18%", textAlign: "right" },
  totals: { marginTop: 16, width: "100%" },
  totalLine: { fontSize: 10, textAlign: "right" },
  totalStrong: { marginTop: 8, fontSize: 11, fontWeight: 600, textAlign: "right" },
  footer: { marginTop: 28, textAlign: "center", fontSize: 10 },
  contTitle: { fontSize: 11, marginBottom: 10, color: "#374151" },
});

const money = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

function chunkRows<T>(rows: T[], size: number): T[][] {
  if (rows.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) {
    out.push(rows.slice(i, i + size));
  }
  return out;
}

function PdfTableRows({ rows }: { rows: QuoteItem[] }) {
  return rows.map((row) => (
    <View key={row.id} style={styles.tableRow} wrap={false}>
      <Text style={styles.colName}>{row.customer_name?.trim() || "—"}</Text>
      <Text style={styles.colUnit}>{row.unit?.trim() || "—"}</Text>
      <Text style={styles.colPrice}>{money(Number(row.unit_customer_price ?? 0))}</Text>
      <Text style={styles.colQty}>{String(Number(row.quantity ?? 0))}</Text>
      <Text style={styles.colSub}>{money(Number(row.subtotal_customer ?? 0))}</Text>
    </View>
  ));
}

export type QuotePdfDocumentProps = {
  estimate: Estimate;
  items: QuoteItem[];
  companyName: string | null;
};

export function QuotePdfDocument({ estimate, items, companyName }: QuotePdfDocumentProps) {
  const ordered = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const totals = computeQuoteTotals(ordered, estimate.vat_included);
  const co = displayCompanyLabel(companyName);
  const issued = formatIssuedDate(estimate.issued_date);
  const qn = estimate.quote_number?.trim() || "";
  const siteDetail = estimate.site_name?.trim();
  const ctype = estimate.construction_type?.trim();

  const ROWS_PER_PAGE = 14;
  const chunks = chunkRows(ordered, ROWS_PER_PAGE);

  const HeaderBlock = (
    <>
      <View style={styles.docHeaderRow}>
        <View style={styles.docHeaderSide} />
        <Text style={styles.title}>{itemizedDocumentTitle(estimate)}</Text>
        <View style={styles.docHeaderRight}>
          {qn ? <Text style={styles.quoteNumTop}>{qn}</Text> : null}
        </View>
      </View>
      <Text style={styles.company}>{co}</Text>
      <View style={styles.hr} />

      <View style={styles.row}>
        <Text style={styles.dt}>고객명</Text>
        <Text style={styles.dd}>{estimate.customer_name?.trim() || "—"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.dt}>현장명</Text>
        <Text style={styles.dd}>{estimate.project_name?.trim() || "—"}</Text>
      </View>
      {siteDetail ? (
        <View style={styles.row}>
          <Text style={styles.dt}>세부 현장명</Text>
          <Text style={styles.dd}>{siteDetail}</Text>
        </View>
      ) : null}
      {ctype ? (
        <View style={styles.row}>
          <Text style={styles.dt}>시공 종류</Text>
          <Text style={styles.dd}>{ctype}</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        <Text style={styles.dt}>발행일</Text>
        <Text style={styles.dd}>{issued}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.dt}>유효기간</Text>
        <Text style={styles.dd}>{formatValidityLine(estimate)}</Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={styles.colName}>품목명</Text>
        <Text style={styles.colUnit}>단위</Text>
        <Text style={styles.colPrice}>단가</Text>
        <Text style={styles.colQty}>수량</Text>
        <Text style={styles.colSub}>소계</Text>
      </View>
    </>
  );

  const TotalsFooter = (
    <>
      <View style={styles.totals}>
        <Text style={styles.totalLine}>공급가: {money(totals.subtotal)}</Text>
        <Text style={styles.totalLine}>부가세: {money(totals.vat)}</Text>
        <Text style={styles.totalStrong}>총액: {money(totals.total)}</Text>
      </View>
      <View style={styles.footer}>
        <Text>상기와 같이 견적합니다.</Text>
        <Text style={{ marginTop: 8 }}>{co} 드림</Text>
      </View>
    </>
  );

  if (chunks.length === 1) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {HeaderBlock}
          <PdfTableRows rows={chunks[0]} />
          {TotalsFooter}
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {HeaderBlock}
        <PdfTableRows rows={chunks[0]} />
      </Page>
      {chunks.slice(1, -1).map((chunk, idx) => (
        <Page key={`mid-${idx}`} size="A4" style={styles.page}>
          <Text style={styles.contTitle}>견적서 (이어서)</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colName}>품목명</Text>
            <Text style={styles.colUnit}>단위</Text>
            <Text style={styles.colPrice}>단가</Text>
            <Text style={styles.colQty}>수량</Text>
            <Text style={styles.colSub}>소계</Text>
          </View>
          <PdfTableRows rows={chunk} />
        </Page>
      ))}
      <Page size="A4" style={styles.page}>
        <Text style={styles.contTitle}>견적서 (이어서)</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.colName}>품목명</Text>
          <Text style={styles.colUnit}>단위</Text>
          <Text style={styles.colPrice}>단가</Text>
          <Text style={styles.colQty}>수량</Text>
          <Text style={styles.colSub}>소계</Text>
        </View>
        <PdfTableRows rows={chunks[chunks.length - 1]} />
        {TotalsFooter}
      </Page>
    </Document>
  );
}
