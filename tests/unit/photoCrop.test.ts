import { describe, expect, it } from 'vitest';
import { initialCrop, moveCrop, placement, zoomCrop } from '../../src/core/photoCrop';

describe('initialCrop (PERS-08)', () => {
  it('takes the full height of a wide picture, in the middle', () => {
    expect(initialCrop(3000, 2000)).toEqual({ x: 100, y: 0, width: 2800, height: 2000 });
  });

  it('takes the full width of a portrait picture, in the middle', () => {
    expect(initialCrop(1400, 2000)).toEqual({ x: 0, y: 500, width: 1400, height: 1000 });
  });

  it('takes the whole picture when it already has the frame shape', () => {
    expect(initialCrop(700, 500)).toEqual({ x: 0, y: 0, width: 700, height: 500 });
  });
});

describe('zoomCrop', () => {
  it('makes the part smaller around the same centre', () => {
    const crop = zoomCrop(initialCrop(3000, 2000), 3000, 2000, 2);
    expect(crop).toEqual({ x: 800, y: 500, width: 1400, height: 1000 });
  });

  it('zooming out again near an edge keeps the part inside the picture', () => {
    const corner = { x: 0, y: 0, width: 700, height: 500 };
    expect(zoomCrop(corner, 3000, 2000, 1)).toEqual({ x: 0, y: 0, width: 2800, height: 2000 });
  });

  it('stays between 1 and 5', () => {
    expect(zoomCrop(initialCrop(3000, 2000), 3000, 2000, 0.5).width).toBe(2800);
    expect(zoomCrop(initialCrop(3000, 2000), 3000, 2000, 10).width).toBe(560);
  });
});

describe('moveCrop', () => {
  const zoomed = { x: 800, y: 500, width: 1400, height: 1000 };

  it('dragging the photo to the right shows more of its left side', () => {
    // 1400 picture pixels in a 350 px frame: one screen pixel is 4 picture pixels.
    expect(moveCrop(zoomed, 3000, 2000, 50, -25, 350)).toEqual({ ...zoomed, x: 600, y: 600 });
  });

  it('stops at the edges of the picture', () => {
    expect(moveCrop(zoomed, 3000, 2000, 5000, -5000, 350)).toEqual({ ...zoomed, x: 0, y: 1000 });
  });
});

describe('placement', () => {
  it('scales and shifts the picture so that the part fills the frame', () => {
    const crop = { x: 800, y: 500, width: 1400, height: 1000 };
    expect(placement(crop, 3000, 2000, 140)).toEqual({
      width: 300,
      height: 200,
      left: -80,
      top: -50,
    });
  });
});
