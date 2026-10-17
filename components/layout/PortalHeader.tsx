"use client";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function PortalHeader({ label = "FixFlow AI" }: { label?: string }) {
  return (
    <header className="portal-header">
      <div className="portal-brand">
        <b>{label}</b>
      </div>
      <button onClick={() => signOut({ callbackUrl: "/login" })}>
        <LogOut size={15} /> Sign out
      </button>
    </header>
  );
}
