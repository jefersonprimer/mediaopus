import React from "react";
import { Link } from "wouter";
import { Image as ImageIcon, Github, Twitter, Mail } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4 col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-primary p-1.5 rounded-lg">
                <ImageIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl tracking-tight">ImageToolkit</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Professional-grade image tools directly in your browser. Private, secure, and lightning fast.
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Features Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">Features</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/removebg" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Remove Background
                </Link>
              </li>
              <li>
                <Link href="/resize" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Resize Image
                </Link>
              </li>
              <li>
                <Link href="/assets" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Asset Generator
                </Link>
              </li>
              <li>
                <Link href="/resize" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Crop & Adjust
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">Company</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">About Us</a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</a>
              </li>
            </ul>
          </div>

          {/* Newsletter Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">Newsletter</h3>
            <p className="text-sm text-muted-foreground">
              Stay updated with the latest tools and features.
            </p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email address" 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} ImageToolkit. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span>Made with ❤️ for the web</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
