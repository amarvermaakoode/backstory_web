export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-neutral-900 text-white font-sans">
      <div className="flex-1 flex flex-col">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
