import React, { useState, useEffect } from "react";
//import axios from "axios"; // Removed axios
//import { Select } from "@/components/ui/select"; // Removed UI components

// Mock Data
const mockEmployees = [
  { employeeid: "emp-1", name: "Alice Smith", branchid: "branch-1" },
  { employeeid: "emp-2", name: "Bob Johnson", branchid: "branch-1" },
  { employeeid: "emp-3", name: "Charlie Brown", branchid: "branch-2" },
  { employeeid: "emp-4", name: "Diana Miller", branchid: "branch-2" },
  { employeeid: "emp-5", name: "Ethan Davis", branchid: "branch-3" },
];

const mockBranches = [
  { branchid: "branch-1", bname: "Branch A" },
  { branchid: "branch-2", bname: "Branch B" },
  { branchid: "branch-3", bname: "Branch C" },
];

const EmployeeTransferPage = () => {
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [formData, setFormData] = useState({
    id: "",
    currentBranch: "",
    newBranch: "",
    date: "",
    time: "",
  });
  const [error, setError] = useState(null); // Added error state

  //const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Removed env variable

  // Mock getUserDetails function
  const getUserDetailsFromMock = () => {
    // Simulate a user object.  In a real app, this would come from your auth system.
    return { branchid: "branch-1", role: "Super Admin" }; // Changed to branch-1 for the example
  };

  const fetchEmployeesAndBranches = async () => {
    try {
      // Simulate API call delay and data retrieval
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

      // Set mock data directly instead of fetching
      setEmployees(mockEmployees);
      setBranches(mockBranches);
    } catch (err) {
      setError("Failed to load data"); // Set error state
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchEmployeesAndBranches();
    const { branchid, role } = getUserDetailsFromMock();
    setUserRole(role);
    setFormData((prev) => ({
      ...prev,
      currentBranch: role === "Super Admin" ? "" : branchid,
    }));
  }, []);

  // ฟังก์ชันกรองพนักงานที่ตรงกับสาขา
  const filterEmployeesByBranch = (branchid) => {
    return employees.filter((employee) => employee.branchid === branchid);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBranchChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, currentBranch: value }));
  };

  const getBranchName = (branchid) => {
    const branch = branches.find((branch) => branch.branchid === branchid);
    return branch ? branch.bname : "Unknown Branch";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.id || !formData.newBranch || !formData.date || !formData.time) {
      alert("Please fill in all fields."); // Basic validation
      return;
    }
    // In a real application, you'd send this data to your backend.
    console.log("Form Data Submitted:", formData);
    alert("Transfer request submitted (see console for data)."); // Mock submission
    // Reset the form (optional)
    setFormData({ id: "", currentBranch: formData.currentBranch, newBranch: "", date: "", time: "" });
  };

  if (error) {
    return <div>{error}</div>; // Display error message
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
      <h1 className="text-3xl font-bold text-red-600 mb-6">Employee Branch Transfer</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8 max-w-3xl mx-auto">
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Select Branch</label>
            <select
              name="currentBranch"
              value={formData.currentBranch}
              onChange={handleBranchChange}
              className="select text-gray-600 select-bordered border border-gray-300 w-full max-w-xs rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select Branch</option>
              {branches.map((branch) => (
                <option key={branch.branchid} value={branch.branchid}>
                  {branch.bname}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Select Employee</label>
            <select
              name="id"
              value={formData.id}
              onChange={handleInputChange}
              className="select text-gray-600 select-bordered border border-gray-300 w-full max-w-xs rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select Employee</option>
              {formData.currentBranch &&
                filterEmployeesByBranch(formData.currentBranch).map((employee) => (
                  <option key={employee.employeeid} value={employee.employeeid}>
                    {employee.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Current Branch</label>
            <input
              type="text"
              value={getBranchName(formData.currentBranch)}
              readOnly
              className="select text-gray-600 select-bordered border border-gray-300 w-full max-w-xs rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">New Branch</label>
            <select
              name="newBranch"
              value={formData.newBranch}
              onChange={handleInputChange}
              className="select text-gray-600 select-bordered border border-gray-300 w-full max-w-xs rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select New Branch</option>
              {branches.map((branch) => (
                <option key={branch.branchid} value={branch.branchid}>
                  {branch.bname}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Transfer Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="px-4 py-2 text-gray-600 select-bordered border border-gray-300 w-full max-w-xs rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Transfer Time</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleInputChange}
              className="px-4 py-2 text-gray-600 select-bordered border border-gray-300 w-full max-w-xs rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <button type="submit" className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 col-span-2">
            Submit Transfer
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-xl font-semibold text-gray-600 mb-4">Employees List</h2>
        <table className="table-auto table-xs min-w-full border-collapse border-4 border-gray-300 mb-4 text-gray-800">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="border text-sm px-4 py-2">Employee Name</th>
              <th className="border text-sm px-4 py-2">Current Branch</th>
            </tr>
          </thead>
          <tbody>
            {formData.currentBranch &&
              filterEmployeesByBranch(formData.currentBranch).map((employee) => (
                <tr key={employee.employeeid} className="hover:bg-gray-100 text-gray-600">
                  <td className="border border-gray-300 px-4 py-2">{employee.name}</td>
                  <td className="border border-gray-300 px-4 py-2">{getBranchName(employee.branchid)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeTransferPage;
