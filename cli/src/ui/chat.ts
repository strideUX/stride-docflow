import readline from 'readline';
import { theme } from './theme.js';

export class ChatUI {
    private rl: readline.Interface;
    private onAssistantChunk: ((text: string) => void | Promise<void>) | undefined;
    private onAssistantEnd: (() => void | Promise<void>) | undefined;

    constructor(opts?: { onAssistantChunk?: (text: string) => void | Promise<void>; onAssistantEnd?: () => void | Promise<void> }) {
        this.onAssistantChunk = opts?.onAssistantChunk;
        this.onAssistantEnd = opts?.onAssistantEnd;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
        });
    }

    async promptUser(promptLabel: string = 'You'): Promise<string> {
        const label = theme.cyan(`${promptLabel}: `);
        return new Promise((resolve) => {
            this.rl.question(label, (answer: string) => {
                resolve(answer.trim());
            });
        });
    }

    printAssistantHeader(label: string = 'DocFlow'): void {
        process.stdout.write(`\n${theme.fuchsia(`${label}: `)}`);
    }

    appendAssistantChunk(text: string): void {
        process.stdout.write(text);
        if (this.onAssistantChunk) {
            try { void this.onAssistantChunk(text); } catch {}
        }
    }

    endAssistantMessage(): void {
        process.stdout.write('\n');
        if (this.onAssistantEnd) {
            try { void this.onAssistantEnd(); } catch {}
        }
    }

    async askYesNo(question: string, defaultYes: boolean = true): Promise<boolean> {
        this.printAssistantHeader();
        this.appendAssistantChunk(question + (defaultYes ? ' (Y/n) ' : ' (y/N) '));
        this.endAssistantMessage();
        // Use a simple prompt
        const answer = (await this.promptUser()).toLowerCase();
        if (!answer) return defaultYes;
        if (['y', 'yes'].includes(answer)) return true;
        if (['n', 'no'].includes(answer)) return false;
        return defaultYes;
    }

    close(): void {
        try {
            this.rl.close();
        } catch {}
    }
}


