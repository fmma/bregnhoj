
import './components/App';
import type { Bapp } from './components/App';
import './components/Sites';

const params =new URLSearchParams(window.location.search)
const siteFromParams = params.get('site');

const siteNameFromHtml = document.getElementById('thescript')?.getAttribute('data-site'); 
const app: Bapp = document.createElement('b-app') as Bapp;
const site = siteFromParams ?? siteNameFromHtml ?? "bregnhoj";

app.siteRoot = site;
app.dev = true;
document.body.appendChild(app)