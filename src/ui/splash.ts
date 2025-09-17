import figlet from 'figlet';
import gradient from 'gradient-string';

export async function showSplash(): Promise<void> {
  const text = figlet.textSync('DOCFLOW', { font: 'ANSI Shadow', horizontalLayout: 'default', verticalLayout: 'default' });
  const colorful = gradient(['#ff4ecd', '#a78bfa', '#60a5fa', '#22d3ee']).multiline(text);
  // Extra spacing for breathing room
  // eslint-disable-next-line no-console
  console.log('\n\n' + colorful + '\n');
}


