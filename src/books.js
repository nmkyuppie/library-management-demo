import { getBooks, getBookById, addBook, updateBook, deleteBook, saveBooks } from './db.js';

document.addEventListener('DOMContentLoaded', () => {
    // ── Auth ────────────────────────────────────
    if (!sessionStorage.getItem('library_logged_in_user')) { window.location.href = '/'; return; }
    document.getElementById('logout-btn')?.addEventListener('click', e => {
        e.preventDefault();
        sessionStorage.removeItem('library_logged_in_user');
        window.location.href = '/';
    });

    // ── State ───────────────────────────────────
    let currentPage = 1;
    const PAGE_SIZE = 5;
    let searchQuery = '';
    let sortCol = '';
    let sortDir = 'asc';
    let selectedIds = new Set();
    let pendingDeleteId = null;
    let isEditing = false;

    // ── DOM refs ────────────────────────────────
    const tbody = document.getElementById('books-tbody');
    const spinner = document.getElementById('table-spinner');
    const tableWrap = document.getElementById('table-wrap');
    const dialog = document.getElementById('delete-dialog');
    const bulkBar = document.getElementById('bulk-bar');
    const form = document.getElementById('book-form');

    // ── Populate author autocomplete (Feature #12) ──
    function refreshDatalist() {
        const dl = document.getElementById('author-suggestions');
        if (!dl) return;
        const authors = [...new Set(getBooks().map(b => b.author))];
        dl.innerHTML = authors.map(a => `<option value="${a}">`).join('');
    }

    // ── Tabs (Feature #10 - reuse for in-page tabs) ─
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
            if (btn.dataset.tab === 'reorder') renderDragList();
        });
    });

    // ── Search (Feature #2) ─────────────────────
    document.getElementById('book-search').addEventListener('input', e => {
        searchQuery = e.target.value.trim();
        currentPage = 1;
        selectedIds.clear();
        renderTable();
    });

    // ── Sort headers (Feature #4) ───────────────
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.sort;
            if (sortCol === col) {
                sortDir = sortDir === 'asc' ? 'desc' : 'asc';
            } else {
                sortCol = col;
                sortDir = 'asc';
            }
            currentPage = 1;
            renderTable();
            // Update header UI
            document.querySelectorAll('th.sortable').forEach(h => {
                h.classList.remove('sort-asc', 'sort-desc');
                h.querySelector('.sort-icon').textContent = '↕';
            });
            th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
            th.querySelector('.sort-icon').textContent = sortDir === 'asc' ? '↑' : '↓';
        });
    });

    // ── Select All (Feature #3) ─────────────────
    document.getElementById('select-all').addEventListener('change', e => {
        const visibleIds = getPageBooks().map(b => b.id);
        if (e.target.checked) visibleIds.forEach(id => selectedIds.add(id));
        else visibleIds.forEach(id => selectedIds.delete(id));
        document.querySelectorAll('.book-checkbox').forEach(cb => cb.checked = e.target.checked);
        updateBulkBar();
    });

    // ── Bulk Delete ─────────────────────────────
    document.getElementById('bulk-delete-btn').addEventListener('click', () => {
        if (!selectedIds.size) return;
        pendingDeleteId = [...selectedIds].join(',');
        document.getElementById('dialog-book-title').textContent = `${selectedIds.size} selected book(s)`;
        dialog.showModal();
    });

    document.getElementById('clear-selection-btn').addEventListener('click', () => {
        selectedIds.clear();
        updateBulkBar();
        renderTable();
    });

    // ── Pagination (Feature #1) ─────────────────
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; renderTable(); }
    });
    document.getElementById('next-page').addEventListener('click', () => {
        const total = getFilteredBooks().length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        if (currentPage < totalPages) { currentPage++; renderTable(); }
    });

    // ── Dialog buttons (Feature #7) ────────────
    document.getElementById('dialog-cancel').addEventListener('click', () => {
        pendingDeleteId = null;
        dialog.close();
    });
    document.getElementById('dialog-confirm').addEventListener('click', () => {
        if (pendingDeleteId !== null) {
            const ids = String(pendingDeleteId).split(',').map(Number);
            ids.forEach(id => { deleteBook(id); selectedIds.delete(id); });
            pendingDeleteId = null;
        }
        dialog.close();
        refreshDatalist();
        renderTable();
        if (document.getElementById('tab-reorder').classList.contains('active')) renderDragList();
    });

    // ── Helpers ─────────────────────────────────
    function getFilteredBooks() {
        let books = getBooks();
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            books = books.filter(b =>
                b.title.toLowerCase().includes(q) ||
                b.author.toLowerCase().includes(q) ||
                (b.genre || '').toLowerCase().includes(q)
            );
        }
        if (sortCol) {
            books.sort((a, b) => {
                const av = (a[sortCol] || '').toString().toLowerCase();
                const bv = (b[sortCol] || '').toString().toLowerCase();
                return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
            });
        }
        return books;
    }

    function getPageBooks() {
        const all = getFilteredBooks();
        const start = (currentPage - 1) * PAGE_SIZE;
        return all.slice(start, start + PAGE_SIZE);
    }

    function updateBulkBar() {
        const n = selectedIds.size;
        if (n > 0) {
            bulkBar.classList.add('visible');
            document.getElementById('selected-count').textContent = `${n} book${n > 1 ? 's' : ''} selected`;
        } else {
            bulkBar.classList.remove('visible');
        }
    }

    // ── Render Table ────────────────────────────
    function renderTable() {
        spinner.style.display = 'flex';
        tableWrap.style.display = 'none';

        setTimeout(() => {
            spinner.style.display = 'none';
            tableWrap.style.display = '';

            tbody.innerHTML = '';
            const allFiltered = getFilteredBooks();
            const total = allFiltered.length;
            const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
            if (currentPage > totalPages) currentPage = totalPages;

            const pageBooks = getPageBooks();
            document.getElementById('total-count').textContent = `${total} book${total !== 1 ? 's' : ''}`;
            document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
            document.getElementById('prev-page').disabled = currentPage <= 1;
            document.getElementById('next-page').disabled = currentPage >= totalPages;

            if (!pageBooks.length) {
                tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state" style="padding:2rem;">
                    <i class="ph ph-books"></i><p>No books found${searchQuery ? ' for "' + searchQuery + '"' : ''}.</p>
                </div></td></tr>`;
            } else {
                pageBooks.forEach(book => {
                    const tags = (book.tags || []);
                    const tagsHtml = tags.length
                        ? tags.map(t => `<span class="badge badge-viewer" style="margin:0.1rem;">${t}</span>`).join('')
                        : '<span style="color:var(--text-light)">—</span>';
                    const isChecked = selectedIds.has(book.id);
                    const tr = document.createElement('tr');
                    tr.setAttribute('data-testid', `book-row-${book.id}`);
                    tr.innerHTML = `
                        <td><input type="checkbox" class="book-checkbox" data-id="${book.id}"
                            data-testid="book-checkbox-${book.id}" ${isChecked ? 'checked' : ''}></td>
                        <td>
                            <a href="/book-detail.html?id=${book.id}" target="_blank"
                                data-testid="book-link-${book.id}"
                                style="color:var(--text-dark);font-weight:600;text-decoration:none;display:flex;align-items:center;gap:0.4rem;">
                                ${book.title}
                                <i class="ph ph-arrow-square-out" style="color:var(--text-light);font-size:0.85rem;"></i>
                            </a>
                        </td>
                        <td style="color:var(--text-mid);">${book.author}</td>
                        <td><span class="badge badge-editor">${book.genre}</span></td>
                        <td style="font-size:0.8rem;">${tagsHtml}</td>
                        <td style="color:var(--text-mid);">${book.published}</td>
                        <td>
                            <div class="actions">
                                <button class="btn btn-edit edit-book-btn" data-id="${book.id}"
                                    data-testid="edit-book-${book.id}" title="Edit">
                                    <i class="ph ph-pencil-simple"></i>
                                </button>
                                <button class="btn btn-danger remove-book-btn" data-id="${book.id}"
                                    data-testid="remove-book-${book.id}" title="Delete">
                                    <i class="ph ph-trash"></i>
                                </button>
                            </div>
                        </td>`;
                    tbody.appendChild(tr);
                });
            }

            // Select-all checkbox state
            const selectAll = document.getElementById('select-all');
            const pageBooks2 = pageBooks;
            if (pageBooks2.length) {
                const allChk = pageBooks2.every(b => selectedIds.has(b.id));
                const someChk = pageBooks2.some(b => selectedIds.has(b.id));
                selectAll.checked = allChk;
                selectAll.indeterminate = !allChk && someChk;
            } else {
                selectAll.checked = false;
                selectAll.indeterminate = false;
            }

            // Row listeners
            document.querySelectorAll('.book-checkbox').forEach(cb => {
                cb.addEventListener('change', e => {
                    const id = parseInt(e.target.dataset.id);
                    if (e.target.checked) selectedIds.add(id);
                    else selectedIds.delete(id);
                    updateBulkBar();
                    const vis = getPageBooks();
                    const a = vis.every(b => selectedIds.has(b.id));
                    const s = vis.some(b => selectedIds.has(b.id));
                    selectAll.checked = a;
                    selectAll.indeterminate = !a && s;
                });
            });

            document.querySelectorAll('.remove-book-btn').forEach(btn => {
                btn.addEventListener('click', e => {
                    pendingDeleteId = e.currentTarget.dataset.id;
                    const bk = getBookById(pendingDeleteId);
                    document.getElementById('dialog-book-title').textContent = `"${bk?.title || ''}"`;
                    dialog.showModal();
                });
            });

            document.querySelectorAll('.edit-book-btn').forEach(btn => {
                btn.addEventListener('click', e => {
                    const bk = getBookById(e.currentTarget.dataset.id);
                    if (bk) populateForm(bk);
                });
            });
        }, 600); // Simulated load delay — Feature #6
    }

    // ── Drag & Drop Reorder (Feature #11) ──────
    let dragSrc = null;

    function renderDragList() {
        const list = document.getElementById('drag-list');
        if (!list) return;
        list.innerHTML = '';
        const books = getBooks();
        books.forEach((book, idx) => {
            const li = document.createElement('li');
            li.className = 'drag-item';
            li.setAttribute('draggable', 'true');
            li.setAttribute('data-id', book.id);
            li.setAttribute('data-testid', `drag-item-${book.id}`);
            li.innerHTML = `
                <i class="ph ph-dots-six-vertical drag-handle"></i>
                <span class="drag-order">${idx + 1}</span>
                <div class="drag-info">
                    <div class="drag-title">${book.title}</div>
                    <div class="drag-author">${book.author} &bull; ${book.genre}</div>
                </div>
                <span class="badge badge-editor">${book.genre}</span>`;

            li.addEventListener('dragstart', e => {
                dragSrc = li;
                li.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            li.addEventListener('dragend', () => {
                li.classList.remove('dragging');
                list.querySelectorAll('.drag-item').forEach(i => i.classList.remove('drag-over'));
                // Refresh order numbers
                list.querySelectorAll('.drag-item').forEach((item, i) => {
                    item.querySelector('.drag-order').textContent = i + 1;
                });
            });
            li.addEventListener('dragover', e => {
                e.preventDefault();
                if (li !== dragSrc) {
                    list.querySelectorAll('.drag-item').forEach(i => i.classList.remove('drag-over'));
                    li.classList.add('drag-over');
                }
            });
            li.addEventListener('drop', e => {
                e.preventDefault();
                if (dragSrc && dragSrc !== li) {
                    const items = [...list.querySelectorAll('.drag-item')];
                    const srcIdx = items.indexOf(dragSrc);
                    const tgtIdx = items.indexOf(li);
                    if (srcIdx < tgtIdx) li.after(dragSrc);
                    else li.before(dragSrc);
                }
                li.classList.remove('drag-over');
            });

            list.appendChild(li);
        });
    }

    document.getElementById('save-order-btn')?.addEventListener('click', () => {
        const items = document.querySelectorAll('#drag-list .drag-item');
        const orderedIds = [...items].map(i => parseInt(i.dataset.id));
        const allBooks = getBooks();
        const reordered = orderedIds.map(id => allBooks.find(b => b.id === id)).filter(Boolean);
        saveBooks(reordered);
        alert('Book order saved successfully!');
    });

    // ── Form Populate (Edit) ────────────────────
    function populateForm(book) {
        isEditing = true;
        document.getElementById('form-title').textContent = 'Edit Book';
        document.getElementById('book-id').value = book.id;
        document.getElementById('book-title').value = book.title;
        document.getElementById('book-author').value = book.author;
        document.getElementById('book-genre').value = book.genre;
        document.getElementById('book-published').value = book.published;
        // Multi-select tags
        const tagSel = document.getElementById('book-tags');
        [...tagSel.options].forEach(opt => { opt.selected = (book.tags || []).includes(opt.value); });
        document.getElementById('book-submit-btn').innerHTML = '<i class="ph ph-floppy-disk"></i> Update Book';
        document.getElementById('book-cancel-btn').style.display = 'block';
        // Switch to Manage tab
        document.querySelector('[data-tab="manage"]').click();
        form.scrollIntoView({ behavior: 'smooth' });
    }

    function resetForm() {
        isEditing = false;
        form.reset();
        document.getElementById('form-title').textContent = 'Add a Book';
        document.getElementById('book-id').value = '';
        document.getElementById('book-submit-btn').innerHTML = '<i class="ph ph-plus"></i> Add Book';
        document.getElementById('book-cancel-btn').style.display = 'none';
        // Clear multi-select
        [...document.getElementById('book-tags').options].forEach(o => o.selected = false);
    }

    // ── Form Submit ─────────────────────────────
    form.addEventListener('submit', e => {
        e.preventDefault();
        const id = document.getElementById('book-id').value;
        const title = document.getElementById('book-title').value.trim();
        const author = document.getElementById('book-author').value.trim();
        const genre = document.getElementById('book-genre').value;
        const published = document.getElementById('book-published').value;
        const tagSel = document.getElementById('book-tags');
        const tags = [...tagSel.options].filter(o => o.selected).map(o => o.value);

        if (!title || title.length < 2) { alert('Title must be at least 2 characters.'); return; }
        if (!author || author.length < 2) { alert('Author must be at least 2 characters.'); return; }
        if (!/^[a-zA-Z\s\.]+$/.test(author)) { alert('Author name may contain letters, spaces and periods only.'); return; }
        if (!genre) { alert('Please select a genre.'); return; }
        if (!published) { alert('Please select a published date.'); return; }

        if (isEditing) {
            updateBook({ id, title, author, genre, published, tags });
            alert('Book details successfully updated!');
        } else {
            addBook({ title, author, genre, published, tags });
            alert('New book successfully added to the library!');
        }
        resetForm();
        refreshDatalist();
        renderTable();
        if (document.getElementById('tab-reorder').classList.contains('active')) renderDragList();
    });

    document.getElementById('book-cancel-btn').addEventListener('click', resetForm);

    // ── Init ────────────────────────────────────
    refreshDatalist();
    renderTable();
});
