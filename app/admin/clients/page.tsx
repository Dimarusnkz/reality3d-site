import ClientsTable from "./clients-table";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminClientsPage() {
  const session = await getSession();
  
  if (!session || (session.role !== 'admin' && session.role !== 'manager')) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-white mb-2">Клиенты</h1>
           <p className="text-gray-400">Управление базой клиентов и история заказов.</p>
        </div>
      </div>
      
      <ClientsTable currentUserRole={session.role} />
    </div>
  );
}
