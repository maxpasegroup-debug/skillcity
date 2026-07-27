import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, label, error, id, ...props }, ref) => {
  const inputId = id ?? props.name;
  return (
    <label className="block" htmlFor={inputId}>
      <span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span>
      <input
        id={inputId}
        ref={ref}
        className={cn(
          "h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-base text-brand-dark transition placeholder:text-brand-muted/70 focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10",
          error && "border-brand-red",
          className
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? <span className="mt-2 block text-sm font-semibold text-brand-red">{error}</span> : null}
    </label>
  );
});
Input.displayName = "Input";

export { Input };
