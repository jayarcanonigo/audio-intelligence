
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>

      </body>
    </html>
  );
}

