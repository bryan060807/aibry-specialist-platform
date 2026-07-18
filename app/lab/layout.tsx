import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Specialist Lab — AIBRY Specialists OS",
  description:
    "Inspect and evaluate governed specialist capabilities, authority, evidence, and maturity inside AIBRY Specialists OS.",
};

export default function LabLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
