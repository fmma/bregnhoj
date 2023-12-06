import { html, LitElement, nothing, PropertyValueMap } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { serverUrlPrefix } from '../constants';
import { readFile } from '../functions/readFile';
import { snap } from '../functions/snap';
import './Icon';
import { getText } from './TextEditor';
import type { Image, Pos, Rect, TextBlock, Tile } from './Types';
import { State, stateM } from './stateM';
import { ObjPath } from '@fmma-npm/state';

// const activeTiles = new Set<Btile>();

@customElement('b-tile')
export class Btile extends LitElement {

    get activeTiles(): Btile[] {
        const x = [...document.querySelectorAll('b-tile[active]')] as Btile[];
        return x;
    }

    renderRoot = this;

    @property({ type: Boolean, reflect: true })
    active = false;

    @property({ type: Object })
    tile!: Tile;

    @property({type: Number})
    index: number = 0;

    @property({type: Object})
    path?: ObjPath<State, Tile>;

    @property({type: Number})
    pixelRatio: number = 1;

    @property({type: Number})
    width = 0;

    @state()
    editingText = false;

    @property({type: Boolean})
    editting = false;

    @state()
    dragging: { mode: string, anchor: Pos, scrollTop: number } | undefined = undefined;

    @query('.tile-outer')
    div!: HTMLDivElement;

    get image() {
        const { tile } = this;
        return tile.image;
    }

    set image(image: Image | undefined) {
        const { tile } = this;
        if(image) {
            if(this.path == null)
                return;
            stateM.patch(this.path.at('image').patch(image));
        }
    }

    get textBlock() {
        const { tile } = this;
        return tile.textBlock;
    }

    set textBlock(textBlock: TextBlock | undefined) {
        const { tile } = this;
        if(textBlock) {
            if(this.path == null)
                return;
            stateM.patch(this.path.at('textBlock').patch(textBlock));
        }
    }

    get rect() {
        return this.tile.rect;
    }

    /*
    set rect(rect: Rect | undefined) {
        const { tile } = this;
        if(rect) {
            const newTile: Tile = {...tile, rect};
            this.dispatchEvent(new CustomEvent('update-tile', {detail: newTile}));
        }
    }
    */

    protected updated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        if(changedProperties.has('active')) {
            if(this.active)
                //activeTiles.add(this);
                0;
            else {
                //activeTiles.delete(this);
                if(this.editingText) {

                    this.edit(false)();
                }
            }
        }

