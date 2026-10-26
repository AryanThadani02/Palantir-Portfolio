// Page copy. Every claim here comes from the résumé.

/** Experience, oldest first: the horizontal scroll is the journey, and each stop raises a taller tower. */
// `logo` lives in public/logos/ (800px squares, made from the originals in assets/).
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
  /** The headline result: a short word or figure, and what it means. */
  highlight: { value: string; label: string }
  also?: string[]
  /** Exactly STEPS_PER_PROJECT steps; each is a pictogram (icons.ts key) the particles morph through. */
  steps: { label: string; icon: string }[]
}

export const STEPS_PER_PROJECT = 5

export const WORK: CaseStudy[] = [
  {
    id: 'proj-re',
    index: '01',
    sector: 'Real estate · Enterprise client',
    summary:
      'Cases arrive from email, a portal, Salesforce and raw data. The platform classifies each one by category, sub-category and assignment group, surfaces it in Workshop for action, and writes changes back to Salesforce, with inbound and outbound email handled in the same flow.',
    highlight: { value: 'Fixed', label: 'Missing dashboard data, traced and repaired at the pipeline' },
    also: ['Salesforce writeback', 'AIP Logic', 'AI analysis'],
    steps: [
      { label: 'Case intake (email, portal, Salesforce)', icon: 'inbox' },
      { label: 'AIP classification', icon: 'clean' },
      { label: 'Category · Sub-category · Group', icon: 'diagram-tree' },
      { label: 'Workshop', icon: 'application' },
      { label: 'Outbound email and Salesforce writeback', icon: 'send-message' },
    ],
  },
  {
    id: 'proj-mr',
    index: '02',
    sector: 'Real estate · Enterprise client',
    summary:
      'Consultants turn assessments and data into a market report inside an admin Workshop, edit it there, then publish it to a user-facing app. Users only ever see the published version.',
    highlight: { value: 'Draft stays private', label: 'Editing lives in the admin app; only published reports reach users' },
    also: ['React charts and graphs', 'Proof of concept'],
    steps: [
      { label: 'Data and assessments', icon: 'database' },
      { label: 'Admin Workshop', icon: 'control' },
      { label: 'Edit report', icon: 'edit' },
      { label: 'Publish', icon: 'upload' },
      { label: 'Published app', icon: 'desktop' },
    ],
  },
  {
    id: 'proj-law',
    index: '03',
    sector: 'Legal · Client project',
    summary:
      'A Foundry pipeline template: feed it PDFs and it returns a fully validated Excel file, with no manual reading, typing or checking.',
    highlight: { value: 'Automated', label: 'The process now runs through the pipeline, cutting the time it takes significantly' },
    steps: [
      { label: 'PDF intake', icon: 'document' },
      { label: 'Ingestion', icon: 'import' },
      { label: 'Extraction', icon: 'th-derived' },
      { label: 'Ontology mapping', icon: 'cube' },
      { label: 'Reporting', icon: 'timeline-bar-chart' },
    ],
  },
  {
    id: 'proj-sc',
    index: '04',
    sector: 'Supply chain · Showcase demo',
    summary:
      'Part of the team that built a reference demo for showing Foundry to any customer: orders, deliveries, machinery, manufacturing plants and distribution centers in one connected Ontology.',
    highlight: { value: 'Reusable', label: 'Adapted into tailored, industry-specific demos' },
    steps: [
      { label: 'Orders', icon: 'shopping-cart' },
      { label: 'Manufacturing plants', icon: 'office' },
      { label: 'Machinery and planning', icon: 'cog' },
      { label: 'Distribution centers', icon: 'box' },
      { label: 'Deliveries', icon: 'truck' },
    ],
  },
]

/** Every step the Work chapter plays, across projects, in order (main lane only). */
export const WORK_STEPS = WORK.flatMap((cs, project) =>
  cs.steps.map((st, step) => ({ project, step, count: cs.steps.length, ...st })),
)

/** The About title sequence: one word per beat, written by the particles, with its line of the manifesto. */
export const ABOUT_WORDS = [
  { word: 'Raw data', line: 'I take raw, messy data,' },
  { word: 'Ontology', line: 'model it into an ontology that makes sense,' },
  { word: 'Workflow', line: 'build the workflows that act on it,' },
  { word: 'App', line: 'and ship an app anyone can use, securely.' },
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
      { id: 'sk-actions', label: 'Actions and Writeback', icon: 'exchange' },
      { id: 'sk-contour', label: 'Contour and Quiver', icon: 'timeline-bar-chart' },
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
      { id: 'sk-redux', label: 'Redux', icon: 'redux' },
      { id: 'sk-node', label: 'Node.js', icon: 'nodedotjs' },
      { id: 'sk-tailwind', label: 'Tailwind CSS', icon: 'tailwindcss' },
    ],
  },
  {
    group: 'Data and tools',
    items: [
      { id: 'sk-sf', label: 'Salesforce', icon: 'salesforce' },
      { id: 'sk-mongo', label: 'MongoDB', icon: 'mongodb' },
      { id: 'sk-redis', label: 'Redis', icon: 'redis' },
      { label: 'Firebase', icon: 'firebase' },
      { id: 'sk-jest', label: 'Jest', icon: 'jest' },
      { label: 'Git and CI/CD', icon: 'git' },
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
