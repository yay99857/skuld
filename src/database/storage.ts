import { writeFile, mkdir, remove, exists } from '@tauri-apps/plugin-fs';
import { join, documentDir } from '@tauri-apps/api/path';
import yaml from 'js-yaml';

/**
 * Strategy:
 * 1. Base directory for notes is configurable, but by default we use a 'notes' folder
 * in the user's documents or a specific app folder.
 * 2. Each note is saved as {id}.md to avoid title conflicts.
 * 3. Metadata is stored in YAML frontmatter.
 */

export interface NoteMetadata {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    notebook?: string;
    tags?: string[];
    hash?: string;
}

export const getNotesDir = async () => {
    // In a real app, we might want to store this in a user-selected location
    // For now, let's use a 'notes' folder in the current project root or documents
    const base = await documentDir();
    const notesPath = await join(base, 'textoc-notes');

    if (!(await exists(notesPath))) {
        await mkdir(notesPath, { recursive: true });
    }

    return notesPath;
};

export const saveNoteToFile = async (metadata: NoteMetadata, content: string) => {
    const notesDir = await getNotesDir();
    const filePath = await join(notesDir, `${metadata.id}.md`);

    const frontmatter = yaml.dump(metadata);
    const fullContent = `---\n${frontmatter}---\n\n${content}`;

    const encoder = new TextEncoder();
    await writeFile(filePath, encoder.encode(fullContent));
};

export const deleteNoteFile = async (id: string) => {
    const notesDir = await getNotesDir();
    const filePath = await join(notesDir, `${id}.md`);
    if (await exists(filePath)) {
        await remove(filePath);
    }
};
