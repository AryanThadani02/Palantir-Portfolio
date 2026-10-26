// Page copy. Every claim here comes from the résumé.

export const MANIFESTO =
  'I turn messy operational data into ontologies people can act on — pipelines in, governed Workshop, OSDK and AIP applications out.'

export const STATS = [
  { value: '30–35%', label: 'Reporting efficiency gained through governed Workshop & OSDK apps' },
  { value: '80%', label: 'Less manual effort on automated PDF → Ontology ingestion' },
  { value: '4', label: 'Palantir certifications — Data, Apps, AI, Foundry Aware' },
  { value: '~2 yrs', label: 'Hands-on Foundry across real estate, healthcare & manufacturing' },
]

/** Experience, oldest first: the horizontal scroll is the journey, and each stop raises a taller tower. */
// `logo` lives in public/logos/ (no college logo yet: its tile shows a graduation icon).
export const EXPERIENCE = [
  { id: 'edu-bca', year: '2020', logo: '/logos/lachoo.jpg', short: 'BCA · Lachoo' },
  { id: 'role-oil', year: '2023', logo: '/logos/open-innovation-lab.jpg', short: 'Open Innovation Lab' },
  { id: 'role-ran', year: '2024', logo: '/logos/rising-academic-network.jpg', short: 'Rising Academic' },
  { id: 'role-mtas', year: '2025', logo: '/logos/mtas.jpg', short: 'MTAS Solutions' },
  { id: 'role-vanyar', year: '2026', logo: '/logos/vanyar.jpg', short: 'Vanyar' },
]

export interface CaseStudy {
  id: string
  index: string
  sector: string
  summary: string
  flows: { label: string; steps: string[] }[]
  /** One pictogram (icons.ts key) per step of the main lane — the particles morph through these. */
  icons: string[]
  outcome: { value: string; label: string }
}

export const WORK: CaseStudy[] = [
  {
    id: 'proj-re',
    index: '01',
    sector: 'Real estate · Enterprise client',
    summary:
      'An operations platform that reads the inbox, understands it, and writes back to Salesforce — built on an Ontology of leads, properties and deals.',
    flows: [
      { label: 'Inbound mail', steps: ['Email', 'AIP classification', 'Lead · Property · Deal', 'Approval', 'Templated reply'] },
      { label: 'CRM sync', steps: ['Salesforce', 'JWT Bearer · RS256', 'Ontology', 'Actions & writeback'] },
      { label: 'Documents', steps: ['Documents', 'AIP Document Intelligence', 'Structured objects', 'Workshop'] },
    ],
    icons: ['envelope', 'clean', 'home', 'tick-circle', 'send-message'],
    outcome: { value: 'Fixed', label: 'Missing dashboard data — traced and repaired at the pipeline' },
  },
  {
    id: 'proj-law',
    index: '02',
    sector: 'Legal · Client project',
    summary:
      'A Foundry pipeline that takes PDFs from intake to reporting with no hands in between — ingestion, extraction and Ontology mapping.',
    flows: [{ label: 'Pipeline', steps: ['PDF intake', 'Ingestion', 'Extraction', 'Ontology mapping', 'Reporting'] }],
    icons: ['document', 'import', 'th-derived', 'cube', 'timeline-bar-chart'],
    outcome: { value: '−80%', label: 'Manual effort, with more accurate reporting' },
  },
]

/** Every step the Work chapter plays, across projects, in order (main lane only). */
export const WORK_STEPS = WORK.flatMap((cs, project) =>
  cs.icons.map((icon, step) => ({ project, step, count: cs.icons.length, icon, label: cs.flows[0].steps[step] })),
)

/** The About title sequence: one word per beat, written by the particles, with its line of the manifesto. */
export const ABOUT_WORDS = [
  { word: 'Raw data', line: 'I turn messy operational data —' },
  { word: 'Ontology', line: 'into ontologies people can act on.' },
  { word: 'Pipelines', line: 'Pipelines in,' },
  { word: 'Apps', line: 'governed Workshop, OSDK and AIP applications out.' },
]

