import { db } from '@fmma-npm/http-client';
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { state_manager } from '../state_manager';
import { Page, SiteDatabaseObject, SOCIAL_MEDIA_NAMES, SoMeName } from "../types";


@customElement('b-settings')
export class Bsettings extends LitElement {

    renderRoot: HTMLElement | ShadowRoot = this;

    @state()
    private _loading = false;

    // constructor() {
    //     super();
    //     state_manager.observe(state_manager.path().at('sdo'), () => {
    //         this.requestUpdate()
    //     });
    // }

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
                            ${html`<button class="control-button" @click=${() => this._close_settings()}> Luk indstillinger </button>`}
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
        await this._put_site_object(state_manager.state.sdo);
        state_manager.reset(state_manager.state);
        this.requestUpdate()
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
        `;
    }
    private *_render_version_rows() {
        const dirty = state_manager.dirty;
        for (const [i, version] of (state_manager.state.sdo.versions ?? []).entries()) {
            const is_the_active_one = version.name === state_manager.state.sdo.publishedVersion;
            const tr_class = is_the_active_one ? 'active-version-tr' : '';
            const buttons = is_the_active_one ? html`
                <span> AKTIV VERSION </span>
                <button class="control-button" @click=${this._create_backup}> Lav backup </button>
            ` : html`
                <button class="control-button" @click=${this._set_published_version(version.name)}> Sæt aktiv version </button>
                <button class="control-button" @click=${this._delete_vesion(version.name)}> Slet </button>
            `;
            yield html`
                <tr class="${tr_class}">
                    <td><input class="control-input" .value="${version.readable_name ?? version.name}" @change=${this._set_version_name(i)}/></td>
                    <td>${version.created.toLocaleDateString()}</td>
                    <td>${version.modified.toLocaleDateString()}</td>
                    <td>
                        ${buttons}
                    </td>
                </tr>
            `;
        }
    }

    private _set_version_name = (i: number) => (e: any) => {
        state_manager.patch(state_manager.path().at('sdo').at('versions').ix(i).at('readable_name').patch(e.target.value))
        this._save_settings();
    }

    private _set_published_version = (version: string) => async () => {
        state_manager.patch(state_manager.path().at('sdo').at('publishedVersion').patch(version));
        await this._save_settings();
    }

    private _delete_vesion = (version: string) => async () => {
        const path = state_manager.path().at('sdo').at('versions');
        const versions = path.get(state_manager.state) ?? [];
        const to_be_deleted_version = versions.find(x => x.name === version);


        if (to_be_deleted_version == null) {
            throw new Error("Could not delete version.");
        }

        if (!window.confirm(`Er du helt sikker på at du vil slette version '${to_be_deleted_version.readable_name ?? to_be_deleted_version.name}'? Handlingen kan ikke fortrydes.`))
            return;

        state_manager.patch(path.patch(versions.filter(x => to_be_deleted_version.name !== x.name)));
        await this._delete_pages(version);
        await this._save_settings();
    }

    private _create_backup = async () => {
        const path = state_manager.path().at('sdo').at('versions');
        const versions = path.get(state_manager.state) ?? [];
        const current_version = versions.find(x => x.name === state_manager.state.sdo.publishedVersion);
        if (current_version == null) {
            throw new Error("Could not create backup. current_vesion == null");
        }

        const name = `version-${new Date().getTime()}`;

        const to_be_backed_up_pages = await this._get_pages(current_version.name);
        if (to_be_backed_up_pages == null) {
            throw new Error('to_be_backed_up_pages == null');
        }
        const check = await db.get(`gal/${this.site_root}/pages/${name}`)
        if (check) {
            throw new Error(`Refusing to back up. Backup will override version '${name}'`);
        }
        await this._put_pages(name, to_be_backed_up_pages)

        state_manager.patch(path.patch([...versions, {
            ...current_version,
            name,
            readable_name: current_version.readable_name && current_version.readable_name + ' (backup)'
        }]));

        await this._save_settings();
    }

    private _get_pages(name: string) {
        return db.getObject<Page[]>(`gal/${this.site_root}/pages/${name}`);
    }

    private _put_pages(name: string, pages: Page[]) {
        return db.putObject<Page[]>(`gal/${this.site_root}/pages/${name}`, pages);
    }

    private _delete_pages(name: string) {
        return db.putObject<Page[]>(`gal/${this.site_root}/pages/${name}`, undefined);
    }

    private _put_site_object(siteObject: SiteDatabaseObject) {
        return db.putObject<SiteDatabaseObject>(`gal/${this.site_root}/site`, siteObject);
    }
}
