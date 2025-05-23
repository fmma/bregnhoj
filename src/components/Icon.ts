import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement('b-icon')
export class Bicon extends LitElement {

    renderRoot = this;

    @property({ type: String })
    icon?: 'left' | 'right' | 'delete' | 'edit' | 'add' | 'menu' | 'file' | 'edit-caption'
        | 'edit-text' | 'close' | 'save' | 'admin' | 'mobile' | 'desktop'
        | 'undo' | 'redo' | 'folder-tree' | 'meteor' | 'shuffle' | 'grow' | 'code' | 'bulletList'
        | 'bold' | 'italic' | 'underline' | 'orderedList' | 'blockquote' | 'horizontalRule' | 'hardBreak' | 'paragraph';

    @property({ type: Boolean, attribute: 'file-input' })
    file_input = false;

    @property({ type: String })
    accept = '';

    @property({ type: Boolean })
    multiple = false;

    @property({ type: Boolean })
    disabled = false;

    @property({ type: Boolean })
    is_active = false;

    private _get_icon_class() {
        switch (this.icon) {
            case 'delete': return 'fa-solid fa-trash';
            case 'edit': return 'fa-solid fa-edit';
            case 'edit-caption': return 'fa-solid fa-comment-dots';
            case 'edit-text': return 'fa-solid fa-font';
            case 'add': return 'fa-solid fa-plus';
            case 'menu': return '';
            case 'file': return 'fa-solid fa-image';
            case 'close': return 'fa-solid fa-xmark';
            case 'save': return 'fa-solid fa-floppy-disk';
            case 'admin': return 'fa-solid fa-screwdriver-wrench';
            case 'mobile': return 'fa-solid fa-mobile';
            case 'desktop': return 'fa-solid fa-desktop';
            case 'undo': return 'fa-solid fa-undo';
            case 'redo': return 'fa-solid fa-redo';
            case 'folder-tree': return 'fa-solid fa-folder-tree';
            case 'meteor': return 'fa-solid fa-meteor';
            case 'shuffle': return 'fa-solid fa-shuffle';
            case 'left': return 'fa-solid fa-arrow-left';
            case 'right': return 'fa-solid fa-arrow-right';
            case 'grow': return 'fa-solid fa-arrows-up-down-left-right';
            case 'code': return 'fa-solid fa-code';
            case 'bulletList': return 'fa-solid fa-list';
            case 'bold': return 'fa-solid fa-bold';
            case 'italic': return 'fa-solid fa-italic';
            case 'orderedList': return 'fa-solid fa-list-ol';
            case 'blockquote': return 'fa-solid fa-quote-left';
            case 'horizontalRule': return 'fa-solid fa-minus';
            case 'hardBreak': return 'fa-solid fa-arrow-right';
            case 'paragraph': return 'fa-solid fa-paragraph'; 
            default: return '';
        }
    }

    private _get_icon_text() {
        switch (this.icon) {
            case 'menu': return '☰';
            default: return '';
        }
    }

    private _file_change = (e: Event) => {
        const file_input = e.composedPath()[0] as HTMLInputElement;
        this.dispatchEvent(new CustomEvent('file-change', { detail: [...file_input.files ?? []] }));
    }

    render() {
        if (this.file_input)
            return html`
            <label class="icon ${this.disabled ? '' : 'cursor-pointer'}">
                <span class="icon-label ${this._get_icon_class()}">${this._get_icon_text()}</span>
                <input class="icon-input" type="file" accept=${this.accept} ?multiple=${this.multiple} @change=${this._file_change}>
            </label>
            `
        return html`<button ?disabled=${this.disabled} class="icon ${this.is_active ? "icon-active" : ""} icon-label ${this._get_icon_class()} ${this.disabled ? '' : 'cursor-pointer'}">${this._get_icon_text()}</button>`;
    }
}
