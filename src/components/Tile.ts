import { ObjPath } from '@fmma-npm/state';
import { html, LitElement, nothing, PropertyValueMap } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { IMG_URL_PREFIX } from '../constants';
import { read_file } from '../functions/read_file';
import { snap } from '../functions/snap';
import { State, state_manager } from '../state_manager';
import type { Image, Pos, Rect, TextBlock, Tile } from '../types';
import './Icon';
import { get_editor_text } from './TextEditor';

@customElement('b-tile')
export class Btile extends LitElement {

    renderRoot = this;

    @property({ type: Boolean, reflect: true })
    active = false;

    @property({ type: Object })
    tile!: Tile;

    @property({ type: Number })
    index: number = 0;

    @property({ type: Object })
    path?: ObjPath<State, Tile>;

    @property({ type: Number })
    pixel_ratio: number = 1;

    @property({ type: Number })
    width = 0;

    @property({ type: Boolean })
    editting = false;

    @state()
    private _editting_text = false;

    @state()
    private _dragging: { mode: string, anchor: Pos, scrollTop: number } | undefined = undefined;

    @query('.tile-outer')
    private _div!: HTMLDivElement;

    get rect() {
        return this.tile.rect;
    }

    private _has_moved = false;

    private get _active_tiles(): Btile[] {
        const x = [...document.querySelectorAll('b-tile[active]')] as Btile[];
        return x;
    }

    private get _image() {
        const { tile } = this;
        return tile.image;
    }

    private set _image(image: Image | undefined) {
        const { tile } = this;
        if (image) {
            if (this.path == null)
                return;
            state_manager.patch(this.path.at('image').patch(image));
        }
    }

    private get _text_block() {
        return this.tile.textBlock;
    }

    private set _text_block(text_block: TextBlock | undefined) {
        if (text_block) {
            if (this.path == null)
                return;
            state_manager.patch(this.path.at('textBlock').patch(text_block));
        }
    }

    protected updated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        if (changedProperties.has('active')) {
            if (this.active)
                //activeTiles.add(this);
                0;
            else {
                //activeTiles.delete(this);
                if (this._editting_text) {

                    this._edit(false)();
                }
            }
        }

