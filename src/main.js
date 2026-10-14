import './styles/index.css';

import { Header, initHeader } from './components/header.js';
import { Hero } from './components/hero.js';
import { Network, initNetwork } from './components/network.js';
import { Projects } from './components/projects.js';
import { Skills } from './components/skills.js';
import { Education } from './components/education.js';
import { About } from './components/about.js';
import { Contact, Footer, initContactForm, initCopyEmail } from './components/contact.js';
import { attachTilt, pauseOffscreen, revealOnScroll, typewriter } from './lib/motion.js';

document.documentElement.classList.add('js');

const app = document.getElementById('app');
app.innerHTML = [
  Header({ page: 'home' }),
  '<main id="main">',
  Hero(),
  Network(),
  Projects(),
  Skills(),
  Education(),
  About(),
  Contact(),
  '</main>',
  Footer(),
].join('');

initHeader(app);
initNetwork(app);
initContactForm(app);
initCopyEmail(app);
attachTilt(app.querySelector('[data-tilt="hero"]'), { maxTilt: 6, shift: 10 });
attachTilt(app.querySelector('[data-tilt="about"]'), { maxTilt: 4, shift: 6 });
pauseOffscreen([...app.querySelectorAll('.hero, .section--about')]);
typewriter(app.querySelector('[data-typewriter]'));
revealOnScroll(app.querySelectorAll('.reveal-up'));

// Honour deep links such as /#contact coming from the resume page.
if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
