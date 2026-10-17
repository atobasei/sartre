import { toPng } from 'html-to-image';

/** Web: rasterize the card's DOM node (react-native-web refs are DOM elements). */
export async function exportCard(node: unknown, filename: string, pixelRatio: number): Promise<void> {
  const el = node as unknown as HTMLElement | null;
  if (!el) return;
  // Covers come from covers.openlibrary.org → archive.org; both send CORS headers.
  const dataUrl = await toPng(el, { pixelRatio, cacheBust: false });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export const canExportCard = true;
