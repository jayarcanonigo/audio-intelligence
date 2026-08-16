import AppLayout from "@/components/layout/AppLayout";

export default function AppLayoutGroup({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}