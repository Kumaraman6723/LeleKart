import { useState, useEffect, useCallback } from "react";
import { isFirefox } from "@/lib/browser-detection";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  calculateGstAmount,
  calculatePriceWithGst,
  formatPriceWithGstBreakdown,
} from "@shared/utils/gst";
import {
  ImagePlus,
  Tag,
  AlertCircle,
  HelpCircle,
  Info,
  CheckCircle,
  PackageCheck,
  PackageOpen,
  Heading,
  ShieldCheck,
  Loader2,
  Check,
  X,
  Plus,
  Copy,
  Layers,
  Edit,
  Trash2,
  FileText,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { VariantForm, ProductVariant } from "@/components/product/variant-form";
import { MultiVariantTable } from "@/components/product/multi-variant-table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Form validation schema
const productSchema = z
  .object({
    name: z.string().min(5, "Product name must be at least 5 characters"),
    brand: z.string().optional().nullable(),
    category: z.string().min(2, "Category is required"),
    subcategory: z.string().optional().nullable(),
    subcategoryId: z.number().optional().nullable(),
    price: z.coerce
      .number()
      .min(1, "Price must be greater than 0")
      .nonnegative("Price cannot be negative"),
    mrp: z.coerce
      .number()
      .min(1, "MRP must be greater than 0")
      .nonnegative("MRP cannot be negative")
      .optional()
      .nullable(),
    purchasePrice: z.coerce
      .number()
      .min(0, "Purchase price cannot be negative")
      .optional()
      .nullable(),
    gstRate: z.coerce
      .number()
      .min(0, "GST rate cannot be negative")
      .max(100, "GST rate cannot exceed 100%")
      .optional()
      .nullable(),
    warranty: z.coerce
      .number()
      .min(0, "Warranty period cannot be negative")
      .max(60, "Warranty period cannot exceed 60 months")
      .optional()
      .nullable(),
    returnPolicy: z
      .string()
      .min(1, "Return policy is required")
      .max(1000, "Return policy cannot exceed 1000 characters")
      .optional()
      .nullable(),
    customReturnPolicy: z.string().optional().nullable(),
    description: z
      .string()
      .min(20, "Description must be at least 20 characters"),
    specifications: z.string().optional().nullable(),
    sku: z.string().optional().nullable(),
    stock: z.coerce
      .number()
      .min(0, "Stock cannot be negative")
      .nonnegative("Stock cannot be negative"),
    weight: z.coerce.number().optional().nullable(),
    length: z.coerce.number().optional().nullable(),
    width: z.coerce.number().optional().nullable(),
    height: z.coerce.number().optional().nullable(),
    color: z.string().optional().nullable(),
    size: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      // Validate that when returnPolicy is 'custom', customReturnPolicy must be provided
      if (data.returnPolicy === "custom") {
        return (
          !!data.customReturnPolicy &&
          !isNaN(parseInt(data.customReturnPolicy)) &&
          parseInt(data.customReturnPolicy) > 0
        );
      }
      return true;
    },
    {
      message:
        "Please enter a valid number of days for your custom return policy",
      path: ["customReturnPolicy"],
    }
  );

interface AddProductFormProps {
  redirectTo?: string; // Where to redirect after successful submission
  initialValues?: any; // For editing existing products
}

// Main component
export default function AddProductForm({
  redirectTo = "/seller/products",
  initialValues,
}: AddProductFormProps) {
  // Initialize state with values from initialValues if provided (for edit mode)
  // Ensure images are properly initialized, handling different possible formats
  const [uploadedImages, setUploadedImages] = useState<string[]>(() => {
    if (!initialValues?.images) return [];

    // Handle array of images
    if (Array.isArray(initialValues.images)) {
      return initialValues.images;
    }

    // Handle string (could be JSON string or a single URL)
    if (typeof initialValues.images === "string") {
      try {
        // Check if it's a JSON string
        if (
          initialValues.images.startsWith("[") &&
          initialValues.images.includes("]")
        ) {
          const parsed = JSON.parse(initialValues.images);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
        // It's a single URL
        return [initialValues.images];
      } catch (e) {
        console.error("Failed to parse image data:", e);
        return [initialValues.images]; // Treat as single URL
      }
    }

    return [];
  });
  const [variants, setVariants] = useState<ProductVariant[]>(
    initialValues?.variants?.filter((v: any) => v.id > 0) || []
  );
  const [draftVariants, setDraftVariants] = useState<ProductVariant[]>(
    initialValues?.variants?.filter((v: any) => v.id < 0) || []
  );
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(
    null
  );
  const [variantImages, setVariantImages] = useState<string[]>([]);
  const [newVariantRow, setNewVariantRow] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Query to fetch categories with GST rates
  const { data: categoriesData } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Query to fetch all subcategories
  const { data: subcategoriesData } = useQuery({
    queryKey: ["/api/subcategories/all"],
  });

  // Process categories for use in select dropdown and get GST rates
  const categories =
    categoriesData?.map((category: any) => category.name) || [];
  const categoryGstRates =
    categoriesData?.reduce((acc: Record<string, number>, category: any) => {
      acc[category.name] = parseFloat(category.gstRate) || 0;
      return acc;
    }, {}) || {};

  // Debug: Log initial form values and subcategory info
  useEffect(() => {
    if (initialValues) {
      console.log("Initial product values loaded:", initialValues);

      // Log subcategory information specifically
      console.log("Subcategory info:", {
        subcategory: initialValues.subcategory,
        subcategoryId: initialValues.subcategoryId,
      });
    }
  }, [initialValues, subcategoriesData]);

  // Form setup with validation
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: initialValues
      ? {
          name: initialValues.name || "",
          brand: initialValues.brand || "",
          category: initialValues.category || "",
          subcategory: initialValues.subcategory || "",
          subcategoryId: initialValues.subcategoryId || null,
          price: initialValues.price,
          mrp: initialValues.mrp,
          purchasePrice: initialValues.purchasePrice,
          gstRate: initialValues.gstRate,
          warranty: initialValues.warranty,
          returnPolicy: initialValues.returnPolicy || "7",
          customReturnPolicy: initialValues.customReturnPolicy,
          description: initialValues.description || "",
          specifications: initialValues.specifications || "",
          sku: initialValues.sku || "",
          stock: initialValues.stock,
          weight: initialValues.weight,
          length: initialValues.length,
          width: initialValues.width,
          height: initialValues.height,
          color: initialValues.color || "",
          size: initialValues.size || "",
        }
      : {
          name: "",
          brand: "",
          category: "",
          subcategory: "",
          subcategoryId: null,
          price: undefined,
          mrp: undefined,
          purchasePrice: undefined,
          gstRate: undefined,
          warranty: undefined,
          returnPolicy: "7", // Default to 7 days
          customReturnPolicy: undefined,
          description: "",
          specifications: "",
          sku: "",
          stock: undefined,
          weight: undefined,
          length: undefined,
          width: undefined,
          height: undefined,
          color: "",
          size: "",
        },
  });

  // Watch important fields to calculate completion and for GST calculation
  const watchedFields = form.watch([
    "name",
    "category",
    "price",
    "description",
    "stock",
    "gstRate",
  ]);

  // Get the currently selected category's GST rate
  const getSelectedCategoryGstRate = (): number => {
    const selectedCategory = form.getValues("category");
    return selectedCategory ? categoryGstRates[selectedCategory] || 0 : 0;
  };

  // Calculate price with GST included
  const calculateFinalPrice = (): {
    basePrice: number;
    gstRate: number;
    gstAmount: number;
    finalPrice: number;
  } => {
    const basePrice = form.getValues("price") || 0;
    // Use custom GST rate if provided, otherwise use category GST rate
    const customGstRate = form.getValues("gstRate");
    const gstRate =
      customGstRate !== undefined && customGstRate !== null
        ? parseFloat(customGstRate.toString())
        : getSelectedCategoryGstRate();
    const gstAmount = calculateGstAmount(basePrice, gstRate);
    const finalPrice = basePrice + gstAmount;

    return { basePrice, gstRate, gstAmount, finalPrice };
  };

  // Calculate form completion status
  const getCompletionStatus = () => {
    const basicFields = ["name", "category", "price"];
    const descriptionComplete =
      watchedFields.description && watchedFields.description.length >= 20;
    const inventoryFields = ["stock"];

    const basicComplete = basicFields.every(
      (field) => watchedFields[field as keyof typeof watchedFields]
    );
    const inventoryComplete = inventoryFields.every(
      (field) => watchedFields[field as keyof typeof watchedFields]
    );
    const imagesComplete = uploadedImages.length > 0;

    const total = [
      basicComplete,
      descriptionComplete,
      inventoryComplete,
      imagesComplete,
    ].filter(Boolean).length;
    return {
      basicComplete,
      descriptionComplete,
      inventoryComplete,
      imagesComplete,
      percentage: Math.round((total / 4) * 100),
    };
  };

  const completionStatus = getCompletionStatus();

  // Handle file upload for product images
  const handleAddImage = useCallback(
    (fileOrUrl: File | string) => {
      if (uploadedImages.length >= 8) {
        toast({
          title: "Maximum images reached",
          description: "You can upload a maximum of 8 images per product",
          variant: "destructive",
        });
        return;
      }

      if (typeof fileOrUrl === "string") {
        // Validate URL before adding
        try {
          // Check if it's a valid URL
          const url = new URL(fileOrUrl);

          // Check if URL uses http or https protocol
          if (!url.protocol.startsWith("http")) {
            toast({
              title: "Invalid URL",
              description: "URL must start with http:// or https://",
              variant: "destructive",
            });
            return;
          }

          // Check if URL has an image extension
          const validExtensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".webp",
            ".svg",
          ];
          const hasValidExtension = validExtensions.some((ext) =>
            url.pathname.toLowerCase().endsWith(ext)
          );

          // If URL doesn't have a valid extension, we'll check if it responds with an image
          if (!hasValidExtension) {
            // We'll still add it but show a warning
            toast({
              title: "URL added",
              description:
                "The URL doesn't end with a common image extension. Please verify the image appears correctly.",
              variant: "default",
            });
          } else {
            toast({
              title: "Image URL added",
              description: "Image URL has been added successfully.",
              variant: "default",
            });
          }

          // Add URL to uploaded images
          setUploadedImages((prevImages) => [...prevImages, fileOrUrl]);
        } catch (error) {
          // URL is invalid
          toast({
            title: "Invalid URL",
            description: "Please enter a valid image URL.",
            variant: "destructive",
          });
        }
        return;
      }

      try {
        // Apply additional precautions for Firefox
        const isFirefoxBrowser = isFirefox();

        if (isFirefoxBrowser) {
          console.log(
            "Detected Firefox browser, using safe FileReader implementation for main image"
          );
        }

        // Create a preview URL for the file - Firefox safe implementation
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && event.target.result) {
            // Use functional state update to prevent race conditions
            setUploadedImages((prevImages) => [
              ...prevImages,
              event.target.result as string,
            ]);
          }
        };
        reader.onerror = () => {
          console.error("FileReader error occurred");
          toast({
            title: "Error processing image",
            description:
              "There was a problem processing your image. Please try another file.",
            variant: "destructive",
          });
        };
        reader.readAsDataURL(fileOrUrl);
      } catch (error) {
        console.error("Error handling file upload:", error);
        toast({
          title: "Error processing image",
          description:
            "There was a problem processing your image. Please try another file.",
          variant: "destructive",
        });
      }
    },
    [uploadedImages, toast]
  );

  // Remove image at a given index
  const handleRemoveImage = (index: number) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
  };

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // Use direct JSON data instead of FormData for better validation handling
        console.log("Submitting data to API:", data);
        const response = await apiRequest("POST", "/api/products", data);

        if (!response.ok) {
          // Try to parse the error response
          const errorData = await response.json().catch(() => null);

          if (errorData && errorData.error) {
            // Check if it's a validation error
            if (Array.isArray(errorData.error)) {
              const errorMessages = errorData.error
                .map((err: any) => {
                  return `${err.path?.[0] || "Field"}: ${err.message}`;
                })
                .join(", ");
              throw new Error(`Validation failed: ${errorMessages}`);
            } else if (typeof errorData.error === "string") {
              throw new Error(errorData.error);
            }
          }

          throw new Error(
            "Failed to create product. Please check all required fields."
          );
        }

        return await response.json();
      } catch (error: any) {
        console.error("Product creation error:", error);
        throw new Error(error.message || "Failed to create product");
      }
    },
    onSuccess: (data) => {
      // Invalidate both general products and seller-specific products queries
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });

      // Get the current user to include sellerId in the cache key
      const currentUser = queryClient.getQueryData<any>(["/api/user"]);

      // Use broader invalidation for seller products to ensure all variants of the query are invalidated
      // This is important because we might have different query parameters (limit, page, etc.)
      queryClient.invalidateQueries({
        queryKey: ["/api/seller/products", currentUser?.id],
        // Set this to exact: false to invalidate all seller product queries regardless of parameters
        exact: false,
      });

      toast({
        title: "Product added successfully",
        description: "Your product has been submitted for approval.",
      });
      // Don't navigate immediately to let seller see the updated list
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save as draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // Combine both regular variants and draft variants
        const allVariants = [...variants, ...draftVariants];

        // The data is already prepared in the onSaveAsDraft function
        const response = await apiRequest("POST", "/api/products/draft", {
          ...data,
          variants: allVariants, // Include all variants
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          if (errorData && errorData.error) {
            throw new Error(
              typeof errorData.error === "string"
                ? errorData.error
                : "Failed to save draft"
            );
          }
          throw new Error("Failed to save product draft");
        }

        return await response.json();
      } catch (error: any) {
        console.error("Draft saving error:", error);
        throw new Error(error.message || "Failed to save draft");
      }
    },
    onSuccess: () => {
      // Invalidate both general products and seller-specific products queries
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });

      // Get the current user to include sellerId in the cache key
      const currentUser = queryClient.getQueryData<any>(["/api/user"]);

      // Use broader invalidation for seller products with exact: false to invalidate all seller product queries
      queryClient.invalidateQueries({
        queryKey: ["/api/seller/products", currentUser?.id],
        exact: false,
      });

      toast({
        title: "Draft saved successfully",
        description:
          "Your product draft has been saved and can be edited later.",
      });
      // Don't navigate immediately to let seller see the updated list
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save draft",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Variant handling methods - Firefox safe implementation
  const handleAddVariant = () => {
    // Prevent adding a new variant if one is already being edited
    if (currentVariant !== null && newVariantRow) {
      toast({
        title: "Already adding a variant",
        description:
          "Please save or cancel the current variant before adding another one.",
        variant: "destructive",
      });
      return;
    }

    // Get safe values from the form - Firefox has issues with undefined/null conversions
    const formSku = form.getValues("sku") || "";
    const variantsCount = variants.length + draftVariants.length;
    const safePrice =
      parseFloat(form.getValues("price")?.toString() || "0") || 0;
    const safeMrp = parseFloat(form.getValues("mrp")?.toString() || "0") || 0;
    const safeStock = parseInt(form.getValues("stock")?.toString() || "0") || 0;

    // Create a unique timestamp ID for the variant
    const uniqueId = Date.now();

    // Generate a smaller temporary ID for client-side only (server will assign real ID)
    // Make it negative to ensure it doesn't conflict with real database IDs
    const tempId = -Math.floor(Math.random() * 1000000);

    // Initialize a new variant with default values and a guaranteed unique ID
    const newVariant: ProductVariant = {
      id: tempId, // Temporary negative ID to avoid conflict with real IDs
      sku: formSku
        ? `${formSku}-${variantsCount + 1}`
        : `SKU-${uniqueId}-${variantsCount + 1}`,
      color: "",
      size: "",
      price: safePrice,
      mrp: safeMrp,
      stock: safeStock,
      images: [],
    };

    // Update state with functional updates to prevent race conditions
    setCurrentVariant(newVariant);
    setNewVariantRow(true);
    setVariantImages([]);

    console.log("Added new variant for editing with temporary ID:", tempId);
  };

  // Save the currently editing variant
  const handleSaveNewVariant = () => {
    if (currentVariant) {
      // Validate the current variant has required fields
      if (
        !currentVariant.sku ||
        !currentVariant.price ||
        currentVariant.stock === undefined
      ) {
        toast({
          title: "Missing required fields",
          description: "Please fill in at least SKU, price, and stock quantity",
          variant: "destructive",
        });
        return;
      }

      // Create variant with images
      const variantWithImages = { ...currentVariant, images: variantImages };

      // Only add to draftVariants (we'll merge these with variants when submitting the form)
      setDraftVariants((prevDraftVariants) => {
        // Check if this variant already exists to avoid duplication
        const variantExists = prevDraftVariants.some(
          (v) => v.id === variantWithImages.id
        );
        if (variantExists) {
          // Update the existing variant
          return prevDraftVariants.map((v) =>
            v.id === variantWithImages.id ? variantWithImages : v
          );
        } else {
          // Add as a new variant
          return [...prevDraftVariants, variantWithImages];
        }
      });

      // Show success toast
      toast({
        title: "Variant added",
        description: "New variant has been added successfully",
      });

      // Reset current variant and related state
      setCurrentVariant(null);
      setNewVariantRow(false);
      setVariantImages([]);
    }
  };

  // Cancel adding a new variant
  const handleCancelVariant = () => {
    // Reset current variant and related state
    setCurrentVariant(null);
    setNewVariantRow(false);
    setVariantImages([]);
  };

  // Delete a variant from the list
  const handleDeleteVariant = (variant: ProductVariant) => {
    if (variant.id < 0) {
      // For client-side only variants with negative IDs
      setDraftVariants((prevDraftVariants) =>
        prevDraftVariants.filter((v) => v.id !== variant.id)
      );
    } else {
      // For variants from the database with positive IDs
      setVariants((prevVariants) =>
        prevVariants.filter((v) => v.id !== variant.id)
      );
    }

    // Show success toast
    toast({
      title: "Variant removed",
      description: "The variant has been removed successfully",
    });
  };

  // Update the temporary variant that's being edited
  const handleUpdateCurrentVariant = (
    field: keyof ProductVariant,
    value: any
  ) => {
    if (currentVariant) {
      setCurrentVariant({
        ...currentVariant,
        [field]: value,
      });
    }
  };

  // Handle adding images to a variant
  const handleAddVariantImage = (fileOrUrl: File | string) => {
    if (variantImages.length >= 4) {
      toast({
        title: "Maximum variant images reached",
        description: "You can upload a maximum of 4 images per variant",
        variant: "destructive",
      });
      return;
    }

    if (typeof fileOrUrl === "string") {
      // Validate URL before adding
      try {
        // Check if it's a valid URL
        const url = new URL(fileOrUrl);

        // Check if URL uses http or https protocol
        if (!url.protocol.startsWith("http")) {
          toast({
            title: "Invalid URL",
            description: "URL must start with http:// or https://",
            variant: "destructive",
          });
          return;
        }

        // Check if URL has an image extension
        const validExtensions = [
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".webp",
          ".svg",
        ];
        const hasValidExtension = validExtensions.some((ext) =>
          url.pathname.toLowerCase().endsWith(ext)
        );

        // If URL doesn't have a valid extension, we'll check if it responds with an image
        if (!hasValidExtension) {
          // We'll still add it but show a warning
          toast({
            title: "URL added",
            description:
              "The URL doesn't end with a common image extension. Please verify the image appears correctly.",
            variant: "default",
          });
        } else {
          toast({
            title: "Variant image URL added",
            description: "Image URL has been added successfully.",
            variant: "default",
          });
        }

        // Add URL to variant images
        setVariantImages((prevImages) => [...prevImages, fileOrUrl]);
      } catch (error) {
        // URL is invalid
        toast({
          title: "Invalid URL",
          description: "Please enter a valid image URL.",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      // Create a preview URL for the file
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          // Use functional state update to prevent race conditions
          setVariantImages((prevImages) => [
            ...prevImages,
            event.target.result as string,
          ]);
        }
      };
      reader.readAsDataURL(fileOrUrl);
    } catch (error) {
      console.error("Error handling variant image upload:", error);
      toast({
        title: "Error processing variant image",
        description: "There was a problem processing your image",
        variant: "destructive",
      });
    }
  };

  // Remove a variant image at a given index
  const handleRemoveVariantImage = (index: number) => {
    const newImages = [...variantImages];
    newImages.splice(index, 1);
    setVariantImages(newImages);
  };

  // Get actual value or empty string for controlled inputs
  const getFieldValue = (field: keyof ProductVariant) => {
    return currentVariant &&
      currentVariant[field] !== undefined &&
      currentVariant[field] !== null
      ? currentVariant[field]
      : "";
  };

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        if (!initialValues?.id) {
          throw new Error("Product ID is required for updating");
        }

        console.log("Updating product with data:", data);
        const response = await apiRequest(
          "PUT",
          `/api/products/${initialValues.id}`,
          data
        );

        if (!response.ok) {
          // Try to parse the error response
          const errorData = await response.json().catch(() => null);

          if (errorData && errorData.error) {
            // Check if it's a validation error
            if (Array.isArray(errorData.error)) {
              const errorMessages = errorData.error
                .map((err: any) => {
                  return `${err.path?.[0] || "Field"}: ${err.message}`;
                })
                .join(", ");
              throw new Error(`Validation failed: ${errorMessages}`);
            } else if (typeof errorData.error === "string") {
              throw new Error(errorData.error);
            }
          }

          throw new Error(
            "Failed to update product. Please check all required fields."
          );
        }

        return await response.json();
      } catch (error: any) {
        console.error("Product update error:", error);
        throw new Error(error.message || "Failed to update product");
      }
    },
    onSuccess: () => {
      // Invalidate both general products and seller-specific products queries
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });

      // Get the current user to include sellerId in the cache key
      const currentUser = queryClient.getQueryData<any>(["/api/user"]);

      // Use broader invalidation for seller products with exact: false to invalidate all seller product queries
      queryClient.invalidateQueries({
        queryKey: ["/api/seller/products", currentUser?.id],
        exact: false,
      });

      toast({
        title: "Product updated successfully",
        description: "Your product changes have been saved.",
      });
      // Don't navigate immediately to let seller see the updated list
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Trigger form validation first
      const valid = await form.trigger();
      if (!valid) {
        const errors = form.formState.errors;
        const errorFields = Object.keys(errors);

        console.log("Form validation errors:", errors);

        if (errorFields.length > 0) {
          toast({
            title: "Validation Error",
            description: `Please fix errors in: ${errorFields.join(", ")}`,
            variant: "destructive",
          });
          return;
        }
      }

      // Additional validation for images
      if (uploadedImages.length === 0) {
        toast({
          title: "Images Required",
          description: "Please upload at least one product image",
          variant: "destructive",
        });
        return;
      }

      // Get form values
      const formValues = form.getValues();

      // Process return policy
      let finalReturnPolicy = formValues.returnPolicy;
      if (
        formValues.returnPolicy === "custom" &&
        formValues.customReturnPolicy
      ) {
        finalReturnPolicy = formValues.customReturnPolicy;
      }

      // Process numeric fields
      const processedFormValues = {
        ...formValues,
        price: Number(formValues.price),
        mrp: formValues.mrp ? Number(formValues.mrp) : formValues.mrp,
        stock: Number(formValues.stock),
        purchasePrice: formValues.purchasePrice
          ? Number(formValues.purchasePrice)
          : formValues.purchasePrice,
        gstRate: formValues.gstRate
          ? Number(formValues.gstRate)
          : formValues.gstRate,
        warranty: formValues.warranty ? Number(formValues.warranty) : null,
        weight: formValues.weight ? Number(formValues.weight) : null,
        length: formValues.length ? Number(formValues.length) : null,
        width: formValues.width ? Number(formValues.width) : null,
        height: formValues.height ? Number(formValues.height) : null,
        returnPolicy: finalReturnPolicy,
      };

      console.log("Processed form values:", processedFormValues);

      // Debug subcategory information during submission
      console.log("Subcategory submission data:", {
        subcategory: processedFormValues.subcategory,
        subcategoryId: processedFormValues.subcategoryId,
      });

      // Combine form data with images
      const productData = {
        ...processedFormValues,
        images: uploadedImages,
        variants: [...variants, ...draftVariants],
      };

      // Submit the product via mutation - either create or update
      if (initialValues?.id) {
        // Update existing product
        await updateProductMutation.mutateAsync(productData);
      } else {
        // Create new product
        await createProductMutation.mutateAsync(productData);
      }

      // Show success message
      toast({
        title: "Success",
        description: initialValues?.id
          ? "Product updated successfully"
          : "Product created successfully",
      });

      // Redirect if needed
      if (redirectTo) {
        navigate(redirectTo);
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      });
    }
  };

  // Handle save as draft
  const onSaveAsDraft = async () => {
    try {
      // Get form values without validation
      const formValues = form.getValues();

      // Process numeric fields to ensure they are proper numbers
      const processedFormValues = {
        ...formValues,
        price: formValues.price ? Number(formValues.price) : 0,
        mrp: formValues.mrp ? Number(formValues.mrp) : formValues.mrp,
        stock: formValues.stock ? Number(formValues.stock) : 0,
        purchasePrice: formValues.purchasePrice
          ? Number(formValues.purchasePrice)
          : formValues.purchasePrice,
        gstRate: formValues.gstRate
          ? Number(formValues.gstRate)
          : formValues.gstRate,
      };

      console.log("Processed draft values:", processedFormValues);

      // Prepare draft data
      const draftData = {
        ...processedFormValues,
        images: uploadedImages,
        isDraft: true, // This will mark it as a draft in the database
      };

      // Submit the draft
      await saveDraftMutation.mutateAsync(draftData);
    } catch (error: any) {
      console.error("Error saving draft:", error);

      toast({
        title: "Error",
        description: error.message || "Failed to save draft",
        variant: "destructive",
      });
    }
  };

  // Check if custom GST rate is being used
  const isCustomRate =
    form.watch("gstRate") !== undefined && form.watch("gstRate") !== null;

  // Calculate GST amount and final price
  const gstRate = isCustomRate
    ? form.watch("gstRate") || 0
    : getSelectedCategoryGstRate();
  const basePrice = form.watch("price") || 0;
  const gstAmount = calculateGstAmount(basePrice, gstRate);
  const finalPrice = basePrice + gstAmount;

  // Format GST breakdown for display
  const gstBreakdown = formatPriceWithGstBreakdown(basePrice, gstRate);

  // Is the form submitting?
  const isSubmitting =
    createProductMutation.isPending ||
    updateProductMutation.isPending ||
    saveDraftMutation.isPending;

  // State for tag input
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  // Handle pressing Enter in tag input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (inputValue.trim()) {
        // Determine which tag array to update based on which FormField we're in
        const fieldName = (
          e.currentTarget.closest("[data-field]") as HTMLElement
        )?.dataset?.field;

        if (fieldName === "color") {
          setColors((prev) => [...prev, inputValue.trim()]);
          form.setValue("color", [...colors, inputValue.trim()].join(","));
        } else if (fieldName === "size") {
          setSizes((prev) => [...prev, inputValue.trim()]);
          form.setValue("size", [...sizes, inputValue.trim()].join(","));
        }

        setInputValue("");
      }
    }
  };

  // Remove a tag
  const removeTag = (index: number, type: "color" | "size") => {
    if (type === "color") {
      const newColors = [...colors];
      newColors.splice(index, 1);
      setColors(newColors);
      form.setValue("color", newColors.join(","));
    } else {
      const newSizes = [...sizes];
      newSizes.splice(index, 1);
      setSizes(newSizes);
      form.setValue("size", newSizes.join(","));
    }
  };

  // Set up tags from form values on mount
  useEffect(() => {
    const formColors = form.getValues("color");
    const formSizes = form.getValues("size");

    if (formColors) {
      setColors(formColors.split(",").filter(Boolean));
    }

    if (formSizes) {
      setSizes(formSizes.split(",").filter(Boolean));
    }
  }, [form]);

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center">
              <CheckCircle
                className={`mr-2 h-5 w-5 ${
                  completionStatus.percentage === 100
                    ? "text-green-500"
                    : "text-muted-foreground"
                }`}
              />
              Completion Status
            </CardTitle>
            <CardDescription>
              Complete all sections to add your product
            </CardDescription>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onSaveAsDraft}
              disabled={isSubmitting}
            >
              {saveDraftMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Save as Draft
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => form.reset()}
              disabled={isSubmitting}
            >
              Reset Form
            </Button>

            <Button
              type="button"
              variant="default"
              onClick={handleSubmit}
              disabled={isSubmitting || completionStatus.percentage < 100}
            >
              {createProductMutation.isPending ||
              updateProductMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {initialValues?.id ? "Update Product" : "Save Product"}
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                Completion: {completionStatus.percentage}%
              </div>
            </div>
            <Progress value={completionStatus.percentage} className="h-2" />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2">
              <div
                className={`flex items-center gap-2 rounded-md border p-2 ${
                  completionStatus.basicComplete
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : "border-gray-200"
                }`}
              >
                <span
                  className={`rounded-full p-1 ${
                    completionStatus.basicComplete
                      ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {completionStatus.basicComplete ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Info className="h-3 w-3" />
                  )}
                </span>
                <span className="text-xs">Basic Info</span>
              </div>

              <div
                className={`flex items-center gap-2 rounded-md border p-2 ${
                  completionStatus.descriptionComplete
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : "border-gray-200"
                }`}
              >
                <span
                  className={`rounded-full p-1 ${
                    completionStatus.descriptionComplete
                      ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {completionStatus.descriptionComplete ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Info className="h-3 w-3" />
                  )}
                </span>
                <span className="text-xs">Description</span>
              </div>

              <div
                className={`flex items-center gap-2 rounded-md border p-2 ${
                  completionStatus.inventoryComplete
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : "border-gray-200"
                }`}
              >
                <span
                  className={`rounded-full p-1 ${
                    completionStatus.inventoryComplete
                      ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {completionStatus.inventoryComplete ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Info className="h-3 w-3" />
                  )}
                </span>
                <span className="text-xs">Inventory</span>
              </div>

              <div
                className={`flex items-center gap-2 rounded-md border p-2 ${
                  completionStatus.imagesComplete
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : "border-gray-200"
                }`}
              >
                <span
                  className={`rounded-full p-1 ${
                    completionStatus.imagesComplete
                      ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {completionStatus.imagesComplete ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Info className="h-3 w-3" />
                  )}
                </span>
                <span className="text-xs">Images</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left Column - Basic Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="mr-2 h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>Add essential product details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormDescription>
                        At least 5 characters long
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brand name (optional)"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Subcategory Selector */}
                <FormField
                  control={form.control}
                  name="subcategory"
                  render={({ field }) => {
                    // Get currently selected category
                    const selectedCategory = form.watch("category");

                    // Find the category object to get its ID
                    const categoryObject = categoriesData?.find(
                      (c: any) => c.name === selectedCategory
                    );

                    // Filter subcategories by the selected category
                    const filteredSubcategories =
                      subcategoriesData?.filter((sc: any) => {
                        return (
                          categoryObject && sc.categoryId === categoryObject.id
                        );
                      }) || [];

                    return (
                      <FormItem>
                        <FormLabel>Subcategory</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              // Update the subcategory name
                              field.onChange(value);

                              if (value === "") {
                                // If None is selected, set subcategoryId to null
                                form.setValue("subcategoryId", null);
                              } else {
                                // Find the subcategory in the data to get its ID
                                const subcategory = subcategoriesData?.find(
                                  (sc: any) => sc.name === value
                                );
                                if (subcategory) {
                                  form.setValue(
                                    "subcategoryId",
                                    subcategory.id
                                  );
                                }
                              }
                            }}
                            value={field.value || ""}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a subcategory (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {filteredSubcategories.map((subcategory: any) => (
                                <SelectItem
                                  key={subcategory.id}
                                  value={subcategory.name}
                                >
                                  {subcategory.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Select a subcategory if applicable
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* GST information card */}
                {watchedFields.category && (
                  <Card className="bg-muted/30">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center">
                        <Info className="w-4 h-4 mr-2 text-blue-500" />
                        <span className="text-sm font-medium">
                          GST Information
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        {watchedFields.category && (
                          <>
                            <p className="text-slate-600">
                              <span className="font-medium">Category:</span>{" "}
                              {watchedFields.category}
                            </p>
                            <p className="text-slate-600">
                              <span className="font-medium">
                                Category Default GST Rate:
                              </span>{" "}
                              {getSelectedCategoryGstRate()}%
                            </p>
                            {isCustomRate && (
                              <p className="text-slate-600 font-medium text-blue-700">
                                <span className="font-medium">
                                  Custom GST Rate:
                                </span>{" "}
                                {gstRate}%
                              </p>
                            )}
                            {watchedFields.price && (
                              <div className="pt-1 space-y-1">
                                <p className="text-slate-600">
                                  <span className="font-medium">
                                    Base Price:
                                  </span>{" "}
                                  ₹
                                  {typeof basePrice === "number"
                                    ? basePrice.toFixed(2)
                                    : "0.00"}
                                </p>
                                <p className="text-slate-600">
                                  <span className="font-medium">
                                    GST Amount:
                                  </span>{" "}
                                  ₹
                                  {typeof gstAmount === "number"
                                    ? gstAmount.toFixed(2)
                                    : "0.00"}{" "}
                                  ({gstRate}%)
                                </p>
                                <p className="text-slate-600 font-medium">
                                  <span className="font-medium">
                                    Final Price:
                                  </span>{" "}
                                  ₹
                                  {typeof finalPrice === "number"
                                    ? finalPrice.toFixed(2)
                                    : "0.00"}
                                </p>
                                <p className="text-xs text-slate-500 italic mt-1">
                                  {gstBreakdown}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PackageCheck className="mr-2 h-5 w-5" />
                  Pricing & Inventory
                </CardTitle>
                <CardDescription>
                  Set your pricing and inventory details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Base price without GST
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mrp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MRP (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>Maximum retail price</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>Your cost price</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gstRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom GST Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="Use category default"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty to use category default
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Quantity *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Stock Keeping Unit"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="warranty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warranty (months)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="returnPolicy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Return Policy</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select return policy" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="15">15 Days</SelectItem>
                          <SelectItem value="30">30 Days</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("returnPolicy") === "custom" && (
                  <FormField
                    control={form.control}
                    name="customReturnPolicy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Return Policy (days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Enter number of days"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the number of days for your custom return policy
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PackageOpen className="mr-2 h-5 w-5" />
                  Dimensions & Shipping
                </CardTitle>
                <CardDescription>
                  Add physical attributes for shipping calculations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Length (cm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Width (cm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height (cm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Layers className="mr-2 h-5 w-5" />
                  Variants & Attributes
                </CardTitle>
                <CardDescription>
                  Add size, color and other attributes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Color options */}
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem data-field="color">
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            placeholder="e.g. Red, Blue, Black (press Enter to add)"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                          />

                          {colors.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {colors.map((color, index) => (
                                <Badge
                                  key={`${color}-${index}`}
                                  variant="outline"
                                  className="px-2 py-1 flex items-center gap-1"
                                >
                                  {color}
                                  <X
                                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                                    onClick={() => removeTag(index, "color")}
                                  />
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Create a comma-separated list of available colors
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Size options */}
                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem data-field="size">
                      <FormLabel>Size</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            placeholder="e.g. S, M, L, XL (press Enter to add)"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                          />

                          {sizes.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {sizes.map((size, index) => (
                                <Badge
                                  key={`${size}-${index}`}
                                  variant="outline"
                                  className="px-2 py-1 flex items-center gap-1"
                                >
                                  {size}
                                  <X
                                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                                    onClick={() => removeTag(index, "size")}
                                  />
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Create a comma-separated list of available sizes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-2">
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <Layers className="mr-2 h-4 w-4" />
                    Product Variants
                  </h4>

                  <div className="space-y-4">
                    {/* Variant Management UI */}
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddVariant}
                        disabled={newVariantRow}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add Variant
                      </Button>
                    </div>

                    {/* Variant Table */}
                    {(variants.length > 0 ||
                      draftVariants.length > 0 ||
                      newVariantRow) && (
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>SKU</TableHead>
                              <TableHead>Color</TableHead>
                              <TableHead>Size</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Stock</TableHead>
                              <TableHead>Images</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {/* Display existing variants */}
                            {[...variants, ...draftVariants].map((variant) => (
                              <TableRow key={`variant-${variant.id}`}>
                                <TableCell>{variant.sku}</TableCell>
                                <TableCell>{variant.color || "-"}</TableCell>
                                <TableCell>{variant.size || "-"}</TableCell>
                                <TableCell>
                                  ₹{variant.price.toFixed(2)}
                                </TableCell>
                                <TableCell>{variant.stock}</TableCell>
                                <TableCell>
                                  {variant.images?.length > 0 ? (
                                    <div className="flex items-center gap-1">
                                      <div className="h-6 w-6 rounded border overflow-hidden">
                                        <img
                                          src={variant.images[0]}
                                          alt={`${variant.sku} preview`}
                                          className="h-full w-full object-cover"
                                        />
                                      </div>
                                      {variant.images.length > 1 && (
                                        <Badge
                                          variant="outline"
                                          className="h-5 px-1"
                                        >
                                          +{variant.images.length - 1}
                                        </Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      None
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteVariant(variant)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}

                            {/* New variant row - editable */}
                            {newVariantRow && (
                              <TableRow>
                                <TableCell>
                                  <Input
                                    type="text"
                                    value={getFieldValue("sku")}
                                    onChange={(e) =>
                                      handleUpdateCurrentVariant(
                                        "sku",
                                        e.target.value
                                      )
                                    }
                                    className="h-8 w-full"
                                    placeholder="SKU"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="text"
                                    value={getFieldValue("color")}
                                    onChange={(e) =>
                                      handleUpdateCurrentVariant(
                                        "color",
                                        e.target.value
                                      )
                                    }
                                    className="h-8 w-full"
                                    placeholder="Color"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="text"
                                    value={getFieldValue("size")}
                                    onChange={(e) =>
                                      handleUpdateCurrentVariant(
                                        "size",
                                        e.target.value
                                      )
                                    }
                                    className="h-8 w-full"
                                    placeholder="Size"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={getFieldValue("price")}
                                    onChange={(e) =>
                                      handleUpdateCurrentVariant(
                                        "price",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="h-8 w-full"
                                    placeholder="Price"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={getFieldValue("stock")}
                                    onChange={(e) =>
                                      handleUpdateCurrentVariant(
                                        "stock",
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="h-8 w-full"
                                    placeholder="Stock"
                                  />
                                </TableCell>
                                <TableCell>
                                  <FileUpload
                                    onFileSelect={handleAddVariantImage}
                                    maxFiles={4}
                                    accept="image/*"
                                    multiple={true}
                                    buttonLabel={
                                      <div className="flex items-center">
                                        <ImagePlus className="h-3 w-3 mr-1" />
                                        <span className="text-xs">Add</span>
                                      </div>
                                    }
                                    className="h-8"
                                    buttonVariant="outline"
                                    buttonSize="sm"
                                  />
                                  {variantImages.length > 0 && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <div className="h-6 w-6 rounded border overflow-hidden">
                                        <img
                                          src={variantImages[0]}
                                          alt="Variant preview"
                                          className="h-full w-full object-cover"
                                        />
                                      </div>
                                      {variantImages.length > 1 && (
                                        <Badge
                                          variant="outline"
                                          className="h-5 px-1"
                                        >
                                          +{variantImages.length - 1}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={handleSaveNewVariant}
                                    >
                                      <Check className="h-4 w-4 text-green-500" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={handleCancelVariant}
                                    >
                                      <X className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {variants.length === 0 &&
                      draftVariants.length === 0 &&
                      !newVariantRow && (
                        <div className="text-sm text-muted-foreground text-center py-3 border border-dashed rounded-md">
                          No variants added yet. Click "Add Variant" to create
                          product variations.
                        </div>
                      )}

                    <p className="text-xs text-muted-foreground mt-2">
                      Use variants to define different combinations of
                      properties like color and size, each with its own price,
                      SKU, and stock level.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Description & Images */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heading className="mr-2 h-5 w-5" />
                  Description & Details
                </CardTitle>
                <CardDescription>
                  Add detailed product description and specifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Description *</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          content={field.value}
                          onChange={field.onChange}
                          placeholder="Describe your product (at least 20 characters)"
                        />
                      </FormControl>
                      <FormDescription>
                        Include details about features, materials, and benefits
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Technical Specifications</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Technical details (optional)"
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Add specifications in a structured format
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ImagePlus className="mr-2 h-5 w-5" />
                  Product Images
                </CardTitle>
                <CardDescription>
                  Upload high-quality product images
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload
                  onFileSelect={handleAddImage}
                  maxFiles={8}
                  accept="image/*"
                  multiple={true}
                />

                {/* Add image via URL */}
                <div className="flex items-center gap-2">
                  <Input
                    type="url"
                    placeholder="Enter image URL (https://...)"
                    className="flex-1"
                    id="image-url-input"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById(
                        "image-url-input"
                      ) as HTMLInputElement;
                      if (input && input.value) {
                        // Use the same handleAddImage function that already has validation
                        handleAddImage(input.value);
                        // Clear the input after adding
                        input.value = "";
                      } else {
                        // Show error if URL field is empty
                        toast({
                          title: "URL is required",
                          description: "Please enter a valid image URL",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Add URL
                  </Button>
                </div>

                <div className="mt-4">
                  {uploadedImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {uploadedImages.map((image, index) => (
                        <div
                          key={`img-${index}`}
                          className="relative group aspect-square border rounded-md overflow-hidden"
                        >
                          <img
                            src={image}
                            alt={`Product preview ${index + 1}`}
                            className="h-full w-full object-cover"
                          />

                          {/* Overlay with delete button */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveImage(index)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Badge for main image */}
                          {index === 0 && (
                            <Badge className="absolute top-1 left-1 bg-primary text-primary-foreground">
                              Main
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-12 text-center">
                      <div className="mx-auto w-fit p-4 rounded-full bg-muted">
                        <ImagePlus className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="mt-4 text-sm font-medium">
                        No images uploaded
                      </h3>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Upload at least one high-quality image of your product
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  First image will be used as the main product image. You can
                  upload up to 8 images (max 5MB each).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Additional Information
                </CardTitle>
                <CardDescription>
                  Important policies and compliance details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="returnPolicy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Return Policy</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your return policy details (optional)"
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Specify your return policy terms and conditions (10-1000
                        characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border rounded-md divide-y">
                  <div className="p-3 flex items-start gap-3 bg-muted/30">
                    <ShieldCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium">Product Approval</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        All products are subject to approval before being listed
                        in the marketplace. This process typically takes 1-2
                        business days.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium">Need Help?</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        If you have any questions about adding products, please
                        contact our seller support team.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
