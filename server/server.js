const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "stocksense",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

// ======================================================
// DATABASE SETUP
// ======================================================

async function setupDatabase() {
  // PRODUCTS
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      sku VARCHAR(100) UNIQUE NOT NULL,
      category VARCHAR(100),
      unit VARCHAR(50),
      stock NUMERIC DEFAULT 0,
      reorder_level NUMERIC DEFAULT 10,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS reorder_level NUMERIC DEFAULT 10;
  `);

  // RECEIPTS
  await pool.query(`
    CREATE TABLE IF NOT EXISTS receipts (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      supplier VARCHAR(150),
      quantity NUMERIC NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // DELIVERIES
  await pool.query(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      customer VARCHAR(150),
      quantity NUMERIC NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // WAREHOUSES
  await pool.query(`
    CREATE TABLE IF NOT EXISTS warehouses (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL
    );
  `);

  // STOCK LOCATIONS
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_locations (
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
      quantity NUMERIC DEFAULT 0,
      PRIMARY KEY (product_id, warehouse_id)
    );
  `);

  // TRANSFERS
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transfers (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      from_warehouse INTEGER REFERENCES warehouses(id),
      to_warehouse INTEGER REFERENCES warehouses(id),
      quantity NUMERIC NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ADJUSTMENTS
  await pool.query(`
    CREATE TABLE IF NOT EXISTS adjustments (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      warehouse_id INTEGER REFERENCES warehouses(id),
      old_quantity NUMERIC,
      new_quantity NUMERIC,
      difference NUMERIC,
      reason VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // STOCK LEDGER
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_ledger (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      transaction_type VARCHAR(50),
      quantity NUMERIC,
      before_stock NUMERIC,
      after_stock NUMERIC,
      reference VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ====================================================
  // DEFAULT WAREHOUSES
  // ====================================================

  await pool.query(`
    INSERT INTO warehouses (name)
    SELECT 'Main Warehouse'
    WHERE NOT EXISTS (
      SELECT 1 FROM warehouses WHERE name = 'Main Warehouse'
    );
  `);

  await pool.query(`
    INSERT INTO warehouses (name)
    SELECT 'Production Floor'
    WHERE NOT EXISTS (
      SELECT 1 FROM warehouses WHERE name = 'Production Floor'
    );
  `);

  await pool.query(`
    INSERT INTO warehouses (name)
    SELECT 'Secondary Warehouse'
    WHERE NOT EXISTS (
      SELECT 1 FROM warehouses WHERE name = 'Secondary Warehouse'
    );
  `);

  // ====================================================
  // CREATE MAIN WAREHOUSE STOCK FOR EXISTING PRODUCTS
  // ====================================================

  const productsResult = await pool.query(`
    SELECT id, stock
    FROM products
  `);

  const warehouseResult = await pool.query(`
    SELECT id
    FROM warehouses
    WHERE name = 'Main Warehouse'
    LIMIT 1
  `);

  if (warehouseResult.rows.length > 0) {
    const warehouseId = warehouseResult.rows[0].id;

    for (const product of productsResult.rows) {
      const existing = await pool.query(
        `
        SELECT product_id
        FROM stock_locations
        WHERE product_id = $1
        AND warehouse_id = $2
        `,
        [product.id, warehouseId]
      );

      if (existing.rows.length === 0) {
        await pool.query(
          `
          INSERT INTO stock_locations
          (product_id, warehouse_id, quantity)
          VALUES ($1, $2, $3)
          `,
          [product.id, warehouseId, product.stock || 0]
        );
      }
    }
  }

  console.log("Database tables ready.");
}

// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {
  res.json({
    message: "StockSense backend is running!",
  });
});

// ======================================================
// DATABASE TEST
// ======================================================

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
      error: error.message,
    });
  }
});

// ======================================================
// PRODUCTS - GET
// ======================================================

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        sku,
        category,
        unit,
        stock,
        reorder_level,
        created_at
      FROM products
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});

