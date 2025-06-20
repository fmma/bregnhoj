import { configure, db, media, visitors } from '@fmma-npm/http-client';
import { ObjPath } from '@fmma-npm/state';
import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { API_HOST, DEFAULT_HEIGHT, DEFAULT_HEIGHT_DOUBLE, DEFAULT_HEIGHT_HALF, DEFAULT_WIDTH } from '../constants';
import { get_rect } from '../functions/get_rect';
import { get_viewport } from '../functions/get_width';
import { is_mobile } from '../functions/is_mobile';
import { read_file } from '../functions/read_file';
import { autotile_iteration } from '../functions/autotile_iteration';
import { snap } from '../functions/snap';
import { urlify } from '../functions/urlify';
import { State, state_manager } from '../state_manager';
import type { Expanse, Image, Page, PageOrSubPage, Rect, SiteDatabaseObject, SiteVersion, SubPage, Tile } from '../types';
import './Icon';
import './ImagePreview';
import './Nav';
import './NavMobile';
import './NewSite';
import './Overview';
import './Page';
import type { Bpage } from './Page';
import './Settings';
import './TextEditor';
import './Tile';
import { tiptap_editor } from '../global_text_editor';

configure({
    host: API_HOST
});

@customElement('b-app')
export class Bapp extends LitElement {

    constructor() {
        super();
        state_manager.observe(state_manager.path(), () => {
            return this._state = state_manager.state;
        });
    }

    renderRoot = this;

    private _set_loading = (e: CustomEvent<{ i: number, n: number } | undefined>) => {
        this._loading = e.detail;
    }

    private _site_root?: string;

    @property({ type: String, reflect: true, attribute: 'site-root' })
    set site_root(x: string) {
        this._site_root = x;
        this._load_site();
    }
    get site_root() {
        return this._site_root ?? '';
    }

    @state()
    private _comming_from_desktop = false;

    @state()
    private _visitors?: number;

    @state()
    private _viewport = get_viewport();

    @state()
    private _current_page: { page: number, sub?: number } = { page: 0 };

    @state()
    private _editting = false;

    @state()
    private _saving = false;

    @state()
    private _loading?: { i: number, n: number }

    @state()
    private _mobile = is_mobile();

    @state()
    private _state = state_manager.state;

    @state()
    private _preview_tile_index?: { pageIndex: number, subPageIndex?: number, tileIndex: number };

    @state()
    private _is_settings_opened = false;

    @state()
    private _site_is_new = false;

    @state()
    private _error: string | undefined = undefined;

    private async _load_site() {
        try {
            const sdo = await this._get_site_object()
            if (sdo != null) {
                const pages = await this._get_pages(sdo.publishedVersion) ?? [{ title: 'Ny side', subPages: [], tiles: [] }];
                state_manager.reset({ pages, sdo });

                setTimeout(() =>
                    this._try_set_current_page()
                );
            }
            else {
                this._site_is_new = true;
            }
        } catch {
               this._error = "Der er sket en fejl: Kunne ikke loade siden."
        }
        this._visitors = (await visitors.get(window.location.host))?.visitors ?? 0;
    }

    private get _tiles() {
        return this._pages.flatMap(p => [...p.tiles, ...p.subPages.flatMap(sp => sp.tiles)]);
    }

    private get _images() {
        return this._tiles.map(t => t.image).filter((x): x is Image => x != null);
    }

    private _try_set_current_page() {
        const hash = window.location.hash.slice(1);

        for (const [i, page] of this._pages.entries()) {
            if (hash == urlify(this._pages, page.title)) {
                this._current_page = { page: i }
                return;
            }
            for (const [j, subPage] of page.subPages.entries()) {
                if (hash == urlify(this._pages, page.title, subPage.title)) {
                    this._current_page = { page: i, sub: j };
                    return;
                }
            }
        }
        this._current_page = { page: 0 };
    }

