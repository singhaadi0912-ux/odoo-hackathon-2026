const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "stocksense",
  password: process.env.DB_PASSWORD,
  port: 5432,
});

// Test backend
app.get("/", (req, res) => {
  res.json({ message: "StockSense backend is running!" });
});

// Test database
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "PostgreSQL connected successfully!",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

// GET all products
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
});

// ADD a product
app.post("/api/products", async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      unit,
      stock,
      reorder_level,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO products
       (name, sku, category, unit, stock, reorder_level)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        name,
        sku,
        category,
        unit,
        stock || 0,
        reorder_level || 10,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to add product",
      error: error.message,
    });
  }
});

// DELETE a product
// GET all products
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM products WHERE id = $1",
      [id]
    );

    res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete product",
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(
    `StockSense backend running on http://localhost:${PORT}`
  );
});