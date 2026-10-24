import { mount } from 'svelte';
import App from './ui/App.svelte';
import './ui/theme.css';

const target = document.getElementById('app');
if (!target) throw new Error('Mount point #app missing in index.html');

mount(App, { target });
