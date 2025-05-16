
import './components/App';
import type { Bapp } from './components/App';

const params = new URLSearchParams(window.location.search)
const siteFromParams = params.get('site');

const siteNameFromHtml = document.getElementById('thescript')?.getAttribute('data-site');
const app: Bapp = document.createElement('b-app') as Bapp;
const site = siteFromParams ?? siteNameFromHtml ?? "bregnhoj";

app.site_root = site;
document.body.appendChild(app);
