import { DEFAULT_HEIGHT, DEFAULT_HEIGHT_DOUBLE, DEFAULT_HEIGHT_HALF, MARGIN } from "../constants";
import { Expanse, Rect, Tile } from "../types";
import { get_rect } from "./get_rect";
import { overlaps } from "./overlaps";
import { shuffle } from "./shuffle";
import { snap } from "./snap";

export function shuffle_iteration(tiles: Tile[]) {
    const new_tiles: Tile[] = [];

    const place_tile = (tile: Tile) => {
        if (tile.image == null) {
            new_tiles.push(tile);
            return;
        }
        const { w, h } = tile.image;

        const magic_number = Math.random() < 0.2 ? 2 : 1;
        let scale = magic_number * DEFAULT_HEIGHT / h;
        let e: Expanse = { w: snap(w * scale), h: snap(h * scale) }
        if (e.w * e.h < DEFAULT_HEIGHT * DEFAULT_HEIGHT * 0.6) {
            let scale = DEFAULT_HEIGHT_DOUBLE / h;
            e = { w: snap(w * scale), h: snap(h * scale) }
        }
        else if (e.w * e.h > DEFAULT_HEIGHT * DEFAULT_HEIGHT * 5) {
            let scale = DEFAULT_HEIGHT_HALF / h;
            e = { w: snap(w * scale), h: snap(h * scale) }
        }

        const rect: Rect = get_rect(e, new_tiles);
        new_tiles.push({
            ...tile,
            rect
        });
    }

    const is_free = (r: Rect, exempt?: Tile) => {
        const has_overlap = new_tiles.filter(t0 => t0 !== exempt).some(t0 => overlaps(r, t0.rect));
        return !has_overlap;
    }

    const get_max_h = () => new_tiles.map((t) => Math.max(t.rect.y + t.rect.h)).reduce((a, b) => Math.max(a, b));

    const find_inner_tile = () => {
        const max_h = get_max_h();

        for (let x = MARGIN; x < 100 - 2 - MARGIN; ++x) {
            for (let y = 1; y < max_h; ++y) {
                const r = { x, y, w: 3, h: 3 };
                if (is_free(r)) {
                    expand_tile_inplace(r)
                    return r;
                }
            }
        }
    }

    const expand_tile_inplace = (r: Rect, t?: Tile) => {
        const max_h = get_max_h();
        while (r.x > 1 + MARGIN) {
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

        while (r.x + r.w < 100 - 2 - MARGIN) {
            r.w += 1;
            if (is_free(r, t)) {
                //ok
            }
            else {
                r.w -= 1;
                break;
            }
        }

        while (r.y + r.h < max_h) {
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
        for (const t of new_tiles) {
            expand_tile_inplace(t.rect, t);
        }
    }

    const badness = () => {
        let badness = 0;
        for (const t of new_tiles) {
            if (t.image) {

                const { ogw, ogh } = t.image;
                const { w, h } = t.rect;
                let og_ar = ogw / ogh;
                let rect_ar = w / h;
                let [w1, h1] = og_ar >= rect_ar ? [w, w / og_ar] : [h * og_ar, h];
                let s = w1 / ogw;

                badness = Math.max(badness, s * s * (w - w1) * (w - w1) + s * s * (h - h1) * (h - h1));
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
            new_tiles[i++].rect = r;
            expando();
        }
        else {
            break
        }
    }

    return { newTiles: new_tiles, badness: badness() };
}