    private _update_page = (i: number) => (e: { detail: Page }) => {
        const pages = this._pages;
        this._pages = [...pages.slice(0, i), e.detail, ...pages.slice(i + 1)];
    }

    private _open_preview = (e: { detail: { tileIndex: number } }) => {
        const { page, sub } = this._current_page;
        this._preview_tile_index = { pageIndex: page, subPageIndex: sub, tileIndex: e.detail.tileIndex };
    }

    private _update_sub_page = (i: number, j: number) => (e: { detail: SubPage }) => {
        const pages = this._pages;
        const page = pages[i];
        this._pages = [...pages.slice(0, i), { ...page, subPages: [...page.subPages.slice(0, j), e.detail, ...page.subPages.slice(j + 1)] }, ...pages.slice(i + 1)];
    }

    connectedCallback(): void {
        super.connectedCallback();
        window.addEventListener('resize', this._resize);
        window.addEventListener('hashchange', this._hash_change);
        window.addEventListener('keyup', this._keyup)
        window.addEventListener('keydown', this._keydown)
        window.addEventListener('keypress', this._keypress)
        screen.orientation.addEventListener('change', this._resize);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        window.removeEventListener('resize', this._resize);
        window.removeEventListener('hashchange', this._hash_change);
        window.removeEventListener('keyup', this._keyup);
        window.removeEventListener('keydown', this._keydown);
        window.removeEventListener('keypress', this._keypress);
        screen.orientation.removeEventListener('change', this._resize);
    }

    private _hash_change = () => this._try_set_current_page()

    private _keyup = (e: KeyboardEvent) => {
    }
    private _keydown = (e: KeyboardEvent) => {
        if (this.querySelector('b-text-editor') != null)
            return;
        if (e.key === 'a' && e.ctrlKey) {
            e.preventDefault();
            const currentPage = this.querySelector('b-page') as Bpage | undefined;
            if (currentPage != null) {
                currentPage.active_tiles = currentPage.tiles.map((_, i) => i);
            }
        }
        else if (e.key === 'z' && e.ctrlKey) {
            this._undo();
        }
        else if (e.key === 'y' && e.ctrlKey) {
            this._redo();
        }
    }
    private _keypress = (e: KeyboardEvent) => {
    }

    private _resize = (e: Event) => {
        const newViewport = get_viewport();
        if (newViewport.pixelRatio === this._viewport.pixelRatio && newViewport.width === this._viewport.width)
            return;

        this._mobile = is_mobile();
        this._viewport = newViewport;
    }

    private get _preview_tile() {
        const ix = this._preview_tile_index
        if (ix == null)
            return undefined;
        const { pageIndex, tileIndex, subPageIndex } = ix;

        return subPageIndex == null
            ? this._pages[pageIndex].tiles[tileIndex]
            : this._pages[pageIndex].subPages[subPageIndex].tiles[tileIndex];
    }

    private get _pages() {
        return this._state.pages;
    }
    private set _pages(pages: Page[]) {
        state_manager.patch(state_manager.path().at('pages').patch(pages));
    }

    private get so_me_links() {
        return this._state.sdo.soMeLinks ?? [];
    }
    private get _sdo() {
        return this._state.sdo;
    }
    private set _sdo(sdo: SiteDatabaseObject) {
        state_manager.patch(state_manager.path().at('sdo').patch(sdo));
    }
    private get _can_undo() {
        return state_manager.canUndo;
    }
    private get _can_redo() {
        return state_manager.canRedo
    }
    private get _can_save() {
        return this._can_undo;
    }
    private get _can_open_settings() {
        return !this._can_save;
    }

