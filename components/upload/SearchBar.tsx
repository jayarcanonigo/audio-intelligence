"use client";

import { Search, X } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
};

export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = "Search transcript...",
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="relative flex-1">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="
            w-full
            rounded-md
            border
            border-gray-300
            py-2
            pl-10
            pr-10
            outline-none
            transition
            focus:border-blue-500
            focus:ring-1
            focus:ring-blue-500
          "
        />

        {value.length > 0 && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={onClear}
            className="
              absolute
              right-3
              top-1/2
              -translate-y-1/2
              text-gray-400
              hover:text-gray-700
            "
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}