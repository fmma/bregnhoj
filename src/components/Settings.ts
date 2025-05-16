import { db } from '@fmma-npm/http-client';
import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { state_manager } from '../state_manager';
import { SiteDatabaseObject, SOCIAL_MEDIA_NAMES, SoMeName } from "../types";


@customElement('b-settings')
export class Bsettings extends LitElement {
    
    renderRoot: HTMLElement | ShadowRoot = this;
    
    constructor() {
        super();
        state_manager.observe(state_manager.path().at('sdo'), () => {
            this.requestUpdate()
        });
    }

    @property()
    site_root?: string;

    private _rename_site = (e: any) => {
        state_manager.patch(state_manager.path().at('sdo').at('siteTitle').patch(e.target.value));
    }

    private _set_so_me_user = (so_me_name: SoMeName) => (e: any) => {
        const value = e.target.value;
        const path = state_manager.path().at('sdo').at('soMeLinks');
        const filtered_so_me_links = (path.get(state_manager.state) ?? []).filter(x => x.name !== so_me_name);
        if (value.trim()) {
            const new_so_me_links = [
                ...filtered_so_me_links,
                {
                    name: so_me_name,
                    user: value
                }
            ]

            state_manager.patch(path.patch(new_so_me_links))
        }
        else {
            state_manager.patch(path.patch(filtered_so_me_links))
        }
    }

    render() {
        const dirty = state_manager.dirty;
        return html`
        
            <div class="outer">
                <div class="pages">
                    <div class="page-wrapper">
                        <h1 class="page-header">
                            Indstillinger
                        </h1>
                        <div class="page-contents control-page">
                            <p>Sidens navn <input class="control-input" .value=${state_manager.state.sdo.siteTitle} @change=${this._rename_site}></p>
                            ${this._render_so_me_inputs()}
                            ${this._render_version_table()}
                            ${dirty ? nothing : html`<button class="control-button" @click=${() => this._close_settings()}> Luk indstillinger </button>`}
                            ${!dirty ? nothing : html`
                                <button class="control-button" @click=${() => state_manager.undo()}> Fortryd </button>
                                <button class="control-button" @click=${this._save_settings}> Gem </button>
                                    `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private _close_settings() {
        this.dispatchEvent(new CustomEvent('close-settings'));
    }

    private async _save_settings() {
        this.dispatchEvent(new CustomEvent('save-settings'));
    }

    private *_render_so_me_inputs() {
        for (const so_me of SOCIAL_MEDIA_NAMES) {
            const user = state_manager.state.sdo.soMeLinks?.find(x => x.name === so_me)?.user ?? '';
            yield html`<p> ${so_me} <input class="control-input" .value=${user} @change=${this._set_so_me_user(so_me)}></p>`
        }
    }

    private _render_version_table() {
        const dirty = state_manager.dirty;
        return html`
            <table>
                <thead>
                    <tr>
                        <th>Version</th>
                        <th>Oprettet</th>
                        <th>Sidst ændret</th>
                        <th>Handling</th>
                    </tr>
                </thead>
                <tbody>
                    ${this._render_version_rows()}
                </tbody>
            </table>
            ${dirty ? nothing : html`<button class="control-button" @click=${this._create_backup}> Lav backup </button>`}
        `;
    }
    private *_render_version_rows() {
        const dirty = state_manager.dirty;
        for (const version of state_manager.state.sdo.versions ?? []) {
            const is_the_active_one = version.name === state_manager.state.sdo.publishedVersion;
            const tr_class = is_the_active_one ? 'active-version-tr' : '';
            const buttons = dirty || is_the_active_one ? html`` : html`
                <button class="control-button" @click=${this._set_published_version(version.name)}> Genopret </button>
                <button class="control-button" @click=${this._delete_vesion(version.name)}> Slet </button>
            `;
            yield html`
                <tr class="${tr_class}">
                    <td>${version.name}</td>
                    <td>${version.created.toLocaleDateString()}</td>
                    <td>${version.modified.toLocaleDateString()}</td>
                    <td>
                        ${buttons}
                    </td>
                </tr>
            `;
        }
    }

    private _set_published_version = (version: string) => () => {
        state_manager.patch(state_manager.path().at('sdo').at('publishedVersion').patch(version));
    }

    private _delete_vesion = (version: string) => () => {
        
        const path = state_manager.path().at('sdo').at('versions');
        const versions = path.get(state_manager.state) ?? [];
        const to_be_deleted_version = versions.find(x => x.name === version);
        if(to_be_deleted_version == null) {
            throw new Error("Could not delete version.");
        }
        
        state_manager.patch(path.patch(versions.filter(x => to_be_deleted_version.name !== x.name)));
    }

    private _create_backup = async () => {
        const path = state_manager.path().at('sdo').at('versions');
        const versions = path.get(state_manager.state) ?? [];
        const current_version = versions.find(x => x.name === state_manager.state.sdo.publishedVersion);
        if(current_version == null) {
            throw new Error("Could not create backup. current_vesion == null");
        }
        
        const name = `backup-${new Date().getTime()}` ;
        
        state_manager.patch(path.patch([...versions, {
            ...current_version,
            name
        }]));

        const to_be_backed_up_pages = await db.get(`gal/${this.site_root}/pages/${current_version.name}`);
        const check = await db.get(`gal/${this.site_root}/pages/${name}`)
        if(check) {
            throw new Error(`Refusing to back up. Backup will override version '${name}'`);
        }
        await db.put(`gal/${this.site_root}/pages/${name}`, to_be_backed_up_pages);
    }
}
