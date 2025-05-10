import { useState, useEffect } from "react";
import axios from "axios";
import { toZonedTime, format } from 'date-fns-tz';
import { FaReceipt, FaPrint, FaTrash } from "react-icons/fa"; // Import receipt and print icons
import { jsPDF } from 'jspdf';// Import ReactPrinter component
import html2canvas from 'html2canvas-pro';
import ReceiptPrinter from "../components/layout/ui/ReceiptPrinter";

const SalesHistoryPage = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [paginatedSales, setPaginatedSales] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [branchId, setBranchId] = useState("");
  const [employees, setEmployees] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [sortOrder, setSortOrder] = useState("asc"); // asc or desc
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    setBranchId("ed787277-9cd0-4c99-9b47-4f7f93a694d8");
    setUserRole("Super Admin");
    fetchSalesData("ed787277-9cd0-4c99-9b47-4f7f93a694d8");
  }, []);

  const fetchSalesData = async (branchId) => {
    try {
      const salesResponse = await axios.get(`${API_BASE_URL}/sales.json`);
      const employeeResponse = await axios.get(`${API_BASE_URL}/employees.json`);
      const receiptResponse = await axios.get(`${API_BASE_URL}/receipts.json`);

      const salesArray = salesResponse.data || [];
      const employeesArray = employeeResponse.data || [];
      const receiptsArray = receiptResponse.data || [];

      const filteredEmployees = employeesArray.filter((emp) => emp.branch_id === branchId);
      setEmployees(filteredEmployees);

      const filteredSales = salesArray
        .filter((sale) => sale.branch_id === branchId)
        .map((sale, index) => {
          const employee = filteredEmployees.find((emp) => emp.employee_id === sale.employee_id);
          const receipt = receiptsArray.find((rec) => rec.sale_id === sale.sale_id);

          const zonedDate = toZonedTime(sale.created_at, 'UTC');
          const formattedDate = format(zonedDate, "dd/MM/yyyy, HH:mm");

          return {
            index: index + 1,
            sale_id: sale.sale_id,
            receipt_number: receipt?.receipt_number || "N/A",
            employee_name: employee?.name || "Super Admin",
            role: employee?.role || "Super Admin",
            total_amount: sale.total_amount,
            created_at: formattedDate,
          };
        });

      setSales(filteredSales);
      setFilteredSales(filteredSales);
      setPaginatedSales(filteredSales.slice(0, itemsPerPage));
    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  };
  
  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    filterData(term, selectedEmployee, sortOrder);
  };

  const handleEmployeeFilter = (event) => {
    const employee = event.target.value;
    setSelectedEmployee(employee);
    filterData(searchTerm, employee, sortOrder);
  };

  const handleDateFilter = (event) => {
    const date = event.target.value;
    setSelectedDate(date);
    filterData(searchTerm, selectedEmployee, sortOrder, date);
  };
  

  const handleSort = () => {
    const order = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(order);
    filterData(searchTerm, selectedEmployee, order);
  };

  
  const filterData = (term, employee, order, date) => {
    let filtered = [...sales];
  
    if (term) {
      filtered = filtered.filter((sale) =>
        sale.receipt_number.toLowerCase().includes(term.toLowerCase())
      );
    }
  
    if (employee) {
      filtered = filtered.filter((sale) => sale.employee_name === employee);
    }
  
    if (date) {
      const formattedSelectedDate = format(new Date(date), "dd/MM/yyyy");
    
      filtered = filtered.filter((sale) => {
        const saleDate = sale.created_at.split(", ")[0]; // แยกเอาเฉพาะวันที่
        return saleDate === formattedSelectedDate;
      });
    }
    
    filtered.sort((a, b) => {
      const parseDate = (dateStr) => {
        const [date, time] = dateStr.split(", ");
        const [day, month, year] = date.split("/");
        return new Date(`${year}-${month}-${day}T${time}`);
      };
  
      const dateA = parseDate(a.created_at);
      const dateB = parseDate(b.created_at);
  
      return order === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    });
  
    setFilteredSales(filtered);
    setCurrentPage(1);
    setPaginatedSales(filtered.slice(0, itemsPerPage));
  };
  

  // ฟังก์ชันที่ใช้ดึงข้อมูลจาก API เพื่อแสดงใน Modal
  const fetchSaleItems = async (saleId, createdAt) => {
    try {
      // เรียกข้อมูลต่าง ๆ
      const saleItemsResponse = await axios.get(`${API_BASE_URL}/saleitems.json`);
      const productResponse = await axios.get(`${API_BASE_URL}/products.json`);
      const receiptResponse = await axios.get(`${API_BASE_URL}/receipts.json`);
      const branchResponse = await axios.get(`${API_BASE_URL}/branches.json`);
  
      const saleItems = Array.isArray(saleItemsResponse.data)
        ? saleItemsResponse.data.filter((item) => item.sale_id === saleId)
        : [];
      const products = Array.isArray(productResponse.data) ? productResponse.data : [];
      const receipt = receiptResponse.data.find((rec) => rec.sale_id === saleId);
      const branches = branchResponse.data;

      // ค้นหาข้อมูลสาขาที่ตรงกับ branchId ของ receipt
      const branch = branches.find((branch) => branch.branch_id === receipt?.branch_id);
  
      const modalItems = saleItems.map((item) => {
        const product = products.find((prod) => prod.product_id === item.product_id);
        return {
          product_name: product?.product_name || "Unknown",
          quantity: item.quantity,
          price: item.price,
          total_price: item.quantity * item.price,
        };
      });
  
      // อัปเดต modalData โดยเพิ่มข้อมูลพนักงานและข้อมูลสาขา
      setModalData({
        receipt_number: receipt?.receipt_number || "N/A",
        created_at: createdAt,
        items: modalItems,
        b_name: branch?.b_name || "N/A",
        location: branch?.location || "N/A",
      });
    } catch (error) {
      console.error("Error fetching sale items:", error);
    }
  };  
  
  // ฟังก์ชันที่เปิด Modal เมื่อคลิกที่แถวของตาราง
  const openModal = (saleId, createdAt, branchId) => {
    fetchSaleItems(saleId, createdAt, branchId);  // ส่ง saleId, createdAt, branchId, employeeid
  };

  const handlePrint = () => {
    const element = document.getElementById('print-area');

    html2canvas(element, {
        scale: 2, // ปรับให้ชัดขึ้น
        useCORS: true // ป้องกันปัญหารูปภาพข้ามโดเมน
    }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: [80, 120] // ขนาดใบเสร็จ
        });

        doc.addImage(imgData, 'PNG', 5, 5, 70, 110);
        doc.save('receipt.pdf');
      });
  };

  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    const startIndex = (page - 1) * itemsPerPage;
    setPaginatedSales(filteredSales.slice(startIndex, startIndex + itemsPerPage));
  };
  
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  const exportToCSV = () => {
    const csvHeader = "Receipt Number,Employee Name,Role,Total Amount,Created At\n";
    const csvRows = filteredSales.map((sale) =>
      `"${sale.receipt_number}","${sale.employee_name}","${sale.role}",${sale.total_amount},"${sale.created_at}"`
    );
    const csvContent = csvHeader + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "sales_history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
      <h1 className="text-3xl font-bold text-red-600 mb-6">Sales History</h1>
      <p className="text-gray-600 mb-4">View your Sales History here.</p>

      <div className="flex items-center space-x-4 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="🔍 Search by Receipt Number"
          className="border bg-white border-gray-300 px-6 w-3/4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <select
          value={selectedEmployee}
          onChange={handleEmployeeFilter}
          className="select bg-white text-gray-600 select-bordered border border-gray-300 w-full max-w-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Filter by Employee Name</option>
          {employees.map((employee) => (
            <option key={employee.employee_id} value={employee.employee_name}>
              {employee.name}
            </option>
          ))}
        </select>

          {/* New Date Filter */}
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateFilter}
            className="btn btn-none border-none bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={handleSort}
            className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
          >
            Sort by Date {sortOrder === "asc" ? "↑" : "↓"}
          </button>

          <button
            onClick={exportToCSV}
            className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
          >
            Export CSV
          </button>
        </div>


      <table className="table-auto table-xs min-w-full border-collapse border-4 border-gray-300 mb-4 text-gray-800">
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="text-sm px-4 py-2">No.</th>
            <th className="text-sm px-4 py-2">Receipt Number</th>
            <th className="text-sm px-4 py-2">Employee Name</th>
            <th className="text-sm px-4 py-2">Role</th>
            <th className="text-sm px-4 py-2">Total Amount</th>
            <th className="text-sm px-4 py-2">Created At</th>
            <th className="text-sm px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {paginatedSales.map((sale) => (
            <tr key={sale.sale_id} className="hover:bg-gray-100 text-gray-600">
              <td className="border border-gray-300 px-4 py-2 text-center">{sale.index}</td>
              <td className="border border-gray-300 px-4 py-2">{sale.receipt_number}</td>
              <td className="border border-gray-300 px-4 py-2">{sale.employee_name}</td>
              <td className="border border-gray-300 px-4 py-2">{sale.role}</td>
              <td className="border border-gray-300 px-4 py-2">{sale.total_amount}</td>
              <td className="border border-gray-300 px-4 py-2">{sale.created_at}</td>
              <td className="border border-gray-300 px-4 py-2 flex items-center justify-center space-x-4">
                <button 
                  className="btn btn-xs border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 flex items-center"
                  onClick={() => openModal(sale.sale_id, sale.created_at)}
                >
                  <FaReceipt /> Receipt
                </button>
                {(userRole === "Manager" || userRole === "Super Admin") && (
                  <button
                    className="btn btn-xs border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 flex items-center"
                  >
                    <FaTrash /> Delete
                  </button>
                )}
              </td>   
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-center space-x-2">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            className={`px-3 py-1 rounded ${
              currentPage === index + 1
                ? "bg-red-800 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => handlePageChange(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>
      
      {/* ส่วนของ Modal */}
      {modalData && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg max-w-screen-sm">
            <div id="print-area">
              {/* Use ReactPrinter to display receipt content */}
              <ReceiptPrinter modalData={modalData} />
            </div>

            {/* ปุ่มสำหรับพิมพ์ใบเสร็จ */}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
                onClick={handlePrint}
              >
                <FaPrint className="mr-1" /> Print Receipt
              </button>
              <button
                className="btn border-gray-600 bg-white text-gray-600 rounded-lg hover:bg-gray-600 hover:text-white hover:border-gray-600"
                onClick={() => setModalData(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistoryPage;
