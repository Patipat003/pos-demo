import React, { useEffect, useState } from "react";
import { Pie, Bar, Line } from "react-chartjs-2";
import ApexCharts from "react-apexcharts";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import axios from "axios";
import { toZonedTime, format } from 'date-fns-tz';
import { AiOutlineExclamationCircle } from "react-icons/ai"; // Error Icon
import { Player } from "@lottiefiles/react-lottie-player"; // Lottie Player
import SoldProductsModal from "../components/layout/ui/SoldProductsModal"; // Import the SoldProductsModal component
import { HiOutlineCurrencyDollar, HiOutlineShoppingCart, HiOutlineCube } from 'react-icons/hi'; // Heroicons
import moment from "moment";
import ProductMovementChart from "../components/layout/ui/ProductMovementChart";
import { useStockThreshold } from "../Contexts/StockThresholdContext";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const POLLING_INTERVAL = 5000; // Polling interval in milliseconds (5 seconds)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Utility function to format date
const formatDate = (dateString) => {
  const zonedDate = toZonedTime(dateString, 'UTC');
  return format(zonedDate, "d/MM/yyyy, HH:mm");
};

// Utility function to calculate sales by time range (day, month, year)
const calculateSalesByTime = (salesData, range) => {
  const salesByTime = {};

  salesData.forEach(sale => {
    const date = new Date(sale.created_at); // ใช้ created_at
    let key;

    if (range === "day") {
      key = format(date, "yyyy-MM-dd"); // Compare by day
    } else if (range === "month") {
      key = format(date, "yyyy-MM"); // Compare by month
    } else if (range === "year") {
      key = format(date, "yyyy"); // Compare by year
    }

    if (!salesByTime[key]) {
      salesByTime[key] = 0;
    }
    salesByTime[key] += sale.total_amount; // ใช้ total_amount
  });

  return Object.entries(salesByTime).map(([time, sales]) => ({
    time,
    sales,
  }));
};

