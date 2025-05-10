import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const SoldProductsModal = ({ show, closeModal }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (!show) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ดึงข้อมูล Sales ตาม branchid
        const salesRes = await axios.get(`${API_BASE_URL}/sales.json`);
        const salesData = salesRes.data || [];
        const filteredSales = salesData.filter((sale) => sale.branch_id === "ed787277-9cd0-4c99-9b47-4f7f93a694d8");
        const saleIds = filteredSales.map((sale) => sale.sale_id);

        if (saleIds.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        // ดึงข้อมูล SaleItems ตาม saleid
        const saleItemsRes = await axios.get(`${API_BASE_URL}/saleitems.json`);
        const saleItemsData = saleItemsRes.data || [];
        const filteredSaleItems = saleItemsData.filter((item) => saleIds.includes(item.sale_id));

        // รวมจำนวนสินค้าตาม productid
        const productSales = filteredSaleItems.reduce((acc, item) => {
          if (!acc[item.product_id]) {
            acc[item.product_id] = { quantity: 0, product_id: item.product_id };
          }
          acc[item.product_id].quantity += item.quantity;
          return acc;
        }, {});

        // ดึงข้อมูลสินค้า /products
        const productsRes = await axios.get(`${API_BASE_URL}/products.json`);

        const productData = productsRes.data || [];
        const productMap = productData.reduce((acc, product) => {
          acc[product.product_id] = {
            product_name: product.product_name,
            image_url: product.image_url || "https://via.placeholder.com/100", // รูป placeholder ถ้าไม่มี
          };
          return acc;
        }, {});

        // จัดรูปแบบข้อมูลสินค้าขายดี
        const sortedProducts = Object.values(productSales)
          .map((product) => ({
            ...product,
            product_name: productMap[product.product_id]?.product_name || "Unknown Product",
            image_url: productMap[product.product_id]?.image_url || "https://via.placeholder.com/100",
          }))
          .sort((a, b) => b.quantity - a.quantity);

        setProducts(sortedProducts);
      } catch (err) {
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [show]);

  const handleBackgroundClick = (e) => {
    if (e.target.id === "modal-overlay") {
      closeModal();
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          id="modal-overlay"
          onClick={handleBackgroundClick}
          className="fixed inset-0 bg-gray-900/50 flex justify-center items-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Total Sale Products</h2>

            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : products.length === 0 ? (
              <p className="text-gray-500">No products found.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <table className="table-auto table-xs min-w-full border-collapse border-2 border-gray-300 mb-4 text-gray-800">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="text-sm px-4 py-2">#</th>
                      <th className="text-sm px-4 py-2">Image</th>
                      <th className="text-sm px-4 py-2">Product Name</th>
                      <th className="text-sm px-4 py-2">Quantity Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2 text-center">{index + 1}</td>
                        <td className="border border-gray-300 px-4 py-2 flex items-center justify-center">
                          <img
                            src={product.image_url}
                            alt={product.product_name}
                            className="w-16 h-16 object-cover"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">{product.product_name}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{product.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SoldProductsModal;
