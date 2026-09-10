import { assetPath } from './assetPath.js'

// Only real work gets a row. Unverified URLs and outcomes remain absent.
export const projects = [
  {
    id: 'shanxi-map', title: 'Shanxi Map', category: 'Interactive map', role: 'Design & frontend development', year: '2026', status: 'Work in progress',
    summary: 'An interactive map connecting places in Shanxi with local stories, personal memory and cultural context.',
    image: '/images/projects/shanxi-study.png', imageAlt: 'Shanxi Map concept: a route connecting places, stories and memory.',
    chapters: [{ label: 'Map study', image: '/images/projects/shanxi-study.png', alt: 'Shanxi Map wireframe study with a route connecting locations.', caption: 'Mapping place, memory and story. Concept study.' }],
    notes: 'A personal project exploring how a map can tell stories about a place. The visual shown here is a concept study; the full case study and live project will be added as the work develops.',
  },
  {
    id: 'portfolio', title: 'A shared workbench', category: 'Interactive website', role: 'Design & development', year: '2026', status: 'In development',
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
  project.chapters.forEach(chapter => { chapter.image = assetPath(chapter.image) })
}
