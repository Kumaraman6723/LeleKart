import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  PlusCircle,
  MinusCircle,
  Save,
  Trash2,
  Image as ImageIcon,
  Check,
  X,
  AlertCircle,
  Upload,
  Link,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";

interface VariantAttribute {
  name: string;
  values: string[];
  optional?: boolean;
}

interface VariantMatrixRow {
  id: string; // Unique identifier for the row
  attributes: Record<string, string>; // Key-value pairs of attribute name to value
  sku: string;
  price: number;
  mrp: number;
  stock: number;
  enabled: boolean; // Whether this variant combination should be created
  images: string[];
}

interface ProductVariant {
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

interface VariantImageInfo {
  rowId: string;
  imageUrl: string;
}

interface VariantMatrixGeneratorProps {
  onSaveVariants: (variants: ProductVariant[]) => void;
  existingVariants?: ProductVariant[];
  productName?: string;
}

export function VariantMatrixGenerator({
  onSaveVariants,
  existingVariants = [],
  productName = "",
}: VariantMatrixGeneratorProps) {
  const { toast } = useToast();
  const [attributes, setAttributes] = useState<VariantAttribute[]>([
    { name: "Color", values: [] },
    { name: "Size", values: [], optional: true },
  ]);
  const [newAttributeValue, setNewAttributeValue] = useState<string>("");
  const [currentAttributeIndex, setCurrentAttributeIndex] = useState<number>(0);
  const [variantRows, setVariantRows] = useState<VariantMatrixRow[]>([]);
  const [step, setStep] = useState<"define" | "configure">("define");
  const [uploadedImages, setUploadedImages] = useState<
    Record<string, string[]>
  >({});
  const [imageUploadingForRow, setImageUploadingForRow] = useState<
    string | null
  >(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [imageUrlInput, setImageUrlInput] = useState<string>("");
  const [showImageUrlInput, setShowImageUrlInput] = useState<boolean>(false);
  const [currentRowForImages, setCurrentRowForImages] = useState<string | null>(
    null
  );
  const [showImagePreviewDialog, setShowImagePreviewDialog] =
    useState<boolean>(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number>(0);
  const [batchImageUrlsInput, setBatchImageUrlsInput] = useState<string>("");
  const [showBatchUploadDialog, setShowBatchUploadDialog] =
    useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process any existing variants when component mounts
  useEffect(() => {
    if (existingVariants && existingVariants.length > 0) {
      // Extract unique attributes from existing variants
      const colors = new Set<string>();
      const sizes = new Set<string>();

      existingVariants.forEach((variant) => {
        if (variant.color) colors.add(variant.color);
        if (variant.size) sizes.add(variant.size);
      });

      setAttributes([
        { name: "Color", values: Array.from(colors) },
        { name: "Size", values: Array.from(sizes), optional: true },
      ]);

      // Also load the variant images
      const variantImageMap: Record<string, string[]> = {};
      existingVariants.forEach((variant) => {
        const rowId = `${variant.color}-${variant.size}`;

        // Parse images which may be a JSON string or already an array
        let parsedImages: string[] = [];

        if (variant.images) {
          try {
            // Check if images is a string and needs parsing
            if (typeof variant.images === "string") {
              const parsed = JSON.parse(variant.images);
              parsedImages = Array.isArray(parsed) ? parsed : [];
            } else if (Array.isArray(variant.images)) {
              // Already an array
              parsedImages = variant.images;
            }
          } catch (err) {
            console.error(`Error parsing variant images for ${rowId}:`, err);
            parsedImages = [];
          }
        }

        if (parsedImages.length > 0) {
          console.log(
            `Setting ${parsedImages.length} images for variant ${rowId}`
          );
          variantImageMap[rowId] = parsedImages;
        }
      });

      console.log("Setting uploaded images map:", variantImageMap);
      setUploadedImages(variantImageMap);
    }
  }, [existingVariants]);

  // Generate rows when attributes change but preserve uploadedImages state
  useEffect(() => {
    if (
      step === "configure" &&
      attributes.some((attr) => attr.values.length > 0)
    ) {
      // Log the current state before generating rows
      console.log("Before generating rows - State:", {
        attributes,
        variantRows,
        uploadedImages,
      });

      // Generate the rows - our improved generateVariantRows now preserves existing data
      generateVariantRows();

      // Log the state after generating rows
      console.log("After generating rows - State:", {
        attributes,
        variantRows: variantRows,
        uploadedImages,
      });
    }
  }, [step, attributes]);

  useEffect(() => {
    console.log("Current uploadedImages state:", uploadedImages);
  }, [uploadedImages]);

  const addAttributeValue = () => {
    if (!newAttributeValue.trim()) {
      toast({
        title: "Value cannot be empty",
        description: "Please enter a value for the attribute",
        variant: "destructive",
      });
      return;
    }

    // Check if value already exists
    if (
      attributes[currentAttributeIndex].values.includes(
        newAttributeValue.trim()
      )
    ) {
      toast({
        title: "Value already exists",
        description: `"${newAttributeValue.trim()}" is already in the list`,
        variant: "destructive",
      });
      return;
    }

    // Save current state of uploaded images before the matrix regenerates
    // This state needs to be preserved between regenerations
    console.log(
      "Before adding attribute value - Current uploaded images:",
      uploadedImages
    );

    // Add the new value to the current attribute
    const updatedAttributes = [...attributes];
    updatedAttributes[currentAttributeIndex].values.push(
      newAttributeValue.trim()
    );
    setAttributes(updatedAttributes);
    setNewAttributeValue("");
  };

  const removeAttributeValue = (attrIndex: number, valueIndex: number) => {
    // Log the current state before removing the attribute value (for debugging)
    console.log(
      "Before removing attribute value - Current uploaded images:",
      uploadedImages
    );

    const updatedAttributes = [...attributes];
    updatedAttributes[attrIndex].values.splice(valueIndex, 1);
    setAttributes(updatedAttributes);
  };

  const generateVariantCombinations = (
    attributesList: VariantAttribute[]
  ): Record<string, string>[] => {
    // Initial combinations array with a single empty object
    let combinations: Record<string, string>[] = [{}];

    // For each attribute in the list
    attributesList.forEach((attribute) => {
      // Create a new array to hold the updated combinations
      const newCombinations: Record<string, string>[] = [];

      // For each existing combination
      combinations.forEach((combination) => {
        // For each value of the current attribute
        attribute.values.forEach((value) => {
          // Create a new combination by adding the new attribute-value pair
          const newCombination = { ...combination, [attribute.name]: value };
          newCombinations.push(newCombination);
        });
      });

      // Replace the combinations array with the new combinations
      combinations = newCombinations;
    });

    return combinations;
  };

  const generateDefaultVariantImage = (
    color: string,
    size?: string
  ): string => {
    // Generate a placeholder image URL based on color and size
    const encodedColor = encodeURIComponent(color);
    const encodedSize = size ? encodeURIComponent(size) : "";
    return `https://placehold.co/400x400/${encodedColor}/white?text=${encodedSize}`;
  };

  const generateVariantRows = () => {
    // Safety check - if this function is triggered during an image upload process
    // or when we're in "configure" mode with no attribute changes, skip regeneration
    if (imageUploadingForRow !== null && step === "configure") {
      console.log("Skipping variant row generation during image upload");
      return;
    }

    // Filter out optional attributes that have no values
    const activeAttributes = attributes.filter(
      (attr) => !attr.optional || attr.values.length > 0
    );

    // Generate all possible combinations of attribute values
    const combinations = generateVariantCombinations(activeAttributes);

    // Prepare a map of existing row data to preserve configuration during regeneration
    const existingRowsMap: Record<string, VariantMatrixRow> = {};
    variantRows.forEach((row) => {
      existingRowsMap[row.id] = row;
    });

    // Also create a map of uploaded images to ensure we don't lose them
    const currentUploadedImagesMap = { ...uploadedImages };

    console.log("Generating variant rows with existing data:", {
      existingRowsMap,
      currentUploadedImagesMap,
    });

    // Convert combinations to variant rows
    const rowsFromCombinations = combinations.map((combo, index) => {
      const attributeValues = Object.values(combo);
      const skuBase = productName
        ? productName
            .replace(/[^a-zA-Z0-9]/g, "")
            .substring(0, 10)
            .toUpperCase()
        : "PROD";
      const sku = `${skuBase}-${attributeValues.join("-").replace(/\s+/g, "")}`;

      // Check if this combination exists in existingVariants
      const existingVariant = existingVariants?.find(
        (v) =>
          v.color === combo["Color"] &&
          (!combo["Size"] || v.size === combo["Size"])
      );

      // Create a stable row ID based on attribute values
      const rowId = attributeValues.join("-").replace(/\s+/g, "_");

      // Check if we have this row in our existing data (to preserve things like uploaded images)
      const existingRowData = existingRowsMap[rowId];

      // Check if we have uploaded images for this row
      const rowImages = currentUploadedImagesMap[rowId] || [];

      // Generate default image if no images exist
      const defaultImage =
        rowImages.length === 0
          ? [generateDefaultVariantImage(combo["Color"], combo["Size"])]
          : rowImages;

      // Create the new row, preserving all existing data
      return {
        id: rowId,
        attributes: combo,
        sku: existingRowData?.sku || existingVariant?.sku || sku,
        price: existingRowData?.price || existingVariant?.price || 0,
        mrp: existingRowData?.mrp || existingVariant?.mrp || 0,
        stock: existingRowData?.stock || existingVariant?.stock || 0,
        enabled:
          existingRowData?.enabled !== undefined
            ? existingRowData.enabled
            : !!existingVariant || true,
        // Use default image if no images exist
        images: defaultImage,
      };
    });

    console.log("Generated variant rows:", rowsFromCombinations);

    // Only update the state if we actually have rows to set (prevent empty table)
    if (rowsFromCombinations.length > 0) {
      setVariantRows(rowsFromCombinations);

      // Update the uploadedImages state with the default images
      const newUploadedImages: Record<string, string[]> = {};
      rowsFromCombinations.forEach((row) => {
        if (row.images && row.images.length > 0) {
          newUploadedImages[row.id] = row.images;
        }
      });
      setUploadedImages((prev) => ({
        ...prev,
        ...newUploadedImages,
      }));
    }
  };

  const toggleVariantEnabled = (rowId: string) => {
    setVariantRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, enabled: !row.enabled } : row
      )
    );
  };

