import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { grid } from '../constants';
import { read_file } from '../functions/read_file';
import { snap } from '../functions/snap';
import { Bitmap } from '../models/bitmap';
import type { Rect, Tile, Viewport } from '../types';

@customElement('b-new-tiles')
export class BnewTiles extends LitElement {

    @property({ type: Object })
    viewport: Viewport = { width: 0, pixelRatio: 1 };

    renderRoot = this;

    @property({ type: Array })
    tiles: Tile[] = [];

    @property({ type: Number })
    maxY = 0;

    @query('.outer')
    div!: HTMLDivElement;

    @state()
    rects: Rect[] = [];

    bitmap = new Bitmap();

    protected update(changedProperties: Map<keyof this, any>): void {
        if (changedProperties.has('tiles')) {
            this.bitmap.reset(this.tiles.map(x => x.rect));
            const r = this.bitmap.nextRect(false);
            this.rects = r ? [r] : [];
        }
        super.update(changedProperties);
    }

    newText = (r: Rect, index: number) => () => {

        const detail: Tile = { rect: r, textBlock: { text: '<h1>Overskrift</h1><p>Skriv tekst her</p>' } }

        this.dispatchEvent(new CustomEvent('new-tile', { detail }));
    }

    fileChange = (_: Rect, index: number) => async (e: Event) => {
        const fileInput = e.composedPath()[0] as HTMLInputElement;
        const newTiles: Tile[] = [];
        const batch = (fileInput.files?.length ?? 0) > 1;
        let rect = { ...this.rects[index] };
        if (fileInput.files?.[0]) {
            for (const [i, f] of [...fileInput.files ?? []].entries()) {

                if (batch)
                    this.dispatchEvent(new CustomEvent('b-set-loading', {
                        detail: { i, n: fileInput.files!.length },
                        bubbles: true,
                        cancelable: true,
                        composed: true
                    }));
                const { compressed, uncompressed, thumbnail, w, h, ogw, ogh } = await read_file(f);

                const factor = Math.min(rect.w / w, rect.h / h);

                rect.w = snap(w * factor);
                rect.h = snap(h * factor);

                this.bitmap.flowUp(rect);
                this.bitmap.flowLeft(rect);

                const detail: Tile = {
                    rect,
                    image: {
                        isNew: true,
                        url: `url(${thumbnail})`,
                        bigurl: `url(${uncompressed})`,
                        file: f,
                        compressedFile: compressed,
                        w,
                        h,
                        ogw,
                        ogh
                    }
                };

                newTiles.push(detail);
                this.bitmap.addRect(rect);
                rect = this.bitmap.nextRect(true);
            }
            fileInput.value = '';

            if (batch) {
                this.bitmap.h = newTiles.map(x => x.rect.h + x.rect.y).reduce((a, b) => a > b ? a : b);
                for (const t of newTiles) {
                    // this.bitmap.grow(t.rect);
                    this.bitmap.addRect(t.rect);
                }
                for (const t of newTiles) {
                    t.rect.w -= grid;
                    t.rect.h -= grid;
                }

                const sortedRects = newTiles.map(x => x.rect).sort((a, b) => a.w / a.h - b.w / b.h);
                const sortedIms = newTiles.map(x => x.image!).sort((a, b) => a.w / a.h - b.w / b.h);

                for (let i = 0; i < newTiles.length; ++i) {
                    newTiles[i].rect = sortedRects[i];
                    newTiles[i].image = sortedIms[i];
                }
            }

            this.dispatchEvent(new CustomEvent('new-tiles', { detail: newTiles }));

            this.dispatchEvent(new CustomEvent('b-set-loading', {
                detail: undefined,
                bubbles: true,
                cancelable: true,
                composed: true
            }));
        }
    }

    private _renderNewTile = (r: Rect, i: number) => {
        const { fileChange, newText, viewport } = this;
        const k = viewport.pixelRatio;
        const style = `left:${r.x * k}vw;top:${r.y * k}vw;width:${r.w * k}vw;height:${r.h * k}vw;`;
        return html`
            <div class="new-tile-outer" style="${style}">
                <span>
                    <input class="new-tile-input" type="file" accept="image/jpeg, image/png, image/jpg" @change=${fileChange(r, i)}
                        multiple>
                </span>
                <span>
                    <button class="new-tile-button" @click=${newText(r, i)}>Tekst</button>
                </span>
            </div>
    `;
    };

    render() {
        const { rects } = this;
        return html`
            ${rects.map(this._renderNewTile)}
        `;
    }

    overlaps(r1: Rect, r2: Rect): boolean {
        return r1.x <= (r2.x + r2.w)
            && r2.x <= (r1.x + r1.w)
            && r1.y <= (r2.y + r2.h)
            && r2.y <= (r1.y + r1.h);
    }

}




