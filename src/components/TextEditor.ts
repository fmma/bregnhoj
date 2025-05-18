import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

export function get_editor_text() {
    return '';
}

@customElement('b-text-editor')
export class BtextEditor extends LitElement {

    constructor() {
        super();
    }

    close() {
        this.dispatchEvent(new CustomEvent('close-me'));
    }

    @property({ type: String })
    html: string = "";

    @property({ type: Number })
    z_index?: number;

    @property({ type: String })
    default_color?: string;

    @property({ type: Function })
    new_parent?: () => HTMLElement;

    render() {
        return html`<div></div>`;
    }

    connectedCallback(): void {
        super.connectedCallback();
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
    }

    static get styles() {
        return css`
            div {
                width: 100%;
                height: 100%;
                outline: 1px solid black;
            }
            .wrapper {
                height: 500px;
            }
        `;
    }
}