        super.updated(changedProperties);
    }

    private _last_mouse_event?: MouseEvent;

    private _get_pos = (e?: MouseEvent) => {
        e = e ?? this._last_mouse_event;
        this._last_mouse_event = e;
        const { rect: rect } = this;
        if (!rect || !e)
            return;
        const { clientX, clientY } = e;
        const factor = 100 / window.innerWidth;
        const y = clientY * factor - rect.y;
        const x = clientX * factor - rect.x;
        return { x, y }
    }

    private _mousedown = (mode: string) => (e: MouseEvent) => {
        this._has_moved = false;
        if (!this.editting) {
            if (e.button === 0 && (e.composedPath()[0] as Element).tagName !== 'A') {
                this._edit('caption')();
            }
            return;
        }
        if (mode === 'c' && this._editting_text) {
            return;
        }
        this._div.focus();

        if (!this.active) {
            this._active_me_mouse_up(e);
            if (e.ctrlKey)
                return;
        }

        const anchor = this._get_pos(e);
        if (anchor)
            this._dragging = { mode, anchor, scrollTop: document.scrollingElement?.scrollTop ?? 0 };

        document.addEventListener('mousemove', this._mousemove);
        document.addEventListener('scroll', this._mousewheel);
        document.addEventListener('mouseup', this._mouseup);
    }

    private _mouseup = (e: MouseEvent) => {
        this._dragging = undefined;

        const { _active_tiles: activeTiles } = this;

        if (this._has_moved) {
            const detail: { rect: Rect, index: number }[] = [];
            for (const tile of activeTiles) {
                if (!tile._is_active)
                    continue;
                const rect = tile.tile.rect;
                if (rect) {
                    const { x, y, w, h } = rect;
                    detail.push({ rect: { x: snap(x), y: snap(y), w: snap(w), h: snap(h) }, index: tile.index });
                }
            }

            this.dispatchEvent(new CustomEvent('update-rects', { detail }));
        }
        else {
            this._active_me_mouse_up(e);
        }
        document.removeEventListener('mousemove', this._mousemove);
        document.removeEventListener('scroll', this._mousewheel);
        document.removeEventListener('mouseup', this._mouseup);
    }

    private _mousewheel = () => {
        this._has_moved = true;
        const factor = 100 / window.innerWidth;

        if (this._dragging == null)
            return;
        const { anchor, mode, scrollTop } = this._dragging;
        const newScrollTop = document.scrollingElement?.scrollTop ?? 0;
        const deltaY = scrollTop - newScrollTop;

        this._dragging = { mode, anchor: { x: anchor.x, y: anchor.y + factor * deltaY }, scrollTop: newScrollTop };
        this._mousemove();
    }

    private _mousemove = (e?: MouseEvent) => {
        this._has_moved = true;
        const { _dragging: dragging, _active_tiles: activeTiles } = this;

        if (!dragging)
            return;

        const { mode, anchor } = dragging;

        const pos = this._get_pos(e);
        if (!pos)
            return;

        let dx = pos.x - anchor.x;
        let dy = pos.y - anchor.y;

        const minX = Math.min(...[...activeTiles].map(t => t.rect?.x ?? 0));
        const minY = Math.min(...[...activeTiles].map(t => t.rect?.y ?? 0));
        const maxX = Math.max(...[...activeTiles].map(t => (t.rect?.x ?? 0) + (t.rect?.w ?? 0)));


        if (['c', 'n', 'ne', 'nw'].includes(mode) && minY + dy < 0) {
            dy = 0;
        }
        if (['c', 'w', 'nw', 'sw'].includes(mode) && minX + dx < 0) {
            dx = 0;
        }
        const cw = 100;
        if (maxX + dx >= cw) {
            dx = 0;
        }

        for (const tile of activeTiles) {
            const rect = tile.rect;

            if (!rect)
                continue;

            const { x, y, w, h } = rect;

            let r = rect;

            switch (mode) {
                case 'nw':
                    r = { x: x + dx, y: y + dy, w: w - dx, h: h - dy };
                    break;
                case 'n':
                    r = { x: x, y: y + dy, w, h: h - dy };
                    break;
                case 'ne':
                    r = { x, y: y + dy, w: w + dx, h: h - dy };
                    break;
                case 'w':
                    r = { x: x + dx, y, w: w - dx, h };
                    break;
                case 'c':
                    r = { x: x + dx, y: y + dy, w, h };
                    break;
                case 'e':
                    r = { x, y, w: w + dx, h };
                    break;
                case 'sw':
                    r = { x: x + dx, y, w: w - dx, h: h + dy };
                    break;
                case 's':
                    r = { x, y, w, h: h + dy };
                    break;
                case 'se':
                    r = { x, y, w: w + dx, h: h + dy };
                    break;
            }

            tile.tile = { ...tile.tile, rect: r };
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

    private _modes = ["nw", "n", "ne", "w", "c", "e", "sw", "s", "se"];

    private _slet = () => {
        this.dispatchEvent(new CustomEvent("slet", { detail: this }));
    }

    private _grow = () => {
        this.dispatchEvent(new CustomEvent("grow", { detail: { tile: this, up: true, down: true, left: true, right: true } }));
    }

    private _edit = (mode: boolean | 'caption') => (e?: MouseEvent) => {
        if (e) {
            this._active_me_mouse_up(e);
        }
        if (mode === 'caption') {
            if (this.tile.image != null)
                this.dispatchEvent(new CustomEvent('open-preview'))
        }
        else {
            if (!mode) {
                this._textarea_change();
            }
            this._editting_text = mode;
        }
    }

    private _file_change = async (e: CustomEvent<File[]>) => {
        const f = e.detail[0];
        const { _image: image } = this;
        if (f) {
            const { compressed, uncompressed, thumbnail, w, h, ogw, ogh } = await read_file(f);
            this._image = {
                ...image,
                url: `url(${thumbnail})`,
                bigurl: `url(${uncompressed})`,
                isNew: true,
                file: f,
                compressedFile: compressed,
                ogw, ogh, w, h
            };
        }
    }

    activate(ctrl?: boolean) {
        this.dispatchEvent(new CustomEvent("activeMe", { detail: ctrl ?? false }));
    }

    private _active_me_mouse_up = (e: MouseEvent) => {
        if (this.editting) {
            this.activate(e.ctrlKey);
        }
    }

    private _textarea_change = () => {
        const { _text_block: textBlock } = this;
        const text = get_editor_text();
        if (text == null)
            this._text_block = undefined;
        else {
            this._text_block = { ...textBlock, text };
        }
    }

    private get _is_active() {
        if (!this.editting)
            return false;
        return this.active;
    }

    render() {
        const textarea = this._editting_text
            ? html`
                <b-text-editor
                    .html = ${this._text_block?.text ?? ''}
                    @close-me=${this._edit(false)}
                    ></b-text-editor>
            `
            : html`
                <div class="tile-text">
                    ${unsafeHTML(this._text_block?.text ?? '')}
                </div>
            `;

        const buttons = !this._editting_text
            ? html`
                <b-icon icon="edit-text" @click=${this._edit(true)}></b-icon>
            `
            : html`
                <b-icon icon="save" @click=${this._edit(false)}></b-icon>
            `;


        const { rect: rect, pixel_ratio: pixelRatio } = this;

        const vwToPixels = this.width / 100;

        const w = `${rect.w * pixelRatio * vwToPixels}`;
        const h = `${rect.h * pixelRatio * vwToPixels}`;


        const img = html`
            <img class="tile-image" width="${w}" height="${h}" loading="lazy" src="${this._get_url(this.tile)}">
        `;

        const style = `left: ${rect.x * pixelRatio * vwToPixels}px; top: ${rect.y * pixelRatio * vwToPixels}px; width: ${w}px; minWidth: ${w}px; height: ${h}px; minHeight: ${h}px; ${this.tile.image?.isNew ? `background-size: cover; background-image: ${this.tile.image.url}` : ''}`;

        if (this.editting) {
            return html`
                <div tabindex="1" class="tile-outer ${this._is_active ? 'active' : ''}" style="${style}">
                    ${this._image == null || this._image.isNew ? nothing : img}
                    <div class="regions">
                        ${this._modes.map(m => html`
                        <div class="${this._is_active ? 'region' : ''} ${this.editting ? m : ''}" @mousedown=${this._mousedown(m)}></div>
                        `)}
                    </div>
                    ${textarea}
                    ${this._is_active
                    ? html`
                                <div class="tile-buttons">
                                    <b-icon file-input icon="file" @file-change=${this._file_change} @click=${this._active_me_mouse_up}></b-icon>
                                    ${buttons}
                                    <b-icon icon="delete" @click=${this._slet}></b-icon>
                                    <b-icon icon="grow" @click=${this._grow}></b-icon>
                                </div>
                                `
                    : nothing
                }
                </div>
        `;
        }

        return html`
            <div class="tile-outer"  @mousedown=${this._mousedown('c')} style="${style}">
                ${this._image == null || this._image.isNew ? nothing : img}
                ${this._text_block == null ? nothing : textarea}
            </div>
        `;
    }

    private _get_url(tile: Tile): string {
        if (tile.image == null || tile.image?.url.startsWith('url('))
            return '';
        return IMG_URL_PREFIX + tile.image?.url;
    }
}
