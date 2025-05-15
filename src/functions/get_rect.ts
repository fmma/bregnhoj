import { defaultHeight, defaultHeightHalf, margin } from "../constants";
import { Expanse, Rect, Tile } from "../types";
import { overlaps } from "./overlaps";

// Get a fresh rectangle for an expanse that works in the current list of tiles. 
export function get_rect(e: Expanse, tiles: Tile[]): Rect {
    const r = { ...e, x: 0, y: 0 };
    let swazzle = true;
    for (let y = 1; ; y += defaultHeight + 1) {
        swazzle = !swazzle;
        if (swazzle) {
            for (let x = 100 - e.w - 2 - margin; x >= 1 + margin; --x) {
                r.x = x;
                r.y = y;
                let o = false;
                for (const t of tiles) {
                    if (overlaps(r, t.rect))
                        o = true;
                }
                if (!o)
                    return r;
                o = false;
                r.y += defaultHeightHalf + 1;
                for (const t of tiles) {
                    if (overlaps(r, t.rect))
                        o = true;
                }
                if (!o)
                    return r;
            }
        }
        else {
            for (let x = 1 + margin; x < 100 - e.w - 1 - margin; ++x) {
                r.x = x;
                r.y = y;
                let o = false;
                for (const t of tiles) {
                    if (overlaps(r, t.rect))
                        o = true;
                }
                if (!o)
                    return r;
                o = false;
                r.y += defaultHeightHalf + 1;
                for (const t of tiles) {
                    if (overlaps(r, t.rect))
                        o = true;
                }
                if (!o)
                    return r;
            }
        }
    }
}