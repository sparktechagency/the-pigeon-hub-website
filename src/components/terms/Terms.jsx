"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetSettingQuery } from "@/redux/featured/settings/settingApi";

export default function Terms() {
  const { data } = useGetSettingQuery();
  const terms = data?.data;
  // console.log("terms", terms);
  return (
    <div className="flex  justify-center items-center my-12">
      <Card className="w-full px-4   text-black ">
        <CardHeader className=" border-b border-[#2E2E2EF5] text-2xl font-bold">
          <CardTitle>Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            dangerouslySetInnerHTML={{ __html: terms?.content }}
            className="prose max-w-none"
          />
        </CardContent>
      </Card>
    </div>
  );
}
