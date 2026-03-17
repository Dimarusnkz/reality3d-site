import MaxSettings from "./max-settings";

export default function MaxPage() {
  const isConfigured = !!process.env.MAX_BOT_TOKEN;

  return (
    <div className="container mx-auto max-w-5xl">
       <MaxSettings isConfigured={isConfigured} />
    </div>
  );
}
