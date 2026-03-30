"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonClassNameOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonClassNameOptions {}

const BASE_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-semibold tracking-tight transition-all duration-200 disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/25 focus-visible:ring-offset-2";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-rose-700 text-white shadow-sm hover:bg-rose-800",
  secondary: "bg-emerald-700 text-white shadow-sm hover:bg-emerald-800",
  ghost: "border border-neutral-300 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50",
  danger: "bg-red-700 text-white shadow-sm hover:bg-red-800",
  outline: "border border-neutral-300 bg-transparent text-neutral-700 hover:bg-neutral-100",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs uppercase tracking-[0.14em]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: ButtonClassNameOptions = {}) {
  return joinClasses(BASE_BUTTON_CLASS, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClassName({ variant, size, className })}
      {...props}
    />
  );
});
