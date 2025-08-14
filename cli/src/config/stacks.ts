export type StackName = 'react-native-convex' | 'nextjs-convex' | 'nextjs-supabase';

export interface StackConfig {
	name: StackName;
	description: string;
	templatePath: string;
	researchQueries: string[];
	dependencies?: string[];
}

export const STACKS: Record<StackName, StackConfig> = {
	'react-native-convex': {
		name: 'react-native-convex',
		description: 'React Native (Expo) with Convex backend',
		templatePath: 'stacks/react-native-convex',
		researchQueries: [
			'Expo React Native best practices 2025',
			'Convex schema and auth patterns',
			'Expo + Convex integration patterns',
		],
		dependencies: ['convex']
	},
	'nextjs-convex': {
		name: 'nextjs-convex',
		description: 'Next.js with Convex backend',
		templatePath: 'stacks/nextjs-convex',
		researchQueries: ['Next.js best practices', 'Convex with Next.js']
	},
	'nextjs-supabase': {
		name: 'nextjs-supabase',
		description: 'Next.js with Supabase',
		templatePath: 'stacks/nextjs-supabase',
		researchQueries: ['Next.js best practices', 'Supabase auth and database']
	}
};

export function getStack(stack: StackName): StackConfig {
	return STACKS[stack];
}
