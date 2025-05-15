import { defaultHeight, defaultHeightDouble, defaultHeightHalf, margin } from "../constants";
import { Expanse, Rect, Tile } from "../types";
import { get_rect } from "./get_rect";
import { overlaps } from "./overlaps";
import { shuffle } from "./shuffle";
import { snap } from "./snap";

export function shuffle_iteration(tiles: Tile[]) {
    const newTiles: Tile[] = [];

    const place_tile = (tile: Tile) => {
        if (tile.image == null) {
            newTiles.push(tile);
            return;
        }
        const { w, h } = tile.image;

        const magicNumber = Math.random() < 0.2 ? 2 : 1;
        let scale = magicNumber * defaultHeight / h;
        let e: Expanse = { w: snap(w * scale), h: snap(h * scale) }
        if (e.w * e.h < defaultHeight * defaultHeight * 0.6) {
            let scale = defaultHeightDouble / h;
            e = { w: snap(w * scale), h: snap(h * scale) }
        }
        else if (e.w * e.h > defaultHeight * defaultHeight * 5) {
            let scale = defaultHeightHalf / h;
            e = { w: snap(w * scale), h: snap(h * scale) }
        }

        const rect: Rect = get_rect(e, newTiles);
        newTiles.push({
            ...tile,
            rect
        });
    }

    const is_free = (r: Rect, exempt?: Tile) => {
        const hasOverlap = newTiles.filter(t0 => t0 !== exempt).some(t0 => overlaps(r, t0.rect));
        return !hasOverlap;
    }

    const get_max_h = () => newTiles.map((t) => Math.max(t.rect.y + t.rect.h)).reduce((a, b) => Math.max(a, b));

    const find_inner_tile = () => {
        const maxH = get_max_h();

        for (let x = margin; x < 100 - 2 - margin; ++x) {
            for (let y = 1; y < maxH; ++y) {
                const r = { x, y, w: 3, h: 3 };
                if (is_free(r)) {
                    expand_tile_inplace(r)
                    return r;
                }
            }
        }
    }

    const expand_tile_inplace = (r: Rect, t?: Tile) => {
        const maxH = get_max_h();
        while (r.x > 1 + margin) {
            r.x -= 1;
            r.w += 1;
            if (is_free(r, t)) {
                //ok
            }
            else {
                r.x += 1;
                r.w -= 1;
                break;
            }
        }

        while (r.x + r.w < 100 - 2 - margin) {
            r.w += 1;
            if (is_free(r, t)) {
                //ok
            }
            else {
                r.w -= 1;
                break;
            }
        }

        while (r.y + r.h < maxH) {
            r.h += 1;
            if (is_free(r, t)) {
                //ok
            }
            else {
                r.h -= 1;
                break;
            }
        }
    }

    const expando = () => {
        for (const t of newTiles) {
            expand_tile_inplace(t.rect, t);
        }
    }

    const badness = () => {
        let badness = 0;
        for (const t of newTiles) {
            if (t.image) {
                const actualArea = t.rect.w * t.rect.h;
                const actualRatio = t.rect.w / t.rect.h;
                const optimalRatio = t.image.w / t.image.h;
                let b = actualRatio - optimalRatio;
                b = b * b;
                badness = Math.max(badness, b) + actualArea / 1000;
            }
        }
        return badness;
    }

    for (const tile of shuffle(tiles)) {
        place_tile(tile);
    }

    expando();
    let i = 0;
    while (i < 100) {
        const r = find_inner_tile();
        if (r) {
            newTiles[i++].rect = r;
            expando();
        }
        else {
            break
        }
    }

    return { newTiles, badness: badness() };
}