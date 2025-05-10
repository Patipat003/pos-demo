import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HiChevronDown,
  HiHome,
  HiShoppingCart,
  HiDocumentText,
  HiUser,
  HiOfficeBuilding,
  HiCube,
  HiMenu,
  HiX,
} from "react-icons/hi";
import { HiMiniSquare3Stack3D, HiMiniUserGroup  } from "react-icons/hi2";
import Header from "./ui/Header";

// SidebarDropdown Component
const SidebarDropdown = ({ label, children, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const isActive = children.some((child) => child.link === location.pathname);
    setIsOpen(isActive);
  }, [location.pathname, children]);

  return (
    <li className="my-2">
      <div
        className="flex justify-between items-center w-full p-3 bg-white hover:bg-gray-200 rounded-lg text-red-800 cursor-pointer text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          {icon && <span className="text-lg">{icon}</span>}
          <span>{label}</span>
        </div>
        <HiChevronDown
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          } text-lg`}
        />
      </div>
      <div
        className={`transition-all duration-200 overflow-hidden ${
          isOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <ul className="bg-white rounded-lg p-2 list-none ml-4">
          {children.map((child, index) => (
            <li key={index}>
              <Link
                to={child.link}
                className={`block w-full p-3 hover:bg-gray-200 text-red-800 rounded-lg text-sm ${
                  location.pathname === child.link ? "bg-gray-200" : ""
                }`}
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
};

// SidebarItem Component
const SidebarItem = ({ label, link, icon }) => {
  const location = useLocation();
  const isActive = location.pathname === link;

  return (
    <li className="my-2">
      <Link
        to={link}
        className={`block w-full p-3 rounded-lg text-sm ${
          isActive ? "bg-gray-200" : "bg-white"
        } hover:bg-gray-200 text-red-800`}
      >
        <div className="flex items-center space-x-2">
          {icon && <span className="text-lg">{icon}</span>}
          <span>{label}</span>
        </div>
      </Link>
    </li>
  );
};

// MainLayout Component
const MainLayout = ({ children }) => {

  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar visibility
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      

      {/* Fixed Header */}
      <div className="fixed top-0 left-0 w-full z-20">

        {/* Burger Icon */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="cursor-pointer fixed ml-4 z-20 text-red-600 mt-6"
        >
          {isSidebarOpen ? <HiX size={32} /> : <HiMenu size={32} />}
        </button>

        <Header />
      </div>

      <div className="flex flex-1 pt-6 bg-gray-200">
        {/* Sidebar */}
        <aside
          className={`fixed top-16 left-0 w-64 bg-white shadow-md h-full overflow-y-auto transition-transform duration-300 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="p-5 list-none">
            <SidebarItem label="Dashboard" link="/" icon={<HiHome />} />
          
              <SidebarDropdown label="Sales Management" icon={<HiShoppingCart />}>
                {[
                  { label: "Sales Product", link: "/sales" },
                  { label: "Sales History", link: "/sales-history" },
                  
                  // { label: "Payment", link: "/payment" },
                  // { label: "Receipts", link: "/receipts" },
                ].filter(Boolean)}
              </SidebarDropdown>

              <SidebarItem label="Product Management" link="/product" icon={<HiCube />} />

              <SidebarItem label="Inventory Management" link="/inventory" icon={<HiMiniSquare3Stack3D />} />

              <SidebarDropdown label="Reports" icon={<HiDocumentText />}>
                {[
                  { label: "Sales Reports", link: "/reports" },
                  { label: "Detail Report", link: "/detail-report" },
                  { label: "Employee Report", link: "/employee-reports" },              
                ]}
              </SidebarDropdown>

              <SidebarDropdown label="User Management" icon={<HiMiniUserGroup />}>
                {[
                  { label: "User Lists", link: "/user-management", icon: <HiUser /> },
                  { label: "Employee Transfer", link: "/employee-transfer" },
                ]}
              </SidebarDropdown>

              <SidebarItem label="Branches Management" link="/branches-management" icon={<HiOfficeBuilding />} />

          </nav>
        </aside>
      </div>

      {/* Main Content */}
      <main
        onClick={() => isSidebarOpen && setIsSidebarOpen(false)} 
        className={`flex-1 p-6 bg-gray-200 transition-all duration-300 ${
         isSidebarOpen ? "ml-64 pt-16" : "ml-0 pt-16"
        }`}
      >
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