        super.updated(changedProperties);
    }

    _lastMouseEvent?: MouseEvent;

    getPos = (e?: MouseEvent) => {
        e = e ?? this._lastMouseEvent;
        this._lastMouseEvent = e;
        const { rect } = this;
        if (!rect || !e)
            return;
        const { clientX, clientY } = e;
        const factor = 100 / window.innerWidth;
        const y = clientY * factor - rect.y;
        const x = clientX * factor - rect.x;
        return { x, y }
    }

    mousedown = (mode: string) => (e: MouseEvent) => {
        this._hasMoved = false;
        if(!this.editting) {
            if(e.button === 0 && (e.composedPath()[0] as Element).tagName !== 'A') {
                this.edit('caption')();
            }
            return;
        }
        if(mode === 'c' && this.editingText) {
            return;
        }
        this.div.focus();

        if(!this.active) {
            this.activeMeMouseUp(e);
            if(e.ctrlKey)
                return;
        }

        const anchor = this.getPos(e);
        if (anchor)
            this.dragging = { mode, anchor, scrollTop: document.scrollingElement?.scrollTop ?? 0 };

        document.addEventListener('mousemove', this.mousemove);
        document.addEventListener('scroll', this.mousewheel);
        document.addEventListener('mouseup', this.mouseup);
    }

    mouseup = (e: MouseEvent) => {
        this.dragging = undefined;

        const { activeTiles } = this;

        if(this._hasMoved) {
            const detail: {rect: Rect, index: number}[] = [];
            for(const tile of activeTiles) {
                if(!tile.isActive)
                    continue;
                const rect = tile.tile.rect;
                if(rect) {
                    const { x, y, w, h } = rect;
                    detail.push({rect: { x: snap(x), y: snap(y), w: snap(w), h: snap(h)}, index: tile.index});
                }
            }

                this.dispatchEvent(new CustomEvent('update-rects', {detail}));
        }
        else {
            this.activeMeMouseUp(e);
        }
        document.removeEventListener('mousemove', this.mousemove);
        document.removeEventListener('scroll', this.mousewheel);
        document.removeEventListener('mouseup', this.mouseup);
    }

    _hasMoved = false;

    mousewheel = () => {
        this._hasMoved = true;
        const factor = 100 / window.innerWidth;

        if(this.dragging == null)
            return;
        const { anchor, mode, scrollTop } = this.dragging;
        const newScrollTop = document.scrollingElement?.scrollTop ?? 0;
        const deltaY = scrollTop - newScrollTop;

        this.dragging = {mode, anchor: {x: anchor.x, y: anchor.y + factor * deltaY}, scrollTop: newScrollTop};
        this.mousemove();
    }

    mousemove = (e?: MouseEvent) => {
        this._hasMoved = true;
        const { dragging, activeTiles } = this;

        if (!dragging)
            return;

        const { mode, anchor } = dragging;

        const pos = this.getPos(e);
        if (!pos)
            return;

        let dx = pos.x - anchor.x;
        let dy = pos.y - anchor.y;

        const minX = Math.min(...[...activeTiles].map(t => t.rect?.x ?? 0));
        const minY = Math.min(...[...activeTiles].map(t => t.rect?.y ?? 0));
        const maxX = Math.max(...[...activeTiles].map(t => (t.rect?.x ?? 0) + (t.rect?.w ?? 0)));


        if(['c', 'n', 'ne', 'nw'].includes(mode) && minY + dy < 0) {
            dy = 0;
        }
        if(['c', 'w', 'nw', 'sw'].includes(mode) && minX + dx < 0) {
            dx = 0;
        }
        const cw = 100;
        if(maxX + dx >= cw) {
            dx = 0;
        }

        for(const tile of activeTiles) {
            const rect = tile.rect;

            if (!rect)
                continue;

            const { x, y, w, h } = rect;

            let r = rect;

            switch (mode) {
                case 'nw':
                    r = { x: x + dx, y: y + dy, w: w - dx, h: h - dy};
                    break;
                case 'n':
                    r = { x: x, y: y + dy, w, h: h - dy};
                    break;
                case 'ne':
                    r = { x, y: y + dy, w: w + dx, h: h - dy};
                    break;
                case 'w':
                    r = { x: x + dx, y, w: w - dx, h};
                    break;
                case 'c':
                    r = { x: x + dx, y: y + dy, w, h };
                    break;
                case 'e':
                    r = { x, y, w: w + dx, h};
                    break;
                case 'sw':
                    r = { x: x + dx, y, w: w - dx, h: h + dy};
                    break;
                case 's':
                    r = { x, y, w, h: h + dy};
                    break;
                case 'se':
                    r = { x, y, w: w + dx, h: h + dy};
                    break;
            }

            tile.tile = {...tile.tile, rect: r};
        }


        switch (mode) {
            case 'ne':
                anchor.x += dx;
                break;
            case 'e':
                anchor.x += dx;
                break;
            case 'sw':
                anchor.y += dy;
                break;
            case 's':
                anchor.y += dy;
                break;
            case 'se':
                anchor.x += dx;
                anchor.y += dy;
                break;
        }
    }

    modes = ["nw", "n", "ne", "w", "c", "e", "sw", "s", "se"];

    slet = () => {
        this.dispatchEvent(new CustomEvent("slet", {detail: this}));
    }

    edit = (mode: boolean | 'caption') => (e?: MouseEvent) => {
        if(e) {
            this.activeMeMouseUp(e);
        }
        if(mode === 'caption') {
            if(this.tile.image != null)
                this.dispatchEvent(new CustomEvent('open-preview'))
        }
        else {
            if(!mode) {
                this.textareaChange();
            }
            this.editingText = mode;
        }
    }

    fileChange = async (e: CustomEvent<File[]>) => {
        const f = e.detail[0];
        const { image } = this;
        if(f) {
            const { compressed, uncompressed, thumbnail, w, h, ogw, ogh } = await readFile(f);
            this.image = {
                ...image,
                url: `url(${thumbnail})`,
                bigurl: `url(${uncompressed})`,
                isNew: true,
                file: f,
                compressedFile: compressed,
                ogw, ogh, w, h };
        }
    }

    activate(ctrl?: boolean) {
        this.dispatchEvent(new CustomEvent("activeMe", {detail: ctrl ?? false}));
    }

    activeMeMouseUp = (e: MouseEvent) => {
        if(this.editting) {
            this.activate(e.ctrlKey);
        }
    }

    textareaChange = () => {
        const { textBlock } = this;
        const text = getText();
        if(text == null)
            this.textBlock = undefined;
        else {
            this.textBlock = {...textBlock, text};
        }
    }

    get isActive() {
        if(!this.editting)
            return false;
        return this.active;
    }

    render() {
        const { isActive, modes, mousedown, slet, edit, textBlock, editingText, fileChange, tile } = this;

        const textarea = editingText
            ? html`
                <b-text-editor
                    .html = ${textBlock?.text ?? ''}
                    @close-me=${edit(false)}
                    ></b-text-editor>
            `
            : html`
                <div class="tile-text">
                    ${unsafeHTML(textBlock?.text ?? '')}
                </div>
            `;

        const buttons = !editingText
            ? html`
                <b-icon icon="edit-text" @click=${edit(true)}></b-icon>
            `
            : html`
                <b-icon icon="save" @click=${edit(false)}></b-icon>
            `;


        const { rect, pixelRatio } = this;

        const vwToPixels = this.width / 100;

        const w = `${rect.w * pixelRatio * vwToPixels}`;
        const h = `${rect.h * pixelRatio * vwToPixels}`;


        const img = html`
            <img class="tile-image" width="${w}" height="${h}" loading="lazy" src="${this.getUrl(tile)}">
        `;

        const style = `left: ${rect.x * pixelRatio * vwToPixels}px; top: ${rect.y * pixelRatio * vwToPixels}px; width: ${w}px; minWidth: ${w}px; height: ${h}px; minHeight: ${h}px; ${tile.image?.isNew ? `background-size: cover; background-image: ${tile.image.url}` : ''}`;

        if(this.editting) {
            return html`
                <div tabindex="1" class="tile-outer ${isActive ? 'active' : ''}" style="${style}">
                    ${this.image == null || this.image.isNew ? nothing : img}
                    <div class="regions">
                        ${modes.map(m => html`
                        <div class="${isActive ? 'region' : ''} ${this.editting ? m : ''}" @mousedown=${mousedown(m)}></div>
                        `)}
                    </div>
                    ${textarea}
                    ${
                        isActive
                            ? html`
                                <div class="tile-buttons">
                                    <b-icon file-input icon="file" @file-change=${fileChange} @click=${this.activeMeMouseUp}></b-icon>
                                    ${buttons}
                                    <b-icon icon="delete" @click=${slet}></b-icon>
                                </div>
                                `
                            : nothing
                    }
                </div>
        `;
        }

        return html`
            <div class="tile-outer"  @mousedown=${mousedown('c')} style="${style}">
                ${this.image == null || this.image.isNew ? nothing : img}
                ${this.textBlock == null ? nothing : textarea}
            </div>
        `;
    }

    private getUrl(tile: Tile): string {
        if(tile.image == null || tile.image?.url.startsWith('url('))
            return '';
        return serverUrlPrefix + tile.image?.url;
    }
}
