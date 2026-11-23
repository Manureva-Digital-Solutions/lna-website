"use client";

import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * v4 buttons: 0 radius, no shadow, 48px default.
 * Spec padding 13/64/13/16 applies when a trailing icon is present
 * (`data-icon="inline-end"`). Without an icon, use balanced 16px sides so
 * full-width and compact header CTAs are not clipped.
 */
const buttonVariants = cva(
  "group/button inline-flex items-center justify-center rounded-none border border-transparent text-sm font-normal whitespace-nowrap transition-colors select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-2px] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-pressed",
        outline:
          "border-border bg-background text-foreground hover:bg-gray-10 aria-expanded:bg-gray-10",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-gray-20 aria-expanded:bg-gray-20",
        ghost: "text-primary hover:bg-gray-10 aria-expanded:bg-gray-10",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:outline-destructive",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-12 gap-4 px-4 py-[13px] data-[icon=inline-end]:relative data-[icon=inline-end]:justify-start data-[icon=inline-end]:gap-0 data-[icon=inline-end]:pr-16 data-[icon=inline-end]:pl-4 data-[icon=inline-end]:[&>svg]:absolute data-[icon=inline-end]:[&>svg]:top-1/2 data-[icon=inline-end]:[&>svg]:right-4 data-[icon=inline-end]:[&>svg]:-translate-y-1/2 data-[icon=inline-start]:pl-4 data-[icon=inline-start]:pr-4",
        xs: "h-8 gap-2 px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-10 gap-3 px-4 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-4 px-4 py-[13px] text-sm data-[icon=inline-end]:relative data-[icon=inline-end]:justify-start data-[icon=inline-end]:gap-0 data-[icon=inline-end]:pr-16 data-[icon=inline-end]:pl-4 data-[icon=inline-end]:[&>svg]:absolute data-[icon=inline-end]:[&>svg]:top-1/2 data-[icon=inline-end]:[&>svg]:right-4 data-[icon=inline-end]:[&>svg]:-translate-y-1/2 data-[icon=inline-start]:pl-4 data-[icon=inline-start]:pr-4",
        icon: "size-12 shrink-0 justify-center p-0",
        "icon-xs":
          "size-8 shrink-0 justify-center p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-10 shrink-0 justify-center p-0",
        "icon-lg": "size-12 shrink-0 justify-center p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  nativeButton,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      nativeButton={nativeButton ?? (props.render ? false : undefined)}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

/** Anchor styled as a button — real link semantics (no role="button"). */
function LinkButton({
  href,
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> &
  VariantProps<typeof buttonVariants> & { href: string }) {
  return (
    <Link
      href={href}
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </Link>
  );
}

export { Button, LinkButton, buttonVariants };
