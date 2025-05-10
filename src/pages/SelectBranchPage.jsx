import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

const SelectBranchPage = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch branch data from API
  const fetchBranches = async () => {
      const response = await axios.get(`${API_BASE_URL}/branches.json`);
      if (Array.isArray(response.data.Data)) {
        setBranches(response.data.Data);
      } else {
        console.error("Invalid response format");
      }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleBranchSelect = (e) => {
    setSelectedBranch(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-10 rounded-lg shadow-lg">
        <h3 className="text-lg text-gray-600 font-semibold mb-6">
          Please select a branch and confirm your password
        </h3>

        <select
          onChange={handleBranchSelect}
          className="w-full bg-white text-gray-600 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
        >
          <option value="">Select Branch</option>
          {branches.length > 0 ? (
            branches.map((branch) => (
              <option key={branch.branch_id} value={branch.branch_id}>
                {branch.b_name}
              </option>
            ))
          ) : (
            <option disabled>No branch data available</option>
          )}
        </select>

        {/* Password input */}
        <input
          type="password"
          placeholder="Confirm password"
          value={password}
          onChange={handlePasswordChange}
          className="w-full bg-white text-gray-600 px-3 py-2 mt-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
        />

        <div className="mt-4">
          <button
            className="btn w-full border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectBranchPage;
