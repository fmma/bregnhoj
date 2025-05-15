import { css, html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { overlaps } from "../functions/overlaps";
import type { Btile } from "./Tile";
import type { Pos } from "../types";

@customElement('b-area-select')
export class BareaSelect extends LitElement {

    connectedCallback(): void {
        super.connectedCallback();
        document.addEventListener('mousedown', this.mousedown);
        document.addEventListener('mousemove', this.mousemove);
        document.addEventListener('mouseup', this.mouseup);
    }
    disconnectedCallback(): void {
        document.removeEventListener('mousedown', this.mousedown);
        document.removeEventListener('mousemove', this.mousemove);
        document.removeEventListener('mouseup', this.mouseup);
        super.disconnectedCallback();
    }

    @property({ type: Boolean })
    imsDragging = false;

    @state()
    dragging: { anchor: Pos } | undefined = undefined;

    @query('.selection')
    selectionDiv!: HTMLDivElement;

    mousedown = (e: MouseEvent) => {
        if (this.imsDragging)
            return;

        document.body.style.userSelect = 'none';
        const x = e.clientX;
        const y = e.clientY;
        this.dragging = { anchor: { x, y } };
        const style = this.selectionDiv.style!;
        style.left = `${x}px`;
        style.top = `${y}px`;
        style.width = `${0}px`;
        style.height = `${0}px`;
    }

    mousemove = (e: MouseEvent) => {
        if (!this.dragging)
            return;
        const x1 = this.dragging.anchor.x;
        const y1 = this.dragging.anchor.y;
        const x2 = e.clientX;
        const y2 = e.clientY;
        const w = x2 - x1;
        const h = y2 - y1;

        const { dragging } = this;
        const style = this.selectionDiv.style!;
        if (w >= 0) {
            style.width = `${w}px`;
        }
        else {
            style.width = `${-w}px`;
            style.left = `${dragging.anchor.x + w}px`;
        }

        if (h >= 0) {
            style.height = `${h}px`;
        }
        else {
            style.height = `${-h}px`;
            style.top = `${dragging.anchor.y + h}px`;
        }
    }

    mouseup = (e: MouseEvent) => {
        if(this.dragging == null)
            return;
        document.body.style.userSelect = 'unset';
        const x1 = this.dragging.anchor.x;
        const y1 = this.dragging.anchor.y;
        const x2 = e.clientX;
        const y2 = e.clientY;

        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const w = Math.abs(x1 - x2);
        const h = Math.abs(y1 - y2);

        document.querySelectorAll('b-tile').forEach((elt: Element) => {
            const btile = elt as Btile;
            if(btile.rect && overlaps(btile.rect, {x,y,w,h}))
                btile.activate(true);
        })

        this.dragging = undefined;
    }

    render() {
        const { dragging } = this;
        return html`
            <div class="selection ${dragging == null ? 'hidden' : ''}"></div>
        `
    }

    static get styles() {
        return css`
            .selection {
                outline: 1px black dotted;
                position: absolute;
                z-index: 10000000000;
            }
            .hidden {
                display: none;
            }
        `
    }
}
