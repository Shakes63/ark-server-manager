"use client";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { usePathname } from "next/navigation";
import { LogOut, Boxes, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function AppHeader() {
  const { token, logout } = useAuth();
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/setup") return null;

  return (
    <header className="border-b border-ark-border bg-ark-panel">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-slate-100">
            <Logo className="h-6 w-6" />
            Palisade
          </Link>
          {token && (
            <nav className="flex items-center gap-4 text-sm text-slate-400">
              <Link href="/" className="hover:text-slate-200">
                Servers
              </Link>
              <Link href="/clusters" className="flex items-center gap-1 hover:text-slate-200">
                <Boxes className="h-4 w-4" /> Clusters
              </Link>
              <Link href="/settings" className="flex items-center gap-1 hover:text-slate-200">
                <Settings className="h-4 w-4" /> Settings
              </Link>
            </nav>
          )}
        </div>
        {token && (
          <button onClick={logout} className="btn-secondary">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        )}
      </div>
    </header>
  );
}
