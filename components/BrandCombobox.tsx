"use client";

import * as React from "react";
import {
  Check,
  ChevronsUpDown,
  Plus,
  Loader2,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  getBrands,
  createBrand,
  deleteBrand,
} from "@/services/api";

interface Brand {
  id: number;
  name: string;
}

interface Props {
  value: string;

  onChange: (
    value: string,
    id?: number
  ) => void;

  open?: boolean;

  onOpenChange?: (
    open: boolean
  ) => void;
}

export default function BrandCombobox({
  value,
  onChange,
  open,
  onOpenChange,
}: Props) {

  const [internalOpen, setInternalOpen] =
    React.useState(false);

  const [brands, setBrands] =
    React.useState<Brand[]>([]);

  const [loading, setLoading] =
    React.useState(true);

  const [creating, setCreating] =
    React.useState(false);

  const [deletingId, setDeletingId] =
    React.useState<number | null>(null);

  const [search, setSearch] =
    React.useState("");

  const isControlled =
    open !== undefined;

  const popoverOpen =
    isControlled
      ? open
      : internalOpen;

  function setPopoverOpen(
    state: boolean
  ) {

    if (!isControlled) {
      setInternalOpen(state);
    }

    onOpenChange?.(state);
  }

  // =====================================
  // LOAD BRANDS
  // =====================================

  async function loadBrands() {

    try {

      setLoading(true);

      const data =
        await getBrands();

      setBrands(data || []);

    } catch (err) {

      console.error(
        "Failed to load brands:",
        err
      );

    } finally {

      setLoading(false);

    }
  }

  React.useEffect(() => {

    loadBrands();

  }, []);

  // =====================================
  // FILTER
  // =====================================

  const filteredBrands =
    brands.filter((brand) =>
      brand.name
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  // =====================================
  // EXACT MATCH
  // =====================================

  const exactMatch =
    brands.find(
      (b) =>
        b.name.toLowerCase() ===
        search.trim().toLowerCase()
    );

  // =====================================
  // CREATE BRAND
  // =====================================

  async function handleAddBrand() {

    const name =
      search.trim();

    if (!name) return;

    try {

      setCreating(true);

      const brand =
        await createBrand(name);

      setBrands((prev) => {

        const exists =
          prev.some(
            (b) => b.id === brand.id
          );

        if (exists) {
          return prev;
        }

        return [
          ...prev,
          brand,
        ];
      });

      onChange(
        brand.name,
        brand.id
      );

      setSearch("");

      setPopoverOpen(false);

    } catch (err: any) {

      alert(
        err?.message ||
        "Failed to create brand"
      );

    } finally {

      setCreating(false);

    }
  }

  // =====================================
  // DELETE BRAND
  // =====================================

  async function handleDeleteBrand(
    brand: Brand
  ) {

    const confirmed =
      window.confirm(
        `Delete "${brand.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {

      setDeletingId(
        brand.id
      );

      await deleteBrand(
        brand.id
      );

      setBrands((prev) =>
        prev.filter(
          (b) =>
            b.id !== brand.id
        )
      );

      // If the deleted brand is currently
      // selected, clear the selection.
      if (value === brand.name) {

        onChange(
          "",
          undefined
        );
      }

    } catch (err: any) {

      alert(
        err?.message ||
        "Failed to delete brand"
      );

    } finally {

      setDeletingId(null);

    }
  }

  return (
    <Popover
      open={popoverOpen}
      onOpenChange={
        setPopoverOpen
      }
    >

      <PopoverTrigger
        className="
          flex
          h-10
          w-full
          items-center
          justify-between
          rounded-xl
          border
          border-yellow-300
          bg-yellow-50
          px-3
        "
      >

        <span>
          {value ||
            "Select Brand"}
        </span>

        <ChevronsUpDown
          className="
            h-4
            w-4
          "
        />

      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={5}
        className="
          w-[420px]
          p-0
          z-[9999]
        "
      >

        <Command
          shouldFilter={false}
        >

          <CommandInput
            placeholder="Search brand..."
            value={search}
            onValueChange={
              setSearch
            }
          />

          <CommandList>

            {loading ? (

              <div
                className="
                  flex
                  items-center
                  justify-center
                  py-8
                "
              >

                <Loader2
                  className="
                    h-5
                    w-5
                    animate-spin
                  "
                />

              </div>

            ) : (

              <>

                <CommandEmpty>
                  No brands found.
                </CommandEmpty>

                <CommandGroup
                  heading="Brands"
                >

                  {filteredBrands.map(
                    (brand) => (

                      <CommandItem
                        key={brand.id}
                        value={brand.name}
                        className="
                          cursor-pointer
                          group
                        "
                      >

                        {/* SELECT */}

                        <div
                          className="
                            flex
                            flex-1
                            min-w-0
                            items-center
                          "
                          onClick={() => {

                            onChange(
                              brand.name,
                              brand.id
                            );

                            setSearch("");

                            setPopoverOpen(
                              false
                            );
                          }}
                        >

                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value ===
                                brand.name
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />

                          <span
                            className="
                              truncate
                            "
                          >
                            🏷{" "}
                            {brand.name}
                          </span>

                        </div>

                        {/* DELETE */}

                        <button
                          type="button"
                          onClick={(event) => {

                            event.preventDefault();

                            event.stopPropagation();

                            handleDeleteBrand(
                              brand
                            );
                          }}
                          disabled={
                            deletingId ===
                            brand.id
                          }
                          className="
                            ml-2
                            rounded-md
                            p-1.5
                            text-red-500
                            hover:bg-red-50
                            hover:text-red-700
                            disabled:opacity-50
                          "
                          title="Delete brand"
                        >

                          {deletingId ===
                          brand.id ? (

                            <Loader2
                              className="
                                h-4
                                w-4
                                animate-spin
                              "
                            />

                          ) : (

                            <Trash2
                              className="
                                h-4
                                w-4
                              "
                            />

                          )}

                        </button>

                      </CommandItem>

                    )
                  )}

                </CommandGroup>

                {/* ADD BRAND */}

                {!exactMatch &&
                  search.trim() !== "" && (

                    <>

                      <div
                        className="
                          border-t
                        "
                      />

                      <CommandGroup>

                        <CommandItem
                          disabled={
                            creating
                          }
                          onSelect={
                            handleAddBrand
                          }
                          className="
                            cursor-pointer
                          "
                        >

                          {creating ? (

                            <Loader2
                              className="
                                mr-2
                                h-4
                                w-4
                                animate-spin
                              "
                            />

                          ) : (

                            <Plus
                              className="
                                mr-2
                                h-4
                                w-4
                              "
                            />

                          )}

                          Add "{search}"

                        </CommandItem>

                      </CommandGroup>

                    </>

                  )}

              </>

            )}

          </CommandList>

        </Command>

      </PopoverContent>

    </Popover>
  );
}