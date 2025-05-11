import { html } from "lit";
import { SoMeLink } from "../components/Types";

export function renderSoMeIcon(soMe: SoMeLink) {
    return html`
        <a href="${soMe.url}" class="fa-brands fa-${soMe.name}"></a>
    `;
}
