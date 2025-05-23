import React, { useState, useEffect } from "react";
import { ProductVariant } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info, Image, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Function to sort sizes in logical order (XS, S, M, L, XL, XXL, XXXL, etc.)
const sortSizesInOrder = (sizes: string[]): string[] => {
  // Define the standard size order
  const sizeOrder: Record<string, number> = {
    XXS: 0,
    XS: 1,
    S: 2,
    M: 3,
    L: 4,
    XL: 5,
    XXL: 6,
    "2XL": 6, // Alternative for XXL
    XXXL: 7,
    "3XL": 7, // Alternative for XXXL
    XXXXL: 8,
    "4XL": 8, // Alternative for XXXXL
    "5XL": 9,
    "6XL": 10,
    "7XL": 11,
    "8XL": 12,
    "9XL": 13,
    "10XL": 14,
  };

  // Clone the array to avoid mutating the original
  return [...sizes].sort((a, b) => {
    // Check if these are number sizes (like 38, 40, 42)
    const aNum = parseInt(a, 10);
    const bNum = parseInt(b, 10);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum; // Sort numerically
    }

    // For standard sizes like S, M, L, XL, etc.
    const aUpperCase = a.toUpperCase();
    const bUpperCase = b.toUpperCase();

    const aIndex =
      sizeOrder[aUpperCase] !== undefined ? sizeOrder[aUpperCase] : 999;
    const bIndex =
      sizeOrder[bUpperCase] !== undefined ? sizeOrder[bUpperCase] : 999;

    return aIndex - bIndex;
  });
};

interface VariantSelectorProps {
  variants: ProductVariant[];
  onVariantChange: (variant: ProductVariant | null) => void;
  onValidSelectionChange?: (isValid: boolean) => void; // Made optional for backward compatibility
  onVariantImagesChange?: (images: string[]) => void; // Prop for handling variant images
  onViewVariantImages?: (
    images: string[],
    variantInfo?: {
      color?: string;
      size?: string;
      price?: number;
      mrp?: number;
      stock?: number;
    }
  ) => void; // Callback for viewing all images of a variant
  includeStock?: boolean; // Whether to show stock information
  showImagePreviews?: boolean; // Whether to show image previews in the variant selector
}

