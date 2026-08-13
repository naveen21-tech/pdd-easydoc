import { describe, it, expect, beforeEach } from 'vitest';

describe('Document Editor: State Management, Undo/Redo & Autosave (Area 5)', () => {
  class EditorHistoryManager {
    private history: string[] = [];
    private currentIndex: number = -1;

    constructor(initialContent: string) {
      this.push(initialContent);
    }

    push(content: string) {
      // Clear redo history if we make changes after an undo
      this.history = this.history.slice(0, this.currentIndex + 1);
      this.history.push(content);
      this.currentIndex = this.history.length - 1;
    }

    getCurrent(): string {
      return this.history[this.currentIndex] || '';
    }

    canUndo(): boolean {
      return this.currentIndex > 0;
    }

    canRedo(): boolean {
      return this.currentIndex < this.history.length - 1;
    }

    undo(): string | null {
      if (!this.canUndo()) return null;
      this.currentIndex--;
      return this.getCurrent();
    }

    redo(): string | null {
      if (!this.canRedo()) return null;
      this.currentIndex++;
      return this.getCurrent();
    }

    reset(content: string) {
      this.history = [content];
      this.currentIndex = 0;
    }
  }

  let editor: EditorHistoryManager;

  beforeEach(() => {
    editor = new EditorHistoryManager('# Initial Title\nIntro paragraph.');
  });

  it('1. should initialize editor state with initial document content', () => {
    expect(editor.getCurrent()).toBe('# Initial Title\nIntro paragraph.');
    expect(editor.canUndo()).toBe(false);
    expect(editor.canRedo()).toBe(false);
  });

  it('2. should push new state and enable undo', () => {
    editor.push('# Initial Title\nIntro paragraph.\n## Section 1');
    expect(editor.canUndo()).toBe(true);
    expect(editor.canRedo()).toBe(false);
    expect(editor.getCurrent()).toContain('## Section 1');
  });

  it('3. should undo to previous state accurately', () => {
    editor.push('State 2');
    editor.push('State 3');

    const previous = editor.undo();
    expect(previous).toBe('State 2');
    expect(editor.getCurrent()).toBe('State 2');
    expect(editor.canRedo()).toBe(true);
  });

  it('4. should redo to forward state accurately', () => {
    editor.push('State 2');
    editor.undo();

    const forward = editor.redo();
    expect(forward).toBe('State 2');
    expect(editor.getCurrent()).toBe('State 2');
  });

  it('5. should return null when undo is called at the beginning of history', () => {
    expect(editor.undo()).toBeNull();
  });

  it('6. should return null when redo is called at the end of history', () => {
    expect(editor.redo()).toBeNull();
  });

  it('7. should clear future redo states when a new change is made after undo', () => {
    editor.push('State 2');
    editor.push('State 3');
    editor.undo(); // back to State 2
    editor.push('State 2.5 Alternative');

    expect(editor.canRedo()).toBe(false);
    expect(editor.getCurrent()).toBe('State 2.5 Alternative');
  });

  it('8. should reset history with new content', () => {
    editor.push('State 2');
    editor.push('State 3');
    editor.reset('Completely Fresh Document');

    expect(editor.getCurrent()).toBe('Completely Fresh Document');
    expect(editor.canUndo()).toBe(false);
    expect(editor.canRedo()).toBe(false);
  });

  it('9. should handle multiple consecutive undos to original state', () => {
    editor.push('State 2');
    editor.push('State 3');
    editor.push('State 4');

    editor.undo();
    editor.undo();
    editor.undo();

    expect(editor.getCurrent()).toBe('# Initial Title\nIntro paragraph.');
    expect(editor.canUndo()).toBe(false);
  });

  it('10. should handle multiple consecutive redos to latest state', () => {
    editor.push('State 2');
    editor.push('State 3');
    editor.undo();
    editor.undo();

    editor.redo();
    editor.redo();

    expect(editor.getCurrent()).toBe('State 3');
    expect(editor.canRedo()).toBe(false);
  });

  it('11. should track dirty state when content differs from saved content', () => {
    const savedContent = editor.getCurrent();
    let isDirty = false;

    editor.push('Modified Content');
    isDirty = editor.getCurrent() !== savedContent;
    expect(isDirty).toBe(true);

    editor.undo();
    isDirty = editor.getCurrent() !== savedContent;
    expect(isDirty).toBe(false);
  });

  it('12. should calculate reading time estimate (200 words per minute)', () => {
    const text = 'word '.repeat(400); // 400 words
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    expect(readingTimeMinutes).toBe(2);
  });

  it('13. should handle empty document reading time as 1 minute minimum', () => {
    const text = '';
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    expect(readingTimeMinutes).toBe(1);
  });

  it('14. should count characters with and without whitespace', () => {
    const text = 'Hello World 2026';
    const charCountWithSpaces = text.length;
    const charCountWithoutSpaces = text.replace(/\s+/g, '').length;

    expect(charCountWithSpaces).toBe(16);
    expect(charCountWithoutSpaces).toBe(14);
  });

  it('15. should extract heading hierarchy for outline sidebar', () => {
    const content = `# Title\n## Section 1\n### Subsection 1.1\n## Section 2`;
    const headings = content
      .split('\n')
      .filter((l) => l.startsWith('#'))
      .map((l) => {
        const level = l.match(/^#+/)?.[0].length || 1;
        const text = l.replace(/^#+\s*/, '');
        return { level, text };
      });

    expect(headings.length).toBe(4);
    expect(headings[0]).toEqual({ level: 1, text: 'Title' });
    expect(headings[1]).toEqual({ level: 2, text: 'Section 1' });
    expect(headings[2]).toEqual({ level: 3, text: 'Subsection 1.1' });
  });

  it('16. should handle empty content state without errors', () => {
    editor.push('');
    expect(editor.getCurrent()).toBe('');
    expect(editor.canUndo()).toBe(true);
  });
});
