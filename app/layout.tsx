import type { Metadata } from "next";
import "./globals.css";
import "./storefront.css";

export const metadata:Metadata={title:"THREE D HOUSE | Designed in Layers",description:"Premium 3D-printed home, desk, kitchen and personalised products made in India."};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
