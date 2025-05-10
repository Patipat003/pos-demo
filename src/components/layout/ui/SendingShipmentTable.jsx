import moment from "moment";
import { FaShippingFast, FaCheckCircle, FaTimesCircle } from "react-icons/fa"; // นำเข้าไอคอน

const SendingShipmentTable = ({
  currentSentRequests = [],
  branches = [],
  products = [],
  handleUpdateStatus,
  handlePreviousPageSent,
  handleNextPageSent,
  currentSentPage = 1,
  totalSentPages = 1,
}) => {

  return (
    <>
      {/* Sending Shipment Table */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-red-600 mb-4">
          Sending Shipment
        </h3>
        <table className="table-auto table-xs w-full border-collapse border-4 border-gray-300 mb-4 text-gray-800">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="text-sm px-4 py-2">To Branch</th>
              <th className="text-sm px-4 py-2">Product Name</th>
              <th className="text-sm px-4 py-2">Quantity</th>
              <th className="text-sm px-4 py-2">Created At</th>
              <th className="text-sm px-4 py-2">Status</th>
                <th className="text-sm px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentSentRequests.length > 0 ? (
              currentSentRequests.map((request) => {
                const toBranch = branches.find(
                  (b) => b.branch_id === request.tobranch_id
                );
                const product = products.find(
                  (p) => p.product_id === request.product_id
                );

                // 🎯 ฟังก์ชันแปลง `status` เป็นไอคอน
                const getStatusIcon = (status) => {
                  switch (status) {
                    case "pending":
                      return <FaShippingFast className="text-yellow-500 text-lg" title="Pending" />;
                    case "complete":
                      return <FaCheckCircle className="text-green-500 text-lg" title="Complete" />;
                    case "reject":
                      return <FaTimesCircle className="text-red-500 text-lg" title="Rejected" />;
                    default:
                      return status;
                  }
                };

                return (
                  <tr key={request.request_id} className="bg-gray-80 hover:bg-gray-100 text-gray-600 border-2">
                    <td className="border px-4 py-2">{toBranch ? toBranch.b_name : "-"}</td>
                    <td className="border px-4 py-2">{product ? product.product_name : "-"}</td>
                    <td className="border px-4 py-2">{request.quantity}</td>
                    <td className="border px-4 py-2">
                      {moment.utc(request.created_at).format("L, HH:mm")}
                    </td>
                    {/* 🎯 ใช้ไอคอนแทนสถานะ */}
                    <td className="border px-4 py-2 flex items-center justify-center">{getStatusIcon(request.status)}</td>
                      <td className="border px-4 py-2 text-center space-x-2">
                      {request.status === "pending" && (
                          <>
                          <button
                              onClick={() => handleUpdateStatus(request.request_id, "complete")}
                              className="text-green-500 hover:text-green-700 text-xl"
                              title="Mark as Complete"
                          >
                              <FaCheckCircle />
                          </button>
                          <button
                              onClick={() => handleUpdateStatus(request.request_id, "reject")}
                              className="text-red-500 hover:text-red-700 text-xl"
                              title="Reject Request"
                          >
                              <FaTimesCircle />
                          </button>
                          </>
                      )}
                      </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="py-4 text-center text-gray-500">
                  No Sent Requests Available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls for Sent Requests */}
      <div className="flex justify-center mt-4 space-x-4">
        <button
          onClick={handlePreviousPageSent}
          disabled={currentSentPage === 1}
          className={`btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 ${
            currentSentPage === 1
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-white text-red-600 hover:bg-red-600"
          }`}
        >
          Previous
        </button>
        <div className="flex items-center">
          <span className="mr-2">Page</span>
          <span>{currentSentPage}</span>
          <span className="ml-2">of {totalSentPages}</span>
        </div>
        <button
          onClick={handleNextPageSent}
          disabled={currentSentPage === totalSentPages}
          className={`btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 ${
            currentSentPage === totalSentPages
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-white text-red-600 hover:bg-red-600"
          }`}
        >
          Next
        </button>
      </div>
    </>
  );
};

export default SendingShipmentTable;
