//pages/admin/add-v2.js
import AdminLayout from "../../../components/admin/AdminLayout";
import BusinessWizard from "../../../components/admin/BusinessWizard";

export default function AddBusinessV2() {
  return (
    <AdminLayout>
      <main className="admin-container">
        <h2 className="admin-title mb-4">
          Add New Business (Advanced)
        </h2>

        <BusinessWizard />
      </main>
    </AdminLayout>
  );
}
