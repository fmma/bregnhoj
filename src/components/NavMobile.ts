import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { render_so_me_icon } from "../functions/render_so_me_icon";
import { urlify } from "../functions/urlify";
import { Page, SoMeLink, SubPage } from "../types";

let counter = 0;

@customElement('b-nav-mobile')
export class BnavMobile extends LitElement {

    renderRoot = this;

    constructor() {
        super();
        this._id = counter++;
    }

    private _id = 0;

    @property({ type: String })
    site_title: string = '';

    @property({ type: Array })
    pages!: Page[];

    @property({ type: Array })
    so_me_links!: SoMeLink[]

    private _close_menu = () => {
        const checkbox = this.querySelector('#mmenu-side-menu' + this._id) as HTMLInputElement;
        checkbox.checked = false;
    }

    private _render_sub_menu_item = (p: Page, sp: SubPage, i: number, j: number | undefined) => {
        return html`
            <a href="#${urlify(this.pages, p.title, sp.title)}" @click=${this._close_menu}>${sp.title}</a>
        `
    }

    private _render_menu_item = (p: Page, i: number) => {
        const { _render_sub_menu_item: renderSubMenuItem } = this;
        if (p.subPages.length === 0)
            return html`
                <li><a href="#${urlify(this.pages, p.title)}" @click=${this._close_menu}>${p.title}</a></li>
            `;
        return html`
            <li class="mmenu-subnav">
                <span class="mmenu-subnavbtn"><a href="#${urlify(this.pages, p.title)}" @click=${this._close_menu}>${p.title}</a></span>
                <div class="mmenu-subnav-content">
                    ${p.subPages.map((sp, j) => renderSubMenuItem(p, sp, i, j))}
                </div>
            </li>
        `
    }

    render() {
        const { pages, _render_menu_item: renderMenuItem } = this;
        return html`
            <header class="mmenu-header">
                <a href="" class="mmenu-logo">${this.site_title}</a>
                <input class="mmenu-side-menu" type="checkbox" id="mmenu-side-menu${this._id}" />
                ${this.so_me_links.map(soMeLink => soMeLink.user && html`
                        ${render_so_me_icon(soMeLink)}
                `)}
                <label class="mmenu-hamb" for="mmenu-side-menu${this._id}"><span class="mmenu-hamb-line"></span></label>
                <nav class="mmenu-nav">
                    <ul class="mmenu-menu">
                        ${pages.map(renderMenuItem)}
                    </ul>
                </nav>
            </header>
        `;
    }
}