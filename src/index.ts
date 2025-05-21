
import './components/App';
import './components/TextEditorControls'
import type { Bapp } from './components/App';

let site = "snesltest";

switch (import.meta.env.BASE_URL as string) {
    case 'https://bregnhoj.com':
        site = 'bregnhoj';
        break;
    case 'https://meisnermadsen.dk':
        site = 'lisogkarsten';
        break;
    case 'https://snesl.dk/bregnhoj':
        site = 'snesltest';
        break;
}

const app: Bapp = document.createElement('b-app') as Bapp;


app.site_root = site;
document.body.appendChild(app);
