import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { IMG_URL_PREFIX } from '../constants';
import { state_manager } from '../state_manager';
import type { Image, ImageMetadata, SiteDatabaseObject } from '../types';
import './Tile';
import './TileMobile';

@customElement('b-overview')
export class Boverview extends LitElement {

    @property({ type: Object })
    sdo?: SiteDatabaseObject;

    @property({ type: Object })
    images: Image[] = [];

    render() {
        const urls0 = [
            ...this.images.map(x => x.bigurl),
            ...Object.keys(this.sdo?.imageMetadata ?? {})
        ];
        const urls = [...new Set(urls0)];

        return html`<h1>Rediger undertekster</h1>
        <div style="display: flex;flex-wrap: wrap;">
            ${urls.map(u => this._render_image(u))}
        </div>
        `;
    }

    private _get_metadata(url: string): ImageMetadata {
        const m = this.sdo?.imageMetadata?.[url];
        if (m == null) {
            const i = this.images.find(x => x.bigurl === url);
            return { description: '', price: '', sizeH: '', sizeW: '', title: '', thumbUrl: i?.url ?? '' }
        }
        return { ...m };
    }

    private _render_image(url: string) {
        const id = url.split('.')[0];
        const m = this._get_metadata(url);
        return html`
            <div style="display:flex;margin:10px ">
                <span>
                <img src="${IMG_URL_PREFIX}${m.thumbUrl}" width=250 height=250 style = "object-fit: cover;"/>
                </span>
                <span>
                    <input id="titel-${id}" .value=${m.title ?? ''}
                    @change=${(e: InputEvent) => {
                const v = (e.composedPath()[0] as HTMLInputElement).value;
                const metadata = this._get_metadata(url);
                metadata.title = v;
                this._fire_update_event(url, metadata);
            }}>
                    <label for="titel-${id}">Titel</label>
                    
                    <br>
                    <input id="pris-${id}" .value=${m.price ?? ''}
                    @change=${(e: InputEvent) => {
                const v = (e.composedPath()[0] as HTMLInputElement).value;
                const metadata = this._get_metadata(url);
                metadata.price = v;
                this._fire_update_event(url, metadata);
            }}>
                    <label for="pris-${id}">Pris</label>

                    <br>
                    <input id="bredde-${id}" .value=${m.sizeW ?? ''}
                    @change=${(e: InputEvent) => {
                const v = (e.composedPath()[0] as HTMLInputElement).value;
                const metadata = this._get_metadata(url);
                metadata.sizeW = v;
                this._fire_update_event(url, metadata);
            }}>x<input id="hojde-${id}" .value=${m.sizeH ?? ''}
                    @change=${(e: InputEvent) => {
                const v = (e.composedPath()[0] as HTMLInputElement).value;
                const metadata = this._get_metadata(url);
                metadata.sizeH = v;
                this._fire_update_event(url, metadata);
            }}>
                    <label for="hojde-${id}">Størrelse</label>

                    <br>
                    <textarea style="width: 343px; height: 164px;" id="beskrivelse-${id}" .value=${m.description ?? ''}
                    @change=${(e: InputEvent) => {
                const v = (e.composedPath()[0] as HTMLInputElement).value;
                const metadata = this._get_metadata(url);
                metadata.description = v;
                this._fire_update_event(url, metadata);
            }}>
                    </textarea>
                    <label for="beskrivelse-${id}">Beskrivelse</label>
                </span>
            </div>
        `;
    }

    private _fire_update_event(url: string, metadata: ImageMetadata) {

        state_manager.patch(state_manager.path().at('sdo').at('imageMetadata').patch({
            ...this.sdo?.imageMetadata,
            [url]: metadata
        }));
    }
}