import { html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { serverUrlPrefix } from "../constants";
import './Icon';
import type { SiteDatabaseObject, Tile, Viewport } from "./Types";
import { getHeight } from '../functions/getWidth';
import { getText } from "./TextEditor";

@customElement('b-image-preview')
export class BimagePreview extends LitElement {

    @property({type: Object})
    sdo?: SiteDatabaseObject;

    @property({ type: Object })
    viewport: Viewport = { width: 0, pixelRatio: 1 };

    @property({ type: Boolean })
    mobile = false;

    @property({ type: Object })
    tile?: Tile

    @state()
    hideCaption = false;

    width = 0;
    height = 0;

    update(changed: Map<keyof this, any>) {
        if (changed.has('tile')) {
            this.hideCaption = false;
            if (this.tile == null) {
                document.body.style.overflowY = "auto"
                // disableScroll.off();
            }
            else {

                document.body.style.overflowY = "hidden"
                // disableScroll.on();

                const w = this.viewport.width;
                const h = getHeight();
                const fitSize = this.mobile ? 0.9 : 0.9;

                if (this.tile.image?.ogw) {
                    const c = w / this.tile.image.ogw * fitSize;
                    this.width = c * this.tile.image.ogw;
                    this.height = c * this.tile.image.ogh
                }
                else {
                    const c1 = w / this.tile.rect.w;



                    const k1 = c1 * fitSize;
                    const k = k1;

                    this.width = k * this.tile.rect.w
                    this.height = k * this.tile.rect.h;
                }
            }
        }
        super.update(changed);
    }

    clickPreview = () => {
        //if(this.mobile)
        //    this.hideCaption = true;
    }

    renderRoot = this;


    clicked = (e: Event) => {
        const target = e.composedPath()[0] as HTMLElement;
        if (target.classList.contains('image-preview-wrapper') || target.tagName === 'IMG') {
            this.closeAndSave();
        }
    }

    closeAndSave() {
        this.dispatchEvent(new CustomEvent('close-preview'));
    }

    render() {
        if (this.tile?.image == null) {
            return nothing;
        }

        const metadata = this.sdo?.imageMetadata?.[this.tile.image.bigurl];

        const size = metadata?.sizeH && metadata.sizeW && html`<p> ${metadata?.sizeH} x ${metadata?.sizeW} </p>`;

        const textarea = html`
            <div class="text">
            <h2> ${metadata?.title} </h2>
            <p> ${metadata?.price} </p>
            ${size}
            <div style="white-space: pre-wrap;">${metadata?.description}

</div>
            </div>
        `;

        const caption = metadata == null ? nothing : html`
            <div class="image-preview-caption${this.mobile ? '-mobile' : ''}" @click=${this.clickPreview}>
                ${textarea}
            </div>
        `;

        return html`
            <div class="image-preview-wrapper" @click=${this.clicked}>
                ${caption}
                <div class="image-preview-image">
                    <img src="${this.tile.image?.isNew ? this.tile.image.bigurl.slice(4, -1) : `${serverUrlPrefix}${this.tile?.image?.bigurl ?? this.tile?.image?.url}`}"
                       width="${this.width}px" height="${this.height}px" >
                </div>
            </div>
        `
    }
}