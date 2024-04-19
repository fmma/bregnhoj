import { configure, db, media } from '@fmma-npm/http-client';
import { ObjPath } from '@fmma-npm/state';
import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { defaultHeight, defaultHeightDouble, defaultHeightHalf, defaultWidth } from '../constants';
import { getViewport } from '../functions/getWidth';
import { isMobile } from '../functions/isMobile';
import { overlaps } from '../functions/overlaps';
import { readFile } from '../functions/readFile';
import { shuffle } from '../functions/shuffle';
import { snap } from '../functions/snap';
import { urlify } from '../functions/urlify';
import "./AreaSelect";
import './Icon';
import './ImagePreview';
import './Nav';
import './NavMobile';
import './NewTiles';
import './Overview';
import './Page';
import type { Bpage } from './Page';
import './SiteVersions';
import './TextEditor';
import './Tile';
import type { Expanse, Image, Page, PageOrSubPage, Rect, SiteDatabaseObject, SiteVersion, SubPage, Tile } from './Types';
import { State, stateM } from './stateM';

configure({
    host: 'https://snesl.dk'
});

@customElement('b-app')
export class Bapp extends LitElement {

    constructor() {
        super();
        stateM.observe(stateM.path(), () => {
            return this._state = stateM.state;
        });
    }

    renderRoot = this;

    _setLoading = (e: CustomEvent<{ i: number, n: number } | undefined>) => {
        this.loading = e.detail;
    }

    _siteRoot?: string;
    @property({ type: String, reflect: true, attribute: 'site-root' })
    set siteRoot(x: string) {
        this._siteRoot = x;
        this.loadSite();
    }
    get siteRoot() {
        if (this._siteRoot == null)
            throw new Error('Site root not set');
        return this._siteRoot;
    }

    @property({ type: Boolean, reflect: true })
    dev = false

    @state()
    commingFromDesktop = false;

    @state()
    _viewport = getViewport();

    @state()
    _currentPage: { page: number, sub?: number } = { page: 0 };

    @state()
    editting = false;

    @state()
    saving = false;

    @state()
    loading?: { i: number, n: number }

    @state()
    mobile = isMobile();

    @state()
    _state = stateM.state;

    @state()
    previewTileIndex?: { pageIndex: number, subPageIndex?: number, tileIndex: number };

    @state()
    _isSiteVersionsOpened = false;

    async loadSite() {
        const sdo = await this.getSiteObject()
        if (sdo != null) {
            if (sdo.devVersion === sdo.publishedVersion) {

            }
            const pages = await this.getPages(
                this.dev
                    ? sdo.devVersion
                    : sdo.publishedVersion
            ) ?? [{ title: 'Ny side', subPages: [], tiles: [] }];
            stateM.reset({ pages, sdo });
        }
        setTimeout(() => 
            this.trySetCurrentPage()
        );
    }

    get tiles() {
        return this.pages.flatMap(p => [...p.tiles, ...p.subPages.flatMap(sp => sp.tiles)]);
    }

    get images() {
        return this.tiles.map(t => t.image).filter((x): x is Image => x != null);
    }

    trySetCurrentPage() {
        const hash = window.location.hash.slice(1);

        for (const [i, page] of this.pages.entries()) {
            if (hash == urlify(this.pages, page.title)) {
                this._currentPage = { page: i }
                return;
            }
            for (const [j, subPage] of page.subPages.entries()) {
                if (hash == urlify(this.pages, page.title, subPage.title)) {
                    this._currentPage = { page: i, sub: j };
                    return;
                }
            }
        }
        this._currentPage = { page: 0 };
    }

    updatePage = (i: number) => (e: { detail: Page }) => {
        const { pages } = this;
        this.pages = [...pages.slice(0, i), e.detail, ...pages.slice(i + 1)];
    }
    updatePages = (e: { detail: Page[] }) => {
        this.pages = e.detail;
    }

    openPreview = (e: { detail: { tileIndex: number } }) => {
        const { page, sub } = this._currentPage;
        this.previewTileIndex = { pageIndex: page, subPageIndex: sub, tileIndex: e.detail.tileIndex };
    }

    updateSubPage = (i: number, j: number) => (e: { detail: SubPage }) => {
        const { pages } = this;
        const page = pages[i];
        this.pages = [...pages.slice(0, i), { ...page, subPages: [...page.subPages.slice(0, j), e.detail, ...page.subPages.slice(j + 1)] }, ...pages.slice(i + 1)];
    }

