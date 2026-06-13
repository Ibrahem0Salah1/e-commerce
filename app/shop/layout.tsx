import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google"
import "../globals.css";
const ibm = IBM_Plex_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-sans",
})
export const metadata: Metadata = {
    title: "Shop - MDS",
    description: "Explore our wide range of dental products at MDS Shop.",
};
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html suppressHydrationWarning
            lang="en"
            className={`${ibm.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                {children}
            </body>
        </html>
    );
}
