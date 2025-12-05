class AdminApp {
    constructor() {
        this.API_BASE = "http://localhost:8080";
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
        setInterval(() => this.reloadUsers(), 5000);
    }

    async reloadUsers() {
        await this.loadUsers(); // обновляем список пользователей
    }

    async loadRoles() {
        const res = await fetch(`${this.API_BASE}/api/roles`);
        this.roles = await res.json();
    }

    async loadUsers() {
        const res = await fetch(`${this.API_BASE}/api/users`);
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
                <td>${u.roles.map(r => r.replace("ROLE_", "")).join(', ')}</td>
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
                <input class="form-check-input" type="checkbox" name="roles" value="${r.name}" id="${containerId.substring(1)}-${r.name}">
                <label class="form-check-label" for="${containerId.substring(1)}-${r.name}">${r.name.replace('ROLE_', '')}</label>
            </div>
        `).join('');
    }

    async openDeleteModal(id, name) {
        const res = await fetch(`${this.API_BASE}/api/users/${id}`);
        const user = await res.json();

        document.getElementById('delete-user-id').value = user.id;
        document.getElementById('delete-name').textContent = user.name;
        document.getElementById('delete-age').textContent = user.age;
        document.getElementById('delete-email').textContent = user.email;

        const rolesDiv = document.getElementById('delete-roles');
        rolesDiv.innerHTML = this.roles.map(r => `
        <div class="form-check">
            <input class="form-check-input" type="checkbox" 
                   ${user.roles.includes(r.name) ? 'checked' : ''} 
                   disabled>
            <label class="form-check-label">${r.name.replace('ROLE_', '')}</label>
        </div>
    `).join('');

        this.deleteModal.show();
    }

    async deleteUser() {
        const id = document.getElementById('delete-user-id').value;
        await fetch(`${this.API_BASE}/api/users/${id}`, { method: 'DELETE' });
        this.deleteModal.hide();
        await this.loadUsers();
    }

    async openEditModal(id) {
        const res = await fetch(`${this.API_BASE}/api/users/${id}`);
        const user = await res.json();

        const form = document.getElementById('editForm');
        form.querySelector('input[name="id"]').value = user.id;
        form.name.value = user.name;
        form.age.value = user.age;
        form.email.value = user.email;
        form.password.value = '';

        this.roles.forEach(r => {
            const cb = document.getElementById(`editRoles-${r.name}`);
            if (cb) cb.checked = user.roles.includes(r.name);
        });

        this.editModal.show();
    }


    async handleSubmit(e, type) {
        e.preventDefault();
        const form = e.target;
        const data = Object.fromEntries(new FormData(form).entries());
        data.roles = Array.from(form.querySelectorAll('input[name="roles"]:checked')).map(cb => cb.value);

        // Проверка, что выбрана хотя бы одна роль
        if (data.roles.length === 0) {
            const globalErrorId = type === 'edit' ? '#editGlobalError' : '#newGlobalError';
            const globalError = form.querySelector(globalErrorId);
            if (globalError) {
                globalError.textContent = "At least one role must be selected!";
                globalError.classList.remove('d-none');
            }
            return;
        }

        const url = type === 'edit'
            ? `${this.API_BASE}/api/users/${data.id}`
            : `${this.API_BASE}/api/users`;
        const method = type === 'edit' ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            // Если есть ошибка с кодом HTTP
            if (!res.ok) {
                let errorData;
                try {
                    errorData = await res.json();
                    console.log('Server returned error:', errorData);
                } catch {
                    errorData = { message: "Unknown error occurred" };
                }

                // Сброс всех предыдущих ошибок
                form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
                form.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
                form.querySelectorAll('.alert').forEach(el => el.classList.add('d-none'));

                // Ошибки по полям (validation)
                if (errorData.errors) {
                    for (const [field, message] of Object.entries(errorData.errors)) {
                        const input = form.querySelector(`[name="${field}"]`);
                        if (input) {
                            input.classList.add('is-invalid');
                            input.nextElementSibling.textContent = message;
                        }
                    }
                }

                // Глобальная ошибка (например, email уже существует)
                const globalErrorId = type === 'edit' ? '#editGlobalError' : '#newGlobalError';
                const globalError = form.querySelector(globalErrorId);
                if (globalError && errorData.message) {
                    globalError.textContent = errorData.message;
                    globalError.classList.remove('d-none');
                }

                return;
            }

            // Успешное создание или редактирование
            if (type === 'edit') this.editModal.hide();
            else this.newModal.hide();

            form.reset();
            await this.loadUsers();

        } catch (err) {
            console.error(err);
            const globalErrorId = type === 'edit' ? '#editGlobalError' : '#newGlobalError';
            const globalError = form.querySelector(globalErrorId);
            if (globalError) {
                globalError.textContent = "Network or server error occurred.";
                globalError.classList.remove('d-none');
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new AdminApp());

async function loadCurrentUser() {
    const API_BASE = "http://localhost:8080";
    const response = await fetch(`${API_BASE}/api/auth/user`);
    const user = await response.json();

    document.getElementById("current-username").textContent = user.email;
    document.getElementById("current-roles").textContent = user.roles.map(r => r.replace("ROLE_", "")).join(", ");
}

document.addEventListener("DOMContentLoaded", loadCurrentUser);

setInterval(loadCurrentUser, 5000);