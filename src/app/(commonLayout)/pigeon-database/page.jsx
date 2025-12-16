import PigeonDatabasePage from "@/components/pigeonDatabase/PigeonDatabasePage";
import { Suspense } from "react";

const PigeonDatabase = () => {
  return (
    <div>
      {/* Wrap client component in Suspense so next can prerender without CSR bailout */}
      <Suspense
        fallback={<div className="p-6">base...</div>}
      >
        <PigeonDatabasePage />
      </Suspense>
    </div>
  );
};

export default PigeonDatabase;
