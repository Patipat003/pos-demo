import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import axios from "axios";
import moment from "moment";

const ProductMovementChart = () => {
  const [branchId, setBranchId] = useState(null);
  const [data, setData] = useState([]);
  const [timeFrame, setTimeFrame] = useState("daily");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // จำนวนรายการต่อหน้า

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    setBranchId({branch_id: "ed787277-9cd0-4c99-9b47-4f7f93a694d8"});
  }, []);

  useEffect(() => {
    if (branchId) {
      fetchData();
    }
  }, [branchId, timeFrame]);

  const fetchData = async () => {
    try {
      const requestsRes = await axios.get(`${API_BASE_URL}/requests.json`);
      const salesRes = await axios.get(`${API_BASE_URL}/sales.json`);
      const saleItemsRes = await axios.get(`${API_BASE_URL}/saleitems.json`);

      const requests = requestsRes.data;
      const sales = salesRes.data;
      const saleItems = saleItemsRes.data;

      const formattedData = processMovementData(requests, sales, saleItems);
      setData(formattedData);
      setCurrentPage(1); // รีเซ็ตหน้าปัจจุบันเมื่อข้อมูลเปลี่ยน
    } catch (error) {
      console.error("Error fetching product movement data", error);
    }
  };

  const processMovementData = (requests, sales, saleItems) => {
    const movementMap = {};
  
    requests.forEach(({ tobranchid, frombranchid, quantity, createdat }) => {
      let dateKey = moment(createdat).format("YYYY-MM-DD");
  
      if (timeFrame === "weekly") {
        dateKey = moment(createdat).startOf("isoWeek").format("YYYY-MM-DD");
      } else if (timeFrame === "monthly") {
        dateKey = moment(createdat).format("YYYY-MM");
      }
  
      if (!movementMap[dateKey]) {
        movementMap[dateKey] = { imported: 0, sold: 0, exported: 0 };
      }
      if (tobranchid === branchId) movementMap[dateKey].imported += quantity;
      if (frombranchid === branchId) movementMap[dateKey].exported += quantity;
    });
  
    sales.forEach(({ saleid, branchid, createdat }) => {
      if (branchid === branchId) {
        let dateKey = moment(createdat).format("YYYY-MM-DD");
  
        if (timeFrame === "weekly") {
          dateKey = moment(createdat).startOf("isoWeek").format("YYYY-MM-DD");
        } else if (timeFrame === "monthly") {
          dateKey = moment(createdat).format("YYYY-MM");
        }
  
        if (!movementMap[dateKey]) {
          movementMap[dateKey] = { imported: 0, sold: 0, exported: 0 };
        }
  
        const totalSold = saleItems
          .filter((item) => item.sale_id === saleid)
          .reduce((sum, item) => sum + item.quantity, 0);
  
        movementMap[dateKey].sold += totalSold;
      }
    });
  
    return Object.keys(movementMap)
      .sort()
      .map((date) => ({
        date,
        imported: movementMap[date].imported,
        sold: movementMap[date].sold,
        exported: movementMap[date].exported,
      }));
  };

  const chartOptions = {
    chart: { type: "line", height: 350 },
    colors: ["#22c55e", "#ef4444", "#3b82f6"],
    xaxis: {
      categories: data.map((item) => item.date),
      labels: {
        formatter: (value) => moment(value).format("D/M/YY"),
      },
    },
    stroke: { width: 3, curve: "smooth" },
    yaxis: { title: { text: "Quantity (Units)" } },
  };

  const chartSeries = [
    { name: "Imported", data: data.map((item) => item.imported) },
    { name: "Sold", data: data.map((item) => item.sold) },
    { name: "Exported", data: data.map((item) => item.exported) },
  ];

  // คำนวณข้อมูลของหน้าปัจจุบัน
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = data.slice(indexOfFirstItem, indexOfLastItem);

  // คำนวณจำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(data.length / itemsPerPage);

  return (
    <div className="p-4 bg-white shadow-lg rounded-lg">
      <h2 className="font-semibold mb-4">Imported - Sold - Exported Products</h2>

      {/* ปุ่มเลือกช่วงเวลา */}
      <div className="mb-4 flex gap-2">
        {["daily", "weekly", "monthly"].map((frame) => (
          <button
            key={frame}
            onClick={() => setTimeFrame(frame)}
            className={`px-4 py-2 rounded-md transition ${
              timeFrame === frame
              ? "btn text-white bg-red-800 border-none hover:bg-red-900" : "btn bg-white border-red-500 text-red-500 hover:bg-red-800 hover:border-none hover:text-white"}`}
          >
            {frame === "daily" ? "Daily" : frame === "weekly" ? "Weekly" : "Monthly"}
          </button>
        ))}
      </div>

      {/* กราฟเส้น */}
      <Chart options={chartOptions} series={chartSeries} type="line" height={350} />

      {/* ตารางข้อมูล */}
      <div className="overflow-x-auto">
        <table className="table-auto table-xs min-w-full border-4 border-gray-300 mb-4 text-gray-800">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="text-sm px-4 py-2 text-left">Date</th>
              <th className="text-sm px-4 py-2 text-left">Imported</th>
              <th className="text-sm px-4 py-2 text-left">Sold</th>
              <th className="text-sm px-4 py-2 text-left">Exported</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-100 text-gray-600">
                <td className="border border-gray-300 px-4 py-2">{moment.utc(item.date).format("DD/MM/YYYY")}</td>
                <td className="border border-gray-300 px-4 py-2">{item.imported}</td>
                <td className="border border-gray-300 px-4 py-2">{item.sold}</td>
                <td className="border border-gray-300 px-4 py-2">{item.exported}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ปุ่มเปลี่ยนหน้า */}
        <div className="flex justify-center mt-4 space-x-4">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600">Previous</button>
          <div className="flex items-center">
            Page {currentPage} of {totalPages}
          </div>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600">Next</button>
        </div>
      </div>
    </div>
  );
};

export default ProductMovementChart;
