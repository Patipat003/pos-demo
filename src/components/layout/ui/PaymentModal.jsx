import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import PromptPayQRCode from "./PromptPayQRCode";
import { FaCreditCard, FaCashRegister, FaMobileAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PaymentModal = ({ isOpen, onClose }) => {
    const [paymentMethod, setPaymentMethod] = useState("");
    const [employeeName, setEmployeeName] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [branchName, setBranchName] = useState("");
    const [branchId, setBranchId] = useState("");
    const [amountPaid, setAmountPaid] = useState("");
    const [cartData, setCartData] = useState([]);
    const [creditCardInfo, setCreditCardInfo] = useState({
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardHolderName: "",
      email: "",
    });

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
    const fetchBranchName = useCallback(async (branchid) => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/branches.json/${branchid}`);
        setBranchName(response.data.b_name);
      } catch (err) {
        console.error("Error fetching branch:", err);
      }
    }, []);
  
    useEffect(() => {
      if (isOpen) {
        setEmployeeId("3cbfb925-0ef1-4d38-bf26-7a55ad746f15");
        setBranchId("ed787277-9cd0-4c99-9b47-4f7f93a694d8");
        setEmployeeName("Super Admin");
        fetchBranchName("Central Branch");
    
        const storedCartData = JSON.parse(localStorage.getItem("cartData"));
        if (storedCartData) {
          // Fetch product names
          Promise.all(
            storedCartData.map(async (item) => {
              try {
                const response = await axios.get(`${API_BASE_URL}/products.json/${item.product_id}`);
                return { ...item, name: response.data.b_name };
              } catch (error) {
                console.error("Error fetching product name:", error);
                return { ...item, name: "Unknown Product" }; // Fallback in case of error
              }
            })
          ).then((updatedCartData) => setCartData(updatedCartData));
        }
      }
    }, [isOpen, fetchBranchName]);    
    
    const handlePaymentMethodChange = (method) => {
        setPaymentMethod(method);
        if (method !== "cash") setAmountPaid("");
    };

    const handleNumpadInput = (value) => {
        if (value === "clear") {
            setAmountPaid((prev) => prev.slice(0, -1));
        } else {
            setAmountPaid((prev) => prev + value);
        }
    };
  
    const handleCreditCardInputChange = (e) => {
        const { name, value } = e.target;
        setCreditCardInfo((prev) => ({ ...prev, [name]: value }));
    };

    const handleAmountChange = (event) => {
        setAmountPaid(event.target.value);
    };

    const handleConfirmPayment = () => {
      if (!paymentMethod) {
        toast.error("Please select a payment method.");
        return;
      }
    
      if (paymentMethod === "credit-card") {
        const { cardNumber, expiryDate, cvv, cardHolderName, email } = creditCardInfo;
        if (!cardNumber || !expiryDate || !cvv || !cardHolderName || !email) {
          toast.error("Please fill in all credit card details.");
          return;
        }
      }
    
      const totalAmount = cartData.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
    
      let change = 0;
      if (paymentMethod === "cash" && amountPaid) {
        change = parseFloat(amountPaid) - totalAmount;
      }
    
      const saleItems = cartData.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        total_price: item.price * item.quantity,
      }));
    
      const saleData = {
        employee_id: employeeId,
        branch_id: branchId,
        sale_items: saleItems,
        total_amount: totalAmount,
        paymentMethod,
        creditCardInfo: paymentMethod === "credit-card" ? creditCardInfo : null,
        change: paymentMethod === "cash" ? change : null, // Only include change for cash payments
      };
    
      console.log("Sale Data to be posted:", saleData);
  
    };
  
    const clearLocalStorage = () => {
      localStorage.removeItem("cartData");
    };
  
    const handleClose = () => {
      clearLocalStorage();
      onClose();
    };

    if (!isOpen) return null;

    const totalAmount = cartData.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

  return (
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
      <div
        className="bg-white p-6 rounded-lg shadow-xl relative"
        style={{ width: "900px", height: "600px" }}
      >
        {/* Left Section */}
        <div
          className="absolute left-0 top-0 p-6"
          style={{
            width: "400px",
            height: "100%",
            borderRight: "1px solid #e5e7eb",
          }}
        >
          <h2 className="text-2xl text-red-600 font-semibold mb-4">Payment</h2>

          <div>
            <span className="block text-gray-600 text-sm mb-2 font-medium">
              Select Payment Method
            </span>
            <div className="space-y-2">
              {["credit-card", "cash", "mobile-pay"].map((method) => (
                <button
                  key={method}
                  onClick={() => handlePaymentMethodChange(method)}
                  className={`btn block w-full rounded-lg text-sm font-medium text-left py-2 px-4 transition-all duration-300 ease-in-out ${
                    paymentMethod === method
                      ? "bg-white text-red-600 border-2 border-red-600"
                      : "bg-white text-gray-600 border-2 border-gray-300"
                  } hover:bg-red-800 hover:border-red-500 hover:text-white focus:outline-none`}
                >
                  {method === "credit-card" && (
                    <span className="flex items-center">
                      <FaCreditCard className="mr-2" /> Credit Card
                    </span>
                  )}
                  {method === "cash" && (
                    <span className="flex items-center">
                      <FaCashRegister className="mr-2" /> Cash
                    </span>
                  )}
                  {method === "mobile-pay" && (
                    <span className="flex items-center">
                      <FaMobileAlt className="mr-2" /> Mobile Pay
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === "credit-card" && (
            <div className="mt-4">
              <h3 className="text-lg text-red-600 font-semibold mb-4">Credit Card Details</h3>
              <div className="space-y-4">
                <input
                  name="cardNumber"
                  value={creditCardInfo.cardNumber}
                  onChange={handleCreditCardInputChange}
                  type="text"
                  placeholder="Card Number"
                  className="border-2 w-full bg-white text-gray-600 border-gray-300 rounded-lg p-2"
                />
                <div className="flex space-x-4">
                  <input
                    name="expiryDate"
                    value={creditCardInfo.expiryDate}
                    onChange={handleCreditCardInputChange}
                    type="text"
                    placeholder="Expiry Date (MM/YY)"
                    className="border-2 flex-1 bg-white text-gray-600 border-gray-300 rounded-lg p-2"
                  />
                  <input
                    name="cvv"
                    value={creditCardInfo.cvv}
                    onChange={handleCreditCardInputChange}
                    type="number"
                    placeholder="CVV"
                    className="w-2 border-2 flex-1 bg-white text-gray-600 border-gray-300 rounded-lg p-2"
                  />
                </div>
                <input
                  name="cardHolderName"
                  value={creditCardInfo.cardHolderName}
                  onChange={handleCreditCardInputChange}
                  type="text"
                  placeholder="Cardholder Name"
                  className="border-2 w-full bg-white text-gray-600 border-gray-300 rounded-lg p-2"
                />
                <input
                  name="email"
                  value={creditCardInfo.email}
                  onChange={handleCreditCardInputChange}
                  type="email"
                  placeholder="Email"
                  className="border-2 w-full bg-white text-gray-600 border-gray-300 rounded-lg p-2"
                />
              </div>
            </div>
          )}

          {paymentMethod === "cash" && (
            <div className="mt-4">
                <label
                    htmlFor="amount-paid"
                    className="block text-lg text-red-600 font-semibold mb-2"
                >
                Amount Paid
                </label>
                    <input
                        id="amount-paid"
                        type="text"
                        value={amountPaid}
                        onChange={handleAmountChange}
                        placeholder="Enter amount"
                        className="border-2 w-full text-gray-600 border-gray-300 bg-white rounded-lg p-2"
                    />
                <div className="grid grid-cols-3 gap-2 mt-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
                    <button
                    key={num}
                    onClick={() => handleNumpadInput(num.toString())}
                    className="btn bg-white border-red-500 text-gray-600 p-3 rounded-lg hover:border-none hover:bg-red-800 hover:text-white"
                    >
                    {num}
                    </button>
                ))}
                <button
                    onClick={() => handleNumpadInput("clear")}
                    className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
                >
                    Delete
                </button>
                </div>
            </div>
            )}

            {/* Mobile Pay Section (PromptPay) */}
            {paymentMethod === "mobile-pay" && (
              <PromptPayQRCode totalAmount={totalAmount} />
            )}
        </div>

        {/* Right Section */}
        <div
          className="absolute right-0 top-0 p-6"
          style={{
            width: "500px",
            height: "100%",
          }}
        >

          {/* Cart Summary */}
          <h3 className="text-xl text-red-600 font-medium mb-4">Cart Summary</h3>
          <div className="mt-4" style={{ maxHeight: "330px", overflowY: "auto" }}>
            <ul className="divide-y divide-gray-200">
              {cartData.map((item, index) => (
                <li key={index} className="text-gray-600 py-2 flex justify-between">
                  <span>x {item.quantity}</span>
                  <span className="mr-2 truncate w-64">{item.product_name}</span>
                  <span className="mr-2">฿{(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>


          {/* Total Items and Total Amount */}
          <div className="mt-4 flex justify-between items-center">
            <div className="flex flex-col items-start">
              <span className="text-gray-600 font-semibold">Total</span>
              <span className="text-gray-600 mb-2">
                {cartData.reduce((acc, item) => acc + item.quantity, 0)} items
              </span>
            </div>
            <span className="text-gray-600 font-semibold mt-6">
              ฿{totalAmount.toFixed(2)}
            </span>
          </div>



          {/* Change if payment is cash */}
          {paymentMethod === "cash" && amountPaid && (
            <div className="mt-4 flex justify-between">
              <span className="font-semibold text-gray-600">Change</span>
              <span className="text-gray-600">฿{(parseFloat(amountPaid) - totalAmount).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Confirm Button */}
        <div className="absolute bottom-6 right-6">
          <button
            onClick={handleConfirmPayment}
            className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
          >
            Confirm Payment
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="cursor-pointer absolute top-4 right-5 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default PaymentModal;
