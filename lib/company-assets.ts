import imageCompression from "browser-image-compression";
import type { SupabaseClient } from "@supabase/supabase-js";

export const COMPANY_ASSETS_BUCKET = "company-assets" as const;

export type CompanyAssetKind = "logo" | "stamp";

const MAX_SIDE = 1024;
const TARGET_MB = 1;

/** DB와 Storage에 저장하는 객체 경로(버킷 기준 상대 경로): `{uuid}/logo.webp` 형태 */
export function companyAssetStoragePath(userId: string, kind: CompanyAssetKind, ext: "webp" | "jpg") {
  return `${userId}/${kind}.${ext}`;
}

/** 업로드 전 압축: 긴 변 1024 이하, 1MB 근처. WebP 우선, 필요 시 JPEG. */
export async function compressCompanyImage(file: File): Promise<File> {
  const common = {
    maxSizeMB: TARGET_MB,
    maxWidthOrHeight: MAX_SIDE,
    useWebWorker: true as const,
  };

  try {
    const blob = await imageCompression(file, { ...common, fileType: "image/webp" });
    const out =
      blob instanceof File
        ? blob
        : new File([blob], "asset.webp", { type: "image/webp" });
    if (out.size <= 1048576) {
      return new File([out], "asset.webp", { type: "image/webp", lastModified: Date.now() });
    }
    // Oversized WebP → try JPEG below.
  } catch {
    // WebP 실패 시 JPEG 재시도
  }

  const blob = await imageCompression(file, {
    ...common,
    fileType: "image/jpeg",
    initialQuality: 0.88,
  });
  const out =
    blob instanceof File
      ? blob
      : new File([blob], "asset.jpg", { type: "image/jpeg" });
  return new File([out], "asset.jpg", { type: out.type || "image/jpeg", lastModified: Date.now() });
}

function normalizeStoredPath(stored: string): string | null {
  const t = stored.trim();
  if (!t) return null;

  const extractAfter = (markers: readonly string[]): string | null => {
    for (const marker of markers) {
      const i = t.indexOf(marker);
      if (i !== -1) {
        let rest = t.slice(i + marker.length);
        const q = rest.indexOf("?");
        if (q !== -1) rest = rest.slice(0, q);
        return decodeURIComponent(rest);
      }
    }
    return null;
  };

  if (t.startsWith("http")) {
    const extracted = extractAfter([
      `/object/sign/${COMPANY_ASSETS_BUCKET}/`,
      `/object/public/${COMPANY_ASSETS_BUCKET}/`,
      `/storage/v1/object/sign/${COMPANY_ASSETS_BUCKET}/`,
    ]);
    return extracted ?? null;
  }

  return t;
}

/** 비공개 버킷 표시용 signed URL. `stored`는 Storage 오브젝트 경로 또는 기존 full URL */
export async function createSignedCompanyAssetUrl(
  supabase: SupabaseClient,
  stored: string | null | undefined,
  expiresIn = 3600
): Promise<string | null> {
  if (!stored?.trim()) return null;

  const raw = stored.trim();
  if (raw.startsWith("http")) {
    const path = normalizeStoredPath(raw);
    if (path?.length) {
      const { data, error } = await supabase.storage
        .from(COMPANY_ASSETS_BUCKET)
        .createSignedUrl(path, expiresIn);
      if (!error && data?.signedUrl) return data.signedUrl;
    }
    return raw;
  }

  const { data, error } = await supabase.storage
    .from(COMPANY_ASSETS_BUCKET)
    .createSignedUrl(raw, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function uploadCompanyAsset(
  supabase: SupabaseClient,
  userId: string,
  kind: CompanyAssetKind,
  file: File,
  previousPath: string | null | undefined
): Promise<string> {
  const compressed = await compressCompanyImage(file);
  const ext: "webp" | "jpg" = compressed.type === "image/webp" ? "webp" : "jpg";
  const path = companyAssetStoragePath(userId, kind, ext);

  if (previousPath?.trim() && previousPath.trim() !== path) {
    await supabase.storage.from(COMPANY_ASSETS_BUCKET).remove([previousPath.trim()]);
  }

  const { error } = await supabase.storage.from(COMPANY_ASSETS_BUCKET).upload(path, compressed, {
    upsert: true,
    contentType: compressed.type || (ext === "webp" ? "image/webp" : "image/jpeg"),
  });

  if (error) throw error;
  return path;
}

export async function removeCompanyAssetObject(
  supabase: SupabaseClient,
  objectPath: string | null | undefined
): Promise<void> {
  const p = objectPath?.trim();
  if (!p || p.startsWith("http")) return;
  await supabase.storage.from(COMPANY_ASSETS_BUCKET).remove([p]);
}
