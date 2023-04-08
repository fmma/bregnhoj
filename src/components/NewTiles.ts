import { html, LitElement, PropertyValueMap } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { defaultHeight, defaultWidth, grid, minDefaultHeight, minDefaultWidth, randomTable1, randomTable2 } from '../constants';
import { readFile } from '../functions/readFile';
import { posSortFun } from '../functions/rectSortFunc';
import { snap } from '../functions/snap';
import type { Rect, Tile, Viewport } from './Types';

@customElement('b-new-tiles')
export class BnewTiles extends LitElement {

    @property({type: Object})
    viewport: Viewport = {width: 0, pixelRatio: 1};

    renderRoot = this;

    @property({ type: Number })
    n = 4;

    @property({ type: Array })
    tiles: Tile[] = [];

    @property({ type: Number})
    maxY = 0;

    @query('.outer')
    div!: HTMLDivElement;

    expanse?: { minX: number; minY: number, maxX: number, maxY: number, points: [number, number][] };
    rects: Rect[] = [];

    protected update(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {

        const { tiles } = this;
        const minY = Math.min(grid, ...tiles.map(i => i.rect.y + i.rect.h));
        const minX = grid;
        const maxY = Math.max(0, ...tiles.map(i => i.rect.y + i.rect.h));
        const maxX = 100 - 2 * grid;

        let points: [number, number][] = [];

        for (let y = minY; y <= maxY + minDefaultHeight; y += grid) {
            for (let x = minX; x <= maxX - minDefaultWidth; x += grid) {
                points.push([x, y]);
            }
        }
        points.sort(([x1, y1], [x2, y2]) => posSortFun({x: x1, y: y1}, {x: x2, y: y2}));
        this.expanse = { minX, minY, maxX, maxY, points };

        this.rects = this.calc();
        this.maxY = Math.max(maxY, ...this.rects.map(x => x.h + x.y));

        super.update(changedProperties);
    }

    newText = (r: Rect, index: number) => () => {

        const detail: Tile = {rect: r, textBlock: {text: '<h1>Overskrift</h1><p>Skriv tekst her</p>'}}

        this.dispatchEvent(new CustomEvent('new-tile', { detail }));
    }

    fileChange = (_: Rect, index: number) => async (e: Event) => {
        const fileInput = e.composedPath()[0] as HTMLInputElement;
        if (fileInput.files?.[0]) {
            for (const f of fileInput.files ?? []) {
                let rect = this.rects[index];
                if (rect == null) {
                    this.rects = this.calc();
                    index = 0;
                    rect = this.rects[0];
                }
                index++;
                const { compressed, uncompressed, thumbnail, w, h, ogw, ogh } = await readFile(f);
                const factor = Math.min(rect.w / w, rect.h / h);

                rect.w = snap(w * factor);
                rect.h = snap(h * factor);
                const detail: Tile = { rect, image: {
                    isNew: true,
                    url: `url(${thumbnail})`,
                    bigurl: `url(${uncompressed})`,
                    file: f,
                    compressedFile: compressed,
                    w: w,
                    h: h,
                    ogw,
                    ogh
                }};
                this.dispatchEvent(new CustomEvent('new-tile', { detail }));
            }
            fileInput.value = ''
        }
    }

    renderNewTile = (r: Rect, i: number) => {
        const {  fileChange, newText, viewport } = this;
        const k = viewport.pixelRatio;
        return html`
            <div class="new-tile-outer"
                style="left:${r.x * k}vw;top:${r.y * k}vw;width:${r.w * k}vw;height:${r.h * k}vw;">
                <span>
                    <input class="new-tile-input" type="file" accept="image/jpeg, image/png, image/jpg" @change=${fileChange(r, i)} multiple>
                </span>
                <span>
                    <button class="new-tile-button" @click=${newText(r, i)}>Tekst</button>
                </span>
            </div>
    `;
    };

    render() {
        const { renderNewTile, rects } = this;
        return html`
            ${rects.map(renderNewTile)}
        `;
    }

    overlaps(r1: Rect, r2: Rect): boolean {
        return r1.x <= (r2.x + r2.w)
            && r2.x <= (r1.x + r1.w)
            && r1.y <= (r2.y + r2.h)
            && r2.y <= (r1.y + r1.h);
    }

    calc() {
        const { tiles, expanse, n } = this;

        if (expanse == null)
            return [];

        const { points, maxX, maxY } = expanse;

        const rects = tiles.map(x => x.rect);

        const newRects: Rect[] = [];

        for (let [x, y] of points) {
            const r = { x, y, w: minDefaultHeight, h: minDefaultHeight };
            if (rects.some(r1 => this.overlaps(r, r1)))
                continue;
            else {
                while (true) {
                    const canGrow = r.w < (defaultWidth + randomTable1[newRects.length]) && r.w + r.x < maxX;
                    if (canGrow)
                        r.w += grid;
                    else
                        break;
                    const overlaps = rects.some(r1 => this.overlaps(r, r1));
                    if (overlaps) {
                        r.w -= grid;
                        break;
                    }
                }
                while (true) {
                    const canGrow = r.h < (defaultHeight + randomTable2[newRects.length]);
                    if (canGrow)
                        r.h += grid;
                    else
                        break;
                    const overlaps = rects.some(r1 => this.overlaps(r, r1));
                    if (overlaps) {
                        r.h -= grid;
                        break;
                    }
                }

                rects.push(r);
                newRects.push(r);
                if (newRects.length === n)
                    return newRects;
            }
        }

        if (newRects.length === 0) {
            newRects.push({
                x: grid, y: maxY + grid, w: defaultWidth, h: defaultHeight
            });
        }
        return newRects;
    }
}




