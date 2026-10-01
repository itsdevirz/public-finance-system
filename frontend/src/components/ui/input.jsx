import * as React from "react";
import { cn } from "@/lib/utils";

function isZeroVal(val) {
  if (val == null) return false;
  const s = String(val).trim();
  return s === "0" || s === "۰" || s === "0.00" || s === "۰.۰۰" || s === "00";
}

const Input = React.forwardRef(({ className, type, onFocus, onKeyDown, ...props }, ref) => {
  const handleFocus = (e) => {
    if (isZeroVal(e.target.value)) {
      setTimeout(() => {
        try {
          e.target.select();
        } catch (_) {}
      }, 0);
    }
    if (onFocus) onFocus(e);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Backspace" || e.code === "Backspace") {
      if (isZeroVal(e.target.value)) {
        e.preventDefault();
        const valueSetter = Object.getOwnPropertyDescriptor(e.target, 'value')?.set;
        const prototype = Object.getPrototypeOf(e.target);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
          prototypeValueSetter.call(e.target, "");
        } else if (valueSetter) {
          valueSetter.call(e.target, "");
        } else {
          e.target.value = "";
        }
        e.target.dispatchEvent(new Event('input', { bubbles: true }));
        e.target.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    }
    if (onKeyDown) onKeyDown(e);
  };

  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-300 ease-smooth file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
