import { useState } from "react";
import "./App.css";

function App() {
  const [page, setPage] = useState("dashboard");

  // Products
  const [products, setProducts] = useState([
    {
      name: "Steel Rods",
      sku: "ST-001",
      category: "Raw Material",
      unit: "kg",
      stock: 100,
    },
    {
      name: "Office Chairs",
      sku: "CH-001",
      category: "Furniture",
      unit: "units",
      stock: 50,
    },
  ]);

  // Product form
  const [showForm, setShowForm] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    category: "",
    unit: "",
    stock: "",
  });

  // Receipts
  const [receipts, setReceipts] = useState([]);
  // Deliveries
const [deliveries, setDeliveries] = useState([]);

const [showDeliveryForm, setShowDeliveryForm] = useState(false);

const [newDelivery, setNewDelivery] = useState({
  product: "",
  customer: "",
  quantity: "",
});

  const [showReceiptForm, setShowReceiptForm] = useState(false);

  const [newReceipt, setNewReceipt] = useState({
    product: "",
    supplier: "",
    quantity: "",
  });

  // Add Product
  function addProduct(e) {
    e.preventDefault();

    const product = {
      ...newProduct,
      stock: Number(newProduct.stock),
    };

    setProducts([...products, product]);

    setNewProduct({
      name: "",
      sku: "",
      category: "",
      unit: "",
      stock: "",
    });

    setShowForm(false);
  }

  // Add Receipt
  function addReceipt(e) {
    e.preventDefault();
    // Add Delivery
function addDelivery(e) {
  e.preventDefault();

  const quantity = Number(newDelivery.quantity);

  // Find selected product
  const selectedProduct = products.find(
    (product) => product.name === newDelivery.product
  );

  // Check if enough stock exists
  if (!selectedProduct) {
    alert("Product not found.");
    return;
  }

  if (quantity > selectedProduct.stock) {
    alert("Not enough stock available.");
    return;
  }

  // Decrease product stock
  const updatedProducts = products.map((product) => {
    if (product.name === newDelivery.product) {
      return {
        ...product,
        stock: product.stock - quantity,
      };
    }

    return product;
  });

  setProducts(updatedProducts);

  // Save delivery
  const delivery = {
    product: newDelivery.product,
    customer: newDelivery.customer,
    quantity: quantity,
    date: new Date().toLocaleDateString(),
  };

  setDeliveries([...deliveries, delivery]);

  // Reset form
  setNewDelivery({
    product: "",
    customer: "",
    quantity: "",
  });

  setShowDeliveryForm(false);
}

    const quantity = Number(newReceipt.quantity);

    // Increase product stock
    const updatedProducts = products.map((product) => {
      if (product.name === newReceipt.product) {
        return {
          ...product,
          stock: product.stock + quantity,
        };
      }

      return product;
    });

    setProducts(updatedProducts);

    // Save receipt
    const receipt = {
      product: newReceipt.product,
      supplier: newReceipt.supplier,
      quantity: quantity,
      date: new Date().toLocaleDateString(),
    };

    setReceipts([...receipts, receipt]);

    // Reset form
    setNewReceipt({
      product: "",
      supplier: "",
      quantity: "",
    });

    setShowReceiptForm(false);
  }

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <h1 className="logo">StockSense</h1>

        <nav>

          <div
            className={`nav-item ${
              page === "dashboard" ? "active" : ""
            }`}
            onClick={() => setPage("dashboard")}
          >
            Dashboard
          </div>

          <div
            className={`nav-item ${
              page === "products" ? "active" : ""
            }`}
            onClick={() => setPage("products")}
          >
            Products
          </div>

          <div
            className={`nav-item ${
              page === "receipts" ? "active" : ""
            }`}
            onClick={() => setPage("receipts")}
          >
            Receipts
          </div>

         <div
  className={`nav-item ${
    page === "deliveries" ? "active" : ""
  }`}
  onClick={() => setPage("deliveries")}
>
  Deliveries
</div>


          <div className="nav-item">Transfers</div>

          <div className="nav-item">Adjustments</div>

          <div className="nav-item">Stock Ledger</div>

          <div className="nav-item">Settings</div>

        </nav>

      </aside>
      {/* ================= DELIVERIES ================= */}

