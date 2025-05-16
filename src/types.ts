
export interface Pos { x: number, y: number };
export interface Expanse { w: number, h: number };
export type Rect = Pos & Expanse;

export interface TextBlock {
    text: string;
}

export interface ImageMetadata {
    title: string;
    price: string;
    sizeW: string;
    sizeH: string;
    description: string;
    thumbUrl: string;
}

export interface Image {
    url: string;
    bigurl: string;
    isNew?: boolean;
    file?: File;
    compressedFile?: Blob;
    caption?: string;
    w: number;
    h: number;
    ogw: number;
    ogh: number;
}

export interface Tile {
    rect: Rect;
    image?: Image;
    textBlock?: TextBlock;
}

export interface SubPage {
    title: string;
    tiles: Tile[];
}

export interface SiteDatabaseObject {
    siteTitle: string;
    versions: SiteVersion[];
    publishedVersion: string;
    devVersion: string;
    imageMetadata?: Record<string, ImageMetadata>
    soMeLinks?: SoMeLink[]
}

export const SOCIAL_MEDIA_NAMES = [
    'facebook',
    'x-twitter',
    'instagram',
    'pinterest',
    'snapchat-ghost',
    'vimeo',
    'tumblr',
    'flickr',
    'tiktok',
] as const

export type SoMeName = (typeof SOCIAL_MEDIA_NAMES)[number];

export interface SoMeLink {
    name: SoMeName
    user: string
}

export interface Sites {
    sites: { name: string }[];
}

export interface SiteVersion {
    name: string;
    created: Date;
    modified: Date;
}

export interface Page {
    title: string;
    tiles: Tile[];
    subPages: SubPage[];
}

export type PageOrSubPage = SubPage | Page;

export type Viewport = {
    width: number;
    pixelRatio: number;
}
