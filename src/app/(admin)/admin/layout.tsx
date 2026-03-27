import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>
      <main className="flex-1 overflow-y-auto bg-surface p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
