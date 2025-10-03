import * as esbuild from "esbuild";
import { rawQueryParamPlugin } from "./r628/src-node/esbuild-raw-query-param";

const ctx = await esbuild.context({
  outdir: "build",
  entryPoints: ["src/index.ts"],
  bundle: true,
  sourcemap: true,
  plugins: [rawQueryParamPlugin],
  format: "esm",
});

await ctx.watch();
