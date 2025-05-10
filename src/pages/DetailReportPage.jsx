import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CSVLink } from "react-csv";
import { Player } from "@lottiefiles/react-lottie-player";

const SearchBar = ({ query, onSearch, branches, onBranchFilter, selectedBranch }) => (
  <div className="flex space-x-4 items-center">
    <input
      type="text"
      value={query}
      onChange={(e) => onSearch(e.target.value)}
      placeholder="Search..."
      className="border bg-white border-gray-300 p-3 pr-10 text-gray-600 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-red-400"
    />
    <select
      value={selectedBranch}
      onChange={(e) => onBranchFilter(e.target.value)}
      className="border bg-white border-gray-300 p-3 pr-10 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
    >
      <option value={selectedBranch}>
        {"Central Branch"}
      </option>
    </select>
  </div>
);

const DetailReportPage = () => {
  const [saleItems, setSaleItems] = useState([]);
  const [products, setProducts] = useState({});
  const [branchIds, setBranchIds] = useState({});
  const [branches, setBranches] = useState([]);
  const [filteredSaleItems, setFilteredSaleItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchData = async () => {
      const [saleItemsResponse, productsResponse, salesResponse, branchesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/saleitems.json`),
        axios.get(`${API_BASE_URL}/products.json`),
        axios.get(`${API_BASE_URL}/sales.json`),
        axios.get(`${API_BASE_URL}/branches.json`),
      ]);

      const productMap = {};
      productsResponse.data.forEach((product) => {
        productMap[product.product_id] = product.product_name;
      });

      const saleToBranchMap = {};
      salesResponse.data.forEach((sale) => {
        saleToBranchMap[sale.sale_id] = sale.branch_id;
      });

      const branchList = branchesResponse.data.map((branch) => ({
        id: branch.branch_id,
        name: branch.b_name,
      }));

      setSaleItems(saleItemsResponse.data);
      setFilteredSaleItems(saleItemsResponse.data);
      setProducts(productMap);
      setBranchIds(saleToBranchMap);
      setBranches(branchList);
      setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filterSaleItems = (query, branchId) => {
    const filtered = saleItems.filter((item) => {
      const branch = branchIds[item.sale_id] || "Unknown";
      const productName = products[item.product_id]?.toLowerCase() || "";
      const matchesBranch = branchId ? branch === branchId : true;

      return (
        matchesBranch &&
        (productName.includes(query.toLowerCase()) ||
          item.quantity.toString().includes(query) ||
          item.price.toString().includes(query) ||
          item.total_price.toString().includes(query))
      );
    });
    setFilteredSaleItems(filtered);
  };

  const handleSort = () => {
    const sortedItems = [...filteredSaleItems].sort((a, b) =>
      sortOrder === "asc" ? a.totalprice - b.totalprice : b.totalprice - a.totalprice
    );
    setFilteredSaleItems(sortedItems);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const groupByProduct = (saleItems) => {
    return saleItems.reduce((acc, item) => {
      const productId = item.product_id;
      if (!acc[productId]) {
        acc[productId] = {
          productName: products[productId],
          totalQuantity: 0,
          totalPrice: 0,
          branchNames: new Set(),
        };
      }
      acc[productId].totalQuantity += item.quantity;
      acc[productId].totalPrice += item.total_price;
      acc[productId].branchNames.add(branchIds[item.sale_id]);
      return acc;
    }, {});
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const branchName = getBranchName(selectedBranch);
  
    doc.text(`Sales Report - ${branchName}`, 14, 15);
  
    const tableColumn = ["No.", "Branch Name", "Product Name", "Total Quantity", "Average Price", "Total Price"];
    const tableRows = [];
  
    // กรองข้อมูลให้เฉพาะของสาขาที่ล็อกอิน
    const branchFilteredItems = filteredSaleItems.filter((item) => branchIds[item.sale_id] === selectedBranch);
  
    // จัดกลุ่มข้อมูลตามสินค้าในสาขาของผู้ใช้
    const groupedItems = branchFilteredItems.reduce((acc, item) => {
      const productName = products[item.product_id] || "Unknown";
      const key = `${productName}`;
  
      if (!acc[key]) {
        acc[key] = { branchName, productName, totalQuantity: 0, totalPrice: 0 };
      }
  
      acc[key].totalQuantity += item.quantity;
      acc[key].totalPrice += item.total_price;
  
      return acc;
    }, {});
  
    // แปลงข้อมูลที่จัดกลุ่มแล้วเป็นรูปแบบตาราง
    Object.values(groupedItems).forEach((item, index) => {
      tableRows.push([
        index + 1,
        item.branchName,
        item.productName,
        item.totalQuantity,
        (item.totalPrice / item.totalQuantity).toFixed(2), // ราคาเฉลี่ย
        item.totalPrice.toFixed(2),
      ]);
    });
  
    if (tableRows.length === 0) {
      doc.text("No sales data available for your branch.", 14, 25);
    } else {
      autoTable(doc, {
        startY: 20,
        head: [tableColumn],
        body: tableRows,
      });
    }
  
    doc.save(`Sales_Report_${branchName}.pdf`);
  };
  
  // ฟังก์ชันช่วยดึงชื่อสาขา
  const getBranchName = (branchId) => {
    return branches.find((branch) => branch.id === branchId)?.name || "Unknown Branch";
  };
  
  // Filter sale items based on selected branch or user's branch
  const filteredItems = selectedBranch
    ? saleItems.filter((item) => branchIds[item.saleid] === selectedBranch)
    : saleItems;

  const groupedItems = groupByProduct(filteredItems);

  const csvData = Object.values(groupedItems).map((item, index) => ({
    "No.": index + 1,
    "Branch Name": [...item.branchNames].map((id) => branches.find((b) => b.id === id)?.name || "Unknown").join(", "),
    "Product Name": item.productName,
    "Total Quantity": item.totalQuantity,
    "Average Price": (item.totalPrice / item.totalQuantity).toFixed(2),
    "Total Price": item.totalPrice.toFixed(2),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-42 flex-col">
        <Player
          autoplay
          loop
          src="https://assets3.lottiefiles.com/packages/lf20_z4cshyhf.json"
          style={{ height: "200px", width: "200px" }}
        />
        <span className="text-red-500 text-lg font-semibold">Loading...</span>
      </div>
    );
  }
  if (error) return <div>{error}</div>;

  return (
    <div className="p-4 bg-white">
      <h1 className="text-3xl font-bold text-red-600 mb-6">Product Sales Report</h1>
      <SearchBar
        query={searchQuery}
        onSearch={(q) => {
          setSearchQuery(q);
          filterSaleItems(q, selectedBranch);
        }}
        branches={branches}
        onBranchFilter={(id) => {
          setSelectedBranch(id);
          filterSaleItems(searchQuery, id);
        }}
        selectedBranch={selectedBranch}
      />
      <div className="overflow-x-auto mt-4">
        <table id="table-report" className="table-auto table-xs min-w-full border-4 border-gray-300 mb-4 text-gray-800">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-2">No.</th>
              <th className="px-4 py-2">Branch Name</th>
              <th className="px-4 py-2">Product Name</th>
              <th className="px-4 py-2">Quantity</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Total Price</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(groupedItems).map((item, index) => {
              const branchNames = [...item.branchNames].map((branchId) => {
                return branches.find((branch) => branch.id === branchId)?.name || "Unknown";
              }).join(", ");
              return (
                <tr key={index} className="hover:bg-gray-100 text-gray-600">
                  <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                  <td className="border border-gray-300 px-4 py-2">{branchNames}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.productName || "Unknown"}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.totalQuantity}</td>
                  <td className="border border-gray-300 px-4 py-2">{(item.totalPrice / item.totalQuantity).toFixed(2)}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.totalPrice.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <CSVLink data={csvData} filename={`Sales_Report.csv`} 
      className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 mt-4">
        Export to CSV
      </CSVLink>
    </div>
  );
};

export default DetailReportPage;