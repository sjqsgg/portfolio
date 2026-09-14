import { assetPath } from './assetPath.js'

// Only real work gets a row. Unverified URLs and outcomes remain absent.
export const projects = [
  {
    id: 'wikihowtutor', title: 'WikiHowTutor', type: 'Thesis project', category: 'AI-assisted learning platform', role: 'Full-stack development, study design & data analysis', year: '2026', status: 'Completed',
    summary: 'An AI-assisted learning platform investigating how text and comic tutorials affect cognitive load and learner experience. It brings tutorial materials, an LLM tutor and research data collection into one learning interface.',
    image: '/images/projects/wikihowtutor-poster.jpg', imageAlt: 'WikiHowTutor thesis poster presenting the study design, findings and limitations.',
    links: [{ label: 'Download research poster', href: '/documents/wikihowtutor-poster.pdf', download: true }],
    chapters: [
      { label: 'Demo', image: '/images/projects/wikihowtutor-demo.jpg', video: '/images/projects/wikihowtutor-demo.mp4', alt: 'WikiHowTutor demonstration showing tutorial materials and the AI tutor.', caption: 'A walkthrough of the learning platform and research study.' },
      { label: 'Research poster', image: '/images/projects/wikihowtutor-poster.jpg', alt: 'Research poster comparing text and comic tutorials in AI-assisted learning.', caption: 'Study design, findings and limitations from the thesis.', fullImage: '/images/projects/wikihowtutor-poster.jpg' },
    ],
    notes: [
      'For my bachelor’s thesis, I developed WikiHowTutor to investigate how learning material formats shape the human experience of AI-assisted tutoring. I independently developed the platform, designed the study and analysed the collected data.',
      'Built with Next.js, TypeScript and FastAPI, the platform combines tutorial reading with an LLM tutor. It guides participants through consent, surveys and two learning sessions, balancing tutorial assignments and presentation order across the study.',
      'I built Python scripts to screen WikiHow tutorials by length, structure and content domain, then prepared each selected tutorial in text or comic format. Difficulty scoring and pairing scripts helped organise 30 tutorials into 15 matched pairs, followed by individual review and formatting for the study.',
      'I implemented behavioural tracking and timed dual-task probes alongside quizzes and questionnaires. Session data is stored in Supabase and can be exported for analysis, connecting the learning interface with the research workflow.',
      'Using 15 paired text and comic tutorials, the study found significantly lower intrinsic and extraneous cognitive load with comic materials, with no significant difference in quiz performance. Real-time cognitive load detection remained exploratory because of limited dual-task data and small per-condition samples.',
    ],
  },
  {
    id: 'paperwise', title: 'Paperwise', type: 'Personal project', category: 'Academic research skill', role: 'AI workflow design & development', year: '2026', status: 'Completed & open source',
    summary: 'An AI-assisted workflow for discovering and reading academic papers. Paperwise pairs original text with annotations in your preferred language, helping you follow both the content and the argument.',
    image: '/images/projects/paperwise-demo.png', imageAlt: 'Paperwise annotated reading view with original paper text and accompanying explanations.',
    links: [{ label: 'GitHub', href: 'https://github.com/sjqsgg/Paperwise' }],
    chapters: [{ label: 'Annotated reading', image: '/images/projects/paperwise-demo.png', alt: 'Paperwise demonstration of original text and paragraph-level annotations in a side-by-side reading view.', caption: 'Original text and paragraph-level annotations, side by side.' }],
    notes: [
      'I created Paperwise while preparing my thesis. As a non-native English speaker, I found that reading academic papers can be slow, so I turned the prompts I regularly used into a reusable Claude Code skill.',
      'I connected paper discovery through OpenAlex and arXiv with a reading workflow that keeps original text beside paragraph-level explanations. The skill supports research-question-driven annotations and generates HTML pages with consistent layouts and colour-coded argument highlights.',
      'I defined rules for filtering and ranking search results, avoiding duplicate papers, caching daily digests and handling unavailable sources. Configurable research topics, languages and output paths allow the workflow to fit different projects, including scheduled digests linked from Obsidian daily notes.',
      'Paperwise has received 100+ GitHub stars, while my posts about the project on Xiaohongshu have received over 20,000 combined likes and saves.',
    ],
  },
  {
    id: 'shanxi-map', title: 'Shanxi Map', type: 'Personal project', category: 'Interactive map', role: 'Design & frontend development', year: '2026', status: 'Work in progress',
    summary: 'An interactive map connecting places in Shanxi with local stories, personal memory and cultural context.',
    image: '/images/projects/shanxi-study.png', imageAlt: 'Shanxi Map concept: a route connecting places, stories and memory.',
    chapters: [{ label: 'Map study', image: '/images/projects/shanxi-study.png', alt: 'Shanxi Map wireframe study with a route connecting locations.', caption: 'Mapping place, memory and story. Concept study.' }],
    notes: 'A personal project exploring how a map can tell stories about a place. The visual shown here is a concept study; the full case study and live project will be added as the work develops.',
  },
  {
    id: 'portfolio', title: 'A shared workbench', type: 'Personal project', category: 'Interactive website', role: 'Design & development', year: '2026', status: 'In development',
    summary: 'One home for software and photography. A working space becomes an invitation to explore both practices.',
    image: '/images/workstation/workstation-1584.webp', imageAlt: 'L-shaped workstation with a monitor, cameras and a green lamp.', href: '/',
    chapters: [
      { label: 'Workbench', image: '/images/workstation/workstation-1584.webp', alt: 'Complete workstation concept with software and photography equipment.', caption: 'A shared space for two ways of making.' },
      { label: 'Material study', image: '/images/projects/material-study.png', alt: 'Pale worktop, chrome hardware and deep green lamp in the shared corner.', caption: 'A closer look at the shared corner. Material study in progress.' },
    ],
    notes: 'The original photography archive lives alongside software work in a single React application. A Three.js workstation connects the two, with direct navigation, a static alternative, and a shared day and night palette.',
  },
]

for (const project of projects) {
  project.image = assetPath(project.image)
  project.links?.forEach(link => { if (link.href.startsWith('/')) link.href = assetPath(link.href) })
  project.chapters.forEach(chapter => { chapter.image = assetPath(chapter.image); if (chapter.video) chapter.video = assetPath(chapter.video) })
}
