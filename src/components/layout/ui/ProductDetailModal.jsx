import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const ProductDetailModal = ({ product, onClose }) => {
  const [categoryName, setCategoryName] = useState("");
  const [isOpen, setIsOpen] = useState(!!product); // ควบคุมการแสดงผล modal

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (product) {
      setIsOpen(true); // เปิด modal เมื่อมีข้อมูลสินค้า
      fetchCategoryName();
    }
  }, [product]);

  const fetchCategoryName = async () => {
    try {

      const response = await axios.get(`${API_BASE_URL}/category.json`);
      const categories = response.data;

      const matchedCategory = categories.find(
        (cat) => cat.category_id === product.category_id
      );

      setCategoryName(matchedCategory ? matchedCategory.category_name : "Unknown Category");
    } catch (error) {
      console.error("Error fetching category:", error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // รอ 300ms เพื่อให้ animation exit ทำงานก่อนลบออกจาก DOM
  };

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex justify-center items-center bg-gray-900/50 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-5xl h-full md:h-auto relative flex flex-col md:flex-row border border-gray-300 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* 🔹 ปุ่มปิดโมดอล */}
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-all"
              onClick={handleClose}
            >
              <FaTimes size={24} />
            </button>

            {/* 🔹 รูปภาพสินค้า */}
            <div className="w-full md:w-1/3 flex justify-center items-center p-4">
              <img
                src={product.image_url}
                alt={product.product_name}
                className="w-64 h-64 object-cover"
              />
            </div>

            {/* 🔹 รายละเอียดสินค้า */}
            <div className="w-full md:w-2/3 p-4">
              <h2 className="text-3xl font-bold text-red-600 mb-4">{product.product_name}</h2>
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr>
                    <td className="font-semibold text-gray-700 py-2 w-1/3">Product Code:</td>
                    <td className="text-gray-600">{product.product_code}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-gray-700 py-2">Category:</td>
                    <td className="text-gray-600">{categoryName}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-gray-700 py-2">Price:</td>
                    <td className="text-green-600 font-bold">฿{product.price.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-gray-700 py-2">Description:</td>
                    <td className="text-gray-600">{product.description}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductDetailModal;
