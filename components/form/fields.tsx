"use client";

import { ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* ── Shared option types ── */
export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ElementType;
}
export interface CheckOption {
  value: string;
  label: string;
  icon: React.ElementType;
}

/* ── SelectField — styled trigger + native select overlay ── */
export function SelectField({
  id, label, value, onChange, options, placeholder, required,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder: string;
  required?: boolean;
}) {
  const selected = options.find((o) => o.value === value);
  const Icon = selected?.icon;
  return (
    <div className="space-y-1.5">
      {label && (
        <Label htmlFor={id}>
          {label}{required && " *"}
        </Label>
      )}
      <div className="relative rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className={cn(
          "flex h-11 cursor-pointer select-none items-center gap-2.5 px-3 py-2 text-sm pointer-events-none",
          !value && "text-muted-foreground",
        )}>
          {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
          <span className="flex-1 truncate">{selected?.label ?? placeholder}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground/60" />
        </div>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer rounded-md opacity-0"
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ── CheckList — checkboxes with icon, highlights when checked ── */
export function CheckList({ options, values, onChange }: {
  options: CheckOption[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map(({ value: opt, label, icon: Icon }) => (
        <label key={opt} className={cn(
          "flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm transition-colors",
          values.includes(opt)
            ? "border-[var(--nrf-blue)]/50 bg-[var(--nrf-blue)]/5 text-[var(--nrf-blue)]"
            : "border-border hover:bg-muted/30",
        )}>
          <input
            type="checkbox"
            className="size-4 shrink-0 accent-[var(--nrf-blue)]"
            checked={values.includes(opt)}
            onChange={() => toggle(opt)}
          />
          <Icon className={cn("size-4 shrink-0", values.includes(opt) ? "text-[var(--nrf-blue)]" : "text-muted-foreground")} />
          {label}
        </label>
      ))}
    </div>
  );
}

/* ── StepIndicator — numbered steps joined by a progress line ── */
export function StepIndicator({ labels, step }: { labels: readonly string[]; step: number }) {
  return (
    <div className="border-b border-border px-4 py-4 sm:px-6">
      <div className="flex items-center">
        {labels.map((label, i) => {
          const n = i + 1;
          return (
            <div key={label} className="flex min-w-0 items-center">
              {i > 0 && (
                <div className={cn("h-px flex-1 mx-1 bg-border sm:mx-2", step > i && "bg-[var(--nrf-blue)]")} />
              )}
              <div className="flex shrink-0 items-center gap-1.5">
                <div className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors sm:size-7 sm:text-xs",
                  step === n ? "bg-[var(--nrf-blue)] text-white"
                    : step > n ? "bg-[var(--nrf-blue)]/20 text-[var(--nrf-blue)]"
                    : "bg-muted text-muted-foreground",
                )}>
                  {step > n ? "✓" : n}
                </div>
                <span className={cn(
                  "hidden text-[11px] font-medium sm:block",
                  step >= n ? "text-foreground" : "text-muted-foreground",
                )}>
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
