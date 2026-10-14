/**
 * All personal content lives here. Edit this file — not the components.
 * Details below come from Adarsh's resume (server/private/resume.pdf) and the
 * GitHub repositories he provided.
 */
export const site = {
  logo: 'ADARSH',
  fullName: 'Adarsh Giri', // shown in the hero, resume, footer, page titles
  firstName: 'Adarsh',
  headline: 'Data Science · Data Analytics · Machine Learning · AI',
  location: 'Bengaluru, Karnataka, India',
  availability: 'Open to: Full-Time · Remote · Relocation',
  year: 2026,
  nav: [
    { id: 'home', label: 'Home' },
    { id: 'projects', label: 'Projects' },
    { id: 'skills', label: 'Skills' },
    { id: 'education', label: 'Education' },
    { id: 'about', label: 'About' },
    { id: 'resume', label: 'Resume', href: '/resume/' },
    { id: 'contact', label: 'Contact' },
  ],
  // Where the browser sends form submissions. Leave '' when the API is served
  // from the same origin (npm start / Vite dev proxy). Set VITE_API_BASE at build
  // time if the API lives on another domain.
  apiBase: import.meta.env?.VITE_API_BASE || '',
  links: {
    email: 'ag1425562@gmail.com',
    github: 'https://github.com/adarsh8601',
    linkedin: 'https://www.linkedin.com/in/adarsh-giri-252b60293',
  },
  // Portrait photo (portrait orientation works best; cropped to the frame with CSS object-position).
  portrait: '/assets/images/portrait.jpg',
  portraitAlt: 'Adarsh Giri',
};

export const hero = {
  greeting: "Hey, I'm",
  intro:
    'I turn raw, complex data into clear insights and reliable machine-learning models — from exploratory analysis and dashboards to predictive and deep-learning solutions.',
  primaryCta: { label: 'View Projects', href: '#projects' },
  secondaryCta: { label: 'Get in Touch', href: '#contact' },
  sticker: 'Open to full-time & remote roles!',
  burst: 'AI',
};

export const network = {
  label: 'Under the hood',
  title: ['Layers, nodes and connections —', 'the shapes I work with every day.'],
  caption: 'Drag to rotate',
};

export const projects = {
  label: 'Featured projects',
  title: "Things I've built and learned from",
  moreLabel: 'More on GitHub',
  // `summary` is shown on the online resume; leave it empty rather than inventing results.
  items: [
    {
      title: 'DevMelDex — Privacy-First Developer Tools',
      tag: 'Live Web App',
      color: 'purple',
      image: '/assets/projects/devmeldex.svg',
      href: 'https://devmeldex.com',
      tape: { color: 'cyan', side: 'left' },
      badge: 'LIVE',
      featured: true,
      stack: 'Next.js, Vercel',
      date: 'Live',
      summary:
        'A free suite of 10 browser-based developer tools — Diff Checker, JSON/CSV Formatter, Regex Tester, QR Generator, Image Resizer, UTM Builder, OG Previewer and more. Tools run in the browser, so data stays on the user\'s device — no sign-up, no tracking cookies.',
    },
    {
      title: 'Fashion-MNIST Image Classification using ANN',
      tag: 'Deep Learning',
      color: 'purple',
      image: '/assets/projects/fashion-mnist.svg',
      href: 'https://github.com/adarsh8601', // repo link not provided yet — points to GitHub profile
      tape: { color: 'purple', side: 'left' },
      stack: 'Python, Keras, TensorFlow, NumPy',
      date: 'Feb 2026',
      summary: 'ANN on Fashion-MNIST (70,000 images, 10 classes) with Batch Normalization, Dropout and Early Stopping; evaluated with accuracy and confusion-matrix analysis.',
    },
    {
      title: 'Netflix Movie Recommendation System',
      tag: 'Recommender System',
      color: 'red',
      image: '/assets/projects/netflix-recommender.svg',
      href: 'https://github.com/adarsh8601', // repo link not provided yet — points to GitHub profile
      tape: { color: 'red', side: 'right' },
      stack: 'Python, Scikit-Surprise, SVD',
      date: 'Jan 2026',
      summary: 'Collaborative filtering (SVD) on 500,000+ user-movie ratings — RMSE ≈ 0.9 and MAE ≈ 0.7 with 5-fold cross-validation, plus top-10 personalised recommendations.',
    },
    {
      title: 'Credit Score Classification — Financial Risk ML Pipeline',
      tag: 'Financial Risk ML',
      color: 'cyan',
      image: '/assets/projects/credit-score.svg',
      href: 'https://github.com/adarsh8601/Credit-Score-Project',
      tape: { color: 'cyan', side: 'left' },
      stack: 'Python, Random Forest, SMOTE',
      date: 'Dec 2025',
      summary: 'End-to-end pipeline classifying credit scores into 3 classes; SMOTE for class imbalance and a GridSearchCV-tuned Random Forest (56%+ accuracy) with feature-importance analysis.',
    },
    {
      title: 'Breast Cancer Detection using ANN',
      tag: 'Healthcare ML',
      color: 'red',
      image: '/assets/projects/breast-cancer.svg',
      href: 'https://github.com/adarsh8601/Breast-Cancer-Detection-using-ANN',
      tape: { color: 'yellow', side: 'right' },
      stack: 'Python, ANN',
      summary: '', // add a verified one-line result
    },
    {
      title: 'Trader Behavior vs Market Sentiment Analysis',
      tag: 'Data Analysis',
      color: 'purple',
      image: '/assets/projects/trader-sentiment.svg',
      href: 'https://github.com/adarsh8601/trader-behavior-market-sentiment',
      tape: { color: 'green', side: 'left' },
      stack: 'Python',
      summary: '', // add a verified one-line result
    },
    {
      title: 'Restaurant Revenue Prediction',
      tag: 'Regression',
      color: 'cyan',
      image: '/assets/projects/restaurant-revenue.svg',
      href: 'https://github.com/adarsh8601/Restaurant-Revenue-Predication',
      tape: { color: 'red', side: 'right' },
      stack: 'Python, Ridge Regression, PCA, K-Means',
      summary: 'Revenue regression with VIF/RFE feature selection, PCA and K-Means store clustering; best model Ridge Regression (R² ≈ 0.86).',
    },
  ],
};

