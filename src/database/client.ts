import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export const getDB = async (): Promise<Database> => {
    if (!db) {
        db = await Database.load('sqlite:textoc.db');

        // Create tables if they don't exist
        await db.execute(`
      CREATE TABLE IF NOT EXISTS notebooks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES notebooks(id) ON DELETE CASCADE
      )
    `);

        // Migration for existing databases
        try {
            await db.execute('ALTER TABLE notebooks ADD COLUMN parent_id TEXT');
        } catch (e) {
            // Column might already exist
        }

        await db.execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        notebook_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        hash TEXT,
        FOREIGN KEY (notebook_id) REFERENCES notebooks(id)
      )
    `);

        await db.execute(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
      )
    `);

        await db.execute(`
      CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (note_id, tag_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);
    }
    return db;
};

const generateId = () => crypto.randomUUID();

export interface Note {
    id: string;
    title: string;
    content: string;
    notebookId: string | null;
    createdAt: Date;
    updatedAt: Date;
    hash?: string;
}

export interface Notebook {
    id: string;
    name: string;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Tag {
    id: string;
    name: string;
}

export const createNote = async (title: string, content: string, notebookId?: string): Promise<Note> => {
    const database = await getDB();
    const id = generateId();
    const now = new Date().toISOString();

    await database.execute(
        `INSERT INTO notes (id, title, content, notebook_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, title, content, notebookId || null, now, now]
    );

    return {
        id,
        title,
        content,
        notebookId: notebookId || null,
        createdAt: new Date(now),
        updatedAt: new Date(now),
    };
};

export const getNotes = async (): Promise<Note[]> => {
    const database = await getDB();
    const result = await database.select<Array<{
        id: string;
        title: string;
        content: string;
        notebook_id: string | null;
        created_at: string;
        updated_at: string;
        hash: string | null;
    }>>(`SELECT * FROM notes ORDER BY updated_at DESC`);

    return result.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        notebookId: row.notebook_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        hash: row.hash || undefined,
    }));
};

export const updateNote = async (id: string, data: { title?: string; content?: string; notebookId?: string | null }): Promise<Note> => {
    const database = await getDB();
    const now = new Date().toISOString();

    const sets: string[] = ['updated_at = $1'];
    const values: (string | null)[] = [now];
    let paramIndex = 2;

    if (data.title !== undefined) {
        sets.push(`title = $${paramIndex++}`);
        values.push(data.title);
    }
    if (data.content !== undefined) {
        sets.push(`content = $${paramIndex++}`);
        values.push(data.content);
    }
    if (data.notebookId !== undefined) {
        sets.push(`notebook_id = $${paramIndex++}`);
        values.push(data.notebookId);
    }

    values.push(id);
    await database.execute(
        `UPDATE notes SET ${sets.join(', ')} WHERE id = $${paramIndex}`,
        values
    );

    const result = await database.select<Array<{
        id: string;
        title: string;
        content: string;
        notebook_id: string | null;
        created_at: string;
        updated_at: string;
    }>>(`SELECT * FROM notes WHERE id = $1`, [id]);

    const row = result[0];
    return {
        id: row.id,
        title: row.title,
        content: row.content,
        notebookId: row.notebook_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
};

export const deleteNote = async (id: string): Promise<void> => {
    const database = await getDB();
    await database.execute(`DELETE FROM notes WHERE id = $1`, [id]);
};

export const getNotebooks = async (): Promise<Notebook[]> => {
    const database = await getDB();
    const result = await database.select<Array<{
        id: string;
        name: string;
        parent_id: string | null;
        created_at: string;
        updated_at: string;
    }>>(`SELECT * FROM notebooks`);

    return result.map(row => ({
        id: row.id,
        name: row.name,
        parentId: row.parent_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    }));
};

export const createNotebook = async (name: string, parentId?: string): Promise<Notebook> => {
    const database = await getDB();
    const id = generateId();
    const now = new Date().toISOString();

    await database.execute(
        `INSERT INTO notebooks (id, name, parent_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)`,
        [id, name, parentId || null, now, now]
    );

    return {
        id,
        name,
        parentId: parentId || null,
        createdAt: new Date(now),
        updatedAt: new Date(now),
    };
};

export const getTags = async (): Promise<Tag[]> => {
    const database = await getDB();
    const result = await database.select<Array<{ id: string; name: string }>>(`SELECT * FROM tags`);
    return result;
};

export const createTag = async (name: string): Promise<Tag> => {
    const database = await getDB();
    const id = generateId();

    try {
        await database.execute(
            `INSERT INTO tags (id, name) VALUES ($1, $2)`,
            [id, name]
        );
    } catch (e) {
        // Ignore duplicate tag names, return existing
        const existing = await database.select<Array<{ id: string; name: string }>>(`SELECT * FROM tags WHERE name = $1`, [name]);
        if (existing.length > 0) return existing[0];
        throw e;
    }

    return { id, name };
};

export const addTagToNote = async (noteId: string, tagId: string): Promise<void> => {
    const database = await getDB();
    try {
        await database.execute(
            `INSERT INTO note_tags (note_id, tag_id) VALUES ($1, $2)`,
            [noteId, tagId]
        );
    } catch {
        // Ignore if already exists
    }
};

export const removeTagFromNote = async (noteId: string, tagId: string): Promise<void> => {
    const database = await getDB();
    await database.execute(
        `DELETE FROM note_tags WHERE note_id = $1 AND tag_id = $2`,
        [noteId, tagId]
    );
};

export const getNoteTags = async (noteId: string): Promise<Tag[]> => {
    const database = await getDB();
    const result = await database.select<Array<{ id: string; name: string }>>(
        `SELECT t.* FROM tags t
         JOIN note_tags nt ON t.id = nt.tag_id
         WHERE nt.note_id = $1`,
        [noteId]
    );
    return result;
};

export const getAllNoteTags = async (): Promise<Array<{ note_id: string; tag_id: string }>> => {
    const database = await getDB();
    const result = await database.select<Array<{ note_id: string; tag_id: string }>>(`SELECT * FROM note_tags`);
    return result;
};

export const updateNotebook = async (id: string, name: string): Promise<void> => {
    const database = await getDB();
    const now = new Date().toISOString();
    await database.execute(
        `UPDATE notebooks SET name = $1, updated_at = $2 WHERE id = $3`,
        [name, now, id]
    );
};

export const deleteNotebook = async (id: string): Promise<void> => {
    const database = await getDB();
    await database.execute(`DELETE FROM notebooks WHERE id = $1`, [id]);
};

export const updateTag = async (id: string, name: string): Promise<void> => {
    const database = await getDB();
    await database.execute(`UPDATE tags SET name = $1 WHERE id = $2`, [name, id]);
};

export const deleteTag = async (id: string): Promise<void> => {
    const database = await getDB();
    await database.execute(`DELETE FROM tags WHERE id = $1`, [id]);
};
