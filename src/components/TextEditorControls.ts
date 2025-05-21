import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { current, tiptap_editor } from "../global_text_editor";

type Level = 1 | 2 | 3 | 4 | 5 | 6;

@customElement('b-text-editor-controls')
export class BtextEditorControls extends LitElement {

    renderRoot: HTMLElement | DocumentFragment = this;

    render() {
        const editor = tiptap_editor;
        if (editor == null) {
            return html`<div>Loading...</div>`;
        }

        const but = [
            ['bold', 'toggleBold'],
            ['italic', 'toggleItalic'],
            ['bulletList', 'toggleBulletList'],
            ['orderedList', 'toggleOrderedList'],
            ['blockquote', 'toggleBlockquote'],
            ['horizontalRule', 'setHorizontalRule'],
            ['hardBreak', 'setHardBreak'],
            ['undo', 'undo'],
            ['redo', 'redo'],
        ] as const;
        const editor_buttons = but.map(([name, command]) => {
            const disabled = !(editor.can().chain().focus())[command]().run();
            const active = editor.isActive(name);
            const click = (e: MouseEvent) => {
                editor.chain().focus()[command]().run();
                this.requestUpdate();
                console.log('Clicked', name, command);
            };
            return html`
            <b-icon icon=${name} @click=${click} .disabled=${disabled} .is_active=${active}></b-icon>
            `;
        });

        const selection = editor.isActive('paragraph')
            ? 'p'
            : editor.isActive('heading')
                ? "h" + editor.getAttributes('heading').level
                : 'p';

        return html`<div class="editor-buttons">
            ${editor_buttons}
            <select @change=${(e: Event) => {
                const target = e.target as HTMLSelectElement;
                const value = target.value;
                if (value === 'p') {
                    editor.chain().focus().setParagraph().run();
                } else if (value.startsWith('h')) {
                    const level = parseInt(value.substring(1), 10) as Level;
                    editor.chain().focus().toggleHeading({ level }).run();
                }
            }}
            .value="${selection}"
            >
                <option value="p">Paragraph</option>
                <option value="h1">Overskrift 1</option>
                <option value="h2">Overskrift 2</option>
                <option value="h3">Overskrift 3</option>
            </select>
            <b-icon icon="close" @click=${() => current.current?.close()}></b-icon>
        </div>`;
    }
}