import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import MediumEditor from 'medium-editor';
import mediumEditorColorButtons from 'medium-editor-colorpicker-buttons';

const mediumEditorColorButtonsGetted = mediumEditorColorButtons.get(MediumEditor);

let mediumEditor: MediumEditor.MediumEditor | undefined = undefined;

export function get_editor_text() {
    return mediumEditor?.getContent();
}

const editor_div = document.getElementById('editor')!;

setTimeout(() => {
    mediumEditor = new MediumEditor(editor_div, {
        placeholder: { text: '' },
        spellcheck: true,
        buttonLabels: 'fontawesome',
        toolbar: {
            /* These are the default options for the toolbar,
               if nothing is passed this is what is used */
            allowMultiParagraphSelection: true,
            buttons: ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull', 'bold', 'italic', 'underline', 'anchor', 'h1', 'h2', 'h3', 'unorderedlist', 'orderedlist', 'textcolor'],
            diffLeft: 0,
            diffTop: -10,
            firstButtonClass: 'medium-editor-button-first',
            lastButtonClass: 'medium-editor-button-last',
            relativeContainer: undefined,
            standardizeSelectionStart: false,
            static: false,
            /* options which only apply when static is true */
            align: 'center',
            sticky: false,
            updateOnEmptySelection: false
        },
        extensions: {
            textcolor: new mediumEditorColorButtonsGetted.TextColorButtonClass(/* options? */)
        }
    });
}, 0);

let current: BtextEditor | undefined;

function _close_current(newCurrent?: BtextEditor) {
    current?.close();
    current = newCurrent;
}

@customElement('b-text-editor')
export class BtextEditor extends LitElement {

    constructor() {
        super();
        _close_current(this);
    }

    close() {
        this.dispatchEvent(new CustomEvent('close-me'));

        document.body.appendChild(editor_div);
        editor_div.style.display = 'none';
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
        const r = this.parentElement!.getBoundingClientRect();
        const body_rect = document.body.getBoundingClientRect();
        editor_div.style.display = 'block'

        if (this.new_parent != null) {
            editor_div.style.inset = '0'
            editor_div.style.width = `unset`;
            editor_div.style.height = `unset`;
            this.new_parent().appendChild(editor_div);
        }
        else {
            editor_div.style.top = `${r.y - body_rect.y}px`;
            editor_div.style.left = `${r.x - body_rect.x}px`;
            editor_div.style.width = `${r.width}px`;
            editor_div.style.height = `${r.height}px`;
            document.body.appendChild(editor_div);
        }

        editor_div.style.zIndex = `${this.z_index ?? 99}`;
        editor_div.style.color = this.default_color ?? 'black';

        mediumEditor?.setContent(this.html === '' || this.html == null ? '<p>Skriv tekst her<p>' : this.html)
        super.connectedCallback();
    }

    disconnectedCallback(): void {
        if (current == this) {
            editor_div.style.display = 'none'
            current = undefined;
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
            .wrapper {
                height: 500px;
            }
        `;
    }
}