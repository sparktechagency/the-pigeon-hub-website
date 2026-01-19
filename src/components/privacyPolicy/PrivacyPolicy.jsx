"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetSettingQuery } from "@/redux/featured/settings/settingApi";

export default function PrivacyPolicy() {
  const { data } = useGetSettingQuery("privacy-policy");
  const policy = data?.data 
  // console.log(policy)
   
  return (
    <div className="flex  justify-center items-center my-12">
      <Card className="w-full px-4   text-black ">
        <CardHeader className=" border-b border-[#2E2E2EF5]">
          <CardTitle>Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent>
           <div
            dangerouslySetInnerHTML={{ __html: policy }}
            className="prose max-w-none"
          />
        
        </CardContent>
      </Card>
    </div>
  );
}
