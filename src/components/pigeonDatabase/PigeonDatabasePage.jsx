"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileDown, Upload, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetPigeonPackagesQuery } from "@/redux/featured/pigeon/pigeonApi";
import { Badge } from "@/components/ui/badge";
import PigeonDatabaseOverview from "./PigeonDatabaseOverview";
import PigeonDatabaseFilter from "./PigeonDatabaseFilter";
import PigeonDatabaseTable from "./PigeonDatabaseTable";

const PigeonDatabasePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

 
  const pageFromUrl = parseInt(searchParams.get("page")) || 1;

  const [filters, setFilters] = useState([]);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortBy, setSortBy] = useState(null);


  useEffect(() => {
    const page = parseInt(searchParams.get("page")) || 1;
    setCurrentPage(page);
  }, [searchParams]);

  // Build query parameters
  const queryParams = [
    { name: "page", value: currentPage },
    { name: "limit", value: 40 },
    ...(searchTerm ? [{ name: "searchTerm", value: searchTerm }] : []),
    ...(selectedStatus ? [{ name: "status", value: selectedStatus }] : []),
    ...(sortBy ? [{ name: "sort", value: sortBy }] : []),
    ...filters,
  ];

  const {
    data: pigeonData,
    isLoading,
    error,
  } = useGetPigeonPackagesQuery(queryParams);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    router.push("?page=1", { scroll: false });
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
    router.push("?page=1", { scroll: false });
  };

  const handleStatusFilter = (status) => {
    if (selectedStatus === status) {
      setSelectedStatus("");
    } else {
      setSelectedStatus(status);
    }
    setCurrentPage(1);
    router.push("?page=1", { scroll: false });
  };

  const clearStatusFilter = () => {
    setSelectedStatus("");
    setCurrentPage(1);
    router.push("?page=1", { scroll: false });
  };

  const handleEditPigeon = (pigeonId) => {
    router.push(`/add-pigeon?edit=${pigeonId}`);
  };

  const handleSortChange = (sortValue) => {
    setSortBy(sortValue);
    setCurrentPage(1);
    router.push("?page=1", { scroll: false });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    router.push(`?page=${newPage}`, { scroll: false });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Error loading pigeons: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pigeon Database</h1>
          <p className="text-gray-600 mt-1">Manage Your Pigeon Collection</p>
        </div>
      </div>

      <div>
        {/* Overview Stats */}
        <PigeonDatabaseOverview
          data={pigeonData}
          onStatusFilter={handleStatusFilter}
          selectedStatus={selectedStatus}
        />
        {/* Filters */}
        <PigeonDatabaseFilter
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          searchTerm={searchTerm}
        />
      </div>

      {/* Pigeon Table with Status Filter Handler */}
      <PigeonDatabaseTable
        data={pigeonData}
        isLoading={isLoading}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onEdit={handleEditPigeon}
        onSortChange={handleSortChange}
        onStatusFilter={handleStatusFilter}
        selectedStatus={selectedStatus}
      />
    </div>
  );
};

export default PigeonDatabasePage;