    connectedCallback(): void {
        super.connectedCallback();
        window.addEventListener('resize', this.resize);
        window.addEventListener('hashchange', this.hashChange);
        window.addEventListener('keyup', this.keyup)
        window.addEventListener('keydown', this.keydown)
        window.addEventListener('keypress', this.keypress)
        screen.orientation.addEventListener('change', this.resize);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        window.removeEventListener('resize', this.resize);
        window.removeEventListener('hashchange', this.hashChange);
        window.removeEventListener('keyup', this.keyup);
        window.removeEventListener('keydown', this.keydown);
        window.removeEventListener('keypress', this.keypress);
        screen.orientation.removeEventListener('change', this.resize);
    }

    hashChange = () => this.trySetCurrentPage()

    keyup = (e: KeyboardEvent) => {
    }
    keydown = (e: KeyboardEvent) => {
        if (this.querySelector('b-text-editor') != null)
            return;
        if (e.key === 'a' && e.ctrlKey) {
            e.preventDefault();
            const currentPage = this.querySelector('b-page') as Bpage | undefined;
            if (currentPage != null) {
                currentPage.activeTiles = currentPage.tiles.map((_, i) => i);
            }
        }
        else if (e.key === 'z' && e.ctrlKey) {
            this.undo();
        }
        else if (e.key === 'y' && e.ctrlKey) {
            this.redo();
        }
    }
    keypress = (e: KeyboardEvent) => {
    }

    resize = (e: Event) => {
        const newViewport = getViewport();
        if (newViewport.pixelRatio === this._viewport.pixelRatio && newViewport.width === this._viewport.width)
            return;

        this.mobile = isMobile();
        this._viewport = newViewport;
    }

    get previewTile() {
        const ix = this.previewTileIndex
        if (ix == null)
            return undefined;
        const { pageIndex, tileIndex, subPageIndex } = ix;

        return subPageIndex == null
            ? this.pages[pageIndex].tiles[tileIndex]
            : this.pages[pageIndex].subPages[subPageIndex].tiles[tileIndex];
    }

    get pages() {
        return this._state.pages;
    }

    set pages(pages: Page[]) {
        stateM.patch(stateM.path().at('pages').patch(pages));
    }
    get sdo() {
        return this._state.sdo;
    }

    set sdo(sdo: SiteDatabaseObject) {
        stateM.patch(stateM.path().at('sdo').patch(sdo));
    }

    get canUndo() {
        return stateM.canUndo;
    }

    get canRedo() {
        return stateM.canRedo
    }

    get canSave() {
        return this.canUndo;
    }

    get canOpenSiteVersions() {
        return !this.canSave;
    }


    newTextBox = () => {
        const e: Expanse = { w: defaultWidth, h: defaultHeight }

        if (this._currentPage.sub != null) {
            const subPage = this.pages[this._currentPage.page].subPages[this._currentPage.sub];
            const r: Rect = this.getRect(e, subPage.tiles);
            const detail: Tile = { rect: r, textBlock: { text: '<h1>Overskrift</h1><p>Skriv tekst her</p>' } }
            this.updateSubPage(this._currentPage.page, this._currentPage.sub)({
                detail: {
                    ...subPage,
                    tiles: [...subPage.tiles, detail]
                }
            });
        }
        else {
            const page = this.pages[this._currentPage.page]
            const r: Rect = this.getRect(e, page.tiles);
            const detail: Tile = { rect: r, textBlock: { text: '<h1>Overskrift</h1><p>Skriv tekst her</p>' } }
            this.updatePage(this._currentPage.page)({
                detail: {
                    ...page,
                    tiles: [...page.tiles, detail]
                }
            })
        }

    }

    getRect(e: Expanse, tiles: Tile[]): Rect {
        const r = { ...e, x: 0, y: 0 };
        let swazzle = true;
        for (let y = 1; ; y += defaultHeight + 1) {
            swazzle = !swazzle;
            if (swazzle) {
                for (let x = 100 - e.w - 2; x >= 1; --x) {
                    r.x = x;
                    r.y = y;
                    let o = false;
                    for (const t of tiles) {
                        if (overlaps(r, t.rect))
                            o = true;
                    }
                    if (!o)
                        return r;
                    o = false;
                    r.y += defaultHeightHalf + 1;
                    for (const t of tiles) {
                        if (overlaps(r, t.rect))
                            o = true;
                    }
                    if (!o)
                        return r;
                }
            }
            else {
                for (let x = 1; x < 100 - e.w - 1; ++x) {
                    r.x = x;
                    r.y = y;
                    let o = false;
                    for (const t of tiles) {
                        if (overlaps(r, t.rect))
                            o = true;
                    }
                    if (!o)
                        return r;
                    o = false;
                    r.y += defaultHeightHalf + 1;
                    for (const t of tiles) {
                        if (overlaps(r, t.rect))
                            o = true;
                    }
                    if (!o)
                        return r;
                }
            }
        }
    }

