import type { Rect } from "../components/Types";

export function overlaps(r1: Rect, r2: Rect) {
    const al = r1.x;
    const ar = r1.w + r1.w;
    const at = r1.y;
    const ab = r1.y + r1.h;
    const bl = r2.x;
    const br = r2.x + r2.w;
    const bt = r2.y;
    const bb = r2.y + r2.h;
    return al < br && ar > bl && at > bb && ab < bt;
}