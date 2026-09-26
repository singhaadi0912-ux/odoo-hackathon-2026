import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

function App() {
  const [page, setPage] = useState("dashboard");

  const [products, setProducts] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [ledger, setLedger] = useState([]);

  const [showProductForm, setShowProductForm] = useState(false);
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showAdjustmentForm, setShowAdjustmentForm] =
    useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    category: "",
    unit: "",
    stock: "",
  });

  const [newReceipt, setNewReceipt] = useState({
    product: "",
    supplier: "",
    quantity: "",
  });

  const [newDelivery, setNewDelivery] = useState({
    product: "",
    customer: "",
    quantity: "",
  });

  const [newTransfer, setNewTransfer] = useState({
    product: "",
    from: "",
    to: "",
    quantity: "",
  });

  const [newAdjustment, setNewAdjustment] = useState({
    product: "",
    warehouse: "",
    quantity: "",
    reason: "",
  });

  // =====================================================
  // LOAD DATA
  // =====================================================

  async function loadProducts() {
    const response = await fetch(`${API}/products`);
    const data = await response.json();
    setProducts(data);
  }

  async function loadReceipts() {
    const response = await fetch(`${API}/receipts`);
    const data = await response.json();
    setReceipts(data);
  }

  async function loadDeliveries() {
    const response = await fetch(`${API}/deliveries`);
    const data = await response.json();
    setDeliveries(data);
  }

  async function loadWarehouses() {
    const response = await fetch(`${API}/warehouses`);
    const data = await response.json();
    setWarehouses(data);
  }

  async function loadTransfers() {
    const response = await fetch(`${API}/transfers`);
    const data = await response.json();
    setTransfers(data);
  }

  async function loadAdjustments() {
    const response = await fetch(`${API}/adjustments`);
    const data = await response.json();
    setAdjustments(data);
  }

  async function loadLedger() {
    const response = await fetch(`${API}/ledger`);
    const data = await response.json();
    setLedger(data);
  }

  useEffect(() => {
    loadProducts().catch(console.error);
    loadReceipts().catch(console.error);
    loadDeliveries().catch(console.error);
    loadWarehouses().catch(console.error);
    loadTransfers().catch(console.error);
    loadAdjustments().catch(console.error);
    loadLedger().catch(console.error);
  }, []);

  // =====================================================
  // ADD PRODUCT
  // =====================================================

  async function addProduct(e) {
    e.preventDefault();

    try {
      const response = await fetch(`${API}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newProduct,
          stock: Number(newProduct.stock),
          reorder_level: 10,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      await loadProducts();
      await loadLedger();

      setNewProduct({
        name: "",
        sku: "",
        category: "",
        unit: "",
        stock: "",
      });

      setShowProductForm(false);

      alert("Product added successfully!");
    } catch (error) {
      alert("Failed to add product: " + error.message);
    }
  }

  // =====================================================
  // ADD RECEIPT
  // =====================================================

  async function addReceipt(e) {
    e.preventDefault();

    const product = products.find(
      (p) => p.name === newReceipt.product
    );

    if (!product) {
      alert("Product not found");
      return;
    }

    try {
      const response = await fetch(`${API}/receipts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          supplier: newReceipt.supplier,
          quantity: Number(newReceipt.quantity),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      await loadProducts();
      await loadReceipts();
      await loadLedger();

      setNewReceipt({
        product: "",
        supplier: "",
        quantity: "",
      });

      setShowReceiptForm(false);

      alert("Receipt validated successfully!");
    } catch (error) {
      alert(
        "Failed to add receipt: " + error.message
      );
    }
  }

  // =====================================================
  // ADD DELIVERY
  // =====================================================

  async function addDelivery(e) {
    e.preventDefault();

    const product = products.find(
      (p) => p.name === newDelivery.product
    );

    if (!product) {
      alert("Product not found");
      return;
    }

    const quantity = Number(newDelivery.quantity);

    if (quantity > Number(product.stock)) {
      alert("Not enough stock available!");
      return;
    }

    try {
      const response = await fetch(`${API}/deliveries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          customer: newDelivery.customer,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      await loadProducts();
      await loadDeliveries();
      await loadLedger();

      setNewDelivery({
        product: "",
        customer: "",
        quantity: "",
      });

      setShowDeliveryForm(false);

      alert("Delivery validated successfully!");
    } catch (error) {
      alert(
        "Failed to add delivery: " + error.message
      );
    }
  }

  // =====================================================
  // ADD TRANSFER
  // =====================================================

  async function addTransfer(e) {
    e.preventDefault();

    const product = products.find(
      (p) => p.name === newTransfer.product
    );

    if (!product) {
      alert("Product not found");
      return;
    }

    try {
      const response = await fetch(`${API}/transfers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          from_warehouse: Number(newTransfer.from),
          to_warehouse: Number(newTransfer.to),
          quantity: Number(newTransfer.quantity),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      await loadTransfers();
      await loadLedger();

      setNewTransfer({
        product: "",
        from: "",
        to: "",
        quantity: "",
      });

      setShowTransferForm(false);

      alert("Transfer completed successfully!");
    } catch (error) {
      alert(
        "Failed to transfer: " + error.message
      );
    }
  }

  // =====================================================
  // ADJUST STOCK
  // =====================================================

  async function addAdjustment(e) {
    e.preventDefault();

    const product = products.find(
      (p) => p.name === newAdjustment.product
    );

    if (!product) {
      alert("Product not found");
      return;
    }

    try {
      const response = await fetch(`${API}/adjustments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          warehouse_id: Number(
            newAdjustment.warehouse
          ),
          counted_quantity: Number(
            newAdjustment.quantity
          ),
          reason:
            newAdjustment.reason ||
            "Physical stock adjustment",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      await loadProducts();
      await loadAdjustments();
      await loadLedger();

      setNewAdjustment({
        product: "",
        warehouse: "",
        quantity: "",
        reason: "",
      });

      setShowAdjustmentForm(false);

      alert("Stock adjusted successfully!");
    } catch (error) {
      alert(
        "Failed to adjust stock: " +
          error.message
      );
    }
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  const totalStock = products.reduce(
    (sum, product) =>
      sum + Number(product.stock || 0),
    0
  );

  const lowStock = products.filter(
    (product) =>
      Number(product.stock) <=
      Number(product.reorder_level || 10)
  ).length;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <h1 className="logo">
          StockSense
        </h1>

        <nav>

          <div
            className={`nav-item ${
              page === "dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setPage("dashboard")
            }
          >
            📊 Dashboard
          </div>

          <div
            className={`nav-item ${
              page === "products"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setPage("products")
            }
          >
            📦 Products
          </div>

          <div
            className={`nav-item ${
              page === "receipts"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setPage("receipts")
            }
          >
            📥 Receipts
          </div>

          <div
            className={`nav-item ${
              page === "deliveries"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setPage("deliveries")
            }
          >
            📤 Deliveries
          </div>

          <div
            className={`nav-item ${
              page === "transfers"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setPage("transfers")
            }
          >
            🔄 Transfers
          </div>

          <div
            className={`nav-item ${
              page === "adjustments"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setPage("adjustments")
            }
          >
            🛠 Adjustments
          </div>

          <div
            className={`nav-item ${
              page === "ledger"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setPage("ledger")
            }
          >
            📜 Stock Ledger
          </div>

        </nav>

      </aside>

      {/* MAIN */}

      <main className="main">

        {/* ================= DASHBOARD ================= */}

        {page === "dashboard" && (
          <>

            <header className="header">

              <div>
                <h2>
                  Inventory Dashboard
                </h2>

                <p>
                  Welcome back, Admin
                </p>
              </div>

              <div className="profile">
                👤 Admin
              </div>

            </header>

            <section className="cards">

              <div className="card">
                <p>Total Products</p>
                <h3>
                  {products.length}
                </h3>
                <span>
                  Products in system
                </span>
              </div>

              <div className="card">
                <p>Total Stock</p>
                <h3>
                  {totalStock}
                </h3>
                <span>
                  Units currently available
                </span>
              </div>

              <div className="card">
                <p>Low Stock</p>
                <h3>
                  {lowStock}
                </h3>
                <span>
                  Items need attention
                </span>
              </div>

              <div className="card">
                <p>Transactions</p>
                <h3>
                  {ledger.length}
                </h3>
                <span>
                  Stock movements
                </span>
              </div>

            </section>

            <section className="product-table">

              <h3>Recent Stock Activity</h3>

              <table>

                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>After Stock</th>
                  </tr>
                </thead>

                <tbody>

                  {ledger
                    .slice(0, 5)
                    .map((item) => (

                      <tr key={item.id}>

                        <td>
                          {item.product}
                        </td>

                        <td>
                          {item.transaction_type}
                        </td>

                        <td>
                          {item.quantity}
                        </td>

                        <td>
                          {item.after_stock}
                        </td>

                      </tr>

                    ))}

                </tbody>

              </table>

            </section>

          </>
        )}

        {/* ================= PRODUCTS ================= */}

        {page === "products" && (
          <>

            <header className="header">

              <div>
                <h2>Products</h2>
                <p>
                  Manage inventory products
                </p>
              </div>

              <button
                className="add-button"
                onClick={() =>
                  setShowProductForm(true)
                }
              >
                + Add Product
              </button>

            </header>

            {showProductForm && (

              <form
                className="product-form"
                onSubmit={addProduct}
              >

                <h3>Add New Product</h3>

                <input
                  placeholder="Product Name"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      name: e.target.value,
                    })
                  }
                  required
                />

                <input
                  placeholder="SKU / Code"
                  value={newProduct.sku}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      sku: e.target.value,
                    })
                  }
                  required
                />

                <input
                  placeholder="Category"
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      category:
                        e.target.value,
                    })
                  }
                  required
                />

                <input
                  placeholder="Unit (kg, units...)"
                  value={newProduct.unit}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      unit: e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="number"
                  min="0"
                  placeholder="Initial Stock"
                  value={newProduct.stock}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      stock: e.target.value,
                    })
                  }
                  required
                />

                <div className="form-buttons">

                  <button
                    className="save-button"
                    type="submit"
                  >
                    Save Product
                  </button>

                  <button
                    className="cancel-button"
                    type="button"
                    onClick={() =>
                      setShowProductForm(false)
                    }
                  >
                    Cancel
                  </button>

                </div>

              </form>

            )}

            <section className="product-table">

              <table>

                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {products.map(
                    (product) => (

                      <tr key={product.id}>

                        <td>
                          {product.name}
                        </td>

                        <td>
                          {product.sku}
                        </td>

                        <td>
                          {product.category}
                        </td>

                        <td>
                          {product.unit}
                        </td>

                        <td>
                          {product.stock}
                        </td>

                        <td>
                          {Number(product.stock) <=
                          Number(
                            product.reorder_level
                          )
                            ? "⚠ Low Stock"
                            : "✓ In Stock"}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </section>

          </>
        )}

        {/* ================= RECEIPTS ================= */}

        {page === "receipts" && (
          <>

            <header className="header">

              <div>
                <h2>Receipts</h2>
                <p>
                  Manage incoming stock
                </p>
              </div>

              <button
                className="add-button"
                onClick={() =>
                  setShowReceiptForm(true)
                }
              >
                + New Receipt
              </button>

            </header>

            {showReceiptForm && (

              <form
                className="product-form"
                onSubmit={addReceipt}
              >

                <h3>New Receipt</h3>

                <select
                  value={newReceipt.product}
                  onChange={(e) =>
                    setNewReceipt({
                      ...newReceipt,
                      product:
                        e.target.value,
                    })
                  }
                  required
                >

                  <option value="">
                    Select Product
                  </option>

                  {products.map(
                    (product) => (

                      <option
                        key={product.id}
                        value={product.name}
                      >
                        {product.name}
                      </option>

                    )
                  )}

                </select>

                <input
                  placeholder="Supplier Name"
                  value={newReceipt.supplier}
                  onChange={(e) =>
                    setNewReceipt({
                      ...newReceipt,
                      supplier:
                        e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="number"
                  min="1"
                  placeholder="Quantity Received"
                  value={newReceipt.quantity}
                  onChange={(e) =>
                    setNewReceipt({
                      ...newReceipt,
                      quantity:
                        e.target.value,
                    })
                  }
                  required
                />

                <div className="form-buttons">

                  <button
                    className="save-button"
                    type="submit"
                  >
                    Validate Receipt
                  </button>

                  <button
                    className="cancel-button"
                    type="button"
                    onClick={() =>
                      setShowReceiptForm(false)
                    }
                  >
                    Cancel
                  </button>

                </div>

              </form>

            )}

            <section className="product-table">

              <table>

                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Supplier</th>
                    <th>Quantity</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {receipts.map(
                    (receipt) => (

                      <tr key={receipt.id}>

                        <td>
                          {receipt.product}
                        </td>

                        <td>
                          {receipt.supplier}
                        </td>

                        <td className="positive">
                          +{receipt.quantity}
                        </td>

                        <td>
                          {new Date(
                            receipt.created_at
                          ).toLocaleDateString()}
                        </td>

                        <td>
                          ✓ Validated
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </section>

          </>
        )}

        {/* ================= DELIVERIES ================= */}

        {page === "deliveries" && (
          <>

            <header className="header">

              <div>
                <h2>Deliveries</h2>
                <p>
                  Manage outgoing stock
                </p>
              </div>

              <button
                className="add-button"
                onClick={() =>
                  setShowDeliveryForm(true)
                }
              >
                + New Delivery
              </button>

            </header>

            {showDeliveryForm && (

              <form
                className="product-form"
                onSubmit={addDelivery}
              >

                <h3>New Delivery</h3>

                <select
                  value={newDelivery.product}
                  onChange={(e) =>
                    setNewDelivery({
                      ...newDelivery,
                      product:
                        e.target.value,
                    })
                  }
                  required
                >

                  <option value="">
                    Select Product
                  </option>

                  {products.map(
                    (product) => (

                      <option
                        key={product.id}
                        value={product.name}
                      >
                        {product.name} — Stock:{" "}
                        {product.stock}
                      </option>

                    )
                  )}

                </select>

                <input
                  placeholder="Customer Name"
                  value={newDelivery.customer}
                  onChange={(e) =>
                    setNewDelivery({
                      ...newDelivery,
                      customer:
                        e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="number"
                  min="1"
                  placeholder="Quantity Delivered"
                  value={newDelivery.quantity}
                  onChange={(e) =>
                    setNewDelivery({
                      ...newDelivery,
                      quantity:
                        e.target.value,
                    })
                  }
                  required
                />

                <div className="form-buttons">

                  <button
                    className="save-button"
                    type="submit"
                  >
                    Validate Delivery
                  </button>

                  <button
                    className="cancel-button"
                    type="button"
                    onClick={() =>
                      setShowDeliveryForm(false)
                    }
                  >
                    Cancel
                  </button>

                </div>

              </form>

            )}

            <section className="product-table">

              <table>

                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Customer</th>
                    <th>Quantity</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {deliveries.map(
                    (delivery) => (

                      <tr key={delivery.id}>

                        <td>
                          {delivery.product}
                        </td>

                        <td>
                          {delivery.customer}
                        </td>

                        <td className="negative">
                          -{delivery.quantity}
                        </td>

                        <td>
                          {new Date(
                            delivery.created_at
                          ).toLocaleDateString()}
                        </td>

                        <td>
                          ✓ Validated
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </section>

          </>
        )}

        {/* ================= TRANSFERS ================= */}

        {page === "transfers" && (
          <>

            <header className="header">

              <div>
                <h2>Internal Transfers</h2>
                <p>
                  Move stock between locations
                </p>
              </div>

              <button
                className="add-button"
                onClick={() =>
                  setShowTransferForm(true)
                }
              >
                + New Transfer
              </button>

            </header>

            {showTransferForm && (

              <form
                className="product-form"
                onSubmit={addTransfer}
              >

                <h3>New Stock Transfer</h3>

                <select
                  value={newTransfer.product}
                  onChange={(e) =>
                    setNewTransfer({
                      ...newTransfer,
                      product:
                        e.target.value,
                    })
                  }
                  required
                >
                  <option value="">
                    Select Product
                  </option>

                  {products.map(
                    (product) => (
                      <option
                        key={product.id}
                        value={product.name}
                      >
                        {product.name}
                      </option>
                    )
                  )}

                </select>

                <select
                  value={newTransfer.from}
                  onChange={(e) =>
                    setNewTransfer({
                      ...newTransfer,
                      from: e.target.value,
                    })
                  }
                  required
                >

                  <option value="">
                    From Warehouse
                  </option>

                  {warehouses.map(
                    (warehouse) => (
                      <option
                        key={warehouse.id}
                        value={warehouse.id}
                      >
                        {warehouse.name}
                      </option>
                    )
                  )}

                </select>

                <select
                  value={newTransfer.to}
                  onChange={(e) =>
                    setNewTransfer({
                      ...newTransfer,
                      to: e.target.value,
                    })
                  }
                  required
                >

                  <option value="">
                    To Warehouse
                  </option>

                  {warehouses.map(
                    (warehouse) => (
                      <option
                        key={warehouse.id}
                        value={warehouse.id}
                      >
                        {warehouse.name}
                      </option>
                    )
                  )}

                </select>

                <input
                  type="number"
                  min="1"
                  placeholder="Quantity"
                  value={newTransfer.quantity}
                  onChange={(e) =>
                    setNewTransfer({
                      ...newTransfer,
                      quantity:
                        e.target.value,
                    })
                  }
                  required
                />

                <div className="form-buttons">

                  <button
                    className="save-button"
                    type="submit"
                  >
                    Transfer Stock
                  </button>

                  <button
                    className="cancel-button"
                    type="button"
                    onClick={() =>
                      setShowTransferForm(false)
                    }
                  >
                    Cancel
                  </button>

                </div>

              </form>

            )}

            <section className="product-table">

              <table>

                <thead>
                  <tr>
                    <th>Product</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Quantity</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>

                  {transfers.map(
                    (transfer) => (

                      <tr key={transfer.id}>

                        <td>
                          {transfer.product}
                        </td>

                        <td>
                          {transfer.from_warehouse}
                        </td>

                        <td>
                          {transfer.to_warehouse}
                        </td>

                        <td>
                          {transfer.quantity}
                        </td>

                        <td>
                          {new Date(
                            transfer.created_at
                          ).toLocaleDateString()}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </section>

          </>
        )}

        {/* ================= ADJUSTMENTS ================= */}

        {page === "adjustments" && (
          <>

            <header className="header">

              <div>
                <h2>Inventory Adjustments</h2>
                <p>
                  Reconcile physical stock
                </p>
              </div>

              <button
                className="add-button"
                onClick={() =>
                  setShowAdjustmentForm(true)
                }
              >
                + New Adjustment
              </button>

            </header>

            {showAdjustmentForm && (

              <form
                className="product-form"
                onSubmit={addAdjustment}
              >

                <h3>Stock Adjustment</h3>

                <select
                  value={newAdjustment.product}
                  onChange={(e) =>
                    setNewAdjustment({
                      ...newAdjustment,
                      product:
                        e.target.value,
                    })
                  }
                  required
                >

                  <option value="">
                    Select Product
                  </option>

                  {products.map(
                    (product) => (
                      <option
                        key={product.id}
                        value={product.name}
                      >
                        {product.name}
                      </option>
                    )
                  )}

                </select>

                <select
                  value={newAdjustment.warehouse}
                  onChange={(e) =>
                    setNewAdjustment({
                      ...newAdjustment,
                      warehouse:
                        e.target.value,
                    })
                  }
                  required
                >

                  <option value="">
                    Select Warehouse
                  </option>

                  {warehouses.map(
                    (warehouse) => (
                      <option
                        key={warehouse.id}
                        value={warehouse.id}
                      >
                        {warehouse.name}
                      </option>
                    )
                  )}

                </select>

                <input
                  type="number"
                  min="0"
                  placeholder="Physical Count"
                  value={newAdjustment.quantity}
                  onChange={(e) =>
                    setNewAdjustment({
                      ...newAdjustment,
                      quantity:
                        e.target.value,
                    })
                  }
                  required
                />

                <input
                  placeholder="Reason"
                  value={newAdjustment.reason}
                  onChange={(e) =>
                    setNewAdjustment({
                      ...newAdjustment,
                      reason:
                        e.target.value,
                    })
                  }
                />

                <div className="form-buttons">

                  <button
                    className="save-button"
                    type="submit"
                  >
                    Apply Adjustment
                  </button>

                  <button
                    className="cancel-button"
                    type="button"
                    onClick={() =>
                      setShowAdjustmentForm(false)
                    }
                  >
                    Cancel
                  </button>

                </div>

              </form>

            )}

            <section className="product-table">

              <table>

                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Warehouse</th>
                    <th>Old</th>
                    <th>New</th>
                    <th>Difference</th>
                    <th>Reason</th>
                  </tr>
                </thead>

                <tbody>

                  {adjustments.map(
                    (item) => (

                      <tr key={item.id}>

                        <td>
                          {item.product}
                        </td>

                        <td>
                          {item.warehouse}
                        </td>

                        <td>
                          {item.old_quantity}
                        </td>

                        <td>
                          {item.new_quantity}
                        </td>

                        <td>
                          {item.difference}
                        </td>

                        <td>
                          {item.reason}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </section>

          </>
        )}

        {/* ================= LEDGER ================= */}

        {page === "ledger" && (
          <>

            <header className="header">

              <div>
                <h2>Stock Ledger</h2>
                <p>
                  Complete inventory movement history
                </p>
              </div>

            </header>

            <section className="product-table">

              <table>

                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Transaction</th>
                    <th>Quantity</th>
                    <th>Before</th>
                    <th>After</th>
                    <th>Reference</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>

                  {ledger.map(
                    (item) => (

                      <tr key={item.id}>

                        <td>
                          {item.product}
                        </td>

                        <td>
                          {item.transaction_type}
                        </td>

                        <td>
                          {item.quantity}
                        </td>

                        <td>
                          {item.before_stock}
                        </td>

                        <td>
                          {item.after_stock}
                        </td>

                        <td>
                          {item.reference}
                        </td>

                        <td>
                          {new Date(
                            item.created_at
                          ).toLocaleString()}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </section>

          </>
        )}

      </main>
    </div>
  );
}

export default App;