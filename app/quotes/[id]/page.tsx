import { QuoteEditor } from "@/components/estimate/quote-editor";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QuoteEditor mode="edit" estimateId={id} />;
}
