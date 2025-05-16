import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { IMG_URL_PREFIX } from '../constants';
import { get_height } from '../functions/get_width';
import type { Tile } from '../types';
import './Icon';

let counter = 0;

@customElement('b-tile-mobile')
export class BtileMobile extends LitElement {

    renderRoot = this;

    @property({ type: Number })
    width = 0;

    @property({ type: Object })
    tile!: Tile;

    private _id;

    constructor() {
        super();
        this._id = counter++;
    }

    render() {
        return html`
            <div class="mtile-wrapper">
                ${this._render_tile()}
            </div>
        `;
    }

    private _click_img = (e: MouseEvent) => {
        if ((e.composedPath()[0] as Element).tagName !== 'A' && this.tile.image != null)
            this.dispatchEvent(new CustomEvent('open-preview'));
    }

    private _render_tile() {
        const { tile } = this;

        const w = this.width;
        const h = get_height();

        const k1 = w / tile.image?.ogw! * 0.8;
        const k2 = h / tile.image?.ogh! * 0.8;
        const k = Math.min(k1, k2);
        const vw = k / w * 100;

        const width = k * tile.image?.ogw!
        const height = k * tile.image?.ogh!;

        const img = tile.image == null
            ? html`<div style="width:${width}px; height:${height}px"></div>`
            : html`
                <img src=${`${IMG_URL_PREFIX}${tile.image?.url}`} width=${width} height=${height} loading="lazy">
            `;

        const style = html`
            <style>
                .tile-text${this._id} h1 {
                    font: normal normal ${3 * vw}vw 'Capture it';
                }

                .tile-text${this._id} h2 {
                    font: normal normal ${2 * vw}vw 'Capture it';
                }

                .tile-text${this._id} h3 {
                    font: normal normal ${2 * vw}vw 'Open Sans',Arial,sans-serif;
                }

                .tile-text${this._id} p {
                    font: normal normal ${vw}vw 'Open Sans',Arial,sans-serif;
                }
            </style>
        `;

        return html`
            <div class="mtile-wrapper tile-text${this._id}" @click=${this._click_img}>
                ${tile.image == null
                ? html`
                    <div class="mtile-text-contents-no-img">
                        ${unsafeHTML(tile.textBlock?.text ?? '')}
                    </div>
                `
                : tile.textBlock == null
                    ? html`
                    ${img}
                `
                    : html`
                    ${img}
                    <div class="mtile-text-contents">
                        ${style}
                        ${unsafeHTML(tile.textBlock?.text ?? '')}
                    </div>
                `}
            </div>
        `;
    }
}
