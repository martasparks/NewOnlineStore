import AlertMessage from "@/components/AlertMessage"
import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import { AuthProvider } from "@/contexts/AuthContext"
import "./globals.css";

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Martas Mēbeles",
  description: "Mēbeļu veikals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lv">
      <body
        className={`${montserrat.variable} font-sans antialiased`}
      >
        <AuthProvider>
        <AlertMessage />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}