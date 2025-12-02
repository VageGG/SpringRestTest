class AdminApp {
    constructor() {
        this.roles = [];
        this.users = [];
        this.deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
        this.editModal = new bootstrap.Modal(document.getElementById('editModal'));
        this.newModal = new bootstrap.Modal(document.getElementById('newModal'));

        this.init();
    }

    async init() {
        await this.loadRoles();
        await this.loadUsers();

        document.getElementById('nav-new').addEventListener('click', () => this.newModal.show());
        document.getElementById('newForm').addEventListener('submit', e => this.handleSubmit(e, 'new'));
        document.getElementById('editForm').addEventListener('submit', e => this.handleSubmit(e, 'edit'));
        document.getElementById('confirm-delete').addEventListener('click', () => this.deleteUser());

        this.renderRolesCheckboxes('#newRoles');
        this.renderRolesCheckboxes('#editRoles');
    }

    async loadRoles() {
        const res = await fetch('/api/roles');
        this.roles = await res.json();
    }

    async loadUsers() {
        const res = await fetch('/api/users');
        this.users = await res.json();
        this.renderUsersTable();
    }

    renderUsersTable() {
        const tbody = document.querySelector('#users-table tbody');
        tbody.innerHTML = '';
        this.users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.id}</td>
                <td>${u.name}</td>
                <td>${u.age}</td>
                <td>${u.email}</td>
                <td>${u.roles.join(', ')}</td>
                <td>
                    <button class="btn btn-sm btn-info edit-btn" data-id="${u.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${u.id}" data-name="${u.name}">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openEditModal(btn.dataset.id));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openDeleteModal(btn.dataset.id, btn.dataset.name));
        });
    }

    renderRolesCheckboxes(containerId) {
        const container = document.querySelector(containerId);
        container.innerHTML = this.roles.map(r => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" name="roles" value="${r.name}" id="${r.name}">
                <label class="form-check-label" for="${r.name}">${r.name.replace('ROLE_', '')}</label>
            </div>
        `).join('');
    }

    openDeleteModal(id, name) {
        document.getElementById('delete-user-id').value = id;
        document.getElementById('delete-username').textContent = name;
        this.deleteModal.show();
    }

    async deleteUser() {
        const id = document.getElementById('delete-user-id').value;
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
        this.deleteModal.hide();
        await this.loadUsers();
    }

    async openEditModal(id) {
        const res = await fetch(`/api/users/${id}`);
        const user = await res.json();

        const form = document.getElementById('editForm');
        form.id.value = user.id;
        form.name.value = user.name;
        form.age.value = user.age;
        form.email.value = user.email;
        form.password.value = '';

        this.roles.forEach(r => {
            document.getElementById(r.name).checked = user.roles.includes(r.name);
        });

        this.editModal.show();
    }

    async handleSubmit(e, type) {
        e.preventDefault();
        const form = e.target;
        const data = Object.fromEntries(new FormData(form).entries());
        data.roles = Array.from(form.querySelectorAll('input[name="roles"]:checked')).map(cb => cb.value);
        const url = type === 'edit' ? `/api/users/${data.id}` : '/api/users';
        const method = type === 'edit' ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (type === 'edit') this.editModal.hide();
        else this.newModal.hide();

        form.reset();
        await this.loadUsers();
    }
}

document.addEventListener('DOMContentLoaded', () => new AdminApp());
