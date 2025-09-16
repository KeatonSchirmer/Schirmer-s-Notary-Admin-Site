"use client";
import { Geist, Geist_Mono } from "next/font/google";
import Link from 'next/link';
import { usePathname } from "next/navigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/";

  return (
    <html lang="en" className="h-full">
      <head>
  <title>Schirmer&apos;s Admin</title>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full flex flex-col`}
      >
        {!isLoginPage && (
          <header className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
              <nav className="space-x-6">
                <Link href="/dashboard" className="hover:text-green-700">Dashboard</Link>
                <Link href="/clients" className="hover:text-green-700">Clients</Link>
                <Link href="/requests" className="hover:text-green-700">Jobs</Link>
                <Link href="/calendar" className="hover:text-green-700">Calendar</Link>
                <Link href="/journal" className="hover:text-green-700">Journal</Link>
                <Link href="/finances" className="hover:text-green-700">Finances</Link>
                <Link href="/mileage" className="hover:text-green-700">Mileage</Link>
                <Link href="/account" className="hover:text-green-700">Account</Link>
              </nav>
            </div>
          </header>
        )}

        <main className="flex-grow">{children}</main>
      </body>
    </html>
  );
}