// ======================================================
// PRODUCTS - CREATE
// ======================================================

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

    if (!name || !sku || !unit) {
      return res.status(400).json({
        message: "Name, SKU and unit are required",
      });
    }

    const initialStock = Number(stock) || 0;
    const reorderLevel = Number(reorder_level) || 10;

    const result = await pool.query(
      `
      INSERT INTO products
      (name, sku, category, unit, stock, reorder_level)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        name,
        sku,
        category || "",
        unit,
        initialStock,
        reorderLevel,
      ]
    );

    const product = result.rows[0];

    const warehouse = await pool.query(`
      SELECT id
      FROM warehouses
      WHERE name = 'Main Warehouse'
      LIMIT 1
    `);

    if (warehouse.rows.length > 0) {
      await pool.query(
        `
        INSERT INTO stock_locations
        (product_id, warehouse_id, quantity)
        VALUES ($1, $2, $3)
        `,
        [
          product.id,
          warehouse.rows[0].id,
          initialStock,
        ]
      );
    }

    await pool.query(
      `
      INSERT INTO stock_ledger
      (
        product_id,
        transaction_type,
        quantity,
        before_stock,
        after_stock,
        reference
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        product.id,
        "INITIAL_STOCK",
        initialStock,
        0,
        initialStock,
        "Product creation",
      ]
    );

    res.status(201).json(product);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        error.code === "23505"
          ? "SKU already exists"
          : "Failed to add product",
      error: error.message,
    });
  }
});

// ======================================================
// RECEIPTS - GET
// ======================================================

app.get("/api/receipts", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        p.name AS product,
        r.supplier,
        r.quantity,
        r.created_at
      FROM receipts r
      JOIN products p ON p.id = r.product_id
      ORDER BY r.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch receipts",
      error: error.message,
    });
  }
});

// ======================================================
// RECEIPTS - CREATE
// ======================================================

app.post("/api/receipts", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      product_id,
      supplier,
      quantity,
    } = req.body;

    const qty = Number(quantity);

    if (!product_id || !supplier || qty <= 0) {
      return res.status(400).json({
        message: "Invalid receipt data",
      });
    }

    await client.query("BEGIN");

    const productResult = await client.query(
      `
      SELECT *
      FROM products
      WHERE id = $1
      FOR UPDATE
      `,
      [product_id]
    );

    if (productResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Product not found",
      });
    }

    const product = productResult.rows[0];

    const beforeStock = Number(product.stock);
    const afterStock = beforeStock + qty;

    const updatedProduct = await client.query(
      `
      UPDATE products
      SET stock = $1
      WHERE id = $2
      RETURNING *
      `,
      [afterStock, product_id]
    );

    await client.query(
      `
      INSERT INTO receipts
      (product_id, supplier, quantity)
      VALUES ($1, $2, $3)
      `,
      [product_id, supplier, qty]
    );

    const warehouse = await client.query(`
      SELECT id
      FROM warehouses
      WHERE name = 'Main Warehouse'
      LIMIT 1
    `);

    if (warehouse.rows.length > 0) {
      const warehouseId = warehouse.rows[0].id;

      const location = await client.query(
        `
        SELECT quantity
        FROM stock_locations
        WHERE product_id = $1
        AND warehouse_id = $2
        FOR UPDATE
        `,
        [product_id, warehouseId]
      );

      if (location.rows.length > 0) {
        await client.query(
          `
          UPDATE stock_locations
          SET quantity = quantity + $1
          WHERE product_id = $2
          AND warehouse_id = $3
          `,
          [qty, product_id, warehouseId]
        );
      } else {
        await client.query(
          `
          INSERT INTO stock_locations
          (product_id, warehouse_id, quantity)
          VALUES ($1, $2, $3)
          `,
          [product_id, warehouseId, qty]
        );
      }
    }

    await client.query(
      `
      INSERT INTO stock_ledger
      (
        product_id,
        transaction_type,
        quantity,
        before_stock,
        after_stock,
        reference
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        product_id,
        "RECEIPT",
        qty,
        beforeStock,
        afterStock,
        supplier,
      ]
    );

    await client.query("COMMIT");

    res.json({
      message: "Receipt added successfully",
      product: updatedProduct.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    res.status(500).json({
      message: "Failed to add receipt",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// ======================================================
// DELIVERIES - GET
// ======================================================

app.get("/api/deliveries", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        d.id,
        p.name AS product,
        d.customer,
        d.quantity,
        d.created_at
      FROM deliveries d
      JOIN products p ON p.id = d.product_id
      ORDER BY d.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch deliveries",
      error: error.message,
    });
  }
});

// ======================================================
// DELIVERIES - CREATE
// ======================================================

app.post("/api/deliveries", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      product_id,
      customer,
      quantity,
    } = req.body;

    const qty = Number(quantity);

    if (!product_id || !customer || qty <= 0) {
      return res.status(400).json({
        message: "Invalid delivery data",
      });
    }

    await client.query("BEGIN");

    const productResult = await client.query(
      `
      SELECT *
      FROM products
      WHERE id = $1
      FOR UPDATE
      `,
      [product_id]
    );

    if (productResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Product not found",
      });
    }

    const product = productResult.rows[0];

    const beforeStock = Number(product.stock);

    if (qty > beforeStock) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Not enough stock available",
      });
    }

    const afterStock = beforeStock - qty;

    const updatedProduct = await client.query(
      `
      UPDATE products
      SET stock = $1
      WHERE id = $2
      RETURNING *
      `,
      [afterStock, product_id]
    );

    await client.query(
      `
      INSERT INTO deliveries
      (product_id, customer, quantity)
      VALUES ($1, $2, $3)
      `,
      [product_id, customer, qty]
    );

    const warehouse = await client.query(`
      SELECT id
      FROM warehouses
      WHERE name = 'Main Warehouse'
      LIMIT 1
    `);

    if (warehouse.rows.length > 0) {
      const warehouseId = warehouse.rows[0].id;

      await client.query(
        `
        UPDATE stock_locations
        SET quantity = quantity - $1
        WHERE product_id = $2
        AND warehouse_id = $3
        `,
        [qty, product_id, warehouseId]
      );
    }

    await client.query(
      `
      INSERT INTO stock_ledger
      (
        product_id,
        transaction_type,
        quantity,
        before_stock,
        after_stock,
        reference
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        product_id,
        "DELIVERY",
        -qty,
        beforeStock,
        afterStock,
        customer,
      ]
    );

    await client.query("COMMIT");

    res.json({
      message: "Delivery added successfully",
      product: updatedProduct.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    res.status(500).json({
      message: "Failed to add delivery",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// ======================================================
// WAREHOUSES
// ======================================================

app.get("/api/warehouses", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM warehouses
      ORDER BY id
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch warehouses",
      error: error.message,
    });
  }
});

