import gradient from 'gradient-string';

export function paint(text: string): string {
  return gradient(['#ff4ecd', '#a78bfa', '#60a5fa', '#22d3ee'])(text);
}

export function paintMultiline(text: string): string {
  return gradient(['#ff4ecd', '#a78bfa', '#60a5fa', '#22d3ee']).multiline(text);
}

export function printAssistant(message: string): void {
  // eslint-disable-next-line no-console
  console.log('\n' + paintMultiline(message) + '\n');
}


