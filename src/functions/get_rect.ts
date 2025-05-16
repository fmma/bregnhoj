import { DEFAULT_HEIGHT, DEFAULT_HEIGHT_HALF, MARGIN } from "../constants";
import { Expanse, Rect, Tile } from "../types";
import { overlaps } from "./overlaps";

// Get a fresh rectangle for an expanse that works in the current list of tiles. 
export function get_rect(e: Expanse, tiles: Tile[]): Rect {
    const r = { ...e, x: 0, y: 0 };
    let swazzle = true;
    for (let y = 1; ; y += DEFAULT_HEIGHT + 1) {
        swazzle = !swazzle;
        if (swazzle) {
            for (let x = 100 - e.w - 2 - MARGIN; x >= 1 + MARGIN; --x) {
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
                r.y += DEFAULT_HEIGHT_HALF + 1;
                for (const t of tiles) {
                    if (overlaps(r, t.rect))
                        o = true;
                }
                if (!o)
                    return r;
            }
        }
        else {
            for (let x = 1 + MARGIN; x < 100 - e.w - 1 - MARGIN; ++x) {
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
                r.y += DEFAULT_HEIGHT_HALF + 1;
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
