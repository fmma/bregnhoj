import { db } from '@fmma-npm/http-client';
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { state_manager } from '../state_manager';
import { Page, SiteDatabaseObject } from "../types";

@customElement('b-new-site')
export class BnewSite extends LitElement {

    renderRoot: HTMLElement | ShadowRoot = this;

    @property()
    site_root?: string;

    private _rename_site = (e: any) => {
        state_manager.patch(state_manager.path().at('sdo').at('siteTitle').patch(e.target.value));
    }

    render() {
        return html`
            <div class="outer">
                <div class="pages">
                    <div class="page-wrapper">
                        <h1 class="page-header">
                            Ny side!
                        </h1>
                        <div class="page-contents control-page">
                            <p>site_root=${this.site_root}</p>
                            <p>Sidens navn <input .value=${state_manager.state.sdo?.siteTitle ?? ''} @change=${this._rename_site}></p>
                            <button @click=${this._save}>OPRET</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private async _save() {
        if (!this.site_root)
            throw new Error('site_root not set');
        const key = `gal/${this.site_root}/site`;
        const existing = await db.get(key);
        if (existing)
            throw new Error('Refusing to create new site because it already exists!');

        const sdo = state_manager.state.sdo;
        sdo.devVersion = 'main';
        sdo.publishedVersion = 'main';
        const now = new Date();
        sdo.versions.push({
            name: 'main',
            created: now,
            modified: now
        })
        await db.putObject<SiteDatabaseObject>(key, sdo);
        await db.putObject<Page[]>(`gal/${this.site_root}/pages/main`, [
            {
                title: 'Galleri',
                subPages: [],
                tiles: []
            }
        ]);
        window.location.reload();
    }
}