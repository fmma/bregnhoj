import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import './NewTiles';
import type { BnewTiles } from './NewTiles';
import './Tile';
import './TileMobile';
import type { PageOrSubPage, Rect, Tile, Viewport } from './Types';
import { ObjPath } from '@fmma-npm/state';
import { State, stateM } from './stateM';

@customElement('b-page')
export class Bpage extends LitElement {

    renderRoot = this;

    @property({type: Boolean})
    editting = false;

    @property({type: Object})
    page!: PageOrSubPage;

    @property({type: Object})
    path?: ObjPath<State, PageOrSubPage>;

    @property({type: Object})
    viewport: Viewport = {width: 0, pixelRatio: 1};

    get tiles() {
        return this.page.tiles;
    }

    updated(props: Map<keyof this, any>) {
        const { mobile, contentsDiv, tiles, bnewTiles} = this;
        super.updated(props);
        if(!contentsDiv)
            return;
        if(mobile)
            contentsDiv.style.height = '';
        else {
            const maxY = Math.max(bnewTiles?.maxY ?? 0, ...tiles.map(x => x.rect.h + x.rect.y));
            contentsDiv.style.height = `${maxY}vw`;
        }
    }

    @property( {type: Boolean})
    mobile = false;

    @query('.page-contents')
    contentsDiv?: HTMLDivElement;

    @query('b-new-tiles')
    bnewTiles?: BnewTiles;

    @state()
    activeTiles: number[] = [];

    newTile = (e: CustomEvent<Tile>) => {
        const newIm = {
            ...e.detail
        };
        if(this.path == null)
            return;
        stateM.patch(this.path?.at('tiles').patch([...this.tiles, newIm]))
    }

    newTiles = (e: CustomEvent<Tile[]>) => {
        const newIm = e.detail.map(x => ({
            ...x
        }));
        
        if(this.path == null)
            return;
        stateM.patch(this.path?.at('tiles').patch([...this.tiles, ...newIm]))
    }

    activateTile = (i: number) => (e: CustomEvent<boolean>) => {
        if(e.detail) {
            if(this.activeTiles.includes(i)) {
                this.activeTiles = this.activeTiles.filter(j => i !== j);
            }
            else {
                this.activeTiles = [...this.activeTiles, i];
            }
        }
        else
            this.activeTiles = [i];
    }

    updateRects = (e: CustomEvent<{rect: Rect, index: number}[]>) => {
        const { detail } = e;

        const { tiles, page } = this;
        const newTiles = tiles.map((tile, i) => {
            const update = detail.find(x => x.index === i);
            if(update == null)
                return tile;
            return {...tile, rect: update.rect};
        });
        if(this.path == null)
            return;
        stateM.patch(this.path.at('tiles').patch(newTiles))
    }

    deleteTile = () => {
        if(this.path == null)
            return;
        stateM.patch(this.path?.at('tiles').patch(this.tiles.filter((_, j) => !this.activeTiles.includes(j))))
    }

    openPreview = (i: number) => () => {
        this.dispatchEvent(new CustomEvent('open-preview', { detail: { tileIndex: i } }));
    };

    render() {
        const { deleteTile, updateRects, activateTile, activeTiles, tiles, page, mobile, editting } = this;

        return html`
            <h1 class="page-header">${page.title}</h1>
            <div class="page-contents ${editting && !mobile ? "editting" : ""}">
                ${tiles.map((x, i) => mobile
                ? html`
                    <b-tile-mobile .tile=${x} @open-preview=${this.openPreview(i)} .width=${this.viewport.width}></b-tile-mobile>
                `
                : html`
                <b-tile .tile=${x} .active=${activeTiles.includes(i)} @activeMe=${activateTile(i)} .editting=${this.editting} .index=${i} .pixelRatio=${this.viewport.pixelRatio} .width=${this.viewport.width}
                    .path=${this.path?.at('tiles').ix(i)}
                    @slet=${deleteTile}
                    @update-rects=${updateRects}
                    @open-preview=${this.openPreview(i)}
                    ></b-tile>
                `)}


            </div>
        `
        // ${mobile || ! this.editting ? nothing : html`<b-new-tiles .tiles=${tiles} @new-tile=${newTile} @new-tiles=${this.newTiles} .viewport=${this.viewport}></b-new-tiles>`}
    }
}
