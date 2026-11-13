import { renderToString } from "react-dom/server";
import { App } from "./app";
import { Providers } from "./components/providers";
import { PlaygroundPage } from "./playground-page";

export const getAppHtml = () =>
  renderToString(
    <Providers>
      <App />
    </Providers>,
  );

export const getPlaygroundHtml = () =>
  renderToString(
    <Providers>
      <PlaygroundPage />
    </Providers>,
  );
