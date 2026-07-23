import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
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