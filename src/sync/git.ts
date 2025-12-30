import { Command } from '@tauri-apps/plugin-shell';
import { getNotesDir } from '../database/storage';

export const initGit = async () => {
    const notesDir = await getNotesDir();

    try {
        await runGit(['init'], notesDir);
    } catch {
        // Git may already be initialized
    }
};

export const syncNotes = async () => {
    const notesDir = await getNotesDir();

    try {
        await runGit(['add', '.'], notesDir);

        const status = await runGit(['status', '--porcelain'], notesDir);

        if (status.trim()) {
            await runGit(['commit', '-m', `sync: ${new Date().toISOString()}`], notesDir);
        }

        const hasRemote = await checkRemoteExists(notesDir);

        if (hasRemote) {
            try {
                await runGit(['pull', '--rebase', 'origin', 'main'], notesDir);
            } catch {
                // May be first push
            }

            try {
                await runGit(['push', 'origin', 'main'], notesDir);
            } catch {
                try {
                    await runGit(['push', '-u', 'origin', 'main'], notesDir);
                } catch {
                    // Push failed
                }
            }
        }

        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: String(error) };
    }
};

const checkRemoteExists = async (cwd: string): Promise<boolean> => {
    try {
        const result = await runGit(['remote'], cwd);
        return result.trim().length > 0;
    } catch {
        return false;
    }
};

const runGit = async (args: string[], cwd: string): Promise<string> => {
    const command = Command.create('git', args, { cwd });
    const output = await command.execute();

    if (output.code !== 0) {
        throw new Error(`Git command failed: ${output.stderr}`);
    }

    return output.stdout;
};
