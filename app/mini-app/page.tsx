"use client"

import { MiniTipJar } from "@/components/mini-tipjar"
import Link from "next/link"

export default function MiniAppPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Compact header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center px-4">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">B</span>
              </div>
              <span className="hidden font-bold sm:inline-block">Base Daily</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <span className="text-sm text-muted-foreground">Mini Tip Jar</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container max-w-md mx-auto px-4 py-6 space-y-6">
        <MiniTipJar />
        
        {/* Small link to full site */}
        <div className="text-center pt-4">
          <Link 
            href="/" 
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Open full site
          </Link>
        </div>
      </main>
    </div>
  )
}
