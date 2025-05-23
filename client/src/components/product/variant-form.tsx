import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, ImagePlus } from "lucide-react";
import { MultiMediaPicker } from "@/components/multi-media-picker";

export interface ProductVariant {
  id?: number;
  productId?: number;
  sku: string;
  color: string;
  size: string;
  price: number;
  mrp: number;
  stock: number;
  images: string[];
}

interface VariantFormProps {
  variant: ProductVariant;
  isEdit: boolean;
  variantImages: string[];
  onCancel: () => void;
  onSave: (variant: ProductVariant, images: string[]) => void;
  onUpdateVariantField: (field: keyof ProductVariant, value: any) => void;
  onAddImage: (fileOrUrl: File | string) => void;
  onRemoveImage: (index: number) => void;
}

export function VariantForm({
  variant,
  isEdit,
  variantImages,
  onCancel,
  onSave,
  onUpdateVariantField,
  onAddImage,
  onRemoveImage,
}: VariantFormProps) {
  // Create a single state object for cursor positions
  const [cursorPositions, setCursorPositions] = useState<
    Record<string, number | null>
  >({
    sku: null,
    color: null,
    size: null,
    price: null,
    mrp: null,
    stock: null,
  });

  // Create refs for each input field
  const inputRefs = {
    sku: useRef<HTMLInputElement>(null),
    color: useRef<HTMLInputElement>(null),
    size: useRef<HTMLInputElement>(null),
    price: useRef<HTMLInputElement>(null),
    mrp: useRef<HTMLInputElement>(null),
    stock: useRef<HTMLInputElement>(null),
  };

  // Track the currently active field
  const [activeField, setActiveField] = useState<string | null>(null);

  // Handle input changes - set the cursor position and update the parent
  const handleInputChange = (
    field: keyof ProductVariant,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectionStart = e.target.selectionStart;

    // Store the cursor position for this field
    setCursorPositions((prev) => ({
      ...prev,
      [field]: selectionStart,
    }));

    // Mark this field as active
    setActiveField(field as string);

    // Update the parent component with the new value - with error handling
    try {
      if (onUpdateVariantField) {
        onUpdateVariantField(
          field,
          field === "price" || field === "mrp" || field === "stock"
            ? Number(e.target.value) || 0
            : e.target.value || ""
        );
      } else {
        console.warn(
          "onUpdateVariantField function not provided to VariantForm"
        );
      }
    } catch (error) {
      console.error("Error updating variant field:", error);
    }
  };

  // After the component renders, restore cursor position
  useEffect(() => {
    if (activeField && cursorPositions[activeField] !== null) {
      const ref = inputRefs[activeField as keyof typeof inputRefs];
      const position = cursorPositions[activeField];

      if (ref.current && position !== null) {
        ref.current.focus();
        ref.current.setSelectionRange(position, position);
      }
    }
  }, [variant, activeField, cursorPositions]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(variant, variantImages);
  };

  // Handle multiple file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      // Create FormData to upload files to S3
      const formData = new FormData();

      // Add all files to FormData
      for (let i = 0; i < files.length; i++) {
        formData.append("file", files[i]);
      }

      // Make API request to upload files to S3 using the multi-file endpoint
      fetch("/api/upload-multiple", {
        method: "POST",
        body: formData,
        credentials: "include",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to upload variant images");
          }
          return response.json();
        })
        .then((data) => {
          // Add all uploaded image URLs to the variant
          if (Array.isArray(data.urls)) {
            data.urls.forEach((url: string) => {
              onAddImage(url);
            });
          } else {
            console.error("Expected array of URLs but received:", data);
          }
        })
        .catch((error) => {
          console.error("Error uploading variant images:", error);
        });
    } catch (error) {
      console.error("Error handling file upload:", error);
    } finally {
      // Reset the input field
      e.target.value = "";
    }
  };

  return (
    <div className="border rounded-md p-4 space-y-4 bg-slate-50">
      <h3 className="text-lg font-medium">
        {isEdit ? "Edit Variant" : "Add Variant"}
      </h3>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="variant-sku">SKU</Label>
            <Input
              ref={inputRefs.sku}
              id="variant-sku"
              placeholder="SKU-123"
              value={variant.sku || ""}
              onChange={(e) => handleInputChange("sku", e)}
              onFocus={() => setActiveField("sku")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="variant-color">Color</Label>
            <div>
              <Input
                ref={inputRefs.color}
                id="variant-color"
                placeholder="Red, Blue, Green, etc."
                value={variant.color || ""}
                onChange={(e) => handleInputChange("color", e)}
                onFocus={() => setActiveField("color")}
              />
              {variant.color && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {variant.color
                    .split(/,\s*/)
                    .filter(Boolean)
                    .map((color, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary"
                      >
                        {color}
                      </span>
                    ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Enter multiple colors separated by commas (e.g., "Red, Blue,
                Green")
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="variant-size">Size</Label>
            <div>
              <Input
                ref={inputRefs.size}
                id="variant-size"
                placeholder="S, M, L, XL, etc."
                value={variant.size || ""}
                onChange={(e) => handleInputChange("size", e)}
                onFocus={() => setActiveField("size")}
              />
              {variant.size && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {variant.size
                    .split(/,\s*/)
                    .filter(Boolean)
                    .map((size, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary"
                      >
                        {size}
                      </span>
                    ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Enter multiple sizes separated by commas (e.g., "S, M, L, XL")
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="variant-price">Selling Price (Incl. GST) *</Label>
            <Input
              ref={inputRefs.price}
              id="variant-price"
              type="number"
              min="0"
              placeholder="0"
              value={variant.price || ""}
              onChange={(e) => handleInputChange("price", e)}
              onFocus={() => setActiveField("price")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="variant-mrp">MRP (Incl. GST)</Label>
            <Input
              ref={inputRefs.mrp}
              id="variant-mrp"
              type="number"
              min="0"
              placeholder="0"
              value={variant.mrp || ""}
              onChange={(e) => handleInputChange("mrp", e)}
              onFocus={() => setActiveField("mrp")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="variant-stock">Stock *</Label>
            <Input
              ref={inputRefs.stock}
              id="variant-stock"
              type="number"
              min="0"
              placeholder="0"
              value={variant.stock || ""}
              onChange={(e) => handleInputChange("stock", e)}
              onFocus={() => setActiveField("stock")}
            />
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <Label>Variant Images</Label>
          <div className="flex flex-col space-y-4">
            {/* Display existing variant images */}
            {variantImages.length > 0 && (
              <div className="flex flex-wrap gap-4 mb-4">
                {variantImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Variant image ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-md border"
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Media Library Picker */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">
                Select from Media Library
              </h4>
              <MultiMediaPicker
                onSelect={(urls) => {
                  for (const url of urls) {
                    if (!variantImages.includes(url)) {
                      onAddImage(url);
                    }
                  }
                }}
                selectedUrls={variantImages}
                buttonLabel="Browse Media Library"
                maxImages={999}
              />

              {/* Add image via URL */}
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">
                  Or Add Image via URL
                </h4>
                <div className="flex items-center gap-2">
                  <Input
                    type="url"
                    placeholder="Enter image URL (https://...)"
                    className="flex-1"
                    id="variant-image-url-input"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById(
                        "variant-image-url-input"
                      ) as HTMLInputElement;
                      if (input && input.value) {
                        // Use the same onAddImage function that handles validation
                        onAddImage(input.value);
                        // Clear the input after adding
                        input.value = "";
                      }
                    }}
                  >
                    Add URL
                  </Button>
                </div>
              </div>

              {/* Traditional file upload */}
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">
                  Or Upload New Image
                </h4>
                <div className="w-full h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-500 hover:border-gray-400 transition-colors cursor-pointer">
                  <label
                    htmlFor="variant-image-upload"
                    className="cursor-pointer flex flex-col items-center justify-center w-full h-full"
                  >
                    <ImagePlus className="w-6 h-6 mb-1" />
                    <span className="text-xs">Choose files</span>
                    <span className="text-xs text-muted-foreground">
                      (Multiple files supported)
                    </span>
                    <Input
                      id="variant-image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save Variant</Button>
        </div>
      </form>
    </div>
  );
}
