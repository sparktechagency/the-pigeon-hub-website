import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PigeonDatabaseOverview = ({ data, onStatusFilter, selectedStatus }) => {
 
  // Calculate statistics from the data
  const getStats = () => {
    if (!data?.data?.data)
      return {
        all: 0,
        racing: 0,
        breeding: 0,
        lost: 0,
        sold: 0,
        retired: 0,
        deceased: 0,
      };

    const pigeons = data.data.data;
    const stats = {
      all: data.data.pagination?.total || pigeons.length,
      racing: 0,
      breeding: 0,
      lost: 0,
      sold: 0,
      retired: 0,
      deceased: 0,
    };

    pigeons.forEach((pigeon) => {
      // Check both status and verified fields for proper categorization
      const status = pigeon.status?.toLowerCase();
      const isVerified = pigeon.verified;

      if (status) {
        switch (status) {
          case "racing":
            stats.racing++;
            break;
          case "breeding":
            stats.breeding++;
            break;
          case "lost":
            stats.lost++;
            break;
          case "sold":
            stats.sold++;
            break;
          case "retired":
            stats.retired++;
            break;
          case "deceased":
            stats.deceased++;
            break;
          default:
            // If no specific status but verified field exists
            if (isVerified) {
              stats.racing++;
            } else {
              stats.breeding++;
            }
            break;
        }
      } else {
        // Fallback to verified field if status is not available
        if (isVerified) {
          stats.racing++;
        } else {
          stats.breeding++;
        }
      }
    });

    return stats;
  };

  const stats = getStats();

  const statItems = [
    {
      label: "All",
      count: stats.all,
      color: "#09B5DD",
      status: "", // Empty string for "All" filter
      active: !selectedStatus || selectedStatus === "",
    },
    {
      label: "Racing",
      count: stats.racing,
      color: "#3AB27F",
      status: "racing",
      active: selectedStatus === "racing",
    },
    {
      label: "Breeding",
      count: stats.breeding,
      color: "#FFE4AD",
      status: "breeding",
      active: selectedStatus === "breeding",
    },
    {
      label: "Lost",
      count: stats.lost,
      color: "#FD5636",
      status: "lost",
      active: selectedStatus === "lost",
    },
    {
      label: "Sold",
      count: stats.sold,
      color: "#C4CDD6",
      status: "sold",
      active: selectedStatus === "sold",
    },
    {
      label: "Retired",
      count: stats.retired,
      color: "#34B57E",
      status: "Retired",
      active: selectedStatus === "retired",
    },
    {
      label: "Deceased",
      count: stats.deceased,
      color: "#FFBA00",
      status: "deceased",
      active: selectedStatus === "deceased",
    },
  ];

  const handleStatusClick = (status) => {
    if (onStatusFilter) {
      onStatusFilter(status);
    }
  };

  return (
    <div className="bg-[#44505E] text-white rounded-t-lg">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2 gap-x-8 lg:gap-x-12">
          {statItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
              onClick={() => handleStatusClick(item.status)}
            >
              <div
                className="w-3 h-2 rounded-r-2xl transition-all duration-200"
                style={{ backgroundColor: item.color }}
              ></div>

              <div
                variant={item.active ? "default" : "secondary"}
                className={`
                  ${
                    item.active
                      ? " text-[#B7BBA0] "
                      : " text-[#B7BBA0] "
                  }
                  px-3 py-1 text-sm font-medium  duration-200 cursor-pointer
                  ${item.active ? "border-b-2 border-[#B7BBA0]" : ""}
                `}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Optional: Show active filter indicator */}
        {/* {selectedStatus && (
          <div className="mt-3 pt-3 border-t border-slate-600">
            <p className="text-sm text-slate-300">
              <span className="text-white font-medium">Active Filter:</span>{" "}
              {statItems.find((item) => item.status === selectedStatus)?.label}{" "}
              pigeons
            </p>
          </div>
        )} */}
      </CardContent>
    </div>
  );
};

export default PigeonDatabaseOverview;
