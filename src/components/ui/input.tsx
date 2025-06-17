import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  // Note: `value` here is the prop passed TO THIS Input component.
  // `...props` will contain other attributes.
  ({ className, type, value, ...props }, ref) => {
    if (type === "file") {
      // For file inputs, we should not pass the 'value' prop to the native <input> element.
      // The browser handles the value of file inputs, and form libraries like React Hook Form
      // get the selected file(s) via the 'onChange' event.
      // We explicitly exclude 'value' from being passed down.
      // The `value` variable destructured from the component's signature is effectively ignored here.
      // We also need to ensure that if `value` is present in the `...props` spread, it's also not passed.
      const { value: _, ...restWithoutValueFromProps } = props;

      return (
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          {...restWithoutValueFromProps} // Pass all other props, ensuring 'value' from a spread is excluded.
        />
      );
    }

    // For all other input types:
    return (
      <input
        type={type}
        value={value ?? ''} // Ensure the input is controlled and has at least an empty string value.
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props} // Pass all props, including 'value' which is now guaranteed to be a string.
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
