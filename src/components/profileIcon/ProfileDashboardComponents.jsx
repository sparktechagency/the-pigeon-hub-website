"use client";

import Spinner from "@/app/(commonLayout)/Spinner";
import {
  useMyProfileQuery,
  useUpdateProfileMutation,
} from "@/redux/featured/auth/authApi";
import {
  useCancelSubscriptionMutation,
  useRunningPackageQuery,
} from "@/redux/featured/Package/packageApi";
import {
  Bird,
  BirdIcon,
  Calendar,
  Phone,
  SubscriptIcon,
  Upload,
  User,
  User2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  MdEmail,
  MdOutlineSubscriptions,
  MdSubscriptions,
} from "react-icons/md";
import { Card, CardContent } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import Image from "next/image";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { getImageUrl } from "../share/imageUrl";
// import { toast } from "react-hot-toast"; // Make sure you have this import
import moment from "moment";
import { HiOutlineStatusOffline, HiOutlineStatusOnline } from "react-icons/hi";
import Swal from "sweetalert2";
import { toast } from "sonner";
import Link from "next/link";

export default function ProfileDashboardComponents() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const { data: profileResponse, isLoading, refetch } = useMyProfileQuery();
  const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
  });
  const [phoneError, setPhoneError] = useState("");
  // Extract user data from the response
  const userData = profileResponse?.data || profileResponse; 

  const { data: packageResponse } = useRunningPackageQuery();
  const packageData = packageResponse?.data;
  const [cancelSubscription, { isLoading: cancelLoading }] =
    useCancelSubscriptionMutation();

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        contact: userData.contact || "",
      });

      // Set initial image preview from user profile
      if (userData.profile) {
        setImagePreview(getImageUrl(userData.profile));
      }
    }
  }, [userData]);

  useEffect(() => {
    if (!imageFile) return;

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // const handlePhoneChange = (value) => {
  //   setFormData({ ...formData, contact: value || "" });

  //   // Validate phone number
  //   if (value) {
  //     if (!isValidPhoneNumber(value)) {
  //       setPhoneError("Invalid phone number for selected country");
  //     } else {
  //       setPhoneError("");
  //     }
  //   } else {
  //     setPhoneError("");
  //   }
  // };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("contact", formData.contact);

      // Append image if selected
      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      const response = await updateProfile({ data: formDataToSend }).unwrap();

      if (response.success) {
        toast.success("Profile updated successfully!");
        if (response.token) {
          localStorage.setItem("accessToken", response.token);
        }
        refetch();
        setOpen(false);
        setImageFile(null);
      } else {
        toast.error(response.message || "Failed to update profile!");
      }
    } catch (error) {
      console.error("Update profile error:", error);

      // Better error message extraction
      let errorMessage = "An error occurred while updating the profile";

      // Check different error structures
      if (error?.data?.message) {
        // RTK Query error format (most common)
        errorMessage = error.data.message;
      } else if (
        error?.data?.errorMessages &&
        Array.isArray(error.data.errorMessages) &&
        error.data.errorMessages.length > 0
      ) {
        // If errorMessages array exists, get the first error message
        errorMessage = error.data.errorMessages[0].message;
      } else if (error?.message) {
        // Generic error message
        errorMessage = error.message;
      } else if (error?.error) {
        // Sometimes wrapped under error.error
        errorMessage = error.error;
      }

      // Show user-friendly error toast
      toast.error(errorMessage);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      // Step 1: SweetAlert confirmation
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You are about to cancel your subscription. ",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, cancel it!",
        cancelButtonText: "No, keep it",
      });

      if (result.isConfirmed) {
        const response = await cancelSubscription().unwrap();

        if (response.success) {
          Swal.fire({
            title: "Cancelled!",
            text: "Your subscription has been cancelled successfully.",
            icon: "success",
            confirmButtonColor: "#A92C2C",
          });
          refetch(); // Refresh user data
        } else {
          Swal.fire({
            title: "Failed!",
            text: response.message || "Failed to cancel subscription!",
            icon: "error",
            confirmButtonColor: "#A92C2C",
          });
        }
      }
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text:
          error.data?.message ||
          error.message ||
          "An error occurred while cancelling the subscription",
        icon: "error",
        confirmButtonColor: "#A92C2C",
      });
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 bg-white rounded-xl border border-gray-200 shadow-sm my-10">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6 relative">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
              {userData?.profile ? (
                <Image
                  src={getImageUrl(userData.profile)}
                  alt="Profile"
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <User size={40} />
                </div>
              )}
            </div>
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-800">
              {userData?.name
                ? userData.name
                    .split(" ")
                    .map(
                      (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase()
                    )
                    .join(" ")
                : userData?.userName
                    ?.split(" ")
                    .map(
                      (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase()
                    )
                    .join(" ")}
            </h2>

            <p className="text-gray-600">{userData?.email}</p>
            <p className="text-gray-500 mt-1">{userData?.contact}</p>
          </div>
        </div>

        <div className="bg-white">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                className="bg-accent hover:bg-accent/70 rounded-sm px-6 py-5 shadow-sm"
              >
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg rounded-lg text-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-800">
                  Edit Profile
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col items-center">
                  <label
                    htmlFor="image-upload"
                    className="relative cursor-pointer group text-white"
                  >
                    <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-100">
                      {imagePreview ? (
                        <Image
                          src={imagePreview}
                          alt="Profile Preview"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400">
                          <Upload size={24} className="mb-2" />
                          <span className="text-sm">Upload Image</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-30 transition-opacity">
                      <Upload className="text-white" size={20} />
                    </div>
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <p className="text-xs text-white mt-2">
                    Click to upload profile picture
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Full Name
                    </label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="py-6"
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Username
                    </label>
                    <Input
                      type="text"
                      name="userName"
                      value={formData.userName}
                      onChange={handleChange}
                      required
                      className="py-3"
                      placeholder="Enter your username"
                    />
                  </div> */}

                  <div>
                    <Label className="block text-sm font-medium text-white mb-1">
                      Email
                    </Label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="py-6 cursor-not-allowed text-white"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Contact Number
                    </label>
                    <Input
                      type="text"
                      name="contact"
                      value={formData.contact}
                      maxLength={16}
                      onChange={handleChange}
                      className="w-full border rounded-md focus:ring-2 py-6 focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter your contact number"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full py-6 bg-accent hover:bg-accent/90 text-white font-medium transition-colors duration-200"
                  disabled={updating || (formData.contact && phoneError)}
                >
                  {updating ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-accent">
                <User2 size={40} />
              </div>
              <h3 className="font-medium text-accent">Name </h3>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {userData?.name
                ? userData.name
                    .split(" ")
                    .map(
                      (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase()
                    )
                    .join(" ")
                : userData?.userName
                    ?.split(" ")
                    .map(
                      (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase()
                    )
                    .join(" ")}
            </h2>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-accent">
                <MdEmail size={40} />
              </div>
              <h3 className="font-medium text-accent">Email</h3>
            </div>
            <p className="text-lg font-bold mt-4 text-gray-800">
              {userData?.email || "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-accent">
                <Phone size={40} />
              </div>
              <h3 className="font-medium text-accent">Phone</h3>
            </div>
            <p className="text-lg font-bold mt-4 text-gray-800">
              {userData?.contact || "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-accent">
                <BirdIcon size={40} />
              </div>
              <h3 className="font-medium text-accent">Total Pigeons</h3>
            </div>
            <p className="text-lg font-bold mt-4 text-gray-800">
              {userData?.totalPigeons || "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {userData?.subscription?.package && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {userData?.subscription?.package && (
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-accent">
                    <MdOutlineSubscriptions size={40} />
                  </div>
                  <h3 className="font-medium text-accent">
                    Subscription Package
                  </h3>
                </div>
                <p className="text-lg font-bold mt-4 text-gray-800">
                  {userData?.subscription?.package || "N/A"}
                </p>
              </CardContent>
            </Card>
          )}
          {userData?.subscription?.status && (
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-accent">
                    <HiOutlineStatusOnline size={40} />
                  </div>
                  <h3 className="font-medium text-accent">
                    Subscription Status
                  </h3>
                </div>
                <p className="text-lg font-bold mt-4 text-gray-800">
                  {userData?.subscription?.status}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-">
        {userData?.subscription?.startDate && (
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-accent">
                  <Calendar size={40} />
                </div>
                <h3 className="font-medium text-accent">
                  Subscription Start Date
                </h3>
              </div>
              <p className="text-lg font-bold mt-4 text-gray-800">
                {moment(userData?.subscription?.startDate).format("LL") ||
                  "N/A"}
              </p>
            </CardContent>
          </Card>
        )}
        {userData?.subscription?.startDate && (
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-accent">
                  <Calendar size={40} />
                </div>
                <h3 className="font-medium text-accent">
                  Subscription End Date
                </h3>
              </div>
              <p className="text-lg font-bold mt-4 text-gray-800">
                {moment(userData?.subscription?.endDate).format("LL") || "N/A"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-between items-center mt-8 gap-4">
        {userData?.subscription && (
          <div className="flex-1">
            {userData?.subscription.status === "active" ? (
              <div className="">
                <Button
                  onClick={handleCancelSubscription}
                  className=" text-white  px-4 py-6 rounded-md w-full"
                >
                  Cancel Subscription
                </Button>
              </div>
            ) : userData?.subscription.status === "cancel" ? (
              new Date(userData?.subscription.endDate) > new Date() ? (
                <p className="text-accent font-semibold">
                  Already cancelled. Will expire on{" "}
                  {new Date(
                    userData?.subscription.endDate
                  ).toLocaleDateString()}
                  .
                </p>
              ) : (
                <p className="text-gray-600 font-semibold">
                  Your package has expired.
                </p>
              )
            ) : null}
          </div>
        )}
        <div className="flex-1">
          <Link href="/subscription" className="">
            <Button className="rounded-sm py-6 text-white w-full">
              Upgrade Package
            </Button>
          </Link>
        </div>
        {/* <SubscriptionCard packageData={packageData} userData={userData} /> */}
      </div>
    </div>
  );
}
