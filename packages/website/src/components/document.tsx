import type { ReactNode } from "react";
import "../index.css";
import { Providers } from "./providers";

// Runs before the first paint, so a visitor who chose the dark theme never sees the light one.
const THEME_SCRIPT = `if (
  document.documentElement.classList.toggle(
    "dark",
    (localStorage.getItem("tla-ts-theme") ??
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark",
  )
)
  document.querySelector('meta[name="theme-color"]').content = "#111110";`;

interface DocumentProps {
  className?: string;
  children: ReactNode;
}

export const Document = (props: DocumentProps) => (
  <html lang="en" className={props.className} suppressHydrationWarning>
    <head>
      <meta name="theme-color" content="#fdfdfc" />
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
    </head>
    <body>
      <Providers>{props.children}</Providers>
    </body>
  </html>
);
