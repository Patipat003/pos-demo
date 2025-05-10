import React, { useState, useEffect } from "react";
import axios from "axios";
import RequestInventory from "../components/layout/ui/RequestInventory";
import RequestShipment from "../components/layout/ui/RequestShipment";
import { toZonedTime, format } from 'date-fns-tz';
import { HiOutlineEye } from "react-icons/hi";
import { AiOutlineExclamationCircle } from "react-icons/ai"; // Error Icon
import { Player } from "@lottiefiles/react-lottie-player"; // Lottie Player
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // ใช้สำหรับ DatePicker
import InventoryModal from "../components/layout/ui/InventoryModal";
import { useStockThreshold } from "../Contexts/StockThresholdContext";

const formatDate = (dateString) => {
  const utcDate = toZonedTime(dateString, "UTC"); // แปลงเป็น UTC
  return format(utcDate, "d/MM/yyyy, HH:mm", { timeZone: "UTC" });
};

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState({});
  const [branches, setBranches] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewAllBranches, setViewAllBranches] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userBranchId, setUserBranchId] = useState("");

  const [startDate, setStartDate] = useState(null); // ช่วงเวลาเริ่มต้น
  const [endDate, setEndDate] = useState(null); // ช่วงเวลาสิ้นสุด

  const itemsPerPage = 20; // ตั้งค่าแสดง 20 รายการต่อหน้า
  const [currentProductPage, setCurrentProductPage] = useState(1);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { lowStockThreshold, warningMin, warningMax } = useStockThreshold();

  // Function to fetch inventory data
  const fetchInventory = async (branchId) => { // เพิ่ม parameter branchId
    setUserRole({ role: "Super Admin" });
    setUserBranchId({ branch_id: branchId }); // ใช้ branchId ที่รับมา

    const [inventoryResponse, productResponse, branchResponse] = await Promise.all([
      axios.get(`${API_BASE_URL}/inventory.json`),
      axios.get(`${API_BASE_URL}/products.json`),
      axios.get(`${API_BASE_URL}/branches.json`),
    ]);

    // 🔹 แมปข้อมูล products
    const productMap = {};
    productResponse.data.forEach((product) => {
      productMap[product.product_id] = {
        product_name: product.product_name,
        product_code: product.product_code, // ✅ เพิ่ม productcode
      };
    });

    // 🔹 แมปข้อมูล branches
    const branchMap = {};
    branchResponse.data.map((branch) => {
      branchMap[branch.branch_id] = {
        b_name: branch.b_name,
        location: branch.location,
      };
    });

    // 🔹 แมป productcode + productname เข้า inventory
    let newInventory = inventoryResponse.data.map((item) => ({
      ...item,
      product_name: productMap[item.product_id]?.product_name || "N/A",
      product_code: productMap[item.product_id]?.product_code || "N/A", // ✅ ใส่ productcode
    }));

    // กรองข้อมูล inventory ตาม branchId
    newInventory = newInventory.filter(item => item.branch_id === branchId);

    // 🔹 เรียงลำดับ `updatedat` (ล่าสุดขึ้นก่อน)
    newInventory.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    // อัปเดต state
    setInventory(newInventory);
    setProducts(productMap);
    setBranches(branchMap);
    setLoading(false);
  };

  useEffect(() => {
    const mockBranchId = "ed787277-9cd0-4c99-9b47-4f7f93a694d8"; // กำหนดค่า mock branchId
    fetchInventory(mockBranchId); // เรียก fetchInventory ด้วยค่า mock

    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchInventory(mockBranchId); // เรียก fetchInventory ด้วยค่า mock
    }, 5000);

    return () => clearInterval(interval); // Clean up the interval on component unmount
  }, []);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // ฟังก์ชันกรองข้อมูลตามวันที่เลือก
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = searchQuery
      ? products[item.product_id]?.product_code?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
      : true;

    const matchesDate =
      (!startDate || new Date(item.updated_at) >= new Date(startDate)) &&
      (!endDate || new Date(item.updated_at) <= new Date(endDate));

    return matchesSearch && matchesDate;
  });

  const groupedInventory = filteredInventory.reduce((groups, item) => {
    const branchName = branches[item.branch_id]?.b_name || "Unknown";
    if (!groups[branchName]) {
      groups[branchName] = [];
    }
    groups[branchName].push(item);
    return groups;
  }, {});

  // ฟังก์ชันการเรียงลำดับตาม quantity
  const sortByQuantity = () => {
    const sortedInventory = [...filteredInventory].sort((a, b) => {
      const quantityA = a.quantity;
      const quantityB = b.quantity;
      return sortDirection === "asc" ? quantityA - quantityB : quantityB - quantityA;
    });
    setInventory(sortedInventory);
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
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
      <div className="flex items-center justify-center h-42 flex-col">
        <AiOutlineExclamationCircle className="text-red-500 text-6xl mb-4" />
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  const totalProductPages = Math.ceil(filteredInventory.length / itemsPerPage);

  const getPaginatedRequests = (requests) => {
    const startIndex = (currentProductPage - 1) * itemsPerPage;
    return requests.slice(startIndex, startIndex + itemsPerPage);
  };

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

  const handleViewDetails = (selectedItem) => {
    const relatedInventory = inventory.filter(
      (item) => item.product_id === selectedItem.product_id
    );

    // ตรวจสอบว่ามี productname หรือไม่ก่อนที่จะส่ง
    const productName = products[selectedItem.product_id]?.product_name || "No Product Name Available";

    setSelectedInventory({ ...selectedItem, productname: productName, relatedInventory });
  };

  const handleCloseModal = () => {
    console.log("Modal Closed");
    setSelectedInventory(null);
  };

  const exportToCSV = () => {
    if (filteredInventory.length === 0) {
      alert("No data available to export.");
      return;
    }

    const BOM = "\uFEFF"; // เพิ่ม BOM เพื่อรองรับ UTF-8 ใน Excel
    const csvRows = [];
    const headers = ["Product Name", "Product Code", "Product ID", "Quantity", "Updated At"];
    csvRows.push(headers.join(",")); // เพิ่ม Header

    filteredInventory.forEach((item) => {
      const row = [
        `"${products[item.product_id]?.product_name || "Unknown"}"`, // ใส่ "" ป้องกันปัญหา comma
        `"${products[item.product_id]?.product_code || "N/A"}"`, // เพิ่ม productcode
        `"${item.product_id}"`,
        `"${item.quantity}"`,
        `"${formatDate(item.updated_at)}"`
      ];
      csvRows.push(row.join(","));
    });

    const csvString = BOM + csvRows.join("\n"); // ใส่ BOM นำหน้า
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "InventoryData.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
      <h1 className="text-3xl font-bold text-red-600 mb-6">Inventory</h1>
      <p className="text-gray-600 mb-4">Manage your Inventory here.</p>

      <div className="flex space-x-4 mb-6">
        <>
          <RequestInventory onProductAdded={fetchInventory} />
          <RequestShipment />
        </>
        <button
          onClick={exportToCSV}
          className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 mt-4"
        >
          Export CSV
        </button>
      </div>

      <div className="my-4 flex flex-wrap items-center gap-4">
        {/* Search Bar */}
        <div className="flex items-center space-x-4 flex-grow">
          <label htmlFor="searchInput" className="text-gray-600 font-semibold whitespace-nowrap">
            Search by Product Code
          </label>
          <div className="relative flex-grow">
            <input
              id="searchInput"
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by product code"
              className="border bg-white border-gray-300 p-3 pr-10 text-gray-600 rounded-md w-full min-w-[200px] focus:outline-none focus:ring-2 focus:ring-red-500"
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
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center space-x-2">
          <label htmlFor="startDate" className="text-gray-600 font-semibold">From</label>
          <DatePicker
            id="startDate"
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            dateFormat="dd/MM/yyyy"
            placeholderText="Start Date"
            className="border bg-white border-gray-300 p-3 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          <label htmlFor="endDate" className="text-gray-600 font-semibold">To</label>
          <DatePicker
            id="endDate"
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            dateFormat="dd/MM/yyyy"
            placeholderText="End Date"
            className="border bg-white border-gray-300 p-3 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          {/* Clear Button */}
          <button
            onClick={() => {
              setStartDate(null);
              setEndDate(null);
            }}
            className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
          >
            Clear
          </button>
        </div>
      </div>

      {/* แสดงรายละเอียดสินค้าใน Modal */}
      {selectedInventory && (
        <InventoryModal
          selectedInventory={selectedInventory}
          branches={branches}
          handleCloseModal={handleCloseModal}
          userBranchId={userBranchId} // ส่งค่าของ userBranchId ที่เก็บจาก state
        />
      )}

      {/* Inventory table */}
      <div className="overflow-x-auto mb-6">
        {groupedInventory && Object.keys(groupedInventory).map((branchName) => (
          <div key={branchName} className="mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-red-600 mb-4">{branchName}</h2>

              {/* Sort by Quantity */}
              <button
                onClick={sortByQuantity}
                className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 mb-4"
              >
                Sort by Quantity {sortDirection === "asc" ? "↑" : "↓"}
              </button>
            </div>

            <table className="table-auto table-xs min-w-full border-4 border-gray-300 mb-4 text-gray-800">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="text-sm text-center">No.</th>
                  <th className="py-2 px-4 text-sm">Product Code</th>
                  <th className="py-2 px-4 text-sm">Product Name</th>
                  <th className="py-2 px-4 text-sm">Quantity</th>
                  <th className="py-2 px-4 text-sm">Updated At</th>
                  <th className="border border-gray-300 py-2 px-4 text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {getPaginatedRequests(groupedInventory[branchName]).map((item, index) => {
                  const rowIndex = (currentProductPage - 1) * itemsPerPage + index + 1; // Calculate row index
                  return (
                    <tr key={item.product_id} className="hover:bg-gray-100 text-gray-600">
                      <td className="border border-gray-300 text-center">{rowIndex}</td>
                      <td className="border py-2 px-4 border-gray-300 text-gray-600">{item.product_code}</td>
                      <td className="border py-2 px-4 border-gray-300 text-gray-600">{item.product_name}</td>
                      <td
                        className={`border py-2 px-4 border-gray-300 font-bold ${
                          item.quantity < lowStockThreshold ? "text-red-500" :
                          item.quantity >= warningMin && item.quantity <= warningMax ? "text-yellow-500" :
                          "text-green-500"
                        }`}
                      >
                        {item.quantity}
                      </td>
                      <td className="border border-gray-300 text-gray-600">{formatDate(item.updated_at)}</td>
                      <td className="border border-gray-300 text-center justify-center items-center">
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="hover:border-b-2 border-gray-400 transition duration-30"
                        >
                          <HiOutlineEye className="text-red-500 h-6 w-6" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

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
  );
};

export default InventoryPage;
