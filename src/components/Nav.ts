import { html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { render_so_me_icon } from "../functions/render_so_me_icon";
import { urlify } from "../functions/urlify";
import { Page, SubPage, SoMeLink } from "../types";
import { state_manager } from "../state_manager";

type EditType = { k: 'menu', i: number } | { k: 'submenu', i: number, j: number };

@customElement('b-nav')
export class Nav extends LitElement {

    renderRoot = this;

    @property({type: String})
    site_title: string = '';

    @property({type: Array})
    pages!: Page[];

    @property({type: Array})
    so_me_links!: SoMeLink[]

    @property({type: Boolean})
    editting = false;

    @state()
    private _edit?: EditType;

    private get _pages() {
        return this.pages;
    }

    private set _pages(pages: Page[]) {
        state_manager.patch(state_manager.path().at('pages').patch(pages));
    }

    private _navigate = (i: number, j: number | undefined) => () => {
        const detail = {i,j};
        this.dispatchEvent(new CustomEvent('nav', {detail}))
    }

    private _toggle_edit(e: EditType) {
        if(this._edit_is_current(e)) {
            this._edit = undefined;
            return;
        }
        this._edit = e;
        setTimeout(() => {
            const input = this.querySelector('.visible-input') as HTMLInputElement | undefined;
            input?.focus();
            input?.select();
        })
    }

    private _edit_is_current(e: EditType) {
        const { _edit: edit } = this;
        return JSON.stringify(e) === JSON.stringify(edit);
    }

    private _update_title = (i: number) => (e: InputEvent) => {
        const { _pages: ps } = this;
        const newTitle = (e.composedPath()[0] as HTMLInputElement).value;
        this._pages = [...ps.slice(0, i), { ...ps[i], title: newTitle }, ...ps.slice(i + 1)];
        this._toggle_edit({ k: 'menu', i });
    }

    private _update_sub_title = (i: number, j: number) => (e: InputEvent) => {
        const newTitle = (e.composedPath()[0] as HTMLInputElement).value;
        const { _pages: ps } = this;
        const page = ps[i];
        const subPage = page.subPages[j];
        this._pages = [...ps.slice(0, i), { ...page, subPages: [...page.subPages.slice(0, j), { ...subPage, title: newTitle }, ...page.subPages.slice(j + 1)] }, ...ps.slice(i + 1)];
        this._toggle_edit({ k: 'submenu', i, j });
    }

    private _new_page = () => {
        const { _pages: ps } = this;
        this._pages = [...ps, { title: 'Ny side', tiles: [], subPages: [] }]
    }

    private _new_sub_page = (i: number) => () => {
        const { _pages: ps } = this;
        const page = ps[i];
        this._pages = [...ps.slice(0, i), { ...page, subPages: [...page.subPages, { title: 'Ny underside', tiles: [] }] }, ...ps.slice(i + 1)]
    }

    private _delete_page = (i: number) => () => {
        this._pages = this._pages.filter((_, j) => i !== j);
        location.hash = '';
    }

    private _delete_sub_page = (i: number, j: number) => () => {
        const { _pages: ps } = this;
        const page = ps[i];
        this._pages = [...ps.slice(0, i), { ...page, subPages: page.subPages.filter((_, k) => k !== j) }, ...ps.slice(i + 1)];
        location.hash = '';
    }

    private _move_page_left = (i: number) => () => {
        if(i === 0)
            return;
        this._pages = this._pages.map((p, j) => j === i ? this._pages[i-1] : j === i - 1 ? this._pages[i] : p);
    }
    
    private _move_page_right = (i: number) => () => {
        if(i === this._pages.length - 1)
            return;
        this._pages = this._pages.map((p, j) => j === i ? this._pages[i+1] : j === i + 1 ? this._pages[i] : p);
    }

    private _blur_input = (edit: EditType) => () => {
        setTimeout(() => {
            if(this._edit_is_current(edit)) {
                return this._edit = undefined;
            }
        }, 100)
    }

    private _render_menu() {
        return html`
        <div class="menu-header">
            <h1 class="menu-h1">
                <a href="#">${this.site_title}</a>
            </h1>
        </div>
        <div class="menu">
            <ul>
                ${this._pages.map((page, i) => html`
                <li>
                    <a href="#${urlify(this.pages, page.title)}" @click=${this._navigate(i, undefined)}
                        class="topmenu ${this._edit_is_current({ k: 'menu', i }) ? 'hidden' : ''}"
                        >${page.title}
                    </a>
                    ${
                        this.editting
                            ? html`
                                <input value=${page.title}
                                    @change=${this._update_title(i)} class="${this._edit_is_current({ k: 'menu', i }) ? 'visible-input' : 'hidden'}"
                                    @blur=${this._blur_input({ k: 'menu', i })}
                                >
                            `
                            : nothing
                    }
                    <div class="submenu">
                        <ul>
                            
                            ${this.editting ? html`
                                <li>
                                    <b-icon title="Rediger" icon="edit"  @click=${() => this._toggle_edit({ k: 'menu', i })}></b-icon>
                                    <b-icon title="Slet" icon="delete" @click=${this._delete_page(i)}></b-icon>
                                    <b-icon title="Flyt til venstre" icon="left" @click=${this._move_page_left(i)}></b-icon>
                                    <b-icon title="Flyt til højre" icon="right" @click=${this._move_page_right(i)}></b-icon>
                                    <b-icon title="Tilføj ny underside" icon="add" @click=${this._new_sub_page(i)}></b-icon>
                                </li>
                            `: nothing}
                            ${page.subPages.map((subPage, j) => html`
                            <li>
                                <a href="#${urlify(this.pages, page.title, subPage.title)}" @click=${this._navigate(i,j)}
                                            class="${this._edit_is_current({ k: 'submenu', i, j }) ? 'hidden' : ''}"
                                    >
                                    ${subPage.title}
                                </a>
                                ${
                                    this.editting
                                        ? html`
                                            <input value=${subPage.title}
                                                @change=${this._update_sub_title(i, j)} class="${this._edit_is_current({ k: 'submenu', i, j }) ? 'visible-input' : 'hidden'}"
                                                @blur=${this._blur_input({ k: 'submenu', i, j })}
                                            >

                                            <b-icon title="Rediger" icon="edit" @click=${() => this._toggle_edit({ k: 'submenu', i, j })}></b-icon>
                                            <b-icon title="Slet" icon="delete" @click=${this._delete_sub_page(i, j)}></b-icon>
                                        `
                                        : nothing
                                }
                            </li>
                            `)}
                        </ul>
                    </div>
                </li>
                `)}
                ${
                    this.editting
                        ? html`
                        <li class="new-page-button">
                            <b-icon title="Tilføj ny side" icon="add" @click=${this._new_page}></b-icon>
                        </li>
                        `
                        : nothing
                }
                ${this.so_me_links.map(soMeLink => soMeLink.user && html`
                        <li>${render_so_me_icon(soMeLink)}</li>
                    `)}
            </ul>
        </div>
        `;
    }

    render() {
        return this._render_menu();
    }
}