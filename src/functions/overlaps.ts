import type { Rect } from "../types";

export function overlaps(a: Rect, b: Rect) {

    const minAx = a.x;
    const maxAx = a.x + a.w;
    const minAy = a.y;
    const maxAy = a.y + a.h;

    const minBx = b.x;
    const maxBx = b.x + b.w;
    const minBy = b.y;
    const maxBy = b.y + b.h;

    const aLeftOfB = maxAx < minBx;
    const aRightOfB = minAx > maxBx;
    const aAboveB = minAy > maxBy;
    const aBelowB = maxAy < minBy;
    return !( aLeftOfB || aRightOfB || aAboveB || aBelowB );
}