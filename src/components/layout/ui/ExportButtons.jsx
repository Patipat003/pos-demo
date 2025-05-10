import React from "react";
import { CSVLink } from "react-csv";

const ExportButtons = ({ filteredTables, columns, filename = "file.pdf" }) => {
  if (!Array.isArray(filteredTables) || !Array.isArray(columns)) {
    console.error("Invalid data or columns passed to ExportButtons");
    return <div>Invalid data or columns</div>;
  }

  return (
    <div className="flex items-center space-x-4 mb-4">
      <CSVLink
        data={filteredTables}
        filename={filename.replace(".pdf", ".csv")} // Dynamically set the CSV filename
        className="btn border-red-600 bg-white text-red-600 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 mt-4"
      >
        Export to CSV
      </CSVLink>
    </div>
  );
};

export default ExportButtons;
