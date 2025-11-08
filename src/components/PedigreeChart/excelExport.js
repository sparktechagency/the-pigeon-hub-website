import * as XLSX from "xlsx";

export const exportToExcel = (nodes) => {
  try {
    // Prepare data for Excel
    const excelData = nodes.map((node, index) => ({
      "Serial No": index + 1,
      Name: node.data.name || "N/A",
      "Ring Number": node.data.ringNumber || "N/A",
      Gender: node.data.gender || "N/A",
      "Birth Year": node.data.birthYear || "N/A",
      Owner: node.data.owner || "N/A",
      Country: node.data.country || "N/A",
      Color: node.data.colorName || "N/A",
      Achievements: node.data.achievements || "N/A",
      Description: node.data.description || "N/A",
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 10 }, // Serial No
      { wch: 20 }, // Name
      { wch: 15 }, // Ring Number
      { wch: 10 }, // Gender
      { wch: 12 }, // Birth Year
      { wch: 20 }, // Owner
      { wch: 15 }, // Country
      { wch: 15 }, // Color
      { wch: 12 }, // Generation
      { wch: 30 }, // Achievements
      { wch: 40 }, // Description
    ];
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Pigeon Pedigree");

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `pigeon-pedigree-${currentDate}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);

    console.log("Excel export completed successfully");
    return filename;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    alert("Error exporting to Excel. Please try again.");
    return null;
  }
};