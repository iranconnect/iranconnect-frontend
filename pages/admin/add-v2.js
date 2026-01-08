//pages/admin/add-v2.js
import AdminLayout from "../../components/admin/AdminLayout";
import BusinessWizard from "../../components/admin/BusinessWizard";
import { useSentryPageLoad } from "../../hooks/useSentryPageLoad";

export default function AddBusinessV2() {
  useSentryPageLoad("ADMIN_ADD_V2_PAGE_LOADED", {
    level: "error", // برای تست
    tags: {
      feature: "business-wizard-v2",
    },
  });

  return (
    <AdminLayout>
      <main className="admin-container">
        <BusinessWizard />
      </main>
    </AdminLayout>
  );
}
