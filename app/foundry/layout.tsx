import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workforce Foundry — AIBRY Specialists OS",
  description:
    "Design a governed specialist workforce for your organization, inspect every role contract, stress-test its Constitution, and export the blueprint.",
};

export default function FoundryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
