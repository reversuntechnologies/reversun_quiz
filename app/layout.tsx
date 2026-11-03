import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://quiz.reversun.com"),
  title: "REVERSUN Quiz Platform — Compete Live, Earn & Verify",
  description:
    "Official public online quiz and competition platform where players participate in scheduled quizzes, compete on live leaderboards, earn cash prizes, and receive verifiable digital certificates.",
  icons: {
    icon: "/REVERSUN ICON.svg",
    apple: "/REVERSUN ICON.svg",
  },
  openGraph: {
    title: "REVERSUN Quiz Platform",
    description: "Official public online quiz and competition platform by REVERSUN",
    images: ["/REVERSUN LOGO.png"],
  },
};

import { UserAuthProvider } from "@/context/UserAuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF9F6] text-[#101E35] font-sans antialiased">
        <UserAuthProvider>
          {children}
        </UserAuthProvider>
      </body>
    </html>
  );
}
