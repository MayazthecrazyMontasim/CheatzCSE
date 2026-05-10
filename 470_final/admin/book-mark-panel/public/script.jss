async function loadUsers() {
  try {
    const response = await fetch("/api/users");

    const users = await response.json();

    document.getElementById("totalUsers").innerText = users.length;

    const tableBody = document.getElementById("tableBody");

    tableBody.innerHTML = "";

    users.forEach((user) => {
      const row = document.createElement("tr");

      let bookmarksHTML = "";

      if (user.bookmarks.length === 0) {
        bookmarksHTML = "<i>No bookmarks</i>";
      } else {
        user.bookmarks.forEach((bookmark) => {
          bookmarksHTML += `
            <div class="bookmark-item">
              ${bookmark}
            </div>
          `;
        });
      }

      row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.email}</td>
        <td>${user.count}</td>
        <td>${bookmarksHTML}</td>
      `;

      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error(error);
  }
}

loadUsers();