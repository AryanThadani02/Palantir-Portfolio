// The whole portfolio is driven by this file: a tiny ontology of objects and links.
// Edit content here — the scene, panels and navigation are all derived from it.

export type ObjectType = 'education' | 'role' | 'project' | 'certification' | 'skill'

export interface Property {
  label: string
  value: string
}

export interface OntologyObject {
  id: string
  type: ObjectType
  title: string
  subtitle?: string
  properties?: Property[]
  highlights?: string[]
}

export interface OntologyLink {
  from: string
  to: string
  label: string
  inverse: string
}

export const PROFILE = {
  name: 'Aryan Thadani',
  title: 'Palantir Certified Foundry Developer',
  location: 'India',
  email: 'aryanthadani022@gmail.com',
  linkedin: 'https://www.linkedin.com/in/aryan-thadani/',
  github: 'https://github.com/AryanThadani02/',
  resume: '/Aryan_Thadani_Resume.pdf',
  // Optional portrait, e.g. '/profile.jpg' (put the file in public/). Empty = hidden.
  photo: '',
}

export const TYPE_META: Record<ObjectType, { label: string; color: string }> = {
  education: { label: 'Education', color: '#A78BFA' },
  role: { label: 'Role', color: '#4C90F0' },
  project: { label: 'Project', color: '#F5B83D' },
  certification: { label: 'Certification', color: '#3DD68C' },
  skill: { label: 'Skill', color: '#7DD3E8' },
}

const skill = (id: string, title: string, category: string): OntologyObject => ({
  id,
  type: 'skill',
  title,
  subtitle: category,
})

export const OBJECTS: OntologyObject[] = [
  {
    id: 'edu-bca',
    type: 'education',
    title: 'Bachelor of Computer Applications',
    subtitle: 'Lachoo Memorial College',
    properties: [
      { label: 'Period', value: '2020 – 2023' },
      { label: 'Degree', value: 'BCA' },
    ],
    highlights: ['Where coding started: my first structured exposure to programming and software fundamentals.'],
  },
  {
    id: 'role-oil',
    type: 'role',
    title: 'Web Developer Intern',
    subtitle: 'Open Innovation Lab',
    properties: [
      { label: 'Period', value: 'Jul 2023 – Jan 2024' },
      { label: 'Format', value: 'Training internship' },
    ],
    highlights: [
      'Learned React and Redux for building component-based interfaces.',
      'Picked up Tailwind CSS and strengthened core JavaScript, building on self-taught HTML, CSS and JavaScript.',
    ],
  },
  {
    id: 'role-ran',
    type: 'role',
    title: 'Software Engineer Intern',
    subtitle: 'Rising Academic Network',
    properties: [
      { label: 'Period', value: 'May 2024 – Oct 2024' },
      { label: 'Product', value: 'bamb.ai' },
      { label: 'Impact', value: '+20% backend performance' },
      { label: 'Team', value: 'International, multicultural' },
    ],
    highlights: [
      'Improved backend performance of the bamb.ai learning platform by 20% through optimized APIs, Redis caching and Python profiling.',
      'Worked across the stack: React and Redux on the front end; Node.js, MongoDB and APIs on the back end.',
      'Added Jest unit tests and shipped in Agile sprints with teammates from Ghana, Nigeria, South Africa and Australia.',
    ],
  },
  {
    id: 'role-mtas',
    type: 'role',
    title: 'Foundry Developer',
    subtitle: 'MTAS Solutions',
    properties: [
      { label: 'Period', value: 'Jan 2025 – Mar 2026' },
      { label: 'Domain', value: 'Manufacturing' },
      { label: 'Team', value: 'Coordinated 3 engineers' },
    ],
    highlights: [
      'Entered Palantir Foundry here: finished the recommended trainings, then reverse-engineered reference builds to learn how Foundry fits together.',
      'Delivered my first client work, a law firm pipeline that turns PDFs into validated Excel files.',
      'Deployed scalable Foundry architectures across manufacturing workflows, turning complex Ontologies into Workshop and OSDK applications.',
      'Built AIP workflows and production-ready AI agents, and optimized data models and Python transforms to cut pipeline latency.',
    ],
  },
  {
    id: 'role-vanyar',
    type: 'role',
    title: 'Foundry Developer',
    subtitle: 'Vanyar · Palantir Ecosystem',
    properties: [
      { label: 'Period', value: 'Mar 2026 – Present' },
      { label: 'Domains', value: 'Real estate, Healthcare' },
    ],
    highlights: [
      'Model Ontologies with domain experts for a real-estate client and deliver governed Workshop applications on top of them.',
      'Built the email and Salesforce integrations for a real-estate RFI that led to our selection as vendor, then delivered the proof of concept.',
      'Build pipelines in Pipeline Builder and Code Repositories with Actions and writeback, including a Salesforce integration.',
      'Build TypeScript functions, Contour and Quiver analyses and Foundry Map views for a healthcare project, plus AI agents with AIP Chatbot Studio, AI FDE and AIP Analyst.',
    ],
  },
  { id: 'proj-re', type: 'project', title: 'Real Estate Operations Platform', subtitle: 'Enterprise client' },
  { id: 'proj-mr', type: 'project', title: 'Market Report Publishing App', subtitle: 'Enterprise client' },
  { id: 'proj-law', type: 'project', title: 'Law Firm Data Automation', subtitle: 'Client project' },
  { id: 'proj-sc', type: 'project', title: 'Supply Chain Base Demo', subtitle: 'Showcase demo' },
  {
    id: 'cert-hub',
    type: 'certification',
    title: 'Palantir Certifications',
    subtitle: '4 certifications',
    properties: [
      { label: 'AI Engineer', value: 'Oct 2026' },
      { label: 'Data Engineer', value: 'Dec 2025' },
      { label: 'Application Developer', value: 'Sep 2025' },
      { label: 'Foundry Aware', value: 'Sep 2025' },
    ],
  },
  { id: 'cert-aie', type: 'certification', title: 'AI Engineer', subtitle: 'Oct 2026' },
  { id: 'cert-de', type: 'certification', title: 'Data Engineer', subtitle: 'Dec 2025' },
  { id: 'cert-ad', type: 'certification', title: 'Application Developer', subtitle: 'Sep 2025' },
  { id: 'cert-fa', type: 'certification', title: 'Foundry Aware', subtitle: 'Sep 2025' },

  skill('sk-ontology', 'Ontology', 'Foundry'),
  skill('sk-pb', 'Pipeline Builder', 'Foundry'),
  skill('sk-repos', 'Code Repositories', 'Foundry'),
  skill('sk-workshop', 'Workshop', 'Foundry'),
  skill('sk-osdk', 'OSDK', 'Foundry'),
  skill('sk-actions', 'Actions and Writeback', 'Foundry'),
  skill('sk-contour', 'Contour and Quiver', 'Foundry'),
  skill('sk-map', 'Foundry Map', 'Foundry'),
  skill('sk-aip', 'AIP Agents', 'AI'),
  skill('sk-docint', 'Document Intelligence', 'AI'),
  skill('sk-sf', 'Salesforce', 'Integration'),
  skill('sk-py', 'Python', 'Language'),
  skill('sk-pyspark', 'PySpark', 'Language'),
  skill('sk-ts', 'TypeScript', 'Language'),
  skill('sk-js', 'JavaScript', 'Language'),
  skill('sk-react', 'React', 'Framework'),
  skill('sk-redux', 'Redux', 'Framework'),
  skill('sk-node', 'Node.js', 'Framework'),
  skill('sk-tailwind', 'Tailwind CSS', 'Framework'),
  skill('sk-mongo', 'MongoDB', 'Data'),
  skill('sk-redis', 'Redis', 'Data'),
  skill('sk-jest', 'Jest', 'Tooling'),
]