    shuffle = () => {
        const newTiles: Tile[] = [];
        if (this._currentPage.sub != null) {
            const subPage = this.pages[this._currentPage.page].subPages[this._currentPage.sub];
            for (const tile of shuffle(subPage.tiles)) {
                if (tile.image == null) {
                    newTiles.push(tile);
                    continue;
                }
                const { w, h } = tile.image;

                let scale = defaultHeight / h;
                let e: Expanse = { w: snap(w * scale), h: snap(h * scale) }
                if (e.w * e.h < defaultHeight * defaultHeight * 0.6) {
                    let scale = defaultHeightDouble / h;
                    e = { w: snap(w * scale), h: snap(h * scale) }
                }
                else if (e.w * e.h > defaultHeight * defaultHeight * 5) {
                    let scale = defaultHeightHalf / h;
                    e = { w: snap(w * scale), h: snap(h * scale) }
                }

                const rect: Rect = this.getRect(e, newTiles);
                newTiles.push({
                    ...tile,
                    rect
                });

                this.updateSubPage(this._currentPage.page, this._currentPage.sub)({
                    detail: { ...subPage, tiles: newTiles }
                });
            }
        }
        else {
            const page = this.pages[this._currentPage.page]
            for (const tile of shuffle(page.tiles)) {
                if (tile.image == null) {
                    newTiles.push(tile);
                    continue;
                }
                const { w, h } = tile.image;

                let scale = defaultHeight / h;
                let e: Expanse = { w: snap(w * scale), h: snap(h * scale) }
                if (e.w * e.h < defaultHeight * defaultHeight * 0.6) {
                    let scale = defaultHeightDouble / h;
                    e = { w: snap(w * scale), h: snap(h * scale) }
                }
                else if (e.w * e.h > defaultHeight * defaultHeight * 5) {
                    let scale = defaultHeightHalf / h;
                    e = { w: snap(w * scale), h: snap(h * scale) }
                }

                const rect: Rect = this.getRect(e, newTiles);
                newTiles.push({
                    ...tile,
                    rect
                });

                this.updatePage(this._currentPage.page)({
                    detail: { ...page, tiles: newTiles }
                });
            }
        }

    }

    uploadImages = async (e: { detail: File[] }) => {

        for (const f of e.detail) {
            const { compressed, uncompressed, thumbnail, w, h, ogw, ogh } = await readFile(f);

            let scale = defaultHeight / h;
            let e: Expanse = { w: snap(w * scale), h: snap(h * scale) }
            if (e.w * e.h < defaultHeight * defaultHeight * 0.6) {
                let scale = defaultHeightDouble / h;
                e = { w: snap(w * scale), h: snap(h * scale) }
            }
            else if (e.w * e.h > defaultHeight * defaultHeight * 2) {
                let scale = defaultHeightHalf / h;
                e = { w: snap(w * scale), h: snap(h * scale) }
            }

            if (this._currentPage.sub != null) {
                const subPage = this.pages[this._currentPage.page].subPages[this._currentPage.sub];
                const rect: Rect = this.getRect(e, subPage.tiles);

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

                this.updateSubPage(this._currentPage.page, this._currentPage.sub)({
                    detail: {
                        ...subPage,
                        tiles: [...subPage.tiles, detail]
                    }
                });
            }
            else {
                const page = this.pages[this._currentPage.page]
                const rect: Rect = this.getRect(e, page.tiles);

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

                this.updatePage(this._currentPage.page)({
                    detail: {
                        ...page,
                        tiles: [...page.tiles, detail]
                    }
                })
            }
        }
    }

    openSiteVersions = () => {
        this._isSiteVersionsOpened = true;
    }

    closeSiteVersions = () => {
        this._isSiteVersionsOpened = false;
    }

    undo = () => {
        if (this.canUndo) {
            stateM.undo();
        }
    }

    redo = () => {
        if (this.canRedo) {
            stateM.redo();
        }
    }

    startEditting = async () => {
        if (!this.sdo?.devVersion)
            this.openSiteVersions();
        this.editting = true;
        stateM.reset();
        await this.loadSite();
    }

    stopEditting = async () => {
        this.editting = false;
        stateM.reset();
        await this.loadSite();
    }

    toggleMobile = () => {
        this.mobile = !this.mobile;
        this.commingFromDesktop = true;
    }