export const skills = {
  label: 'Toolkit',
  title: 'Tools & methods I work with',
  groups: [
    { name: 'Languages', icon: 'code', color: 'purple', items: ['Python', 'SQL', 'Bash (basic)'] },
    { name: 'Machine Learning', icon: 'flask', color: 'red', items: ['Scikit-learn', 'XGBoost', 'LightGBM', 'Random Forest', 'SVM', 'KNN', 'Linear, Logistic & Ridge Regression', 'Gradient Boosting', 'K-Means Clustering', 'GridSearchCV'] },
    { name: 'Deep Learning', icon: 'brain', color: 'cyan', items: ['TensorFlow', 'Keras', 'ANN', 'CNN', 'RNN', 'LSTM', 'GRU', 'Transfer Learning', 'Dropout', 'Batch Normalization', 'Early Stopping'] },
    { name: 'NLP', icon: 'chat', color: 'yellow', items: ['Word2Vec', 'TF-IDF', 'Tokenization', 'Lemmatization', 'Sentiment Analysis', 'Text Classification'] },
    { name: 'Data Analytics', icon: 'sigma', color: 'green', items: ['Pandas', 'NumPy', 'SciPy', 'EDA', 'Feature Engineering', 'Feature Selection (VIF, RFE)', 'PCA', 'SMOTE', 'Statistical Modelling'] },
    { name: 'Data Visualization', icon: 'chart', color: 'purple', items: ['Matplotlib', 'Seaborn', 'Power BI', 'Tableau'] },
    { name: 'MLOps, Cloud & Web', icon: 'cloud', color: 'red', items: ['Microsoft Azure (AZ-900)', 'REST API deployment', 'Model versioning', 'Git', 'GitHub', 'Next.js', 'Vercel'] },
    { name: 'Core Concepts', icon: 'nodes', color: 'cyan', items: ['A/B Testing', 'Hypothesis Testing', 'Cross-Validation', 'Bias-Variance Trade-off', 'Class Imbalance', 'Recommender Systems (SVD)', 'AUC-ROC', 'F1', 'RMSE', 'MAE', 'R²'] },
  ],
};

