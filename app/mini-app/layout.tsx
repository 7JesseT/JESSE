import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Base Daily - Mini Tip Jar",
  description: "Compact tip jar for Base mobile app",
  viewport: "width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover",
  themeColor: "#0052FF",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Base Daily",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
}

export default function MiniAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
