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
  // TODO: fill these in — empty links are hidden.
  linkedin: '',
  github: '',
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
      { label: 'Degree', value: 'BCA' },
      { label: 'Period', value: '2020 – 2023' },
    ],
  },
  {
    id: 'role-oil',
    type: 'role',
    title: 'Web Developer Intern',
    subtitle: 'Open Innovation Lab',
    properties: [
      { label: 'Period', value: 'Jul 2023 – Jan 2024' },
      { label: 'Impact', value: '+25% UX' },
    ],
    highlights: [
      'Built responsive UIs with React and Tailwind CSS, backed by Python preprocessing.',
      'Improved UX by 25% and lifted accessibility and performance through refactoring and automated linting.',
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
      { label: 'Impact', value: '+20% backend perf' },
    ],
    highlights: [
      'Improved backend performance of the bamb.ai learning platform by 20% through optimized APIs, Redis caching and Python profiling.',
      'Added Jest tests and shipped in Agile sprints.',
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
      'Deployed scalable Foundry architectures across manufacturing workflows, turning complex Ontologies into intuitive Workshop and OSDK applications.',
      'Implemented AIP workflows and production-ready AI agents to automate decisions.',
      'Optimized data models and Python transforms to cut pipeline latency and improve refresh reliability.',
    ],
  },
  {
    id: 'proj-law',
    type: 'project',
    title: 'Law Firm Data Automation',
    subtitle: 'Client project',
    properties: [{ label: 'Impact', value: '−80% manual effort' }],
    highlights: [
      'Built a Foundry pipeline for automated PDF ingestion, extraction and Ontology mapping.',
      'Reduced manual effort by 80% and improved reporting accuracy.',
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
      'Build pipelines in Pipeline Builder and Code Repositories with Actions and writeback, including a Salesforce integration (JWT Bearer flow, RS256).',
      'Build TypeScript functions, Contour/Quiver analyses and Foundry Map views for a healthcare project, plus AI agents with AIP Chatbot Studio, AI FDE and AIP Analyst.',
    ],
  },
  {
    id: 'proj-re',
    type: 'project',
    title: 'Real Estate Operations Platform',
    subtitle: 'Enterprise client project',
    properties: [{ label: 'Objects', value: 'Leads · Properties · Deals' }],
    highlights: [
      'Inbound and outbound email integration that classifies emails, maps them to leads, properties and deals, and sends templated replies with approvals.',
      'Salesforce ↔ Foundry integration with changes written back through Actions.',
      'AIP Document Intelligence extracts structured data from documents into the Ontology.',
      'Workshop dashboards — and traced and repaired the pipeline behind missing dashboard data.',
    ],
  },
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
  skill('sk-actions', 'Actions & Writeback', 'Foundry'),
  skill('sk-contour', 'Contour & Quiver', 'Foundry'),
  skill('sk-map', 'Foundry Map', 'Foundry'),
  skill('sk-aip', 'AIP Agents', 'AI'),
  skill('sk-docint', 'AIP Document Intelligence', 'AI'),
  skill('sk-sf', 'Salesforce', 'Integration'),
  skill('sk-py', 'Python', 'Language'),
  skill('sk-pyspark', 'PySpark', 'Language'),
  skill('sk-ts', 'TypeScript', 'Language'),
  skill('sk-react', 'React', 'Framework'),
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
  ...uses('role-oil', ['sk-react', 'sk-tailwind', 'sk-py']),
  ...uses('role-ran', ['sk-react', 'sk-node', 'sk-mongo', 'sk-redis', 'sk-py', 'sk-jest']),
  ...uses('role-mtas', ['sk-ontology', 'sk-workshop', 'sk-osdk', 'sk-aip', 'sk-py', 'sk-pyspark', 'sk-repos']),
  ...builtWith('proj-law', ['sk-pb', 'sk-ontology']),
  ...uses('role-vanyar', [
    'sk-ontology', 'sk-workshop', 'sk-pb', 'sk-repos', 'sk-actions',
    'sk-sf', 'sk-ts', 'sk-contour', 'sk-map', 'sk-aip',
  ]),
  { from: 'role-vanyar', to: 'proj-re', label: 'Delivered', inverse: 'Delivered at' },
  ...builtWith('proj-re', ['sk-sf', 'sk-actions', 'sk-docint', 'sk-workshop']),
  ...['cert-aie', 'cert-de', 'cert-ad', 'cert-fa'].map((to) => ({
    from: 'cert-hub', to, label: 'Includes', inverse: 'Part of',
  })),
  ...validates('cert-aie', ['sk-aip']),
  ...validates('cert-de', ['sk-pb', 'sk-pyspark']),
  ...validates('cert-ad', ['sk-workshop', 'sk-osdk']),
]
