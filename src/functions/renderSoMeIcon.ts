import { html } from "lit";
import { SoMeLink } from "../components/Types";

export function renderSoMeIcon(soMe: SoMeLink) {
    const url = soMeUrl(soMe)
    return html`
        <a href="${url}" class="fa-brands fa-${soMe.name}"></a>
    `;
}

function soMeUrl(soMe: SoMeLink) {
    switch(soMe.name) {
        case "instagram": return `http://instagram.com/_u/${soMe.user}/`
        default: throw new Error(`SoMe URL not implemented ${soMe.name}`);
    }
}
