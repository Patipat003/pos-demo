import moment from "moment";
import { FaShippingFast, FaCheckCircle, FaTimesCircle } from "react-icons/fa"; // นำเข้าไอคอน

const ReceivingShipmentTable = ({
  currentReceivedRequests,
  branches,
  products,
  handlePreviousPageReceived,
  handleUpdateStatus,
  handleNextPageReceived,
  currentReceivedPage,
  totalReceivedPages,
}) => {

  return (
    <>
        {/* Receiving Shipment Table */}
        <div className="mb-6">
            <h3 className="text-xl font-semibold text-red-600 mb-4">Receiving Shipment</h3>
            <table className="table-auto table-xs w-full border-collapse border-4 border-gray-300 mb-4 text-gray-800">
            <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="text-sm px-4 py-2">From Branch</th>
                  <th className="text-sm px-4 py-2">Product Name</th>
                  <th className="text-sm px-4 py-2">Quantity</th>
                  <th className="text-sm px-4 py-2">Created At</th>
                  <th className="text-sm px-4 py-2">Status</th>
                  <th className="text-sm px-4 py-2">Actions</th>
                </tr>
            </thead>
            <tbody>
                {currentReceivedRequests.map((request) => {
                const fromBranch = branches.find(
                    (branch) => branch.branch_id === request.frombranch_id
                );
                const product = products.find(
                    (product) => product.product_id === request.product_id
                );

                // 🎯 ฟังก์ชันแปลง `status` เป็นไอคอน
                const getStatusIcon = (status) => {
                    switch (status) {
                    case "pending":
                    case "Pending":
                        return <FaShippingFast className="text-yellow-500 text-lg" title="Pending" />;
                    case "complete":
                    case "Done":
                    case "complete_synced":
                        return <FaCheckCircle className="text-green-500 text-lg" title="Complete" />;
                    case "reject":
                        return <FaTimesCircle className="text-red-500 text-lg" title="Rejected" />;
                    default:
                        return status;
                    }
                };

                return (
                    <tr key={request.request_id} className="bg-gray-80 hover:bg-gray-100 text-gray-600 border-2">
                      <td className="border px-4 py-2">
                          {fromBranch ? fromBranch.b_name : "Warehouse"}
                      </td>
                      <td className="border px-4 py-2">
                          {product ? product.product_name : "-"}
                      </td>
                      <td className="border px-4 py-2">{request.quantity}</td>
                      <td className="border px-4 py-2">
                          {moment.utc(request.created_at).format("L, HH:mm")}
                      </td>
                      <td className="border px-4 py-2 flex items-center justify-center">{getStatusIcon(request.status)}</td>
                          <td className="border px-4 py-2 text-center space-x-2">
                            {fromBranch ? "" : "Warehouse" && request.status === "Pending" && (
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
                })}
              </tbody>
            </table>
        </div>

        {/* Pagination Controls for Received Requests */}
        <div className="flex justify-center mt-4 space-x-4">
            <button
                    onClick={handlePreviousPageReceived}
                    disabled={currentReceivedPage === 1}
                    className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
                >
                Previous
            </button>
            <div className="flex items-center">
                <span className="mr-2">Page</span>
                <span>{currentReceivedPage}</span>
                <span className="ml-2">of {totalReceivedPages}</span>
            </div>
            <button
                onClick={handleNextPageReceived}
                disabled={currentReceivedPage === totalReceivedPages}
                className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
            >
            Next
            </button>
        </div>
    </>
  );
};

export default ReceivingShipmentTable;
