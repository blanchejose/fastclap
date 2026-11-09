import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // AUTH-04 : une photo de 2 Mo au plus passe par une Server Action ; la
    // limite exacte est vérifiée côté serveur (src/lib/avatar.ts).
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
