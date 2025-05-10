import React from "react";
import { Bar } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { useStockThreshold } from "../../../Contexts/StockThresholdContext";

const InventoryModal = ({ selectedInventory, branches, handleCloseModal, userbranch_id }) => {
  
  const { lowStockThreshold } = useStockThreshold();
  
  if (!selectedInventory) return null;

  // ดึงข้อมูลสินค้าที่เกี่ยวข้อง
  const branchData = selectedInventory.relatedInventory.map((item) => ({
    branch: branches[item.branchid]?.b_name || "Unknown",
    quantity: item.quantity,
    isUserBranch: item.branchid === userBranchId, // เช็คว่าสาขาเป็นของผู้ใช้หรือไม่
  }));

  // ข้อมูลกราฟ
  const data = {
    labels: branchData.map((item) => item.branch),
    datasets: [
      {
        label: "Quantity",
        data: branchData.map((item) => item.quantity),
        backgroundColor: branchData.map((item) =>
          item.quantity < lowStockThreshold ? "rgba(255, 99, 132, 0.6)" : "rgba(75, 192, 192, 0.6)"
        ),
        borderColor: branchData.map((item) =>
          item.quantity < lowStockThreshold ? "rgba(255, 99, 132, 1)" : "rgba(75, 192, 192, 1)"
        ),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-gray-900/50 z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg relative">
        {/* แสดงชื่อสินค้า */}
        <h2 className="text-2xl font-bold mb-4 text-center text-red-600">
          {selectedInventory.productname || "No Product Name Available"}
        </h2>

        {/* กราฟแสดงจำนวนสินค้า */}
        <div className="mb-6">
          <Bar data={data} options={options} />
        </div>

        {/* รายละเอียดข้อความ */}
        <div className="text-sm text-gray-700 space-y-2">
          {branchData.map((item, index) => (
            <div
              key={index}
              className={`flex justify-between items-center ${
                item.isUserBranch ? "font-bold text-red-600" : ""
              }`}
            >
              <span>
                {item.branch} {item.isUserBranch && "(Your Branch)"}
              </span>
              <span
                className={`${
                  item.quantity < lowStockThreshold ? "text-red-500" : "text-green-600"
                }`}
              >
                {item.quantity} pieces
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={handleCloseModal}
          className="btn w-full border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 mt-4"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default InventoryModal;
