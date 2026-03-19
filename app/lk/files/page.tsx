import { getClientFiles } from "@/app/actions/orders";
import FilesClient from "./files-client";

export default async function LkFilesPage() {
  const files = await getClientFiles();

  return (
    <div className="h-full flex flex-col">
      <FilesClient initialFiles={files as any[]} />
    </div>
  );
}
