import chalk from 'chalk';
import stripAnsi from 'strip-ansi';

// Miami Neon Color Palette - Adjusted for better readability
export const colors = {
  fuchsia: '#FF66E6',      // Lightened for better contrast
  hotPink: '#FF99E6', 
  violet: '#CC99FF',       // Much lighter purple
  electricBlue: '#66B3FF', // Lightened blue
  cyan: '#66FFFF',         // Brightened cyan
  // Accent colors
  ocean: '#1A1A2E',
  chrome: '#F0F0F0',       // Much brighter for better readability
  palm: '#66DD66'          // Brighter green
};

// Chalk color functions with fallbacks
export const theme = {
  fuchsia: chalk.hex(colors.fuchsia),
  hotPink: chalk.hex(colors.hotPink),
  violet: chalk.hex(colors.violet),
  electricBlue: chalk.hex(colors.electricBlue),
  cyan: chalk.hex(colors.cyan),
  chrome: chalk.hex(colors.chrome),
  // Readable text colors
  text: chalk.hex('#F0F0F0'),        // Bright readable text
  textMuted: chalk.hex('#CCCCCC'),   // Slightly dimmer but still readable
  
  // Gradient function for banners
  neonGradient: (text: string) => {
    const chars = text.split('');
    const colors = [
      chalk.hex('#FF66E6'), // fuchsia
      chalk.hex('#FF99E6'), // hot pink
      chalk.hex('#CC99FF'), // violet
      chalk.hex('#66B3FF'), // electric blue
      chalk.hex('#66FFFF')  // cyan
    ];
    
    return chars.map((char, i) => {
      const colorIndex = Math.floor((i / chars.length) * colors.length);
      return colors[colorIndex] ? colors[colorIndex](char) : char;
    }).join('');
  },
  
  // Box drawing characters
  box: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│'
  }
};

// ASCII Art for different terminal widths
export const banners = {
  wide: `
██████╗  ██████╗  ██████╗███████╗██╗      ██████╗ ██╗    ██╗
██╔══██╗██╔═══██╗██╔════╝██╔════╝██║     ██╔═══██╗██║    ██║
██║  ██║██║   ██║██║     █████╗  ██║     ██║   ██║██║ █╗ ██║
██║  ██║██║   ██║██║     ██╔══╝  ██║     ██║   ██║██║███╗██║
██████╔╝╚██████╔╝╚██████╗██║     ███████╗╚██████╔╝╚███╔███╔╝
╚═════╝  ╚═════╝  ╚═════╝╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝`,

  compact: `
██████╗  ██████╗  ██████╗███████╗██╗      ██████╗ ██╗    ██╗
██╔══██╗██╔═══██╗██╔════╝██╔════╝██║     ██╔═══██╗██║    ██║
██║  ██║██║   ██║██║     █████╗  ██║     ██║   ██║██║ █╗ ██║
██║  ██║██║   ██║██║     ██╔══╝  ██║     ██║   ██║██║███╗██║
██████╔╝╚██████╔╝╚██████╗██║     ███████╗╚██████╔╝╚███╔███╔╝
╚═════╝  ╚═════╝  ╚═════╝╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝`,

  minimal: `DocFlow v1.0.0`
};

export const taglines = [
  "Automate your docs. Flow like neon.",
  "Docs that move—like midnight on Ocean Drive.", 
  "From static files to fluid flow.",
  "Generate. Collaborate. Accelerate.",
  "AI-powered docs with synthwave soul."
];

// Terminal width detection and banner selection
export function getBanner(terminalWidth: number = process.stdout.columns || 80): string {
  if (terminalWidth >= 100) {
    return theme.neonGradient(banners.wide);
  } else if (terminalWidth >= 70) {
    return theme.neonGradient(banners.compact);
  } else {
    return theme.cyan(banners.minimal);
  }
}

export function getTagline(): string {
  return theme.hotPink(taglines[Math.floor(Math.random() * taglines.length)]);
}

// Quick start box with Miami styling
export function createQuickStartBox(): string {
  const { box } = theme;
  const commands = [
    `${theme.fuchsia('docflow create')} ${theme.textMuted('— complete project setup')}`,
    `${theme.cyan('docflow generate')} ${theme.textMuted('— scaffold your project')}`,
    `${theme.violet('docflow list')} ${theme.textMuted('— explore tech stacks')}`, 
    `${theme.electricBlue('docflow validate')} ${theme.textMuted('— check your docs')}`,
    `${theme.hotPink('docflow config')} ${theme.textMuted('— manage settings')}`,
    '',
    `${theme.textMuted('Tip:')} ${theme.chrome('--no-splash')} ${theme.textMuted('to skip this banner')}`
  ];
  
  const maxWidth = Math.max(...commands.map(cmd => stripAnsi(cmd).length));
  const padding = 2;
  const totalWidth = maxWidth + (padding * 2);
  
  let box_content = '';
  box_content += theme.fuchsia(box.topLeft + box.horizontal.repeat(totalWidth) + box.topRight) + '\n';
  
  for (const cmd of commands) {
    const spaces = totalWidth - stripAnsi(cmd).length;
    box_content += theme.fuchsia(box.vertical) + ' ' + cmd + ' '.repeat(spaces - 1) + theme.fuchsia(box.vertical) + '\n';
  }
  
  box_content += theme.fuchsia(box.bottomLeft + box.horizontal.repeat(totalWidth) + box.bottomRight);
  
  return box_content;
}


// Environment detection
export function shouldShowSplash(): boolean {
  return process.stdout.isTTY && !process.env.CI && !process.argv.includes('--no-splash');
}

// Main splash screen
export function createSplash(): string {
  if (!shouldShowSplash()) return '';
  
  const banner = getBanner();
  const tagline = getTagline();
  const quickStart = createQuickStartBox();
  
  return `
${banner}

${tagline}

${quickStart}

${theme.chrome('Ready to generate some docs?')} ${theme.cyan('Let\'s flow...')}
`;
}