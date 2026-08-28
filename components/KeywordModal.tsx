"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import BrandCombobox from "@/components/BrandCombobox";
import { createKeyword } from "@/services/api";

interface KeywordModalProps {
  open: boolean;

  initialText?: string;
  initialDuration?: number;
  initialBrand?: string | null;
  initialBrandId?: number | null;

  onClose: () => void;

  // Called after the API successfully saves
  onAdd?: (data: {
    keyword: string;
    duration: number | null;
    brand_id: number;
    brand_name: string;
  }) => void;
}

const DURATION_OPTIONS = [
  5,
  10,
  15,
  20,
  25,
  30,
  35,
  40,
  45,
];

export default function KeywordModal({
  open,
  initialText = "",
  initialDuration = 30,
  initialBrand = "",
  initialBrandId = null,
  onClose,
  onAdd,
}: KeywordModalProps) {
  const [text, setText] = useState(initialText);

  const [duration, setDuration] =
    useState<number | "">(initialDuration);

  const [brand, setBrand] =
    useState(initialBrand || "");

  const [brandId, setBrandId] =
    useState<number | null>(initialBrandId);

  const [brandOpen, setBrandOpen] =
    useState(false);

  const [customDuration, setCustomDuration] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setText(initialText);

    setDuration(initialDuration);

    setBrand(initialBrand || "");

    setBrandId(initialBrandId);

    setCustomDuration("");

    setBrandOpen(false);
  }, [
    open,
    initialText,
    initialDuration,
    initialBrand,
    initialBrandId,
  ]);

  if (!open) {
    return null;
  }

  async function handleAdd() {
    const finalDuration = customDuration
      ? Number(customDuration)
      : duration;

    /*
     * Validate keyword
     */
    if (!text.trim()) {
      toast.warning(
        "Please enter a keyword/text."
      );

      return;
    }

    /*
     * Validate brand
     */
    if (!brandId) {
      toast.warning(
        "Please select a brand."
      );

      return;
    }

    /*
     * Validate duration
     */
    if (
      finalDuration !== "" &&
      (
        !Number.isFinite(
          Number(finalDuration)
        ) ||
        Number(finalDuration) <= 0
      )
    ) {
      toast.warning(
        "Please enter a valid duration."
      );

      return;
    }

    /*
     * Build the same payload used by
     * KeywordsPage
     */
    const payload = {
      brand_id: Number(brandId),

      keyword: text.trim(),

      duration:
        finalDuration === ""
          ? null
          : Math.floor(
              Number(finalDuration)
            ),
    };

    try {
      setSaving(true);

      /*
       * CALL API
       */
      await createKeyword(payload);

      /*
       * Success
       */
      toast.success(
        "Keyword added successfully"
      );

      /*
       * Notify parent after successful
       * database save.
       */
      onAdd?.({
        keyword: payload.keyword,
        duration: payload.duration,
        brand_id: payload.brand_id,
        brand_name: brand.trim(),
      });

      /*
       * Close modal
       */
      onClose();

    } catch (error) {
      console.error(
        "Failed to create keyword:",
        error
      );

      toast.error(
        "Failed to save keyword"
      );

    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/50
        p-4
      "
      onClick={onClose}
    >
      <div
        className="
          w-full
          max-w-lg
          overflow-visible
          rounded-2xl
          bg-white
          shadow-2xl
        "
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {/* HEADER */}

        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              🔑 Add Keyword
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Add keyword text, duration and brand.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-xl
              text-gray-500
              hover:bg-gray-100
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            ×
          </button>
        </div>

        {/* BODY */}

        <div className="space-y-5 p-5">

          {/* KEYWORD */}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Keyword / Text
            </label>

            <textarea
              value={text}
              onChange={(e) =>
                setText(e.target.value)
              }
              rows={5}
              autoFocus
              disabled={saving}
              placeholder="Enter keyword or advertisement text..."
              className="
                w-full
                rounded-xl
                border
                border-gray-300
                bg-gray-50
                p-3
                text-sm
                outline-none
                transition
                focus:border-blue-500
                focus:bg-white
                focus:ring-2
                focus:ring-blue-100
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            />

            <div className="mt-1 text-right text-[11px] text-gray-400">
              {text.length} characters
            </div>
          </div>

          {/* DURATION */}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Duration
            </label>

            <div className="flex gap-2">
              <select
                value={
                  customDuration
                    ? "custom"
                    : duration
                }
                disabled={saving}
                onChange={(e) => {
                  if (
                    e.target.value ===
                    "custom"
                  ) {
                    setCustomDuration(
                      duration === ""
                        ? "30"
                        : String(duration)
                    );
                  } else {
                    setCustomDuration("");

                    setDuration(
                      Number(
                        e.target.value
                      )
                    );
                  }
                }}
                className="
                  h-11
                  flex-1
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  px-3
                  text-sm
                  font-semibold
                  outline-none
                  focus:border-blue-500
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {DURATION_OPTIONS.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {value} seconds
                    </option>
                  )
                )}

                <option value="custom">
                  Custom duration
                </option>
              </select>

              {customDuration && (
                <input
                  type="number"
                  min={1}
                  value={customDuration}
                  disabled={saving}
                  onChange={(e) =>
                    setCustomDuration(
                      e.target.value
                    )
                  }
                  placeholder="Seconds"
                  className="
                    h-11
                    w-32
                    rounded-xl
                    border
                    border-gray-300
                    px-3
                    text-sm
                    font-semibold
                    outline-none
                    focus:border-blue-500
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                />
              )}
            </div>
          </div>

          {/* BRAND */}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Brand
            </label>

            <div className="brand-combobox">
              <BrandCombobox
                value={brand}
                open={brandOpen}
                onOpenChange={
                  setBrandOpen
                }
                onChange={(
                  value,
                  id
                ) => {
                  setBrand(value);

                  setBrandId(
                    id ?? null
                  );

                  setBrandOpen(false);
                }}
              />
            </div>

            {brandId && (
              <div className="mt-1 text-xs text-gray-400">
                Brand ID: {brandId}
              </div>
            )}
          </div>

        </div>

        {/* FOOTER */}

        <div className="flex flex-col-reverse gap-2 border-t bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="
              h-11
              rounded-xl
              border
              border-gray-300
              bg-white
              px-5
              text-sm
              font-semibold
              text-gray-700
              hover:bg-gray-100
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className="
              h-11
              rounded-xl
              bg-blue-600
              px-5
              text-sm
              font-semibold
              text-white
              shadow-sm
              hover:bg-blue-700
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {saving
              ? "Saving..."
              : "🔑 Add Keyword"}
          </button>

        </div>
      </div>
    </div>
  );
}