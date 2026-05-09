import React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, Sparkles, Image as ImageIcon, Smartphone, Eraser } from 'lucide-react';
import { Button } from './ui/button';
import { Link, useLocation } from 'wouter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const NAV = [
  { href: '/', label: 'Image Processor', icon: ImageIcon },
  { href: '/removebg', label: 'Remove BG', icon: Eraser },
  { href: '/assets', label: 'Asset Generator', icon: Smartphone },
];

export function Header() {
  const { setTheme } = useTheme();
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-2 select-none shrink-0">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent hidden sm:block">
            Image Toolkit
          </span>
          <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground ml-1 uppercase tracking-wider hidden sm:block">
            Local
          </span>
        </div>

        {/* Nav tabs */}
        <nav className="flex items-center gap-1 flex-1 justify-center sm:justify-start sm:ml-4">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? location === '/' : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                data-testid={`nav-${href.replace('/', '') || 'home'}`}
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
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative" data-testid="theme-toggle">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" />System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
