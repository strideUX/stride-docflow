import { describe, it, expect } from 'vitest';
import { getAvailableStacks, getStackByName } from '../templates/stack-registry.js';

describe('Stack Registry', () => {
  it('should return available stacks', async () => {
    const stacks = await getAvailableStacks();
    
    expect(stacks).toHaveLength(3);
    expect(stacks.map(s => s.name)).toEqual([
      'nextjs-convex',
      'nextjs-supabase', 
      'react-native-convex'
    ]);
  });

  it('should return stack by name', async () => {
    const stack = await getStackByName('nextjs-convex');
    
    expect(stack).toBeDefined();
    expect(stack?.name).toBe('nextjs-convex');
    expect(stack?.technologies).toContain('Next.js 15');
    expect(stack?.technologies).toContain('Convex');
  });

  it('should return null for unknown stack', async () => {
    const stack = await getStackByName('unknown-stack');
    
    expect(stack).toBeNull();
  });

  it('should have required properties for each stack', async () => {
    const stacks = await getAvailableStacks();
    
    for (const stack of stacks) {
      expect(stack.name).toBeDefined();
      expect(stack.description).toBeDefined();
      expect(stack.technologies).toBeInstanceOf(Array);
      expect(stack.technologies.length).toBeGreaterThan(0);
      expect(stack.templatePath).toBeDefined();
      expect(stack.researchQueries).toBeInstanceOf(Array);
      expect(stack.features).toBeDefined();
    }
  });

  it('should have unique stack names', async () => {
    const stacks = await getAvailableStacks();
    const names = stacks.map(s => s.name);
    const uniqueNames = [...new Set(names)];
    
    expect(names).toHaveLength(uniqueNames.length);
  });
});