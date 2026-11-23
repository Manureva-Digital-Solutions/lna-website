import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "border-input file:text-foreground placeholder:text-muted-foreground disabled:bg-input/50 aria-invalid:border-destructive focus-visible:outline-primary h-12 w-full min-w-0 rounded-none border bg-transparent px-4 py-3 text-base leading-6 shadow-none transition-colors file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-normal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  );
}

export { Input };
