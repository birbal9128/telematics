"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { authClient } from "@/lib/auth/client";
import { useUser } from "@/hooks/use-user";

/* ---------- small helpers ---------- */

function getInitials(first?: string, last?: string, email?: string) {
  const letters = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.trim();
  return (letters || email?.[0] || "?").toUpperCase();
}

function Avatar({ initials, size }: { initials: string; size: "sm" | "lg" }) {
  const dims = size === "lg" ? "h-12 w-12 text-base" : "h-9 w-9 text-theme-sm";
  return (
    <span
      aria-hidden
      className={`${dims} inline-flex shrink-0 items-center justify-center rounded-full bg-brand-500 font-semibold text-white`}
    >
      {initials}
    </span>
  );
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const UserIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c.8-3.4 3.6-5 7-5s6.2 1.6 7 5" />
  </svg>
);
const SettingsIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);
const HelpIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7" />
    <circle cx="12" cy="17" r=".6" fill="currentColor" />
  </svg>
);
const SignOutIcon = () => (
  <svg {...iconProps}>
    <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
    <path d="M16 8l4 4-4 4" />
    <path d="M20 12H9" />
  </svg>
);
const CopyIcon = () => (
  <svg {...iconProps} width={14} height={14}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </svg>
);
const CheckIcon = () => (
  <svg {...iconProps} width={14} height={14}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
const Chevron = ({ open }: { open: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 18 20"
    fill="none"
    aria-hidden
    className={`stroke-gray-500 transition-transform duration-200 dark:stroke-gray-400 ${
      open ? "rotate-180" : ""
    }`}
  >
    <path
      d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const menuItemClass =
  "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-theme-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:text-gray-300 dark:hover:bg-white/5";

/* ---------- component ---------- */

export default function UserDropdown() {
  const router = useRouter();
  const { user, isLoading, checkSession } = useUser();

  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [copied, setCopied] = useState(false);

  const closeDropdown = useCallback(() => setIsOpen(false), []);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      const { error } = await authClient.signOut();
      if (error) return;

      await checkSession?.();
      // UserProvider doesn't refresh the router, so do it manually.
      // AuthGuard handles the redirect afterwards.
      router.refresh();
    } catch (err) {
      console.error("Sign out error", err);
    } finally {
      setIsSigningOut(false);
    }
  }, [checkSession, router]);

  const copyEin = useCallback(async () => {
    if (!user?.ein) return;
    try {
      await navigator.clipboard.writeText(String(user.ein));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }, [user?.ein]);

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
  const initials = getInitials(user?.first_name, user?.last_name, user?.email);

  // Loading skeleton keeps the header from jumping
  if (isLoading && !user) {
    return (
      <div className="flex items-center gap-3" aria-busy>
        <span className="h-9 w-9 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
        <span className="hidden h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800 sm:block" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((p) => !p);
        }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="dropdown-toggle flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:hover:bg-white/5"
      >
        <Avatar initials={initials} size="sm" />
        <span className="hidden max-w-[140px] truncate text-theme-sm font-medium text-gray-700 dark:text-gray-300 sm:block">
          {fullName || user?.email}
        </span>
        <Chevron open={isOpen} />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-3 flex w-[280px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        {/* Identity */}
        <div className="flex items-center gap-3 px-4 pb-4 pt-4">
         
          <div className="min-w-0">
            <p className="truncate text-theme-sm font-semibold text-gray-800 dark:text-white/90">
              {fullName || "Your account"}
            </p>
            <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
              {user?.email}
            </p>
          </div>
        </div>

        {/* EIN row */}
        {user?.ein && (
          <div className="mx-4 mb-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
            <div className="min-w-0">
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">EIN</p>
              
            </div>
           <p className="truncate font-mono text-theme-sm text-gray-800 dark:text-white/90">
                {user.ein}
              </p>
          </div>
        )}



        {/* Sign out */}
        <div className="border-t border-gray-200 p-2 dark:border-gray-800">
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-theme-sm font-medium text-error-600 transition-colors hover:bg-error-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:text-error-400 dark:hover:bg-error-500/10"
          >
            <SignOutIcon />
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </Dropdown>
    </div>
  );
}