export interface StackItem {
  /** Ontology skill object, for "Used at …". */
  id?: string
  label: string
  /** Key into ICONS (src/ui/icons.ts): Simple Icons brands, Blueprint icons for Foundry tools. */
  icon: string
}

/** The stack, grouped. Each item is also a constellation (with its logo) on the skill globe. */
export const STACK: { group: string; items: StackItem[] }[] = [
  {
    group: 'Palantir Foundry',
    items: [
      { id: 'sk-ontology', label: 'Ontology Manager', icon: 'graph' },
      { id: 'sk-pb', label: 'Pipeline Builder', icon: 'data-lineage' },
      { id: 'sk-repos', label: 'Code Repositories', icon: 'git-repo' },
      { id: 'sk-workshop', label: 'Workshop', icon: 'application' },
      { id: 'sk-osdk', label: 'OSDK', icon: 'code-block' },
      { id: 'sk-actions', label: 'Actions & Writeback', icon: 'exchange' },
      { id: 'sk-contour', label: 'Contour & Quiver', icon: 'timeline-bar-chart' },
      { id: 'sk-map', label: 'Foundry Map', icon: 'map' },
    ],
  },
  {
    group: 'AI',
    items: [
      { id: 'sk-aip', label: 'AIP Agents', icon: 'predictive-analysis' },
      { label: 'AIP Chatbot Studio', icon: 'chat' },
      { label: 'AI FDE', icon: 'code' },
      { label: 'AIP Analyst', icon: 'chart' },
      { id: 'sk-docint', label: 'Document Intelligence', icon: 'document' },
    ],
  },
  {
    group: 'Languages',
    items: [
      { id: 'sk-py', label: 'Python', icon: 'python' },
      { id: 'sk-pyspark', label: 'PySpark', icon: 'apachespark' },
      { id: 'sk-ts', label: 'TypeScript', icon: 'typescript' },
      { id: 'sk-react', label: 'React', icon: 'react' },
      { id: 'sk-node', label: 'Node.js', icon: 'nodedotjs' },
      { id: 'sk-tailwind', label: 'Tailwind CSS', icon: 'tailwindcss' },
    ],
  },
  {
    group: 'Data & tools',
    items: [
      { id: 'sk-sf', label: 'Salesforce', icon: 'salesforce' },
      { id: 'sk-mongo', label: 'MongoDB', icon: 'mongodb' },
      { id: 'sk-redis', label: 'Redis', icon: 'redis' },
      { label: 'Firebase', icon: 'firebase' },
      { id: 'sk-jest', label: 'Jest', icon: 'jest' },
      { label: 'Git · CI/CD', icon: 'git' },
    ],
  },
]

// `image` lives in public/certs/ (rendered from the certificate PDFs); `url` is the Skilljar verification page.
export const CERTIFICATIONS = [
  { id: 'cert-aie', title: 'Palantir AI Engineer', date: 'Oct 2026', image: '/certs/ai-engineer.jpg', url: 'https://verify.skilljar.com/c/hr493634ow9o' },
  { id: 'cert-de', title: 'Foundry Data Engineer', date: 'Dec 2025', image: '/certs/data-engineer.jpg', url: 'https://verify.skilljar.com/c/j29depp3b4st' },
  { id: 'cert-ad', title: 'Foundry Application Developer', date: 'Sep 2025', image: '/certs/application-developer.jpg', url: 'https://verify.skilljar.com/c/p7vukzmpyayc' },
  { id: 'cert-fa', title: 'Foundry Aware', date: 'Sep 2025', image: '/certs/foundry-aware.jpg', url: 'https://verify.skilljar.com/c/ufqextwh5of4' },
]

/** Every stack item in order — the index is its constellation on the skill globe. */
export const SKILLS = STACK.flatMap((g) => g.items)