    private _new_text_box = () => {
        const e: Expanse = { w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT }

        if (this._current_page.sub != null) {
            const subPage = this._pages[this._current_page.page].subPages[this._current_page.sub];
            const r: Rect = get_rect(e, subPage.tiles);
            const detail: Tile = { rect: r, textBlock: { text: '<h1>Overskrift</h1><p>Skriv tekst her</p>' } }
            this._update_sub_page(this._current_page.page, this._current_page.sub)({
                detail: {
                    ...subPage,
                    tiles: [...subPage.tiles, detail]
                }
            });
        }
        else {
            const page = this._pages[this._current_page.page]
            const r: Rect = get_rect(e, page.tiles);
            const detail: Tile = { rect: r, textBlock: { text: '<h1>Overskrift</h1><p>Skriv tekst her</p>' } }
            this._update_page(this._current_page.page)({
                detail: {
                    ...page,
                    tiles: [...page.tiles, detail]
                }
            })
        }
    }

    private _autotile = () => {
        const tiles = this._current_page.sub != null
            ? this._pages[this._current_page.page].subPages[this._current_page.sub].tiles
            : this._pages[this._current_page.page].tiles;

        let { new_tiles, badness } = autotile_iteration(tiles);
        for (let i = 0; i < 100; ++i) {
            const r = autotile_iteration(tiles);
            if (r.badness < badness) {
                new_tiles = r.new_tiles;
                badness = r.badness;
            }
        }

        if (this._current_page.sub != null) {
            const subPage = this._pages[this._current_page.page].subPages[this._current_page.sub];
            this._update_sub_page(this._current_page.page, this._current_page.sub)({
                detail: { ...subPage, tiles: new_tiles }
            });
        }
        else {
            const page = this._pages[this._current_page.page]
            this._update_page(this._current_page.page)({
                detail: { ...page, tiles: new_tiles }
            });
        }
    }

    private _upload_images = async (e: { detail: File[] }) => {

        for (const f of e.detail) {
            const { compressed, uncompressed, thumbnail, w, h, ogw, ogh } = await read_file(f);

            let scale = DEFAULT_HEIGHT / h;
            let e: Expanse = { w: snap(w * scale), h: snap(h * scale) }
            if (e.w * e.h < DEFAULT_HEIGHT * DEFAULT_HEIGHT * 0.6) {
                let scale = DEFAULT_HEIGHT_DOUBLE / h;
                e = { w: snap(w * scale), h: snap(h * scale) }
            }
            else if (e.w * e.h > DEFAULT_HEIGHT * DEFAULT_HEIGHT * 2) {
                let scale = DEFAULT_HEIGHT_HALF / h;
                e = { w: snap(w * scale), h: snap(h * scale) }
            }

            if (this._current_page.sub != null) {
                const subPage = this._pages[this._current_page.page].subPages[this._current_page.sub];
                const rect: Rect = get_rect(e, subPage.tiles);

                const detail: Tile = {
                    rect,
                    image: {
                        isNew: true,
                        url: `url(${thumbnail})`,
                        bigurl: `url(${uncompressed})`,
                        file: f,
                        compressedFile: compressed,
                        w,
                        h,
                        ogw,
                        ogh
                    }
                };

                this._update_sub_page(this._current_page.page, this._current_page.sub)({
                    detail: {
                        ...subPage,
                        tiles: [...subPage.tiles, detail]
                    }
                });
            }
            else {
                const page = this._pages[this._current_page.page]
                const rect: Rect = get_rect(e, page.tiles);

                const detail: Tile = {
                    rect,
                    image: {
                        isNew: true,
                        url: `url(${thumbnail})`,
                        bigurl: `url(${uncompressed})`,
                        file: f,
                        compressedFile: compressed,
                        w,
                        h,
                        ogw,
                        ogh
                    }
                };

                this._update_page(this._current_page.page)({
                    detail: {
                        ...page,
                        tiles: [...page.tiles, detail]
                    }
                })
            }
        }
    }

    private _open_settings = () => {
        this._is_settings_opened = true;
    }

    private _close_settings = () => {
        this._is_settings_opened = false;
    }

    private _undo = () => {
        if (this._can_undo) {
            state_manager.undo();
        }
    }

    private _redo = () => {
        if (this._can_redo) {
            state_manager.redo();
        }
    }

    private _start_editting = async () => {
        if (!this._sdo?.devVersion)
            this._open_settings();
        this._editting = true;
        state_manager.reset();
        await this._load_site();
    }

