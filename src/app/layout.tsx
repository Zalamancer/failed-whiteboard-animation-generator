import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProAnimate - Video Editor",
  description: "Professional video editor powered by PixiJS WebGL2/WebGPU",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
