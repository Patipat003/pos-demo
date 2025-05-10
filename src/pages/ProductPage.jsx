import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; 
import ProductForm from "../components/layout/ui/ProductForm";
import EditedProduct from "../components/layout/ui/EditedProduct";
import { toZonedTime, format } from 'date-fns-tz';
import { FaTrash } from "react-icons/fa";
import { AiOutlineExclamationCircle   } from "react-icons/ai"; // Error Icon
import { Player } from "@lottiefiles/react-lottie-player"; // Lottie Player
import CategoryModal from "../components/layout/ui/CategoryModal";
import ProductDetailModal from "../components/layout/ui/ProductDetailModal";

const formatDate = (dateString) => {
  if (!dateString) return "N/A"; // ตรวจสอบค่าว่าง
  try {
    const zonedDate = toZonedTime(new Date(dateString), "UTC");
    return format(zonedDate, "d/MM/yyyy, HH:mm");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

const ProductPage = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(""); // New state for category
  const [inventory, setInventory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false); // จัดการ Modal

  const itemsPerPage = 20; // จำนวนรายการต่อหน้า
  const [currentProductPage, setCurrentProductPage] = useState(1);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // ฟังก์ชันดึงข้อมูลสินค้าและสต็อก
  const fetchProducts = async () => {
      const [productResponse, inventoryResponse, categoryResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/products.json`),
        axios.get(`${API_BASE_URL}/inventory.json`),
        axios.get(`${API_BASE_URL}/category.json`),
      ]);
      
      const inventoryMap = {};
      inventoryResponse.data.forEach((item) => {
        inventoryMap[item.product_id] = item.quantity; // เก็บข้อมูล quantity ตาม product
      });

      setProducts(productResponse.data);
      setInventory(inventoryMap);
      setCategories(categoryResponse.data);
      setLoading(false);
  };

  // ฟังก์ชันสำหรับการเปลี่ยนแปลงการเลือก category
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

    // รีเฟรชข้อมูลสินค้าเมื่อมีการเพิ่มสินค้าใหม่
  const handleProductAdded = () => {
    fetchProducts();
  };

  // รีเฟรชข้อมูลสินค้าเมื่อมีการแก้ไขสินค้า
  const handleEditedProduct = () => {
    fetchProducts();
  };


  useEffect(() => {
    fetchProducts();
    
    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchProducts();
    }, 5000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);

  const filteredProducts = selectedCategory
    ? products.filter((product) => product.category_id === selectedCategory)
    : products;

  // คำนวณจำนวนหน้าทั้งหมด
  const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // ตรวจสอบและรีเซ็ต currentProductPage ถ้ามันเกินจำนวนหน้าที่มีจริง
  useEffect(() => {
    if (currentProductPage > totalProductPages) {
      setCurrentProductPage(totalProductPages > 0 ? totalProductPages : 1);
    }
  }, [filteredProducts, totalProductPages]);


  // ฟังก์ชันสำหรับแบ่งหน้าข้อมูลสินค้า
  const getPaginatedProducts = () => {
    const startIndex = (currentProductPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  };

  // ป้องกัน pagination แสดงหน้าที่เกินจำนวนที่มี
  useEffect(() => {
    if (currentProductPage > totalProductPages) {
      setCurrentProductPage(1);
    }
  }, [filteredProducts, totalProductPages]);

  // ฟังก์ชันการเปลี่ยนหน้า
  const handlePreviousPageProduct = () => {
    if (currentProductPage > 1) {
      setCurrentProductPage(currentProductPage - 1);
    }
  };

  const handleNextPageProduct = () => {
    if (currentProductPage < totalProductPages) {
      setCurrentProductPage(currentProductPage + 1);
    }
  };

  // รีเซ็ตหน้าเมื่อมีการค้นหาหรือเปลี่ยนหมวดหมู่
  useEffect(() => {
    setCurrentProductPage(1);
  }, [searchQuery, selectedCategory]);


  const fetchCategories = async () => {
    const categoryResponse = await axios.get(`${API_BASE_URL}/category.json`);
    setCategories(categoryResponse.data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.category_id === categoryId);
    return category ? category.category_name : "Unknown";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-42 flex-col">
        <Player
          autoplay
          loop
          src="https://assets3.lottiefiles.com/packages/lf20_z4cshyhf.json" // ตัวอย่าง: "POS Loading"
          style={{ height: "200px", width: "200px" }}
        />
        <span className="text-red-500 text-lg font-semibold">Loading...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center mt-2">
        <AiOutlineExclamationCircle className="text-red-500 text-6xl mb-4" />
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  const paginatedProducts = getPaginatedProducts();

  const exportToCSV = () => {
    if (filteredProducts.length === 0) {
      alert("No data available to export.");
      return;
    }
  
    const BOM = "\uFEFF"; // เพิ่ม BOM เพื่อรองรับ UTF-8 ใน Excel
    const csvRows = [];
    const headers = [
      "Product Code", "Name", "Description", "Category", "Price", "Created At"
    ];
    csvRows.push(headers.join(",")); // เพิ่ม Header
  
    filteredProducts.forEach((item) => {
      const row = [
        `"${item.product_code}"`,    // Product Code
        `"${item.product_name}"`,    // Name
        `"${item.description || ''}"`, // Description (กันค่า null)
        `"${getCategoryName(item.category_id)}"`, // Category Name
        `"${item.price.toFixed(2)}"`, // Price
        `"${formatDate(item.created_at)}"` // Created At
      ];
      csvRows.push(row.join(","));
    });
  
    const csvString = BOM + csvRows.join("\n"); // ใส่ BOM นำหน้า
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ProductData.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
      <h1 className="text-3xl font-bold text-red-600 mb-6">Product Management</h1>
      <p className="text-gray-600 mb-4">Manage your Product here.</p>

      {/* Category Dropdown */}
      <div className="mb-4">
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="select text-gray-600 select-bordered border border-gray-300 w-full max-w-xs rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.category_id} value={category.category_id}>
              {category.category_name}
            </option>
          ))}
        </select>
      </div>

      {/* Product List */}
      <div className="mb-6">
        <div className="relative w-full mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search by Product Code / Product Name"
            className="border bg-white border-gray-300 p-3 pr-10 text-gray-600 rounded-md w-full items-center focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          )}
        </div>

        {/* 🔹 Show Detail Modal when a product is selected */}
        {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}

        {/* Scrollable Product Grid */}
        <div
          className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 max-h-96 overflow-y-auto"  // This makes the grid scrollable
          style={{ maxHeight: '400px' }}  // You can adjust the height as needed
        >
          {filteredProducts
            .filter((product) =>
              searchQuery
                ? product.product_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
                : true
            )            
            .map((product) => (
              <div
                key={product.product_id}
                className="border border-gray-300 p-4 rounded flex flex-col items-center cursor-pointer"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="w-24 h-24 bg-gray-200 mb-2 rounded">
                  <img
                    src={product.image_url}
                    alt={product.product_name}
                    className="w-full h-full object-cover rounded"
                  />
                </div>        
                <div className="text-gray-600 text-sm mb-2 font-semibold truncate w-32 text-center">{product.product_name}</div>

                <div className="text-gray-600 text-xs mb-2 font-semibold">{product.product_code}</div>
                <div className="text-gray-600 text-sm">Price : ฿{product.price.toFixed(2)}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Product Table */}
      <div className="min-w-full">
        <h2 className="text-2xl font-bold text-red-600 my-4">Product Table</h2>
        <div className="flex space-x-4 mb-4">
          <>
            <ProductForm onProductAdded={handleProductAdded} />
            {/* Category */}
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 mt-4"
            >
              + Add Category
            </button>
          </>
          <button
            onClick={exportToCSV}
            className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 mt-4"
          >
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto mb-6">
          <table className="table-auto table-xs min-w-full border-collapse border-4 border-gray-300 mb-4 text-gray-800">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                {/* <th className="border text-sm px-4 py-2 text-left">No.</th> */}
                <th className="text-sm px-4 py-2 text-left">Product Code</th>
                <th className="text-sm px-4 py-2">Name</th>
                <th className="text-sm px-4 py-2">Description</th>
                <th className="text-sm px-4 py-2">Category</th>
                <th className="text-sm px-4 py-2">Price</th>
                <th className="text-sm px-4 py-2">Created</th>
                <th className="py-2 px-4 text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts
                .filter((product) =>
                  searchQuery
                    ? product.product_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
                    : true
                )                
                .map((product) => (
                  <tr key={product.product_id} className="hover:bg-gray-100 text-gray-600">
                    {/* <td className="border border-gray-300 px-4 py-2">{index + 1}</td> */}
                    <td className="border border-gray-300 px-4 py-2">{product.product_code}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="truncate max-w-xs">{product.product_name}</div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="truncate max-w-xs">{product.description}</div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{getCategoryName(product.category_id)}</td>
                    <td className="border border-gray-300 px-4 py-2">฿{product.price.toFixed(2)}</td>
                    <td className="border border-gray-300 px-4 py-2">{formatDate(product.created_at)}</td>
                    <td className="border border-gray-300 px-4 py-2 flex justify-center space-x-4">
                      <EditedProduct
                        productId={product.product_id}
                        onProductUpdated={fetchProducts}
                      />
                      <button
                        className="btn btn-xs border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
                      >
                        <FaTrash className="mr-1" />Delete
                      </button>
                    </td>                       
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Category Modal */}
        {isCategoryModalOpen && (
          <CategoryModal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            onCategoryAdded={fetchCategories} // รีเฟรช Categories เมื่อเพิ่มใหม่
          />
        )}

        {/* Pagination Controls */}
        <div className="flex justify-center mt-4 space-x-4">
          <button
            onClick={handlePreviousPageProduct}
            disabled={currentProductPage === 1}
            className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
          >
            Previous
          </button>
          <div className="flex items-center text-gray-500">
            Page {currentProductPage} of {totalProductPages}
          </div>
          <button
            onClick={handleNextPageProduct}
            disabled={currentProductPage === totalProductPages}
            className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
          >
            Next
          </button>
        </div>
      </div>

    </div>
  );
};

export default ProductPage;