// Notes feature module

let notes = [];
let noteEditor;
let editingNote = false;
let currentNoteId = null;

async function loadNotes() {
    notes = await apiGet('/api/notes');
    renderNotes();
}

function parseRichText(text, noteId = null) {
    if (!text) return '';
    let parsed = escHtml(text);

    // Remove ToastUI's backslash escapes for literal markdown characters
    parsed = parsed.replace(/\\([*~\[\]\-_`])/g, '$1');

    parsed = parsed.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
    parsed = parsed.replace(/~~([\s\S]*?)~~/g, '<del>$1</del>');

    let chkIdx = 0;
    parsed = parsed.replace(/^[-*] \[( |x|X)\] (.*)$/gm, (match, p1, p2) => {
        const isChecked = p1.toLowerCase() === 'x';
        const idx = chkIdx++;
        if (noteId) {
            return `<div style="display:flex;align-items:center;gap:8px;margin:2px 0;" onclick="event.stopPropagation()">
                <input type="checkbox" class="interactive-checkbox" ${isChecked ? 'checked' : ''} onchange="toggleNoteCheckbox('${noteId}', ${idx}, this.checked)">
                <span style="${isChecked ? 'text-decoration:line-through;color:var(--text-secondary);' : ''}word-break:break-word;">${p2}</span>
            </div>`;
        } else {
            return `<div style="display:flex;align-items:center;gap:8px;margin:2px 0;">
                <input type="checkbox" ${isChecked ? 'checked' : ''} disabled>
                <span style="${isChecked ? 'text-decoration:line-through;color:var(--text-secondary);' : ''}word-break:break-word;">${p2}</span>
            </div>`;
        }
    });
    return parsed;
}

window.toggleNoteCheckbox = async function (noteId, index, isChecked) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    let currIdx = 0;
    const newContent = note.content.replace(/^[-*] \[( |x|X)\] (.*)$/gm, (match, p1, p2) => {
        if (currIdx === index) {
            currIdx++;
            const marker = match.charAt(0);
            return isChecked ? `${marker} [x] ${p2}` : `${marker} [ ] ${p2}`;
        }
        currIdx++;
        return match;
    });

    if (newContent !== note.content) {
        note.content = newContent;
        renderNotes(); // Update UI immediately
        try {
            await apiPut(`/api/notes/${noteId}`, { title: note.title, content: newContent });
        } catch (err) {
            console.error('Failed to update checkbox', err);
        }
    }
};

function renderNotes() {
    const container = document.getElementById('notes-container');
    if (notes.length === 0) {
        container.innerHTML = `
            <div class="empty-state" id="empty-notes">
                <div class="empty-icon">${ICONS.noteLg}</div>
                <h3>No notes yet</h3>
                <p>Start journaling or jot down quick thoughts</p>
                <button class="btn btn-primary btn-glow btn-small" onclick="openAddNote()" style="margin-top:12px;">+ Write a Note</button>
            </div>`;
        return;
    }
    container.innerHTML = notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(note => `
        <div class="note-card" onclick="openEditNote('${note.id}')">
            <div class="note-card-header">
                <div class="note-card-title">${escHtml(note.title)}</div>
                <div class="note-card-actions">
                    <button class="btn-icon" title="Delete" aria-label="Delete note" onclick="event.stopPropagation(); deleteNote('${note.id}')">${ICONS.trash}</button>
                </div>
            </div>
            <div class="note-card-content">${parseRichText(note.content || '', note.id)}</div>
            <div class="note-card-date">${new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>
    `).join('');
}

function createNoteEditor(editorContainer) {
    const useDarkTheme = !settings || settings.theme !== 'light';

    editorContainer.classList.toggle('toastui-editor-dark', useDarkTheme);

    noteEditor = new window.toastui.Editor({
        el: editorContainer,
        initialEditType: 'wysiwyg',
        previewStyle: 'vertical',
        height: '400px',
        hideModeSwitch: true,
        ...(useDarkTheme ? { theme: 'dark' } : {}),
        toolbarItems: [
            ['heading', 'bold', 'italic', 'strike'],
            ['hr', 'quote'],
            ['ul', 'ol', 'task']
        ]
    });
}

window.syncNoteEditorTheme = function () {
    const editorContainer = document.querySelector('#note-editor-container');
    if (!editorContainer || !window.toastui || typeof window.toastui.Editor !== 'function') {
        return;
    }

    const markdown = noteEditor && typeof noteEditor.getMarkdown === 'function' ? noteEditor.getMarkdown() : '';

    if (noteEditor && typeof noteEditor.destroy === 'function') {
        noteEditor.destroy();
    }

    editorContainer.innerHTML = '';
    createNoteEditor(editorContainer);

    if (markdown && typeof noteEditor.setMarkdown === 'function') {
        noteEditor.setMarkdown(markdown);
    }
};

function initNoteModal() {
    const editorContainer = document.querySelector('#note-editor-container');

    if (window.toastui && typeof window.toastui.Editor === 'function') {
        createNoteEditor(editorContainer);
    } else {
        editorContainer.innerHTML = '<textarea id="note-editor-fallback" style="width:100%;min-height:400px;resize:vertical;border:0;background:transparent;color:inherit;font:inherit;padding:16px;box-sizing:border-box;outline:none;" placeholder="Write your note here..."></textarea>';
        const fallbackEditor = editorContainer.querySelector('#note-editor-fallback');
        noteEditor = {
            setMarkdown(value) {
                fallbackEditor.value = value || '';
            },
            getMarkdown() {
                return fallbackEditor.value;
            }
        };
    }

    document.getElementById('btn-add-note').addEventListener('click', openAddNote);
    document.getElementById('modal-note-close').addEventListener('click', closeNoteModal);
    document.getElementById('modal-note-cancel').addEventListener('click', closeNoteModal);
    document.getElementById('modal-note-save').addEventListener('click', saveNote);
    document.getElementById('modal-note').addEventListener('click', (e) => { if (e.target.classList.contains('modal-overlay')) closeNoteModal(); });
}

function openAddNote() {
    editingNote = false; currentNoteId = null;
    document.getElementById('modal-note-title').textContent = 'New Note';
    document.getElementById('note-title-input').value = '';
    noteEditor.setMarkdown('');
    document.getElementById('modal-note').classList.add('open');
    document.getElementById('note-title-input').focus();
}

function openEditNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    editingNote = true; currentNoteId = noteId;
    document.getElementById('modal-note-title').textContent = 'Edit Note';
    document.getElementById('note-title-input').value = note.title;
    noteEditor.setMarkdown(note.content || '');
    document.getElementById('modal-note').classList.add('open');
    document.getElementById('note-title-input').focus();
}

function closeNoteModal() { document.getElementById('modal-note').classList.remove('open'); }

async function saveNote() {
    const title = document.getElementById('note-title-input').value.trim();
    const content = noteEditor.getMarkdown();
    if (!title) { document.getElementById('note-title-input').focus(); return; }
    try {
        if (editingNote && currentNoteId) { await apiPut(`/api/notes/${currentNoteId}`, { title, content }); showToast('Note updated'); logSystemEvent('Note updated'); }
        else { await apiPost('/api/notes', { title, content }); showToast('Note created'); logSystemEvent('Note created'); }
        closeNoteModal();
        await loadNotes();
    } catch (err) {
        console.error('Failed to save note:', err);
        showToast('Failed to save note', 'error');
    }
}

function deleteNote(noteId) {
    showConfirmModal('Delete this note?', async () => { await apiDelete(`/api/notes/${noteId}`); await loadNotes(); showToast('Note deleted'); logSystemEvent('Note deleted'); });
}