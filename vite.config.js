import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunplaVitePlugin } from "./plugins/gunpla.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PORTAL_BASE = "/portal/";

/** Vite base uses a trailing slash; /portal#games requests /portal without it. */
function portalBaseRedirectPlugin() {
  return {
    name: "portal-base-redirect",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        if (url === "/portal" || url.startsWith("/portal?")) {
          const suffix = url.slice("/portal".length);
          res.statusCode = 301;
          res.setHeader("Location", `${PORTAL_BASE}${suffix}`);
          res.end();
          return;
        }
        next();
      });
    },
  };
}

// GitHub Project Pages URL is https://<user>.github.io/<repo>/
// Change this to match your repository name (or "/" for a user site).
export default defineConfig({
  base: PORTAL_BASE,
  plugins: [portalBaseRedirectPlugin(), gunplaVitePlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        dashboard: resolve(__dirname, "dashboard.html"),
        gold: resolve(__dirname, "gold.html"),
        cv: resolve(__dirname, "cv.html"),
      },
    },
  },
});
