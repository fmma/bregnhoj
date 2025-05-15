import type { Page } from "../types";

export function urlify(pages: Page[], title: string, subtitle?: string) {
    if(subtitle == null)
        return urlEncode(title)
    else {
        const urlified = urlEncode(subtitle);
        if(pages.some(p => p.title !== title && p.subPages.some(sp => urlEncode(sp.title) === urlified)))
            return urlEncode(title) + urlified;

        return urlified;
    }
}

export function urlEncode(title: string) {
    return title
        .replaceAll('æ', 'a')
        .replaceAll('ø', 'o')
        .replaceAll('å', 'a')
        .replaceAll('&', 'og')
        .replaceAll('&', 'og')
        .replaceAll(' ', '')
        .toLowerCase();
}