{page === "deliveries" && (
  <>

    <header className="header">

      <div>

        <h2>Deliveries</h2>

        <p>
          Manage outgoing stock to customers
        </p>

      </div>

      <button
        className="add-button"
        onClick={() => setShowDeliveryForm(true)}
      >
        + New Delivery
      </button>

    </header>

    {/* DELIVERY FORM */}

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
              product: e.target.value,
            })
          }
          required
        >

          <option value="">
            Select Product
          </option>

          {products.map((product, index) => (

            <option
              key={index}
              value={product.name}
            >
              {product.name} — Stock: {product.stock}
            </option>

          ))}

        </select>

        <input
          type="text"
          placeholder="Customer Name"
          value={newDelivery.customer}
          onChange={(e) =>
            setNewDelivery({
              ...newDelivery,
              customer: e.target.value,
            })
          }
          required
        />

        <input
          type="number"
          placeholder="Quantity Delivered"
          value={newDelivery.quantity}
          onChange={(e) =>
            setNewDelivery({
              ...newDelivery,
              quantity: e.target.value,
            })
          }
          min="1"
          required
        />

        <div className="form-buttons">

          <button
            type="submit"
            className="save-button"
          >
            Validate Delivery
          </button>

          <button
            type="button"
            className="cancel-button"
            onClick={() =>
              setShowDeliveryForm(false)
            }
          >
            Cancel
          </button>

        </div>

      </form>

    )}

    {/* DELIVERY HISTORY */}

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

          {deliveries.length === 0 ? (

            <tr>

              <td colSpan="5">
                No deliveries yet
              </td>

            </tr>

          ) : (

            deliveries.map((delivery, index) => (

              <tr key={index}>

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
                  {delivery.date}
                </td>

                <td>
                  Validated
                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </section>

  </>
)}

      {/* MAIN */}

      <main className="main">

        {/* ================= DASHBOARD ================= */}

        {page === "dashboard" && (
          <>

            <header className="header">

              <div>
                <h2>Inventory Dashboard</h2>
                <p>Welcome back, Admin</p>
              </div>

              <div className="profile">
                👤 Admin
              </div>

            </header>

            <section className="cards">

              <div className="card">
                <p>Total Products</p>

                <h3>{products.length}</h3>

                <span>Products in system</span>
              </div>

              <div className="card">

                <p>Low Stock</p>

                <h3>
                  {
                    products.filter(
                      (product) => product.stock < 20
                    ).length
                  }
                </h3>

                <span>Items need attention</span>

              </div>

              <div className="card">

                <p>Pending Receipts</p>

                <h3>7</h3>

                <span>Incoming shipments</span>

              </div>

              <div className="card">

                <p>Pending Deliveries</p>

                <h3>4</h3>

                <span>Outgoing shipments</span>

              </div>

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
                  Manage your inventory products
                </p>

              </div>

              <button
                className="add-button"
                onClick={() => setShowForm(true)}
              >
                + Add Product
              </button>

            </header>

            {/* ADD PRODUCT FORM */}

            {showForm && (

              <form
                className="product-form"
                onSubmit={addProduct}
              >

                <h3>Add New Product</h3>

                <input
                  type="text"
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
                  type="text"
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
                  type="text"
                  placeholder="Category"
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      category: e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="text"
                  placeholder="Unit (kg, units, litre...)"
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
                    type="submit"
                    className="save-button"
                  >
                    Save Product
                  </button>

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>

                </div>

              </form>

            )}

            {/* PRODUCT TABLE */}

            <section className="product-table">

              <table>

                <thead>

                  <tr>

                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Stock</th>

                  </tr>

                </thead>

                <tbody>

                  {products.map((product, index) => (

                    <tr key={index}>

                      <td>{product.name}</td>

                      <td>{product.sku}</td>

                      <td>{product.category}</td>

                      <td>{product.unit}</td>

                      <td>{product.stock}</td>

                    </tr>

                  ))}

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
                  Manage incoming stock from suppliers
                </p>

              </div>

              <button
                className="add-button"
                onClick={() => setShowReceiptForm(true)}
              >
                + New Receipt
              </button>

            </header>

            {/* RECEIPT FORM */}

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
                      product: e.target.value,
                    })
                  }
                  required
                >

                  <option value="">
                    Select Product
                  </option>

                  {products.map((product, index) => (

                    <option
                      key={index}
                      value={product.name}
                    >
                      {product.name}
                    </option>

                  ))}

                </select>

                <input
                  type="text"
                  placeholder="Supplier Name"
                  value={newReceipt.supplier}
                  onChange={(e) =>
                    setNewReceipt({
                      ...newReceipt,
                      supplier: e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="number"
                  placeholder="Quantity Received"
                  value={newReceipt.quantity}
                  onChange={(e) =>
                    setNewReceipt({
                      ...newReceipt,
                      quantity: e.target.value,
                    })
                  }
                  min="1"
                  required
                />

                <div className="form-buttons">

                  <button
                    type="submit"
                    className="save-button"
                  >
                    Validate Receipt
                  </button>

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() =>
                      setShowReceiptForm(false)
                    }
                  >
                    Cancel
                  </button>

                </div>

              </form>

            )}

            {/* RECEIPT HISTORY */}

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

                  {receipts.length === 0 ? (

                    <tr>

                      <td colSpan="5">
                        No receipts yet
                      </td>

                    </tr>

                  ) : (

                    receipts.map((receipt, index) => (

                      <tr key={index}>

                        <td>
                          {receipt.product}
                        </td>

                        <td>
                          {receipt.supplier}
                        </td>

                        <td>
                          +{receipt.quantity}
                        </td>

                        <td>
                          {receipt.date}
                        </td>

                        <td>
                          Validated
                        </td>

                      </tr>

                    ))

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