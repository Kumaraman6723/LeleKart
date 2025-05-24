import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  X,
  Plus,
  Save,
  Trash2,
  Check,
  Edit,
  ImagePlus,
  Upload,
  Link,
  ExternalLink,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/file-upload";
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

interface MultiVariantTableProps {
  variants: ProductVariant[];
  onAddVariant: () => void;
  onDeleteVariant: (variant: ProductVariant) => void;
  onEditVariant: (variant: ProductVariant) => void;
  onSaveNewVariant: (updatedVariant: ProductVariant) => void;
  onUpdateVariantField?: (field: keyof ProductVariant, value: any) => void;
  newVariantExists: boolean;
  currentVariant: ProductVariant | null;
  onCancelNewVariant: () => void;
}

// Simple type for variant field editing state
interface VariantField {
  value: string;
  cursorPosition: number | null;
}

export function MultiVariantTable({
  variants,
  onAddVariant,
  onDeleteVariant,
  onEditVariant,
  onSaveNewVariant,
  onUpdateVariantField,
  newVariantExists,
  currentVariant,
  onCancelNewVariant,
}: MultiVariantTableProps) {
  // Input field refs to maintain cursor position
  const skuRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const sizeRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const mrpRef = useRef<HTMLInputElement>(null);
  const stockRef = useRef<HTMLInputElement>(null);

  // Create independent field states to avoid re-renders affecting cursor position
  const [fields, setFields] = useState({
    sku: { value: "", cursorPosition: null } as VariantField,
    color: { value: "", cursorPosition: null } as VariantField,
    size: { value: "", cursorPosition: null } as VariantField,
    price: { value: "0", cursorPosition: null } as VariantField,
    mrp: { value: "0", cursorPosition: null } as VariantField,
    stock: { value: "0", cursorPosition: null } as VariantField,
  });

  // Map of field names to refs
  const fieldRefs = {
    sku: skuRef,
    color: colorRef,
    size: sizeRef,
    price: priceRef,
    mrp: mrpRef,
    stock: stockRef,
  };

  // Store the underlying variant ID to preserve during editing
  const [editingVariantId, setEditingVariantId] = useState<number | undefined>(
    undefined
  );

  // Track which field was last focused
  const [activeField, setActiveField] = useState<string | null>(null);

  // Add state for variant images
  const [variantImages, setVariantImages] = useState<string[]>([]);

  // Add new state for image URL input
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  // Modal state for batch URL input
  const [showBatchUrlModal, setShowBatchUrlModal] = useState(false);
  const [batchUrlInput, setBatchUrlInput] = useState("");

  // Update local field values when parent variant changes
  useEffect(() => {
    if (currentVariant) {
      // Create new field objects with current values
      setFields({
        sku: { value: currentVariant.sku || "", cursorPosition: null },
        color: { value: currentVariant.color || "", cursorPosition: null },
        size: { value: currentVariant.size || "", cursorPosition: null },
        price: {
          value: currentVariant.price?.toString() || "0",
          cursorPosition: null,
        },
        mrp: {
          value: currentVariant.mrp?.toString() || "0",
          cursorPosition: null,
        },
        stock: {
          value: currentVariant.stock?.toString() || "0",
          cursorPosition: null,
        },
      });

      // Only set variant images if they exist in currentVariant
      if (currentVariant.images && currentVariant.images.length > 0) {
        setVariantImages(currentVariant.images);
      }
      setEditingVariantId(currentVariant.id);
    }
  }, [currentVariant]);

  // Handle field update while preserving cursor position
  const handleFieldChange = (
    fieldName: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    // Get cursor position before state update
    const cursorPosition = e.target.selectionStart;

    // Update the field value
    setFields((prev) => {
      const newFields = { ...prev };
      newFields[fieldName as keyof typeof newFields] = {
        value: e.target.value,
        cursorPosition,
      };
      return newFields;
    });

    // Mark this field as active
    setActiveField(fieldName);

    // Ensure we're also updating the currentVariant value through the parent component
    if (currentVariant && onUpdateVariantField) {
      // Convert values to the right type based on field name
      let valueToUpdate: any;
      if (fieldName === "price" || fieldName === "mrp") {
        valueToUpdate = parseFloat(e.target.value) || 0;
      } else if (fieldName === "stock") {
        valueToUpdate = parseInt(e.target.value) || 0;
      } else {
        valueToUpdate = e.target.value;
      }

      // Call the parent's update function with error handling
      try {
        console.log(`Updating ${fieldName} to:`, valueToUpdate);
        if (onUpdateVariantField) {
          onUpdateVariantField(
            fieldName as keyof ProductVariant,
            valueToUpdate
          );
        } else {
          console.warn(
            "onUpdateVariantField is not defined in MultiVariantTable"
          );
        }
      } catch (error) {
        console.error("Error in MultiVariantTable.handleFieldChange:", error);
      }
    }
  };

  // Restore focus and cursor position after render
  useEffect(() => {
    if (activeField) {
      const ref = fieldRefs[activeField as keyof typeof fieldRefs];
      const cursorPosition =
        fields[activeField as keyof typeof fields].cursorPosition;

      if (ref.current && cursorPosition !== null) {
        setTimeout(() => {
          ref.current?.focus();
          ref.current?.setSelectionRange(cursorPosition, cursorPosition);
        }, 0);
      }
    }
  }, [fields, activeField]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (variantImages.length + files.length > 8) {
      toast({
        title: "Maximum images reached",
        description: "You can upload a maximum of 8 images per variant",
        variant: "destructive",
      });
      return;
    }

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setVariantImages((prev) => [...prev, event.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle adding image by URL
  const handleAddImageByUrl = () => {
    if (!imageUrlInput.trim()) {
      toast({
        title: "URL required",
        description: "Please enter an image URL",
        variant: "destructive",
      });
      return;
    }

    if (variantImages.length >= 8) {
      toast({
        title: "Maximum images reached",
        description: "You can upload a maximum of 8 images per variant",
        variant: "destructive",
      });
      return;
    }

    setVariantImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput("");
    setShowImageUrlInput(false);
  };

  // Handle adding multiple URLs
  const handleAddMultipleUrls = (urls: string[]) => {
    const validUrls = urls.filter((url) => url.trim());
    if (variantImages.length + validUrls.length > 8) {
      toast({
        title: "Maximum images reached",
        description: "You can upload a maximum of 8 images per variant",
        variant: "destructive",
      });
      return;
    }

    setVariantImages((prev) => [...prev, ...validUrls]);
  };

  // Handle removing an image
  const handleRemoveImage = (index: number) => {
    setVariantImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle saving the variant
  const handleSave = () => {
    // Construct a variant object from our field values
    const variant: ProductVariant = {
      id: editingVariantId,
      productId: currentVariant?.productId,
      sku: fields.sku.value,
      color: fields.color.value,
      size: fields.size.value,
      price: parseFloat(fields.price.value) || 0,
      mrp: parseFloat(fields.mrp.value) || 0,
      stock: parseInt(fields.stock.value) || 0,
      images: variantImages, // Include the images in the variant
    };

    // Send to parent component
    onSaveNewVariant(variant);

    // Reset active field and images
    setActiveField(null);
    setVariantImages([]);
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>MRP</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Images</TableHead>
            <TableHead className="text-center">
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setVariantImages([]); // Reset images array
                    onAddVariant();
                  }}
                  className="w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50 gap-1"
                  disabled={newVariantExists} // Disable if already editing a variant
                >
                  <Plus className="h-4 w-4" />
                  Add More Variant
                </Button>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Show all existing variants */}
          {variants.map((variant) => (
            <TableRow
              key={variant.id || variant.sku}
              className="hover:bg-gray-50"
            >
              <TableCell className="font-medium">{variant.sku}</TableCell>
              <TableCell>
                {variant.color && variant.color.trim() !== "" ? (
                  <div className="flex flex-wrap gap-1">
                    {variant.color
                      .split(/,\s*/)
                      .filter(Boolean)
                      .map((color, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                        >
                          {color}
                        </span>
                      ))}
                  </div>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {variant.size && variant.size.trim() !== "" ? (
                  <div className="flex flex-wrap gap-1">
                    {variant.size
                      .split(/,\s*/)
                      .filter(Boolean)
                      .map((size, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                        >
                          {size}
                        </span>
                      ))}
                  </div>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>₹{variant.price}</TableCell>
              <TableCell>₹{variant.mrp || "—"}</TableCell>
              <TableCell>{variant.stock}</TableCell>
              <TableCell>
                {Array.isArray(variant.images) && variant.images.length > 0 ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-2">
                      {variant.images.slice(0, 3).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Variant ${idx}`}
                          className="h-8 w-8 rounded-md object-cover border border-border"
                        />
                      ))}
                    </div>
                    {variant.images.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{variant.images.length - 3} more
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No images
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditVariant(variant)}
                    className="text-blue-600 h-8 w-8 hover:bg-blue-50"
                    title="Edit Variant"
                    disabled={newVariantExists} // Disable if already editing another variant
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteVariant(variant)}
                    className="text-red-600 h-8 w-8 hover:bg-red-50"
                    title="Delete Variant"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}

          {/* New variant editing row - using independent field states */}
          {newVariantExists && (
            <TableRow className="bg-blue-50/40 hover:bg-blue-50/60">
              <TableCell>
                <Input
                  ref={skuRef}
                  placeholder="SKU"
                  value={fields.sku.value}
                  onChange={(e) => handleFieldChange("sku", e)}
                  onFocus={() => setActiveField("sku")}
                  className="h-9"
                />
              </TableCell>
              <TableCell>
                <Input
                  ref={colorRef}
                  placeholder="Red"
                  value={fields.color.value}
                  onChange={(e) => handleFieldChange("color", e)}
                  onFocus={() => setActiveField("color")}
                  className="h-9"
                />
              </TableCell>
              <TableCell>
                <Input
                  ref={sizeRef}
                  placeholder="S, M"
                  value={fields.size.value}
                  onChange={(e) => handleFieldChange("size", e)}
                  onFocus={() => setActiveField("size")}
                  className="h-9"
                />
              </TableCell>
              <TableCell>
                <Input
                  ref={priceRef}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={fields.price.value}
                  onChange={(e) => handleFieldChange("price", e)}
                  onFocus={() => setActiveField("price")}
                  className="h-9"
                />
              </TableCell>
              <TableCell>
                <Input
                  ref={mrpRef}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={fields.mrp.value}
                  onChange={(e) => handleFieldChange("mrp", e)}
                  onFocus={() => setActiveField("mrp")}
                  className="h-9"
                />
              </TableCell>
              <TableCell>
                <Input
                  ref={stockRef}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={fields.stock.value}
                  onChange={(e) => handleFieldChange("stock", e)}
                  onFocus={() => setActiveField("stock")}
                  className="h-9"
                />
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  {/* Display current images */}
                  {variantImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {variantImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img}
                            alt={`Variant ${idx + 1}`}
                            className="h-16 w-16 object-cover border rounded-md"
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hidden group-hover:block"
                            onClick={() => handleRemoveImage(idx)}
                            title="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Image upload options */}
                  <div className="flex items-center gap-2">
                    {/* File upload button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.multiple = true;
                        input.onchange = (e) => {
                          const files = (e.target as HTMLInputElement).files;
                          if (files) {
                            const mockEvent = {
                              target: {
                                files: files,
                              },
                            } as React.ChangeEvent<HTMLInputElement>;
                            handleFileUpload(mockEvent);
                          }
                        };
                        input.click();
                      }}
                      title="Upload image files"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>

                    {/* URL input toggle button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => setShowImageUrlInput(!showImageUrlInput)}
                      title="Add image by URL"
                    >
                      <Link className="h-4 w-4" />
                    </Button>

                    {/* Batch URL input button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => setShowBatchUrlModal(true)}
                      title="Add multiple image URLs at once"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* URL input field */}
                  {showImageUrlInput && (
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="Enter image URL"
                        className="flex-1 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddImageByUrl}
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-2">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleSave}
                    className="h-9 gap-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Check className="h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onCancelNewVariant}
                    className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}

          {/* Empty state */}
          {variants.length === 0 && !newVariantExists && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-6 text-muted-foreground"
              >
                No variants added yet. Click "Add More Variant" to add different
                variations of your product.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Modal for batch adding image URLs */}
      {showBatchUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Batch Add Image URLs</h2>
              <button onClick={() => setShowBatchUrlModal(false)} title="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="block mb-2 text-sm">Enter one URL per line</label>
            <textarea
              className="w-full border rounded p-2 mb-4 text-sm"
              rows={6}
              value={batchUrlInput}
              onChange={(e) => setBatchUrlInput(e.target.value)}
              placeholder={
                "https://example.com/image1.jpg\nhttps://example.com/image2.jpg"
              }
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBatchUrlModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const urls = batchUrlInput
                    .split("\n")
                    .map((url) => url.trim())
                    .filter(Boolean);
                  handleAddMultipleUrls(urls);
                  setBatchUrlInput("");
                  setShowBatchUrlModal(false);
                }}
              >
                Add Images
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
