import { useState, useEffect } from "react";
import axios from "axios";
import { FaTrashAlt } from "react-icons/fa";
import PaymentModal from "../components/layout/ui/PaymentModal";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from "framer-motion"; 

const SalesPage = () => {
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cart, setCart] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [employee, setEmployee] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // New state for search query
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {

    setEmployee({
      employeeid: "3cbfb925-0ef1-4d38-bf26-7a55ad746f15",
      email: "admin@admin.com",
      name: "Super Admin",
      role: "Super Admin",
      branchid: "ed787277-9cd0-4c99-9b47-4f7f93a694d8"
    });

    setSelectedBranch("ed787277-9cd0-4c99-9b47-4f7f93a694d8"); 

  }, []);

  const fetchData = async () => {
    try {
      const [productRes, branchRes, inventoryRes, categoryRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/products.json`),
        axios.get(`${API_BASE_URL}/branches.json`),
        axios.get(`${API_BASE_URL}/inventory.json`),
        axios.get(`${API_BASE_URL}/category.json`),
      ]);

      setProducts(productRes.data);
      setInventory(inventoryRes.data);
      setCategories(categoryRes.data);
      
      const filteredBranches = branchRes.data.filter(
        (branch) => branch.branch_id === employee?.branch_id
      );
      setBranches(filteredBranches);
    } catch (err) {
      console.error("Error fetching data", err);
    }
  };

  useEffect(() => {
    if (employee) {
      fetchData();
    }
  }, [employee]);

  const handleBranchChange = (event) => {
    const branchId = event.target.value;
    setSelectedBranch(branchId);
    setCart([]);
    setTotalAmount(0);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const filterInventoryByProduct = () => {
    if (!selectedBranch) return [];
  
    return products.filter((product) => {
      const inventoryItem = inventory.find(
        (item) => item.product_id === product.product_id && item.branch_id === selectedBranch
      );
      const inCategory = !selectedCategory || product.category_id === selectedCategory;
      const matchesSearchQuery =
        !searchQuery || product.product_code.toLowerCase().includes(searchQuery.toLowerCase());
  
      // ถ้า checkbox เปิดอยู่ จะแสดงเฉพาะสินค้าที่มี stock (quantity > 0)
      const hasStock = !showAvailableOnly || (inventoryItem && inventoryItem.quantity > 0);
  
      return inventoryItem && inCategory && matchesSearchQuery && hasStock;
    });
  };

  const handleAddToCart = (product) => {
    if (!selectedBranch) {
      toast.warning("Please select a branch first");
      return;
    }

    const inventoryItem = inventory.find(
      (item) => item.product_id === product.product_id && item.branch_id === selectedBranch
    );

    if (!inventoryItem || inventoryItem.quantity === 0) {
      toast.error("Out of stock");
      return;
    }

    const existingProduct = cart.find((item) => item.product_id === product.product_id);
    const maxQuantity = inventoryItem.quantity;

    if (existingProduct) {
      if (existingProduct.quantity >= maxQuantity) {
        toast.error(`Cannot increase quantity beyond ${inventoryItem.quantity}.`, {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        return;
      }
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart((prevCart) => [
        ...prevCart,
        { ...product, quantity: 1, branchid: selectedBranch },
      ]);
    }
  };

  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotalAmount(total);
  }, [cart]);

  const handleCheckout = () => {
    if (!selectedBranch) {
      toast.warning("Select branch before checkout");
      return;
    }

    if (cart.length === 0) {
      toast.warning("Your cart is empty, select some products to checkout");
      return;
    }

    setCart([]);
    setTotalAmount(0);
  };

  const handleIncreaseQuantity = (productId) => {
    const productInCart = cart.find((item) => item.productid === productId);
  
    if (!productInCart) return;
  
    const inventoryItem = inventory.find(
      (item) => item.product_id === productInCart.product_id && item.branch_id === selectedBranch
    );
  
    if (inventoryItem && productInCart.quantity >= inventoryItem.quantity) {
      toast.error(`Cannot increase quantity beyond ${inventoryItem.quantity}.`, {
        position: "top-right",
        autoClose: 2000,  // Toast จะหายหลังจาก 2 วินาที
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }
  
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productid === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const handleDecreaseQuantity = (productId) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productid === productId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const handleQuantityChange = (productId, newQuantity) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productid === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product_id !== productId));
  };

  const handleContinue = () => {
    // ตรวจสอบว่า cart มีข้อมูลหรือไม่
    if (cart.length === 0) {
      // ถ้าไม่มีสินค้าในตะกร้า ให้แสดง Toast
      toast.error("Your cart is empty! Please add items before proceeding.");
      return; // หยุดการทำงานถ้า cart ว่าง
    }
  
    // เก็บข้อมูลใน localStorage
    localStorage.setItem("cartData", JSON.stringify(cart));
  
    // เปิด Modal
    setIsModalOpen(true);
  };

  // ฟังก์ชันสำหรับล้างสินค้าทั้งหมดในตะกร้า
  const handleClearCart = () => {
    setCart([]);
    setTotalAmount(0);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-6"> 
      <ToastContainer />
      <h1 className="text-3xl font-bold text-red-600 mb-4">Sales Product</h1>

      {alertMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg">
          {alertMessage}
        </div>
      )}

      <motion.div 
        className="w-full overflow-x-scroll scrollbar-hide whitespace-nowrap py-6 flex border-b border-gray-300"
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* ปุ่ม "All Items" */}
        <button
          onClick={() => handleCategoryChange("")}
          className={`px-4 py-2 text-sm font-medium ${
            selectedCategory === ""
              ? "text-red-600 font-bold border-b-2 border-red-500"
              : "text-gray-500 hover:text-gray-600"
          }`}
        >
          All Items
        </button>

        {/* ปุ่มหมวดหมู่สินค้า */}
        {categories.map((category) => (
          <motion.button
            key={category.category_id}
            onClick={() => handleCategoryChange(category.category_id)}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 text-sm font-medium ${
              selectedCategory === category.category_id
                ? "text-red-600 font-bold border-b-2 border-red-500"
                : "text-gray-500 hover:text-gray-600"
            }`}
          >
            {category.category_name}
          </motion.button>
        ))}
      </motion.div>

      <div className="flex flex-col md:flex-row gap-4">

        {/* รายการสินค้า */}
        <div className="w-full md:w-3/5">

          <div className="my-6 flex items-center gap-4">
            {/* ช่องค้นหา */}
            <input
              type="text"
              placeholder="🔍 Search by Product code"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-3/4 border bg-white border-gray-300 p-3 pr-10 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            
            {/* Checkbox สำหรับกรองเฉพาะสินค้าที่มีอยู่ */}
            <label className="flex items-center space-x-2 text-gray-600">
              <input
                type="checkbox"
                checked={showAvailableOnly}
                onChange={() => setShowAvailableOnly(!showAvailableOnly)}
                className="checkbox border-red-600 [--chkbg:theme(colors.red.500)] [--chkfg:white] checked:border-red-600 text-red-600"
              />
              <span>Show Available Only</span>
            </label>
          </div>
 
          {/* รายการสินค้า */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded h-auto overflow-y-auto mb-6">
            {selectedBranch ? (
              filterInventoryByProduct().map((product) => {
                const stock =
                  inventory.find(
                    (item) => item.product_id === product.product_id && item.branch_id === selectedBranch
                  )?.quantity || 0;
                return (
                  <button
                    key={product.product_id}
                    onClick={() => handleAddToCart(product)}
                    className={`card border border-slate-300 shadow-xl p-4 flex flex-col justify-between items-center transition-transform transform hover:border-red-700 scale-105 ${
                      stock === 0 ? "opacity-50" : ""
                    }`}
                  >
                    <figure className="flex justify-center items-center h-2/3 w-2/3">
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="max-h-full max-w-full"
                      />
                    </figure>
                    <div className="text-center my-2">
                      <h2 className="text-gray-600 text-xs truncate w-32">{product.product_name}</h2>
                      <p className="text-xs text-gray-600 mt-4">฿{product.price.toFixed(2)}</p>
                      <p className="text-xs text-gray-600 mt-1">Stock: {stock}</p>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-center col-span-5">Please select a branch to view products.</p>
            )}
          </div>
        </div>

        {/* ตะกร้าสินค้า */}
        <div className="w-full md:w-2/5">
          <div className="flex justify-end my-6">
            {/* เลือกสาขา */}
            <select
              id="branch-select"
              value={selectedBranch || ""}
              onChange={handleBranchChange}
              disabled={!!selectedBranch}
              className="w-2/3 bg-white border border-gray-300 text-gray-500 font-semibold p-3 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 transition"
            >
              <option value="" className="text-gray-500">Select Branch</option>
              {branches.map((branch) => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.b_name}
                </option>
              ))}
            </select>
          </div>

          {/* กล่องตะกร้า */}
          <div className="border-2 border-gray-200 p-6 rounded-lg mb-6 sticky top-0 bg-white">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg text-gray-600 font-semibold">Your Cart</h3>
              <button
                onClick={handleClearCart}
                className="cursor-pointer text-red-600 flex items-center gap-2 font-semibold"
              >
                <FaTrashAlt />
                Clear All
              </button>
            </div>

            {/* รายการสินค้าในตะกร้า */}
            <div className="border p-6 rounded h-96 overflow-y-auto mb-6">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500">Your cart is empty</p>
              ) : (
                cart.map((item) => (
                  <div key={item.product_id} className="text-gray-600 mb-6">
                    <div className="mb-2 text-red-600">{item.product_name}</div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 justify-end mr-2 mt-2">฿{item.price.toFixed(2)}</span>
                      <div className="flex items-center">
                        <button
                          onClick={() => handleDecreaseQuantity(item.product_id)}
                          className="text-red-600 text-xl bg-white w-10 h-8 flex justify-center items-center border-1 p-1 rounded-l"
                        >
                          -
                        </button>
                        <input
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.product_id, parseInt(e.target.value) || 1)}
                          className="text-gray-600 text-center bg-white w-14 h-8 border-2 border-gray-300 p-1 mx-0"
                          min="1"
                        />
                        <button
                          onClick={() => handleIncreaseQuantity(item.product_id)}
                          className="text-red-600 text-xl bg-white w-10 h-8 flex justify-center items-center border-1 p-1 rounded-r"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(item.product_id)}
                        className="cursor-pointer ml-4 text-red-600 hover:text-red-800"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* สรุปราคาทั้งหมด */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Total</h3>
              <div className="flex justify-between">
                <p className="text-lg text-gray-600">{cart.reduce((sum, item) => sum + item.quantity, 0)} items</p>
                <p className="text-lg text-gray-600">{totalAmount.toFixed(2)} THB</p>
              </div>
            </div>

            {/* ปุ่มดำเนินการต่อ */}
            <div className="flex justify-between mb-6">
              <button
                onClick={handleContinue}
                className="btn w-full border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>


      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        totalAmount={totalAmount}
        onCheckout={handleCheckout}
      />
    </div>
  );
};

export default SalesPage;