export function VariantSelector({
  variants,
  onVariantChange,
  onValidSelectionChange = () => {}, // Default empty function to prevent errors
  onVariantImagesChange = () => {}, // Default empty function for image changes
  onViewVariantImages = () => {}, // Default empty function for viewing variant images
  includeStock = true, // Default to showing stock information
  showImagePreviews = true, // Default to showing image previews
}: VariantSelectorProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(
    null
  );
  const [showColorError, setShowColorError] = useState<boolean>(false);
  const [showSizeError, setShowSizeError] = useState<boolean>(false);
  const [debugMessage, setDebugMessage] = useState<string | null>(null);
  const [colorImages, setColorImages] = useState<Record<string, string[]>>({});

  // Parse comma-separated string into array of values
  const parseCommaSeparatedValues = (
    value: string | null | undefined
  ): string[] => {
    if (!value) return [];
    return value.split(/,\s*/).filter((v) => v.trim() !== "");
  };

  // Check if a given color is in a comma-separated color string
  const colorMatches = (
    variantColor: string | null | undefined,
    selectedColor: string
  ): boolean => {
    if (!variantColor || !selectedColor) return false;

    const variantColors = parseCommaSeparatedValues(variantColor);
    return variantColors.includes(selectedColor);
  };

  // Check if a given size is in a comma-separated size string
  const sizeMatches = (
    variantSize: string | null | undefined,
    selectedSize: string
  ): boolean => {
    if (!variantSize || !selectedSize) return false;

    const variantSizes = parseCommaSeparatedValues(variantSize);
    return variantSizes.includes(selectedSize);
  };

  // Initialize available colors and sizes on first load
  useEffect(() => {
    if (!variants || variants.length === 0) {
      setDebugMessage("No variants available");
      onValidSelectionChange(true); // No variants means valid by default
      return;
    }

    // First check if any variants have color values
    const hasColorVariants = variants.some(
      (v) => v.color && typeof v.color === "string" && v.color.trim() !== ""
    );

    // If no variants have color values, check if they have size values instead
    const hasSizeOnlyVariants =
      !hasColorVariants &&
      variants.some(
        (v) => v.size && typeof v.size === "string" && v.size.trim() !== ""
      );

    if (hasColorVariants) {
      // Normal case: has color values
      // Extract all colors from variants and handle comma-separated values
      let allColors: string[] = [];

      variants
        .filter(
          (v) => v.color && typeof v.color === "string" && v.color.trim() !== ""
        )
        .forEach((v) => {
          const colors = parseCommaSeparatedValues(v.color);
          allColors = [...allColors, ...colors];
        });

      // Deduplicate colors
      const uniqueColors = Array.from(new Set(allColors));
      setAvailableColors(uniqueColors);

      // If only one color, auto-select it
      if (uniqueColors.length === 1) {
        setSelectedColor(uniqueColors[0]);
      } else {
        // If there are multiple colors, show an error if none is selected
        setShowColorError(uniqueColors.length > 0);
      }

      // Check if this product has variants but selections aren't made
      if (uniqueColors.length > 0) {
        onValidSelectionChange(false); // Start with invalid selection
      } else {
        onValidSelectionChange(true); // No variants means valid by default
      }
    } else if (hasSizeOnlyVariants) {
      // Special case: only has size values, no colors
      // Since there are no colors, we'll set a default color value to make the flow work
      setSelectedColor("Default");
      setAvailableColors(["Default"]); // Add a placeholder color
      setShowColorError(false); // No need to show color error

      // Extract all sizes and handle comma-separated values
      let allSizes: string[] = [];

      variants
        .filter(
          (v) =>
            v.size &&
            typeof v.size === "string" &&
            v.size.trim() !== "" &&
            v.stock > 0
        )
        .forEach((v) => {
          const sizes = parseCommaSeparatedValues(v.size);
          allSizes = [...allSizes, ...sizes];
        });

      // Deduplicate sizes
      const uniqueSizes = Array.from(new Set(allSizes));

      // Sort sizes in logical sequence (S, M, L, XL, XXL, etc.)
      const sortedSizes = sortSizesInOrder(uniqueSizes);
      setAvailableSizes(sortedSizes);

      // If there are sizes, the user needs to select one
      if (uniqueSizes.length > 0) {
        onValidSelectionChange(false); // Start with invalid selection
        setShowSizeError(true); // Show size error until one is selected
      } else {
        onValidSelectionChange(true); // No sizes means valid by default
      }
    } else {
      // No variants with color or size
      onValidSelectionChange(true); // No selection needed
    }
  }, [variants, onValidSelectionChange]);

  // Update available sizes when a color is selected
  useEffect(() => {
    if (!variants || variants.length === 0) return;

    if (selectedColor) {
      setShowColorError(false); // Hide color error when color is selected

      // Find available sizes for the selected color, handling comma-separated values
      let allSizes: string[] = [];

      // Special case for "Default" color (when only size variants exist)
      const filterFn =
        selectedColor === "Default"
          ? (v: ProductVariant) => typeof v.stock === "number" && v.stock > 0
          : (v: ProductVariant) => {
              // Match variants with exact color match (not just containing)
              const colorMatch =
                v.color &&
                parseCommaSeparatedValues(v.color).some(
                  (c) =>
                    c.trim().toLowerCase() ===
                    selectedColor.trim().toLowerCase()
                );

              // Only include variants with stock
              return colorMatch && typeof v.stock === "number" && v.stock > 0;
            };

      // Filter variants that match the exact color and have stock
      const matchingVariants = variants.filter(filterFn);

      // Collect all sizes from these matching variants
      matchingVariants.forEach((v) => {
        if (v.size) {
          const sizes = parseCommaSeparatedValues(v.size);
          allSizes = [...allSizes, ...sizes];
        }
      });

      // Deduplicate sizes
      const uniqueSizes = Array.from(new Set(allSizes));

      // Sort sizes in logical sequence (S, M, L, XL, XXL, etc.)
      const sortedSizes = sortSizesInOrder(uniqueSizes);
      setAvailableSizes(sortedSizes);

      // Reset size selection if current size is not available
      if (selectedSize && !uniqueSizes.includes(selectedSize)) {
        setSelectedSize(null);
      }

      // If only one size, auto-select it
      if (uniqueSizes.length === 1) {
        setSelectedSize(uniqueSizes[0]);
        setShowSizeError(false);
      } else {
        // Show size error if multiple sizes are available but none is selected
        setShowSizeError(uniqueSizes.length > 0 && !selectedSize);
      }
    } else {
      // If no color is selected, reset sizes and show color error
      setAvailableSizes([]);
      setSelectedSize(null);
      setShowColorError(availableColors.length > 0);
    }
  }, [selectedColor, variants, availableColors, selectedSize]);

  // Function to extract images from variant
  const parseVariantImages = (variant: ProductVariant): string[] => {
    if (!variant || !variant.images) return [];

    // No debug logging in production
    try {
      // If images are stored as a JSON string, parse them
      if (typeof variant.images === "string") {
        // Empty string case
        if (variant.images.trim() === "") {
          return [];
        }

        // Handle if images is already a direct URL
        if (
          variant.images.startsWith("http") &&
          !variant.images.startsWith("[") &&
          !variant.images.startsWith("{")
        ) {
          return [variant.images];
        }

        // Handle comma-separated URLs that aren't in JSON format
        if (
          variant.images.includes(",") &&
          !variant.images.startsWith("[") &&
          !variant.images.startsWith("{")
        ) {
          const urls = variant.images
            .split(",")
            .map((url) => url.trim())
            .filter((url) => url !== "");
          return urls;
        }

        // Try to parse as JSON
        if (variant.images.startsWith("[") || variant.images.startsWith("{")) {
          try {
            const parsedImages = JSON.parse(variant.images);

            // If it's an array of strings, use directly
            if (Array.isArray(parsedImages)) {
              const validImages = parsedImages
                .map((img) =>
                  typeof img === "string"
                    ? img
                    : img?.url || img?.imageUrl || ""
                )
                .filter((url) => url && url.trim() !== "");
              return validImages;
            }

            // If it's an object with url/imageUrl property
            if (typeof parsedImages === "object") {
              const url = parsedImages.url || parsedImages.imageUrl;
              return url ? [url] : [];
            }

            return [];
          } catch (parseError) {
            // Use as plain string if parsing fails, but only if it looks like a URL
            return variant.images.includes("http") ? [variant.images] : [];
          }
        }

        // If not a valid JSON string, treat as a single URL if it looks like one
        if (variant.images.includes("http")) {
          return [variant.images];
        }

        return [];
      }
      // If images are already an array, use them directly
      else if (Array.isArray(variant.images)) {
        const validImages = variant.images
          .map((img: any) =>
            typeof img === "string" ? img : img?.url || img?.imageUrl || ""
          )
          .filter((url: string) => url && url.trim() !== "");
        return validImages;
      }
    } catch (error) {
      console.error("Error processing variant images:", error);
    }

    return [];
  };

  // Organize variant images by color with improved grouping logic
  useEffect(() => {
    if (!variants || variants.length === 0) return;

    const imagesByColor: Record<string, string[]> = {};

    // First pass: collect all variants by color
    const variantsByColor: Record<string, ProductVariant[]> = {};

    variants.forEach((variant) => {
      if (!variant.color) return;

      const colors = parseCommaSeparatedValues(variant.color);

      colors.forEach((color) => {
        if (!variantsByColor[color]) {
          variantsByColor[color] = [];
        }
        variantsByColor[color].push(variant);
      });
    });

    // Second pass: collect ALL images for each color from ALL variants with that color
    Object.entries(variantsByColor).forEach(([color, colorVariants]) => {
      // Initialize empty array for this color
      imagesByColor[color] = [];

      // Collect ALL images from ALL variants with this color
      colorVariants.forEach((variant) => {
        const variantImages = parseVariantImages(variant);

        // Add each image to the color's image collection (avoiding duplicates)
        variantImages.forEach((img) => {
          if (img && !imagesByColor[color].includes(img)) {
            imagesByColor[color].push(img);
          }
        });
      });
    });
    setColorImages(imagesByColor);
    // We'll update the images in the other useEffect for simplicity
  }, [variants]);

  // Find the matching variant when color and size are selected
  useEffect(() => {
    const hasColorVariants = availableColors.length > 0;
    const hasSizeVariants = availableSizes.length > 0;

    // Determine if the selection is valid based on what variants are available
    const isValidSelection =
      !hasColorVariants || (hasColorVariants && selectedColor !== null);

    // Add debug logging to help identify selection issues
    console.log("Variant selection state:", {
      hasColorVariants,
      hasSizeVariants,
      selectedColor,
      selectedSize,
      isValidSelection,
    });

    // Update parent component with validation state if the callback exists
    if (onValidSelectionChange) {
      onValidSelectionChange(Boolean(isValidSelection));
    }

    // If size is selected, hide size error
    if (selectedSize) {
      setShowSizeError(false);
    }

    // Update the current variant
    if (!selectedColor || !variants || variants.length === 0) {
      setCurrentVariant(null);
      onVariantChange(null);
      return;
    }

    // Find a variant that contains the selected color, size is optional
    const matchedVariant = variants.find((v) => {
      // Handle special case for "Default" color (when only size variants exist)
      const colorMatch =
        selectedColor === "Default" ||
        colorMatches(v.color, selectedColor || "");

      // Only check size match if a size is selected and size variants exist
      const sizeMatch =
        !hasSizeVariants ||
        !selectedSize ||
        (selectedSize ? sizeMatches(v.size, selectedSize) : true);

      return (
        colorMatch && sizeMatch && typeof v.stock === "number" && v.stock > 0
      );
    });

    setCurrentVariant(matchedVariant || null);
    onVariantChange(matchedVariant || null);

    // Enhanced image update logic:
    // 1. If a color is selected, return the color-specific images (these will be shown first)
    // 2. If a specific variant is matched, also include its images
    // 3. In all cases, the product details page will combine these with the main product images

    if (selectedColor) {
      if (colorImages[selectedColor] && colorImages[selectedColor].length > 0) {
        // Get images for the selected color and remove duplicates
        const colorSpecificImages = Array.from(
          new Set(colorImages[selectedColor])
        );

        // Update the parent with these images - they'll be shown first, followed by default images
        onVariantImagesChange(colorSpecificImages);
      }
      // If we have a specific variant selected but no color-specific images, use variant images
      else if (matchedVariant && matchedVariant.images) {
        // Parse images from the matched variant
        const variantImages = parseVariantImages(matchedVariant);

        // Update parent with these images - they'll be shown first, followed by default images
        onVariantImagesChange(variantImages);
      }
      // If no variant selected with images, pass an empty array
      // The product details page will still show the main product images
      else {
        // No color/variant-specific images, will use main product images
        onVariantImagesChange([]);
      }
    }
  }, [
    selectedColor,
    selectedSize,
    variants,
    colorImages,
    onVariantChange,
    onVariantImagesChange,
    onValidSelectionChange,
  ]);

  // If no valid variants found, show debug message
  if (!variants || variants.length === 0 || availableColors.length === 0) {
    if (debugMessage) {
      return (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 mb-4">
          <div className="flex items-start">
            <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Product variant information</p>
              <p className="mt-1">{debugMessage}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Color Selection */}
      {availableColors.length > 0 && selectedColor !== "Default" && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="font-medium">Color</Label>
            {showColorError && (
              <div className="text-red-500 text-sm flex items-center">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                <span>Please select a color</span>
              </div>
            )}
          </div>

          {/* Enhanced Color Selector with Multiple Image Thumbnails */}
          <RadioGroup
            value={selectedColor || ""}
            onValueChange={(value) => setSelectedColor(value)}
            className="flex flex-wrap gap-3"
          >
            {availableColors.map((color) => {
              // Get all thumbnails for this color
              const colorThumbnails = colorImages[color] || [];
              const showMultipleImages =
                showImagePreviews && colorThumbnails.length > 1;

              // Use the first image as the main thumbnail
              const mainThumbnail =
                colorThumbnails.length > 0 ? colorThumbnails[0] : null;

              // Get variant stock for this color
              const colorStock = variants
                .filter(
                  (v) =>
                    colorMatches(v.color, color) &&
                    typeof v.stock === "number" &&
                    v.stock > 0
                )
                .reduce((total, v) => total + v.stock, 0);

              // Find a variant with this color to get its price for the tooltip
              const variantWithColor = variants.find((v) =>
                colorMatches(v.color, color)
              );
              const price = variantWithColor?.price;
              const mrp = variantWithColor?.mrp;

              const isOutOfStock = colorStock === 0;

              // Show discount if available
              const discount =
                price && mrp && mrp > price
                  ? Math.round((1 - price / mrp) * 100)
                  : null;

              return (
                <div key={color} className="flex flex-col items-center">
                  <RadioGroupItem
                    value={color}
                    id={`color-${color}`}
                    className="peer sr-only"
                    disabled={isOutOfStock}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center gap-1 group">
                          {/* Color swatch or thumbnail with optional badge for multiple images */}
                          <div
                            className={cn(
                              "w-16 h-16 rounded-md border-2 cursor-pointer transition-all overflow-hidden relative",
                              selectedColor === color
                                ? "border-primary ring-2 ring-primary ring-opacity-30"
                                : isOutOfStock
                                ? "border-gray-200 opacity-60 cursor-not-allowed"
                                : "border-gray-200 hover:border-gray-300 group-hover:shadow-md"
                            )}
                            onClick={() => {
                              if (
                                !isOutOfStock &&
                                showMultipleImages &&
                                selectedColor === color &&
                                onViewVariantImages
                              ) {
                                // If this color is already selected and has multiple images, show image gallery
                                const variant = variants.find(
                                  (v) =>
                                    colorMatches(v.color, color) &&
                                    (v.size
                                      ? sizeMatches(v.size, selectedSize || "")
                                      : true)
                                );
                                onViewVariantImages(colorThumbnails, {
                                  color,
                                  size: variant?.size || undefined,
                                  price: variant?.price ?? undefined,
                                  mrp: variant?.mrp ?? undefined,
                                  stock: variant?.stock ?? undefined,
                                });
                              }
                            }}
                          >
                            <Label
                              htmlFor={`color-${color}`}
                              className={cn(
                                "w-full h-full cursor-pointer",
                                isOutOfStock && "cursor-not-allowed"
                              )}
                            >
                              {mainThumbnail ? (
                                // Show color thumbnail image if available
                                <img
                                  src={mainThumbnail}
                                  alt={`${color} thumbnail`}
                                  className={cn(
                                    "w-full h-full object-cover transition-transform duration-200",
                                    !isOutOfStock && "group-hover:scale-105"
                                  )}
                                  onError={(e) => {
                                    // If image fails to load, show color name
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    target.parentElement!.classList.add(
                                      "flex",
                                      "items-center",
                                      "justify-center",
                                      "bg-gray-100"
                                    );
                                    const span = document.createElement("span");
                                    span.textContent = color;
                                    span.className = "text-xs text-center px-1";
                                    target.parentElement!.appendChild(span);
                                  }}
                                />
                              ) : (
                                // Default color swatch if no image
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                  <span className="text-xs text-center px-1">
                                    {color}
                                  </span>
                                </div>
                              )}

                              {/* Selected checkmark badge */}
                              {selectedColor === color && (
                                <div className="absolute top-0 right-0 bg-primary text-white rounded-bl-md p-0.5">
                                  <Check className="h-3 w-3" />
                                </div>
                              )}

                              {/* Multiple images badge - show as clickable button when selected */}
                              {showMultipleImages && (
                                <div
                                  className={cn(
                                    "absolute bottom-0 right-0 text-white rounded-tl-md px-1 py-0.5 text-[10px]",
                                    selectedColor === color
                                      ? "bg-primary cursor-pointer hover:bg-primary/90"
                                      : "bg-black bg-opacity-70"
                                  )}
                                  onClick={(e) => {
                                    if (
                                      selectedColor === color &&
                                      onViewVariantImages
                                    ) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      // Show all images for this color
                                      const variant = variants.find(
                                        (v) =>
                                          colorMatches(v.color, color) &&
                                          (v.size
                                            ? sizeMatches(
                                                v.size,
                                                selectedSize || ""
                                              )
                                            : true)
                                      );
                                      onViewVariantImages(colorThumbnails, {
                                        color,
                                        size: variant?.size || undefined,
                                        price: variant?.price ?? undefined,
                                        mrp: variant?.mrp ?? undefined,
                                        stock: variant?.stock ?? undefined,
                                      });
                                    }
                                  }}
                                >
                                  {selectedColor === color
                                    ? "View all"
                                    : `+${colorThumbnails.length - 1}`}
                                </div>
                              )}

                              {/* Discount badge */}
                              {!isOutOfStock &&
                                discount !== null &&
                                discount > 0 && (
                                  <div className="absolute top-0 left-0 bg-green-600 text-white rounded-br-md px-1 py-0.5 text-[10px]">
                                    {discount}% off
                                  </div>
                                )}

                              {/* Out of stock overlay */}
                              {isOutOfStock && (
                                <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center">
                                  <span className="text-xs font-medium text-red-600 px-1 py-0.5 bg-white bg-opacity-90 rounded">
                                    Out of stock
                                  </span>
                                </div>
                              )}
                            </Label>
                          </div>

                          {/* Color name below thumbnail */}
                          <Label
                            htmlFor={`color-${color}`}
                            className={cn(
                              "text-xs text-center cursor-pointer transition-colors",
                              selectedColor === color
                                ? "font-medium text-primary"
                                : isOutOfStock
                                ? "text-gray-400"
                                : "text-gray-600 group-hover:text-gray-900"
                            )}
                          >
                            {color}
                          </Label>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="p-1 text-xs space-y-1">
                          {isOutOfStock ? (
                            <p className="text-red-500">Out of stock</p>
                          ) : (
                            <>
                              <p>
                                {showMultipleImages
                                  ? `${
                                      colorThumbnails.length
                                    } images available${
                                      selectedColor === color
                                        ? " - Click to view all"
                                        : ""
                                    }`
                                  : `Select ${color}`}
                              </p>

                              {/* Show price in tooltip if available */}
                              {price && (
                                <div className="flex items-center">
                                  <span className="font-medium">
                                    ₹{price.toLocaleString()}
                                  </span>
                                  {mrp && mrp > price && (
                                    <span className="ml-1 line-through text-gray-500 text-[10px]">
                                      ₹{mrp.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Show stock in tooltip */}
                              {typeof colorStock === "number" && (
                                <p
                                  className={cn(
                                    colorStock <= 5 && colorStock > 0
                                      ? "text-amber-600"
                                      : "text-green-600"
                                  )}
                                >
                                  {colorStock <= 5
                                    ? `Only ${colorStock} left in stock`
                                    : "In stock"}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              );
            })}
          </RadioGroup>
        </div>
      )}

      {/* Size Selection - now optional */}
      {(selectedColor || availableColors.includes("Default")) &&
        availableSizes.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="font-medium">Size</Label>
            </div>
            <RadioGroup
              value={selectedSize || ""}
              onValueChange={(value) => setSelectedSize(value)}
              className="flex flex-wrap gap-2"
            >
              {availableSizes.map((size) => {
                // Check if this size is available with the current color selection
                const isSizeAvailable = !!variants.find(
                  (v) =>
                    (selectedColor === "Default" ||
                      colorMatches(v.color, selectedColor || "")) &&
                    sizeMatches(v.size, size) &&
                    typeof v.stock === "number" &&
                    v.stock > 0
                );

                // Get the actual stock for this size/color combination
                const variantWithSize = variants.find(
                  (v) =>
                    (selectedColor === "Default" ||
                      colorMatches(v.color, selectedColor || "")) &&
                    sizeMatches(v.size, size)
                );

                const sizeStock = variantWithSize?.stock || 0;
                const isLowStock = sizeStock > 0 && sizeStock <= 5;

                return (
                  <div key={size} className="flex items-center">
                    <RadioGroupItem
                      value={size}
                      id={`size-${size}`}
                      className="peer sr-only"
                      disabled={!isSizeAvailable}
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Label
                              htmlFor={`size-${size}`}
                              className={cn(
                                "px-3 py-1.5 border rounded-md text-sm cursor-pointer min-w-[40px] text-center transition-all",
                                "hover:shadow-sm relative",
                                selectedSize === size
                                  ? "bg-primary text-primary-foreground border-primary font-medium"
                                  : isSizeAvailable
                                  ? "bg-background border-input hover:border-gray-400"
                                  : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-70"
                              )}
                            >
                              {size}
                              {isLowStock && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
                              )}
                            </Label>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs p-2">
                          {!isSizeAvailable ? (
                            <p className="text-red-500">Out of stock</p>
                          ) : isLowStock ? (
                            <p className="text-amber-600">
                              Only {sizeStock} left
                            </p>
                          ) : (
                            <p>In stock</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                );
              })}
            </RadioGroup>

            {/* Size Guide Link - can be implemented later */}
            <div className="mt-2">
              <button
                type="button"
                className="text-xs text-primary underline hover:text-primary/80"
                onClick={() => alert("Size guide will open here")}
              >
                Size Guide
              </button>
            </div>
          </div>
        )}

      {/* Stock Information - only show if includeStock is true and we have a selected variant */}
      {includeStock && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          {currentVariant && typeof currentVariant.stock === "number" ? (
            <div className="flex items-center">
              {currentVariant.stock > 0 ? (
                <>
                  {/* In Stock Indicator */}
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      currentVariant.stock <= 5
                        ? "text-amber-600"
                        : "text-green-600"
                    )}
                  >
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        currentVariant.stock <= 5
                          ? "bg-amber-500"
                          : "bg-green-500"
                      )}
                    />
                    <span className="font-medium">
                      {currentVariant.stock <= 5
                        ? `Only ${currentVariant.stock} left in stock`
                        : "In stock"}
                    </span>
                  </div>

                  {/* Show SKU if available */}
                  {currentVariant.sku && (
                    <div className="ml-auto text-xs text-gray-500">
                      SKU: {currentVariant.sku}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="font-medium">Out of stock</span>
                </div>
              )}
            </div>
          ) : !selectedColor && availableColors.length > 1 ? (
            <div className="text-amber-600 text-sm">
              Please select a color to check availability
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              Select options to check stock availability
            </div>
          )}

          {/* If we have variants selected, show additional info */}
          {currentVariant && currentVariant.stock > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Usually ships within 1-2 business days
            </div>
          )}
        </div>
      )}
    </div>
  );
}
