import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppLayout>
          {children}
        </AppLayout>

        <ToastContainer
          position="top-right"
          autoClose={2000}
          theme="colored"
        />
      </body>
    </html>
  );
}