
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import { ColorProvider } from "@/lib/color-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Market Intelligence Dashboard",
  description: "Advanced market intelligence and analytics platform",
}

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <div className="error-boundary">
      {children}
    </div>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ColorProvider>
              <AuthProvider>
                {children}
                <Toaster />
              </AuthProvider>
            </ColorProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
