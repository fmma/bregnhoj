import { ObjPath } from '@fmma-npm/state';
import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { overlaps } from '../functions/overlaps';
import { State, state_manager } from '../state_manager';
import type { PageOrSubPage, Rect, Tile, Viewport } from '../types';
import './Tile';
import './TileMobile';

@customElement('b-page')
export class Bpage extends LitElement {

    renderRoot = this;

    @property({ type: Boolean })
    editting = false;

    @property({ type: Object })
    page!: PageOrSubPage;

    @property({ type: Object })
    path?: ObjPath<State, PageOrSubPage>;

    @property({ type: Object })
    viewport: Viewport = { width: 0, pixelRatio: 1 };

    @property({ type: Boolean })
    mobile = false;

    @query('.page-contents')
    private _contents_div?: HTMLDivElement;

    @state()
    active_tiles: number[] = [];

    get tiles() {
        return this.page.tiles;
    }

    updated(props: Map<keyof this, any>) {
        const contentsDiv = this._contents_div;
        super.updated(props);
        if (!contentsDiv)
            return;
        if (this.mobile)
            contentsDiv.style.height = '';
        else {
            const maxY = Math.max(...this.tiles.map(x => x.rect.h + x.rect.y));
            contentsDiv.style.height = `${maxY}vw`;
        }
    }

    private _activate_tile = (i: number) => (e: CustomEvent<boolean>) => {
        if (e.detail) {
            if (this.active_tiles.includes(i)) {
                this.active_tiles = this.active_tiles.filter(j => i !== j);
            }
            else {
                this.active_tiles = [...this.active_tiles, i];
            }
        }
        else
            this.active_tiles = [i];
    }

    private _update_rects = (e: CustomEvent<{ rect: Rect, index: number }[]>) => {
        const { detail } = e;
        const newTiles = this.tiles.map((tile, i) => {
            const update = detail.find(x => x.index === i);
            if (update == null)
                return tile;
            return { ...tile, rect: update.rect };
        });
        if (this.path == null)
            return;
        state_manager.patch(this.path.at('tiles').patch(newTiles))
    }

    private _delete_tile = () => {
        if (this.path == null)
            return;
        state_manager.patch(this.path?.at('tiles').patch(this.tiles.filter((_, j) => !this.active_tiles.includes(j))))
    }

    private _grow_tile = (e: CustomEvent<{ tile: { tile: Tile, index: number }, up: boolean, down: boolean, left: boolean, right: boolean }>) => {
        if (this.path == null)
            return;
        const r = { ...e.detail.tile.tile.rect };
        const rs = this.tiles.filter((_, i) => i != e.detail.tile.index).map(x => x.rect);

        const maxY = 1 + Math.max(...rs.map(t => t.y + t.h));
        const maxX = 100;

        if (e.detail.left) {
            while (r.x > 0 && rs.every(r0 => !overlaps(r, r0))) {
                r.x--;
                r.w++;
                // console.log('grow left', r);
            }
            r.x++;
            r.w--;
        }

        if (e.detail.right) {
            while (r.x + r.w < maxX && rs.every(r0 => !overlaps(r, r0))) {
                r.w++;
                // console.log('grow right', r);
            }
            r.w--;
        }

        if (e.detail.up) {
            while (r.y > 0 && rs.every(r0 => !overlaps(r, r0))) {
                r.y--;
                r.h++;
                // console.log('grow up', r);
            }
            r.y++;
            r.h--;
        }

        if (e.detail.down) {
            while (r.y + r.h < maxY && rs.every(r0 => !overlaps(r, r0))) {
                r.h++;
                // console.log('grow down', r);
            }
            r.h--;
        }


        state_manager.patch(this.path?.at('tiles').ix(e.detail.tile.index).patch({ ...e.detail.tile.tile, rect: r }));
    }

    private _open_preview = (i: number) => () => {
        this.dispatchEvent(new CustomEvent('open-preview', { detail: { tileIndex: i } }));
    };

    render() {
        const { _grow_tile: growTile, _delete_tile: deleteTile, _update_rects: updateRects, _activate_tile: activateTile, active_tiles: activeTiles, tiles: tiles, page, mobile, editting } = this;

        return html`
            <h1 class="page-header">${page.title}</h1>
            <div class="page-contents ${editting && !mobile ? "editting" : ""}">
                ${tiles.map((x, i) => mobile
            ? html`
                    <b-tile-mobile .tile=${x} @open-preview=${this._open_preview(i)} .width=${this.viewport.width}></b-tile-mobile>
                `
            : html`
                <b-tile .tile=${x} .active=${activeTiles.includes(i)} @activeMe=${activateTile(i)} .editting=${this.editting} .index=${i} .pixel_ratio=${this.viewport.pixelRatio} .width=${this.viewport.width}
                    .path=${this.path?.at('tiles').ix(i)}
                    @slet=${deleteTile}
                    @grow=${growTile}
                    @update-rects=${updateRects}
                    @open-preview=${this._open_preview(i)}
                    ></b-tile>
                `)}


            </div>
        `;
    }
}
