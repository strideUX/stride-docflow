import * as p from '@clack/prompts';
import chalk from 'chalk';
import { theme } from './theme.js';

// Themed versions of Clack prompts with Miami colors
export const styledPrompts = {
  intro: (title: string) => {
    p.intro(theme.neonGradient(title));
  },
  
  outro: (message: string) => {
    p.outro(theme.cyan(message));
  },
  
  success: (message: string) => {
    p.log.success(theme.electricBlue(message));
  },
  
  error: (message: string) => {
    p.log.error(theme.hotPink(message));
  },
  
  info: (message: string) => {
    p.log.info(theme.violet(message));
  },
  
  warning: (message: string) => {
    p.log.warn(theme.fuchsia(message));
  },
  
  note: (message: string, title?: string) => {
    p.note(
      chalk.gray(message),
      title ? theme.cyan(title) : undefined
    );
  },
  
  spinner: () => {
    const s = p.spinner();
    return {
      start: (message: string) => s.start(theme.chrome(message)),
      stop: (message: string) => s.stop(theme.electricBlue(message)),
      message: (message: string) => s.message(theme.chrome(message))
    };
  }
};

// Custom symbols for Miami theme
export const symbols = {
  success: theme.cyan('✨'),
  error: theme.hotPink('❌'),
  warning: theme.fuchsia('⚠️'),
  info: theme.violet('💡'),
  rocket: theme.electricBlue('🚀'),
  wave: theme.cyan('🌊'),
  palm: theme.chrome('🌴'),
  neon: theme.fuchsia('💜')
};