import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { editor_controls, editor_div, tiptap_editor, current, create_or_recreate_tiptap } from "../global_text_editor";


function _close_current(newCurrent?: BtextEditor) {
    current.current?.close();
    current.current = newCurrent;
}

@customElement('b-text-editor')
export class BtextEditor extends LitElement {

    renderRoot: HTMLElement | DocumentFragment = this;

    constructor() {
        super();
        _close_current(this);
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
        create_or_recreate_tiptap(this.html === '' || this.html == null ? '<p>Skriv tekst her<p>' : this.html);
        const r = this.parentElement!.getBoundingClientRect();
        const body_rect = document.body.getBoundingClientRect();
        editor_div.style.display = 'block'

        editor_div.style.top = `${r.y - body_rect.y}px`;
        editor_div.style.left = `${r.x - body_rect.x}px`;
        editor_div.style.width = `${r.width}px`;
        editor_div.style.height = `${r.height}px`;
        editor_div.style.backgroundColor = 'white';

        editor_div.style.zIndex = `${this.z_index ?? 99}`;
        editor_div.style.color = this.default_color ?? 'black';
        editor_controls.requestUpdate();

        super.connectedCallback();
    }

    disconnectedCallback(): void {
        if (current.current == this) {
            editor_div.style.display = 'none'
            current.current = undefined;
        }
        super.disconnectedCallback();
    }

    static get styles() {
        return css`
            div {
                width: 100%;
                height: 100%;
                outline: 1px solid black;
            }
        `;
    }
}