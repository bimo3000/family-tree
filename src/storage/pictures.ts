/**
 * Preparing a photo when it is added (DATA-07, architecture §3.4): decoded by the browser, scaled
 * down to at most 2000 px on the long side and stored as JPEG. Small photos keep their size.
 */
export const MAX_PICTURE_SIDE = 2000;
const JPEG_QUALITY = 0.85;

export interface Picture {
  blob: Blob;
  width: number;
  height: number;
}

/** The browser could not read the picture, e.g. an iPhone HEIC photo outside Safari. */
export class UnreadablePictureError extends Error {
  constructor() {
    super('unreadable picture');
    this.name = 'UnreadablePictureError';
  }
}

/** Width and height with the long side at most `max`, keeping the proportions. */
export function scaledSize(width: number, height: number, max = MAX_PICTURE_SIDE) {
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function preparePicture(file: Blob): Promise<Picture> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new UnreadablePictureError();
  }
  const { width, height } = scaledSize(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new UnreadablePictureError();
  // JPEG has no transparency: transparent parts become white instead of black.
  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  );
  if (!blob) throw new UnreadablePictureError();
  return { blob, width, height };
}
