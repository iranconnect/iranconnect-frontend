//pages/admin/add-v2.js
import AdminLayout from "../../components/admin/AdminLayout";
import BusinessWizard from "../../components/admin/BusinessWizard";

export default function AddBusinessV2() {
  return (
    <AdminLayout>
      <main className="admin-container">
        <BusinessWizard />
      </main>
    </AdminLayout>
  );
}