    gem = async () => {
        if (this.sdo == null)
            return;

        const saveFile = async (data: File | Blob, fileName: string) => {
            return await media.put(data as File, fileName);
        }

        this.saving = true;
        const { pages } = this;
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

        const obj = await this.getSiteObject();
        const version = obj?.versions.find(x => x.name === this.sdo?.devVersion)
        if (obj == null || version == null) {
            return;
        }
        version.modified = new Date();
        obj.imageMetadata = this.sdo.imageMetadata;
        await this.putPages(this.sdo?.devVersion, dbValue);
        await this.putSiteObject(obj);

        this.saving = false;
        this.stopEditting();
    }

    getPages(name: string) {
        const { siteRoot } = this;
        return db.getObject<Page[]>(`gal/${siteRoot}/pages/${name}`);
    }

    putPages(name: string, pages: Page[]) {
        const { siteRoot } = this;
        return db.putObject<Page[]>(`gal/${siteRoot}/pages/${name}`, pages);
    }

    deletePages(name: string) {
        const { siteRoot } = this;
        return db.putObject<Page[]>(`gal/${siteRoot}/pages/${name}`, undefined);
    }

    getSiteObject() {
        const { siteRoot } = this;
        return db.getObject<SiteDatabaseObject>(`gal/${siteRoot}/site`);
    }

    putSiteObject(siteObject: SiteDatabaseObject) {
        const { siteRoot } = this;
        return db.putObject<SiteDatabaseObject>(`gal/${siteRoot}/site`, siteObject);
    }

    siteVersionsEventHandlers = {
        change: async (e: CustomEvent<{ row: SiteVersion, i: number, value: string }>) => {
            const { row, i, value } = e.detail;
            if (row.name === value)
                return;

            const obj = await this.getSiteObject();
            const pages = await this.getPages(row.name);

            if (obj == null || pages == null)
                return;

            if (obj.versions.some(x => x.name === value)) {
                alert(`En version med navnet ${value} findes allerede`)
                return;
            }

            obj.versions[i].name = value;

            if (row.name === obj.devVersion)
                obj.devVersion = value;
            if (row.name === obj.publishedVersion)
                obj.publishedVersion = value;

            await this.deletePages(row.name);
            await this.putPages(value, pages);
            await this.putSiteObject(obj);

            await this.loadSite();
        },

        duplicate: async (e: CustomEvent<{ row: SiteVersion, i: number }>) => {
            const { row, i } = e.detail;
            const obj = await this.getSiteObject();
            const pages = await this.getPages(row.name);

            if (obj == null || pages == null)
                return;

            let name = row.name;
            let origName = name;
            let ix = 0;
            const match = name.match(/\(\d+\)$/);
            if (match) {
                origName = name.slice(0, match.index)
                ix = +match[0].slice(1, -1)
            }

            while (obj.versions.find(x => x.name === name)) {
                ix++;
                name = `${origName} (${ix})`;
            }

            const date = new Date();

            obj.versions.push({
                name,
                created: date,
                modified: date
            });

            await this.putPages(name, pages);
            await this.putSiteObject(obj);

            await this.loadSite();

        },

        open: async (e: CustomEvent<{ row: SiteVersion, i: number }>) => {
            const { row, i } = e.detail;
            const obj = await this.getSiteObject();

            if (obj == null)
                return;

            obj.devVersion = row.name;

            await this.putSiteObject(obj);
            await this.loadSite();
            this.closeSiteVersions();
        },

        delete: async (e: CustomEvent<{ row: SiteVersion, i: number }>) => {
            const { row, i } = e.detail;

            const obj = await this.getSiteObject();

            if (obj == null)
                return;

            obj.versions = obj.versions.filter(x => x.name !== row.name);

            if (row.name === obj.devVersion)
                obj.devVersion = '';

            await this.deletePages(row.name);
            await this.putSiteObject(obj);

            await this.loadSite();
        },

        publish: async (e: CustomEvent<{ row: SiteVersion, i: number }>) => {
            const { row, i } = e.detail;
            const obj = await this.getSiteObject();
            if (obj == null)
                return;
            obj.publishedVersion = row.name;
            if (obj.devVersion === obj.publishedVersion)
                obj.devVersion = '';

            await this.putSiteObject(obj);
            await this.loadSite();
        },

        renameSite: async (e: CustomEvent<string>) => {
            const newTitle = e.detail;
            const obj = await this.getSiteObject();
            if (obj == null)
                return;
            obj.siteTitle = newTitle;

            await this.putSiteObject(obj);
            await this.loadSite();
        }
    }

