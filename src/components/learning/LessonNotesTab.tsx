import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bold,
  Check,
  CheckSquare,
  Code,
  FileCode2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Pin,
  Plus,
  Search,
  StickyNote,
  Trash2,
  Underline,
} from 'lucide-react';
import type { LearningNote } from '../../types/learning';
import { learningApi } from '../../lib/learningApi';
import { useApp } from '../../lib/context';
import { ConfirmDeleteDialog } from './LearningShared';

function stripUnsafeTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

export const LessonNotesTab: React.FC<{
  lessonId: string;
  notes: LearningNote[];
}> = ({ lessonId, notes }) => {
  const { updateLearningData, showToast } = useApp();

  const [noteSearch, setNoteSearch] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes[0]?.id || null);
  const [draftTitle, setDraftTitle] = useState('');
  const [saveState, setSaveState] = useState<'saved' | 'dirty' | 'saving' | 'error'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [creatingNote, setCreatingNote] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<LearningNote | null>(null);
  const [deleting, setDeleting] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<number | null>(null);
  const activeDraftRef = useRef<{ noteId: string; title: string; html: string } | null>(null);
  const loadedNoteIdRef = useRef<string | null>(null);

  const filteredNotes = useMemo(() => {
    const q = noteSearch.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      n =>
        n.title.toLowerCase().includes(q) ||
        n.plainText.toLowerCase().includes(q)
    );
  }, [notes, noteSearch]);

  const activeNote = useMemo(
    () => notes.find(n => n.id === selectedNoteId) || filteredNotes[0] || notes[0] || null,
    [notes, filteredNotes, selectedNoteId]
  );

  useEffect(() => {
    if (!notes.length) {
      setSelectedNoteId(null);
      loadedNoteIdRef.current = null;
      activeDraftRef.current = null;
      return;
    }
    if (!selectedNoteId || !notes.some(n => n.id === selectedNoteId)) {
      setSelectedNoteId(notes[0].id);
    }
  }, [lessonId, notes, selectedNoteId]);

  const flushPendingSave = useCallback(
    async (explicitDraft?: { noteId: string; title: string; html: string }) => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      const target = explicitDraft || activeDraftRef.current;
      if (!target) return;

      const safeTitle = target.title.trim() || 'Untitled Note';
      const cleanedHtml = stripUnsafeTags(target.html);
      activeDraftRef.current = null;
      setSaveState('saving');

      try {
        const { note: saved } = await learningApi.updateNote(target.noteId, {
          title: safeTitle,
          contentHtml: cleanedHtml,
        });
        updateLearningData(prev => ({
          ...prev,
          notes: prev.notes.map(n => (n.id === saved.id ? saved : n)),
        }));
        setSaveState('saved');
        setLastSavedAt(saved.updatedAt);
      } catch (err: any) {
        setSaveState('error');
        showToast(err?.message || 'Failed to save note.', 'error');
      }
    },
    [showToast, updateLearningData]
  );

  useEffect(() => {
    if (!activeNote) {
      if (editorRef.current) editorRef.current.innerHTML = '';
      setDraftTitle('');
      loadedNoteIdRef.current = null;
      return;
    }

    if (loadedNoteIdRef.current !== activeNote.id) {
      if (activeDraftRef.current && activeDraftRef.current.noteId !== activeNote.id) {
        void flushPendingSave({ ...activeDraftRef.current });
      }
      loadedNoteIdRef.current = activeNote.id;
      setDraftTitle(activeNote.title);
      if (editorRef.current) {
        editorRef.current.innerHTML = activeNote.contentHtml || '<p></p>';
        editorRef.current.querySelectorAll('ul[data-type="checklist"] li').forEach(li => {
          const cb = li.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
          if (cb) {
            cb.checked = li.getAttribute('data-checked') === 'true';
          }
        });
      }
      setSaveState('saved');
      setLastSavedAt(activeNote.updatedAt);
    }
  }, [activeNote, flushPendingSave]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeDraftRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (activeDraftRef.current) {
        void flushPendingSave({ ...activeDraftRef.current });
      }
    };
  }, [flushPendingSave]);

  const scheduleAutoSave = useCallback(
    (noteId: string, nextTitle: string, nextHtml: string) => {
      activeDraftRef.current = { noteId, title: nextTitle, html: nextHtml };
      setSaveState('dirty');
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(() => {
        void flushPendingSave();
      }, 650);
    },
    [flushPendingSave]
  );

  const handleEditorInput = () => {
    if (!activeNote || !editorRef.current) return;
    editorRef.current.querySelectorAll('ul[data-type="checklist"] li').forEach(li => {
      const cb = li.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
      if (cb) {
        li.setAttribute('data-checked', cb.checked ? 'true' : 'false');
        if (cb.checked) cb.setAttribute('checked', 'checked');
        else cb.removeAttribute('checked');
      }
    });
    scheduleAutoSave(activeNote.id, draftTitle, editorRef.current.innerHTML);
  };

  const handleTitleChange = (val: string) => {
    setDraftTitle(val);
    if (!activeNote || !editorRef.current) return;
    scheduleAutoSave(activeNote.id, val, editorRef.current.innerHTML);
  };

  const handleCreateNote = async () => {
    if (activeDraftRef.current) {
      await flushPendingSave();
    }
    setCreatingNote(true);
    try {
      const { note } = await learningApi.createNote({
        lessonId,
        title: `Note ${notes.length + 1}`,
        contentHtml: '<p></p>',
      });
      updateLearningData(prev => ({
        ...prev,
        notes: [note, ...prev.notes],
      }));
      setSelectedNoteId(note.id);
      showToast('New note created');
    } catch (err: any) {
      showToast(err?.message || 'Failed to create note.', 'error');
    } finally {
      setCreatingNote(false);
    }
  };

  const handleTogglePin = async (note: LearningNote) => {
    try {
      const { note: updated } = await learningApi.updateNote(note.id, {
        isPinned: !note.isPinned,
      });
      updateLearningData(prev => ({
        ...prev,
        notes: prev.notes
          .map(n => (n.id === updated.id ? updated : n))
          .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.updatedAt.localeCompare(a.updatedAt)),
      }));
    } catch (err: any) {
      showToast(err?.message || 'Failed to update note.', 'error');
    }
  };

  const handleConfirmDeleteNote = async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      if (activeDraftRef.current?.noteId === deleteCandidate.id) {
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
        activeDraftRef.current = null;
      }
      await learningApi.deleteNote(deleteCandidate.id);
      updateLearningData(prev => ({
        ...prev,
        notes: prev.notes.filter(n => n.id !== deleteCandidate.id),
      }));
      setDeleteCandidate(null);
      showToast('Note deleted', 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete note.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const runFormat = (command: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const insertChecklistItem = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    const ul = document.createElement('ul');
    ul.setAttribute('data-type', 'checklist');
    const li = document.createElement('li');
    li.setAttribute('data-checked', 'false');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    const span = document.createElement('span');
    span.textContent = range.toString().trim() || 'Action item';
    li.appendChild(cb);
    li.appendChild(span);
    ul.appendChild(li);

    const after = document.createElement('p');
    after.innerHTML = '<br>';

    range.deleteContents();
    range.insertNode(after);
    range.insertNode(ul);

    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    newRange.collapse(false);
    sel.removeAllRanges();
    sel.addRange(newRange);
    handleEditorInput();
  };

  const insertCodeBlock = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const selectedText = range.toString();

    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = selectedText || '# Paste commands, code snippets, or exploit payloads here';
    pre.appendChild(code);

    const after = document.createElement('p');
    after.innerHTML = '<br>';

    range.deleteContents();
    range.insertNode(after);
    range.insertNode(pre);

    const newRange = document.createRange();
    newRange.selectNodeContents(code);
    newRange.collapse(false);
    sel.removeAllRanges();
    sel.addRange(newRange);
    handleEditorInput();
  };

  const insertInlineCode = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const text = range.toString() || 'code';
    const code = document.createElement('code');
    code.textContent = text;
    range.deleteContents();
    range.insertNode(code);
    const afterSpace = document.createTextNode('\u00A0');
    code.parentNode?.insertBefore(afterSpace, code.nextSibling);
    const newRange = document.createRange();
    newRange.setStartAfter(afterSpace);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
    handleEditorInput();
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (activeNote && editorRef.current) {
        void flushPendingSave({
          noteId: activeNote.id,
          title: draftTitle,
          html: editorRef.current.innerHTML,
        });
      }
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const anchorNode = sel.anchorNode;
    const anchorEl =
      anchorNode instanceof HTMLElement ? anchorNode : anchorNode?.parentElement || null;

    const preEl = anchorEl?.closest('pre');
    if (preEl) {
      if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertText', false, '  ');
        handleEditorInput();
        return;
      }
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        preEl.parentNode?.insertBefore(p, preEl.nextSibling);
        const r = document.createRange();
        r.setStart(p, 0);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
        handleEditorInput();
        return;
      }
    }

    const checklistLi = anchorEl?.closest('ul[data-type="checklist"] li');
    if (checklistLi && e.key === 'Enter') {
      e.preventDefault();
      const span = checklistLi.querySelector('span');
      const currentText = span?.textContent?.trim() || '';
      if (!currentText) {
        const ul = checklistLi.parentElement;
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        ul?.parentNode?.insertBefore(p, ul.nextSibling);
        checklistLi.remove();
        if (ul && ul.children.length === 0) ul.remove();
        const r = document.createRange();
        r.setStart(p, 0);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
      } else {
        const newLi = document.createElement('li');
        newLi.setAttribute('data-checked', 'false');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        const newSpan = document.createElement('span');
        newSpan.innerHTML = '<br>';
        newLi.appendChild(cb);
        newLi.appendChild(newSpan);
        checklistLi.parentNode?.insertBefore(newLi, checklistLi.nextSibling);
        const r = document.createRange();
        r.setStart(newSpan, 0);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
      }
      handleEditorInput();
    }
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
      const li = target.closest('li');
      const checked = (target as HTMLInputElement).checked;
      if (li) {
        li.setAttribute('data-checked', checked ? 'true' : 'false');
      }
      handleEditorInput();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left Notes Sidebar (4 cols) */}
      <div className="lg:col-span-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={noteSearch}
              onChange={e => setNoteSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-surface border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
            />
          </div>
          <button
            type="button"
            disabled={creatingNote}
            onClick={handleCreateNote}
            className="btn-press flex items-center gap-1.5 px-3 py-2 min-h-[38px] sm:min-h-0 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs shrink-0 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Note</span>
          </button>
        </div>

        <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
          {filteredNotes.length === 0 ? (
            <div className="p-6 rounded-2xl bg-surface border border-line text-center space-y-2">
              <StickyNote className="w-6 h-6 text-accent mx-auto opacity-80" />
              <p className="text-xs font-medium text-ink">
                {noteSearch ? 'No matching notes' : 'No notes in this lesson yet'}
              </p>
              {!noteSearch && (
                <button
                  type="button"
                  onClick={handleCreateNote}
                  className="btn-press text-xs font-semibold text-accent hover:underline"
                >
                  Create your first note
                </button>
              )}
            </div>
          ) : (
            filteredNotes.map(note => {
              const isSelected = activeNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedNoteId(note.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedNoteId(note.id);
                    }
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-colors group space-y-1.5 ${
                    isSelected
                      ? 'bg-brand border-brand text-brand-ink'
                      : 'bg-surface border-line text-ink hover:border-accent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold truncate">{note.title}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          void handleTogglePin(note);
                        }}
                        className={`p-1 rounded transition-colors ${
                          note.isPinned
                            ? 'text-accent'
                            : isSelected
                            ? 'text-brand-ink/70 hover:text-accent'
                            : 'text-ink-muted hover:text-accent'
                        }`}
                        title={note.isPinned ? 'Unpin note' : 'Pin note'}
                        aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setDeleteCandidate(note);
                        }}
                        className={`p-1 rounded transition-colors ${
                          isSelected
                            ? 'text-brand-ink/70 hover:text-brand-ink'
                            : 'text-ink-muted hover:text-danger'
                        }`}
                        title="Delete note"
                        aria-label="Delete note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p
                    className={`text-[11px] line-clamp-2 leading-relaxed ${
                      isSelected ? 'text-brand-ink/80' : 'text-ink-muted'
                    }`}
                  >
                    {note.plainText || 'Empty note — click to start writing...'}
                  </p>
                  <div
                    className={`text-[10px] font-mono tabular-nums ${
                      isSelected ? 'text-accent' : 'text-ink-muted'
                    }`}
                  >
                    Updated {new Date(note.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Rich-Text Note Editor (8 cols) */}
      <div className="lg:col-span-8">
        {activeNote ? (
          <div className="rounded-2xl bg-surface border border-line overflow-hidden flex flex-col">
            {/* Title & Auto-Save Status Bar */}
            <div className="px-5 py-3.5 border-b border-line bg-surface-warm flex flex-wrap items-center justify-between gap-3">
              <input
                type="text"
                value={draftTitle}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Note title..."
                className="flex-1 min-w-[200px] bg-transparent border-0 text-base font-bold text-ink placeholder:text-ink-muted focus:outline-hidden"
              />
              <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
                {saveState === 'saving' && (
                  <span className="flex items-center gap-1 text-accent">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving...
                  </span>
                )}
                {saveState === 'dirty' && (
                  <span className="text-warning">Unsaved edits...</span>
                )}
                {saveState === 'error' && (
                  <button
                    type="button"
                    onClick={() => void flushPendingSave()}
                    className="text-danger underline font-semibold"
                  >
                    Retry save
                  </button>
                )}
                {saveState === 'saved' && (
                  <span className="flex items-center gap-1 text-success">
                    <Check className="w-3 h-3" />
                    Saved
                    {lastSavedAt
                      ? ` · ${new Date(lastSavedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Formatting Toolbar */}
            <div className="px-4 py-2 border-b border-line bg-canvas flex flex-wrap items-center gap-1">
              {[
                { label: 'H1', title: 'Heading 1', Icon: Heading1, action: () => runFormat('formatBlock', 'H1') },
                { label: 'H2', title: 'Heading 2', Icon: Heading2, action: () => runFormat('formatBlock', 'H2') },
                { label: 'H3', title: 'Subheading', Icon: Heading3, action: () => runFormat('formatBlock', 'H3') },
              ].map(btn => (
                <button
                  key={btn.label}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={btn.action}
                  title={btn.title}
                  aria-label={btn.title}
                  className="btn-press p-1.5 rounded-md text-ink hover:bg-surface border border-transparent hover:border-line transition-colors"
                >
                  <btn.Icon className="w-3.5 h-3.5" />
                </button>
              ))}

              <span className="w-px h-4 bg-line mx-1" aria-hidden="true" />

              {[
                { title: 'Bold (Ctrl+B)', Icon: Bold, action: () => runFormat('bold') },
                { title: 'Italic (Ctrl+I)', Icon: Italic, action: () => runFormat('italic') },
                { title: 'Underline (Ctrl+U)', Icon: Underline, action: () => runFormat('underline') },
              ].map(btn => (
                <button
                  key={btn.title}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={btn.action}
                  title={btn.title}
                  aria-label={btn.title}
                  className="btn-press p-1.5 rounded-md text-ink hover:bg-surface border border-transparent hover:border-line transition-colors"
                >
                  <btn.Icon className="w-3.5 h-3.5" />
                </button>
              ))}

              <span className="w-px h-4 bg-line mx-1" aria-hidden="true" />

              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => runFormat('insertUnorderedList')}
                title="Bulleted list"
                aria-label="Bulleted list"
                className="btn-press p-1.5 rounded-md text-ink hover:bg-surface border border-transparent hover:border-line transition-colors"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => runFormat('insertOrderedList')}
                title="Numbered list"
                aria-label="Numbered list"
                className="btn-press p-1.5 rounded-md text-ink hover:bg-surface border border-transparent hover:border-line transition-colors"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={insertChecklistItem}
                title="Insert Checklist"
                className="btn-press flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-ink hover:bg-surface border border-transparent hover:border-line transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5 text-accent" />
                <span>Checklist</span>
              </button>

              <span className="w-px h-4 bg-line mx-1" aria-hidden="true" />

              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={insertInlineCode}
                title="Inline Code"
                aria-label="Inline Code"
                className="btn-press p-1.5 rounded-md text-ink hover:bg-surface border border-transparent hover:border-line transition-colors"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={insertCodeBlock}
                title="Code Block (Shift+Enter to exit)"
                className="btn-press flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-ink hover:bg-surface border border-transparent hover:border-line transition-colors"
              >
                <FileCode2 className="w-3.5 h-3.5 text-accent" />
                <span>Code Block</span>
              </button>
            </div>

            {/* Editable Canvas */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              onKeyDown={handleEditorKeyDown}
              onClick={handleEditorClick}
              onBlur={() => {
                if (activeDraftRef.current) {
                  void flushPendingSave();
                }
              }}
              className="learning-note-editor min-h-[380px] p-5 bg-surface overflow-y-auto"
              aria-label="Lesson note rich text editor"
            />

            <div className="px-4 py-2 border-t border-line bg-surface-warm text-[11px] text-ink-muted flex flex-wrap items-center justify-between gap-2">
              <span>Auto-save enabled · Inside code blocks press Tab to indent and Shift+Enter to exit.</span>
              <span className="font-mono">Ctrl/Cmd + S to save now</span>
            </div>
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-surface border border-line text-center space-y-3">
            <StickyNote className="w-8 h-8 text-accent mx-auto opacity-80" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-ink">Capture Structured Study Notes</h3>
              <p className="text-xs text-ink-muted max-w-md mx-auto">
                Write lecture summaries, interactive checklists, and technical code blocks with automatic saving.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateNote}
              className="btn-press inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create First Note</span>
            </button>
          </div>
        )}
      </div>

      <ConfirmDeleteDialog
        isOpen={Boolean(deleteCandidate)}
        title="Delete Note"
        description={`Are you sure you want to permanently delete "${deleteCandidate?.title || ''}"? This cannot be undone.`}
        busy={deleting}
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={handleConfirmDeleteNote}
      />
    </div>
  );
};
