const AddRequestModal = ({
  newRequest,
  setNewRequest,
  branches,
  products,
  inventory,
  branchid,
  branchName,
  handleAddRequest,
}) => {
  return (
    <div className="mb-8">
    <h3 className="text-xl font-semibold text-gray-600 mb-4">
        Add New Request
    </h3>
    <form>
        <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
            <label className="block text-gray-700 font-medium mb-2">
            From Branch ({branchName})
            </label>
            <select
            className="w-full p-3 border text-gray-600 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            value={newRequest.tobranch_id}
            disabled
            >
            <option value="">Your Branch</option>
            </select>
        </div>

        <div>
            <label className="block text-gray-700 font-medium mb-2">
            To Branch
            </label>
            <select
            className="w-full p-3 border text-gray-600 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            value={newRequest.frombranch_id}
            onChange={(e) =>
                setNewRequest({ ...newRequest, frombranch_id: e.target.value })
            }
            >
            <option value="">Select Branch</option>
            {branches
                .filter((branch) => branch.branch_id !== branchid) // Filter out our own branch
                .map((branch) => (
                <option key={branch.branch_id} value={branch.branch_id}>
                    {branch.b_name}
                </option>
                ))}
            </select>
        </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Product
            </label>
            <select
              className="w-full p-3 border text-gray-600 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              value={newRequest.product_id}
              onChange={(e) =>
                setNewRequest({ ...newRequest, product_id: e.target.value })
              }
            >
              <option value="">Select Product</option>
              {products
                .map((product) => {
                  // Find the inventory for this product in the selected "To Branch"
                  const branchInventory = inventory.find(
                    (item) => item.product_id === product.product_id && item.branch_id === newRequest.frombranch_id
                  );
                  const quantity = branchInventory ? branchInventory.quantity : 0;

                  // Filter to show only products with quantity > 1
                  if (quantity > 1) {
                    return (
                      <option key={product.product_id} value={product.product_id}>
                        {product.product_name} ({quantity})
                      </option>
                    );
                  }
                  return null; // Skip if quantity is 1 or less
                })
              }
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
            Quantity
            </label>
            <input
            type="number"
            className="w-full p-3 border text-gray-600 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            value={newRequest.quantity}
            onChange={(e) =>
                setNewRequest({
                ...newRequest,
                quantity: parseInt(e.target.value),
                })
            }
            min="0"
            />
         </div>
        </div>

        <button
        className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
        onClick={handleAddRequest}
        >
        Add Request
        </button>
    </form>
    </div>
  );
};

export default AddRequestModal;
