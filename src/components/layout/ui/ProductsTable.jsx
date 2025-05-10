import { useState } from "react";
import { useStockThreshold } from "../../../Contexts/StockThresholdContext";

const ProductsTable = ({
  currentProductRequests = [],
  products = [],
  branchName = "",
  handlePreviousPageProduct,
  handleNextPageProduct,
  currentProductPage,
  totalProductPages,
}) => {
  const [itemsPerPage] = useState(10);
  const { lowStockThreshold, warningMin, warningMax } = useStockThreshold();

  return (
    <>
      {/* Products Table */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-red-600 my-4">
          Products ({branchName})
        </h3>
        <table className="table-auto table-xs w-full border-collapse border-4 border-gray-300 mb-4 text-gray-800">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="text-sm">#</th>
              <th className="text-sm px-4 py-2">Product Name</th>
              <th className="text-sm px-4 py-2">Price</th>
              <th className="text-sm px-4 py-2">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {currentProductRequests.map((item, index) => {
              const product = products.find(
                (product) => product.product_id === item.product_id
              );

              const rowIndex = (currentProductPage - 1) * itemsPerPage + index + 1; // Calculate row index

              return (
                <tr key={item.inventory_id} className="hover:bg-gray-100 text-gray-600 border-2">
                  <td className="text-center">{rowIndex}</td>
                  <td className="border px-4 py-2">
                    {product ? product.product_name : "-"}
                  </td>
                  <td className="border px-4 py-2">
                    {product ? product.price : "-"}
                  </td>
                  <td
                    className={`border ${
                      item.quantity < lowStockThreshold
                        ? "text-red-500"
                        : item.quantity >= warningMin && item.quantity <= warningMax
                        ? "text-yellow-500"
                        : "text-green-500"
                    }`}
                  >
                    {item.quantity}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls for Products */}
      <div className="flex justify-center mt-4 space-x-4">
        <button
          onClick={handlePreviousPageProduct}
          disabled={currentProductPage === 1}
          className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
        >
          Previous
        </button>
        <div className="flex items-center">
          <span className="mr-2">Page</span>
          <span>{currentProductPage}</span>
          <span className="ml-2">of {totalProductPages}</span>
        </div>
        <button
          onClick={handleNextPageProduct}
          disabled={currentProductPage === totalProductPages}
          className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
        >
          Next
        </button>
      </div>
    </>
  );
};

export default ProductsTable;
