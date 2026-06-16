import type { Translations } from './types';

export const en: Translations = {
  photoAlt: 'Photo of Victor Eriksson',
  role: 'FRONTEND DEVELOPER',
  summary:
    'I am passionate about frontend because it allows me to express my ' +
    'creativity and my love for problem-solving. I have worked with ' +
    'frontend during an internship, and my drive for programming has also ' +
    'led me to complete several personal projects alongside my studies. ' +
    'From my 12 years in the TV industry, I have learned to work in agile ' +
    'teams, under strict deadlines, to meet clients needs and visions. Now ' +
    'I want to take on new challenges in programming, benefiting from my ' +
    'experience and passion.',
  companyLabel: 'Company',
  headings: {
    contact: 'CONTACT DETAILS',
    educationSide: 'EDUCATION',
    hardSkills: 'HARD SKILLS',
    softSkills: 'SOFT SKILLS',
    workExperience: 'WORK EXPERIENCE',
    languagesAndFrameworks: 'LANGUAGES AND FRAMEWORKS',
    tools: 'TOOLS',
    education: 'EDUCATION',
  },
  contacts: {
    telephone: 'TELEPHONE',
    telephoneValue: '+1 (650) 602-8753',
    email: 'EMAIL',
    github: 'GITHUB',
    linkedin: 'LINKEDIN',
    address: 'ADDRESS',
    addressValue: 'Palo Alto, California',
    authorizedToWork: 'AUTHORIZED TO WORK IN THE US',
  },
  experiences: [
    {
      title: '6-month internship – Triggerbee',
      bullets: [
        'On-site marketing and gamification',
        'Collaborated in agile teams using Scrum',
        'Solved hundreds of bugs',
        'Worked with React and Angular projects',
        'Independently responsible for larger projects',
      ],
    },
    {
      title: "12 years on several of Sweden's largest TV shows",
      bullets: [
        'Led an agile team of > 10 people',
        'High pressure and fast paced environment',
        'Mentored and trained assistants',
        'Graphic design',
      ],
    },
  ],
  edu: {
    detailTitle1: 'Frontend Development - Nackademin Technical College (Sweden)',
    detailText:
      'Education involved: JavaScript, TypeScript, JSON, DOM manipulation, OOP, HTML5, CSS3, ' +
      'SASS, CSS Grid, Flexbox, Bootstrap, Tailwind, CSS Modules, React, Angular, Node.js, ' +
      'Material UI, Angular Material, Vite, NPM, GIT, ESLint, Prettier, Figma, Responsiveness, ' +
      'Accessibility (WCAG 2.2 AA, ARIA), APIs, Axios, Authentication, Supabase, CMS (Strapi), ' +
      'and Testing (Vitest, Playwright).',
    udemy: {
      title: 'Angular course – Udemy',
      before: 'Completed the 55.5-hour Udemy course',
      linkText: 'Angular – The Complete Guide',
      after: 'in my free time, gaining a deeper understanding of Angular and its core concepts.',
    },
  },
  project: {
    heading: 'SUMMER PROJECT - ALARM SYSTEM',
    intro: 'Worked in a team of motivated students from various programs between semesters.',
    bulletsTitle: 'Project involved:',
    bullets: [
      'Developing a functional alarm system',
      'A frontend for login, managing user access, and alarm activation/deactivation',
      'Connecting the system to a database and integrating it with a physically built alarm',
    ],
  },
  aria: {
    scrollLangsLeft: 'Scroll languages left',
    scrollLangsRight: 'Scroll languages right',
    scrollToolsLeft: 'Scroll tools left',
    scrollToolsRight: 'Scroll tools right',
    copyTemplate: 'Copy {label} to clipboard',
    profileTemplate: '{label} profile (opens in a new tab)',
    langToggle: 'Language',
  },
};
