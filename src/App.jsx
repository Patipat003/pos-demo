import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './index.css';
import MainLayout from "./components/layout/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import SalesPage from "./pages/SalesPage";
import SalesHistoryPage from "./pages/SalesHistoryPage";
import ProductPage from "./pages/ProductPage";
import ReportsPage from "./pages/ReportsPage";
import UserManagementPage from "./pages/UserManagementPage";
import DetailReportPage from "./pages/DetailReportPage";
import EmployeeTransferPage from "./pages/EmployeeTransferPage";
import InventoryPage from "./pages/InventoryPage";
import { ToastContainer } from "react-toastify";
import SelectBranchPage from "./pages/SelectBranchPage";
import BranchesPage from "./pages/BranchesPage";
import ReportsEmployeePage from "./pages/ReportsEmployeePage";
import { StockThresholdProvider } from "./Contexts/StockThresholdContext";

function App() {
  return (
    <>
      <StockThresholdProvider>
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              }
            />
            <Route
              path="/sales"
              element={
                <MainLayout>
                  <SalesPage />
                </MainLayout>
              }
            />
            <Route
              path="/sales-history"
              element={
                <MainLayout>
                  <SalesHistoryPage />
                </MainLayout>
              }
            />
            <Route
              path="/product"
              element={
                <MainLayout>
                  <ProductPage />
                </MainLayout>
              }
            />
            <Route
              path="/reports"
              element={
                <MainLayout>
                  <ReportsPage />
                </MainLayout>
              }
            />
            <Route
              path="/user-management"
              element={
                <MainLayout>
                  <UserManagementPage />
                </MainLayout>
              }
            />
            <Route
              path="/detail-report"
              element={
                <MainLayout>
                  <DetailReportPage />
                </MainLayout>
            }
            />
            <Route
              path="/employee-transfer"
              element={
                <MainLayout>
                  <EmployeeTransferPage />
                </MainLayout>
              }
            />
            <Route
              path="/inventory"
              element={
                <MainLayout>
                  <InventoryPage />
                </MainLayout>
              }
            />
            <Route
              path="/branches-management"
              element={
                <MainLayout>
                  <BranchesPage />
                </MainLayout>
            }
            />
            <Route
              path="/employee-reports"
              element={
                <MainLayout>
                  <ReportsEmployeePage />
                </MainLayout>
            }
            />
          </Routes>
        </Router>
      </StockThresholdProvider>
      <ToastContainer />
    </>  
  );
}

export default App;
