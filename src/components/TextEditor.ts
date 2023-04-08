import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

const textDiv = document.getElementById('editor')!;

import MediumEditor from 'medium-editor';

import mediumEditorColorButtons from 'medium-editor-colorpicker-buttons';
const mediumEditorColorButtonsGetted = mediumEditorColorButtons.get(MediumEditor);



let mediumEditor: MediumEditor.MediumEditor | undefined = undefined;


export function getText() {
    return mediumEditor?.getContent();
}

setTimeout(() => {
    mediumEditor = new MediumEditor(textDiv, {
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
    /*
    mediumEditor.subscribe('editableBlur', (e: Event) => {
        const selection = mediumEditor?.exportSelection();
        if(selection != null && selection.end - selection.start === 0)
            closeCurrent();
    });
    */
}, 0);

let current: BtextEditor | undefined;

function closeCurrent(newCurrent?: BtextEditor) {
    current?.close();
    current = newCurrent;
}

@customElement('b-text-editor')
export class BtextEditor extends LitElement {

    constructor() {
        super();
        closeCurrent(this);
    }

    close () {
        this.dispatchEvent(new CustomEvent('close-me'));

        document.body.appendChild(textDiv);
        textDiv.style.display = 'none';
    }

    @property({type: String})
    html: string = "";

    @property({type: Number})
    zIndex?: number;

    @property({type: String})
    defaultColor?: string;

    @property({type: Function})
    newParent?: () => HTMLElement;

    render() {
        return html`<div></div>`;
    }

    connectedCallback(): void {

        const r = this.parentElement!.getBoundingClientRect();
        const bodyRect = document.body.getBoundingClientRect();

        textDiv.style.display = 'block'

        if(this.newParent != null) {
            textDiv.style.inset = '0'
            textDiv.style.width = `unset`;
            textDiv.style.height = `unset`;
            this.newParent().appendChild(textDiv);
        }
        else {
            textDiv.style.top = `${r.y - bodyRect.y}px`;
            textDiv.style.left = `${r.x - bodyRect.x}px`;
            textDiv.style.width = `${r.width}px`;
            textDiv.style.height = `${r.height}px`;
            document.body.appendChild(textDiv);
        }

        textDiv.style.zIndex = `${this.zIndex ?? 99}`;
        textDiv.style.color = this.defaultColor ?? 'black';

        mediumEditor?.setContent(this.html === '' || this.html == null ? '<p>Skriv tekst her<p>' : this.html)
        super.connectedCallback();
    }

    disconnectedCallback(): void {
        if (current == this) {
            textDiv.style.display = 'none'
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