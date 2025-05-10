import { createContext, useContext, useState } from "react";

// สร้าง Context
const StockThresholdContext = createContext();

// Provider สำหรับใช้ในแอป
export const StockThresholdProvider = ({ children }) => {
  const [lowStockThreshold, setLowStockThreshold] = useState(200);
  const [warningMin, setWarningMin] = useState(90);
  const [warningMax, setWarningMax] = useState(110);

  return (
    <StockThresholdContext.Provider
      value={{
        lowStockThreshold,
        warningMin,
        warningMax,
        setLowStockThreshold,
        setWarningMin,
        setWarningMax
      }}
    >
      {children}
    </StockThresholdContext.Provider>
  );
};

// Hook สำหรับใช้งาน Context
export const useStockThreshold = () => {
  return useContext(StockThresholdContext);
};
