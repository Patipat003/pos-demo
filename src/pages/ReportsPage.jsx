import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CSVLink } from "react-csv";
import { Player } from "@lottiefiles/react-lottie-player";

const formatDate = (dateString, type) => {
  const date = new Date(dateString);
  if (isNaN(date)) {
    console.error("Invalid date:", dateString);
    return "Invalid Date";
  }

  switch (type) {
    case "day":
      return format(date, "d/MM/yyyy");
    case "month":
      return format(date, "MM/yyyy");
    case "year":
      return format(date, "yyyy");
    case "time":
      return format(date, "HH:mm:ss");
    default:
      return format(date, "MM/yyyy");
  }
};

const ReportsPage = () => {
  const [salesData, setSalesData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("month");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [userBranchId, setUserBranchId] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchSalesData = async () => {

      const salesResponse = await axios.get(`${API_BASE_URL}/sales.json`);
      const branchResponse = await axios.get(`${API_BASE_URL}/branches.json`);

      setSalesData(salesResponse.data);
      setBranches(branchResponse.data);
      // setUserBranchId({branch_id: "ed787277-9cd0-4c99-9b47-4f7f93a694d8"}); // Set the selectedEmployee to user's branch id
      // console.log("Sales Data:", salesResponse.data);  // Debugging
      // console.log("Branches Data:", branchResponse.data); // Debugging
      setLoading(false);
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

    useEffect(() => {
    // กำหนดค่า isSuperAdmin ตาม role ของผู้ใช้
        setUserRole("super admin")
        setIsSuperAdmin(userRole === "super admin");
        setUserBranchId("ed787277-9cd0-4c99-9b47-4f7f93a694d8")
  }, [userRole]);

  const getBranchName = (branchId) => {
    const branch = branches.find((b) => b.branch_id === branchId);
    return branch ? branch.b_name : "Unknown Branch";
  };

  const groupedSales = salesData.reduce((groups, item) => {
    const formattedDate = formatDate(item.created_at, filterType);
    const branchId = item.branch_id;

    if (!groups[formattedDate]) {
      groups[formattedDate] = {};
    }

    if (!groups[formattedDate][branchId]) {
      groups[formattedDate][branchId] = { totalAmount: 0, count: 0 };
    }

    groups[formattedDate][branchId].totalAmount += item.total_amount;
    groups[formattedDate][branchId].count += 1;

    return groups;
  }, {});

  const filteredSales = Object.keys(groupedSales).reduce((result, dateKey) => {
    const branchesData = Object.keys(groupedSales[dateKey]).filter((branchId) => {
      const { totalAmount, count } = groupedSales[dateKey][branchId];
      const branchName = getBranchName(branchId);
      return (
        (isSuperAdmin || selectedBranch === "" || selectedBranch === branchId) && // Check if branch matches the selectedEmployee
        (!selectedDate ||
          dateKey === format(selectedDate, filterType === "day" ? "d/MM/yyyy" : filterType === "month" ? "MM/yyyy" : "yyyy")) &&
        (searchQuery === "" ||
          dateKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          totalAmount.toFixed(2).includes(searchQuery) ||
          count.toString().includes(searchQuery))
      );
    });

    if (branchesData.length > 0) {
      result[dateKey] = branchesData;
    }

    return result;
  }, {});

  const generateCSVData = () => {
    const csvData = [
      ["No.", "Date", "Branch", "Total Amount", "Items Sold"],
    ];
    Object.keys(filteredSales).forEach((dateKey, index) => {
      filteredSales[dateKey].forEach((branchId) => {
        const { totalAmount, count } = groupedSales[dateKey][branchId];
        csvData.push([
          index + 1,
          dateKey,
          getBranchName(branchId),
          totalAmount.toFixed(2),
          count,
        ]);
      });
    });
    return csvData;
  };

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
    return <div className="text-center text-red-600 py-4">{error}</div>;
  }

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold text-red-600 mb-6">Branch Sales Reports</h1>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilterType("day")}
          className={`btn p-2 rounded-md text-red-500 w-16 ${
            filterType === "day"
              ? "bg-red-800 border-none text-white hover:bg-red-900"
              : "bg-white border-red-500 hover:bg-red-800 hover:text-white hover:border-none"
          }`}
        >
          Day
        </button>

        <button
          onClick={() => setFilterType("month")}
          className={`btn p-2 rounded-md text-red-500 w-16 ${
            filterType === "month"
              ? "bg-red-800 border-none text-white hover:bg-red-900"
              : "bg-white border-red-500 hover:bg-red-800 hover:text-white hover:border-none"
          }`}
        >
          Month
        </button>

        <button
          onClick={() => setFilterType("year")}
          className={`btn p-2 rounded-md text-red-500 w-16 ${
            filterType === "year"
              ? "bg-red-800 border-none text-white hover:bg-red-900"
              : "bg-white border-red-500 hover:bg-red-800 hover:text-white hover:border-none"
          }`}
        >
          Year
        </button>
      </div>

      <div className="mb-6 flex gap-4 items-center text-gray-600">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Search by Date, Branch, Amount, or Items Sold"
          className="border bg-white border-gray-300 p-3 pr-10 text-gray-600 rounded-md w-full min-w-[200px] focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          placeholderText="Select Date"
          className="border bg-white border-gray-300 p-3 pr-10 text-gray-600 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-red-400 flex items-center"
          dateFormat={filterType === "day" ? "d/MM/yyyy" : filterType === "month" ? "MM/yyyy" : "yyyy"}
          showMonthYearPicker={filterType === "month"}
          showYearPicker={filterType === "year"}
          todayButton="Today"
          isClearable
          clearButtonClassName="absolute right-2 top-2 bg-red-400 text-white rounded-full p-1"
          style={{ position: "relative" }}
        />
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="border bg-white border-gray-300 p-3 pr-10 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <option >Central Branch</option>
        </select>
      </div>

      <table className="table-auto table-xs min-w-full border-collapse border-4 border-gray-300 mb-4 text-gray-800">
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="text-sm px-4 py-2">No.</th>
            <th className="text-sm px-4 py-2">Date</th>
            <th className="text-sm px-4 py-2">Branch</th>
            <th className="text-sm px-4 py-2">Total Amount</th>
            <th className="text-sm px-4 py-2">Items Sold</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(filteredSales).map((dateKey, index) => (
            <React.Fragment key={dateKey}>
              {filteredSales[dateKey].map((branchId) => {
                const { totalAmount, count } = groupedSales[dateKey][branchId];
                return (
                  <tr key={branchId} className="hover:bg-gray-100 text-gray-600">
                    <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-2">{dateKey}</td>
                    <td className="border border-gray-300 px-4 py-2">{getBranchName(branchId)}</td>
                    <td className="border border-gray-300 px-4 py-2">{totalAmount.toFixed(2)}</td>
                    <td className="border border-gray-300 px-4 py-2">{count}</td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <CSVLink
        data={generateCSVData()}
        filename={"Sales_Report.csv"}
        className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
      >
        Export to CSV
      </CSVLink>
    </div>
  );
};

export default ReportsPage;
