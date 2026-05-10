const express = require("express");
const { MongoClient } = require("mongodb");
const path = require("path");

const app = express();
const PORT = 3000;

const MONGODB_URI =
  "mongodb+srv://adnan:aFdbDSQzHk8G4cs6@cluster0.7fvc3no.mongodb.net/edtech?retryWrites=true&w=majority";

const DB_NAME = "edtech";

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/users", async (req, res) => {
  let client;

  try {
    client = new MongoClient(MONGODB_URI);

    await client.connect();

    const db = client.db(DB_NAME);
    const users = db.collection("users");

    const data = await users
      .find({}, { projection: { email: 1, bookmarks: 1 } })
      .toArray();

    const formatted = data.map((user) => ({
      id: user._id,
      email: user.email || "No Email",
      bookmarks: user.bookmarks || [],
      count: user.bookmarks ? user.bookmarks.length : 0,
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Database connection failed",
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});