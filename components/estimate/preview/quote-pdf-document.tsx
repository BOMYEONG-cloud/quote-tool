import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { CompanyRow } from "@/lib/company";
import type { Estimate, QuoteItem } from "@/components/estimate/types";
import {
  buildCompanyDisplayLines,
  computeAdjustedQuoteTotals,
  displayCompanyLabel,
  formatIssuedDate,
  formatKRWAmount,
  formatValidityLine,
  itemizedDocumentTitle,
} from "@/lib/quote-preview/format-plain";
import { adjustedCustomerSubtotal, sumQuoteQuantities } from "@/lib/quote-margin";

Font.register({
  family: "Pretendard",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static/Pretendard-Regular.otf",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static/Pretendard-Bold.otf",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Pretendard",
    fontWeight: 400,
    fontSize: 10,
    paddingTop: 60,
    paddingBottom: 56,
    paddingHorizontal: 40,
    color: "#111827",
  },
  headerMetaTop: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 28,
    width: "100%",
  },
  metaTable: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignSelf: "flex-end",
  },
  titleCenter: {
    fontSize: 18,
    textAlign: "center",
    fontWeight: 700,
    marginTop: 4,
    marginBottom: 16,
  },
  hr: { borderBottomWidth: 1, borderBottomColor: "#d1d5db", marginBottom: 16 },
  companyBlockOuter: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    marginBottom: 16,
    maxWidth: "100%",
  },
  companyTextBox: {
    alignItems: "flex-end",
    maxWidth: "80%",
  },
  companyLogoBox: {
    marginLeft: 8,
    width: 100,
    minHeight: 64,
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  companyLogo: {
    width: 100,
    height: 64,
    objectFit: "contain",
  },
  metaRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#d1d5db" },
  metaRowLast: { flexDirection: "row" },
  metaTh: {
    width: 76,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: "#fdfdfd",
    fontSize: 8,
    fontWeight: 700,
    textAlign: "center",
    color: "#374151",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#d1d5db",
  },
  metaThText: { fontSize: 8, fontWeight: 700, textAlign: "center", color: "#374151" },
  metaTd: {
    minWidth: 108,
    maxWidth: 200,
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 8,
    textAlign: "right",
    color: "#111827",
  },
  companyNameLarge: { fontSize: 12, fontWeight: 700, textAlign: "right", marginBottom: 4 },
  companySubLine: { fontSize: 8, color: "#374151", marginTop: 2, textAlign: "right" },
  row: { flexDirection: "row", marginBottom: 6 },
  dt: { width: 72, color: "#4b5563", fontWeight: 700 },
  dd: { flex: 1 },
  tableWrap: { marginTop: 10, width: "100%", borderWidth: 1, borderColor: "#d1d5db" },
  tableHeader: { flexDirection: "row", backgroundColor: "#fcfcfd" },
  tableRow: { flexDirection: "row" },
  colName: { width: "34%" },
  colUnit: { width: "11%" },
  colPrice: { width: "19%" },
  colQty: { width: "11%" },
  colSub: { width: "25%" },
  cellHead: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 8,
    fontWeight: 700,
    textAlign: "center",
  },
  cellHeadLast: {
    borderBottomWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 8,
    fontWeight: 700,
    textAlign: "center",
  },
  cellBodyL: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 9,
    textAlign: "left",
  },
  cellBodyC: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 9,
    textAlign: "center",
  },
  cellBodyR: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 9,
    textAlign: "right",
  },
  cellBodyLast: {
    borderBottomWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 9,
    textAlign: "right",
  },
  totals: { marginTop: 16, width: "100%" },
  totalLine: { fontSize: 10, textAlign: "right" },
  totalStrong: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 700,
    textAlign: "right",
    color: "#4338ca",
  },
  footer: { marginTop: 28, fontSize: 10, width: "100%" },
  footerInner: { position: "relative", width: "100%", minHeight: 72 },
  footerCenterBlock: { width: "100%", alignItems: "center" },
  footerText: { width: "100%", textAlign: "center" },
  stampAbsolute: { position: "absolute", right: 0, bottom: 0, width: 72, height: 72 },
  stampImage: { width: 72, height: 72, objectFit: "contain" },
  contTitle: { fontSize: 11, fontWeight: 700, marginBottom: 12, color: "#374151" },
  customerNotesWrap: {
    marginTop: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    backgroundColor: "#fafafa",
    width: "100%",
  },
  customerNotesTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6, color: "#1f2937" },
  customerNotesLine: { fontSize: 9, color: "#374151", lineHeight: 1.4 },
});