// ======================================================
// TRANSFERS - GET
// ======================================================

app.get("/api/transfers", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        p.name AS product,
        w1.name AS from_warehouse,
        w2.name AS to_warehouse,
        t.quantity,
        t.created_at
      FROM transfers t
      JOIN products p ON p.id = t.product_id
      JOIN warehouses w1 ON w1.id = t.from_warehouse
      JOIN warehouses w2 ON w2.id = t.to_warehouse
      ORDER BY t.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch transfers",
      error: error.message,
    });
  }
});

// ======================================================
// TRANSFERS - CREATE
// ======================================================

app.post("/api/transfers", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      product_id,
      from_warehouse,
      to_warehouse,
      quantity,
    } = req.body;

    const qty = Number(quantity);

    if (
      !product_id ||
      !from_warehouse ||
      !to_warehouse ||
      qty <= 0
    ) {
      return res.status(400).json({
        message: "Invalid transfer data",
      });
    }

    if (from_warehouse === to_warehouse) {
      return res.status(400).json({
        message: "Source and destination must be different",
      });
    }

    await client.query("BEGIN");

    const stockResult = await client.query(
      `
      SELECT quantity
      FROM stock_locations
      WHERE product_id = $1
      AND warehouse_id = $2
      FOR UPDATE
      `,
      [product_id, from_warehouse]
    );

    if (
      stockResult.rows.length === 0 ||
      Number(stockResult.rows[0].quantity) < qty
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Not enough stock in source warehouse",
      });
    }

    // Remove from source warehouse
    await client.query(
      `
      UPDATE stock_locations
      SET quantity = quantity - $1
      WHERE product_id = $2
      AND warehouse_id = $3
      `,
      [qty, product_id, from_warehouse]
    );

    // Check destination
    const destination = await client.query(
      `
      SELECT quantity
      FROM stock_locations
      WHERE product_id = $1
      AND warehouse_id = $2
      FOR UPDATE
      `,
      [product_id, to_warehouse]
    );

    if (destination.rows.length > 0) {
      await client.query(
        `
        UPDATE stock_locations
        SET quantity = quantity + $1
        WHERE product_id = $2
        AND warehouse_id = $3
        `,
        [qty, product_id, to_warehouse]
      );
    } else {
      await client.query(
        `
        INSERT INTO stock_locations
        (product_id, warehouse_id, quantity)
        VALUES ($1, $2, $3)
        `,
        [product_id, to_warehouse, qty]
      );
    }

    const transfer = await client.query(
      `
      INSERT INTO transfers
      (
        product_id,
        from_warehouse,
        to_warehouse,
        quantity
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        product_id,
        from_warehouse,
        to_warehouse,
        qty,
      ]
    );

    const product = await client.query(
      `
      SELECT stock
      FROM products
      WHERE id = $1
      `,
      [product_id]
    );

    await client.query(
      `
      INSERT INTO stock_ledger
      (
        product_id,
        transaction_type,
        quantity,
        before_stock,
        after_stock,
        reference
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        product_id,
        "TRANSFER",
        0,
        Number(product.rows[0].stock),
        Number(product.rows[0].stock),
        `Transfer ${from_warehouse} to ${to_warehouse}`,
      ]
    );

    await client.query("COMMIT");

    res.json({
      message: "Transfer completed successfully",
      transfer: transfer.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    res.status(500).json({
      message: "Failed to transfer stock",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// ======================================================
// ADJUSTMENTS - GET
// ======================================================

app.get("/api/adjustments", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.id,
        p.name AS product,
        w.name AS warehouse,
        a.old_quantity,
        a.new_quantity,
        a.difference,
        a.reason,
        a.created_at
      FROM adjustments a
      JOIN products p ON p.id = a.product_id
      JOIN warehouses w ON w.id = a.warehouse_id
      ORDER BY a.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch adjustments",
      error: error.message,
    });
  }
});

