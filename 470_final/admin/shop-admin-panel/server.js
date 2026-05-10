const express = require("express");
const { MongoClient } = require("mongodb");
const path = require("path");
const { ObjectId } = require("mongodb");
const app = express();
const PORT = 3000;

const MONGO_URI =
  "mongodb+srv://adnan:aFdbDSQzHk8G4cs6@cluster0.7fvc3no.mongodb.net/paystation_demo?retryWrites=true&w=majority";

const DB_NAME = "paystation_demo";

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/orders", async (req, res) => {
  let client;

  try {
    client = new MongoClient(MONGO_URI);

    await client.connect();

    const db = client.db(DB_NAME);
    const orders = db.collection("orders");

    const allOrders = await orders
      .find()
      .sort({ _id: -1 })
      .limit(50)
      .toArray();

    const formattedOrders = allOrders.map((order) => ({
      id: order._id,
      customer: order.customerName || order.name || "Unknown",
      email: order.email || "No Email",
      amount: order.amount || order.total || 0,
      status: order.status || "Pending",
      paymentMethod: order.paymentMethod || "N/A",
      items: order.items || [],
      createdAt: order.createdAt || "N/A",
      raw: order
    }));
app.get("/api/users", async (req, res) => {
  let client;

  try {
    client = new MongoClient(MONGO_URI);

    await client.connect();

    const db = client.db(DB_NAME);

    const users = await db
      .collection("users")
      .find({})
      .sort({ _id: -1 })
      .toArray();

    res.json(users);
app.delete("/api/users/:id", async (req, res) => {
  let client;

  try {
    client = new MongoClient(MONGO_URI);

    await client.connect();

    const db = client.db(DB_NAME);

    const result = await db.collection("users").deleteOne({
      _id: new ObjectId(req.params.id)
    });

    res.json({
      success: true,
      deleted: result.deletedCount
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Delete failed"
    });

  } finally {
    if (client) await client.close();
  }
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  } finally {
    if (client) await client.close();
  }
});
    res.json(formattedOrders);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch orders"
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
});
app.delete("/api/payments/user/:email", async (req, res) => {
  let client;

  try {
    client = new MongoClient(MONGO_URI);

    await client.connect();

    const db = client.db(DB_NAME);

    const result = await db.collection("payments").deleteMany({
      email: req.params.email
    });

    res.json({
      success: true,
      deletedPayments: result.deletedCount
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to delete payments"
    });

  } finally {
    if (client) await client.close();
  }
});
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});