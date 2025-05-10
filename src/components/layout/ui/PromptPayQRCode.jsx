import React from "react";
import promptpayQR from "promptpay-qr";
import { QRCodeSVG } from "qrcode.react"; // ใช้ QRCodeSVG แทน QRCode

const PromptPayQRCode = ({ totalAmount }) => {
  const phoneNumber = "0985846689"; // เบอร์ PromptPay

  // ตรวจสอบและแปลงเบอร์โทรศัพท์ให้เป็นสตริง
  const phoneString = phoneNumber.toString();

  // สร้าง PromptPay QR Code โดยใช้ promptpayQR
  const promptpayData = promptpayQR(phoneString, { amount: totalAmount });

  return (
    <div className="mt-6 p-4 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <label
        htmlFor="mobile-pay"
        className="block text-2xl text-red-600 font-semibold mb-4 text-center"
      >
        Scan PromptPay QR Code
      </label>

      <div className="mb-4 flex justify-center items-center">
        {/* ใช้ QRCodeSVG จาก qrcode.react ในการแสดง QR Code */}
        <QRCodeSVG value={promptpayData} size={150} />
      </div>

      <div className="text-center">
        <span className="text-lg text-gray-700 font-medium">
          {`Amount: ฿${totalAmount.toFixed(2)}`}
        </span>
      </div>
    </div>
  );
};

export default PromptPayQRCode;
