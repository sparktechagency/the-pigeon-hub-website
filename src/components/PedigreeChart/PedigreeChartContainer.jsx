"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Calendar,
  Crown,
  Award,
  Info,
  Download,
  DownloadCloud,
} from "lucide-react";
import { useGetPigeonPedigreeChartDataQuery } from "@/redux/featured/pigeon/pigeonApi";
import { convertBackendToExistingFormat } from "./PigeonData";
import { useParams } from "next/navigation";
import Spinner from "@/app/(commonLayout)/Spinner";
import { getCode } from "country-list";
import { WinnerPedigree } from "../share/svg/howItWorkSvg";
import Image from "next/image";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useMyProfileQuery } from "@/redux/featured/auth/authApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { exportPedigreeToPDF } from "./pdfExport";
import { getImageUrl } from "../share/imageUrl";

const PigeonNode = ({ data }) => {
  const countryCode = data.country ? getCode(data.country) : null;

  // Check if this is the subject node (generation 0)
  const isSubject = data.generation === 0;

  // const getGenderIcon = (gender) => {
  //   if (gender === "Cock") return "♂";
  //   if (gender === "Hen") return "♀";
  //   if (gender === "Unspecified") return "⛔";
  //   return "⛔";
  // };

  const getGenderIcon = (gender) => {
    switch (gender) {
      case "Cock":
        return "/assests/cock.png";
      case "Hen":
        return "/assests/hen.jpg";
      case "Unspecified":
        return "/assests/unspefied.png";
      default:
        return "/assests/unspefied.png";
    }
  };

  const getGenerationColor = (generation) => {
    switch (generation) {
      case 0:
        return "border-black";
      case 1:
        return "border-black";
      case 2:
        return "border-black";
      case 3:
        return "border-black";
      case 4:
        return "border-black";
      default:
        return "border-black";
    }
  };

  const getCardSize = (generation) => {
    switch (generation) {
      case 0:
        return "w-[270px] h-[680px]";
      case 1:
        return "w-[270px] h-[680px]";
      case 2:
        return "w-[270px] h-[508px]";
      case 3:
        return "w-[270px] h-[246px]";
      case 4:
        return "w-[270px] h-[114px]";
      default:
        return "w-[270px] h-[100px]";
    }
  };

  const getTextLimits = (generation) => {
    switch (generation) {
      case 0:
        return {
          description: "line-clamp-[20]",
          achievements: "line-clamp-[15]",
        };
      case 1:
        return {
          description: "line-clamp-[20]",
          achievements: "line-clamp-[15]",
        };
      case 2:
        return {
          description: "line-clamp-[12]",
          achievements: "line-clamp-[10]",
        };
      case 3:
        return { description: "line-clamp-4", achievements: "line-clamp-3" };
      case 4:
        return { description: "line-clamp-1", achievements: "line-clamp-1" };
      default:
        return { description: "line-clamp-1", achievements: "line-clamp-1" };
    }
  };

  const textLimits = getTextLimits(data.generation);

  return (
    <div
      style={{ backgroundColor: data.color }}
      className={`${getCardSize(data?.generation)} 
        border-b-8 border-r-10 border-black
        text-white rounded-none transition-all duration-300 px-2 py-2
        ${getGenerationColor(data?.generation)} border overflow-hidden`}
    >
      {/* Conditional Handles based on generation */}
      {isSubject ? (
        // Subject node (Gen 0): Top and Bottom handles only
        <>
          <Handle
            type="source"
            position={Position.Top}
            id="top"
            className="w-3 h-3 !bg-slate-400"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="bottom"
            className="w-3 h-3 !bg-slate-400"
          />
        </>
      ) : (
        // All other nodes: Left (target) and Right (source) handles
        <>
          <Handle
            type="target"
            position={Position.Left}
            className="w-3 h-3 !bg-slate-400"
          />
          <Handle
            type="source"
            position={Position.Right}
            className="w-3 h-3 !bg-slate-400"
          />
        </>
      )}

      <div className="flex items-center justify-between">
        {/* Left Side - Country, Birth Year, Ring Number */}
        <div
          className="flex items-center justify-center gap-1"
          style={{ alignItems: "center" }}
        >
          {countryCode && (
            <div
              className="flex items-center gap-1"
              style={{ alignItems: "center", height: "24px" }}
            >
              <img
                src={`https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`}
                alt={data.country}
                width="24"
                height="18"
                className="w-6 h-5 rounded-sm"
                style={{
                  width: "24px",
                  height: "18px",
                  verticalAlign: "middle",
                  display: "inline-block",
                }}
                crossOrigin="anonymous"
              />
              <p
                className="text-black"
                style={{
                  lineHeight: "24px",
                  margin: 0,
                  display: "inline-block",
                  verticalAlign: "middle",
                }}
              >
                {countryCode}
              </p>
            </div>
          )}

          {data.birthYear && (
            <span
              className="text-black"
              style={{
                lineHeight: "24px",
                display: "inline-block",
                verticalAlign: "middle",
              }}
            >
              {data.birthYear.toString().slice(-2)}
            </span>
          )}

          {data.ringNumber && (
            <span
              className=" text-[#C33739]"
              style={{
                lineHeight: "24px",
                display: "inline-block",
                verticalAlign: "middle",
              }}
            >
              {data.ringNumber}
            </span>
          )}
        </div>

        {/* Right Side - Gender, Verified, Iconic */}
        <div
          className="flex items-center justify-center gap-1"
          style={{ alignItems: "center", height: "24px" }}
        >
          {data.gender && (
            <img
              src={getGenderIcon(data.gender)}
              alt={data.gender}
              width="20"
              height="20"
              className="w-5 h-5"
              style={{
                width: "20px",
                height: "20px",
                verticalAlign: "middle",
                display: "inline-block",
              }}
            />
          )}

          {data.verified && (
            <img
              src="/assests/Letter-P.png"
              alt="Letter P"
              width="24"
              height="24"
              className="w-6 h-6"
              style={{
                width: "24px",
                height: "24px",
                verticalAlign: "middle",
                display: "inline-block",
              }}
            />
          )}

          {data?.iconic && (
            <img
              src="/assests/Gold-tropy.png"
              alt="Gold Cup"
              width="24"
              height="24"
              className="w-6 h-6"
              style={{
                width: "24px",
                height: "24px",
                verticalAlign: "middle",
                display: "inline-block",
              }}
            />
          )}
        </div>
      </div>

      <div className="overflow-hidden h-full flex flex-col">
        <div className="flex items-center justify-start gap-2 space-y-2">
          {data.name && (
            <h3 className="font-bold text-black truncate">{data.name}</h3>
          )}
        </div>
        <div className="flex items-center justify-start gap-2">
          {data.owner && (
            <div className="flex items-center gap-2 text-xl italic text-black">
              <span className="truncate">{data.owner}</span>
            </div>
          )}
          {data?.breederVerified && (
            <div className="flex items-center gap-2 text-xl italic text-black flex-shrink-0">
              <img
                src="/assests/Letter-B.png"
                alt="Letter B"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </div>
          )}
        </div>

        {data.colorName && (
          <div className="">
            <h2 className=" text-black">{data.colorName}</h2>
          </div>
        )}

        {data.description && (
          <div className="">
            <h2 className="text-black italic">
              {data?.description?.slice(0, 450)}
            </h2>
          </div>
        )}

        {data.achievements && (
          <div className="flex items-start gap-1">
            <h2
              className="text-black whitespace-pre-line break-words max-w-[250px] overflow-hidden"
              style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
            >
              {data.achievements}
            </h2>
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  pigeonNode: PigeonNode,
};

export default function PigeonPedigreeChart() {
  const { id } = useParams();
  const { data: profileData } = useMyProfileQuery();
  const role = profileData?.role;
  const { data: pedigreeData, isLoading } =
    useGetPigeonPedigreeChartDataQuery(id);
  const chartRef = useRef(null);

  const { nodes: dynamicNodes, edges: dynamicEdges } = useMemo(() => {
    return convertBackendToExistingFormat(pedigreeData, role);
  }, [pedigreeData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(dynamicNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(dynamicEdges);

  useEffect(() => {
    setNodes(dynamicNodes);
    setEdges(dynamicEdges);
  }, [dynamicNodes, dynamicEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Excel Export Function
  const exportToExcel = useCallback(() => {
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
      let filename = "pigeon-pedigree.xlsx";

      const gen0Node = nodes.find((n) => n.data.generation === 0);
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
        const parts = [countryCode, ringNumber, birthYear, name].filter(
          Boolean
        );

        if (parts.length > 0) {
          filename = `${parts.join("-")}.xlsx`;
        }
      }

      // Save file
      XLSX.writeFile(wb, filename);

      console.log("Excel export completed successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting to Excel. Please try again.");
    }
  }, [nodes]);

  // PDF Export Function
  const exportToPDF = useCallback(async () => {
    try {
      await exportPedigreeToPDF(nodes, edges, pedigreeData);
    } catch (error) {
      alert("Error exporting PDF. Please try again.");
    }
  }, [nodes, edges, pedigreeData]);

  const exportToPDFWithGenerations = useCallback(
    async (genCount) => {
      try {
        await exportPedigreeToPDF(
          nodes,
          edges,
          pedigreeData,
          profileData,
          genCount
        );
      } catch (error) {
        alert("Error exporting the selected generations. Please try again.");
      }
    },
    [nodes, edges, pedigreeData]
  );

  const defaultViewport = { x: 0, y: 0, zoom: 0.8 };

  if (isLoading) return <Spinner />;

  return (
    <div className="container  mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between mt-12 px-4 md:px-8 lg:px-12">
        <div className="max-w-2xl mb-6">
          <h2 className="text-black font-bold text-2xl lg:text-4xl mb-4">
            Pigeon pedigree
          </h2>
          {/* <p className="text-destructive">
            The Pedigree Chart displays your pigeon's lineage across multiple
            generations, showing key details like name, ring number, and
            birthdate. It helps you track breeding relationships and plan future
            pairings.
          </p> */}
        </div>

        <div className="flex gap-5">
          {/* Excel Export Button */}
          <Button
            onClick={exportToExcel}
            className="bg-primary text-white py-6 rounded-sm hover:text-white flex items-center gap-2"
          >
            <DownloadCloud className="h-4 w-4" />
            Export as Excel
          </Button>

          {/* PDF Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-primary text-white py-6 rounded-sm hover:text-white flex items-center gap-2">
                <DownloadCloud className="h-4 w-4" />
                Export as PDF
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => exportToPDFWithGenerations(4)}
                className="cursor-pointer"
              >
                Export as PDF (4Gen)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportToPDFWithGenerations(5)}
                className="cursor-pointer"
              >
                Export as PDF (5Gen)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative">
        <Image
          src={getImageUrl(profileData?.profile || "/assests/logo.png")}
          alt="The Pigeon Hub Logo"
          width={80}
          height={80}
          className="absolute h-20 w-20 top-15 2xl:top-20 left-30 2xl:left-50 rounded-full object-cover"
        />
      </div>
      <div
        ref={chartRef}
        className="w-full h-[1200px] xl:h-[1400px] 2xl:h-[1600px] bg-transparent flex justify-start items-center mt-0 rounded-3xl"
      >
        {/* --- ReactFlow (now dynamic) --- */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          defaultViewport={defaultViewport}
          fitView
          attributionPosition="bottom-right"
          className="bg-transparent h-full py-16"
          minZoom={0.5}
          maxZoom={1}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
        >
          {/* <Background variant="dots" gap={25} size={1.5} color="#FFFFFF" /> */}
        </ReactFlow>
      </div>
      <div className="relative">
        <div className="absolute bottom-40 2xl:bottom-40 left-8 2xl:left-30 text-black">
          <p className="text-accent-foreground font-bold">
            {profileData?.name.slice(0, 32)}
          </p>
          {profileData?.contact && (
            <p>
              <span className="text-accent-foreground font-bold text-[12px]">
                {profileData?.contact.slice(0, 16)}
              </span>
            </p>
          )}
          {profileData?.email && (
            <p>
              <span className="text-accent-foreground font-bold text-[12px]">
                {profileData?.email.slice(0, 32)}
              </span>
            </p>
          )}
        </div>
      </div>
      <div className="w-full flex justify-center">
        <h2 className="text-accent font-bold  mb-10">
          Generated by{" "}
          <span className="text-accent-foreground">ThePigeonHub.Com</span>
        </h2>
      </div>
    </div>
  );
}
