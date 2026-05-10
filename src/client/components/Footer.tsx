import React from "react";
import { Link } from "wouter";
import { Image as ImageIcon, Github, Twitter, Mail } from "lucide-react";
import logo from "/logo.png";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4 col-span-1 md:col-span-1">
            <Link
              href="/"
              className="group flex items-center gap-3 select-none shrink-0 transition-opacity hover:opacity-90"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-purple-600/50 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-10 h-10 bg-white rounded-full border border-border/50 shadow-sm flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 group-active:scale-95">
                  <img
                    src={logo}
                    alt="logo"
                    className="w-12 h-12 object-contain"
                  />
                </div>
              </div>
              <div className="flex-col hidden md:flex">
                <span className="text-lg font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 group-hover:from-primary group-hover:to-primary/70 transition-all flex items-center gap-1">
                  MediaOpus
                </span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Professional-grade image tools directly in your browser. Private,
              secure, and lightning fast.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Features Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">
              Features
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/compress"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Compress Image
                </Link>
              </li>
              <li>
                <Link
                  href="/removebg"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Remove Background
                </Link>
              </li>
              <li>
                <Link
                  href="/resize"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Resize Image
                </Link>
              </li>
              <li>
                <Link
                  href="/assets"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Asset Generator
                </Link>
              </li>
              <li>
                <Link
                  href="/resize"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Crop & Adjust
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">
              More from Developer
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://nolio.vercel.app"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Nolio
                </a>
              </li>
              <li>
                <a
                  href="https://devfreetools.vercel.app"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  DevFreeTools
                </a>
              </li>
              <li>
                <a
                  href="https://primeranimelist.vercel.app"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  PAL
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} MediaOpus. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span>Designed & Developed by PrimerLabs</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