    private _stop_editting = async () => {
        this._editting = false;
        state_manager.reset();
        await this._load_site();
    }

    private _toggle_mobile = () => {
        this._mobile = !this._mobile;
        this._comming_from_desktop = true;
    }

    private _gem = async () => {
        if (this._sdo == null)
            return;

        const saveFile = async (data: File | Blob, fileName: string) => {
            return await media.put(data as File, fileName);
        }

        this._saving = true;
        const { _pages: pages } = this;

        const saveInternal = async () => {
            for (const p of pages.flatMap(p => [p, ...p.subPages ?? []])) {
                for (const t of p.tiles) {
                    if (t.image?.isNew) {
                        if (t.image.file == null || t.image.compressedFile == null)
                            continue;
                        const [bigurl, url] = await Promise.all([
                            await saveFile(t.image.file, t.image.file.name),
                            await saveFile(t.image.compressedFile as File, t.image.file.name)
                        ]);
                        t.image.bigurl = bigurl;
                        t.image.url = url;
                        t.image.isNew = false;
                    }

                }
            }
            const dbValue = pages.map(page => ({
                ...page,
                tiles: page.tiles.map((x): Tile => {
                    return {
                        rect: x.rect,
                        textBlock: x.textBlock,
                        image: x.image == null ? undefined : {
                            bigurl: x.image.bigurl,
                            url: x.image.url,
                            caption: x.image.caption,
                            w: x.image.w,
                            h: x.image.h,
                            ogw: x.image.ogw,
                            ogh: x.image.ogh
                        }
                    };
                }),
                subPages: page.subPages.map(subPage => ({
                    ...subPage,
                    tiles: subPage.tiles.map((x): Tile => {
                        return {
                            rect: x.rect,
                            textBlock: x.textBlock,
                            image: x.image == null ? undefined : {
                                bigurl: x.image.bigurl,
                                url: x.image.url,
                                caption: x.image.caption,
                                w: x.image.w,
                                h: x.image.h,
                                ogw: x.image.ogw,
                                ogh: x.image.ogh
                            }
                        };
                    })
                }))
            }));

            const obj = await this._get_site_object();
            const version = obj?.versions.find(x => x.name === this._sdo?.devVersion)
            if (obj == null || version == null) {
                return;
            }
            version.modified = new Date();
            obj.imageMetadata = this._sdo.imageMetadata;
            obj.soMeLinks = this._sdo.soMeLinks;
            await this._put_pages(this._sdo?.devVersion, dbValue);
            await this._put_site_object(obj);

            this._saving = false;
            this._stop_editting();
        }


        try {
            await saveInternal();
        }
        catch (err) {

            this._saving = false;
            alert("Noget gik galt! Det er nok en god ide at reloade siden. Beklager.");
        }
    }

    private _get_pages(name: string) {
        return db.getObject<Page[]>(`gal/${this.site_root}/pages/${name}`);
    }

    private _put_pages(name: string, pages: Page[]) {
        return db.putObject<Page[]>(`gal/${this.site_root}/pages/${name}`, pages);
    }

    private _get_site_object() {
        return db.getObject<SiteDatabaseObject>(`gal/${this.site_root}/site`);
    }

    private _put_site_object(siteObject: SiteDatabaseObject) {
        return db.putObject<SiteDatabaseObject>(`gal/${this.site_root}/site`, siteObject);
    }

