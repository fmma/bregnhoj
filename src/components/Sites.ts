import '@fmma-npm/wc-table';
import { db } from "@fmma-npm/http-client";
import { html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { Page, SiteDatabaseObject, Sites } from "./Types";
import type { Field } from '@fmma-npm/wc-table';

@customElement('b-sites')
export class Bsites extends LitElement{

    constructor() {
        super();
        this.loadSites();
    }

    async loadSites() {
        const sites = await this.getSites();
        this.sites = sites ?? {sites: []};
    }

    @state()
    sites?: Sites;

    get rows() {
        return this.sites?.sites ?? [];
    }

    get fields(): Field<this['rows'][0]>[] {
        return [
            {
                field: 'name'
            }
        ]
    }

    render() {
        return html`
            <fmma-table
                .rows=${this.rows}
                .fields=${this.fields}
            ></fmma-table>
            <input id="opret-input"><button @click=${this.opret}>Opret</button>
        `
    }

    opret = async () => {
        const inputElement = this.shadowRoot?.querySelector('#opret-input') as HTMLInputElement;
        const name = inputElement.value;
        if(!name) {
            alert('Tomt navn');
            throw new Error('Tomt navn');
        }
        const existing = await this.getSiteObject(name);
        if(!existing) {
            const now = new Date();
            const versionName = 'Hjemmeside'
            await this.putPages(name, versionName, [{
                subPages: [],
                tiles: [],
                title: 'Ny side'
            }])
            await this.putSiteObject(name, {
                siteTitle: name,
                devVersion: '',
                publishedVersion: '',
                versions: [{
                    created: now,
                    modified: now,
                    name: versionName
                }]
            })
        }
        else {
            console.log(existing);
            alert('Siden ' + name + ' fandtes allerede!');
        }
        await this.putSites({sites: [...this.sites?.sites ?? [], {name}]})
        await this.loadSites();
    }

    putSiteObject(siteRoot: string, siteObject: SiteDatabaseObject) {
        return db.putObject<SiteDatabaseObject>(`gal/${siteRoot}/site`, siteObject);
    }

    getSites() {
        return db.getObject<Sites>(`gal-sites`);
    }

    putSites(sites: Sites) {
        return db.putObject<Sites>(`gal-sites`, sites);
    }

    putPages(siteRoot: string, name: string, pages: Page[]) {
        return db.putObject<Page[]>(`gal/${siteRoot}/pages/${name}`, pages);
    }
    getSiteObject(siteRoot: string) {
        return db.getObject<SiteDatabaseObject>(`gal/${siteRoot}/site`);
    }
}