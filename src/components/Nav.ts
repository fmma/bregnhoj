import { html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { renderSoMeIcon } from "../functions/renderSoMeIcon";
import { urlify } from "../functions/urlify";
import { socialMediaNames, Page, SubPage, SoMeLink } from "./Types";
import { stateM } from "./stateM";

type EditType = { k: 'menu', i: number } | { k: 'submenu', i: number, j: number };

@customElement('b-nav')
export class Nav extends LitElement {

    renderRoot = this;

    @property({type: String})
    siteTitle: string = '';

    @property({type: Array})
    pages!: Page[];

    @property({type: Array})
    soMeLinks!: SoMeLink[]

    @property({type: Boolean})
    editting = false;

    get ps() {
        return this.pages;
    }

    set ps(pages: Page[]) {
        stateM.patch(stateM.path().at('pages').patch(pages));
    }


    navigate = (i: number, j: number | undefined) => () => {
        const detail = {i,j};
        this.dispatchEvent(new CustomEvent('nav', {detail}))
    }

    toggleEdit(e: EditType) {
        if(this.editIsCurrent(e)) {
            this.edit = undefined;
            return;
        }
        this.edit = e;
        setTimeout(() => {
            const input = this.querySelector('.visible-input') as HTMLInputElement | undefined;
            input?.focus();
            input?.select();
        })
    }


    @state()
    edit?: EditType;

    editIsCurrent(e: EditType) {
        const { edit } = this;
        return JSON.stringify(e) === JSON.stringify(edit);
    }

    updateTitle = (i: number) => (e: InputEvent) => {
        const { ps } = this;
        const newTitle = (e.composedPath()[0] as HTMLInputElement).value;
        this.ps = [...ps.slice(0, i), { ...ps[i], title: newTitle }, ...ps.slice(i + 1)];
        this.toggleEdit({ k: 'menu', i });
    }


    updateSubTitle = (i: number, j: number) => (e: InputEvent) => {
        const newTitle = (e.composedPath()[0] as HTMLInputElement).value;
        const { ps } = this;
        const page = ps[i];
        const subPage = page.subPages[j];
        this.ps = [...ps.slice(0, i), { ...page, subPages: [...page.subPages.slice(0, j), { ...subPage, title: newTitle }, ...page.subPages.slice(j + 1)] }, ...ps.slice(i + 1)];
        this.toggleEdit({ k: 'submenu', i, j });
    }

    updatePage = (i: number) => (e: { detail: Page }) => {
        const { ps } = this;
        this.ps = [...ps.slice(0, i), e.detail, ...ps.slice(i + 1)];
    }

    updateSubPage = (i: number, j: number) => (e: { detail: SubPage }) => {
        const { ps } = this;
        const page = ps[i];
        this.ps = [...ps.slice(0, i), { ...page, subPages: [...page.subPages.slice(0, j), e.detail, ...page.subPages.slice(j + 1)] }, ...ps.slice(i + 1)];
    }

    newPage = () => {
        const { ps } = this;
        this.ps = [...ps, { title: 'Ny side', tiles: [], subPages: [] }]
    }

    newSubPage = (i: number) => () => {
        const { ps } = this;
        const page = ps[i];
        this.ps = [...ps.slice(0, i), { ...page, subPages: [...page.subPages, { title: 'Ny underside', tiles: [] }] }, ...ps.slice(i + 1)]
    }

    deletePage = (i: number) => () => {
        this.ps = this.ps.filter((_, j) => i !== j);
        location.hash = '';
    }

    moveLeft = (i: number) => () => {
        if(i === 0)
            return;
        this.ps = this.ps.map((p, j) => j === i ? this.ps[i-1] : j === i - 1 ? this.ps[i] : p);
    }
    moveRight = (i: number) => () => {
        if(i === this.ps.length - 1)
            return;
        this.ps = this.ps.map((p, j) => j === i ? this.ps[i+1] : j === i + 1 ? this.ps[i] : p);
    }

    deleteSubPage = (i: number, j: number) => () => {
        const { ps } = this;
        const page = ps[i];
        this.ps = [...ps.slice(0, i), { ...page, subPages: page.subPages.filter((_, k) => k !== j) }, ...ps.slice(i + 1)];
        location.hash = '';
    }

    blurInput = (edit: EditType) => () => {
        setTimeout(() => {
            if(this.editIsCurrent(edit)) {
                return this.edit = undefined;
            }
        }, 100)
    }

    renderMenu() {
        const { updateSubTitle, deleteSubPage, updateTitle, newPage, newSubPage, deletePage, navigate, moveLeft, moveRight, ps } = this;

        return html`
        <div class="menu-header">
            <h1 class="menu-h1">
                <a href="#">${this.siteTitle}</a>
            </h1>
        </div>
        <div class="menu">
            <ul>
                ${ps.map((page, i) => html`
                <li>
                    <a href="#${urlify(this.pages, page.title)}" @click=${navigate(i, undefined)}
                        class="topmenu ${this.editIsCurrent({ k: 'menu', i }) ? 'hidden' : ''}"
                        >${page.title}
                    </a>
                    ${
                        this.editting
                            ? html`
                                <input value=${page.title}
                                    @change=${updateTitle(i)} class="${this.editIsCurrent({ k: 'menu', i }) ? 'visible-input' : 'hidden'}"
                                    @blur=${this.blurInput({ k: 'menu', i })}
                                >
                            `
                            : nothing
                    }
                    <div class="submenu">
                        <ul>
                            
                            ${this.editting ? html`
                                <li>
                                    <b-icon title="Rediger" icon="edit"  @click=${() => this.toggleEdit({ k: 'menu', i })}></b-icon>
                                    <b-icon title="Slet" icon="delete" @click=${deletePage(i)}></b-icon>
                                    <b-icon title="Flyt til venstre" icon="left" @click=${moveLeft(i)}></b-icon>
                                    <b-icon title="Flyt til højre" icon="right" @click=${moveRight(i)}></b-icon>
                                    <b-icon title="Tilføj ny underside" icon="add" @click=${newSubPage(i)}></b-icon>
                                </li>
                            `: nothing}
                            ${page.subPages.map((subPage, j) => html`
                            <li>
                                <a href="#${urlify(this.pages, page.title, subPage.title)}" @click=${navigate(i,j)}
                                            class="${this.editIsCurrent({ k: 'submenu', i, j }) ? 'hidden' : ''}"
                                    >
                                    ${subPage.title}
                                </a>
                                ${
                                    this.editting
                                        ? html`
                                            <input value=${subPage.title}
                                                @change=${updateSubTitle(i, j)} class="${this.editIsCurrent({ k: 'submenu', i, j }) ? 'visible-input' : 'hidden'}"
                                                @blur=${this.blurInput({ k: 'submenu', i, j })}
                                            >

                                            <b-icon title="Rediger" icon="edit" @click=${() => this.toggleEdit({ k: 'submenu', i, j })}></b-icon>
                                            <b-icon title="Slet" icon="delete" @click=${deleteSubPage(i, j)}></b-icon>
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
                            <b-icon title="Tilføj ny side" icon="add" @click=${newPage}></b-icon>
                        </li>
                        `
                        : nothing
                }
                ${this.soMeLinks.map(soMeLink => soMeLink.user && html`
                        <li>${renderSoMeIcon(soMeLink)}</li>
                    `)}
            </ul>
        </div>
        `
    }

    render() {
        return this.renderMenu();
    }
}