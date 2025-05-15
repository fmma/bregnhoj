import '@fmma-npm/wc-table';
import type { Field } from '@fmma-npm/wc-table';
import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { socialMediaNames, SiteDatabaseObject, SoMeLink } from "../types";
import { state_manager } from '../state_manager';


@customElement('b-settings')
export class Bsettings extends LitElement {

    renderRoot: HTMLElement | ShadowRoot = this;

    @property()
    siteDabaseObject?: SiteDatabaseObject;

    get rows(): SoMeLink[] {
        const list = this.siteDabaseObject?.soMeLinks ?? [];
        for(const soMeName of socialMediaNames) {
            if(!list.find(x => x.name == soMeName)) {
                list.push({name: soMeName, user: ''})
            }
        }
        return list;
    }

    get fields(): Field<SoMeLink>[] {
        return [
            {
                field: 'name',
                title: 'Navn',
            },
            {
                field: 'user',
                title: 'Bruger',
                renderEdit: r => {
                    const change = (e: any) => {
                        const rows = this.rows;
                        const newValue = e.target.value || '';
                        rows.find(x => x.name === r.name)!.user = newValue;
                        const rowsFiltered = rows.filter(x => {
                            const keep = !!x.user?.trim();
                            return keep;
                        });
                        state_manager.patch(state_manager.path().at('sdo').at('soMeLinks').patch([...rowsFiltered]))
                    }
                    return html`
                        <input .value=${r.user} @change=${change}>   
                    `;
                }
            }
        ]
    }

    renameSite = (e: any) => {        
        state_manager.patch(state_manager.path().at('sdo').at('siteTitle').patch(e.target.value));
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