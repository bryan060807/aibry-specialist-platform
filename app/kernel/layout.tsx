import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ASOS Kernel — Living Architecture",
  description:
    "Explore the implemented ASOS Kernel, domain model, Case contract, evidence rules, application boundary, and downstream systems as a living architecture.",
};

export default function KernelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
