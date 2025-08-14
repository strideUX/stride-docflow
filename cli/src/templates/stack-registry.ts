export interface TechStack {
  name: string;
  description: string;
  technologies: string[];
  useCase: string;
  templatePath: string;
  researchQueries: string[];
  features: {
    auth: boolean;
    database: boolean;
    realtime: boolean;
    mobile: boolean;
    deployment: string[];
  };
}

const STACKS: TechStack[] = [
  {
    name: 'nextjs-convex',
    description: 'Next.js 15+ with Convex for real-time full-stack apps',
    technologies: ['Next.js 15', 'Convex', 'TypeScript', 'Tailwind CSS', 'shadcn/ui'],
    useCase: 'Real-time web applications, SaaS products, collaborative tools',
    templatePath: 'stacks/nextjs-convex',
    researchQueries: [
      'Next.js 15 app router best practices 2024',
      'Convex real-time database patterns',
      'shadcn/ui component patterns',
      'Next.js TypeScript configuration 2024'
    ],
    features: {
      auth: true,
      database: true,
      realtime: true,
      mobile: false,
      deployment: ['vercel', 'convex']
    }
  },
  {
    name: 'nextjs-supabase',
    description: 'Next.js 15+ with Supabase for PostgreSQL-backed apps',
    technologies: ['Next.js 15', 'Supabase', 'PostgreSQL', 'TypeScript', 'Tailwind CSS'],
    useCase: 'Traditional web apps, content management, e-commerce',
    templatePath: 'stacks/nextjs-supabase',
    researchQueries: [
      'Next.js 15 Supabase integration patterns',
      'Supabase auth best practices 2024',
      'PostgreSQL schema design patterns',
      'Supabase edge functions patterns'
    ],
    features: {
      auth: true,
      database: true,
      realtime: true,
      mobile: false,
      deployment: ['vercel', 'supabase']
    }
  },
  {
    name: 'react-native-convex',
    description: 'React Native with Convex for cross-platform mobile apps',
    technologies: ['React Native', 'Expo SDK 51+', 'Convex', 'TypeScript', 'NativeWind'],
    useCase: 'Cross-platform mobile apps, real-time mobile experiences',
    templatePath: 'stacks/react-native-convex',
    researchQueries: [
      'React Native Expo SDK 51 new features',
      'Convex React Native integration',
      'NativeWind styling patterns',
      'React Navigation v7 patterns'
    ],
    features: {
      auth: true,
      database: true,
      realtime: true,
      mobile: true,
      deployment: ['expo', 'app-store', 'play-store']
    }
  }
];

export async function getAvailableStacks(): Promise<TechStack[]> {
  return STACKS;
}

export async function getStackByName(name: string): Promise<TechStack | null> {
  return STACKS.find(stack => stack.name === name) || null;
}

export async function getStackResearchQueries(stackName: string): Promise<string[]> {
  const stack = await getStackByName(stackName);
  return stack?.researchQueries || [];
}