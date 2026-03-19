import ClientsTable from "./clients-table";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminClientsPage() {
  const session = await getSession();
  
  if (!session || (session.role !== 'admin' && session.role !== 'manager')) {
    redirect('/login');
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Клиенты</h1>
          <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px]">CRM & User Management</p>
        </div>
      </div>
      
      <ClientsTable currentUserRole={session.role} />
    </div>
  );
}
