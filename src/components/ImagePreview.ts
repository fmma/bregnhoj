import { html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { serverUrlPrefix } from "../constants";
import './Icon';
import type { Tile, Viewport } from "./Types";
import { getHeight } from '../functions/getWidth';
import disableScroll from 'disable-scroll'
import { getText } from "./TextEditor";

@customElement('b-image-preview')
export class BimagePreview extends LitElement {

    @property({type: Object})
    viewport: Viewport = {width: 0, pixelRatio: 1};

    @property({ type: Boolean })
    mobile = false;

    @property({ type: Object })
    tile?: Tile

    @property({ type: Boolean })
    editting = false;

    @state()
    hideCaption = false;

    update(changed: Map<keyof this, any>) {
        if(changed.has('tile')) {
            this.hideCaption = false;
            if(this.tile == null) {
                disableScroll.off();
            }
            else {
                disableScroll.on();
            }
        }
        super.update(changed);
    }

    clickPreview = () => {
        if(this.mobile)
            this.hideCaption = true;
    }

    get caption(): string | undefined {
        if(this.hideCaption)
            return '';
        return this.tile?.image?.caption ?? (this.editting ? '<p>Skriv tekst her...</p>' : '');
    }

    set caption(value: string | undefined) {
        this.dispatchEvent(new CustomEvent('update-preview-tile', {
            detail: {
                ...this.tile, image: { ...this.tile?.image, caption: value }
            }
        }));
    }

    renderRoot = this;


    textareaChange = () => {
        this.caption = getText();
    }

    clicked = (e: Event) => {
        const target = e.composedPath()[0] as HTMLElement;
        if (target.classList.contains('image-preview-wrapper') || target.tagName === 'IMG') {
            if(this.editting)
                this.textareaChange();
            this.dispatchEvent(new CustomEvent('close-preview'));
        }
    }

    render() {
        if (this.tile?.image == null) {
            return nothing;
        }

        const textarea = this.editting
            ? html`
                <b-text-editor .zIndex=${99999} .defaultColor=${"white"} .html=${this.caption} .newParent=${()=>
                    this.querySelector('.image-preview-caption')}
                    ></b-text-editor>
            `
            : html`
                <div class="text">
                    ${unsafeHTML(this.caption)}
                </div>
            `;

        const w = this.viewport.width;
        const h = getHeight();
        const fitSize = this.mobile ? 0.95 : 0.7;
        let width, height;

        if(this.tile.image.ogw) {
            const c = Math.min(w / this.tile.image.ogw, h / this.tile.image.ogh) * fitSize;
            width = c * this.tile.image.ogw;
            height = c * this.tile.image.ogh
        }
        else {
            const c1 = w / this.tile.rect.w;
            const c2 = h / this.tile.rect.h;



            const k1 = c1 * fitSize;
            const k2 = c2 * fitSize;
            const k = Math.min(k1, k2);

            width = k * this.tile.rect.w
            height = k * this.tile.rect.h;
        }

        return html`
            <div class="image-preview-wrapper" @click=${this.clicked}>
                <div class="image-preview-image">
                    <img src="${this.tile.image?.isNew ? this.tile.image.bigurl.slice(4, -1) : `${serverUrlPrefix}${this.tile?.image?.bigurl ?? this.tile?.image?.url}`}"
                        width="${width}" height="${height}">
                </div>
                ${
                    this.caption
                    ? html`
                    <div class="image-preview-caption${this.mobile ? '-mobile' : ''}" @click=${this.clickPreview}>
                        ${textarea}
                    </div>
                    `
                    : nothing
                }
            </div>
        `
    }
}