    render() {
        if(this._error) {
            return html`<p>${this._error}</p>`
        }
        if (this._site_is_new) {
            return html`<b-new-site .site_root=${this.site_root}></b-new-site>`;
        }
        if (this._is_settings_opened) {
            return html`
                <b-settings
                    @close-settings=${this._close_settings}
                    @save-settings=${this._gem}
                    .site_root=${this.site_root}
                ></b-settings>
            `;
        }

        const page = this._current_page?.sub != null
            ? this._pages[this._current_page.page]?.subPages[this._current_page.sub]
            : this._pages[this._current_page.page];

        if (page == null)
            return this._editting
                ? html`
                    <div class="buttons${this._mobile ? '-mobile' : ''}">
                        <b-icon title="Rå" icon="code" @click=${this._open_settings}></b-icon>
                    </div>
                `
                : nothing;

        if (this._loading) {
            return html`
                <progress min="0" max="${this._loading.n}" value=${this._loading.i}></progress>
            `
        }

        let pagePath: ObjPath<State, PageOrSubPage> =
            this._current_page.sub != null
                ? state_manager.path().at('pages').ix(this._current_page.page).at('subPages').ix(this._current_page.sub)
                : state_manager.path().at('pages').ix(this._current_page.page);

        return html`
            <b-image-preview .sdo=${this._sdo} .tile=${this._preview_tile} @close-preview=${() => this._preview_tile_index = undefined} .editting=${this._editting} .mobile=${this._mobile} .viewport=${this._viewport}></b-image-preview>
            <div class="outer">
                <div class="pages">
                    ${this._mobile
                ? html`<b-nav-mobile .pages=${this._pages} .so_me_links=${this.so_me_links} .site_title=${this._sdo?.siteTitle ?? ''}></b-nav-mobile>`
                : html`
                            <b-nav .pages=${this._pages}  .so_me_links=${this.so_me_links} .editting=${this._editting} .site_title=${this._sdo?.siteTitle ?? ''}></b-nav>
                        `
            }
                    <div class="page-wrapper">
                        ${this._renderButtons()}

                        <b-page .path=${pagePath} .mobile=${this._mobile} .page=${page} @open-preview=${this._open_preview} @b-set-loading=${this._set_loading} .editting=${this._editting} .viewport=${this._viewport}></b-page>
                    </div>

                    <div class="footer">
                        <hr>
                        <p>Besøgende: ${this._visitors ?? 0}</p>
                    </div>
                    ${this._render_overview()}
                </div>
            </div>
        `;
    }

    private _render_overview() {
        if (!this._editting)
            return nothing;
        return html`
            <b-overview .sdo=${this._sdo} .images=${this._images}></b-overview>
        `;
    }

    private _renderButtons() {

        if (!location.search.includes('admin'))
            return nothing;


        return this._mobile && !this._comming_from_desktop ? nothing
            : html`
            <div class="buttons${this._mobile ? '-mobile' : ''}">
                ${this._mobile
                    ? nothing
                    : this._editting
                        ? html`
                            <b-icon title="Bland billeder" @click=${this._autotile} icon="shuffle"></b-icon>
                            <b-icon title="Ny tekstboks" @click=${this._new_text_box} icon="edit-text"></b-icon>
                            <b-icon title="Upload billede(r)" @file-change=${this._upload_images} icon="file" file-input multiple accept="image/jpeg, image/png, image/jpg"></b-icon>
                            <b-icon title="Indstillinger" @click=${this._open_settings} .disabled=${!this._can_open_settings} icon="code"></b-icon>
                            <b-icon title="Undo" @click=${this._undo} .disabled=${this._saving || !this._can_undo} icon="undo"></b-icon>
                            <b-icon title="Redo" @click=${this._redo} .disabled=${this._saving || !this._can_redo} icon="redo"></b-icon>
                            <b-icon title="Gem" @click=${this._gem} .disabled=${this._saving || !this._can_save} icon="save"></b-icon>
                            <b-icon title="Kaser ændringer" @click=${this._stop_editting} icon="close"></b-icon>
                        `
                        : html`<b-icon title="Rediger" @click=${this._start_editting} icon="admin"></b-icon>`
                }
                ${this._mobile
                    ? html`
                        <b-icon title="Mobil" @click=${this._toggle_mobile} icon="mobile"></b-icon>
                    `
                    : html`
                        <b-icon title="Desktop" @click=${this._toggle_mobile} icon="desktop"></b-icon>

                    `}
            </div>
        `
    }
}