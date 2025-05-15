import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { urlify } from "../functions/urlify";
import { Page, SoMeLink, SubPage } from "./Types";
import { renderSoMeIcon } from "../functions/renderSoMeIcon";

let counter = 0;

@customElement('b-nav-mobile')
export class BnavMobile extends LitElement {

    constructor() {
        super();
        this._id = counter++;
    }

    private _id = 0;

    renderRoot = this;

    @property({type: String})
    siteTitle: string = '';

    @property({ type: Array })
    pages!: Page[];
    
    @property({type: Array})
    soMeLinks!: SoMeLink[]

    closeMenu = () => {
        const checkbox = this.querySelector('#mmenu-side-menu' + this._id) as HTMLInputElement;
        checkbox.checked = false;
    }


    renderSubMenuItem = (p: Page, sp: SubPage, i: number, j: number | undefined) => {
        return html`
            <a href="#${urlify(this.pages, p.title, sp.title)}" @click=${this.closeMenu}>${sp.title}</a>
        `
    }

    renderMenuItem = (p: Page, i: number) => {
        const { renderSubMenuItem } = this;
        if(p.subPages.length === 0)
            return html`
                <li><a href="#${urlify(this.pages, p.title)}" @click=${this.closeMenu}>${p.title}</a></li>
            `;
        return html`
            <li class="mmenu-subnav">
                <span class="mmenu-subnavbtn"><a href="#${urlify(this.pages, p.title)}" @click=${this.closeMenu}>${p.title}</a></span>
                <div class="mmenu-subnav-content">
                    ${p.subPages.map((sp, j) => renderSubMenuItem(p, sp, i, j))}
                </div>
            </li>
        `
    }

    render() {
        const { pages, renderMenuItem } = this;
        return html`
            <header class="mmenu-header">
                <a href="" class="mmenu-logo">${this.siteTitle}</a>
                <input class="mmenu-side-menu" type="checkbox" id="mmenu-side-menu${this._id}" />
                ${this.soMeLinks.map(soMeLink => soMeLink.user && html`
                        ${renderSoMeIcon(soMeLink)}
                `)}
                <label class="mmenu-hamb" for="mmenu-side-menu${this._id}"><span class="mmenu-hamb-line"></span></label>
                <nav class="mmenu-nav">
                    <ul class="mmenu-menu">
                        ${pages.map(renderMenuItem)}
                    </ul>
                </nav>
            </header>
        `
    }
}