// ======================================================
// ADJUSTMENTS - CREATE
// ======================================================

app.post("/api/adjustments", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      product_id,
      warehouse_id,
      counted_quantity,
      reason,
    } = req.body;

    const counted = Number(counted_quantity);

    if (
      !product_id ||
      !warehouse_id ||
      counted < 0
    ) {
      return res.status(400).json({
        message: "Invalid adjustment data",
      });
    }

    await client.query("BEGIN");

    const locationResult = await client.query(
      `
      SELECT quantity
      FROM stock_locations
      WHERE product_id = $1
      AND warehouse_id = $2
      FOR UPDATE
      `,
      [product_id, warehouse_id]
    );

    const oldQuantity =
      locationResult.rows.length > 0
        ? Number(locationResult.rows[0].quantity)
        : 0;

    const difference = counted - oldQuantity;

    // Update or create stock location
    if (locationResult.rows.length > 0) {
      await client.query(
        `
        UPDATE stock_locations
        SET quantity = $1
        WHERE product_id = $2
        AND warehouse_id = $3
        `,
        [counted, product_id, warehouse_id]
      );
    } else {
      await client.query(
        `
        INSERT INTO stock_locations
        (product_id, warehouse_id, quantity)
        VALUES ($1, $2, $3)
        `,
        [product_id, warehouse_id, counted]
      );
    }

    // Update total product stock
    await client.query(
      `
      UPDATE products
      SET stock = stock + $1
      WHERE id = $2
      `,
      [difference, product_id]
    );

    // Save adjustment
    await client.query(
      `
      INSERT INTO adjustments
      (
        product_id,
        warehouse_id,
        old_quantity,
        new_quantity,
        difference,
        reason
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        product_id,
        warehouse_id,
        oldQuantity,
        counted,
        difference,
        reason || "Stock adjustment",
      ]
    );

    const product = await client.query(
      `
      SELECT *
      FROM products
      WHERE id = $1
      `,
      [product_id]
    );

    const afterStock = Number(product.rows[0].stock);
    const beforeStock = afterStock - difference;

    await client.query(
      `
      INSERT INTO stock_ledger
      (
        product_id,
        transaction_type,
        quantity,
        before_stock,
        after_stock,
        reference
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        product_id,
        "ADJUSTMENT",
        difference,
        beforeStock,
        afterStock,
        reason || "Stock adjustment",
      ]
    );

    await client.query("COMMIT");

    res.json({
      message: "Stock adjusted successfully",
      product: product.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    res.status(500).json({
      message: "Failed to adjust stock",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// ======================================================
// STOCK LEDGER
// ======================================================

app.get("/api/ledger", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        l.id,
        p.name AS product,
        l.transaction_type,
        l.quantity,
        l.before_stock,
        l.after_stock,
        l.reference,
        l.created_at
      FROM stock_ledger l
      JOIN products p ON p.id = l.product_id
      ORDER BY l.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch stock ledger",
      error: error.message,
    });
  }
});

// ======================================================
// START SERVER
// ======================================================

async function startServer() {
  try {
    await setupDatabase();

    app.listen(PORT, () => {
      console.log(
        `StockSense backend running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Database setup failed:");
    console.error(error.message);
  }
}

startServer();