const DashboardPage = () => {
  const [salesSummary, setSalesSummary] = useState([]);
  const [keyMetrics, setKeyMetrics] = useState([]);
  const [branches, setBranches] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [saleRecents, setSaleRecents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState("!all");
  const [userBranchId, setUserBranchId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [salesByTime, setSalesByTime] = useState([]);
  const [timeRange, setTimeRange] = useState("day"); // ค่าเริ่มต้นเป็น "day"
  const { lowStockThreshold } = useStockThreshold();

  useEffect(() => {
    const initialBranchId = "ed787277-9cd0-4c99-9b47-4f7f93a694d8";
    setUserBranchId(initialBranchId); // กำหนด branchid เป็น String โดยตรง
    setUserRole({ role: "Super Admin" });

    const loadData = async () => {
      try {
        const {
          branchesData,
          salesWithBranchNames,
          topSellingProducts,
          totalSales,
          totalQuantity,
          lowStock,
          sortedSaleRecents,
          salesByTime,
        } = await fetchData("all", initialBranchId, timeRange); // ใช้ initialBranchId
        
        setBranches(branchesData);
        setSalesSummary(salesWithBranchNames);
        setTopProducts(topSellingProducts);
        setKeyMetrics([
          { label: "Total Sales", value: totalSales },
          { label: "Total Quantity", value: totalQuantity },
        ]);
        setLowStockProducts(lowStock);
        setSaleRecents(sortedSaleRecents);
        setSalesByTime(salesByTime); // Make sure this is set
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data");
        setLoading(false);
      }
    };

    loadData();
    const intervalId = setInterval(loadData, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [timeRange]); // TimeRange added here to trigger updates when it changes
  
  const fetchData = async (selectedBranch, branchid, timeRange = "day") => {
    try {
      const [
        saleItemsResponse,
        salesResponse,
        productsResponse,
        branchesResponse,
        inventoryResponse,
        receiptsResponse,
        employeesResponse,
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/saleitems.json`), // ปรับเป็น path ของไฟล์ JSON
        axios.get(`${API_BASE_URL}/sales.json`), // ปรับเป็น path ของไฟล์ JSON
        axios.get(`${API_BASE_URL}/products.json`), // ปรับเป็น path ของไฟล์ JSON
        axios.get(`${API_BASE_URL}/branches.json`), // ปรับเป็น path ของไฟล์ JSON
        axios.get(`${API_BASE_URL}/inventory.json`), // ปรับเป็น path ของไฟล์ JSON
        axios.get(`${API_BASE_URL}/receipts.json`), // ปรับเป็น path ของไฟล์ JSON
        axios.get(`${API_BASE_URL}/employees.json`), // ปรับเป็น path ของไฟล์ JSON
      ]);

      const saleItemsData = saleItemsResponse.data;
      const salesData = salesResponse.data;
      const productsData = productsResponse.data;
      const branchesData = branchesResponse.data;
      const inventory = inventoryResponse.data;
      const receiptsData = receiptsResponse.data;
      const employeesData = employeesResponse.data;
      
      const filteredSales =
        selectedBranch === "all"
          ? salesData
          : salesData.filter((sale) => sale.branch_id === branchid);

      const saleItemsForBranch = saleItemsData.filter((saleItem) =>
        filteredSales.some((sale) => sale.sale_id === saleItem.sale_id)
      );

      const totalQuantity = saleItemsForBranch.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const totalSales = filteredSales.reduce(
        (sum, sale) => sum + sale.total_amount,
        0
      );

      const productSales = saleItemsForBranch.reduce((acc, saleItem) => {
        const { product_id: productid, quantity } = saleItem;
        acc[productid] = acc[productid]
          ? { ...acc[productid], quantity: acc[productid].quantity + quantity }
          : { quantity, productid };
        return acc;
      }, {});

      const topSellingProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
        .map((item) => {
          const product = productsData.find((p) => p.product_id === item.productid);
          return {
            ...item,
            product_name: product ? product.product_name : "Unknown",
            image_url: product ? product.image_url : "",
          };
        });

      const branchSales = salesData.reduce((acc, sale) => {
        const branch = acc.find((b) => b.branch_id === sale.branch_id);
        if (branch) branch.sales += sale.total_amount;
        else acc.push({ branch_id: sale.branch_id, sales: sale.total_amount });
        return acc;
      }, []);

      const salesWithBranchNames = branchesData.map((branch) => {
        const sale = branchSales.find((b) => b.branch_id === branch.branch_id);
        return {
          branch_id: branch.branch_id,
          b_name: branch.b_name,
          sales: sale ? sale.sales : 0,
        };
      });

      const lowStock = inventory.filter(
        (item) =>
          item.quantity < lowStockThreshold &&
          (selectedBranch === "all" || item.branch_id === branchid)
      );

      const saleRecentsData =
        selectedBranch === "all"
          ? salesData
          : salesData.filter((sale) => sale.branch_id === branchid);

      const saleRecentsWithDetails = saleRecentsData.map((sale) => {
        const receipt = receiptsData.find((receipt) => receipt.sale_id === sale.sale_id);
        const employee = employeesData.find(
          (employee) => employee.employee_id === sale.employee_id
        );
        return {
          ...sale,
          receipt_number: receipt ? receipt.receipt_number : "N/A",
          employee_name: employee ? employee.name : "Unknown",
        };
      });

      const sortedSaleRecents = saleRecentsWithDetails
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);

      const salesByTime = calculateSalesByTime(filteredSales, timeRange);

      return {
        branchesData,
        salesWithBranchNames,
        topSellingProducts,
        inventory,
        totalSales,
        totalQuantity,
        lowStock,
        sortedSaleRecents,
        salesByTime,
      };
    } catch (err) {
      console.error("Error fetching data:", err);
      throw err; // Re-throw the error to be caught in the component
    }
  };

  const handleCloseModal = () => setShowModal(false);

  const soldProducts = topProducts.map(product => ({
    product_name: product.product_name,
    quantity: product.quantity,
    price: product.price,
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-42 flex-col">
        <AiOutlineExclamationCircle className="text-red-500 text-6xl mb-4" />
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  // Pie chart data and options
  const pieData = {
    labels: salesSummary.map((data) => data.b_name), // ใช้ salesSummary
    datasets: [
      {
        data: salesSummary.map((data) => data.sales), // ใช้ salesSummary
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
      },
    ],
  };

  const pieOptions = {
    maintainAspectRatio: false,
    responsive: true,
    cutout: '50%',
    animation: {
      animateScale: true, 
      animateRotate: true,
    },
    plugins: {
      tooltip: {
        enabled: true,
        backgroundColor: "#333",
        titleColor: "#fff",
        bodyColor: "#fff",
        cornerRadius: 5,
      },
      legend: {
        position: "right",
        align: "center",
        labels: {
          font: { size: 14, padding: 10 },
          boxWidth: 30,
        },
      },
    },
    elements: {
      arc: { borderWidth: 2, borderColor: "#ffffff" }, // Arc borders
    },
  };


  const barData = {
    labels: keyMetrics.map((metric) => metric.label),
    datasets: [
      {
        label: "Metrics",
        data: keyMetrics.map((metric) => metric.value),
        backgroundColor: "#420505",
      },
    ],
  };

  const topProductsData = {
    labels: topProducts.map((product) => product.product_name),
    datasets: [
      {
        data: topProducts.map((product) => product.quantity),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
      },
    ],
  };

  // Sales Graph Data (ApexCharts)
  const salesGraphOptions = {
    chart: { type: "line", height: 350 },
    xaxis: { categories: salesByTime.map(data => moment(data.time).format("D/M/YY")) },
    stroke: { width: 3, curve: "smooth" },
    colors: ["#FF6384"],
    yaxis: { title: { text: "Total Sales (THB)" } },
  };
  
  const salesGraphSeries = [{ name: "Sales", data: salesByTime.map(data => data.sales) }];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-6 min-h-screen">
      <h1 className="text-3xl font-bold text-red-600 mb-6">Dashboard</h1>
      <div className="flex items-center justify-between mb-6">
      </div>
      
      <div className="bg-gray-200 p-6 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-gray-600">
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6 flex items-center justify-between">
            <HiOutlineCurrencyDollar className="text-red-500 text-6xl" />
            <div className="text-right">
              <h2 className="font-semibold mb-4">Total Sales (THB)</h2>
              <div className="text-2xl font-bold text-red-500">
                ฿{keyMetrics[0]?.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 mb-6 flex items-center justify-between">
            <HiOutlineShoppingCart className="text-red-500 text-6xl" />
            <div className="text-right">
              <h2 className="font-semibold mb-4">Total Sales (Units)</h2>
              <div className="text-2xl font-bold text-red-500">
                {keyMetrics[1]?.value.toLocaleString()} Units
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 mb-6 flex items-center justify-between">
            <HiOutlineCube className="text-red-500 text-6xl" />
            <div className="text-right">
              <h2 className="font-semibold mb-4">Low Stock (Products)</h2>
              <div className="text-2xl font-bold text-red-500">
                {lowStockProducts.length} Low on Stock
              </div>
            </div>
          </div>
        </div>

        {/* New Top Sale Products Section */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6 text-gray-600">
          <h2 className="font-semibold mb-4">Top Sale Products (List)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {topProducts.map((product, index) => (
              <div key={index} className="relative border-2 border-gray-300 p-4 rounded-lg shadow-sm">
                {/* แสดงตัวเลขอันดับ */}
                <span className="absolute top-2 left-2 bg-red-800 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {index + 1}
                </span>
                <img
                  src={product.image_url || "https://via.placeholder.com/150"}
                  alt={product.product_name}
                  className="w-full h-32 object-contain rounded-md mb-2"
                />
                <h3 className="font-bold text-red-600">{product.product_name}</h3>
                <p className="text-sm text-gray-500">Sold: {product.quantity} Units</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6 mb-6 text-gray-600">
          <h2 className="font-semibold mb-4">Top Sale Products (Pie Chart)</h2>
          <div className="w-72 mx-auto">
            <Pie data={topProductsData} options={{ ...pieOptions, maintainAspectRatio: false }} />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
          >
            View Sales Products
          </button>
        </div>

        <SoldProductsModal
          show={showModal}
          closeModal={handleCloseModal}
          products={soldProducts}
        />

        <div className="bg-white shadow-lg rounded-lg p-6 mb-6 text-gray-600">
          <h2 className="font-semibold mb-4">Sales Over Time (THB)</h2>
          <div className="flex justify-between items-center mb-4">
            {/* Time Range Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => setTimeRange("day")}
                className={`btn ${timeRange === "day" ? "btn text-white bg-red-800 border-none hover:bg-red-900" : "btn bg-white border-red-500 text-red-500 hover:bg-red-800 hover:border-none hover:text-white"}`}
              >
                Day
              </button>
              <button
                onClick={() => setTimeRange("month")}
                className={`btn ${timeRange === "month" ? "btn text-white bg-red-800 border-none hover:bg-red-900" : "btn bg-white border-red-500 text-red-500 hover:bg-red-800 hover:border-none hover:text-white"}`}
              >
                Month
              </button>
              <button
                onClick={() => setTimeRange("year")}
                className={`btn ${timeRange === "year" ? "btn text-white bg-red-800 border-none hover:bg-red-900" : "btn bg-white border-red-500 text-red-500 hover:bg-red-800 hover:border-none hover:text-white"}`}
              >
                Year
              </button>


            </div>
          </div>

          <div className="w-full h-96 px-4">
            <ApexCharts options={salesGraphOptions} series={salesGraphSeries} type="line" height={350} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 text-gray-600">
          <div className="bg-white shadow-lg rounded-lg p-4">
            <h2 className="font-semibold mb-4">Sales Summary (Pie Chart)</h2>
            <div className="w-72 mx-auto">
              <Pie data={pieData} options={{ ...pieOptions, maintainAspectRatio: false }} />
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-4">
            <h2 className="font-semibold mb-4">Sales Summary (Table)</h2>
            <table className="table-auto table-xs min-w-full border-collapse border-4 border-gray-300 mb-4 text-gray-800">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="text-sm px-4 py-2 text-left">Branch Name</th>
                  <th className="text-sm px-4 py-2 text-left">Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {salesSummary.map((data, index) => ( // ใช้ salesSummary
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="border border-gray-300 px-4 py-2">{data.b_name}</td>
                    <td className="border border-gray-300 px-4 py-2">฿{data.sales.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6 text-gray-600">

          <ProductMovementChart />

          <div className="bg-white shadow-lg rounded-lg p-4">
            <h2 className="font-semibold mb-4">Sale Recents</h2>
            <table className="table-auto table-xs min-w-full border-collapse border-4 border-gray-300 mb-4 text-gray-800">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="text-sm px-4 py-2 text-left">Receipt Number</th>
                  <th className="text-sm px-4 py-2 text-left">Branch Name</th>
                  <th className="text-sm px-4 py-2 text-left">Employee Name</th>
                  <th className="text-sm px-4 py-2 text-left">Total Sales (THB)</th>
                  <th className="text-sm px-4 py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {saleRecents.map((sale, index) => (
                  <tr key={index} className="hover:bg-gray-100 text-gray-600">
                    <td className="border border-gray-300 px-4 py-2">{sale.receipt_number}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {branches.find(branch => branch.branch_id === sale.branch_id)?.b_name}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{sale.employee_name}</td>
                    <td className="border border-gray-300 px-4 py-2">{sale.total_amount.toLocaleString()}</td>
                    <td className="border border-gray-300 px-4 py-2">{formatDate(sale.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
