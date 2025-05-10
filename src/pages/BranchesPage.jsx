import { useEffect, useState } from "react";
import axios from "axios";
import { FiEdit, FiTrash, FiPlus, FiEye } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import moment from "moment";
import BranchViewModal from "../components/layout/ui/BranchViewModal";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import BranchMap from "../components/layout/ui/BranchMap";

const BranchesPage = () => {
  const [branches, setBranches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newBranch, setNewBranch] = useState({ 
    bname: "", 
    location: "", 
    googleLocation: ""  // ใช้ googleLocation เป็น string "lat,lng"
  });
  
  const [editData, setEditData] = useState({ 
    bname: "", 
    location: "", 
    googleLocation: "" 
  });
  
  const [editBranch, setEditBranch] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/branches.json`);
      setBranches(response.data || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const MapClickHandler = ({ setLocation }) => {
    useMapEvents({
      click(e) {
        if (!e?.latlng) return; // ป้องกันค่าที่ไม่มี
        const { lat, lng } = e.latlng;
        setLocation((prev) => ({
          ...prev,
          googleLocation: `${lat},${lng}`,
        }));
      },
    });
  
    return null;
  };

  const customIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const openEditModal = (branch) => {
    if (!branch) {
      console.error("Branch data is not available");
      return;
    }
  
    setEditBranch(branch);
    setEditData({ 
      bname: branch.b_name, 
      location: branch.location, 
      googleLocation: branch.google_location 
    });
    setIsEditModalOpen(true);
  };
  
  const openViewModal = (branch) => {
    if (!branch) {
      console.error("Branch data is not available");
      return;
    }
  
    setSelectedBranch(branch);
    setIsViewModalOpen(true);
  };

  useEffect(() => {
    if (isAddModalOpen || isEditModalOpen) {
      document.body.classList.add("overflow-hidden"); // ป้องกันการ scroll
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isAddModalOpen, isEditModalOpen]);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-6 min-h-screen">
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-red-600">Branch Management</h1>
        <button onClick={() => setIsAddModalOpen(true)} className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600">
          <FiPlus size={18} /> Add Branch
        </button>
      </div>

      
      {/* ✅ แสดงแผนที่ขนาดใหญ่ที่รวมทุกสาขา */}
      <div className="mb-6">
        <BranchMap branches={branches} onBranchClick={openViewModal} />
      </div>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="🔍 Search branch..."
        className="border bg-white border-gray-300 p-3 pr-10 mb-4 text-gray-600 rounded-md w-full min-w-[200px] focus:outline-none focus:ring-2 focus:ring-red-500"
      />

      {/* ✅ Branch Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {branches
          .filter((branch) => branch.b_name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((branch) => {
            const [lat, lng] = branch.google_location?.split(",").map(Number) || [13.736717, 100.523186];

            return (
              <div key={branch.branch_id} className="border p-4 rounded-lg shadow-lg bg-white">
                <p className="text-red-700 font-semibold">{branch.b_name}</p>
                <p className="text-gray-600">📍 Location: {branch.location}</p>
                <p className="text-sm text-gray-400">
                  📅 Created: {moment(branch.created_at).format("DD/MM/YYYY")}
                </p>

                {/* Minimap */}
                <div className="h-32 w-full rounded-md overflow-hidden mt-2">
                  <MapContainer 
                    center={[lat, lng]} 
                    zoom={13} 
                    className="h-full w-full"
                    scrollWheelZoom={false}
                    zoomControl={false}
                    style={{ zIndex: 0 }} // ✅ ตั้งค่า z-index ต่ำ
                  >
                     <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[lat, lng]} icon={customIcon} />
                  </MapContainer>
                </div>

                <div className="flex justify-end gap-2 mt-3">
                  <button onClick={() => openViewModal(branch)} className="text-green-500">
                    <FiEye size={20} />
                  </button>
                  <button onClick={() => openEditModal(branch)} className="text-blue-500">
                    <FiEdit size={20} />
                  </button>
                  <button className="text-red-500">
                    <FiTrash size={20} />
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {(isAddModalOpen || isEditModalOpen) && (
        <motion.div
          className="fixed inset-0 bg-gray-900/50 flex items-center justify-center"
          style={{ zIndex: 50 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white p-6 rounded-lg shadow-lg w-3/4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl text-gray-600 font-bold mb-4">
              {isAddModalOpen ? "Add New Branch" : "Edit Branch"}
            </h2>

            <input
              type="text"
              name="bname"
              value={isAddModalOpen ? newBranch.b_name : editData.b_name}
              onChange={(e) =>
                isAddModalOpen
                  ? setNewBranch({ ...newBranch, b_name: e.target.value })
                  : setEditData({ ...editData, b_name: e.target.value })
              }
              placeholder="Branch Name"
              className="border bg-white border-gray-300 p-3 mb-3 text-gray-600 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <input
              type="text"
              name="location"
              value={isAddModalOpen ? newBranch.location : editData.location}
              onChange={(e) =>
                isAddModalOpen
                  ? setNewBranch({ ...newBranch, location: e.target.value })
                  : setEditData({ ...editData, location: e.target.value })
              }
              placeholder="Branch Location (Address)"
              className="border bg-white border-gray-300 p-3 mb-3 text-gray-600 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            {/* Render the map only when modal is open */}
            {(isAddModalOpen || isEditModalOpen) && (
              <MapContainer
                center={[13.736717, 100.523186]}
                zoom={10}
                className="h-72 w-full"
                scrollWheelZoom={true}
              >
                
                <TileLayer url="http://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web_grau/default/WEBMERCATOR/{z}/{y}/{x}.png" />
                <MapClickHandler setLocation={isAddModalOpen ? setNewBranch : setEditData} />

                {((isAddModalOpen && newBranch.googleLocation) || (!isAddModalOpen && editData.googleLocation)) && (
                  <Marker
                    position={(isAddModalOpen ? newBranch.googleLocation : editData.googleLocation)
                      ?.split(",") // split lat,lng
                      .map(Number) // convert to numbers
                    }
                    icon={customIcon}
                  />
                )}
              </MapContainer>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="btn border-gray-600 bg-white text-gray-600 rounded-lg hover:bg-gray-600 hover:text-white hover:border-gray-600"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}


      {isViewModalOpen && selectedBranch && <BranchViewModal branch={selectedBranch} onClose={() => setIsViewModalOpen(false)} />}
    </div>
  );
};

export default BranchesPage;
