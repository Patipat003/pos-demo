const ReceiptPrinter = ({ modalData }) => {
  const { receipt_number, created_at, items, b_name, location } = modalData;

  return (
    <div className="p-6 bg-white border border-gray-300 rounded-lg w-[350px] mx-4">
      <div className="text-center text-gray-600 mb-6">
        <h1 className="text-xl font-bold">Store ({b_name})</h1>  {/* Display branch name */}
        <p className="text-sm">Location: {location}</p>  {/* Display branch location */}
        <p className="text-sm">Phone: 123-456-7890</p>
        <p className="text-sm">www.storewebsite.com</p>
      </div>
      
      <div className="border-t border-gray-300 text-gray-600 pt-4 mb-6">
        <h2 className="text-sm font-bold mb-2">Receipt #{receipt_number}</h2>
        <p className="text-xs mb-2">Date: {created_at}</p>
      </div>

      <div className="text-gray-600 rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300 mb-6">
              <th className="text-sm text-left">Item</th>
              <th className="text-sm text-right">Price</th>
              <th className="text-sm text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td className='text-xs text-left'>{item.quantity} x {item.productname}</td>
                <td className="text-xs text-right">{item.price.toFixed(2)}</td>
                <td className="text-xs text-right">
                  {(item.quantity * item.price).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="font-semibold pt-4 text-gray-600">Total</td>
              <td></td>
              <td className="font-semibold text-right">฿
                {items
                  .reduce(
                    (total, item) => total + item.quantity * item.price,
                    0
                  )
                  .toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="border-t border-gray-300 text-gray-600 pt-4 mt-6">
        <div className="flex justify-between">
          <span className="text-sm">Thank you for shopping with us!</span>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPrinter;
