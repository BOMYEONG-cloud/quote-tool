/**
 * 선택: public/landing/*.png 를 sharp 로 리사이즈·압축 (용량 줄이기)
 *   npm run capture-landing:shrink
 *
 * 둥근 모서리·그림자는 랜딩 CSS에서 처리하는 것을 권장합니다.
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const dir = path.join(process.cwd(), "public", "landing");
const maxW = Number(process.env.LANDING_IMG_MAX_WIDTH ?? 1440);

if (!fs.existsSync(dir)) {
  console.error("폴더 없음:", dir);
  process.exit(1);
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png"));
if (files.length === 0) {
  console.log("PNG 없음:", dir);
  process.exit(0);
}

for (const f of files) {
  const p = path.join(dir, f);
  const before = fs.statSync(p).size;
  const buf = await sharp(p)
    .resize({ width: maxW, withoutEnlargement: true })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();
  await fs.promises.writeFile(p, buf);
  const after = buf.length;
  console.log(f, `${(before / 1024).toFixed(1)}KB → ${(after / 1024).toFixed(1)}KB`);
}

console.log("완료:", dir);
