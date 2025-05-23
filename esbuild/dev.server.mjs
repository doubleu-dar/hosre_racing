import esbuildServe from "esbuild-serve";
import inlineImage from "esbuild-plugin-inline-image";

esbuildServe(
  {
    logLevel: "info",
    entryPoints: ["src/main.ts"],
    bundle: true,
    outfile: "docs/bundle.min.js",
    plugins: [inlineImage()],
  },
  { root: "docs", port: 8080 }
);
