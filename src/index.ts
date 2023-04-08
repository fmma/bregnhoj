
import './components/App';
import type { Bapp } from './components/App';
import './components/Sites';

const params =new URLSearchParams(window.location.search)
const site = params.get('site');


const app: Bapp = document.createElement('b-app') as Bapp;
app.siteRoot = site ?? "bregnhoj";
app.dev = true;
document.body.appendChild(app)