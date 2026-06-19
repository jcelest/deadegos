"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CartLink from "@/components/CartLink";

const links = [
  { href: "/", label: "HOME" },
  { href: "/shop", label: "SHOP" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <div className="flex items-center gap-3">
        <CartLink />
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center text-white/80 transition-colors hover:text-[var(--color-de-primary)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-6 w-6"
            aria-hidden="true"
          >
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
            ) : (
              <>
                <path strokeLinecap="round" d="M4 7h16" />
                <path strokeLinecap="round" d="M4 12h16" />
                <path strokeLinecap="round" d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            className="fixed inset-0 top-[65px] z-40 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <nav className="fixed left-0 right-0 top-[65px] z-50 border-b border-white/10 bg-black/95 px-6 py-6">
            <ul className="space-y-4">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-2 text-base tracking-widest text-white/80 transition-colors hover:text-[var(--color-de-primary)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
