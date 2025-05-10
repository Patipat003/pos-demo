import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import AddRequestModal from "./AddRequestModal";
import SendingShipmentTable from "./SendingShipmentTable";
import ReceivingShipmentTable from "./ReceivingShipmentTable";
import ProductsTable from "./ProductsTable";

const RequestInventory = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]); // เพิ่ม categories เป็น state
  const [newRequest, setNewRequest] = useState({
    frombranchid: "",
    tobranchid: "",
    productid: "",
    quantity: 0,
    status: "pending",
  });
  const [branchName, setBranchName] = useState("");
  const [warehouse, setWarehouse] = useState([]);
  const [error, setError] = useState("");
  const [itemsPerPage] = useState(10);
  const location = useLocation();
  const [toBranch, setToBranch] = useState('');
  const [activeSection, setActiveSection] = useState("products");
  const [userRole, setUserRole] = useState(null);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, "d/MM/yyyy, HH:mm");
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch data from API
  const fetchRequests = async () => {
    try {

      const response = await axios.get(`${API_BASE_URL}/requests.json`);
      setRequests(response.data|| []);
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/branches.json`);
      setBranches(response.data || []);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products.json`);
      setProducts(response.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory.json`);
      setInventory(response.data || []);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/category.json`);
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  };

  const fetchWarehouse = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/warehouse.json`);
      setWarehouse(response.data || []);
    } catch (err) {
      console.error("Error fetching warehouse:", err);
    }
  };

  const fetchInventoryForBranch = async (branchid) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory.json?branchid=${branchid}`);
      setInventory(response.data);
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
    }
  };

  const updateProductOptionsWithInventory = () => {
    const updatedProducts = products.map((product) => {
      const inventoryItem = inventory.find(
        (item) => item.product_id === product.product_id
      );
      const quantity = inventoryItem ? inventoryItem.quantity : 0;
      return {
        ...product,
        displayName: `${product.product_name} (${quantity})`,
      };
    });
    setProducts(updatedProducts);
  };

  useEffect(() => {
    fetchBranches();
    fetchProducts();
    fetchRequests();
    fetchInventory();
    fetchWarehouse();
    fetchCategories(); // เรียกใช้ฟังก์ชัน fetchCategories
  }, []);

  useEffect(() => {
      if (toBranch) {
        fetchInventoryForBranch(toBranch);
      }
  }, [toBranch]);

  useEffect(() => {
    if (inventory.length > 0) {
      updateProductOptionsWithInventory();
    }
  }, [inventory]);

  const getBranchFromMock = () => {
    return "ed787277-9cd0-4c99-9b47-4f7f93a694d8";
  };

  useEffect(() => {
    setUserRole("Super Admin"); 
  }, []);

  useEffect(() => {
    const branchid = getBranchFromMock();
    setNewRequest((prevRequest) => ({
      ...prevRequest,
      tobranchid: branchid,
    }));

    const branch = branches.find((branch) => branch.branch_id === branchid);
    if (branch) {
      setBranchName(branch.b_name);
    }
  }, [branches]);

  const branchid = getBranchFromMock();
  const filteredInventory = inventory.filter(
    (item) => item.branch_id === branchid
  );

  const [currentSentPage, setCurrentSentPage] = useState(1);
  const [currentReceivedPage, setCurrentReceivedPage] = useState(1);
  const [currentProductPage, setCurrentProductPage] = useState(1);

  const sentRequests = requests
    .filter(request => request.frombranch_id === branchid)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const receivedRequests = requests
    .filter(request => request.tobranch_id === branchid)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const getPaginatedRequests = (requests, currentPage) => {
    const indexOfLastRequest = currentPage * itemsPerPage;
    const indexOfFirstRequest = indexOfLastRequest - itemsPerPage;
    return requests.slice(indexOfFirstRequest, indexOfLastRequest);
  };

  const currentSentRequests = getPaginatedRequests(sentRequests, currentSentPage);
  const currentReceivedRequests = getPaginatedRequests(receivedRequests, currentReceivedPage);
  const currentProductRequests = getPaginatedRequests(filteredInventory, currentProductPage);

  const totalSentPages = Math.ceil(sentRequests.length / itemsPerPage);
  const totalReceivedPages = Math.ceil(receivedRequests.length / itemsPerPage);
  const totalProductPages = Math.ceil(filteredInventory.length / itemsPerPage);

  const handlePreviousPageSent = () => {
    if (currentSentPage > 1) {
      setCurrentSentPage(currentSentPage - 1);
    }
  };

  const handlePreviousPageReceived = () => {
    if (currentReceivedPage > 1) {
      setCurrentReceivedPage(currentReceivedPage - 1);
    }
  };

  const handleNextPageSent = () => {
    if (currentSentPage < totalSentPages) {
      setCurrentSentPage(currentSentPage + 1);
    }
  };

  const handleNextPageReceived = () => {
    if (currentReceivedPage < totalReceivedPages) {
      setCurrentReceivedPage(currentReceivedPage + 1);
    }
  };

  const handlePreviousPageProduct = () => {
    if (currentProductPage > 1) {
      setCurrentProductPage(currentProductPage - 1);
    }
  };

  const handleNextPageProduct = () => {
    if (currentProductPage < totalProductPages) {
      setCurrentProductPage(currentProductPage + 1);
    }
  };

  const userBranchId = getBranchFromMock();

  const pendingSentRequestsCount = requests.filter(
    (request) =>
      request.frombranch_id === userBranchId &&
      request.status === "pending"
  ).length;

  const pendingReceivedRequestsCount = requests.filter(
    (request) =>
      request.tobranch_id === userBranchId &&
      request.status === "Pending"
  ).length;

  useEffect(() => {
    if (location.state?.openModal) {
      setIsModalOpen(true);
    }
  }, [location.state]);

  useEffect(() => {
    if (!branchid) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchRequests();
      fetchInventory();
    }, 2000);

    return () => clearInterval(intervalId);
  }, [fetchRequests],{fetchInventory});

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 mt-4"
      >
        Request Inventory
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gray-900/50 z-50 flex justify-center items-center"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-8 rounded-lg shadow-lg max-w-7xl w-full relative z-60 overflow-y-auto max-h-screen mt-10"
              onClick={(e) => e.stopPropagation()}
            >
              <AddRequestModal
                newRequest={newRequest}
                setNewRequest={setNewRequest}
                branches={branches}
                products={products}
                inventory={inventory}
                categories={categories} // ต้องแน่ใจว่ามี categories ตรงนี้
                branchid={branchid}
                branchName={branchName}
              />

              <div className="flex justify-center space-x-4 mb-6">
                <button
                  onClick={() => setActiveSection("products")}
                  className={`btn border-none ${
                    activeSection === "products" ? "bg-red-900" : "bg-red-800"
                  } text-white px-6 py-3 rounded hover:bg-red-900 transition duration-300`}
                >
                  Products
                </button>

                <button
                  onClick={() => setActiveSection("sending")}
                  className={`btn border-none ${
                    activeSection === "sending" ? "bg-red-900" : "bg-red-800"
                  } text-white px-6 py-3 rounded hover:bg-red-900 transition duration-300 relative`}
                >
                  Sending Shipment
                  {pendingSentRequestsCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-800 text-white text-xs rounded-full px-2 py-1 transform translate-x-1/2 -translate-y-1/2">
                      {pendingSentRequestsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveSection("receiving")}
                  className={`btn border-none ${
                    activeSection === "receiving" ? "bg-red-900" : "bg-red-800"
                  } text-white px-6 py-3 rounded hover:bg-red-900 transition duration-300 relative`}
                >
                  Receiving Shipment
                  {pendingReceivedRequestsCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-800 text-white text-xs rounded-full px-2 py-1 transform translate-x-1/2 -translate-y-1/2">
                      {pendingReceivedRequestsCount}
                    </span>
                  )}
                </button>
              </div>
              {activeSection === "sending" && (
                <SendingShipmentTable
                  currentSentRequests={currentSentRequests}
                  branches={branches}
                  products={products}
                  handlePreviousPageSent={handlePreviousPageSent}
                  handleNextPageSent={handleNextPageSent}
                  currentSentPage={currentSentPage}
                  totalSentPages={totalSentPages}
                />
              )}

              {activeSection === "receiving" && (
                <ReceivingShipmentTable
                  currentReceivedRequests={currentReceivedRequests}
                  branches={branches}
                  products={products}
                  handlePreviousPageReceived={handlePreviousPageReceived}
                  handleNextPageReceived={handleNextPageReceived}
                  currentReceivedPage={currentReceivedPage}
                  totalReceivedPages={totalReceivedPages}
                />
              )}
              {activeSection === "products" && (
                <ProductsTable
                  currentProductRequests={currentProductRequests}
                  products={products}
                  branchName={branchName}
                  handlePreviousPageProduct={handlePreviousPageProduct}
                  handleNextPageProduct={handleNextPageProduct}
                  currentProductPage={currentProductPage}
                  totalProductPages={totalProductPages}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RequestInventory;