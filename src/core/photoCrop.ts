/**
 * Choosing the visible part of a photo when it is added (PERS-08). The part always has the shape of the
 * photo frames on the card (138 × 100) and in the panel (about 344 × 242), so it fills both almost exactly.
 * Only this part is stored. All values are in pixels of the original picture.
 */
export const PHOTO_ASPECT = 7 / 5;
export const MAX_ZOOM = 5;

export interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Zoom 1: the largest part with the frame's shape, in the middle of the picture. */
export function initialCrop(width: number, height: number): Crop {
  // Multiplied before divided, so 2800 × 2000 comes out exact (no 2000.0000000000002).
  const w = Math.min(width, (height * 7) / 5);
  const h = (w * 5) / 7;
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
}

/** A smaller or bigger part around the same centre. `zoom` 1 is the largest part. */
export function zoomCrop(crop: Crop, width: number, height: number, zoom: number): Crop {
  const largest = initialCrop(width, height);
  const z = Math.min(MAX_ZOOM, Math.max(1, zoom));
  const w = largest.width / z;
  const h = largest.height / z;
  const x = crop.x + crop.width / 2 - w / 2;
  const y = crop.y + crop.height / 2 - h / 2;
  return inside({ x, y, width: w, height: h }, width, height);
}

/** The photo was dragged by `dx`/`dy` screen pixels in a frame `boxWidth` wide. */
export function moveCrop(
  crop: Crop,
  width: number,
  height: number,
  dx: number,
  dy: number,
  boxWidth: number,
): Crop {
  const scale = crop.width / boxWidth;
  return inside({ ...crop, x: crop.x - dx * scale, y: crop.y - dy * scale }, width, height);
}

/** Size and offset of the whole picture, so that exactly `crop` shows in a frame `boxWidth` wide. */
export function placement(crop: Crop, width: number, height: number, boxWidth: number) {
  const scale = boxWidth / crop.width;
  return {
    width: width * scale,
    height: height * scale,
    left: -crop.x * scale,
    top: -crop.y * scale,
  };
}

function inside(crop: Crop, width: number, height: number): Crop {
  return {
    ...crop,
    x: Math.max(0, Math.min(width - crop.width, crop.x)),
    y: Math.max(0, Math.min(height - crop.height, crop.y)),
  };
}
