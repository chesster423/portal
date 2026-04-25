import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// GitHub Project Pages URL is https://<user>.github.io/<repo>/
// Change this to match your repository name (or "/" for a user site).
export default defineConfig({
  base: "/chesster-personal/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        dashboard: resolve(__dirname, "dashboard.html"),
      },
    },
  },
});
