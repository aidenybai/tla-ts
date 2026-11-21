import type { ComponentType } from "react";
import { renderToString } from "react-dom/server";
import Layout from "@/app/layout";
import { getPageFile } from "./router";

const pages = import.meta.glob<ComponentType>("./app/**/page.tsx", {
  import: "default",
  eager: true,
});

export const getHtml = (route: string) => {
  const Page = pages[getPageFile(route)];
  return renderToString(
    <Layout>
      <Page />
    </Layout>,
  );
};
