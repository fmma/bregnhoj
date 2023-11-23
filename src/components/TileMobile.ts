import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { getHeight, getWidth } from '../functions/getWidth';
import './Icon';
import type { Tile } from './Types';

const serverUrlPrefix = 'https://snesl.dk/media/';

let counter = 0;

@customElement('b-tile-mobile')
export class BtileMobile extends LitElement {

    @property({type: Number})
    width = 0;

    private _id;

    constructor() {
        super();
        this._id = counter++;
    }

    renderRoot = this;

    @property({ type: Object })
    tile!: Tile;

    render() {
        return html`
            <div class="mtile-wrapper">
                ${this.renderTile()}
            </div>
        `;
    }

    clickImg = (e: MouseEvent) => {
        if((e.composedPath()[0] as Element).tagName !== 'A' && this.tile.image != null)
            this.dispatchEvent(new CustomEvent('open-preview'));
    }

    renderTile() {
        const { tile } = this;

        const w = this.width;
        const h = getHeight();

        const k1 = w / tile.image?.ogw! * 0.8;
        const k2 = h / tile.image?.ogh! * 0.8;
        const k = Math.min(k1, k2);
        const vw = k / w * 100;

        const width = k * tile.image?.ogw!
        const height = k * tile.image?.ogh!;

        const img = tile.image == null
            ? html`<div style="width:${width}px; height:${height}px"></div>`
            : html`
                <img src=${`${serverUrlPrefix}${tile.image?.url}`} width=${width} height=${height} loading="lazy">
            `;

        const style = html`
            <style>
                .tile-text${this._id} h1 {
                    font: normal normal ${3*vw}vw 'Capture it';
                }

                .tile-text${this._id} h2 {
                    font: normal normal ${2*vw}vw 'Capture it';
                }

                .tile-text${this._id} h3 {
                    font: normal normal ${2*vw}vw 'Open Sans',Arial,sans-serif;
                }

                .tile-text${this._id} p {
                    font: normal normal ${vw}vw 'Open Sans',Arial,sans-serif;
                }
            </style>
        `;

        return html`
            <div class="mtile-wrapper tile-text${this._id}" @click=${this.clickImg}>
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
