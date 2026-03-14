import { getUsers, getUserById, addUser, updateUser, deleteUser } from './db.js';

document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = sessionStorage.getItem('library_logged_in_user');
    if (!loggedInUser) { window.location.href = './index.html'; return; }

    document.getElementById('logout-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('library_logged_in_user');
        window.location.href = './index.html';
    });

    const tbody = document.getElementById('users-tbody');
    const iframe = document.getElementById('user-detail-iframe');
    const form = document.getElementById('user-form');
    const photoInput = document.getElementById('user-photo');
    const photoData = document.getElementById('user-photo-data');
    const photoPreview = document.getElementById('photo-preview');
    const photoWrap = document.querySelector('[data-testid="photo-upload-wrap"]');

    // ── Photo Upload Logic (Feature #9) ────────
    if (photoInput) {
        photoInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB'); return; }
                const reader = new FileReader();
                reader.onload = ev => {
                    const b64 = ev.target.result;
                    photoData.value = b64;
                    photoPreview.src = b64;
                    photoPreview.style.display = 'block';
                    photoWrap.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });

        // Click preview to change photo
        photoPreview.addEventListener('click', () => {
            photoInput.click();
        });
    }
    let isEditing = false;

    const ROLE_BADGE = {
        admin: 'badge-admin',
        editor: 'badge-editor',
        viewer: 'badge-viewer',
    };
    const ROLE_ICON = {
        admin: 'ph-crown',
        editor: 'ph-pencil-simple',
        viewer: 'ph-eye',
    };

    // ── Render Table ──────────────────────────
    function renderTable() {
        if (!tbody) return;
        tbody.innerHTML = '';
        const users = getUsers();
        if (!users.length) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-state" style="padding:2rem;">
                <i class="ph ph-users-three"></i><p>No users found.</p></td></tr>`;
            return;
        }
        users.forEach(user => {
            const badgeClass = ROLE_BADGE[user.role] || 'badge-viewer';
            const iconClass = ROLE_ICON[user.role] || 'ph-eye';
            const tr = document.createElement('tr');
            tr.setAttribute('data-testid', `user-row-${user.id}`);
            tr.innerHTML = `
                <td>
                    <div style="display:flex;align-items:center;gap:0.75rem;">
                        ${user.photo
                    ? `<img src="${user.photo}" alt="${user.name}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;">`
                    : `<div style="width:36px;height:36px;border-radius:50%;background:var(--black);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="ph-fill ph-user" style="color:var(--primary);font-size:1rem;"></i></div>`
                }
                        <span style="font-weight:600;">${user.name}</span>
                    </div>
                </td>
                <td style="color:var(--text-mid);">${user.email}</td>
                <td>
                    <span class="badge ${badgeClass}">
                        <i class="ph ${iconClass}"></i> ${user.role}
                    </span>
                </td>
                <td>
                    <div class="actions">
                        <button class="btn btn-view view-user-btn" data-id="${user.id}" data-testid="view-user-${user.id}" title="View in iframe">
                            <i class="ph ph-eye"></i>
                        </button>
                        <button class="btn btn-edit edit-user-btn" data-id="${user.id}" data-testid="edit-user-${user.id}" title="Edit user">
                            <i class="ph ph-pencil-simple"></i>
                        </button>
                        <button class="btn btn-danger delete-user-btn" data-id="${user.id}" data-testid="delete-user-${user.id}" title="Delete user">
                            <i class="ph ph-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.view-user-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                if (iframe) iframe.src = `/user-detail.html?id=${e.currentTarget.dataset.id}`;
            });
        });

        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const user = getUserById(e.currentTarget.dataset.id);
                if (user) populateForm(user);
            });
        });

        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const userId = e.currentTarget.dataset.id;
                const current = JSON.parse(sessionStorage.getItem('library_logged_in_user'));
                if (current && current.id === parseInt(userId)) {
                    alert('You cannot delete your own account while logged in.');
                    return;
                }
                if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                    deleteUser(userId);
                    renderTable();
                }
            });
        });
    }

    // ── Populate form ─────────────────────────
    function populateForm(user) {
        isEditing = true;
        document.getElementById('user-form-title').innerHTML = 'Edit Admin User';
        document.getElementById('user-id').value = user.id;
        document.getElementById('user-name').value = user.name;
        document.getElementById('user-email').value = user.email;
        document.getElementById('user-password').value = user.password;

        if (user.photo) {
            photoData.value = user.photo;
            photoPreview.src = user.photo;
            photoPreview.style.display = 'block';
            photoWrap.style.display = 'none';
        } else {
            photoData.value = '';
            photoPreview.style.display = 'none';
            photoWrap.style.display = 'block';
        }

        const radio = document.querySelector(`input[name="user-role"][value="${user.role}"]`);
        if (radio) radio.checked = true;
        document.getElementById('user-submit-btn').innerHTML = '<i class="ph ph-floppy-disk"></i> Update User';
        document.getElementById('user-cancel-btn').style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth' });
    }

    // ── Reset form ────────────────────────────
    function resetForm() {
        isEditing = false;
        form.reset();
        document.getElementById('user-form-title').innerHTML = 'Add Admin User';
        document.getElementById('user-id').value = '';
        photoData.value = '';
        photoPreview.style.display = 'none';
        photoWrap.style.display = 'block';
        document.getElementById('user-submit-btn').innerHTML = '<i class="ph ph-plus"></i> Add User';
        document.getElementById('user-cancel-btn').style.display = 'none';
        document.getElementById('role-admin').checked = true;
    }

    // ── Submit ────────────────────────────────
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const id = document.getElementById('user-id').value;
            const name = document.getElementById('user-name').value.trim();
            const email = document.getElementById('user-email').value.trim();
            const password = document.getElementById('user-password').value;
            const photo = document.getElementById('user-photo-data').value;
            const role = document.querySelector('input[name="user-role"]:checked').value;

            if (!name || name.length < 2) { alert('Full Name must be at least 2 characters.'); return; }
            if (!/^[a-zA-Z\s]+$/.test(name)) { alert('Full Name must contain letters and spaces only.'); return; }
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alert('Please enter a valid email address.'); return; }
            if (!password || password.length < 5) { alert('Password must be at least 5 characters.'); return; }

            const duplicate = getUsers().find(u => u.email === email && u.id !== parseInt(id));
            if (duplicate) { alert(`The email "${email}" is already in use by another user.`); return; }

            if (isEditing) {
                updateUser({ id, name, email, password, role, photo });
                alert('User details successfully updated!');
            } else {
                addUser({ name, email, password, role, photo });
                alert('New admin user successfully added!');
            }
            resetForm();
            renderTable();
        });

        document.getElementById('user-cancel-btn').addEventListener('click', resetForm);
    }

    renderTable();
});
