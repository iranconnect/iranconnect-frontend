//pages/admin/add-v2.js
import { useEffect } from "react"; // for test Sentry
import * as Sentry from "@sentry/nextjs"; // for test Sentry
import AdminLayout from "../../components/admin/AdminLayout";
import BusinessWizard from "../../components/admin/BusinessWizard";
import { useSentryPageTags } from "../../hooks/useSentryPageTags";
import { useSentryPageFeature } from "../../hooks/useSentryPageFeature";


export default function AddBusinessV2() {
  const withFeature = useSentryPageFeature("business-wizard-v2");

  useEffect(() => {
    withFeature(() => {
      Sentry.captureMessage("ADD_V2_PAGE_LOADED", {
        level: "info",
      });
    });
  }, []);


  return (
    <AdminLayout>
      <main className="admin-container">
        <BusinessWizard />
      </main>
    </AdminLayout>
  );
}
