import { html } from "lit";
import { SoMeLink } from "../types";

export function render_so_me_icon(soMe: SoMeLink) {
    const url = so_me_url(soMe)
    return html`
        <a href="${url}" class="fa-brands fa-${soMe.name}"></a>
    `;
}

function so_me_url(soMe: SoMeLink) {
    switch(soMe.name) {
        case "instagram": return `https://instagram.com/_u/${soMe.user}/`
        case "facebook": return `https://facebook.com/${soMe.user}/`
        case "flickr": return `https://flickr.com/${soMe.user}/`
        case "pinterest": return `https://pinterest.com/${soMe.user}/`
        case "snapchat-ghost": return `https://snapchat.com/${soMe.user}/`
        case "tiktok": return `https://tiktok.com/${soMe.user}/`
        case "tumblr": return `https://tubmlr.com/${soMe.user}/`
        case "vimeo": return `https://vimeo.com/${soMe.user}/`
        case "x-twitter": return `https://x.com/${soMe.user}/`
        default: throw new Error(`SoMe URL not implemented ${soMe.name}`);
    }
}
