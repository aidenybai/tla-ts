import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Document } from "@/components/document";

export const metadata: Metadata = {
  title: "TLA-ts playground",
  description: "Formally verify TypeScript code with TLA+.",
  icons: { icon: { url: "/favicon.svg", type: "image/svg+xml" } },
};

interface LayoutProps {
  children: ReactNode;
}

const Layout = (props: LayoutProps) => (
  <Document className="overscroll-none">{props.children}</Document>
);

export default Layout;