  const updateVariantField = (
    rowId: string,
    field: "sku" | "price" | "mrp" | "stock",
    value: string | number
  ) => {
    setVariantRows((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          // For numeric fields, ensure we're storing numbers
          if (field === "price" || field === "mrp" || field === "stock") {
            // If the value is a string that's not empty, convert to number, otherwise default to 0
            const numValue =
              typeof value === "string"
                ? value.trim() !== ""
                  ? parseFloat(value)
                  : 0
                : value;
            return {
              ...row,
              [field]: numValue,
            };
          }
          // For string fields like SKU, ensure we're storing strings
          if (field === "sku") {
            const strValue = value.toString();
            return { ...row, [field]: strValue };
          }
          return row;
        }
        return row;
      })
    );
  };

  const handleBulkUpdate = (
    field: "price" | "mrp" | "stock",
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      toast({
        title: "Invalid value",
        description: "Please enter a valid number",
        variant: "destructive",
      });
      return;
    }

    setVariantRows((prev) =>
      prev.map((row) => ({
        ...row,
        [field]: numValue,
      }))
    );
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    rowId: string
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Log current state before uploading for debugging
    console.log("Before image upload - Current state:", {
      rowId,
      variantRows: variantRows.filter((r) => r.id === rowId),
      uploadedImages: uploadedImages[rowId] || [],
    });

    // Set the current row being processed
    setImageUploadingForRow(rowId);
    setUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];

      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Create FormData for file upload
        const formData = new FormData();
        formData.append("file", file);

        // Perform the upload
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        const data = await uploadResponse.json();
        if (data.url) {
          uploadedUrls.push(data.url);
        } else if (data.imageUrl) {
          uploadedUrls.push(data.imageUrl);
        } else {
          console.error("Unexpected response format from upload API:", data);
          throw new Error("Invalid response format from server");
        }

        // Update progress
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      console.log(
        `Successfully uploaded ${uploadedUrls.length} images:`,
        uploadedUrls
      );

      // Update both states atomically to prevent race conditions
      setVariantRows((prevRows) => {
        const updatedRows = prevRows.map((row) => {
          if (row.id === rowId) {
            return {
              ...row,
              images: [...(row.images || []), ...uploadedUrls],
            };
          }
          return row;
        });
        return updatedRows;
      });

      setUploadedImages((prev) => {
        const updatedImagesMap = {
          ...prev,
          [rowId]: [...(prev[rowId] || []), ...uploadedUrls],
        };
        return updatedImagesMap;
      });

      // Clear the file input
      event.target.value = "";

      toast({
        title: "Images uploaded",
        description: `Successfully uploaded ${uploadedUrls.length} images`,
      });
    } catch (error) {
      console.error("Image upload error:", error);
      toast({
        title: "Upload failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setImageUploadingForRow(null);
      setUploadProgress(0);
    }
  };

  // Process batch image URLs (one URL per line)
  const processBatchImageUrls = (rowId: string) => {
    // Log current state before processing batch URLs
    console.log("Before batch URL processing - Current state:", {
      rowId,
      variantRows: variantRows.filter((r) => r.id === rowId),
      uploadedImages: uploadedImages[rowId] || [],
    });

    if (!batchImageUrlsInput.trim()) {
      toast({
        title: "No URLs provided",
        description: "Please enter at least one image URL",
        variant: "destructive",
      });
      return;
    }

    // Split by newlines and filter out empty lines
    const urls = batchImageUrlsInput
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length === 0) {
      toast({
        title: "No valid URLs",
        description: "Please enter valid image URLs",
        variant: "destructive",
      });
      return;
    }

    console.log(
      `Processing ${urls.length} batch image URLs for row ${rowId}:`,
      urls
    );

    // Update the uploaded images map first (this is critical for variant regeneration)
    setUploadedImages((prev) => {
      const updatedImagesMap = {
        ...prev,
        [rowId]: [...(prev[rowId] || []), ...urls],
      };
      console.log(
        `Updated uploadedImages map for row ${rowId}:`,
        updatedImagesMap[rowId]
      );
      return updatedImagesMap;
    });

    // Then update the variant rows (create a deep copy to ensure state updates properly)
    const updatedRows = [...variantRows];
    const rowIndex = updatedRows.findIndex((row) => row.id === rowId);

    if (rowIndex !== -1) {
      // Create a proper copy of the row to avoid state conflicts
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        images: [...(updatedRows[rowIndex].images || []), ...urls],
      };

      console.log(
        `Updated variant row ${rowId} with batch URLs:`,
        updatedRows[rowIndex].images
      );

      // Update the state with the new array
      setVariantRows(updatedRows);
    } else {
      console.warn(`Row with ID ${rowId} not found in variantRows`);
    }

    setShowBatchUploadDialog(false);
    setBatchImageUrlsInput("");

    toast({
      title: "Images added",
      description: `Successfully added ${urls.length} image URLs`,
    });
  };

  // Show image preview modal for a row
  const showImageGallery = (rowId: string) => {
    const images = uploadedImages[rowId] || [];
    if (images.length === 0) {
      toast({
        title: "No images",
        description: "This variant has no images to preview",
        variant: "destructive",
      });
      return;
    }

    setPreviewImages(images);
    setCurrentPreviewIndex(0);
    setShowImagePreviewDialog(true);
  };

  const addImageByUrl = (rowId: string) => {
    if (!imageUrlInput.trim()) {
      toast({
        title: "URL cannot be empty",
        description: "Please enter a valid image URL",
        variant: "destructive",
      });
      return;
    }

    // Update both states atomically to prevent race conditions
    setVariantRows((prev) => {
      const updatedRows = prev.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            images: [...(row.images || []), imageUrlInput],
          };
        }
        return row;
      });
      return updatedRows;
    });

    setUploadedImages((prev) => {
      const updatedImagesMap = {
        ...prev,
        [rowId]: [...(prev[rowId] || []), imageUrlInput],
      };
      return updatedImagesMap;
    });

    setImageUrlInput("");
    setShowImageUrlInput(false);

    toast({
      title: "Image added",
      description: "Image URL has been added to the variant",
    });
  };

  const removeImage = (rowId: string, imageIndex: number) => {
    // Log current state before removing image
    console.log("Before removing image - Current state:", {
      rowId,
      imageIndex,
      variantRows: variantRows.filter((r) => r.id === rowId),
      uploadedImages: uploadedImages[rowId] || [],
    });

    // Update the uploaded images map first (this is critical for variant regeneration)
    setUploadedImages((prev) => {
      const updated = { ...prev };
      if (updated[rowId]) {
        // Get the image URL that's being removed (for logging)
        const imageBeingRemoved = updated[rowId][imageIndex];

        // Remove the image at the specified index
        updated[rowId] = updated[rowId].filter((_, idx) => idx !== imageIndex);

        console.log(
          `Removed image at index ${imageIndex} from uploadedImages for row ${rowId}:`,
          {
            removedImage: imageBeingRemoved,
            remainingImages: updated[rowId],
          }
        );
      }
      return updated;
    });

    // Then update the variant rows (create a deep copy to ensure state updates properly)
    setVariantRows((prev) => {
      const updatedRows = prev.map((row) => {
        if (row.id === rowId) {
          const updatedImages = [...row.images];

          // Get the image URL being removed (for logging)
          const imageBeingRemoved = updatedImages[imageIndex];

          // Remove the image at the specified index
          updatedImages.splice(imageIndex, 1);

          const updatedRow = { ...row, images: updatedImages };

          console.log(
            `Removed image at index ${imageIndex} from variant row ${rowId}:`,
            {
              removedImage: imageBeingRemoved,
              remainingImages: updatedRow.images,
            }
          );

          return updatedRow;
        }
        return row;
      });
      return updatedRows;
    });
  };

  const saveVariants = () => {
    // Filter only enabled variant rows
    const enabledRows = variantRows.filter((row) => row.enabled);

    if (enabledRows.length === 0) {
      toast({
        title: "No variants enabled",
        description: "Please enable at least one variant to save",
        variant: "destructive",
      });
      return;
    }

    // Check for invalid price or MRP values
    const invalidRows = enabledRows.filter(
      (row) => row.price === 0 || row.mrp === 0
    );
    if (invalidRows.length > 0) {
      toast({
        title: "Invalid values",
        description: "Price and MRP cannot be 0 for any variant",
        variant: "destructive",
      });
      return;
    }

    // Convert variant rows to product variants
    const productVariants: ProductVariant[] = enabledRows.map((row) => {
      // Find the color and size values from the attributes
      const color = row.attributes["Color"] || "";
      const size = row.attributes["Size"] || "";

      return {
        sku: row.sku,
        color,
        size,
        price: row.price,
        mrp: row.mrp,
        stock: row.stock,
        images:
          uploadedImages[row.id] && Array.isArray(uploadedImages[row.id])
            ? uploadedImages[row.id]
            : [],
      };
    });

    // Call the onSaveVariants callback with the product variants
    onSaveVariants(productVariants);
  };

  const moveToNextStep = () => {
    // Validate that we have values for required attributes
    const anyEmptyRequiredAttributes = attributes
      .filter((attr) => !attr.optional) // Only check non-optional attributes
      .some((attr) => attr.values.length === 0);

    if (anyEmptyRequiredAttributes) {
      toast({
        title: "Missing attribute values",
        description:
          "Please add at least one value for each required attribute",
        variant: "destructive",
      });
      return;
    }

    setStep("configure");
  };

  return (
    <div className="space-y-6">
      {step === "define" ? (
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Define Variant Attributes</h3>
            <p className="text-muted-foreground">
              Add possible values for each attribute to generate all variant
              combinations
            </p>

            <Tabs
              value={attributes[currentAttributeIndex].name}
              onValueChange={(value) => {
                const newIndex = attributes.findIndex(
                  (attr) => attr.name === value
                );
                if (newIndex !== -1) {
                  setCurrentAttributeIndex(newIndex);
                }
              }}
            >
              <TabsList className="mb-4">
                {attributes.map((attr, index) => (
                  <TabsTrigger key={attr.name} value={attr.name}>
                    {attr.name}
                    {attr.values.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {attr.values.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {attributes.map((attr, attrIndex) => (
                <TabsContent
                  key={attr.name}
                  value={attr.name}
                  className="space-y-4"
                >
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={`new-${attr.name}`}
                      >{`Add ${attr.name} Value`}</Label>
                      <Input
                        id={`new-${attr.name}`}
                        value={
                          currentAttributeIndex === attrIndex
                            ? newAttributeValue
                            : ""
                        }
                        onChange={(e) => setNewAttributeValue(e.target.value)}
                        placeholder={`Enter a new ${attr.name.toLowerCase()} value`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addAttributeValue();
                          }
                        }}
                      />
                    </div>
                    <Button onClick={addAttributeValue} type="button">
                      Add
                    </Button>
                  </div>

                  <div className="border rounded-md p-3">
                    <h4 className="text-sm font-medium mb-2">Added Values:</h4>
                    {attr.values.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        No values added yet
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {attr.values.map((value, valueIndex) => (
                          <Badge
                            key={value}
                            variant="outline"
                            className="flex items-center gap-1 py-1.5"
                          >
                            {value}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                removeAttributeValue(attrIndex, valueIndex)
                              }
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="flex justify-end">
            <Button onClick={moveToNextStep} type="button">
              Continue to Configure Variants
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Configure Variants</h3>
              <p className="text-muted-foreground">
                {variantRows.length} variants generated. Configure details and
                enable/disable as needed.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setStep("define")}
              >
                Back to Attributes
              </Button>
              <Button type="button" onClick={saveVariants}>
                <Save className="mr-2 h-4 w-4" />
                Save Variants
              </Button>
            </div>
          </div>

          {/* Bulk Update Controls */}
          <Card className="p-4">
            <h4 className="font-medium mb-2">Bulk Update</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="bulk-price">Set All Prices</Label>
                <div className="flex gap-2">
                  <Input
                    id="bulk-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) =>
                      handleBulkUpdate(
                        "price",
                        (
                          e.currentTarget
                            .previousElementSibling as HTMLInputElement
                        ).value
                      )
                    }
                  >
                    Apply
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="bulk-mrp">Set All MRP</Label>
                <div className="flex gap-2">
                  <Input
                    id="bulk-mrp"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="MRP"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) =>
                      handleBulkUpdate(
                        "mrp",
                        (
                          e.currentTarget
                            .previousElementSibling as HTMLInputElement
                        ).value
                      )
                    }
                  >
                    Apply
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="bulk-stock">Set All Stock</Label>
                <div className="flex gap-2">
                  <Input
                    id="bulk-stock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Stock"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) =>
                      handleBulkUpdate(
                        "stock",
                        (
                          e.currentTarget
                            .previousElementSibling as HTMLInputElement
                        ).value
                      )
                    }
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Variant Table */}
          <ScrollArea className="h-[600px] border rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-[60px]">Use</TableHead>
                  {attributes.map((attr) => (
                    <TableHead key={attr.name}>{attr.name}</TableHead>
                  ))}
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">MRP</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Images</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variantRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Checkbox
                        checked={row.enabled}
                        onCheckedChange={() => toggleVariantEnabled(row.id)}
                      />
                    </TableCell>

                    {attributes.map((attr) => (
                      <TableCell key={`${row.id}-${attr.name}`}>
                        {row.attributes[attr.name]}
                      </TableCell>
                    ))}

                    <TableCell>
                      <Input
                        value={row.sku}
                        onChange={(e) =>
                          updateVariantField(row.id, "sku", e.target.value)
                        }
                        className="max-w-[150px]"
                      />
                    </TableCell>

                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.price}
                        onChange={(e) =>
                          updateVariantField(row.id, "price", e.target.value)
                        }
                        className="max-w-[100px] text-right"
                      />
                    </TableCell>

                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.mrp}
                        onChange={(e) =>
                          updateVariantField(row.id, "mrp", e.target.value)
                        }
                        className="max-w-[100px] text-right"
                      />
                    </TableCell>

                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={row.stock}
                        onChange={(e) =>
                          updateVariantField(row.id, "stock", e.target.value)
                        }
                        className="max-w-[100px] text-right"
                      />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* Show image count badge */}
                        {uploadedImages[row.id] &&
                          Array.isArray(uploadedImages[row.id]) &&
                          uploadedImages[row.id].length > 0 && (
                            <Badge variant="outline">
                              {uploadedImages[row.id].length} images
                            </Badge>
                          )}

                        {/* Show image uploading progress */}
                        {imageUploadingForRow === row.id ? (
                          <Badge variant="outline" className="animate-pulse">
                            Uploading: {uploadProgress}%
                          </Badge>
                        ) : (
                          <>
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
                                input.onchange = function (e: Event) {
                                  // Convert the regular Event to a format handleFileChange can process
                                  const files = (e.target as HTMLInputElement)
                                    .files;
                                  if (files) {
                                    const mockEvent = {
                                      target: {
                                        files: files,
                                      },
                                    } as React.ChangeEvent<HTMLInputElement>;
                                    handleFileChange(mockEvent, row.id);
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
                              onClick={() => {
                                setCurrentRowForImages(row.id);
                                setShowImageUrlInput(
                                  !showImageUrlInput ||
                                    currentRowForImages !== row.id
                                );
                              }}
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
                              onClick={() => {
                                setCurrentRowForImages(row.id);
                                setShowBatchUploadDialog(true);
                              }}
                              title="Add multiple image URLs at once"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>

                            {/* Gallery view button */}
                            {uploadedImages[row.id]?.length > 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => showImageGallery(row.id)}
                                title="View all images"
                              >
                                <ImageIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>

                      {/* URL input field */}
                      {showImageUrlInput && currentRowForImages === row.id && (
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
                            onClick={() => addImageByUrl(row.id)}
                          >
                            Add
                          </Button>
                        </div>
                      )}

                      {/* Show uploaded images */}
                      {uploadedImages[row.id] &&
                        Array.isArray(uploadedImages[row.id]) &&
                        uploadedImages[row.id].length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {uploadedImages[row.id].map((imageUrl, idx) => (
                              <div
                                key={idx}
                                className="relative group h-12 w-12"
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Variant ${row.id} image ${idx + 1}`}
                                  className="h-full w-full object-cover rounded border"
                                  onError={(e) => {
                                    // Show error indicator for broken images
                                    (e.target as HTMLImageElement).src =
                                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cline x1='12' y1='8' x2='12' y2='12'%3E%3C/line%3E%3Cline x1='12' y1='16' x2='12.01' y2='16'%3E%3C/line%3E%3C/svg%3E";
                                    (e.target as HTMLImageElement).className +=
                                      " p-2 bg-red-50";
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="h-5 w-5 absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeImage(row.id, idx)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="flex justify-end">
            <Button type="button" onClick={saveVariants}>
              <Save className="mr-2 h-4 w-4" />
              Save Variants
            </Button>
          </div>
        </div>
      )}

      {/* Batch URL Upload Dialog */}
      <Dialog
        open={showBatchUploadDialog}
        onOpenChange={setShowBatchUploadDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Batch Add Image URLs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label
              htmlFor="batch-urls"
              className="text-sm text-muted-foreground"
            >
              Enter one URL per line
            </Label>
            <textarea
              id="batch-urls"
              value={batchImageUrlsInput}
              onChange={(e) => setBatchImageUrlsInput(e.target.value)}
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
              className="w-full rounded-md border border-input p-3 h-36 text-sm"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowBatchUploadDialog(false);
                setBatchImageUrlsInput("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => processBatchImageUrls(currentRowForImages || "")}
            >
              Add Images
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Gallery Dialog */}
      <Dialog
        open={showImagePreviewDialog}
        onOpenChange={setShowImagePreviewDialog}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Variant Images</DialogTitle>
          </DialogHeader>
          <div className="my-4">
            {previewImages.length > 0 && (
              <div className="flex flex-col items-center space-y-4">
                {/* Main image */}
                <div className="relative w-full h-60 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={previewImages[currentPreviewIndex]}
                    alt="Variant preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/400x400?text=Image+Error";
                    }}
                  />
                </div>

                {/* Image pagination */}
                <div className="flex items-center justify-between w-full">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPreviewIndex((prev) =>
                        prev > 0 ? prev - 1 : previewImages.length - 1
                      )
                    }
                    disabled={previewImages.length <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    {currentPreviewIndex + 1} of {previewImages.length}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPreviewIndex((prev) =>
                        prev < previewImages.length - 1 ? prev + 1 : 0
                      )
                    }
                    disabled={previewImages.length <= 1}
                  >
                    Next
                  </Button>
                </div>

                {/* Thumbnails */}
                {previewImages.length > 1 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {previewImages.map((img, idx) => (
                      <div
                        key={idx}
                        className={`w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2 ${
                          idx === currentPreviewIndex
                            ? "border-primary"
                            : "border-transparent"
                        }`}
                        onClick={() => setCurrentPreviewIndex(idx)}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/100x100?text=Error";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setShowImagePreviewDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