const moneyWithWon = (n: number) => `${formatKRWAmount(n)}원`;

function chunkRows<T>(rows: T[], size: number): T[][] {
  if (rows.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

function PdfTableRows({
  rows,
  marginFlat,
  totalQty,
}: {
  rows: QuoteItem[];
  marginFlat: number;
  totalQty: number;
}) {
  return rows.map((row) => (
    <View key={row.id} style={styles.tableRow} wrap={false}>
      <Text style={[styles.colName, styles.cellBodyL]}>{row.customer_name?.trim() || "—"}</Text>
      <Text style={[styles.colUnit, styles.cellBodyC]}>{row.unit?.trim() || "—"}</Text>
      <Text style={[styles.colPrice, styles.cellBodyR]}>
        {formatKRWAmount(Number(row.unit_customer_price ?? 0))}
      </Text>
      <Text style={[styles.colQty, styles.cellBodyC]}>{String(Number(row.quantity ?? 0))}</Text>
      <Text style={[styles.colSub, styles.cellBodyLast]}>
        {formatKRWAmount(adjustedCustomerSubtotal(row, marginFlat, totalQty))}
      </Text>
    </View>
  ));
}

function PdfTableHeader() {
  return (
    <View style={styles.tableHeader}>
      <Text style={[styles.colName, styles.cellHead]}>품목명</Text>
      <Text style={[styles.colUnit, styles.cellHead]}>단위</Text>
      <Text style={[styles.colPrice, styles.cellHead]}>단가(원)</Text>
      <Text style={[styles.colQty, styles.cellHead]}>수량</Text>
      <Text style={[styles.colSub, styles.cellHeadLast]}>소계(원)</Text>
    </View>
  );
}

function CompanySubLines({ company }: { company: CompanyRow | null }) {
  const lines = buildCompanyDisplayLines(company);
  return (
    <>
      {lines.repBiz ? <Text style={styles.companySubLine}>{lines.repBiz}</Text> : null}
      {lines.address ? <Text style={styles.companySubLine}>{lines.address}</Text> : null}
      {lines.phoneEmail ? <Text style={styles.companySubLine}>{lines.phoneEmail}</Text> : null}
    </>
  );
}

export type QuotePdfDocumentProps = {
  estimate: Estimate;
  items: QuoteItem[];
  company: CompanyRow | null;
  logoDataUrl?: string | null;
  stampDataUrl?: string | null;
};

export function QuotePdfDocument({
  estimate,
  items,
  company,
  logoDataUrl = null,
  stampDataUrl = null,
}: QuotePdfDocumentProps) {
  const ordered = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const marginFlat = Number(estimate.margin_flat_amount ?? 0);
  const totalQty = sumQuoteQuantities(ordered);
  const totals = computeAdjustedQuoteTotals(estimate, items);
  const customerNotesPdf = estimate.customer_notes?.trim();
  const co = displayCompanyLabel(company);
  const issued = formatIssuedDate(estimate.issued_date);
  const qn = estimate.quote_number?.trim() || "";
  const siteDetail = estimate.site_name?.trim();
  const ctype = estimate.construction_type?.trim();

  const ROWS_PER_FIRST_PAGE = 12;
  const ROWS_PER_NEXT_PAGE = 18;
  const chunks =
    ordered.length <= ROWS_PER_FIRST_PAGE
      ? [ordered]
      : [ordered.slice(0, ROWS_PER_FIRST_PAGE), ...chunkRows(ordered.slice(ROWS_PER_FIRST_PAGE), ROWS_PER_NEXT_PAGE)];

  const HeaderBlock = (
    <>
      <View style={styles.headerMetaTop}>
        <View style={styles.metaTable}>
          <View style={styles.metaRow}>
            <View style={styles.metaTh}>
              <Text style={styles.metaThText}>견적번호</Text>
            </View>
            <View style={styles.metaTd}>
              <Text>{qn || "—"}</Text>
            </View>
          </View>
          <View style={styles.metaRowLast}>
            <View style={styles.metaTh}>
              <Text style={styles.metaThText}>발행일</Text>
            </View>
            <View style={styles.metaTd}>
              <Text>{issued}</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.titleCenter}>{itemizedDocumentTitle(estimate)}</Text>
      <View style={styles.hr} />

      <View style={styles.companyBlockOuter}>
        <View style={styles.companyTextBox}>
          <Text style={styles.companyNameLarge}>{co}</Text>
          <CompanySubLines company={company} />
        </View>
        {logoDataUrl ? (
          <View style={styles.companyLogoBox}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image에는 alt 미지원 */}
            <Image src={logoDataUrl} style={styles.companyLogo} />
          </View>
        ) : null}
      </View>

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
        <Text style={styles.dt}>유효기간</Text>
        <Text style={styles.dd}>{formatValidityLine(estimate)}</Text>
      </View>

    </>
  );

  const TotalsFooter = (
    <>
      <View style={styles.totals}>
        <Text style={styles.totalLine}>공급가: {moneyWithWon(totals.subtotal)}</Text>
        <Text style={styles.totalLine}>부가세: {moneyWithWon(totals.vat)}</Text>
        <Text style={styles.totalStrong}>총액: {moneyWithWon(totals.total)}</Text>
      </View>
      {customerNotesPdf ? (
        <View style={styles.customerNotesWrap}>
          <Text style={styles.customerNotesTitle}>비고</Text>
          {customerNotesPdf.split(/\r?\n/).map((line, idx) => (
            <Text key={`${idx}-${line.slice(0, 24)}`} style={styles.customerNotesLine}>
              {line || " "}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={styles.footer}>
        <View style={styles.footerInner}>
          <View style={styles.footerCenterBlock}>
            <Text style={styles.footerText}>상기와 같이 견적합니다.</Text>
            <Text style={[styles.footerText, { marginTop: 8, fontWeight: 700 }]}>{co} 드림</Text>
          </View>
          {stampDataUrl ? (
            <View style={styles.stampAbsolute}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image에는 alt 미지원 */}
              <Image src={stampDataUrl} style={styles.stampImage} />
            </View>
          ) : null}
        </View>
      </View>
    </>
  );

  if (chunks.length === 1) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {HeaderBlock}
          <View style={styles.tableWrap}>
            <PdfTableHeader />
            <PdfTableRows rows={chunks[0]} marginFlat={marginFlat} totalQty={totalQty} />
          </View>
          {TotalsFooter}
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {HeaderBlock}
        <View style={styles.tableWrap}>
          <PdfTableHeader />
          <PdfTableRows rows={chunks[0]} marginFlat={marginFlat} totalQty={totalQty} />
        </View>
      </Page>
      {chunks.slice(1, -1).map((chunk, idx) => (
        <Page key={`mid-${idx}`} size="A4" style={styles.page}>
          <Text style={styles.contTitle}>견적서 (이어서)</Text>
          <View style={styles.tableWrap}>
            <PdfTableHeader />
            <PdfTableRows rows={chunk} marginFlat={marginFlat} totalQty={totalQty} />
          </View>
        </Page>
      ))}
      <Page size="A4" style={styles.page}>
        <Text style={styles.contTitle}>견적서 (이어서)</Text>
        <View style={styles.tableWrap}>
          <PdfTableHeader />
          <PdfTableRows
            rows={chunks[chunks.length - 1]}
            marginFlat={marginFlat}
            totalQty={totalQty}
          />
        </View>
        {TotalsFooter}
      </Page>
    </Document>
  );
}
