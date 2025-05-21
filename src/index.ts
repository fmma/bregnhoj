
import './components/App';
import './components/TextEditorControls'
import type { Bapp } from './components/App';

let site = import.meta.env.VITE_SITE_ROOT ?? "snesltest";
const app: Bapp = document.createElement('b-app') as Bapp;
app.site_root = site;
document.body.appendChild(app);
