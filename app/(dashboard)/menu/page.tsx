import type { Metadata } from "next";
import MenuPage from "@/components/dashboard/menu/page";

export const metadata: Metadata = {
  title: "Menu Management | DZMenu",
  description: "Manage your restaurant dishes, modifiers, categories and pricing on DZMenu.",
};

export default function DashboardMenuPage() {
  return <MenuPage />;
}
