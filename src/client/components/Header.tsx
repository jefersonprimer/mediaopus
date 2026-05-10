import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
  Monitor,
  Image as ImageIcon,
  Smartphone,
  Eraser,
  FileImage,
  Zap,
  Scissors,
} from "lucide-react";
import { Button } from "./ui/button";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

import logo from "/logo.png";

const NAV = [
  { href: "/compress", label: "Compress", icon: Zap },
  { href: "/resize", label: "Resize", icon: ImageIcon },
  { href: "/crop", label: "Crop", icon: Scissors },
  { href: "/removebg", label: "Remove BG", icon: Eraser },
  { href: "/convert", label: "Convert", icon: FileImage },
  { href: "/assets", label: "Assets", icon: Smartphone },
];

export function Header() {
  const { setTheme } = useTheme();
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-3 select-none shrink-0 transition-opacity hover:opacity-90"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-purple-600/50 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-10 h-10 bg-white rounded-xl border border-border/50 shadow-sm flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 group-active:scale-95">
              <img src={logo} alt="logo" className="w-12 h-12 object-contain" />
            </div>
          </div>
          <div className="flex-col hidden md:flex">
            <span className="text-lg font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 group-hover:from-primary group-hover:to-primary/70 transition-all flex items-center gap-1">
              MediaOpus
            </span>
          </div>
        </Link>

        {/* Nav tabs */}
        <nav className="flex items-center gap-1 flex-1 justify-center sm:justify-start sm:ml-4">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                data-testid={`nav-${href.replace("/", "") || "home"}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full relative"
                data-testid="theme-toggle"
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
