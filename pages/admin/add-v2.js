//pages/admin/add-v2.js
import { useEffect } from "react"; // for test Sentry
import * as Sentry from "@sentry/nextjs"; // for test Sentry
import AdminLayout from "../../components/admin/AdminLayout";
import BusinessWizard from "../../components/admin/BusinessWizard";
import { useSentryPageTags } from "../../hooks/useSentryPageTags";


export default function AddBusinessV2() {
  useSentryPageTags({
    feature: "business-wizard-v2",
  });

  // for test Sentry
  useEffect(() => {
    Sentry.captureMessage("ADD_V2_PAGE_LOADED_TEST");
  }, []);


  return (
    <AdminLayout>
      <main className="admin-container">
        <BusinessWizard />
      </main>
    </AdminLayout>
  );
}
