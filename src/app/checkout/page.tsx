import type { Metadata } from "next";
import CheckoutPageContent from "@/components/CheckoutPageContent";

export const metadata: Metadata = {
  title: "Checkout — DeadEgos",
  description: "Complete your DeadEgos order",
};

export default function CheckoutPage() {
  return <CheckoutPageContent />;
}
