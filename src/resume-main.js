import './styles/index.css';
import './styles/resume.css';

import { resume } from './data/content.js';
import { Header, initHeader } from './components/header.js';
import { Footer } from './components/contact.js';
import { ResumePage, initResumePage } from './components/resume.js';

const app = document.getElementById('app');
app.innerHTML = [Header({ page: 'resume' }), '<main id="main">', ResumePage(), '</main>', Footer()].join('');

initHeader(app, { spy: false });
initResumePage(app, { downloadTtlHours: resume.pdf.linkValidHours });
