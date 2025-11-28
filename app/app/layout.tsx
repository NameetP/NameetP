export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-xl font-bold">Factory OS</div>
          <div className="text-sm text-gray-400">
            Free Tier: <span className="text-white font-medium">20/20 leads remaining</span>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