const uses = (from: string, skills: string[]): OntologyLink[] =>
  skills.map((to) => ({ from, to, label: 'Used', inverse: 'Used in' }))

const builtWith = (from: string, skills: string[]): OntologyLink[] =>
  skills.map((to) => ({ from, to, label: 'Built with', inverse: 'Used in' }))

const validates = (from: string, skills: string[]): OntologyLink[] =>
  skills.map((to) => ({ from, to, label: 'Validates', inverse: 'Validated by' }))

export const LINKS: OntologyLink[] = [
  // Role tags, in the order they're shown.
  ...uses('role-oil', ['sk-react', 'sk-redux', 'sk-tailwind', 'sk-js']),
  ...uses('role-ran', ['sk-react', 'sk-redux', 'sk-node', 'sk-mongo', 'sk-redis', 'sk-py', 'sk-jest']),
  ...uses('role-mtas', ['sk-ontology', 'sk-workshop', 'sk-osdk', 'sk-aip', 'sk-py', 'sk-pyspark', 'sk-pb', 'sk-repos']),
  ...uses('role-vanyar', ['sk-ontology', 'sk-workshop', 'sk-pb', 'sk-repos', 'sk-actions', 'sk-sf', 'sk-ts', 'sk-contour']),
  { from: 'role-vanyar', to: 'proj-re', label: 'Delivered', inverse: 'Delivered at' },
  { from: 'role-vanyar', to: 'proj-mr', label: 'Delivered', inverse: 'Delivered at' },
  { from: 'role-mtas', to: 'proj-law', label: 'Delivered', inverse: 'Delivered at' },
  { from: 'role-mtas', to: 'proj-sc', label: 'Delivered', inverse: 'Delivered at' },
  ...builtWith('proj-re', ['sk-sf', 'sk-actions', 'sk-aip', 'sk-workshop']),
  ...builtWith('proj-mr', ['sk-workshop', 'sk-react']),
  ...builtWith('proj-law', ['sk-pb', 'sk-ontology', 'sk-docint']),
  ...builtWith('proj-sc', ['sk-ontology', 'sk-workshop']),
  // Also used at Vanyar (healthcare); past the first 8, so not shown as tags.
  ...uses('role-vanyar', ['sk-map', 'sk-aip']),
  ...['cert-aie', 'cert-de', 'cert-ad', 'cert-fa'].map((to) => ({
    from: 'cert-hub', to, label: 'Includes', inverse: 'Part of',
  })),
  ...validates('cert-aie', ['sk-aip']),
  ...validates('cert-de', ['sk-pb', 'sk-pyspark']),
  ...validates('cert-ad', ['sk-workshop', 'sk-osdk']),
]
