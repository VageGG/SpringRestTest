async function loadCurrentUser() {
    const response = await fetch("/api/auth/user");
    const user = await response.json();

    document.getElementById("current-username").textContent = user.email;
    document.getElementById("current-roles").textContent = user.roles.map(r => r.replace("ROLE_", "")).join(", ");

    const tbody = document.querySelector("#user-table tbody");

    tbody.innerHTML = `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.age}</td>
            <td>${user.email}</td>
            <td>${user.roles.map(r => r.replace("ROLE_", "")).join(", ")}</td>
        </tr>
    `;
}

document.addEventListener("DOMContentLoaded", loadCurrentUser);
