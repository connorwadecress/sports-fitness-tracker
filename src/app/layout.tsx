import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pitchside",
  description: "Hockey and recovery tracker: log matches, training and physio, follow your rehab, and get a daily summary.",
  applicationName: "Pitchside",
  appleWebApp: { capable: true, title: "Pitchside", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/192", apple: "/icons/apple" },
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
