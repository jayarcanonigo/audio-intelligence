
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import SessionTimeout from "@/components/auth/SessionTimeout";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <SessionTimeout />

        <Navbar />

        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
          }}
        />
      </body>
    </html>
  );
}

