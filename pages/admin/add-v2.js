//pages/admin/add-v2.js
import AdminLayout from "../../components/admin/AdminLayout";
import BusinessWizard from "../../components/admin/BusinessWizard";
import { useSentryPageTags } from "../../hooks/useSentryPageTags";

export default function AddBusinessV2() {
  useSentryPageTags({
    feature: "business-wizard-v2",
  });

  return (
    <AdminLayout>
      <main className="admin-container">
        <BusinessWizard />
      </main>
    </AdminLayout>
  );
}
