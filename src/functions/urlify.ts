import type { Page } from "../types";

export function urlify(pages: Page[], title: string, subtitle?: string) {
    if (subtitle == null)
        return url_encode(title)
    else {
        const urlified = url_encode(subtitle);
        if (pages.some(p => p.title !== title && p.subPages.some(sp => url_encode(sp.title) === urlified)))
            return url_encode(title) + urlified;

        return urlified;
    }
}

export function url_encode(title: string) {
    return title
        .replaceAll('æ', 'a')
        .replaceAll('ø', 'o')
        .replaceAll('å', 'a')
        .replaceAll('&', 'og')
        .replaceAll('&', 'og')
        .replaceAll(' ', '')
        .toLowerCase();
}
