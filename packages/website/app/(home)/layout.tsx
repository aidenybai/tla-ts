import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Document } from "@/components/document";

export const metadata: Metadata = {
  title: "TLA-ts",
  description: "Formally verify TypeScript code with TLA+.",
  icons: { icon: { url: "/favicon.svg", type: "image/svg+xml" } },
  alternates: { types: { "text/markdown": "/index.md" } },
};

interface LayoutProps {
  children: ReactNode;
}

const Layout = (props: LayoutProps) => <Document>{props.children}</Document>;

export default Layout;
