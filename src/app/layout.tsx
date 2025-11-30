import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/ToastContainer";
import ClientLayout from "@/components/ClientLayout";

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Teylingereind | SportDash - Activiteitenteam",
  description: "Sport & Activiteiten Management Dashboard voor Forensisch Centrum Teylingereind",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={`${sans.variable} ${serif.variable} font-sans bg-gray-50 antialiased`}>
        <AuthProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              forcedTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              <ToastProvider>
                <ClientLayout>
                  {children}
                  <ToastContainer />
                </ClientLayout>
              </ToastProvider>
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
