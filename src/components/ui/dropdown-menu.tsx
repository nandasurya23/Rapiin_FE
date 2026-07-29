"use client";

import React, { useState, useRef, useEffect, useContext, createContext } from "react";
import { cn } from "@/lib/cn";

const DropdownMenuContext = createContext<{
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block text-left" ref={containerRef}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  className,
  asChild = false,
}: {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}) {
  const { isOpen, setIsOpen } = useContext(DropdownMenuContext);

  const handleClick = (e?: React.MouseEvent) => {
    setIsOpen((prev) => !prev);
  };

  if (asChild && React.isValidElement(children)) {
    const childElement = children as React.ReactElement<{ onClick?: (e?: React.MouseEvent) => void; "aria-haspopup"?: string; "aria-expanded"?: boolean }>;
    return React.cloneElement(childElement, {
      onClick: (e?: React.MouseEvent) => {
        handleClick(e);
        if (childElement.props.onClick) {
          childElement.props.onClick(e);
        }
      },
      "aria-haspopup": "menu",
      "aria-expanded": isOpen,
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      className={cn(
        "flex items-center justify-center p-2 rounded-md transition-colors",
        "hover:bg-[var(--color-surface-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  className,
  align = "right",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  const { isOpen } = useContext(DropdownMenuContext);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute z-50 mt-1 min-w-[180px] rounded-[var(--radius-lg)] border border-[var(--color-border)]",
        "bg-[var(--color-surface)] shadow-md animate-in fade-in zoom-in-95 duration-200",
        align === "right" ? "right-0" : "left-0",
        className
      )}
      role="menu"
    >
      <div className="py-1">
        {children}
      </div>
    </div>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  const { setIsOpen } = useContext(DropdownMenuContext);

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onClick?.();
        setIsOpen(false);
      }}
      className={cn(
        "flex items-center w-full text-left px-4 py-2 text-sm font-medium transition-colors",
        "text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]",
        "focus:bg-[var(--color-surface-elevated)] focus:outline-none",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}
