import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface ModelOption {
  id: string;
  name: string;
}

export interface ModelSelectProps {
  value: string;
  onChange: (value: string) => void;
  models: ModelOption[];
  isLoading?: boolean;
  placeholder?: string;
  defaultLabel?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Searchable model selector built on shadcn Popover + cmdk Command.
 * Filters models by both name and id. Responsive: popover width is
 * capped to the viewport so it never overflows on mobile.
 */
export function ModelSelect({
  value,
  onChange,
  models,
  isLoading = false,
  placeholder = "Select model",
  defaultLabel = "Default",
  className,
  disabled = false,
}: ModelSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selected = models.find((m) => m.id === value);
  const isDisabled = disabled || isLoading;

  // cmdk filters on the rendered text by default; we override with a
  // custom filter so both name AND id match the user's query.
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return models;
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q),
    );
  }, [models, search]);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={isDisabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span className={cn("truncate", !selected && !value && "text-muted-foreground")}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading...
              </span>
            ) : value && selected ? (
              selected.name
            ) : value ? (
              value
            ) : (
              defaultLabel
            )}
          </span>
          {!isLoading && (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[12rem] max-w-[calc(100vw-1.5rem)] p-0"
        align="start"
      >
        <Command shouldFilter={false} className="max-h-[20rem]">
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder={placeholder}
              value={search}
              onValueChange={setSearch}
              className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <CommandList>
            <CommandEmpty>No models found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__default__"
                onSelect={() => handleSelect("")}
                className="gap-2"
              >
                <Check
                  className={cn(
                    "h-4 w-4",
                    !value ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="text-muted-foreground">{defaultLabel}</span>
              </CommandItem>
              {filtered.map((m) => (
                <CommandItem
                  key={m.id}
                  value={m.id}
                  onSelect={() => handleSelect(m.id)}
                  className="gap-2"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === m.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{m.name}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">
                    {m.id}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default ModelSelect;
