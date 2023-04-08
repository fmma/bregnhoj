import '@fmma-npm/wc-table';
import type { Field } from '@fmma-npm/wc-table';
import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { SiteDatabaseObject, SiteVersion } from "./Types";


@customElement('b-site-versions')
export class BsiteVersions extends LitElement {

    renderRoot: HTMLElement | ShadowRoot = this;

    @property()
    siteDabaseObject?: SiteDatabaseObject;

    get rows(): SiteVersion[] {
        return this.siteDabaseObject?.versions ?? [];
    }

    get fields(): Field<SiteVersion>[] {
        const main = this.siteDabaseObject?.publishedVersion ?? 'main';
        const dev = this.siteDabaseObject?.devVersion ?? 'dev';
        return [
            {
                field: 'name',
                title: 'Navn',
                renderEdit: (r, i) => html`<input .value="${r.name}" @change=${(e: any) => this.change(r, i, e.target.value)}>`
            },
            {
                field: 'name',
                title: 'Status',
                render: (r, i) => html`<span>${r.name === main ? 'I produktion' : r.name === dev ? 'Under redigering' : ''}</span>`
            },
            {
                field: 'created',
                title: 'Oprettet'
            },
            {
                field: 'modified',
                title: 'Sidst rettet'
            },
            {
                field: 'name',
                title: 'Åben version for redigering',
                render: (r, i) => html`<button .disabled=${r.name === main} .title=${r.name === main ? 'Kan redigere denne version da den er i produktion. Dupliker den først og rediger i dupletten.' : ''}  @click=${() => this.open(r,i)}>Åben</button>`
            },
            {
                field: 'name',
                title: 'Dupliker version',
                render: (r,i) => html`<button @click=${() => this.duplicate(r,i)}>Dupliker</button>`
            },
            {
                field: 'name',
                title: 'Udgiv version',
                render: (r,i) => html`<button .disabled=${r.name === main} .title=${r.name === main ? 'Kan ikke udgive denne version da den allerede er i produktion.' : ''} @click=${() => this.publish(r,i)}>Udgiv</button>`
            },
            {
                field: 'name',
                title: 'Slet version',
                render: (r,i) => html`<button .disabled=${r.name === main} .title=${r.name === main ? 'Kan slette denne version da den er i produktion.' : ''} @click=${() => this.delete(r,i)}>Slet</button>`
            }
        ]
    }

    change = (row: SiteVersion, i: number, value: string) => {
        this.dispatchEvent(new CustomEvent('change-site-name', {detail: {row, i, value}}));
    }

    duplicate = (row: SiteVersion, i: number) => {
        this.dispatchEvent(new CustomEvent('duplicate-site-version', {detail: {row, i}}));
    }

    publish = (row: SiteVersion, i: number) => {
        this.dispatchEvent(new CustomEvent('publish-site-version', {detail: {row, i}}));
    }

    open = (row: SiteVersion, i: number) => {
        this.dispatchEvent(new CustomEvent('open-site-version', {detail: {row, i}}));
    }

    delete = (row: SiteVersion, i: number) => {
        this.dispatchEvent(new CustomEvent('delete-site-version', {detail: {row, i}}));
    }

    renameSite = (e: any) => {
        this.dispatchEvent(new CustomEvent('rename-site', {detail: e.target.value}))
    }

    render() {
        return html`
            <h1>
                Versioner
            </h1>
            <p>Sidens navn <input .value=${this.siteDabaseObject?.siteTitle ?? ''} @change=${this.renameSite}></p>
            <fmma-table
                .rows=${this.rows}
                .fields=${this.fields}
            ></fmma-table>
        `;
    }
}