import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { FaEye, FaTrash } from "react-icons/fa"; // Import receipt and print icons
import { toast } from "react-toastify";
import { FaShippingFast, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const RequestShipment = ({ selectedBranchId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [shipmentItems, setShipmentItems] = useState([]);
  const [userBranchId, setUserBranchId] = useState(""); // ✅ เก็บ branchid ของผู้ใช้
  const [shipments, setShipments] = useState([]); // ✅ เก็บรายการ Shipments
  const [selectedShipment, setSelectedShipment] = useState(null); // ✅ Shipment ที่เลือกสำหรับดู Items
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false); // ✅ เปิด/ปิด Items Modal
  const [searchTerm, setSearchTerm] = useState(""); // ✅ State สำหรับช่องค้นหา
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // จำนวน shipments ต่อหน้า

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentShipments = [...shipments]
    .sort((a, b) => new Date(b.updatedat) - new Date(a.updatedat)) // เรียงจากใหม่ไปเก่า
    .slice(indexOfFirstItem, indexOfLastItem);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    axios.get(`${API_BASE_URL}/products.json`)
      .then((res) => {
        if (res.data && res.data && Array.isArray(res.data)) {
          setProducts(res.data); // ✅ ดึง products จาก res.data.Data
        } else {
          console.error("Unexpected response format:", res.data);
          setProducts([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch products:", err);
        setProducts([]);
      });
  }, []);
  
  useEffect(() => {
    setUserBranchId({branch_id: "ed787277-9cd0-4c99-9b47-4f7f93a694d8"});
  }, []);

  const fetchShipments = () => {
    axios.get(`${API_BASE_URL}/shipments.json?branch_id=${userBranchId}`)
      .then((res) => setShipments(res.data || []))
      .catch(() => setShipments([]));
  };
  
  useEffect(() => {
    if (!userBranchId) return;
    fetchShipments(); // เรียก fetchShipments ครั้งแรก
    const interval = setInterval(fetchShipments, 2000);
    return () => clearInterval(interval);
  }, [userBranchId]);
  

  // ✅ ดึงข้อมูล Shipments เฉพาะ branch ของผู้ใช้
  useEffect(() => {
    const fetchShipments = () => {
      axios
        .get(`${API_BASE_URL}/shipments.json?branch_id=${userBranchId}`)
        .then((res) => setShipments(res.data || []))
        .catch(() => setShipments([]));
    };
  
    // ✅ เรียก API ครั้งแรก
    fetchShipments();
  
    // ✅ ตั้ง interval ให้ polling ทุก 2 วินาที
    const interval = setInterval(fetchShipments, 2000);
  
    // ✅ Cleanup function ล้าง interval เมื่อ component unmount หรือ userBranchId เปลี่ยน
    return () => clearInterval(interval);
  }, [userBranchId]);
  
  // กรองรายการสินค้าตาม searchTerm ที่ค้นหาด้วย productcode
  const filteredProducts = products.filter((product) =>
    product.product_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ เปิด Items Modal และโหลดรายการสินค้าใน Shipment นั้น
  const handleViewItems = (shipment) => {
    setSelectedShipment(shipment);
    setShipmentItems(shipment.items || []);
    setIsItemsModalOpen(true);
  };

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) {
      toast.error("Please select a product and enter a valid quantity!");
      return;
    }

    setShipmentItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product_id === selectedProduct);
      if (existingItem) {
        return prevItems.map((item) =>
          item.product_id === selectedProduct ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevItems, { productid: selectedProduct, quantity }];
    });

    setSelectedProduct("");
    setQuantity(1);
  };

  const handleRemoveItem = (productid) => {
    setShipmentItems((prevItems) => prevItems.filter((item) => item.product_id !== productid));
  };

  const handleQuantityChange = (productid, newQuantity) => {
    if (newQuantity < 1) return;
    setShipmentItems((prevItems) =>
      prevItems.map((item) =>
        item.product_id === productid ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const renderStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FaShippingFast className="text-yellow-500 text-lg" title="Pending" />;
      case "complete":
        return <FaCheckCircle className="text-green-500 text-lg" title="Complete" />;
      case "reject":
        return <FaTimesCircle className="text-red-500 text-lg" title="Rejected" />;
      default:
        return <span className="text-gray-500">Unknown</span>;
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 mt-4"
      >
        Request Shipment
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gray-900/50 z-50 flex justify-center items-center"
            onClick={() => setIsModalOpen(false)} // ✅ ปิด modal เมื่อคลิกนอก modal
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-8 rounded-lg shadow-lg max-w-7xl w-full relative z-60 overflow-y-auto max-h-screen mt-10"
              onClick={(e) => e.stopPropagation()} // ✅ ป้องกัน modal ปิดเมื่อคลิกด้านใน
            >
              <h3 className="text-xl font-semibold text-gray-600 mb-4">
                Request Shipment from Warehouse
              </h3>
              <>
                <div className="flex gap-4 mb-4">
                
                  {/* ✅ ช่องค้นหาตาม productcode */}
                  <input
                    type="text"
                    placeholder="🔍 Search by Product Code"
                    className="w-1/3 p-3 border text-gray-600 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <select
                    className="w-full p-3 border text-gray-600 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                  >
                    <option value="">Select a product</option>
                    {filteredProducts.map((product) => (
                      <option key={product.product_id} value={product.product_id}>
                        {product.product_code} - {product.product_name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    className="w-1/6 p-3 border text-gray-600 text-center border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />

                  <button
                    onClick={handleAddItem}
                    className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
                  >
                    Add
                  </button>
                </div>

                <table className="table-auto table-xs w-full border-collapse border-4 border-gray-300 mb-4 text-gray-800">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="text-sm px-4 py-2">Product Code</th>
                      <th className="text-sm px-4 py-2">Product Name</th>
                      <th className="text-sm px-4 py-2">Quantity</th>
                      <th className="text-sm px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipmentItems.map((item) => {
                      const product = products.find((p) => p.product_id === item.product_id);
                      return (
                        <tr key={item.product_id} className="bg-gray-80 text-gray-600">
                          <td className="border border-gray-300 px-4 py-2">{product?.product_code || "Unknown"}</td>
                          <td className="border border-gray-300 px-4 py-2">{product?.product_name || "Unknown"}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <input
                              type="number"
                              min="1"
                              className="border bg-white p-1 rounded w-20 text-center"
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(item.product_id, Number(e.target.value))
                              }
                            />
                          </td>
                          <td className="px-4 py-2 flex items-center justify-center space-x-4">
                            <button
                              onClick={() => handleRemoveItem(item.product_id)}
                              className="btn btn-xs border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 flex items-center"
                              >
                                <FaTrash /> Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="flex justify-end items-center mt-6">
                  <div className="flex gap-3">
                    <button
                      className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
                    >
                      Submit Request
                    </button>
                    <button
                      onClick={() => setShipmentItems([])}
                      className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
                    >
                      <FaTrash />
                    Clear All
                  </button>       
                  </div>
                </div>
              </>  

              <h3 className="text-lg font-semibold text-gray-600 my-4">Shipments Table</h3>
              <table className="table-auto table-xs min-w-full border-4 border-gray-300 mb-4 text-gray-800">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="py-2 px-4 text-sm">Shipment Number</th>
                    <th className="py-2 px-4 text-sm">Status</th>
                    <th className="py-2 px-4 text-sm">Updated At</th>
                    <th className="py-2 px-4 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentShipments.map((shipment) => (
                    <tr key={shipment.shipment_id} className="hover:bg-gray-100">
                      <td className="border px-4 border-gray-300 text-gray-600">{shipment.shipment_number}</td>
                      <td className="border border-gray-300 flex justify-center items-center">{renderStatusIcon(shipment.status)}</td>
                      <td className="border px-4 border-gray-300 text-gray-600">
                        {new Date(shipment.updated_at).toISOString().slice(0, 16).replace("T", " ")}
                      </td>
                      <td className="border border-gray-300 flex items-center justify-center space-x-4">
                        <button
                          onClick={() => handleViewItems(shipment)}
                          className="btn btn-xs border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 flex items-center"
                          >
                            <FaEye /> View
                        </button>
   
                        <button
                            className="btn btn-xs border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 flex items-center"
                          >
                            <FaTrash /> Delete
                        </button>
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="flex justify-center mt-4 space-x-4">
                <button
                  className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </button>

                <div className="flex items-center">Page {currentPage} of {Math.ceil(shipments.length / itemsPerPage)}</div>

                <button
                  className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
                  disabled={currentPage === Math.ceil(shipments.length / itemsPerPage)}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
      {isItemsModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-gray-900/50 z-50 flex justify-center items-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-8 rounded-lg shadow-lg w-3/4 relative z-60 overflow-y-auto max-h-screen"
          >
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Shipment Items</h2>
            <p className="text-gray-600 mb-4">Shipment Number - {selectedShipment?.shipment_number}</p>

            {/* ตารางรายการสินค้า */}
            <table className="table-auto table-xs min-w-full border-4 border-gray-300 mb-4 text-gray-800">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="py-2 px-4 text-sm">Image</th>
                  <th className="py-2 px-4 text-sm">Product Code</th>
                  <th className="py-2 px-4 text-sm">Product Name</th>
                  <th className="py-2 px-4 text-sm">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {shipmentItems.map((item, index) => {
                  const product = products.find((p) => p.product_id === item.product_id);
                  return (
                    <tr key={index} className="border border-gray-300">
                      {/* รูปสินค้า */}
                      <td className="px-4 py-2 text-center">
                        {product?.image_url ? (
                          <img src={product.image_url} alt={product.product_name} className="w-12 h-12 object-cover rounded-md mx-auto" />
                        ) : (
                          "N/A"
                        )}
                      </td>
                      {/* รหัสสินค้า */}
                      <td className="border py-2 px-4 border-gray-300 text-gray-600">{product?.product_code || "N/A"}</td>
                      {/* ชื่อสินค้า */}
                      <td className="border py-2 px-4 border-gray-300 text-gray-600">{product?.product_name || "Unknown"}</td>
                      {/* จำนวนสินค้า */}
                      <td className="border py-2 px-4 border-gray-300 text-gray-600">{item.quantity}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* ปุ่มปิด */}
            <div className="flex justify-end">
              <button
                className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
                onClick={() => setIsItemsModalOpen(false)}
              >
                Close
              </button>
            </div> 
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default RequestShipment;
