import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Capability Theater — AIBRY Specialists OS",
  description:
    "Inject a business crisis and watch governed AI specialists coordinate, request authority, preserve evidence, and turn work into institutional capability.",
};

export default function TheaterLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
