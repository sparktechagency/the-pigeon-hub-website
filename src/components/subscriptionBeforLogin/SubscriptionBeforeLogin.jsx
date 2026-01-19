"use client";
import React from "react";
import { Check, X } from "lucide-react";
import { useGetWebPackagesQuery } from "@/redux/featured/Package/packageApi";
import { useMyProfileQuery } from "@/redux/featured/auth/authApi";
import Spinner from "@/app/(commonLayout)/Spinner";
import { useRouter } from "next/navigation";

const SubscriptionBeforeLogin = () => {
  const { data: userData } = useMyProfileQuery();
  const router = useRouter();
  const { data, isLoading } = useGetWebPackagesQuery();
  const packages = data?.data;
  const usedFreeTrial = userData?.hasUsedFreeTrial;
  // Static features for free plan
  const freeFeatures = [
    { text: "100+ of PNG & SVG Uploaded Pictures", included: true },
    { text: "Access to 4 Generation Details", included: true },
    { text: "Upload custom icons and fonts", included: false },
    { text: "Unlimited Sharing", included: false },
    { text: "Upload graphics & video in up to 4K", included: false },
    { text: "Unlimited Projects", included: false },
    { text: "Instant Access to our design system", included: false },
    { text: "Create teams to collaborate on designs", included: false },
  ];

  const handlePurchaseClick = (paymentLink) => {
    // Check if user is already subscribed
    if (!userData) {
      router.push("/login");
      return;
    }

    if (paymentLink) {
      router.push(`${paymentLink}?prefilled_email=${userData?.email}`);
    }
  };

  if (isLoading) return   <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>;

  return (
    <div className="mb-6 xl:mb-16 mt-6 xl:mt-10 px-4 md:px-8 lg:px-12">
      <div className=" mx-auto">
        {/* Header */}
        <div className="text-center mb-1 xl:mb-4">
          <h1 className="text-xl md:text-2xl xl:text-3xl font-bold mb- text-accent ">
          Choose Your Subscription Plan
            {/* <span className="text-accent-foreground">Prices</span> */}
          </h1>
          <p className="text-destructive text-2xl max-w-2xl mx-auto leading-relaxed">
         ThePigeonHub.Com
          </p>
        </div>

        {/* Pricing Cards */}
       <div className="grid md:grid-cols-3 gap-4 lg:gap-6 xl:gap-8 mx-auto">
  {packages && packages.length > 0 ? (
    packages.map((packageItem, index) => {
     
      const isFree = index === 0;

      return (
        <div
          key={packageItem._id || index}
          className="bg-[#088395] rounded-md p-4 lg:p-4 xl:p-8 shadow-xl hover:shadow-2xl hover:bg-accent transition-all duration-300 text-white relative overflow-hidden flex flex-col"
        >
          <div className="flex-grow">
            <div className="relative z-10 text-center">
              <h3 className="text-xl xl:text-2xl font-bold xl:mb-1">
                {isFree ? "Free Trial - 1 Month" : packageItem.title}
              </h3>
              <div className="flex items-baseline justify-center mb-0">
                <span className="text-xl xl:text-2xl font-bold">
                  ${isFree ? 0 : packageItem.price}
                </span>
                <span className="text-teal-200 ml-2">
                  / {packageItem.paymentType}
                </span>
              </div>

              <div className="h-8 flex items-center justify-center">
                <p className="text-teal-100">
                  {packageItem?.description || ""}
                </p>
              </div>
            </div>

            <div className="space-y-1 xl:space-y-4 mb-2 xl:mb-6 relative z-10">
              {packageItem.features?.map((feature, featureIndex) => {
                const isEnabled = isFree ? featureIndex < 4 : true;

                return (
                  <div
                    key={featureIndex}
                    className="flex items-start gap-3"
                  >
                    <div
                      className={`${
                        isEnabled ? "bg-white/20" : "bg-red-500/20"
                      } rounded-full p-1 mt-0.5`}
                    >
                      {isEnabled ? (
                        <Check className="w-2 xl:w-4 h-2 xl:h-4" />
                      ) : (
                        <X className="w-2 xl:w-4 h-2 xl:h-4" />
                      )}
                    </div>
                    <span
                      className={`text-xs xl:text-sm ${
                        isEnabled ? "text-white/90" : "text-white/50"
                      }`}
                    >
                      {feature}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => handlePurchaseClick(packageItem.paymentLink)}
            disabled={isFree && userData?.hasUsedFreeTrial}
            className={`w-full py-2 xl:py-3 px-6 rounded-sm font-semibold transition-colors duration-300 shadow-md mt-auto relative z-10
              ${
                isFree && userData?.hasUsedFreeTrial
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-white text-teal-600 hover:bg-[#088395] hover:text-white hover:shadow-lg cursor-pointer"
              }`}
          >
            {isFree && userData?.hasUsedFreeTrial
              ? "Already Trialed"
              : isFree
              ? "30 Days Free Trial"
              : "Purchase Now"}
          </button>
        </div>
      );
    })
  ) : (
    <div className="bg-gradient-to-br w-full from-gray-400 to-gray-500 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden flex items-center justify-center">
      <div className="text-center">
        <p>No package available</p>
      </div>
    </div>
  )}
</div>

      </div>
    </div>
  );
};

export default SubscriptionBeforeLogin;
