import { renderToString } from "react-dom/server";
import { App } from "./app";
import { Providers } from "./components/providers";

export const getAppHtml = () =>
  renderToString(
    <Providers>
      <App />
    </Providers>,
  );
