import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, LayersControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ตั้งค่าไอคอนหมุด
const customIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// คอมโพเนนต์ช่วยให้แผนที่เคลื่อนที่นุ่มนวล
const MapFlyTo = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { animate: true, duration: 1.5 });
  }, [center, map]);
  return null;
};

const BranchMap = ({ branches, onBranchClick }) => {
  const [mapCenter, setMapCenter] = useState([14.736717, 104.523186]);

  // อัปเดต Center ถ้ามีสาขา
  useEffect(() => {
    if (branches.length > 0) {
      const firstBranch = branches[0];
      if (firstBranch.google_location?.includes(",")) {
        const [lat, lng] = firstBranch.google_location.split(",").map(Number);
        setMapCenter([lat, lng]);
      }
    }
  }, [branches]);

  return (
    <MapContainer center={mapCenter} zoom={5} className="h-96 w-full rounded-lg shadow-lg" style={{ zIndex: 0 }} animate={true}>
      <MapFlyTo center={mapCenter} />

      {/* Layer Control */}
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="OpenStreetMap">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="TopPlus">
          <TileLayer url="http://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web_grau/default/WEBMERCATOR/{z}/{y}/{x}.png" />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Google Satellite">
          <TileLayer url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" subdomains={["mt0", "mt1", "mt2", "mt3"]} />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Red Planet">
          <TileLayer url="https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-1/all/{z}/{x}/{y}.png" />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Stadia">
          <TileLayer url="https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png" />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Moon">
          <TileLayer url="https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-moon-basemap-v0-1/all/{z}/{x}/{y}.png" />
        </LayersControl.BaseLayer>  
          
      </LayersControl>

      {/* Marker ของสาขา */}
      {branches?.map((branch) => {
        const [lat, lng] = branch.google_location?.includes(",")
          ? branch.google_location.split(",").map(Number)
          : [13.736717, 100.523186];

        return (
          <Marker 
            key={branch.branch_id} 
            position={[lat, lng]} 
            icon={customIcon} 
            zIndexOffset={1000}
            eventHandlers={{
              click: () => {
                setMapCenter([lat, lng]);
                onBranchClick(branch);
              }
            }}
          >
            {/* แสดง Tooltip เมื่อ hover */}
            <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
              <div className="text-center">
                <p className="font-bold">{branch.b_name}</p>
                <p className="text-gray-600">{branch.location}</p>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default BranchMap;
