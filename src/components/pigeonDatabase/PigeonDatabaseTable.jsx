import React, { useRef, useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Edit,
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Trash2,
  GitBranch,
  Plus,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import {
  useDeletePigeonMutation,
  usePigeonAddMyLoftOverviewMutation,
} from "@/redux/featured/pigeon/pigeonApi";
import { getImageUrl } from "../share/imageUrl";
import { getCode } from "country-list";
import { toast } from "sonner";
import Swal from "sweetalert2";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import SyncHorizontalScroll from "../share/Scrollbar";

const PigeonTable = ({
  data,
  isLoading,
  currentPage,
  onPageChange,
  onEdit,
}) => {
  const router = useRouter();
  const [deletePigeon] = useDeletePigeonMutation();
  const [pigeonAddMyLoftOverview] = usePigeonAddMyLoftOverviewMutation();

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null,
  });

  // Grab scroll functionality
  const tableContainerRef = useRef(null);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    if (!tableContainerRef.current) return;
    setIsGrabbing(true);
    setStartX(e.pageX - tableContainerRef.current.offsetLeft);
    setScrollLeft(tableContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isGrabbing || !tableContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    tableContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsGrabbing(false);
  };

  const handleMouseLeave = () => {
    setIsGrabbing(false);
  };

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    if (isGrabbing) {
      document.body.style.userSelect = "none";
    } else {
      document.body.style.userSelect = "";
    }

    return () => {
      document.body.style.userSelect = "";
    };
  }, [isGrabbing]);

  const pigeons = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  // Sorting function
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  // Sort pigeons
  const sortedPigeons = React.useMemo(() => {
    let sortedData = [...pigeons];
    if (sortConfig.key && sortConfig.direction) {
      sortedData.sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === "name") {
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
        } else if (sortConfig.key === "birthYear") {
          aValue = parseInt(a.birthYear) || 0;
          bValue = parseInt(b.birthYear) || 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortedData;
  }, [pigeons, sortConfig]);

  // Render sort icon
  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
    }
    if (sortConfig.direction === "asc") {
      return <ArrowUp className="h-4 w-4 ml-1 inline" />;
    }
    if (sortConfig.direction === "desc") {
      return <ArrowDown className="h-4 w-4 ml-1 inline" />;
    }
    return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (!pigeons.length) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <p className="text-gray-500 text-lg">No pigeons found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleDownload = async (fileUrl, fileName) => {
    if (!fileUrl) return;

    try {
      const fullUrl = getImageUrl(fileUrl);
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to download file. Please try again.",
        icon: "error",
        confirmButtonColor: "#37B7C3",
      });
    }
  };

  const getFileName = (url, prefix) => {
    if (!url) return "";
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    return `${prefix}_${filename}`;
  };

  const handleAddMyLoftOverview = async (pigeonId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to add this pigeon to My Loft Overview?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#37B7C3",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, add it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const payload = { pigeonId };
      await pigeonAddMyLoftOverview(payload).unwrap();

      Swal.fire({
        title: "Added!",
        text: "Pigeon added to My Loft Overview successfully!",
        icon: "success",
        confirmButtonColor: "#37B7C3",
      });
    } catch (error) {
      console.error("Error adding pigeon to My Loft Overview:", error);

      if (error?.status === 403) {
        Swal.fire({
          title: "Subscription Required",
          text: "Please subscribe first to access this feature.",
          icon: "warning",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      } else {
        Swal.fire({
          title: "Failed!",
          text:
            error?.data?.message || "Failed to add pigeon. Please try again.",
          icon: "error",
          confirmButtonColor: "#d33",
        });
      }
    }
  };

  const getRatingStars = (rating) => {
    const stars = Math.floor(rating / 20);
    return "★".repeat(stars) + "☆".repeat(5 - stars);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pagination?.totalPage) {
      onPageChange(currentPage + 1);
    }
  };

  const handleView = (pigeonId) => {
    router.push(`/pigeon-overview/${pigeonId}`);
  };

  const handlePedigree = (pigeonId) => {
    router.push(`/pedigree-chart/${pigeonId}`);
  };

  const handleDelete = async (pigeonId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this pigeon? This action cannot be undone."
      )
    ) {
      try {
        await deletePigeon(pigeonId).unwrap();
      } catch (error) {
        console.error("Failed to delete pigeon:", error);
        alert("Failed to delete pigeon. Please try again.");
      }
    }
  };

  // Pagination helper function
  const renderPageNumbers = () => {
    if (!pagination || pagination.totalPage <= 1) return null;

    const totalPages = pagination.totalPage;
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page
    if (startPage > 1) {
      pages.push(
        <Button
          key={1}
          onClick={() => onPageChange(1)}
          variant={currentPage === 1 ? "default" : "outline"}
          size="sm"
          className={`w-10 h-10 ${
            currentPage === 1
              ? "bg-accent text-white hover:bg-accent"
              : "hover:bg-gray-100"
          }`}
        >
          1
        </Button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="start-ellipsis" className="px-2 text-gray-500 ">
            ...
          </span>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          onClick={() => onPageChange(i)}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          className={`w-10 h-10 ${
            currentPage === i ? "bg-accent text-white" : "hover:bg-accent"
          }`}
        >
          {i}
        </Button>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className="px-2 text-gray-500">
            ...
          </span>
        );
      }
      pages.push(
        <Button
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          className={`w-10 h-10 ${
            currentPage === totalPages
              ? "bg-accent text-white hover:bg-accent/90"
              : "hover:bg-gray-100"
          }`}
        >
          {totalPages}
        </Button>
      );
    }

    return pages;
  };

  const showPagination = pagination && pagination.totalPage > 1;

  return (
    <div className="space-y-4">
      <div>
        <CardContent className="p-0">
          <div>
            <SyncHorizontalScroll
              containerClassName="overflow-x-auto border rounded-lg shadow-md bg-red-600 custom-scrollbar hide-scrollbar cursor-grab"
              watch={sortedPigeons.length}
            >
              <div
                style={{
                  minWidth: sortedPigeons.length > 0 ? "max-content" : "100%",
                }}
                className="bg-red-600 rounded-lg"
              >
                <style>
                  {`
                    div.overflow-x-auto::-webkit-scrollbar {
                      display: none !important;
                      width: 0 !important;
                      height: 0 !important;
                    }
                  `}
                </style>
                <Table>
                  <TableHeader className="bg-background py-6">
                    <TableRow className="bg-foreground py-5">
                      <TableHead className="text-white">Image</TableHead>
                      <TableHead
                        className="text-white cursor-pointer hover:bg-foreground/80 select-none"
                        onClick={() => handleSort("name")}
                      >
                        Name {renderSortIcon("name")}
                      </TableHead>
                      <TableHead className="text-white">Country</TableHead>
                      <TableHead className="text-white">Breeder</TableHead>
                      <TableHead className="text-white">Ring Number</TableHead>
                      <TableHead
                        className="text-white cursor-pointer hover:bg-foreground/80 select-none"
                        onClick={() => handleSort("birthYear")}
                      >
                        Birth Year {renderSortIcon("birthYear")}
                      </TableHead>
                      <TableHead className="text-white">
                        Breeder Rating
                      </TableHead>
                      <TableHead className="text-white">Racer Rating</TableHead>
                      <TableHead className="text-white">Verified</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Gender</TableHead>
                      <TableHead className="text-white">Iconic Score</TableHead>
                      <TableHead className="text-white">Color</TableHead>
                      <TableHead className="text-white">Location</TableHead>
                      <TableHead className="text-white w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPigeons.map((pigeon, index) => (
                      <TableRow
                        key={pigeon._id}
                        className="bg-background hover:bg-foreground text-white"
                      >
                        <TableCell>
                          <Avatar className="w-10 h-10">
                            <AvatarImage
                              src={
                                getImageUrl(
                                  pigeon.pigeonPhoto ||
                                    pigeon?.eyePhoto ||
                                    pigeon?.pedigreePhoto ||
                                    pigeon?.DNAPhoto ||
                                    pigeon?.ownershipPhoto
                                ) || "/placeholder-pigeon.jpg"
                              }
                              alt={pigeon.name}
                            />
                            <AvatarFallback className="bg-blue-100 text-[#3AB27F]">
                              {pigeon.name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>

                        <TableCell className="font-bold text-text-[#3AB27F]">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Plus
                                  className="inline-block font-black w-7 h-7 mr-2 text-accent cursor-pointer"
                                  onClick={() =>
                                    handleAddMyLoftOverview(pigeon._id)
                                  }
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Add to Your Loft</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {pigeon.name}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const countryCode = pigeon.country
                              ? getCode(pigeon.country)
                              : null;
                            return (
                              countryCode && (
                                <div className="flex items-center gap-2">
                                  <img
                                    src={`https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`}
                                    alt={pigeon.country}
                                    className="w-5 h-4 rounded-sm"
                                  />
                                  <p className="text-[#B0B6A4]">
                                    {countryCode}
                                  </p>
                                </div>
                              )
                            );
                          })()}
                        </TableCell>

                        <TableCell>
                          {pigeon?.breeder?.loftName || "N/A"}
                        </TableCell>

                        <TableCell className="font-mono text-sm">
                          {pigeon.ringNumber}
                        </TableCell>

                        <TableCell className="text-[#B0B6A4]">
                          {pigeon.birthYear}
                        </TableCell>
                        <TableCell className=" text-center">
                          {pigeon.breederRating}
                        </TableCell>

                        <TableCell className=" text-center">
                          {pigeon.racingRating || pigeon.racerRating || 0}
                        </TableCell>

                        <TableCell>
                          {pigeon.verified ? "Verified" : "False"}
                        </TableCell>

                        <TableCell className="text-[#3AB27F]">
                          {pigeon.status}
                        </TableCell>

                        <TableCell className="text-[#B0B6A4]">
                          {pigeon.gender}
                        </TableCell>

                        <TableCell>
                          <div className="text-yellow-500">
                            {pigeon.iconicScore}
                          </div>
                        </TableCell>

                        <TableCell>{pigeon.color}</TableCell>

                        <TableCell>
                          {pigeon.location && pigeon.location.length > 20
                            ? pigeon.location.slice(0, 20) + "..."
                            : pigeon.location}
                        </TableCell>

                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-accent"
                              >
                                <MoreHorizontal className="h-4 w-4 text-white font-bold " />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => handleView(pigeon._id)}
                                className="cursor-pointer"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handlePedigree(pigeon._id)}
                                className="cursor-pointer"
                              >
                                <GitBranch className="h-4 w-4 mr-2" />
                                View Pedigree
                              </DropdownMenuItem>

                              {pigeon.pigeonPhoto && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDownload(
                                      pigeon.pigeonPhoto,
                                      getFileName(
                                        pigeon.pigeonPhoto,
                                        "pigeon_photo"
                                      )
                                    )
                                  }
                                  className="cursor-pointer"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Pigeon Photo
                                </DropdownMenuItem>
                              )}

                              {pigeon.eyePhoto && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDownload(
                                      pigeon.eyePhoto,
                                      getFileName(pigeon.eyePhoto, "eye_photo")
                                    )
                                  }
                                  className="cursor-pointer"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Eye Photo
                                </DropdownMenuItem>
                              )}

                              {pigeon.ownershipPhoto && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDownload(
                                      pigeon.ownershipPhoto,
                                      getFileName(
                                        pigeon.ownershipPhoto,
                                        "ownership_photo"
                                      )
                                    )
                                  }
                                  className="cursor-pointer"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Ownership
                                </DropdownMenuItem>
                              )}

                              {pigeon.pedigreePhoto && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDownload(
                                      pigeon.pedigreePhoto,
                                      getFileName(
                                        pigeon.pedigreePhoto,
                                        "pedigree"
                                      )
                                    )
                                  }
                                  className="cursor-pointer"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Pedigree
                                </DropdownMenuItem>
                              )}

                              {pigeon.DNAPhoto && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDownload(
                                      pigeon.DNAPhoto,
                                      getFileName(pigeon.DNAPhoto, "dna")
                                    )
                                  }
                                  className="cursor-pointer"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download DNA
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </SyncHorizontalScroll>
          </div>
        </CardContent>
      </div>

      {/* Pagination Controls - Only show if total items > 40 or multiple pages */}
      {showPagination && (
        <div>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
              {/* Pagination Info */}
              {/* <div className="text-sm text-gray-600">
                Showing page {currentPage} of {pagination.totalPage} (
                {pagination.total} total pigeons)
              </div> */}

              {/* Pagination Controls */}
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <Button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 disabled:opacity-50 disabled:cursor-not-allowed text-white disable:text-black"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="hidden sm:flex items-center gap-1 text-white ">
                  {renderPageNumbers()}
                </div>

                {/* Current Page (Mobile) */}
                <div className="sm:hidden px-3 py-2 text-sm font-medium ">
                  {currentPage} / {pagination.totalPage}
                </div>

                {/* Next Button */}
                <Button
                  onClick={handleNextPage}
                  disabled={currentPage === pagination.totalPage}
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-white disable:text-black"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      )}
    </div>
  );
};

const TableSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default PigeonTable;
