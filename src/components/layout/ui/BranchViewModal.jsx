import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaTimes } from "react-icons/fa";
import {HiOutlineEye} from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import Chart from "react-apexcharts";
import ProductDetailModal from "./ProductDetailModal";
import moment from "moment"; // ✅ Import Moment.js
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useStockThreshold } from "../../../Contexts/StockThresholdContext";

const BranchViewModal = ({ branch, onClose }) => {
  const [salesData, setSalesData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState({});
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [chartView, setChartView] = useState("daily");
  const [selectedProduct, setSelectedProduct] = useState(null);

   // ✅ State สำหรับ Pagination
  const [currentPageEmployees, setCurrentPageEmployees] = useState(1);
  const [currentPageInventory, setCurrentPageInventory] = useState(1);
  const itemsPerPage = 20; // ✅ กำหนดให้แสดงหน้าละ 20 รายการ
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { lowStockThreshold, warningMin, warningMax } = useStockThreshold();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [salesRes, saleItemsRes, employeesRes, inventoryRes, productsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/sales.json`),
          axios.get(`${API_BASE_URL}/saleitems.json`),
          axios.get(`${API_BASE_URL}/employees.json`),
          axios.get(`${API_BASE_URL}/inventory.json`),
          axios.get(`${API_BASE_URL}/products.json`),
        ]);

        const sales = salesRes.data || [];
        const saleItems = saleItemsRes.data || [];
        const employeesData = employeesRes.data || [];
        const inventoryData = inventoryRes.data || [];
        const productsData = productsRes.data || [];

        const branchSales = sales.filter((sale) => sale.branch_id === branch.branch_id);
        const branchSaleItems = saleItems.filter((item) =>
          branchSales.some((sale) => sale.sale_id === item.sale_id)
        );
        const branchEmployees = employeesData.filter((emp) => emp.branch_id === branch.branch_id);
        const branchInventory = inventoryData.filter((inv) => inv.branch_id === branch.branch_id);

        const productMap = {};
        productsData.forEach((prod) => {
          productMap[prod.product_id] = {
            productname: prod.product_name,
            productcode: prod.product_code,
            categoryid: prod.category_id,
            description: prod.description,
            price: prod.price,
            imageurl: prod.image_url,
          };
        });

        setSalesData(branchSales.map((sale) => ({
          ...sale,
          items: branchSaleItems.filter((item) => item.sale_id === sale.sale_id),
        })));
        setEmployees(branchEmployees);
        setInventory(branchInventory);
        setProducts(productMap);
      } catch (error) {
        console.error("Error fetching branch details:", error);
      }
    };

    fetchDetails();
  }, [branch.branch_id]);

  // 🔹 คำนวณแนวโน้มยอดขาย
  const aggregateSales = (view) => {
    if (!salesData.length) return { categories: [], series: [] };
  
    const salesByPeriod = {};
  
    salesData.forEach((sale) => {
      const date = moment(sale.created_at); // ✅ ใช้ moment() แปลงวันที่
      if (!date.isValid()) return;
  
      let key;
      if (view === "daily") {
        key = date.format("D/M/YY"); // ✅ เปลี่ยนรูปแบบเป็น "1/11/25"
      } else if (view === "weekly") {
        key = `${date.year()}-W${date.week()}`;
      } else if (view === "monthly") {
        key = date.format("M/YY");
      } else {
        key = date.format("YY");
      }
  
      if (!salesByPeriod[key]) {
        salesByPeriod[key] = 0;
      }
  
      sale.items.forEach((item) => {
        if (!selectedProductId || item.product_id === selectedProductId) {
          salesByPeriod[key] += item.quantity;
        }
      });
    });
  
    return {
      categories: Object.keys(salesByPeriod).sort(),
      series: [{ name: "Sales", data: Object.values(salesByPeriod) }],
    };
  };

  const customIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const location = branch.google_location?.split(",") || [];
  const latitude = parseFloat(location[0]);
  const longitude = parseFloat(location[1]);

  const salesTrend = aggregateSales(chartView);

  // ✅ คำนวณหน้าปัจจุบันของ Employees และ Inventory
  const indexOfLastEmployee = currentPageEmployees * itemsPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - itemsPerPage;
  const currentEmployees = employees.slice(indexOfFirstEmployee, indexOfLastEmployee);

  const indexOfLastInventory = currentPageInventory * itemsPerPage;
  const indexOfFirstInventory = indexOfLastInventory - itemsPerPage;
  const currentInventory = inventory.slice(indexOfFirstInventory, indexOfLastInventory);

  return (
    <AnimatePresence>
      {branch && (
        <div className="fixed inset-0 bg-gray-900/50 flex justify-center items-start z-50 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-lg max-w-7xl w-full relative mt-10"
            onClick={(e) => e.stopPropagation()} // 🔹 ป้องกันการปิดเมื่อคลิกด้านใน
          >
            {/* 🔹 ปุ่มปิดโมดอล */}
            <button className="absolute top-4 right-4 text-gray-600 hover:text-red-500" onClick={onClose}>
              <FaTimes size={20} />
            </button>

            <h2 className="text-2xl font-bold text-red-500 mb-6">
              📍 {branch?.b_name || "N/A"} ({branch.location})
            </h2>

            {/* ✅ เพิ่มแผนที่  */}
            <div className="mb-6">
              {/* แสดงแผนที่เฉพาะเมื่อมีพิกัด */}
              {latitude && longitude ? (
                <div className="mt-4 h-96 w-full rounded-lg shadow-md overflow-hidden">
                  <MapContainer center={[latitude, longitude]} zoom={13} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[latitude, longitude]} icon={customIcon}>
                      <Popup>{branch.b_name}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              ) : (
                <p className="text-red-500 mt-4">📍 No location data available for this branch.</p>
              )}
            </div>

            {/* ✅ Employee List as Table */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-red-600 mb-6">👥 Employee List</h3>
              <table className="table-auto table-xs min-w-full border-4 border-gray-300 mb-4 text-gray-800">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="py-2 px-4 text-sm">Employee Name</th>
                    <th className="py-2 px-4 text-sm">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEmployees.map((emp) => (
                    <tr key={emp.employee_id} className="hover:bg-gray-100 text-gray-600">
                      <td className="border py-2 px-4 border-gray-300 text-blac">{emp.name}</td>
                      <td className="border py-2 px-4 border-gray-300 text-blac">{emp.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ✅ Pagination Controls for Employees */}
            <div className="flex justify-center mt-4 space-x-4">
              <button
                className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
                onClick={() => setCurrentPageEmployees((prev) => Math.max(prev - 1, 1))}
                disabled={currentPageEmployees === 1}
              >
                Previous
              </button>
              <div className="flex items-center text-gray-500">Page {currentPageEmployees}</div>
              <button
                className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
                onClick={() => setCurrentPageEmployees((prev) => (indexOfLastEmployee < employees.length ? prev + 1 : prev))}
                disabled={indexOfLastEmployee >= employees.length}
              >
                Next
              </button>
            </div>

            {/* 🔹 ปุ่มเลือกช่วงเวลา */}
            <h3 className="text-xl font-semibold text-red-600 mb-6">📦 Sales Graph</h3>
            <div className="flex justify-between items-center mb-4">
              
            <div>
              <button className={`mr-2 px-4 py-2 ${chartView === "daily" ? "btn bg-red-800 border-none hover:bg-red-900" : "btn bg-gray-800 border-none hover:bg-red-800 hover:border-none"} text-white`} onClick={() => setChartView("daily")}>
                Daily
              </button>
              <button className={`mr-2 px-4 py-2 ${chartView === "weekly" ? "btn bg-red-800 border-none hover:bg-red-900" : "btn bg-gray-800 border-none hover:bg-red-800 hover:border-none"} text-white`} onClick={() => setChartView("weekly")}>
                Weekly
              </button>
              <button className={`mr-2 px-4 py-2 ${chartView === "monthly" ? "btn bg-red-800 border-none hover:bg-red-900" : "btn bg-gray-800 border-none hover:bg-red-800 hover:border-none"} text-white`} onClick={() => setChartView("monthly")}>
                Monthly
              </button>
              <button className={`px-4 py-2 ${chartView === "yearly" ? "btn bg-red-800 border-none hover:bg-red-900" : "btn bg-gray-800 border-none hover:bg-red-800 hover:border-none"} text-white`} onClick={() => setChartView("yearly")}>
                Yearly
              </button>
            </div>

            {/* 🔹 Dropdown เลือกสินค้าที่ต้องการดูแนวโน้ม */}
            <select className="p-3 border text-gray-600 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500" value={selectedProductId || ""} onChange={(e) => setSelectedProductId(e.target.value)}>
              <option value="">All Products</option>
                {Object.keys(products).map((id) => (
                  <option key={id} value={id}>
                    {products[id].product_name}
                  </option>
                ))}
              </select>
            </div>

            {/* 🔹 กราฟแนวโน้มยอดขาย */}
            <Chart 
              options={{
                chart: { type: "line" },
                xaxis: { categories: salesTrend.categories },
                stroke: { curve: "smooth", width: 2 }, // เส้นโค้งและความหนา
                colors: ["#8B0000"], // 🔥 ใช้สีแดงเข้ม (Dark Red)
              }} 
              series={salesTrend.series} 
              type="line" 
              height={350} 
            />

            {/* ✅ รายการสินค้าและสต็อก */}
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-red-600 mb-6">📦 Inventory</h3>
              <table className="table-auto table-xs min-w-full border-4 border-gray-300 mb-4 text-gray-800">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="py-2 px-4 text-sm">Code</th>
                    <th className="py-2 px-4 text-sm">Product</th>
                    <th className="py-2 px-4 text-sm">Stock</th>
                    <th className="py-2 px-4 text-sm">Sold</th>
                    <th className="py-2 px-4 text-sm">Price</th>
                    <th className="py-2 px-4 text-sm">Total Price</th>
                    <th className="py-2 px-4 text-sm">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInventory.map((item) => {
                    const soldQuantity = salesData
                      .flatMap((s) => s.items)
                      .filter((s) => s.productid === item.productid)
                      .reduce((acc, curr) => acc + curr.quantity, 0);

                    const product = products[item.productid] || {};
                    const totalRevenue = soldQuantity * (product.price || 0);

                    return (
                      <tr key={item.inventoryid} className="hover:bg-gray-100 text-gray-600">
                        <td className="border py-2 px-4 border-gray-300 text-gray-600">{product.productcode || "Unknown"}</td>
                        <td className="border py-2 px-4 border-gray-300 text-gray-600">{product.productname || "Unknown"}</td>
                        <td
                          className={`border py-2 px-4 border-gray-300 font-bold ${
                            item.quantity < lowStockThreshold ? "text-red-500" :
                            item.quantity >= warningMin && item.quantity <= warningMax ? "text-yellow-500" :
                            "text-green-500"
                          }`}
                        >
                          {item.quantity}
                        </td>
                        <td className="border py-2 px-4 border-gray-300 text-gray-600">{soldQuantity}</td>
                        <td className="border py-2 px-4 border-gray-300 text-gray-600">{product.price || "Unknown"}</td>
                        <td className="border py-2 px-4 border-gray-300 text-gray-600">{totalRevenue.toLocaleString()}</td>
                        <td className="border border-gray-300 text-center justify-center items-center">
                          <button onClick={() => setSelectedProduct(products[item.productid])}>
                            <HiOutlineEye className="text-red-500 hover:text-red-700 cursor-pointer h-6 w-6" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* ✅ Pagination Controls for Inventory */}
            <div className="flex justify-center mt-4 space-x-4">
              <button
                className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
                onClick={() => setCurrentPageInventory((prev) => Math.max(prev - 1, 1))}
                disabled={currentPageInventory === 1}
              >
                Previous
              </button>
              <div className="flex items-center text-gray-500">Page {currentPageInventory}</div>
              <button
                className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
                onClick={() => setCurrentPageInventory((prev) => (indexOfLastInventory < inventory.length ? prev + 1 : prev))}
                disabled={indexOfLastInventory >= inventory.length}
              >
                Next
              </button>
            </div>

            {/* 🔹 Show Detail Modal when a product is selected */}
            {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
          </motion.div>
        </div>
      )}  
    </AnimatePresence>  
  );
};

export default BranchViewModal;
