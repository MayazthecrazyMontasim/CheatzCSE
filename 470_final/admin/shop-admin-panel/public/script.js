async function loadOrders() {
  try {
    const response = await fetch("/api/orders");

    const orders = await response.json();

    document.getElementById("totalOrders").innerText = orders.length;

    const table = document.getElementById("ordersTable");

    table.innerHTML = "";

    orders.forEach((order) => {

      const row = document.createElement("tr");

      let itemsHTML = "";

      if (order.items.length === 0) {
        itemsHTML = "<i>No items</i>";
      } else {

        order.items.forEach((item) => {

          if (typeof item === "object") {
            itemsHTML += `
              <div class="item-box">
                ${item.name || "Unnamed Item"}
                ${item.quantity ? `(x${item.quantity})` : ""}
              </div>
            `;
          } else {
            itemsHTML += `
              <div class="item-box">
                ${item}
              </div>
            `;
          }
        });
      }

      let statusClass = "pending";

      if (order.status.toLowerCase() === "completed") {
        statusClass = "completed";
      }

      if (order.status.toLowerCase() === "failed") {
        statusClass = "failed";
      }

      row.innerHTML = `
        <td>${order.id}</td>
        <td>${order.customer}</td>
        <td>${order.email}</td>
        <td>৳ ${order.amount}</td>
        <td>
          <span class="status ${statusClass}">
            ${order.status}
          </span>
        </td>
        <td>${order.paymentMethod}</td>
        <td>${itemsHTML}</td>
      `;

      table.appendChild(row);
    });

  } catch (error) {
    console.error(error);
  }
}

loadOrders();