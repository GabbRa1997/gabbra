import type { NextConfig } from "next";

// `GABBRA_EXPORT=1 npm run build` writes the whole site as plain files into /out,
// ready for any static host (GitHub Pages, Cloudflare Pages, Netlify).
const exporting = process.env.GABBRA_EXPORT === "1";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  ...(exporting ? { output: "export", trailingSlash: true, images: { unoptimized: true } } : {}),
};

export default nextConfig;
