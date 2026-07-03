import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import faviconUrl from "@assets/image_1783062400058.png";

const iconLink =
  (document.querySelector("link[rel~='icon']") as HTMLLinkElement | null) ??
  (() => {
    const el = document.createElement("link");
    el.rel = "icon";
    document.head.appendChild(el);
    return el;
  })();
iconLink.type = "image/png";
iconLink.href = faviconUrl;

createRoot(document.getElementById("root")!).render(<App />);
