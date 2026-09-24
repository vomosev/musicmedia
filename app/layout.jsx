import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/AuthProvider";
import AppShell from "../components/AppShell";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

export const metadata = {
  metadataBase: new URL("https://musicmedia.arx-app.com"),
  title: {
    default: "MusicMedia | Music Distribution, Publishing & Marketing",
    template: "%s | MusicMedia",
  },
  description:
    "Distribute music, register publishing works, manage marketing campaigns, and review performance from one artist platform.",
  applicationName: "MusicMedia",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://musicmedia.arx-app.com",
    siteName: "MusicMedia",
    title: "MusicMedia | Music Distribution, Publishing & Marketing",
    description:
      "Distribute music, register publishing works, manage marketing campaigns, and review performance from one artist platform.",
  },
  twitter: {
    card: "summary",
    title: "MusicMedia | Music Distribution, Publishing & Marketing",
    description:
      "Distribute music, register publishing works, manage marketing campaigns, and review performance from one artist platform.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
