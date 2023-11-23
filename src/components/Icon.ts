import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement('b-icon')
export class Bicon extends LitElement {

    renderRoot = this;

    @property({ type: String })
    icon?: 'left' | 'right' | 'delete' | 'edit' | 'add' | 'menu' | 'file' | 'edit-caption'| 'edit-text' | 'close' | 'save' | 'admin' | 'mobile' | 'desktop' | 'undo' | 'redo' | 'folder-tree' | 'meteor' | 'shuffle';

    @property({ type: Boolean, attribute: 'file-input' })
    fileInput = false;

    @property({type: String})
    accept = '';

    @property({type: Boolean})
    multiple = false;

    @property({type: Boolean})
    disabled = false;

    getIconClass() {
        const { icon } = this;
        switch (icon) {
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
            default: return '';
        }
    }

    getIconText() {
        const { icon } = this;
        switch (icon) {
            case 'menu': return '☰';
            default: return '';
        }
    }

    fileChange = (e: Event) => {
        const fileInput = e.composedPath()[0] as HTMLInputElement;
        this.dispatchEvent(new CustomEvent('file-change', {detail: [...fileInput.files ?? []]}));
    }

    render() {
        const { fileInput, accept, multiple, fileChange } = this;
        if (fileInput)
            return html`
            <label class="icon ${this.disabled ? '' : 'cursor-pointer'}">
                <span class="icon-label ${this.getIconClass()}">${this.getIconText()}</span>
                <input class="icon-input" type="file" accept=${accept} ?multiple=${multiple} @change=${fileChange}>
            </label>
            `
        return html`<button ?disabled=${this.disabled} class="icon ${this.getIconClass()} ${this.disabled ? '' : 'cursor-pointer'}">${this.getIconText()}</button>`;
    }
}
