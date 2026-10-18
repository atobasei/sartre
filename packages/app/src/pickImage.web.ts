export type ImageKind = 'avatar' | 'banner';

// Data URLs live in memory until Storage lands, so downscale before keeping one.
const MAX_SIZE: Record<ImageKind, number> = { avatar: 512, banner: 1600 };

/** Web: a transient file input, then a canvas downscale to a JPEG data URL. Undefined if cancelled. */
export function pickImage(kind: ImageKind): Promise<string | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('cancel', () => resolve(undefined));
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return resolve(undefined);
      downscale(file, MAX_SIZE[kind]).then(resolve, () => resolve(undefined));
    });
    input.click();
  });
}

async function downscale(file: File, max: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.85);
}
