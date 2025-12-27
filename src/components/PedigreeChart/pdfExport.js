import { baseUrlApi } from "@/redux/baseUrl/baseUrlApi";
import jsPDF from "jspdf";
import { useCallback } from "react";
import { getCode } from "country-list";

// Helper function to load image as base64 with compression and transparent background
const loadImageAsBase64 = async (url, isCircular = false) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = Math.min(img.width, img.height);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      if (isCircular) {
        // Create circular clipping path
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
      }

      // Draw image (centered if dimensions differ)
      const offsetX = (size - img.width) / 2;
      const offsetY = (size - img.height) / 2;
      ctx.drawImage(img, offsetX, offsetY, img.width, img.height);

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      console.error("Failed to load image:", url);
      resolve(null);
    };
    img.src = url;
  });
};

// Main PDF export function
export const exportPedigreeToPDF = async (
  nodes,
  edges,
  pedigreeData,
  profileData,
  generations = null
) => {
  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true, // Enable PDF compression
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;

    // Load images with compression
    let logoImage = null;
    let letterBImage = null;
    let letterPImage = null;
    let goldCupImage = null;
    let goldTrophyImage = null;
    let cockImage = null;
    let henImage = null;
    let unspecifiedImage = null;

    // Cache for flag images to avoid reloading same flags
    const flagCache = {};

    try {
      // Helper to get full image URL
      const getImageUrl = (path) => {
        if (path?.startsWith("http://") || path?.startsWith("https://")) {
          return path;
        } else {
          const baseUrl = baseUrlApi;
          return `${baseUrl}/${path?.replace(/^\/+/, "")}`; // Remove leading slashes
        }
      };

      // Load logo from profileData if available, otherwise use default
      const profilePath = profileData?.profile || "/assests/logo.png";
      const logoUrl = getImageUrl(profilePath);
      logoImage = await loadImageAsBase64(logoUrl, true, 80); // circular with max 80px

      // Load small icons with reduced size (30px max)
      letterBImage = await loadImageAsBase64(
        "/assests/Letter-B.png",
        false,
        30
      );
      letterPImage = await loadImageAsBase64(
        "/assests/Letter-P.png",
        false,
        30
      );
      goldCupImage = await loadImageAsBase64(
        "/assests/Gold-tropy.png",
        false,
        30
      );
      cockImage = await loadImageAsBase64("/assests/cock.png", false, 30);
      goldTrophyImage = await loadImageAsBase64(
        "/assests/Gold-tropy.png",
        false,
        30
      );
      henImage = await loadImageAsBase64("/assests/hen.jpg", false, 30);
      unspecifiedImage = await loadImageAsBase64(
        "/assests/unspefied.png",
        false,
        30
      );
    } catch (error) {
      console.error("Error loading images:", error);
    }

    // Filter nodes by generation if specified
    let filteredNodes = nodes;
    if (generations !== null) {
      const maxGen = Math.max(0, generations - 1);
      filteredNodes = nodes.filter((n) => {
        const gen = n?.data?.generation ?? 0;
        return gen <= maxGen;
      });
    }

    // Helper: Convert hex to RGB
    const hexToRgb = (hex) => {
      if (!hex || hex === "transparent") return { r: 255, g: 255, b: 255 };
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 255, g: 255, b: 255 };
    };

    // Helper: Load country flag with caching

    // Helper: Load country flag (accepts country name or 2-letter code)
    const loadCountryFlag = async (countryNameOrCode) => {
      try {
        if (!countryNameOrCode) return null;
        // Try to get ISO 3166-1 alpha-2 from country-list first
        let code = null;
        if (typeof countryNameOrCode === "string") {
          const trimmed = countryNameOrCode.trim();
          if (trimmed.length === 2) {
            code = trimmed;
          } else {
            code = getCode(trimmed) || null;
          }
        }

        // Fallback: use first 2 characters if code not found
        if (!code && typeof countryNameOrCode === "string") {
          code = countryNameOrCode.substring(0, 2);
        }

        if (!code) return null;

        const flagUrl = `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;
        return await loadImageAsBase64(flagUrl);
      } catch (error) {
        console.error("Error loading flag:", error);
        return null;
      }
    };

    // Helper: Draw connection line from subject to parents
    const drawConnectionFromSubject = (
      subjectX,
      subjectY,
      targetX,
      targetY,
      isTop,
      lineWidth = 0.3
    ) => {
      pdf.setDrawColor(55, 183, 195);
      pdf.setLineWidth(lineWidth);

      const startX = subjectX;
      const startY = isTop ? subjectY : subjectY;
      const midX = (startX + targetX) / 2;

      pdf.line(startX, startY, midX, startY);
      pdf.line(midX, startY, midX, targetY);
      pdf.line(midX, targetY, targetX, targetY);
    };

    // Helper: Draw simple smooth step connection line
    const drawSimpleConnection = (x1, y1, x2, y2, lineWidth = 0.1) => {
      pdf.setDrawColor(55, 183, 195);
      pdf.setLineWidth(lineWidth);

      const midX = (x1 + x2) / 2;

      pdf.line(x1, y1, midX, y1);
      pdf.line(midX, y1, midX, y2);
      pdf.line(midX, y2, x2, y2);
    };

    // Helper: Add text with word wrap
    const addWrappedText = (text, x, y, maxWidth, lineHeight, maxLines) => {
      // Normalize text first - remove multiple spaces
      const normalizedText = String(text).replace(/ {1,}/g, ' ').trim();
      
      const lines = pdf.splitTextToSize(normalizedText, maxWidth);
      const limitedLines = lines.slice(0, maxLines);
      
      limitedLines.forEach((line, index) => {
        pdf.text(line, x, y + (index * lineHeight));
      });
      
      return y + (limitedLines.length * lineHeight);
    };

    // Collect borders to draw at the end
    const bordersToDraw = [];

    // Helper: Draw pigeon card
    const drawPigeonCard = async (node, x, y, width, height) => {
      const data = node.data;

      // Set background color
      const bgColor = data.isEmpty ? "#FFFFFF" : data.color || "#FFFFFF";
      const rgb = hexToRgb(bgColor);
      pdf.setFillColor(rgb.r, rgb.g, rgb.b);
      pdf.rect(x, y, width, height, "F");

      // Defer drawing borders
      bordersToDraw.push({ x, y, width, height });

      let currentY = y + 4;
      const leftMargin = x + 2;
      const contentWidth = width - 4;

      // === HEADER ROW ===
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);

      let headerX = leftMargin;

      // Country flag image

      // Country flag image (use country name or code, loadCountryFlag will resolve to ISO code)
      if (data.country) {
        try {
          const flagImage = await loadCountryFlag(data.country);
          if (flagImage) {
            pdf.addImage(flagImage, "PNG", headerX, currentY - 2.5, 3.5, 2.5);
            headerX += 4.5;
          }
        } catch (error) {
          console.error("Flag load error:", error);
        }
      }

      // Birth year
      if (data.birthYear) {
        const yearText = String(data.birthYear).slice(-2);
        pdf.text(yearText, headerX, currentY);
        headerX += pdf.getTextWidth(yearText) + 1;
      }

      // Ring number (RED)
      if (data.ringNumber) {
        pdf.setTextColor(195, 55, 57);
        pdf.setFont("helvetica");
        pdf.text(String(data.ringNumber), headerX, currentY);
      }

      // Right side icons
      const iconWidth = 3;
      const iconSpacing = 0.5;
      let totalRightWidth = 0;

      const hasGender =
        data.gender &&
        (data.gender === "Cock" ||
          data.gender === "Hen" ||
          data.gender === "Unspecified");
      const hasVerified = data.verified && letterPImage;
      const hasIconic = data.iconic && goldCupImage;

      if (hasGender) totalRightWidth += iconWidth + iconSpacing;
      if (hasVerified) totalRightWidth += iconWidth + iconSpacing;
      if (hasIconic) totalRightWidth += iconWidth + iconSpacing;

      let rightX = x + width - 2 - totalRightWidth;

      // Gender symbols
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      if (data.gender === "Cock") {
        pdf.addImage(cockImage, "PNG", rightX, currentY - 2.5, 2.5, 2.5);
        rightX += iconWidth + iconSpacing;
      } else if (data.gender === "Hen") {
        pdf.addImage(henImage, "PNG", rightX, currentY - 2.2, 2.7, 2.4);
        rightX += iconWidth + iconSpacing;
      } else if (data.gender === "Unspecified") {
        pdf.addImage(unspecifiedImage, "PNG", rightX, currentY - 2.5, 2.5, 2.5);
        rightX += iconWidth + iconSpacing;
      }

      // Verified P
      if (data.verified && letterPImage) {
        pdf.addImage(letterPImage, "PNG", rightX, currentY - 2.5, 3, 3);
        rightX += iconWidth + iconSpacing;
      }

      // Iconic trophy
      if (data.iconic && goldCupImage) {
        rightX += 0.8;
        pdf.addImage(goldCupImage, "PNG", rightX, currentY - 2.5, 3, 3);
      }

      currentY += 5;

      // === NAME ===
      if (data.name) {
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);
        const nameLines = Math.min(2, Math.ceil(height / 30));
        currentY = addWrappedText(
          data.name,
          leftMargin,
          currentY,
          contentWidth,
          3,
          nameLines
        );
        currentY += 1;
      }

      // === OWNER ===
      if (data.owner) {
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(0, 0, 0);
        const ownerText = String(data.owner);

        // Split into lines that fit the content width so the owner name doesn't overflow
        const ownerLines = pdf.splitTextToSize(ownerText, contentWidth);
        const firstLine = ownerLines.length > 0 ? ownerLines[0] : "";

        // Draw first line
        pdf.text(firstLine, leftMargin, currentY);

        // Breeder verified badge: try to render inline after the first line if there's space,
        // otherwise render on the next line at the left margin.
        if (data.breederVerified && letterBImage) {
          const firstLineWidth = pdf.getTextWidth(firstLine);
          const badgeWidth = 3; // px/mm set above when adding image
          const gap = 1;
          if (firstLineWidth + gap + badgeWidth < contentWidth) {
            // place inline
            pdf.addImage(
              letterBImage,
              "PNG",
              leftMargin + firstLineWidth + gap,
              currentY - 2.5,
              badgeWidth,
              badgeWidth
            );
          } else {
            // place on the next line
            pdf.addImage(
              letterBImage,
              "PNG",
              leftMargin,
              currentY + 3 - 2.5,
              badgeWidth,
              badgeWidth
            );
          }
        }

        // Draw any remaining wrapped lines beneath the first
        for (let i = 1; i < ownerLines.length; i++) {
          currentY += 3; // line height similar to addWrappedText
          pdf.text(ownerLines[i], leftMargin, currentY);
        }

        // Advance currentY to leave a small gap after owner block
        currentY += 3;
      }

      // === COLOR NAME ===
      if (data.colorName && currentY < y + height - 10) {
        pdf.setFontSize(6);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0, 0, 0);
        currentY = addWrappedText(
          data.colorName,
          leftMargin,
          currentY,
          contentWidth,
          3,
          1
        );
        currentY += 0;
      }

     // Calculate available space for description and achievements
const availableSpace = y + height - currentY - 3;
const hasDescription =
  data.description && data.description.trim().length > 0;
const hasAchievements =
  data.achievements && data.achievements.trim().length > 0;

// === DESCRIPTION ===
if (hasDescription && availableSpace > 10) {
  pdf.setFontSize(6);
  pdf.setFont("helvetica", "italic");
  pdf.setTextColor(0, 0, 0);

  // If no achievements, use more space for description
  const descriptionSpace = hasAchievements
    ? availableSpace * 0.5
    : availableSpace - 5;
  const maxDescLines = Math.floor(descriptionSpace / 3);

  if (maxDescLines > 0) {
    // Replace multiple consecutive spaces with single space, but keep newlines
    const normalizedDescription = String(data.description)
      .replace(/[ \t]+/g, ' ')  // Replace multiple spaces/tabs with single space
      .trim();
    
    currentY = addWrappedText(
      normalizedDescription,
      leftMargin,
      currentY,
      contentWidth,
      3,
      maxDescLines
    );
    currentY += 0;
  }
}

// === ACHIEVEMENTS ===
if (hasAchievements) {
  const remainingSpace = y + height - currentY - 2;

  if (remainingSpace > 5) {
    pdf.setFontSize(5.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);

    const maxAchvLines = Math.floor(remainingSpace / 2.5);
    if (maxAchvLines > 0) {
      // Replace multiple consecutive spaces with single space, but keep newlines
      const normalizedAchievements = String(data.achievements)
        .replace(/[ \t]+/g, ' ')  // Replace multiple spaces/tabs with single space
        .trim();
      
      currentY = addWrappedText(
        normalizedAchievements,
        leftMargin,
        currentY,
        contentWidth,
        2.5,
        maxAchvLines
      );
    }
  }
}
}

    // === LOGO ===
    if (logoImage) {
      pdf.addImage(logoImage, "PNG", margin, margin - 2, 16, 16);
    }

    // === CARD DIMENSIONS ===
    const cardSpacing = generations === 4 ? 7 : generations === 5 ? 5 : 4;
    const cardWidth = generations === 4 ? 40 : 35;

    const gen0 = { w: cardWidth, h: 90 };
    const gen1 = { w: cardWidth, h: 88 };

    const gen2Gap = 3;
    const gen2 = { w: cardWidth, h: 68.25 - (gen2Gap * 3) / 4 };

    const gen3Gap = 3;
    const gen3 = { w: cardWidth, h: 34.125 - (gen3Gap * 7) / 8 };

    const gen4Gap = 2;
    const gen4 = { w: cardWidth, h: 17.0625 - (gen4Gap * 15) / 16 };

    const gen1Gap = 97;

    // Starting positions
    const totalGen1Height = gen1.h * 2 + gen1Gap;
    const startY = (pageHeight - totalGen1Height) / 2;
    const startX = margin + 5;

    const gen0Nodes = filteredNodes.filter((n) => n.data.generation === 0);
    const gen0Y = startY + (totalGen1Height - gen0.h) / 2;

    const gen0Positions = [];
    if (gen0Nodes.length > 0) {
      const node = gen0Nodes[0];
      gen0Positions.push({
        node,
        x: startX,
        y: gen0Y,
        w: gen0.w,
        h: gen0.h,
        centerX: startX + gen0.w / 2,
        centerY: gen0Y + gen0.h / 2,
      });
    }

    const gen0CenterX = startX + gen0.w / 2;

    // === GENERATION 1 (Parents) ===
    const gen1Nodes = filteredNodes
      .filter((n) => n.data.generation === 1)
      .sort((a, b) => {
        if (a.id.includes("father")) return -1;
        return 1;
      });

    const gen1X = startX + gen0.w - 15 + cardSpacing;
    const gen1Positions = [];

    // Draw connections first
    for (const [idx, node] of gen1Nodes.entries()) {
      const y = startY + idx * (gen1.h + gen1Gap);
      const nodeCenterY = y + gen1.h / 2;
      gen1Positions.push({
        node,
        x: gen1X,
        y,
        w: gen1.w,
        h: gen1.h,
        centerY: nodeCenterY,
      });

      if (idx === 0) {
        const subjectTopY = gen0Y;
        drawConnectionFromSubject(
          gen0CenterX,
          subjectTopY,
          gen1X,
          nodeCenterY,
          true,
          0.3
        );
      } else {
        const subjectBottomY = gen0Y + gen0.h;
        drawConnectionFromSubject(
          gen0CenterX,
          subjectBottomY,
          gen1X,
          nodeCenterY,
          false,
          0.3
        );
      }
    }

    // Draw cards
    for (const pos of gen0Positions) {
      await drawPigeonCard(pos.node, pos.x, pos.y, pos.w, pos.h);
    }

    for (const pos of gen1Positions) {
      await drawPigeonCard(pos.node, pos.x, pos.y, pos.w, pos.h);
    }

    // === GENERATION 2 ===
    if (generations === null || generations > 2) {
      const gen2Nodes = filteredNodes.filter((n) => n.data.generation === 2);
      const gen2X = gen1X + gen1.w + cardSpacing;
      const gen2Positions = [];

      for (const [idx, node] of gen2Nodes.entries()) {
        const parentIdx = Math.floor(idx / 2);
        const isSecondChild = idx % 2 === 1;

        if (gen1Positions[parentIdx]) {
          const baseY = startY;
          const cardIndex = parentIdx * 2 + (isSecondChild ? 1 : 0);
          const y = baseY + cardIndex * (gen2.h + gen2Gap);

          gen2Positions.push({
            node,
            x: gen2X,
            y,
            w: gen2.w,
            h: gen2.h,
            centerY: y + gen2.h / 2,
          });

          const nodeCenterY = y + gen2.h / 2;
          drawSimpleConnection(
            gen1X + gen1.w,
            gen1Positions[parentIdx].centerY,
            gen2X,
            nodeCenterY,
            0.3
          );
        }
      }

      for (const pos of gen2Positions) {
        await drawPigeonCard(pos.node, pos.x, pos.y, pos.w, pos.h);
      }

      // === GENERATION 3 ===
      if (generations === null || generations > 3) {
        const gen3Nodes = filteredNodes.filter((n) => n.data.generation === 3);
        const gen3X = gen2X + gen2.w + cardSpacing;
        const gen3Positions = [];

        for (const [idx, node] of gen3Nodes.entries()) {
          const gen2ParentIdx = Math.floor(idx / 2);
          const isSecondChild = idx % 2 === 1;

          if (gen2Positions[gen2ParentIdx]) {
            const baseY = startY;
            const cardIndex = gen2ParentIdx * 2 + (isSecondChild ? 1 : 0);
            const y = baseY + cardIndex * (gen3.h + gen3Gap);

            gen3Positions.push({
              node,
              x: gen3X,
              y,
              w: gen3.w,
              h: gen3.h,
              centerY: y + gen3.h / 2,
            });

            const nodeCenterY = y + gen3.h / 2;
            drawSimpleConnection(
              gen2X + gen2.w,
              gen2Positions[gen2ParentIdx].centerY,
              gen3X,
              nodeCenterY,
              0.3
            );
          }
        }

        for (const pos of gen3Positions) {
          await drawPigeonCard(pos.node, pos.x, pos.y, pos.w, pos.h);
        }

        // === GENERATION 4 ===
        if (generations === null || generations > 4) {
          const gen4Nodes = filteredNodes.filter(
            (n) => n.data.generation === 4
          );
          const gen4X = gen3X + gen3.w + cardSpacing;

          for (const [idx, node] of gen4Nodes.entries()) {
            const gen3ParentIdx = Math.floor(idx / 2);
            const isSecondChild = idx % 2 === 1;

            if (gen3Positions[gen3ParentIdx]) {
              const baseY = startY;
              const cardIndex = gen3ParentIdx * 2 + (isSecondChild ? 1 : 0);
              const y = baseY + cardIndex * (gen4.h + gen4Gap);

              const pos = {
                node,
                x: gen4X,
                y,
                w: gen4.w,
                h: gen4.h,
                centerY: y + gen4.h / 2,
              };

              drawSimpleConnection(
                gen3X + gen3.w,
                gen3Positions[gen3ParentIdx].centerY,
                gen4X,
                pos.centerY,
                0.3
              );

              await drawPigeonCard(pos.node, pos.x, pos.y, pos.w, pos.h);
            }
          }
        }
      }
    }

    // === FOOTER: Breeder Info ===
    const footerY = pageHeight - margin - 10;
    pdf.setFontSize(5.8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);

    if (profileData?.name) {
      pdf.text(profileData.name, margin, footerY);
    }

    pdf.setFont("helvetica", "normal");
    let footerTextY = footerY + 3.5;

    if (profileData?.contact) {
      pdf.text(`${profileData.contact}`, margin, footerTextY);
      footerTextY += 3.5;
    }
    if (profileData?.email) {
      pdf.text(`${profileData.email}`, margin, footerTextY);
    }

    // === BOTTOM CENTER ===
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");

    const text1 = "Generated by ";
    const text2 = "ThePigeonHub.Com";
    const marginY = pageHeight - margin + 9;

    const text1Width = pdf.getTextWidth(text1);
    const totalWidth = pdf.getTextWidth(text1 + text2);
    const startZ = (pageWidth - totalWidth) / 2;

    pdf.setTextColor(55, 183, 195);
    pdf.text(text1, startZ, marginY);

    pdf.setTextColor(0, 0, 0);
    pdf.text(text2, startZ + text1Width, marginY);

    // === DRAW CARD BORDERS LAST ===
    try {
      for (const b of bordersToDraw) {
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.2);
        pdf.line(b.x, b.y, b.x + b.width, b.y);
        pdf.line(b.x, b.y, b.x, b.y + b.height);

        pdf.setLineWidth(1.2);
        pdf.line(b.x + b.width, b.y, b.x + b.width, b.y + b.height);
        pdf.line(b.x, b.y + b.height, b.x + b.width, b.y + b.height);
      }
    } catch (err) {
      console.error("Error drawing borders:", err);
    }

    // === SAVE PDF ===
    // const currentDate = new Date().toISOString().split("T")[0];
    // const genText = generations ? `${generations}gen-` : "";
    // const filename = `pigeon-pedigree-${genText}${currentDate}.pdf`;

    // Build filename from gen0 pigeon data: countryCode-ringNumber-birthYear-name
    let filename = "pigeon-pedigree.pdf";

    const gen0Node = filteredNodes.find((n) => n.data.generation === 0);
    if (gen0Node && gen0Node.data) {
      const pigeonData = gen0Node.data;

      // Get country code (2-letter ISO code)
      let countryCode = "";
      if (pigeonData.country) {
        const trimmed = pigeonData.country.trim();
        if (trimmed.length === 2) {
          countryCode = trimmed.toUpperCase();
        } else {
          const code = getCode(trimmed);
          countryCode = code
            ? code.toUpperCase()
            : trimmed.substring(0, 2).toUpperCase();
        }
      }

      const ringNumber = pigeonData.ringNumber || "";
      const birthYear = pigeonData.birthYear || "";
      const name = pigeonData.name
        ? pigeonData.name.replace(/[^a-zA-Z0-9]/g, "-")
        : "";

      // Build filename parts
      const parts = [countryCode, ringNumber, birthYear, name].filter(Boolean);

      if (parts.length > 0) {
        filename = `${parts.join("-")}.pdf`;
      }
    }

    pdf.save(filename);

    return filename;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

// Component to use in your app
const PedigreeExportButton = ({
  nodes,
  edges,
  pedigreeData,
  profileData,
  generations = null,
  buttonText = "Export to PDF",
}) => {
  const handleExport = useCallback(async () => {
    try {
      await exportPedigreeToPDF(
        nodes,
        edges,
        pedigreeData,
        profileData,
        generations
      );
    } catch (error) {
      alert("Error exporting PDF. Please try again.");
    }
  }, [nodes, edges, pedigreeData, profileData, generations]);

  return (
    <button
      onClick={handleExport}
      className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      {buttonText}
    </button>
  );
};

export default PedigreeExportButton;
