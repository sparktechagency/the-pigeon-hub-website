"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetAllPigeonNameQuery,
  useGetBreederQuery,
} from "@/redux/featured/pigeon/breederApi";
import {
  useCreatePigeonMutation,
  useGetAllPigeonSearchQuery,
  useGetPigeonPackagesQuery,
  useGetSinglePigeonQuery,
  useLazyCheckDuplicatePigeonQuery,
  useUpdatePigeonMutation,
} from "@/redux/featured/pigeon/pigeonApi";
import { getNames } from "country-list";
import { ChevronDown } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { getImageUrl } from "../share/imageUrl";
import PigeonPhotosSlider from "./addPigeon/PigeonPhotoSlider";

const AddPigeonContainer = ({ pigeonId }) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const editId = pigeonId || searchParams.get("edit") || params?.id;
  const isEditMode = !!editId;
  const countries = getNames();
  const router = useRouter();
  const isRemovingPhotoRef = useRef(false);
  const [fatherSearchTerm, setFatherSearchTerm] = useState("");
  const [motherSearchTerm, setMotherSearchTerm] = useState("");
  const [selectedFatherId, setSelectedFatherId] = useState("");
  const [selectedMotherId, setSelectedMotherId] = useState("");
  const { data: allPigeonName } = useGetAllPigeonNameQuery();

  const [createPigeon, { isLoading: isCreating }] = useCreatePigeonMutation();
  const [updatePigeon, { isLoading: isUpdating }] = useUpdatePigeonMutation();
  const { data: pigeonData } = useGetPigeonPackagesQuery([]);
  const { data: singlePigeon, isLoading: isLoadingSingle } =
    useGetSinglePigeonQuery(editId, {
      skip: !editId,
    });
  const { data: breeder } = useGetBreederQuery();

  const { data: fatherData } = useGetAllPigeonSearchQuery(fatherSearchTerm);
  const { data: motherData } = useGetAllPigeonSearchQuery(motherSearchTerm);

  // Duplicate check API
  const [checkDuplicate] = useLazyCheckDuplicatePigeonQuery();
  const [duplicateError, setDuplicateError] = useState("");
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  const fatherList = (fatherData?.data || []).filter(
    (item) => item.gender === "Cock"
  );

  const motherList = (motherData?.data || []).filter(
    (item) => item.gender === "Hen"
  );
  const breederList = breeder?.data?.breeder;

  const [photos, setPhotos] = useState([]);
  const [raceResults, setRaceResults] = useState([]);
  const [showPigeonResult, setShowPigeonResult] = useState(false);

  // Color Pattern Selection States
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedPattern, setSelectedPattern] = useState("");
  const [showPatterns, setShowPatterns] = useState(false);
  const [submitAction, setSubmitAction] = useState("save");

  const colorPatternMap = {
    Blue: ["Barless", "Bar", "Check", "T-Check", "White Flight"],
    Black: ["Barless", "Bar", "Check", "T-Check", "White Flight"],
    White: ["Barless", "Bar", "Check", "T-Check", "White Flight"],
    Ash_Red: ["Barless", "Bar", "Check", "T-Check", "White Flight"],
    Brown: ["Barless", "Bar", "Check", "T-Check", "White Flight"],
    Red: ["Barless", "Bar", "Check", "T-Check", "White Flight"],
    Grizzle: ["Barless", "Bar", "Check", "T-Check", "White Flight"],
    Mealy: ["Barless", "Bar", "Check", "T-Check", "White Flight"],
  };

  const [pigeonPhoto, setPigeonPhoto] = useState(null);
  const [eyePhoto, setEyePhoto] = useState(null);
  const [ownershipPhoto, setOwnershipPhoto] = useState(null);
  const [pedigreePhoto, setPedigreePhoto] = useState(null);
  const [DNAPhoto, setDNAPhoto] = useState(null);
  const [breederSearchTerm, setBreederSearchTerm] = useState("");
  const [selectedBreeder, setSelectedBreeder] = useState(null);
  const [showBreederDropdown, setShowBreederDropdown] = useState(false);
  const [fatherRingNumber, setFatherRingNumber] = useState("");
  const [motherRingNumber, setMotherRingNumber] = useState("");
  const [selectedFather, setSelectedFather] = useState();
  const [selectedMother, setSelectedMother] = useState();

  const currentYear = new Date().getFullYear();
  const futureYear = currentYear + 2;
  const startYear = 1927;

  const allYears = Array.from(
    { length: futureYear - startYear + 1 },
    (_, i) => startYear + i
  ).reverse();

  const [search, setSearch] = useState("");
  const [filteredYears, setFilteredYears] = useState(allYears);
  const [showDropdown, setShowDropdown] = useState(false);

  // Search handler
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    setShowDropdown(true);

    const filtered = allYears.filter((year) => year.toString().includes(value));
    setFilteredYears(filtered);
  };

  const handleSelect = (year) => {
    setSearch(year.toString());
    setValue("birthYear", year);
    setShowDropdown(false);
  };

  // Generic photo upload handler
  const handleSpecificPhotoUpload = (event, photoType, setPhotoState) => {
    const file = event.target.files[0];
    if (!file) return;

    // === Determine if PDF is allowed ===
    const isPdfAllowed =
      photoType === "pedigreePhoto" || photoType === "dnaPhoto";

    // === Validate file type ===
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!(isImage || (isPdfAllowed && isPdf))) {
      toast.error("Please select a valid image or PDF file");
      return;
    }

    // === Validate file size (max 10MB) ===
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      return;
    }

    // === Read file ===
    const reader = new FileReader();

    reader.onload = (e) => {
      setPhotoState({
        id: Date.now(),
        file,
        url: e.target.result,
        type: photoType,
        isPdf, // store file type info for later use
      });
    };

    // === For PDF, read as DataURL so it can still be previewed or recognized ===
    reader.readAsDataURL(file);
  };

  // Remove photo handler
  const removeSpecificPhoto = async (setPhotoState, photoType) => {
    // Clear the state immediately without waiting for API
    setPhotoState(null);

    // Only make API call if in edit mode
    if (isEditMode && editId) {
      try {
        // Create a minimal FormData with just the field to clear
        const formDataToSend = new FormData();
        formDataToSend.append(photoType, "");

        // Add minimal required fields to prevent validation errors
        formDataToSend.append("ringNumber", getValues("ringNumber") || "");
        formDataToSend.append("name", getValues("name") || "");
        formDataToSend.append("silentImageUpdate", "true");

        // Call the update API silently in the background
        await updatePigeon({ id: editId, data: formDataToSend }).unwrap();

        // Show minimal success notification
        toast.success("Image removed", {
          duration: 2000,
          position: "bottom-right",
          style: { background: "#10B981", color: "white" },
        });
      } catch (error) {
        // Silent error handling - don't disrupt the user
        console.error(`Error removing ${photoType}:`, error);
      }
    }
  };

  const validatePigeonName = (inputName) => {
    // Get all existing pigeon names from API
    const existingNames = allPigeonName?.data || [];

    // Normalize the input name (lowercase and trim)
    const normalizedInput = inputName?.trim().toLowerCase();
    const isDuplicate = existingNames.some(
      (pigeon) => pigeon.name?.trim().toLowerCase() === normalizedInput
    );

    return isDuplicate;
  };

  // Add a new race result entry
  const addRaceResult = () => {
    const newResult = {
      id: Date.now(),
      name: "",
      date: "",
      distance: "",
      total: "",
      place: "",
    };
    setRaceResults((prev) => [...prev, newResult]);
  };

  // Remove a race result entry
  const removeRaceResult = (id) => {
    setRaceResults((prev) => prev.filter((result) => result.id !== id));
  };

  // Update a specific field in a race result
  const updateRaceResult = (id, field, value) => {
    setRaceResults((prevResults) =>
      prevResults.map((result) => {
        if (result.id === id) {
          let updatedValue = value;

          // Validation rules
          if (field === "date") {
            const today = new Date().toISOString().split("T")[0];
            if (new Date(value) > new Date(today)) {
              toast.error("Date must be in the past.");
              return result; // ignore invalid value
            }
          }

          if (field === "total") {
            if (value <= 0) {
              toast.error("Total birds must be a positive number.");
              return result;
            }
          }
          return { ...result, [field]: updatedValue };
        }
        return result;
      })
    );
  };

  // Color Pattern Handlers
  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setSelectedPattern(""); // Reset pattern when color changes
    setShowPatterns(true);
    setValue("color", ""); // Clear form value until pattern is selected
  };

  const handlePatternSelect = (pattern) => {
    setSelectedPattern(pattern);
    setColorDropdownOpen(false);
    setShowPatterns(false);
  };

  const resetColorSelection = () => {
    setSelectedColor("");
    setSelectedPattern("");
    setShowPatterns(false);
    setValue("color", "");
  };

  const getColorDisplayValue = () => {
    if (selectedColor && selectedPattern) {
      return `${selectedColor.replace("_", " ")}  ${selectedPattern}`;
    } else if (selectedColor) {
      return selectedColor.replace("_", " ");
    }
    return "Select Color  Pattern";
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      ringNumber: "",
      name: "",
      country: "",
      birthYear: "",
      shortInfo: "",
      breeder: "",
      color: "",
      pattern: "",
      gender: "",
      status: "",
      location: "",
      notes: "",
      racingRating: 0,
      racherRating: "",
      breederRating: 0,
      fatherRingId: selectedFatherId,
      motherRingId: selectedMotherId,
      verified: false,
      iconic: false,
      addresults: "",
      iconicScore: 0,
    },
  });

  const isLoading = isCreating || isUpdating || isLoadingSingle;

  // Get available pigeons for parent selection
  const availablePigeons = pigeonData?.data?.data || [];

  // Watch form values for duplicate check
  const ringNumber = watch("ringNumber");
  const country = watch("country");
  const birthYear = watch("birthYear");

  // Duplicate check effect
  useEffect(() => {
    // Check if all three fields are filled
    if (ringNumber && country && birthYear) {
      setIsCheckingDuplicate(true);

      // Debounce the API call
      const timeoutId = setTimeout(async () => {
        try {
          const result = await checkDuplicate({
            ringNumber,
            country,
            birthYear,
          }).unwrap();

          console.log("Duplicate check result:", result);

          // Check if duplicate exists - API returns data nested inside result
          if (result?.data?.isDuplicate) {
            // In edit mode, check if it's the same pigeon being edited
            if (
              isEditMode &&
              singlePigeon?.data?._id === result?.data?.pigeon?._id
            ) {
              setDuplicateError("");
            } else {
              setDuplicateError(
                result?.data?.message ||
                  "This pigeon already exists in the database."
              );
            }
          } else {
            setDuplicateError("");
          }
        } catch (error) {
          console.error("Error checking duplicate:", error);
          // Check if error response has duplicate info
          if (error?.data?.data?.isDuplicate) {
            if (
              isEditMode &&
              singlePigeon?.data?._id === error?.data?.data?.pigeon?._id
            ) {
              setDuplicateError("");
            } else {
              setDuplicateError(
                error?.data?.data?.message ||
                  "This pigeon already exists in the database."
              );
            }
          } else {
            setDuplicateError("");
          }
        } finally {
          setIsCheckingDuplicate(false);
        }
      }, 300); // 300ms debounce for quick response

      return () => clearTimeout(timeoutId);
    } else {
      // Clear error if any field is empty
      setDuplicateError("");
      setIsCheckingDuplicate(false);
    }
  }, [
    ringNumber,
    country,
    birthYear,
    checkDuplicate,
    isEditMode,
    singlePigeon,
  ]);

  // Sync color pattern with form
  useEffect(() => {
    if (selectedColor && selectedPattern) {
      const colorValue = `${selectedColor.replace(
        "_",
        " "
      )}  ${selectedPattern}`;
      setValue("color", colorValue);
    }
  }, [selectedColor, selectedPattern, setValue]);

  useEffect(() => {
    setValue("fatherRingId", selectedFatherId);
  }, [selectedFatherId, setValue]);

  useEffect(() => {
    setValue("motherRingId", selectedMotherId);
  }, [selectedMotherId, setValue]);

  // Load pigeon data for edit mode
  useEffect(() => {
    if (isEditMode && singlePigeon?.data) {
      const pigeon = singlePigeon.data;

      // Set parent IDs (use _id, not ringNumber)
      if (pigeon.fatherRingId) {
        setFatherRingNumber(pigeon.fatherRingId.ringNumber);
        setFatherSearchTerm(pigeon.fatherRingId.ringNumber);
        setSelectedFatherId(pigeon.fatherRingId.ringNumber);
        setSelectedFather(pigeon.fatherRingId);
      }

      if (pigeon.motherRingId) {
        setMotherRingNumber(pigeon.motherRingId.ringNumber);
        setMotherSearchTerm(pigeon.motherRingId.ringNumber);
        setSelectedMotherId(pigeon.motherRingId.ringNumber);
        setSelectedMother(pigeon.motherRingId);
      }

      // Set breeder
      if (pigeon.breeder) {
        const breederName =
          typeof pigeon.breeder === "object"
            ? pigeon.breeder.loftName
            : pigeon.breeder;
        setBreederSearchTerm(breederName);
        if (typeof pigeon.breeder === "object") {
          setSelectedBreeder(pigeon.breeder);
        }
      }

      // Reset form with all values
      reset({
        ringNumber: pigeon.ringNumber || "",
        name: pigeon.name || "",
        country: pigeon.country || "",
        birthYear: pigeon.birthYear || new Date().getFullYear(),
        shortInfo: pigeon.shortInfo || "",
        breeder:
          typeof pigeon?.breeder === "object"
            ? pigeon?.breeder?.loftName
            : pigeon?.breeder || "",
        color: pigeon.color || "",
        gender: pigeon.gender,
        status: pigeon.status || "",
        location: pigeon.location || "",
        notes: pigeon.notes || "",
        racingRating: pigeon.racingRating || 0,
        racherRating: pigeon.racherRating || "",
        breederRating: pigeon.breederRating || 0,
        fatherRingId: pigeon.fatherRingId?.ringNumber || "",
        motherRingId: pigeon.motherRingId?.ringNumber || "",
        verified: pigeon.verified || false,
        iconic: pigeon.iconic || false,
        addresults: Array.isArray(pigeon.addresults)
          ? pigeon.addresults.join("\n")
          : pigeon.addresults || "",
        iconicScore: pigeon.iconicScore || 0,
      });

      // Handle color pattern
      if (pigeon.color) {
        const parts = pigeon.color.split("  ");
        if (parts.length === 2) {
          setSelectedColor(parts[0].replace(" ", "_"));
          setSelectedPattern(parts[1]);
        }
      }

      // Load photos
      if (pigeon.pigeonPhoto) setPigeonPhoto({ url: pigeon.pigeonPhoto });
      if (pigeon.eyePhoto) setEyePhoto({ url: pigeon.eyePhoto });
      if (pigeon.ownershipPhoto)
        setOwnershipPhoto({ url: pigeon.ownershipPhoto });
      if (pigeon.pedigreePhoto) {
        const isPdf = pigeon.pedigreePhoto.endsWith(".pdf");
        setPedigreePhoto({ url: pigeon.pedigreePhoto, isPdf });
      }

      if (pigeon.DNAPhoto) {
        const isPdf = pigeon.DNAPhoto.endsWith(".pdf");
        setDNAPhoto({ url: pigeon.DNAPhoto, isPdf });
      }

      // Load race results
      if (pigeon.results && Array.isArray(pigeon.results)) {
        setRaceResults(
          pigeon.results.map((result, index) => ({
            id: Date.now() + index,
            name: result.name || "",
            date: result.date || "",
            distance: result.distance || "",
            total: result.total || 0,
            place: result.place || "",
          }))
        );
        setShowPigeonResult(true);
      }
    }
  }, [isEditMode, singlePigeon, reset]);

  const onSubmit = async (data) => {
    if (submitAction === "cancel") {
      router.push("/loft-overview");
      return;
    }

    // Prevent submission if there's a duplicate error
    if (duplicateError) {
      toast.error(
        "Cannot submit: A pigeon with this combination already exists!"
      );
      return;
    }

    try {
      const formDataToSend = new FormData();

      const dataObject = {
        ringNumber: data.ringNumber,
        name: data.name,
        country: data.country,
        birthYear: parseInt(data.birthYear),
        shortInfo: data.shortInfo,
        breeder: breederSearchTerm || data.breeder,
        color: data.color,
        racingRating: parseInt(data.racingRating) || 0,
        racherRating: data.racherRating || "",
        breederRating: parseInt(data.breederRating) || 0,
        gender: data.gender,
        status: data.status || "",
        location: data.location,
        notes: data.notes,
        fatherRingId: fatherSearchTerm || selectedFatherId || "",
        motherRingId: motherSearchTerm || selectedMotherId || "",
        verified: Boolean(data.verified),
        iconic: Boolean(data.iconic),
        addresults: data.addresults ? data.addresults.split("\n") : [],
        iconicScore: parseInt(data.iconicScore) || 0,
        remaining: isEditMode
          ? photos.filter((photo) => !photo.file).map((photo) => photo.url)
          : [],
      };

      if (showPigeonResult && raceResults.length > 0) {
        const formattedResults = raceResults.map((result) => ({
          name: result.name,
          date: result.date,
          distance: result.distance,
          total: parseInt(result.total) || 0,
          place: result.place,
        }));
        dataObject.results = formattedResults;
      }

      // Photo handling logic (same as before)
      if (pigeonPhoto?.file) {
        formDataToSend.append("pigeonPhoto", pigeonPhoto.file);
      } else if (
        isEditMode &&
        !pigeonPhoto &&
        singlePigeon?.data?.pigeonPhoto &&
        singlePigeon.data.pigeonPhoto !== ""
      ) {
        formDataToSend.append("pigeonPhoto", "");
      }

      if (eyePhoto?.file) {
        formDataToSend.append("eyePhoto", eyePhoto.file);
      } else if (
        isEditMode &&
        !eyePhoto &&
        singlePigeon?.data?.eyePhoto &&
        singlePigeon.data.eyePhoto !== ""
      ) {
        formDataToSend.append("eyePhoto", "");
      }

      if (ownershipPhoto?.file) {
        formDataToSend.append("ownershipPhoto", ownershipPhoto.file);
      } else if (
        isEditMode &&
        !ownershipPhoto &&
        singlePigeon?.data?.ownershipPhoto &&
        singlePigeon.data.ownershipPhoto !== ""
      ) {
        formDataToSend.append("ownershipPhoto", "");
      }

      if (pedigreePhoto?.file) {
        formDataToSend.append("pedigreePhoto", pedigreePhoto.file);
      } else if (
        isEditMode &&
        !pedigreePhoto &&
        singlePigeon?.data?.pedigreePhoto &&
        singlePigeon.data.pedigreePhoto !== ""
      ) {
        formDataToSend.append("pedigreePhoto", "");
      }

      if (DNAPhoto?.file) {
        formDataToSend.append("DNAPhoto", DNAPhoto.file);
      } else if (
        isEditMode &&
        !DNAPhoto &&
        singlePigeon?.data?.DNAPhoto &&
        singlePigeon.data.DNAPhoto !== ""
      ) {
        formDataToSend.append("DNAPhoto", "");
      }

      if (isEditMode) {
        const newImages = photos.filter((photo) => photo.file);
        newImages.forEach((photo) => {
          formDataToSend.append("image", photo.file);
        });
      } else {
        photos.forEach((photo) => {
          if (photo.file) {
            formDataToSend.append("image", photo.file);
          }
        });
      }

      formDataToSend.append("data", JSON.stringify(dataObject));

      if (isEditMode) {
        await updatePigeon({ id: editId, data: formDataToSend }).unwrap();
        toast.success("Pigeon updated successfully!");
        router.push("/loft-overview");
      } else {
        await createPigeon(formDataToSend).unwrap();
        toast.success("Pigeon added successfully!");

        if (submitAction === "saveAndAdd") {
          reset({
            ringNumber: "",
            name: "",
            country: "",
            birthYear: "",
            shortInfo: "",
            breeder: "",
            color: "",
            gender: "",
            status: "",
            location: "",
            notes: "",
            racingRating: 0,
            racherRating: "",
            breederRating: 0,
            fatherRingId: "",
            motherRingId: "",
            verified: false,
            iconic: false,
            addresults: "",
            iconicScore: 0,
          });

          setPigeonPhoto(null);
          setEyePhoto(null);
          setOwnershipPhoto(null);
          setPedigreePhoto(null);
          setDNAPhoto(null);
          setPhotos([]);
          setRaceResults([]);

          setFatherSearchTerm("");
          setMotherSearchTerm("");
          setSelectedFatherId("");
          setSelectedMotherId("");
          setSelectedFather(null);
          setSelectedMother(null);
          setFatherRingNumber("");
          setMotherRingNumber("");

          setBreederSearchTerm("");
          setSelectedBreeder(null);

          setSelectedColor("");
          setSelectedPattern("");
          setShowPatterns(false);

          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          // Normal save - redirect to list
          router.push("/loft-overview");
        }
      }
    } catch (errorMessages) {
      console.error("Submit error:", errorMessages);
      toast.error(
        errorMessages?.data?.message ||
          `Failed to ${isEditMode ? "update" : "add"} pigeon`
      );
    }
  };

  return (
    <div className="my-8 md:my-12 lg:my-16 xl:my-20 px-4 md:px-8 lg:px-12">
      {/* Header */}
      <div className="flex items-center gap-4 gap-x-10 mb-8">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-accent mb-4  text-center">
            {isEditMode ? "Edit" : "Add"} a New Pigeon to
            <span className="text-accent-foreground"> Your Loft ​</span>
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-x-12">
          {/* Left Column - Form Fields */}
          <div className="lg:col-span-3 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-x-10">
                <div>
                  <label className="block text-sm font-medium  mb-2">
                    Ring Number *
                  </label>
                  <input
                    type="text"
                    {...register("ringNumber", {
                      required: "Ring number is required",
                    })}
                    placeholder="Ring Number"
                    className={`w-full px-3 py-[14px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      duplicateError ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.ringNumber && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.ringNumber.message}
                    </p>
                  )}
                  {/* Duplicate error message */}
                  {duplicateError && (
                    <div className="mt-2 bg-red-50 border border-red-400 text-red-700 px-3 py-2 rounded-lg text-sm">
                      <div className="flex items-start">
                        <svg
                          className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{duplicateError}</span>
                      </div>
                    </div>
                  )}
                  {/* Checking indicator */}
                  {/* {isCheckingDuplicate && !duplicateError && (
                    <div className="mt-2 flex items-center text-blue-600 text-sm">
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Checking...</span>
                    </div>
                  )} */}
                </div>

                <div>
                  <label className="block text-sm font-medium  mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    {...register("name", {
                      required: "Name is required",
                      validate: {
                        checkDuplicate: (value) => {
                          if (
                            isEditMode &&
                            singlePigeon?.data?.name?.trim().toLowerCase() ===
                              value?.trim().toLowerCase()
                          ) {
                            return true; // allow same name if editing current pigeon
                          }

                          const isDuplicate = validatePigeonName(value);
                          if (isDuplicate) {
                            return "This pigeon is already registered in our database. To add it to your loft database, go to the Pigeon Database and press the '+' button.";
                          }

                          return true;
                        },
                      },
                    })}
                    placeholder="Name"
                    className={`w-full px-3 py-[14px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>

                  <Controller
                    name="country"
                    control={control}
                    rules={{ required: "Country is required" }}
                    render={({ field }) => (
                      <Select
                        key={field.value} // Forces re-render when value changes
                        value={field.value || ""}
                        onValueChange={(value) => field.onChange(value)}
                      >
                        <SelectTrigger className="w-full px-3 py-[25px] border border-gray-300 rounded-lg">
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country, index) => (
                            <SelectItem key={index} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />

                  {errors.country && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.country.message}
                    </p>
                  )}
                </div>

                <div className="relative w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birth Year *
                  </label>

                  <input
                    type="text"
                    {...register("birthYear", {
                      required: "Birth year is required",
                    })}
                    value={watch("birthYear") || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setValue("birthYear", value);
                      setShowDropdown(true);

                      const filtered = allYears.filter((year) =>
                        year.toString().includes(value)
                      );
                      setFilteredYears(filtered);
                    }}
                    placeholder="Select Pigeon Birth Year"
                    className="w-full px-3 py-[14px] border border-gray-300 rounded-lg"
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 250)}
                  />

                  {errors.birthYear && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.birthYear.message}
                    </p>
                  )}

                  {showDropdown && (
                    <ul className="absolute z-10 w-full bg-white border rounded-lg max-h-48 overflow-y-auto shadow-md mt-1">
                      {filteredYears.length > 0 ? (
                        filteredYears.map((year) => (
                          <li
                            key={year}
                            onMouseDown={() => {
                              setValue("birthYear", year);
                              setShowDropdown(false);
                            }}
                            className="px-3 py-2 hover:bg-teal-100 cursor-pointer"
                          >
                            {year}
                          </li>
                        ))
                      ) : (
                        <li className="px-3 py-2 text-gray-500">
                          No results found
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 gap-x-10">
                <div className="">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Story Line
                  </label>
                  <textarea
                    {...register("shortInfo")}
                    placeholder={`For example:
Son of Burj Khalifa
Winner of the Dubai OLR
5 times 1st price winner
Bought for USD 50,000`}
                    rows={5}
                    className="w-full px-3 py-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                </div>

                <div className="">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pigeon Results
                  </label>
                  <textarea
                    {...register("addresults")}
                    placeholder={`For example:
1st/828p Quiévrain 108km
4th/3265p Melun 287km
6th/3418p HotSpot 6 Dubai OLR`}
                    className="w-full px-3 h-[150px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1  lg:grid-cols-2 gap-x-10">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Breeder Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={breederSearchTerm}
                      onChange={(e) => {
                        const value = e.target.value;
                        setBreederSearchTerm(value);
                        setValue("breeder", value);
                        setShowBreederDropdown(true);
                        setSelectedBreeder(null);
                      }}
                      onFocus={() => setShowBreederDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowBreederDropdown(false), 250)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && breederSearchTerm) {
                          e.preventDefault();
                          const matches = breederList?.filter((breeder) =>
                            breeder.loftName
                              .toLowerCase()
                              .includes(breederSearchTerm.toLowerCase())
                          );
                          if (matches?.length === 0) {
                            setValue("breeder", breederSearchTerm);
                            setShowBreederDropdown(false);
                          }
                        }
                      }}
                      placeholder="Type or Select Breeder Name"
                      className="w-full px-3 py-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />

                    <input type="hidden" {...register("breeder")} />

                    {/* Dropdown list for verified breeders */}
                    {showBreederDropdown &&
                      breederList &&
                      breederList.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg max-h-40 overflow-y-auto shadow-md mt-1">
                          {breederSearchTerm
                            ? breederList
                                .filter((breeder) =>
                                  breeder.loftName
                                    .toLowerCase()
                                    .includes(breederSearchTerm.toLowerCase())
                                )
                                .map((breeder) => (
                                  <li
                                    key={breeder._id || breeder.id}
                                    className="px-3 py-2 hover:bg-teal-100 cursor-pointer"
                                    onMouseDown={() => {
                                      setBreederSearchTerm(breeder.loftName);
                                      setSelectedBreeder(breeder);
                                      setShowBreederDropdown(false);
                                      setValue("breeder", breeder.loftName);
                                    }}
                                  >
                                    {breeder.loftName}
                                  </li>
                                ))
                            : breederList.map((breeder) => (
                                <li
                                  key={breeder._id || breeder.id}
                                  className="px-3 py-2 hover:bg-teal-100 cursor-pointer"
                                  onMouseDown={() => {
                                    setBreederSearchTerm(breeder.loftName);
                                    setSelectedBreeder(breeder);
                                    setShowBreederDropdown(false);
                                    setValue("breeder", breeder.loftName);
                                  }}
                                >
                                  {breeder.loftName}
                                </li>
                              ))}
                        </ul>
                      )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Breeder Rating
                  </label>
                  <Select
                    defaultValue={watch("breederRating") || ""}
                    key={watch("breederRating")} // Add key
                    value={watch("breederRating")?.toString() || ""} // Convert to string
                    onValueChange={(value) =>
                      setValue("breederRating", Number(value))
                    }
                  >
                    <SelectTrigger className="w-full px-3 py-[25px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                      <SelectValue placeholder="Select Breeder Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 99 }, (_, i) => i + 1)
                        .reverse()
                        .map((rating) => (
                          <SelectItem key={rating} value={rating.toString()}>
                            {rating}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Physical Characteristics */}
              <div className="">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-x-10">
                  {/* Dynamic Color & Pattern Selector */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Pattern
                    </label>

                    <button
                      type="button"
                      onClick={() => setColorDropdownOpen(!colorDropdownOpen)}
                      className="w-full px-3 py-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 flex items-center justify-between bg-white text-left"
                      style={{
                        color:
                          selectedColor && selectedPattern ? "#000" : "#999",
                      }}
                    >
                      <span>{getColorDisplayValue()}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          colorDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Content */}
                    {colorDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
                        {!showPatterns ? (
                          // Color Selection
                          <div className="p-2">
                            <div className="text-xs text-gray-500 px-2 py-1 border-b">
                              Select Color:
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {Object.keys(colorPatternMap).map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => handleColorSelect(color)}
                                  className="w-full text-left px-3 py-[14px] hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                >
                                  {color.replace("_", " ")}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          // Pattern Selection
                          <div className="p-2">
                            <div className="flex items-center justify-between px-2 py-1 border-b">
                              <span className="text-xs text-gray-500">
                                Select Pattern for{" "}
                                {selectedColor.replace("_", " ")}:
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowPatterns(false)}
                                className="text-xs text-teal-600 hover:text-teal-800"
                              >
                                ← Back
                              </button>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {colorPatternMap[selectedColor]?.map(
                                (pattern) => (
                                  <button
                                    key={pattern}
                                    type="button"
                                    onClick={() => handlePatternSelect(pattern)}
                                    className="w-full text-left px-3 py-[14px] hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                  >
                                    {pattern}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Reset Option */}
                        {(selectedColor || selectedPattern) && (
                          <div className="border-t p-2">
                            <button
                              type="button"
                              onClick={resetColorSelection}
                              className="w-full text-left px-3 py-[14px] text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none text-sm"
                            >
                              Clear Selection
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Hidden input for react-hook-form */}
                    <input type="hidden" {...register("color")} />
                  </div>

                  {/* <div>
                    <label className="block text-sm font-medium mb-2">
                      Gender <span className="">*</span>
                    </label>

                    <Controller
                      name="gender"
                      control={control}
                      rules={{ required: "Gender is required" }} // ✅ Validation rule
                      render={({ field }) => (
                        <Select
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full px-3 py-[25px] border border-gray-300 rounded-lg">
                            <SelectValue placeholder="Select Gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Hen">Hen</SelectItem>
                            <SelectItem value="Cock">Cock</SelectItem>
                            <SelectItem value="Unspecified">
                              Unspecified
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />

                    {errors.gender && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.gender.message}
                      </p>
                    )}
                  </div> */}

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Gender <span className="">*</span>
                    </label>

                    <Controller
                      name="gender"
                      control={control}
                      rules={{ required: "Gender is required" }}
                      render={({ field }) => (
                        <Select
                          key={field.value || "gender-select"} // Force re-render when value changes
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full px-3 py-[25px] border border-gray-300 rounded-lg">
                            <SelectValue placeholder="Select Gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Hen">Hen</SelectItem>
                            <SelectItem value="Cock">Cock</SelectItem>
                            <SelectItem value="Unspecified">
                              Unspecified
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />

                    {errors.gender && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.gender.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <Select
                      key={watch("status")}
                      value={watch("status") || ""}
                      onValueChange={(value) => setValue("status", value)}
                    >
                      <SelectTrigger className="w-full px-3 py-[25px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Breeding">Breeding</SelectItem>
                        <SelectItem value="Racing">Racing</SelectItem>
                        <SelectItem value="Sold">Sold</SelectItem>
                        <SelectItem value="Lost">Lost</SelectItem>
                        <SelectItem value="Retired">Retired</SelectItem>
                        <SelectItem value="Deceased">Deceased</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      {...register("location")}
                      placeholder="Location"
                      className="w-full px-3 py-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    {errors.location && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.location.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Ratings */}
              <div className="">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-x-10">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Racer Rating
                    </label>
                    <Select
                      key={watch("racingRating")} // Add key
                      value={watch("racingRating")?.toString() || ""} // Convert to string
                      onValueChange={(value) =>
                        setValue("racingRating", Number(value))
                      }
                    >
                      <SelectTrigger className="w-full px-3 py-[25px] border border-gray-300 rounded-lg">
                        <SelectValue placeholder="Select Racer Rating" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 99 }, (_, i) => i + 1)
                          .reverse()
                          .map((rating) => (
                            <SelectItem key={rating} value={String(rating)}>
                              {rating}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  {...register("notes")}
                  placeholder="Additional notes about the pigeon"
                  rows={3}
                  className="w-full px-3 py-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>

            {/* Parent Selection */}
            <div className="bg-white rounded-lg p-6 shadow-sm ">
              {/* <h2 className="text-lg font-semibold mb-4">Parent Selection</h2> */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-x-10">
                {/* Father Ring ID */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Father Ring ID
                  </label>

                  <div>
                    <input
                      type="text"
                      {...register("fatherRingId")}
                      value={
                        selectedFatherId
                          ? fatherList.find((f) => f._id === selectedFatherId)
                              ?.ringNumber || fatherRingNumber
                          : fatherSearchTerm
                      }
                      onChange={(e) => {
                        setFatherSearchTerm(e.target.value);
                        setSelectedFatherId(""); // reset selection if user types
                        setFatherRingNumber(""); // clear stored ring number
                      }}
                      placeholder="Search father ring number or name"
                      className="w-full px-3 py-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />

                    <p className="text-xs text-destructive mt-1">
                      Enter a part of the ring or part of the name to search for
                      the corresponding Pigeon
                    </p>

                    {/* Dropdown list */}
                    {fatherList?.length > 0 &&
                      !selectedFatherId &&
                      fatherSearchTerm && (
                        <ul className="border border-gray-300 rounded mt-1 max-h-40 overflow-auto bg-white z-10 absolute max-w-[410px]">
                          {fatherList.map((pigeon) => (
                            <li
                              key={pigeon._id}
                              className="px-3 py-[14px] hover:bg-teal-100 cursor-pointer"
                              onClick={() => {
                                setSelectedFatherId(pigeon.ringNumber); // use _id for backend reference
                                setFatherSearchTerm(pigeon.ringNumber); // but display ringNumber
                                setFatherRingNumber(pigeon.ringNumber);
                                setSelectedFather(pigeon); // store full selected pigeon info
                              }}
                            >
                              {pigeon.ringNumber} - {pigeon.name}
                            </li>
                          ))}
                        </ul>
                      )}

                    {/* Selected pigeon info */}
                    {selectedFatherId && selectedFather && (
                      <div className="mt-2 p-2 border border-gray-200 rounded bg-gray-50">
                        <p className="text-sm">
                          <span className="font-medium">Ring:</span>{" "}
                          {selectedFather.ringNumber}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Name:</span>{" "}
                          {selectedFather.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mother Ring ID
                  </label>

                  <div>
                    <input
                      type="text"
                      {...register("motherRingId")}
                      value={
                        selectedMotherId
                          ? motherList.find((m) => m._id === selectedMotherId)
                              ?.ringNumber || motherRingNumber
                          : motherSearchTerm
                      }
                      onChange={(e) => {
                        setMotherSearchTerm(e.target.value);
                        setSelectedMotherId(""); // reset selection if user types
                        setMotherRingNumber(""); // clear stored ring number
                      }}
                      placeholder="Search mother ring number or name"
                      className="w-full px-3 py-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />

                    <p className="text-xs text-destructive mt-1">
                      Enter a part of the ring or part of the name to search for
                      the corresponding Pigeon
                    </p>

                    {/* Dropdown list */}
                    {motherList?.length > 0 &&
                      !selectedMotherId &&
                      motherSearchTerm && (
                        <ul className="border border-gray-300 rounded mt-1 max-h-40 overflow-auto bg-white z-10 absolute max-w-[410px]">
                          {motherList.map((pigeon) => (
                            <li
                              key={pigeon._id}
                              className="px-3 py-[14px] hover:bg-teal-100 cursor-pointer"
                              onClick={() => {
                                setSelectedMotherId(pigeon.ringNumber); // use _id for backend reference
                                setMotherSearchTerm(pigeon.ringNumber); // but display ringNumber
                                setMotherRingNumber(pigeon.ringNumber);
                                setSelectedMother(pigeon);
                              }}
                            >
                              {pigeon.ringNumber} - {pigeon.name}
                            </li>
                          ))}
                        </ul>
                      )}

                    {/* Selected pigeon info */}
                    {selectedMotherId && selectedMother && (
                      <div className="mt-2 p-2 border border-gray-200 rounded bg-gray-50">
                        <p className="text-sm">
                          <span className="font-medium">Ring:</span>{" "}
                          {selectedMother.ringNumber}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Name:</span>{" "}
                          {selectedMother.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Photo Upload */}
          <div className="bg-white rounded-lg lg:col-span-2 p-6 shadow-sm ">
            <PigeonPhotosSlider
              pigeonPhoto={pigeonPhoto}
              setPigeonPhoto={setPigeonPhoto}
              eyePhoto={eyePhoto}
              setEyePhoto={setEyePhoto}
              ownershipPhoto={ownershipPhoto}
              setOwnershipPhoto={setOwnershipPhoto}
              pedigreePhoto={pedigreePhoto}
              setPedigreePhoto={setPedigreePhoto}
              DNAPhoto={DNAPhoto}
              setDNAPhoto={setDNAPhoto}
              handleSpecificPhotoUpload={handleSpecificPhotoUpload}
              removeSpecificPhoto={removeSpecificPhoto}
              getImageUrl={getImageUrl}
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="mt-8 flex justify-end gap-4">
          {/* Cancel Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/loft-overview")}
            className="lg:px-8 py-6 text-white bg-red-700 hover:bg-red-500 hover:text-white"
          >
            Cancel
          </Button>

          {/* Save Button */}
          <Button
            type="submit"
            disabled={isLoading || duplicateError || isCheckingDuplicate}
            onClick={() => setSubmitAction("save")}
            className="lg:px-8 py-6 text-white bg-accent hover:bg-accent/80"
          >
            {isLoading && submitAction === "save"
              ? isEditMode
                ? "Updating..."
                : "Saving..."
              : isEditMode
              ? "Update Pigeon"
              : "Save New Pigeon"}
          </Button>

          {!isEditMode && (
            <Button
              type="submit"
              disabled={isLoading || duplicateError || isCheckingDuplicate}
              onClick={() => setSubmitAction("saveAndAdd")}
              className="lg:px-8 py-6 text-white bg-accent-foreground hover:bg-accent-foreground/80"
            >
              {isLoading && submitAction === "saveAndAdd"
                ? "Saving..."
                : "Save & Add Another"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddPigeonContainer;
