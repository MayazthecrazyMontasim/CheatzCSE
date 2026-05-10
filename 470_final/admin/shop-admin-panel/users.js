async function loadUsers() {

  const response = await fetch("/api/users");

  const users = await response.json();

  const table = document.getElementById("usersTable");

  table.innerHTML = "";

  users.forEach(user => {

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${user.email || "No Email"}</td>

      <td>${user._id}</td>

      <td>

        <button onclick="deleteUser('${user._id}')">
          Delete Account
        </button>

        <button onclick="deletePayments('${user.email}')">
          Delete Payments
        </button>

      </td>
    `;

    table.appendChild(row);
  });
}

async function deleteUser(id) {

  const confirmDelete = confirm(
    "Are you sure you want to DELETE this user?"
  );

  if (!confirmDelete) return;

  await fetch(`/api/users/${id}`, {
    method: "DELETE"
  });

  alert("User deleted");

  loadUsers();
}

async function deletePayments(email) {

  const confirmDelete = confirm(
    "Delete all payment records for this user?"
  );

  if (!confirmDelete) return;

  await fetch(`/api/payments/user/${email}`, {
    method: "DELETE"
  });

  alert("Payment records deleted");

  loadUsers();
}

loadUsers();