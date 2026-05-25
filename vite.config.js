import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunplaRollupInputs, gunplaVitePlugin } from "./plugins/gunpla.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// GitHub Project Pages URL is https://<user>.github.io/<repo>/
// Change this to match your repository name (or "/" for a user site).
export default defineConfig({
  base: "/portal/",
  plugins: [gunplaVitePlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        dashboard: resolve(__dirname, "dashboard.html"),
        review: resolve(__dirname, "review.html"),
        gunpla: resolve(__dirname, "gunpla.html"),
        gold: resolve(__dirname, "gold.html"),
        cv: resolve(__dirname, "cv.html"),
        ...gunplaRollupInputs(),
      },
    },
  },
});
