import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import type { BtextEditorControls } from './components/TextEditorControls';
import type { BtextEditor } from './components/TextEditor';

export const editor_div = document.getElementById('editor')!;
export const editor_controls = document.getElementsByTagName('b-text-editor-controls')![0] as BtextEditorControls;

export let current: {current: BtextEditor | undefined} = { current: undefined };

if (editor_div == null || editor_controls == null) {
    throw new Error('Editor div or controls not found');
}

export let tiptap_editor: Editor | undefined = undefined;

export const create_or_recreate_tiptap = (content: any) => {
    if(tiptap_editor != null) {
        tiptap_editor.destroy();
        tiptap_editor = undefined;
    }
    tiptap_editor = new Editor({
        element: editor_div!,
        extensions: [StarterKit],
        content,
    });

    tiptap_editor.on('update', () => {
        console.log('Editor updated');
    });
    tiptap_editor.on('selectionUpdate', () => {
        console.log('Selection updated');
        editor_controls.requestUpdate();
    });
    tiptap_editor.on('blur', () => {
        console.log('Editor blurred');
        // current.current?.close();
    });
};


export function get_editor_text() {
    return tiptap_editor?.getHTML();
}