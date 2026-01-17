import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  // Note: `value` here is the prop passed TO THIS Input component.
  // `...props` will contain other attributes.
  ({ className, type, value, ...props }, ref) => {
    if (type === "file") {
      // For file inputs, remove any value prop before passing it to the native element.
      const { value: _ignored, ...restWithoutValue } =
        props as React.ComponentProps<"input">;

      return (
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          {...restWithoutValue}
        />
      );
    }

    const coercedValue =
      value === undefined
        ? undefined
        : value === null
        ? ""
        : typeof value === "string"
        ? value
        : Array.isArray(value)
        ? value.join(", ")
        : String(value);

    return (
      <input
        type={type}
        {...(coercedValue !== undefined ? { value: coercedValue } : {})}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