export const education = {
  label: 'Education',
  title: "Where I've been learning",
  items: [
    {
      dates: 'Jul 2025 – Aug 2026',
      degree: 'Executive Post Graduate — Artificial Intelligence & Data Science',
      school: 'iHub DivyaSampark, IIT Roorkee (via Intellipaat)',
      place: 'Roorkee, India',
      color: 'green',
      tape: { color: 'green', side: 'left' },
    },
    {
      dates: 'Jul 2025 – Jul 2027',
      degree: 'Master of Computer Applications (MCA) — Computer Science',
      school: 'Indira Gandhi National Open University (IGNOU)',
      place: 'Delhi, India',
      color: 'purple',
      tape: { color: 'purple', side: 'right' },
    },
    {
      dates: 'Aug 2022 – Aug 2025',
      degree: 'Bachelor of Computer Applications (BCA)',
      school: 'CCS University',
      place: 'Meerut, Uttar Pradesh, India',
      color: 'red',
      tape: { color: 'red', side: 'left' },
    },
  ],
  certTitle: 'Certifications',
  certs: [
    {
      name: 'Executive Post Graduate — AI & Data Science',
      meta: 'iHub DivyaSampark, IIT Roorkee via Intellipaat · Jul 2025 – Aug 2026',
      // VERIFY: this link's ID (1241896) doesn't match a course ID on the resume — confirm it is this certificate.
      url: 'https://lms.intellipaat.com/certificate-link/?Yz0xMjQxODk2JnU9MzM1MTkyJmV4dD0x',
    },
    {
      name: 'Python Certification Course',
      meta: 'Intellipaat · Sep 2025 · ID 31679-912380-335192',
      url: 'https://lms.intellipaat.com/certificate-link/?Yz1jdXMtOTEyMzgwJnU9MzM1MTkyJmV4dD0x',
    },
    {
      name: 'SQL Course',
      meta: 'Intellipaat · Jun 2025 · ID 31679-913167-335192',
      url: 'https://lms.intellipaat.com/certificate-link/?Yz1jdXMtOTEzMTY3JnU9MzM1MTkyJmV4dD0x',
    },
  ],
};

export const about = {
  label: 'About me',
  title: "Hi, I'm Adarsh — I teach machines to learn from data.",
  body:
    "I'm a Data Science trainee in the Executive Post Graduate programme in AI & Data Science at iHub DivyaSampark, IIT Roorkee, while pursuing my MCA at IGNOU. I build predictive models, deep-learning architectures and NLP systems end to end — cleaning messy real-world data, engineering features, validating rigorously and turning results into clear, decision-ready insights. I also build and ship web products, such as DevMelDex, a privacy-first suite of free browser-based developer tools. Based in Bengaluru, I'm currently deepening my MLOps and deployment skills on Microsoft Azure, and I'm open to full-time, remote and relocation opportunities.",
  stats: [
    { value: '5', label: 'End-to-end ML/DS projects' },
    { value: '500K+', label: 'Ratings processed' },
  ],
  highlight: { value: 'IIT Roorkee', label: 'Executive PG programme' },
  cta: { label: 'More About Me', href: '/resume/' },
  sticker: "That's me",
};

export const contact = {
  label: "Let's talk",
  title: ['Hiring for data or ML?', "Let's talk."],
  secondary: { label: 'GitHub' },
  formTitle: 'Or send a message',
  formIntro: 'Messages go straight to my inbox. I usually reply within two working days.',
  success: "Thanks — your message is on its way. I'll get back to you at the email you provided.",
};

/**
 * Resume page. Only verified information belongs here — sections with an empty
 * list are hidden automatically (e.g. add work experience when you have it).
 */
export const resume = {
  title: 'Resume',
  intro: 'Two ways to see my resume: read the online version below (printable), or request the original PDF.',
  summary:
    'Data Science trainee with rigorous academic grounding in AI & Machine Learning from IIT Roorkee, skilled in building predictive models, deep learning architectures (ANN, CNN, RNN, LSTM, GRU) and NLP systems with measurable performance outcomes. Proficient in transforming raw, noisy datasets into actionable insights through statistical analysis, feature engineering and interactive dashboards (Power BI, Tableau). Developing proficiency in MLOps and model deployment on Microsoft Azure.',
  experience: [], // e.g. { role, org, dates, place, points: ['…'] }
  achievements: [
    'Selected for the competitive IIT Roorkee Executive PG in AI & Data Science covering advanced ML, Deep Learning, NLP, MLOps and cloud deployment.',
    'Delivered 5 end-to-end ML/DS projects (recommendation systems, financial risk modelling, computer vision, regression, EDA) with open-source repositories on GitHub.',
    'Built and launched DevMelDex (devmeldex.com), a live suite of 10 free, privacy-first browser-based developer tools.',
    'Processed and modelled datasets ranging from 10K to 500K+ records, working comfortably with real-world data at meaningful scale.',
  ],
  // Original PDF: the file is NOT in /public. It lives on the server
  // (default server/private/resume.pdf, override with RESUME_PDF_PATH) and is only
  // released through an approved, expiring download link.
  pdf: {
    label: 'Original PDF resume',
    linkValidHours: 48, // shown to visitors — keep in sync with DOWNLOAD_LINK_TTL_HOURS on the server
    blurb: 'The PDF is shared on request. Tell me a little about why you need it — once I approve, you get a private download link by email.',
  },
};
