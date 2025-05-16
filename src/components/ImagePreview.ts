import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { IMG_URL_PREFIX } from "../constants";
import type { SiteDatabaseObject, Tile, Viewport } from "../types";
import './Icon';

@customElement('b-image-preview')
export class BimagePreview extends LitElement {

    renderRoot = this;

    @property({ type: Object })
    sdo?: SiteDatabaseObject;

    @property({ type: Object })
    viewport: Viewport = { width: 0, pixelRatio: 1 };

    @property({ type: Boolean })
    mobile = false;

    @property({ type: Object })
    tile?: Tile

    private _width = 0;
    private _height = 0;

    update(changed: Map<keyof this, any>) {
        if (changed.has('tile')) {
            if (this.tile == null) {
                document.body.style.overflowY = "auto"
            }
            else {
                document.body.style.overflowY = "hidden"
                const w = this.viewport.width;
                const fit_size = this.mobile ? 0.9 : 0.9;

                if (this.tile.image?.ogw) {
                    const c = w / this.tile.image.ogw * fit_size;
                    this._width = c * this.tile.image.ogw;
                    this._height = c * this.tile.image.ogh
                }
                else {
                    const c1 = w / this.tile.rect.w;
                    const k1 = c1 * fit_size;
                    const k = k1;
                    this._width = k * this.tile.rect.w
                    this._height = k * this.tile.rect.h;
                }
            }
        }
        super.update(changed);
    }

    private _click_preview = () => {
        //if(this.mobile)
        //    this.hideCaption = true;
    }

    private _clicked = (e: Event) => {
        const target = e.composedPath()[0] as HTMLElement;
        if (target.classList.contains('image-preview-wrapper') || target.tagName === 'IMG') {
            this._close_and_save();
        }
    }

    private _close_and_save() {
        this.dispatchEvent(new CustomEvent('close-preview'));
    }

    render() {
        if (this.tile?.image == null) {
            return nothing;
        }

        const metadata = this.sdo?.imageMetadata?.[this.tile.image.bigurl];

        const size = metadata?.sizeH && metadata.sizeW && html`<p> ${metadata?.sizeW} x ${metadata?.sizeH} </p>`;

        const textarea = html`
            <div class="text">
            <h2> ${metadata?.title} </h2>
            <p> ${metadata?.price} </p>
            ${size}
            <div style="white-space: pre-wrap;">${metadata?.description}

</div>
            <button class="link-button" @click=${() => this._close_and_save()}>Tilbage</button>
            </div>
        `;

        const caption = metadata == null ? nothing : html`
            <div class="image-preview-caption${this.mobile ? '-mobile' : ''}" @click=${this._click_preview}>
                ${textarea}
            </div>
        `;

        return html`
            <div class="image-preview-wrapper" @click=${this._clicked}>
                ${caption}
                <div class="image-preview-image">
                    <img src="${this.tile.image?.isNew ? this.tile.image.bigurl.slice(4, -1) : `${IMG_URL_PREFIX}${this.tile?.image?.bigurl ?? this.tile?.image?.url}`}"
                       width="${this._width}px" height="${this._height}px" >
                </div>
            </div>
        `
    }
}