    render() {
        const { openPreview, pages, mobile } = this;


        if (this._isSiteVersionsOpened) {
            return html`
                <b-site-versions
                    @change-site-name=${this.siteVersionsEventHandlers.change}
                    @duplicate-site-version=${this.siteVersionsEventHandlers.duplicate}
                    @open-site-version=${this.siteVersionsEventHandlers.open}
                    @delete-site-version=${this.siteVersionsEventHandlers.delete}
                    @publish-site-version=${this.siteVersionsEventHandlers.publish}
                    @rename-site=${this.siteVersionsEventHandlers.renameSite}
                    .siteDabaseObject=${this.sdo}
                ></b-site-versions>
            `;
        }

        const page = this._currentPage?.sub != null
            ? this.pages[this._currentPage.page]?.subPages[this._currentPage.sub]
            : this.pages[this._currentPage.page];

        if (page == null)
            return this.editting
                ? html`
                    <div class="buttons${mobile ? '-mobile' : ''}">
                        <b-icon title="Filer" icon="folder-tree" @click=${this.openSiteVersions}></b-icon>
                    </div>
                `
                : nothing;

        if (this.loading) {
            return html`
                <progress min="0" max="${this.loading.n}" value=${this.loading.i}></progress>
            `
        }

        let pagePath: ObjPath<State, PageOrSubPage> =
            this._currentPage.sub != null
                ? stateM.path().at('pages').ix(this._currentPage.page).at('subPages').ix(this._currentPage.sub)
                : stateM.path().at('pages').ix(this._currentPage.page);

        return html`
            <b-image-preview .sdo=${this.sdo} .tile=${this.previewTile} @close-preview=${() => this.previewTileIndex = undefined} .editting=${this.editting} .mobile=${mobile} .viewport=${this._viewport}></b-image-preview>
            <div class="outer">
                <div class="pages">
                    ${mobile
                ? html`<b-nav-mobile .pages=${pages} .siteTitle=${this.sdo?.siteTitle ?? ''}></b-nav-mobile>`
                : html`
                            <b-nav .pages=${pages} .editting=${this.editting} .siteTitle=${this.sdo?.siteTitle ?? ''}></b-nav>
                        `
            }
                    <div class="page-wrapper">
                        ${this._renderButtons()
            }

                        <b-page .path=${pagePath} .mobile=${mobile} .page=${page} @open-preview=${openPreview} @b-set-loading=${this._setLoading} .editting=${this.editting} .viewport=${this._viewport}></b-page>
                    </div>

                    <div class="footer">
                        <hr>
                    </div>
                    ${this._renderOverview()}
                </div>
            </div>
        `;
    }

    private _renderOverview() {
        const { editting } = this;
        if (!editting)
            return nothing;
        return html`
            <b-overview .sdo=${this.sdo} .images=${this.images}></b-overview>
        `;
    }

    private _renderButtons() {
        const { gem, startEditting, mobile, saving } = this;

        if (!location.search.includes('admin'))
            return nothing;

        return mobile && !this.commingFromDesktop ? nothing
            : html`
            <div class="buttons${mobile ? '-mobile' : ''}">
                ${mobile
                    ? nothing
                    : this.editting
                        ? html`
                            <b-icon title="Bland billeder" @click=${this.shuffle} icon="shuffle"></b-icon>
                            <b-icon title="Ny tekstboks" @click=${this.newTextBox} icon="edit-text"></b-icon>
                            <b-icon title="Upload billede(r)" @file-change=${this.uploadImages} icon="file" file-input multiple accept="image/jpeg, image/png, image/jpg"></b-icon>
                            <b-icon title="Filer" @click=${this.openSiteVersions} .disabled=${!this.canOpenSiteVersions} icon="folder-tree"></b-icon>
                            <b-icon title="Undo" @click=${this.undo} .disabled=${saving || !this.canUndo} icon="undo"></b-icon>
                            <b-icon title="Redo" @click=${this.redo} .disabled=${saving || !this.canRedo} icon="redo"></b-icon>
                            <b-icon title="Gem" @click=${gem} .disabled=${saving || !this.canSave} icon="save"></b-icon>
                            <b-icon title="Kaser ændringer" @click=${this.stopEditting} icon="close"></b-icon>
                        `
                        : html`<b-icon title="Rediger" @click=${startEditting} icon="admin"></b-icon>`
                }
                ${this.mobile
                    ? html`
                        <b-icon title="Mobil" @click=${this.toggleMobile} icon="mobile"></b-icon>
                    `
                    : html`
                        <b-icon title="Desktop" @click=${this.toggleMobile} icon="desktop"></b-icon>

                    `}
            </div>
        `
    }
}