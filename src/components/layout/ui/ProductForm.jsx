import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const IMG_BB_API_KEY = "e71bdf3bd6dc220c4ddaf2fd9d9db287";

const ProductForm = ({ onProductAdded }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState(""); // 🔹 แก้ให้สามารถใส่ URL ได้เอง
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [uploading, setUploading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/category.json`);
        setCategories(response.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 mt-4"
      >
        + Add Product
      </button>

      <ToastContainer />
      
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 flex justify-center items-center bg-gray-900/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-3xl relative"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-center text-red-600 mb-6">Add Product</h2>

              {/* พื้นที่ Drag & Drop */}
              <div
                className="border-dashed border-2 border-gray-400 p-6 text-center rounded-lg cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
              >
                {uploading ? (
                  <p className="text-gray-500">Uploading...</p>
                ) : imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Uploaded Preview"
                    className="w-40 h-40 object-cover mx-auto rounded-lg shadow-lg border border-gray-200"
                  />
                ) : (
                  <p className="text-gray-500">Drag & Drop Image Here</p>
                )}
              </div>

              <form className="grid grid-cols-2 gap-4 mt-4">
                <InputField label="Product Name" value={productName} onChange={setProductName} />
                <InputField label="Price" value={price} onChange={setPrice} type="number" />

                {/* 🔹 ช่องให้พิมพ์หรือวาง URL ของรูป */}
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Image URL</label>
                  <input
                    type="text"
                    className="w-full p-3 border text-gray-600 border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste image URL here"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Category</label>
                  <select
                    className="w-full p-3 border text-gray-600 border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.category_id} value={category.category_id}>
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-gray-700 font-medium mb-1">Description</label>
                  <textarea
                    className="w-full p-3 border text-gray-600 border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="col-span-2">
                  <button
                    type="submit"
                    className="btn w-full border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
                  >
                    Add Product
                  </button>
                </div>
              </form>

              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-3 right-4 text-gray-500 text-xl"
              >
                &times;
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InputField = ({ label, value, onChange, type = "text" }) => (
  <div>
    <label className="block text-gray-700 font-medium mb-1">{label}</label>
    <input
      type={type}
      className="w-full p-3 border text-gray-600 border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export default ProductForm;
