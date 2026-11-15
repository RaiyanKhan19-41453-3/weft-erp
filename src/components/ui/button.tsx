import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-control font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-ink text-surface shadow-sm hover:bg-ink/88 active:bg-ink dark:bg-ink dark:text-canvas dark:hover:bg-ink/85",
        brand:
          "bg-brand text-white shadow-sm hover:bg-brand/90 active:bg-brand dark:text-[#07120e]",
        outline:
          "border border-line-strong bg-surface text-ink shadow-xs hover:bg-raised hover:border-line-strong",
        subtle: "bg-sunken text-ink hover:bg-line",
        ghost: "text-muted hover:bg-sunken hover:text-ink",
        danger: "bg-danger text-white hover:bg-danger/90",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-7 px-2.5 text-[12px] [&_svg]:size-3.5",
        default: "h-8 px-3 text-[12.5px] [&_svg]:size-4",
        md: "h-9 px-3.5 text-[13px] [&_svg]:size-4",
        lg: "h-10 px-4 text-[13px] [&_svg]:size-4",
        icon: "size-8 [&_svg]:size-4",
        "icon-sm": "size-7 [&_svg]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

export { buttonVariants };
