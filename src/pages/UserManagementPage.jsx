import { useState, useEffect } from "react";
import axios from "axios";
import ExportButtons from "../components/layout/ui/ExportButtons";
import { motion, AnimatePresence } from "framer-motion";
import { toZonedTime, format } from 'date-fns-tz';
import { AiOutlineExclamationCircle } from "react-icons/ai"; 
import { Player } from "@lottiefiles/react-lottie-player"; 
import { HiOutlineUser , HiOutlinePencil, HiOutlineTrash } from "react-icons/hi";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const formatDate = (dateString) => {
  const date = toZonedTime(dateString, 'UTC');
  return format(date, "d/MM/yyyy, HH:mm");
};

const UserManagementPage = () => {
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    email: "",
    password: "",
    name: "",
    role: "",
    branchid: "",
  });
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleToUpdate, setRoleToUpdate] = useState("");
  const [employeeid, setemployeeid] = useState("");
  const [sortKey, setSortKey] = useState("employeeid");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(null);  // New state for branch filter
  const [selectedRole, setSelectedRole] = useState("");      // New state for role filter
  const [sortByDate, setSortByDate] = useState(false);
  const [userBranchId, setUserBranchId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showModal, setShowModal] = useState(false); 
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentEmployee, setCurrentEmployee] = useState({
    name: "",
    email: "",
    newPassword: "",
  });
  const [currentPage, setCurrentPage] = useState(1); 
  const itemsPerPage = 10;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchData = async () => {
    setUserBranchId({branch_id: "ed787277-9cd0-4c99-9b47-4f7f93a694d8"});
    setUserRole({role: "Super Admin"});

    const employeeResponse = await axios.get(`${API_BASE_URL}/employees.json`);
    const branchResponse = await axios.get(`${API_BASE_URL}/branches.json`);
    setEmployees(employeeResponse.data);
    setBranches(branchResponse.data);
    setLoading(false);
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const getBranchName = () => {
    const branch = branches.find((b) => b.branch_id );
    return branch ? branch.b_name : "Unknown Branch";
  };

  const handleSortChange = (key, direction) => {
    setSortKey(key);
    setSortDirection(direction);
    const sortedData = [...employees].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];
      return direction === "asc" ? (aValue < bValue ? -1 : 1) : aValue > bValue ? -1 : 1;
    });
    setEmployees(sortedData);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleRoleSort = (e) => {
    setSelectedRole(e.target.value);
  };

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/employees.json/${employeeid}`);
  
        if (response.status === 200) {
          const { name, email } = response.data;
          setCurrentEmployee({ name, email, newPassword: "" }); // เก็บข้อมูลเดิม
        }
      } catch (err) {
        console.error("Failed to fetch employee data:", err);
        toast.error("Failed to fetch employee data.");
      }
    };
  
    if (employeeid) {
      fetchEmployeeData();
    }
  }, [employeeid]);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/employees.json/${employeeid}`);

        if (response.status === 200) {
          const { name, email } = response.data;
          setName(name);
          setEmail(email);
        }
      } catch (err) {
        console.error("Failed to fetch employee data:", err);
      }
    };

    if (employeeid) {
      fetchEmployeeData();
    }
  }, [employeeid]);

  const handleDateSortChange = () => {
    setSortByDate(!sortByDate);
  };

  const filteredEmployees = employees
  .filter((item) => {
    const branchName = getBranchName(item.branch_id).toLowerCase();
    const nameMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = item.email.toLowerCase().includes(searchQuery.toLowerCase());
    const roleMatch = item.role.toLowerCase().includes(searchQuery.toLowerCase());
    const branchMatch = branchName.includes(searchQuery.toLowerCase());

    // Apply additional filters
    const branchFilterMatch = selectedBranch ? item.branch_id === selectedBranch : true;
    const roleFilterMatch = selectedRole ? item.role === selectedRole : true;

    return (nameMatch || emailMatch || roleMatch || branchMatch) && branchFilterMatch && roleFilterMatch;
  })
  .sort((a, b) => {
    if (sortByDate) {
      const dateA = new Date(a.created_at);  // Parse createdat as Date
      const dateB = new Date(b.created_at);
  
      // Compare based on the selected sort direction (ascending or descending)
      return sortDirection === "asc"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const currentEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
      return (
        <div className="flex items-center justify-center h-42 flex-col">
          <Player
            autoplay
            loop
            src="https://assets3.lottiefiles.com/packages/lf20_z4cshyhf.json"
            style={{ height: "200px", width: "200px" }}
          />
          <span className="text-red-500 text-lg font-semibold">Loading...</span>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="flex items-center justify-center h-42 flex-col">
          <AiOutlineExclamationCircle className="text-red-500 text-6xl mb-4" />
          <p className="text-red-500 text-xl">{error}</p>
        </div>
      );
    }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
      <ToastContainer />
      <h1 className="text-3xl font-bold text-red-600 mb-6">User Management</h1>
      <div className="flex justify-between mb-4">
        <button
          onClick={() => setShowAddModal(true)}
          className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 mt-4"
        >
          + Add Employee
        </button>
        <ExportButtons
          filteredTables={filteredEmployees.map(employee => ({
            email: employee.email,
            name: employee.name,
            role: employee.role,
            branch: getBranchName(employee.branch_id),
          }))}
          columns={["email", "name", "role", "branch"]} // Define the column headers accordingly
          filename="employees_report.pdf" // Filename for export
        />
      </div>

      <div className="mb-4 space-x-6 flex">
        <div className="flex items-center space-x-4 w-full relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search by Name or Email"
            className="text-gray-600 border bg-white border-gray-300 px-6 w-full py-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          )}
        </div>
      
        {userRole === "Super Admin" && (
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="select bg-white text-gray-600 select-bordered border border-gray-300 w-full max-w-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Branch</option> {/* เพิ่มตัวเลือกนี้ */}
            {branches.map((branch) => (
              <option key={branch.branch_id} value={branch.branch_id}>
                {branch.b_name}
              </option>
            ))}
          </select>
        )}

        <select
          value={selectedRole}
          onChange={handleRoleSort}
          className="select bg-white text-gray-600 select-bordered border border-gray-300 w-full max-w-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All Roles</option>
          <option value="Manager">Manager</option>
          <option value="Cashier">Cashier</option>
          <option value="Audit">Audit</option>
        </select>

        <button onClick={handleDateSortChange} className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600">
          Sort by Date
        </button>
      </div>

      <table className="table-auto table-xs min-w-full border-collapse border-4 border-gray-300 mb-4 text-gray-800">
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="text-sm">#</th>
            <th className="text-sm px-4 py-2">Email</th>
            <th className="text-sm px-4 py-2">Name</th>
            <th className="text-sm px-4 py-2">Role</th>
            <th className="text-sm px-4 py-2">Branch</th>
            <th className="text-sm px-4 py-2">Created At</th>
            <th className="text-sm px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
        {currentEmployees.map((employee, index) => {
           const rowIndex = (currentPage - 1) * itemsPerPage + index + 1; // Calculate row index
           return (
          <tr
            key={employee.employeeid} className="hover:bg-gray-100 text-gray-600">
            <td className="border border-gray-300 text-center">{rowIndex}</td>
            <td className="border border-gray-300 px-4 py-2">{employee.email}</td>
            <td className="border border-gray-300 px-4 py-2">{employee.name}</td>
            <td className="border border-gray-300 px-4 py-2">{employee.role}</td>
            <td className="border border-gray-300 px-4 py-2">{getBranchName(employee.branch_id)}</td>
            <td className="border border-gray-300 px-4 py-2">{formatDate(employee.created_at)}</td>
            <td className="border border-gray-300 px-6 py-3 flex justify-center items-center space-x-2">
              <button
                className="cursor-pointer text-red-500 text-2xl hover:text-red-600 transition-all duration-200 ease-in-out"
                onClick={() => {
                  setemployeeid(employee.employee_id);
                  setRoleToUpdate(employee.role);
                  setShowRoleModal(true);
                }}
              >
                <HiOutlineUser className="text-xl" />
              </button>
              <button
                className="cursor-pointer text-red-500 text-xl hover:text-red-600 transition-all duration-200 ease-in-out"
                onClick={() => {
                  setemployeeid(employee.employeeid);
                  setShowModal(true);
                }}
              >
                <HiOutlinePencil className="text-xl" />
              </button>
              <button
                className="cursor-pointer text-red-500 text-xl hover:text-red-600 transition-all duration-200 ease-in-out"
              >
                <HiOutlineTrash className="text-xl" />
              </button>
            </td>
          </tr>
          );
        })}
        </tbody>
      </table>
      
      {/* Pagination Controls */}
      <div className="flex justify-center mt-4 space-x-4">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
        >
          Previous
        </button>
        <div className="flex items-center text-gray-500">
          Page {currentPage} of {totalPages}
        </div>
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
        >
          Next
        </button>
      </div>

      {/* Update Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-gray-900/50 flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-8 rounded-md shadow-md w-96 space-y-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <h2 className="text-xl font-bold mb-4 text-gray-600">Update Profile</h2>
              <input
                type="text"
                value={currentEmployee.name}
                onChange={(e) => setCurrentEmployee({ ...currentEmployee, name: e.target.value })}
                placeholder="Name"
                className="text-gray-600 border bg-white border-gray-300 px-6 w-full py-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <input
                type="email"
                value={currentEmployee.email}
                onChange={(e) => setCurrentEmployee({ ...currentEmployee, email: e.target.value })}
                placeholder="Email"
                className="text-gray-600 border bg-white border-gray-300 px-6 w-full py-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <input
                type="password"
                value={currentEmployee.newPassword}
                onChange={(e) => setCurrentEmployee({ ...currentEmployee, newPassword: e.target.value })}
                placeholder="New Password (optional)"
                className="text-gray-600 border bg-white border-gray-300 px-6 w-full py-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex justify-end space-x-4">
                <button
                  className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
                >
                  Update
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setCurrentEmployee({ name: "", email: "", newPassword: "" }); // รีเซ็ตข้อมูล
                  }}
                  className="btn border-gray-600 bg-white text-gray-600 rounded-lg hover:bg-gray-600 hover:text-white hover:border-gray-600"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Add Employee Modal */}
        {showAddModal && (
          <motion.div
            className="fixed inset-0 bg-gray-900/50 flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-8 rounded-md shadow-md w-96 space-y-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
           
              <h2 className="text-2xl font-semibold text-gray-700 text-center mb-6">Add Employee</h2>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  placeholder="Name"
                  className="text-gray-600 border bg-white border-gray-300 px-6 w-full py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                />
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  placeholder="Email"
                  className="text-gray-600 border bg-white border-gray-300 px-6 w-full py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                />
                <input
                  type="password"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  placeholder="Password"
                  className="text-gray-600 border bg-white border-gray-300 px-6 w-full py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                />
                <select
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                  className="select bg-white text-gray-600 border border-gray-300 w-full py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                >
                  <option value="" disabled>
                    Select Role
                  </option>
                  <option value="Manager">Manager</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Audit">Audit</option>
                </select>
                  <select
                    value={newEmployee.branch_id}
                    onChange={(e) => setNewEmployee({ ...newEmployee, branch_id: e.target.value })}
                    className="select bg-white text-gray-600 border border-gray-300 w-full py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.b_name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={getBranchName(userBranchId)}
                    readOnly
                    className="w-full px-6 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-600"
                  />
          
                <div className="flex space-x-4 justify-end">
                  <button
                    className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="btn border-gray-600 bg-white text-gray-600 rounded-lg hover:bg-gray-600 hover:text-white hover:border-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>   
        )} 
      </AnimatePresence>
      
      <AnimatePresence>
        {/* Role Update Modal */}
        {showRoleModal && (
           <motion.div
           className="fixed inset-0 bg-gray-900/50 flex justify-center items-center z-50"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={() => setShowAddModal(false)} // ปิด modal เมื่อคลิกที่พื้นหลัง
         >
           <motion.div
             className="bg-white p-8 rounded-md shadow-md w-96 space-y-4"
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0.9, opacity: 0 }}
             transition={{ duration: 0.3, ease: "easeOut" }}
             onClick={(e) => e.stopPropagation()} // ป้องกันการปิด modal เมื่อคลิกด้านใน
           >
              <h2 className="text-xl font-bold mb-4 text-gray-600">Update Role</h2>
              <select
                value={roleToUpdate}
                onChange={(e) => setRoleToUpdate(e.target.value)}
                className="select bg-white text-gray-600 select-bordered border border-gray-300 w-full max-w-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="" disabled>Select Role</option>
                <option value="Manager">Manager</option>
                <option value="Cashier">Cashier</option>
                <option value="Audit">Audit</option>
              </select>
              <div className="flex justify-end space-x-4">
                <button
                  className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
                >
                  Update
                </button>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="btn border-gray-600 bg-white text-gray-600 rounded-lg hover:bg-gray-600 hover:text-white hover:border-gray-600"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagementPage;
