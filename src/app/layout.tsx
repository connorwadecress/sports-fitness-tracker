import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const description = "Log hockey matches, training and physio in under a minute, follow your rehab, and get a daily summary that tells you when to rest and when to do more.";

export const metadata: Metadata = {
  metadataBase: new URL("https://sports-fitness-tracker.vercel.app"),
  title: { default: "Pitchside: hockey and recovery tracker", template: "%s · Pitchside" },
  description,
  openGraph: { title: "Pitchside: hockey and recovery tracker", description, siteName: "Pitchside", type: "website", locale: "en_ZA" },
  twitter: { card: "summary_large_image", title: "Pitchside: hockey and recovery tracker", description },
  applicationName: "Pitchside",
  appleWebApp: { capable: true, title: "Pitchside", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icons/192", type: "image/png", sizes: "192x192" }],
    apple: "/icons/apple",
  },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1B3FAE" },
    { media: "(prefers-color-scheme: dark)", color: "#0A1230" },
  ],
};

// Apply the saved theme before first paint so there's no flash.
const themeScript = `try{var t=localStorage.getItem("pitchside-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-ZA" className={archivo.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
