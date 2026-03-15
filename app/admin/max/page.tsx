import MaxSettings from "./max-settings";

export default function MaxPage() {
  const botToken = process.env.MAX_BOT_TOKEN || "Not Set";

  return (
    <div className="container mx-auto max-w-5xl">
       <MaxSettings botToken={botToken} />
    </div>
  );
}
