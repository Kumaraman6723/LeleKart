import { useState, useEffect, useCallback } from "react";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VariantMatrixGenerator } from "@/components/product/variant-matrix-generator";
import {
  ImagePlus,
  Tag,
  AlertCircle,
  HelpCircle,
  Info as InfoIcon,
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
import { MultiMediaPicker } from "@/components/multi-media-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Helper function to check if a return policy is a standard one
const isStandardReturnPolicy = (value?: string | number | null): boolean => {
  if (!value) return false;
  const standardPolicies = ["7", "15", "30"];
  return standardPolicies.includes(value.toString());
};

// Form validation schema
const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  specifications: z.string().optional(),
  price: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Price must be a positive number",
    }),
  mrp: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "MRP must be a positive number",
    }),
  purchasePrice: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Purchase price must be a non-negative number",
    })
    .optional(),
  gstRate: z
    .string()
    .refine(
      (val) => {
        if (!val) return true; // Optional field
        const parsed = parseFloat(val);
        return !isNaN(parsed) && parsed >= 0 && parsed <= 100;
      },
      {
        message: "GST rate must be between 0 and 100%",
      }
    )
    .optional(),
  sku: z.string().min(2, "SKU is required"),
  category: z.string().min(1, "Please select a category"),
  subcategory: z.string().optional(),
  subcategoryId: z
    .union([
      z.number().nullable(),
      z
        .string()
        .nullable()
        .transform((val) => (val ? Number(val) : null)),
    ])
    .optional()
    .nullable(),
  brand: z.string().min(2, "Brand name is required"),
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
});

// Use the ProductVariant type imported from variant-form.tsx

// Main component
export default function AddProductPage() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [variantImages, setVariantImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [isEditingVariant, setIsEditingVariant] = useState(false);
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [isDeletingVariant, setIsDeletingVariant] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [draftVariants, setDraftVariants] = useState<ProductVariant[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [categoryGstRates, setCategoryGstRates] = useState<
    Record<string, number>
  >({});
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) {
        throw new Error("Failed to fetch categories");
      }
      return res.json();
    },
  });

  // Fetch all subcategories
  const { data: subcategories = [] } = useQuery({
    queryKey: ["/api/subcategories/all"],
    queryFn: async () => {
      const res = await fetch("/api/subcategories/all");
      if (!res.ok) {
        throw new Error("Failed to fetch subcategories");
      }
      return res.json();
    },
  });

  // Process categories to extract GST rates when categories are fetched
  useEffect(() => {
    if (categories && Array.isArray(categories) && categories.length > 0) {
      // Extract GST rates from categories
      const rates: Record<string, number> = {};
      categories.forEach((category: any) => {
        if (category.name && typeof category.gstRate === "number") {
          rates[category.name] = category.gstRate;
        } else {
          rates[category.name] = 18; // Default fallback if gstRate is not set
        }
      });
      setCategoryGstRates(rates);
    }
  }, [categories]);

  // Form setup with validation
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      specifications: "",
      price: "",
      mrp: "",
      purchasePrice: "",
      gstRate: "",
      sku: "",
      category: "",
      subcategory: "",
      subcategoryId: null,
      brand: "",
      color: "",
      size: "",
      stock: 0,
      weight: "",
      height: "",
      width: "",
      length: "",
      warranty: "",
      hsn: "",
      tax: "18",
      productType: "physical",
      returnPolicy: "7",
      customReturnPolicy: "",
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
    const selectedCategory = form.watch("category");
    return categoryGstRates[selectedCategory] || 18; // Default to 18% if not found
  };

  // Calculate components of GST-inclusive price
  const calculateFinalPrice = (): {
    basePrice: number;
    gstRate: number;
    gstAmount: number;
    finalPrice: number;
  } => {
    // The selling price entered by the user already includes GST
    const finalPrice = parseFloat(form.getValues("price")) || 0;

    // Use custom GST rate if provided, otherwise use category GST rate
    const customGstRate = form.getValues("gstRate");
    const gstRate =
      customGstRate !== undefined && customGstRate !== null
        ? parseFloat(customGstRate)
        : getSelectedCategoryGstRate();

    // Calculate base price and GST amount
    const basePrice = finalPrice / (1 + gstRate / 100);
    const gstAmount = finalPrice - basePrice;

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
    (fileOrUrlOrUrls: File | string | string[]) => {
      // Handle multiple URLs from multi-file upload
      if (Array.isArray(fileOrUrlOrUrls)) {
        // Add all URLs from the array
        setUploadedImages((prevImages) => [...prevImages, ...fileOrUrlOrUrls]);
        return;
      }

      // Handle single file or URL
      if (typeof fileOrUrlOrUrls === "string") {
        // Add URL directly
        setUploadedImages((prevImages) => [...prevImages, fileOrUrlOrUrls]);
        return;
      }

      // Check for maximum image count for single uploads
      if (uploadedImages.length >= 8) {
        toast({
          title: "Maximum images reached",
          description: "You can upload a maximum of 8 images per product",
          variant: "destructive",
        });
        return;
      }

      if (typeof fileOrUrlOrUrls === "string") {
        // Validate the URL format
        try {
          const url = new URL(fileOrUrlOrUrls);
          if (!url.protocol.startsWith("http")) {
            toast({
              title: "Invalid URL",
              description:
                "Please enter a valid URL starting with http:// or https://",
              variant: "destructive",
            });
            return;
          }

          // Add URL directly
          setUploadedImages((prevImages) => [...prevImages, fileOrUrlOrUrls]);

          // Show success message
          toast({
            title: "Image URL added",
            description: "The image URL has been added to your product",
          });
          return;
        } catch (error) {
          toast({
            title: "Invalid URL",
            description: "Please enter a valid image URL",
            variant: "destructive",
          });
          return;
        }
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
        reader.readAsDataURL(fileOrUrlOrUrls);
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

        // Validate mandatory fields before submission to catch issues early
        const { productData } = data;
        if (
          !productData.name ||
          !productData.description ||
          !productData.price ||
          !productData.category
        ) {
          throw new Error(
            "Missing required fields: name, description, price and category are required"
          );
        }

        // Ensure price is a valid number
        if (
          isNaN(Number(productData.price)) ||
          Number(productData.price) <= 0
        ) {
          throw new Error("Price must be a valid positive number");
        }

        // Make sure we have at least one image
        if (!productData.imageUrl || !productData.images) {
          throw new Error("At least one product image is required");
        }

        // Perform the API request with more detailed error handling
        const response = await apiRequest("POST", "/api/products", data);

        if (!response.ok) {
          // Try to parse the error response
          const errorData = await response.json().catch(() => null);
          console.error("Server error response:", errorData);

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
            `Failed to create product (HTTP ${response.status}). Please check all required fields.`
          );
        }

        return await response.json();
      } catch (error: any) {
        console.error("Product creation error:", error);
        throw new Error(error.message || "Failed to create product");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product added successfully",
        description: "Your product has been submitted for approval.",
      });
      navigate("/seller/products");
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
        // Validate the minimum required field - product name
        if (!data.productData?.name || data.productData.name.trim() === "") {
          throw new Error("Product name is required, even for drafts");
        }

        // Combine both regular variants and draft variants
        const allVariants = [...variants, ...draftVariants];

        console.log("Saving draft with data:", data);
        console.log("Including variants:", allVariants.length);

        // The data is already prepared in the onSaveAsDraft function
        const response = await apiRequest("POST", "/api/products/draft", {
          ...data,
          variants: allVariants, // Include all variants
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error("Server error response for draft:", errorData);

          if (errorData && errorData.error) {
            throw new Error(
              typeof errorData.error === "string"
                ? errorData.error
                : "Failed to save draft"
            );
          }
          throw new Error(
            `Failed to save product draft (HTTP ${response.status})`
          );
        }

        return await response.json();
      } catch (error: any) {
        console.error("Draft saving error:", error);
        throw new Error(error.message || "Failed to save draft");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Draft saved successfully",
        description:
          "Your product draft has been saved and can be edited later.",
      });
      navigate("/seller/products");
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
    setVariantImages([]);
    // Prevent adding a new variant if one is already being edited
    if (selectedVariant !== null && isAddingVariant) {
      toast({
        title: "Already adding a variant",
        description:
          "Please save or cancel the current variant before adding another one.",
        variant: "destructive",
      });
      return;
    }

    // Clear any existing variant images first

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
      images: [], // Initialize with empty images array
    };

    // Update state with functional updates to prevent race conditions
    setSelectedVariant(newVariant);
    setIsAddingVariant(true);

    console.log("Added new variant for editing with temporary ID:", tempId);
  };

  // Save the currently editing variant
  const handleSaveNewVariant = (variant: ProductVariant) => {
    // More robust validation for the current variant's required fields
    if (!variant.sku || variant.sku.trim() === "") {
      toast({
        title: "Missing required field: SKU",
        description: "Please enter a valid SKU for this variant",
        variant: "destructive",
      });
      return;
    }

    // Validate price (must be a positive number)
    if (
      variant.price === undefined ||
      variant.price === null ||
      isNaN(Number(variant.price)) ||
      Number(variant.price) <= 0
    ) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price greater than zero",
        variant: "destructive",
      });
      // Keep the current variant state and images
      setSelectedVariant(variant);
      setIsAddingVariant(true);
      return;
    }

    // Validate stock (must be a non-negative number)
    if (
      variant.stock === undefined ||
      variant.stock === null ||
      isNaN(Number(variant.stock)) ||
      Number(variant.stock) < 0
    ) {
      toast({
        title: "Invalid stock quantity",
        description: "Please enter a valid stock quantity (zero or greater)",
        variant: "destructive",
      });
      // Keep the current variant state and images
      setSelectedVariant(variant);
      setIsAddingVariant(true);
      return;
    }

    // Only add to draftVariants (we'll merge these with variants when submitting the form)
    setDraftVariants((prevDraftVariants) => {
      // Check if this variant already exists to avoid duplication
      const variantExists = prevDraftVariants.some(
        (v: ProductVariant) => v.id === variant.id
      );
      if (variantExists) {
        // Update the existing variant
        return prevDraftVariants.map((v: ProductVariant) =>
          v.id === variant.id ? variant : v
        );
      } else {
        // Add as a new variant
        return [...prevDraftVariants, variant];
      }
    });

    // Log current variant count (for debugging)
    const totalVariants =
      (Array.isArray(variants) ? variants.length : 0) +
      (Array.isArray(draftVariants) ? draftVariants.length : 0) +
      1; // +1 for the one we just added
    console.log(`Current variant count: ${totalVariants}`);

    // Show success toast
    toast({
      title: "Variant added",
      description: `New variant has been added successfully (${totalVariants} total variants)`,
    });

    // Create a new empty variant for the next entry
    const formSku = form.getValues("sku") || "";
    const variantsCount = variants.length + draftVariants.length + 1; // +1 for the one we just added
    const safePrice =
      parseFloat(form.getValues("price")?.toString() || "0") || 0;
    const safeMrp = parseFloat(form.getValues("mrp")?.toString() || "0") || 0;
    const safeStock = parseInt(form.getValues("stock")?.toString() || "0") || 0;

    // Create a unique timestamp ID for the new variant
    const uniqueId = Date.now();
    const tempId = -Math.floor(Math.random() * 1000000);

    // Initialize a new empty variant with empty images array
    const newVariant: ProductVariant = {
      id: tempId,
      sku: formSku
        ? `${formSku}-${variantsCount + 1}`
        : `SKU-${uniqueId}-${variantsCount + 1}`,
      color: "",
      size: "",
      price: safePrice,
      mrp: safeMrp,
      stock: safeStock,
      images: [], // Ensure images array is empty
    };

    // Set the new variant as selected and keep the form open
    setSelectedVariant(newVariant);
    setIsAddingVariant(true);
    setVariantImages([]); // Clear variant images state

    console.log("Added variant. New empty form created for next variant.");
  };

  // Traditional save variant (for edit modal)
  const handleSaveVariant = (variant: ProductVariant, images: string[]) => {
    // Add images to the variant
    const updatedVariant = {
      ...variant,
      images: images,
    };

    // Check if we're editing an existing variant or adding a new one
    const existingVariantIndex = variants.findIndex(
      (v) => v.id === updatedVariant.id
    );

    if (existingVariantIndex >= 0) {
      // Update existing variant
      const updatedVariants = [...variants];
      updatedVariants[existingVariantIndex] = updatedVariant;
      setVariants(updatedVariants);
    } else {
      // Add new variant
      setVariants([...variants, updatedVariant]);
    }

    // Reset the form
    setSelectedVariant(null);
    setVariantImages([]);
    setIsAddingVariant(false);

    toast({
      title: "Variant saved",
      description: "Product variant has been added successfully",
    });
  };

  // Cancel variant editing - handles both inline and modal editing
  const handleCancelVariant = () => {
    // Only clear the current variant and images
    setSelectedVariant(null);
    setVariantImages([]);
    setIsAddingVariant(false);

    // If there are no variants yet (regular or draft), we'll keep the "isAddingVariant" state
    // to show the "Add First Variant" button
    if (variants.length > 0 || draftVariants.length > 0) {
      setIsAddingVariant(false);
    }
    // We're not touching draftVariants here - previously added draft variants remain
  };

  // Edit variant handler - using dialog-based approach
  const handleEditVariant = (variant: ProductVariant) => {
    try {
      // Make a deep copy of the variant to avoid reference issues
      const variantCopy = JSON.parse(JSON.stringify(variant));

      // Set the selected variant and open the edit dialog
      setSelectedVariant(variantCopy);
      setIsEditingVariant(true);
    } catch (error) {
      console.error("Error in handleEditVariant:", error);
      toast({
        title: "Error editing variant",
        description:
          "There was a problem preparing this variant for editing. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete variant handler - using dialog-based approach
  const handleDeleteVariant = (variant: ProductVariant) => {
    if (!variant || !variant.id) {
      toast({
        title: "Invalid variant",
        description: "Cannot delete this variant because it has no ID.",
        variant: "destructive",
      });
      return;
    }

    // Set the selected variant and open the delete confirmation dialog
    setSelectedVariant(variant);
    setIsDeletingVariant(true);
    setVariantImages([]); // Clear variant images when opening delete dialog
  };

  // Upload handler for variant images
  const handleAddVariantImage = useCallback(
    (fileOrUrl: File | string) => {
      if (variantImages.length >= 8) {
        toast({
          title: "Maximum images reached",
          description: "You can upload a maximum of 8 images per variant",
          variant: "destructive",
        });
        return;
      }

      if (typeof fileOrUrl === "string") {
        // Add URL directly
        setVariantImages((prevImages) => [...prevImages, fileOrUrl]);
        return;
      }

      try {
        // Apply additional precautions for Firefox
        const isFirefoxBrowser = isFirefox();

        if (isFirefoxBrowser) {
          console.log(
            "Detected Firefox browser, using safe FileReader implementation"
          );
        }

        // Create a preview URL for the file - Firefox safe implementation
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
        reader.onerror = () => {
          console.error("FileReader error occurred in variant image");
          toast({
            title: "Error processing variant image",
            description:
              "There was a problem processing your image. Please try another file.",
            variant: "destructive",
          });
        };
        reader.readAsDataURL(fileOrUrl);
      } catch (error) {
        console.error("Error handling variant file upload:", error);
        toast({
          title: "Error processing variant image",
          description:
            "There was a problem processing your image. Please try another file.",
          variant: "destructive",
        });
      }
    },
    [variantImages, toast]
  );

  // Remove variant image at a given index
  const handleRemoveVariantImage = (index: number) => {
    const newImages = [...variantImages];
    newImages.splice(index, 1);
    setVariantImages(newImages);
  };

  // Update current variant field
  const updateVariantField = (field: keyof ProductVariant, value: any) => {
    if (selectedVariant) {
      setSelectedVariant({
        ...selectedVariant,
        [field]: value,
      });
    }
  };

  // Form submission handler
  const onSubmit = (data: z.infer<typeof productSchema>) => {
    setIsSubmitting(true);

    // Create the data structure expected by the server
    const productData = {
      name: data.name,
      description: data.description,
      specifications: data.specifications,
      price: parseInt(data.price),
      mrp: parseInt(data.mrp),
      purchasePrice: data.purchasePrice
        ? parseFloat(data.purchasePrice)
        : undefined,
      gstRate:
        data.gstRate ||
        data.tax ||
        getSelectedCategoryGstRate().toString() ||
        "0",
      category: data.category,
      subcategory:
        data.subcategory === "none" ? null : data.subcategory || null,
      subcategoryId: data.subcategoryId || null,
      brand: data.brand,
      color: data.color,
      size: data.size,
      imageUrl:
        uploadedImages[0] || "https://placehold.co/600x400?text=Product+Image",
      images: JSON.stringify(uploadedImages),
      stock: parseInt(data.stock),
      weight: data.weight ? parseFloat(data.weight) : undefined,
      height: data.height ? parseFloat(data.height) : undefined,
      width: data.width ? parseFloat(data.width) : undefined,
      length: data.length ? parseFloat(data.length) : undefined,
      warranty: data.warranty ? parseInt(data.warranty) : undefined,
      hsn: data.hsn,
      productType: data.productType,
      returnPolicy: isStandardReturnPolicy(data.returnPolicy)
        ? data.returnPolicy
        : data.customReturnPolicy,
      variants: [...variants, ...draftVariants],
    };

    if (uploadedImages.length === 0) {
      toast({
        title: "Images required",
        description: "Please upload at least one product image",
        variant: "destructive",
      });
      return;
    }

    // Check for required fields explicitly
    if (!data.name || !data.description || !data.price || !data.category) {
      toast({
        title: "Missing required fields",
        description:
          "Please fill in all required fields (name, description, price, category)",
        variant: "destructive",
      });
      return;
    }

    // First check if we're currently editing a variant that hasn't been saved
    if (selectedVariant && isAddingVariant) {
      toast({
        title: "Unsaved variant",
        description:
          "Please save or cancel the current variant before submitting the product",
        variant: "destructive",
      });
      return;
    }

    // Combine variants without duplicates
    const combinedVariants = [...variants];

    // Add draft variants that don't already exist in the main variants array
    draftVariants.forEach((draftVariant) => {
      const exists = combinedVariants.some((v) => v.id === draftVariant.id);
      if (!exists) {
        combinedVariants.push(draftVariant);
      }
    });

    console.log(`Preparing ${combinedVariants.length} variants for submission`);

    // Process variants to ensure proper format for server
    const processedVariants = combinedVariants.map((variant) => {
      // Clean up variant data
      const { id, createdAt, updatedAt, ...cleanVariant } = variant;

      return {
        // Keep ID if it exists for traceability (server will handle this)
        id,
        ...cleanVariant,
        // Format images correctly
        images: Array.isArray(variant.images) ? variant.images : [],
        // Ensure numeric fields are numbers
        price:
          typeof variant.price === "number"
            ? variant.price
            : parseFloat(String(variant.price)),
        stock:
          typeof variant.stock === "number"
            ? variant.stock
            : parseInt(String(variant.stock)),
        mrp:
          variant.mrp !== undefined && variant.mrp !== null
            ? typeof variant.mrp === "number"
              ? variant.mrp
              : parseFloat(String(variant.mrp))
            : null,
      };
    });

    console.log("Submitting product data:", productData);
    console.log("With variants:", processedVariants.length);

    // Reset the variant state to prevent any duplicate submissions
    setSelectedVariant(null);
    setIsAddingVariant(false);

    // Create the data structure expected by the server
    const requestData = {
      productData: productData,
      variants: processedVariants,
    };

    createProductMutation.mutate(requestData);
  };

  // Save as draft handler - less strict validation
  const onSaveAsDraft = () => {
    setIsSavingDraft(true);

    // Get form data
    const formData = form.getValues();

    // Create the data structure expected by the server
    const productData = {
      name: formData.name,
      description: formData.description,
      specifications: formData.specifications,
      price: parseInt(formData.price),
      mrp: parseInt(formData.mrp),
      purchasePrice: formData.purchasePrice
        ? parseFloat(formData.purchasePrice)
        : undefined,
      gstRate:
        formData.gstRate ||
        formData.tax ||
        getSelectedCategoryGstRate().toString() ||
        "0",
      category: formData.category,
      subcategory:
        formData.subcategory === "none" ? null : formData.subcategory || null,
      subcategoryId: formData.subcategoryId || null,
      brand: formData.brand,
      color: formData.color,
      size: formData.size,
      imageUrl:
        uploadedImages[0] || "https://placehold.co/600x400?text=Product+Image",
      images: JSON.stringify(uploadedImages),
      stock: parseInt(formData.stock),
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      height: formData.height ? parseFloat(formData.height) : undefined,
      width: formData.width ? parseFloat(formData.width) : undefined,
      length: formData.length ? parseFloat(formData.length) : undefined,
      warranty: formData.warranty ? parseInt(formData.warranty) : undefined,
      hsn: formData.hsn,
      productType: formData.productType,
      returnPolicy: isStandardReturnPolicy(formData.returnPolicy)
        ? formData.returnPolicy
        : formData.customReturnPolicy,
      variants: [...variants, ...draftVariants],
      isDraft: true,
    };

    // Combine regular variants and draft variants for submission
    const combinedVariants = [...variants, ...draftVariants];

    console.log("Saving product draft:", productData);
    console.log("With variants:", combinedVariants.length);

    // Create the data structure expected by the server
    saveDraftMutation.mutate({
      productData: {
        ...productData,
        variants: combinedVariants,
      },
    });
  };

  return (
    <SellerDashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Add New Product</h1>
            <p className="text-muted-foreground">
              Create a new product listing for your store
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/seller/products")}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isSavingDraft}
              onClick={onSaveAsDraft}
            >
              {isSavingDraft ? "Saving..." : "Save as Draft"}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={form.handleSubmit(onSubmit)}
            >
              {isSubmitting ? "Submitting..." : "Add Product"}
            </Button>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Main form area - 3/4 width */}
          <div className="md:col-span-3 space-y-6">
            <Form {...form}>
              {/* Basic Information Section */}
              <Card>
                <CardHeader className="bg-slate-50 rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-primary" />
                      <CardTitle>Basic Information</CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        completionStatus.basicComplete
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : ""
                      }
                    >
                      {completionStatus.basicComplete ? "Complete" : "Required"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Essential details about your product
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Product Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Samsung Galaxy S22 Ultra 5G (Burgundy, 256 GB)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include brand, model, color, and key features (maximum
                          150 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Brand <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Samsung, Apple, Sony"
                              {...field}
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
                          <FormLabel>
                            Category <span className="text-red-500">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Clear subcategory when category changes
                              form.setValue("subcategory", "");
                              form.setValue("subcategoryId", null);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((category: any) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.name}
                                >
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subcategory"
                      render={({ field }) => {
                        // Get currently selected category
                        const selectedCategory = form.watch("category");

                        // Find the category object to get its ID
                        const categoryObject = categories?.find(
                          (c: any) => c.name === selectedCategory
                        );

                        // Filter subcategories by the selected category
                        const filteredSubcategories =
                          subcategories?.filter((sc: any) => {
                            return (
                              categoryObject &&
                              sc.categoryId === categoryObject.id
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

                                  if (value === "none") {
                                    // If None is selected, set subcategoryId to null
                                    form.setValue("subcategoryId", null);
                                    // Also set subcategory to empty string for consistency
                                    form.setValue("subcategory", "");
                                  } else {
                                    // Find the subcategory in the data to get its ID
                                    const subcategory = subcategories?.find(
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
                                value={field.value || "none"}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a subcategory (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {filteredSubcategories.map(
                                    (subcategory: any) => (
                                      <SelectItem
                                        key={subcategory.id}
                                        value={subcategory.name}
                                      >
                                        {subcategory.name}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>
                              Choose a subcategory for better product
                              classification
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Selling Price (Including GST){" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                ₹
                              </div>
                              <Input
                                type="number"
                                min="0"
                                placeholder="e.g. 1299"
                                className="pl-7"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          {watchedFields.category && (
                            <FormDescription className="text-sm text-blue-600 mt-1 flex items-center">
                              <InfoIcon className="h-4 w-4 mr-1" />
                              This price includes GST (
                              {getSelectedCategoryGstRate()}%)
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mrp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>MRP (Including GST)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                ₹
                              </div>
                              <Input
                                type="number"
                                min="0"
                                placeholder="e.g. 1499"
                                className="pl-7"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Maximum retail price including GST
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="purchasePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Price (Including GST)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                ₹
                              </div>
                              <Input
                                type="number"
                                min="0"
                                placeholder="e.g. 999"
                                className="pl-7"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Your cost price including GST (not visible to
                            customers)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="gstRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom GST Rate (%)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              %
                            </div>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder={`Use category default (${getSelectedCategoryGstRate()}%)`}
                              className="pr-7"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Leave empty to use the default GST rate for this
                          category ({getSelectedCategoryGstRate()}%). This
                          allows you to set a custom GST rate specifically for
                          this product.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* GST Information Display */}
                  {watchedFields.price > 0 && watchedFields.category && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center mb-2">
                        <InfoIcon className="h-5 w-5 text-blue-500 mr-2" />
                        <h4 className="font-medium text-blue-700">
                          GST Information
                        </h4>
                      </div>
                      <div className="space-y-1 text-sm">
                        {(() => {
                          const { basePrice, gstRate, gstAmount, finalPrice } =
                            calculateFinalPrice();
                          const isCustomRate =
                            form.getValues("gstRate") !== undefined &&
                            form.getValues("gstRate") !== null;
                          return (
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
                              <p className="text-slate-600">
                                <span className="font-medium">
                                  Selling Price (including GST):
                                </span>{" "}
                                ₹{finalPrice.toFixed(2)}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-medium">GST Amount:</span>{" "}
                                ₹{gstAmount.toFixed(2)}
                              </p>
                              <div className="h-px bg-blue-200 my-2"></div>
                              <p className="font-medium text-blue-800">
                                Base Price (excluding GST): ₹
                                {basePrice.toFixed(2)}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => {
                        const [inputValue, setInputValue] = useState("");
                        const [colors, setColors] = useState<string[]>(
                          field.value
                            ? field.value
                                .split(",")
                                .map((c) => c.trim())
                                .filter(Boolean)
                            : []
                        );

                        // Update the form field when colors change
                        useEffect(() => {
                          field.onChange(colors.join(", "));
                        }, [colors, field]);

                        const handleKeyDown = (e: React.KeyboardEvent) => {
                          if (e.key === "Enter" && inputValue.trim()) {
                            e.preventDefault();

                            // Check if input contains multiple colors (comma-separated)
                            const colorValues = inputValue
                              .split(",")
                              .map((c) => c.trim())
                              .filter(Boolean);

                            if (colorValues.length > 0) {
                              // Add multiple colors at once
                              const newColors = [...colors];
                              colorValues.forEach((color) => {
                                if (!newColors.includes(color)) {
                                  newColors.push(color);
                                }
                              });
                              setColors(newColors);
                            }

                            setInputValue("");
                          }
                        };

                        const handleRemoveColor = (colorToRemove: string) => {
                          setColors(colors.filter((c) => c !== colorToRemove));
                        };

                        return (
                          <FormItem>
                            <FormLabel>Color</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Input
                                  placeholder="e.g. Red, Blue, Black (press Enter to add)"
                                  value={inputValue}
                                  onChange={(e) =>
                                    setInputValue(e.target.value)
                                  }
                                  onKeyDown={handleKeyDown}
                                />
                                {colors.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {colors.map((color, index) => (
                                      <Badge
                                        key={index}
                                        className="bg-primary text-white pl-2 pr-1 flex items-center gap-1"
                                      >
                                        {color}
                                        <X
                                          className="h-3 w-3 cursor-pointer"
                                          onClick={() =>
                                            handleRemoveColor(color)
                                          }
                                        />
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormDescription>
                              Enter color and press Enter to add. You can add
                              multiple colors.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => {
                        const [inputValue, setInputValue] = useState("");
                        const [sizes, setSizes] = useState<string[]>(
                          field.value
                            ? field.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean)
                            : []
                        );

                        // Update the form field when sizes change
                        useEffect(() => {
                          field.onChange(sizes.join(", "));
                        }, [sizes, field]);

                        const handleKeyDown = (e: React.KeyboardEvent) => {
                          if (e.key === "Enter" && inputValue.trim()) {
                            e.preventDefault();

                            // Check if input contains multiple sizes (comma-separated)
                            const sizeValues = inputValue
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean);

                            if (sizeValues.length > 0) {
                              // Add multiple sizes at once
                              const newSizes = [...sizes];
                              sizeValues.forEach((size) => {
                                if (!newSizes.includes(size)) {
                                  newSizes.push(size);
                                }
                              });
                              setSizes(newSizes);
                            }

                            setInputValue("");
                          }
                        };

                        const handleRemoveSize = (sizeToRemove: string) => {
                          setSizes(sizes.filter((s) => s !== sizeToRemove));
                        };

                        return (
                          <FormItem>
                            <FormLabel>Size</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Input
                                  placeholder="e.g. S, M, L, XL (press Enter to add)"
                                  value={inputValue}
                                  onChange={(e) =>
                                    setInputValue(e.target.value)
                                  }
                                  onKeyDown={handleKeyDown}
                                />
                                {sizes.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {sizes.map((size, index) => (
                                      <Badge
                                        key={index}
                                        className="bg-primary text-white pl-2 pr-1 flex items-center gap-1"
                                      >
                                        {size}
                                        <X
                                          className="h-3 w-3 cursor-pointer"
                                          onClick={() => handleRemoveSize(size)}
                                        />
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormDescription>
                              Enter size and press Enter to add. You can add
                              multiple sizes.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="warranty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Warranty Period
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  <InfoIcon className="h-4 w-4 text-blue-500" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>
                                  Enter warranty duration in months, not years.
                                </p>
                                <p className="mt-1">
                                  Examples: 12 months (1 year), 24 months (2
                                  years), etc.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <div className="flex">
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="e.g. 12"
                                type="number"
                                className="pr-16"
                                {...field}
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground pointer-events-none bg-muted border-l rounded-r-md">
                                months
                              </div>
                            </div>
                          </FormControl>
                        </div>
                        <FormDescription className="text-amber-600 font-medium">
                          Important: Enter warranty period in months (e.g. 12
                          for 1 year, 24 for 2 years)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Product Description Section */}
              <Card>
                <CardHeader className="bg-slate-50 rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <CardTitle>Product Description</CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        completionStatus.descriptionComplete
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : ""
                      }
                    >
                      {completionStatus.descriptionComplete
                        ? "Complete"
                        : "Required"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Detailed information about your product
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Product Description{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Describe your product in detail. Include features, benefits, materials, and any other relevant information."
                            minHeight={250}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum 20 characters. Use formatting tools to
                          highlight key features, add headings, and make your
                          description more attractive.
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
                        <FormLabel>Product Specifications</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Enter technical specifications of your product. Include dimensions, materials, technical details, and compatibility information."
                            minHeight={150}
                          />
                        </FormControl>
                        <FormDescription>
                          Add detailed technical specifications in structured
                          format. Good for SEO and helps customers make informed
                          decisions.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="bg-blue-50 border-t border-blue-100">
                  <div className="w-full">
                    <h3 className="flex items-center text-sm font-semibold text-blue-700 mb-2">
                      <InfoIcon className="h-4 w-4 mr-2" />
                      Tips for a Great Product Description
                    </h3>
                    <ul className="text-xs text-blue-700 space-y-1 ml-6 list-disc">
                      <li>Highlight key features and benefits</li>
                      <li>Include detailed specifications</li>
                      <li>Mention materials, dimensions, and compatibility</li>
                      <li>Add usage instructions and care guidelines</li>
                      <li>Explain what makes your product unique</li>
                    </ul>
                  </div>
                </CardFooter>
              </Card>

              {/* Product Images Section */}
              <Card>
                <CardHeader className="bg-slate-50 rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <ImagePlus className="h-5 w-5 text-primary" />
                      <CardTitle>Product Images</CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        completionStatus.imagesComplete
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : ""
                      }
                    >
                      {completionStatus.imagesComplete
                        ? "Complete"
                        : "Required"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Upload high-quality images of your product (minimum 1 image
                    required)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-6">
                    {/* Media Library Integration */}
                    <div className="p-4 bg-slate-50 rounded-md border">
                      <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                        <ImagePlus className="h-4 w-4 text-primary" />
                        Select from Media Library
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Choose product images from your media library or upload
                        new ones directly to the library.
                      </p>
                      <MultiMediaPicker
                        onSelect={setUploadedImages}
                        selectedUrls={uploadedImages}
                        buttonLabel="Browse Media Library"
                        maxImages={8}
                      />
                    </div>

                    {/* Divider with OR text */}
                    <div className="relative flex items-center">
                      <div className="flex-grow border-t border-gray-300"></div>
                      <span className="mx-4 flex-shrink text-gray-500">OR</span>
                      <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    {/* Traditional Upload Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">
                          Upload Images Directly
                        </h3>
                        <FileUpload
                          onChange={handleAddImage}
                          label="Product Images (select multiple)"
                          accept="image/*"
                          maxSizeMB={5}
                          multiple={true}
                        />
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium mb-2">
                          Add Image URL
                        </h3>
                        <div className="flex space-x-2">
                          <Input
                            id="image-url-input"
                            placeholder="https://example.com/product-image.jpg"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById(
                                "image-url-input"
                              ) as HTMLInputElement;
                              if (input && input.value) {
                                handleAddImage(input.value);
                                input.value = "";
                              } else {
                                toast({
                                  title: "URL required",
                                  description: "Please enter an image URL",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            Add URL
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter a direct link to an image (JPG, PNG, GIF)
                        </p>
                      </div>
                    </div>
                  </div>

                  {uploadedImages.length > 0 && (
                    <>
                      <Separator />
                      <h3 className="text-sm font-medium">
                        Uploaded Images ({uploadedImages.length})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {uploadedImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Product image ${index + 1}`}
                              className="h-24 w-full object-cover rounded-md border"
                            />
                            <div className="absolute inset-0 bg-black/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveImage(index)}
                                className="h-8 text-xs"
                              >
                                Remove
                              </Button>
                            </div>
                            {index === 0 && (
                              <Badge className="absolute top-1 left-1 bg-blue-500 text-white text-xs">
                                Cover
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="bg-amber-50 border-t border-amber-100">
                  <div className="w-full">
                    <h3 className="flex items-center text-sm font-semibold text-amber-700 mb-2">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Image Guidelines
                    </h3>
                    <ul className="text-xs text-amber-700 space-y-1 ml-6 list-disc">
                      <li>Upload at least 1 image, up to 8 images allowed</li>
                      <li>Recommended size: 1000 x 1000 pixels or larger</li>
                      <li>
                        First image will be the cover image shown in search
                        results
                      </li>
                      <li>Use well-lit, clear images on a white background</li>
                      <li>Show the product from multiple angles</li>
                    </ul>
                  </div>
                </CardFooter>
              </Card>

              {/* Inventory Management Section */}
              <Card>
                <CardHeader className="bg-slate-50 rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <PackageCheck className="h-5 w-5 text-primary" />
                      <CardTitle>Inventory Management</CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        completionStatus.inventoryComplete
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : ""
                      }
                    >
                      {completionStatus.inventoryComplete
                        ? "Complete"
                        : "Required"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Set up inventory details and shipping information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            SKU (Stock Keeping Unit){" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. SM-S22U-256-BLK"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Unique identifier for your product
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Stock Quantity{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="e.g. 50"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of units available for sale
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-medium">
                        Package Dimensions
                      </h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              <InfoIcon className="h-4 w-4 text-blue-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>
                              Enter accurate product dimensions for proper
                              shipping calculations and customer expectations.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-md mb-4 text-xs text-blue-700">
                      <p>
                        Important: Provide package dimensions in centimeters
                        (cm) and weight in kilograms (kg).
                      </p>
                      <p className="mt-1">
                        These values will be used for shipping calculations and
                        should reflect the <strong>packaged</strong> product.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="e.g. 0.5"
                                  className="pr-12"
                                  {...field}
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground pointer-events-none bg-muted border-l rounded-r-md">
                                  kg
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  placeholder="e.g. 15"
                                  className="pr-12"
                                  {...field}
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground pointer-events-none bg-muted border-l rounded-r-md">
                                  cm
                                </div>
                              </div>
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
                            <FormLabel>Width</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  placeholder="e.g. 8"
                                  className="pr-12"
                                  {...field}
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground pointer-events-none bg-muted border-l rounded-r-md">
                                  cm
                                </div>
                              </div>
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
                            <FormLabel>Height</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  placeholder="e.g. 2"
                                  className="pr-12"
                                  {...field}
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground pointer-events-none bg-muted border-l rounded-r-md">
                                  cm
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Variants Section */}
              <Card>
                <CardHeader className="bg-slate-50 rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-primary" />
                      <CardTitle>Product Variants</CardTitle>
                    </div>
                    <Badge variant="outline">Optional</Badge>
                  </div>
                  <CardDescription>
                    Add different variations of your product (colors, sizes,
                    etc.)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Tabs for different variant creation methods */}
                  <Tabs defaultValue="manual" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="manual">Manual Creation</TabsTrigger>
                      <TabsTrigger value="matrix">Matrix Generator</TabsTrigger>
                    </TabsList>

                    {/* Manual Variant Creation Tab */}
                    <TabsContent value="manual" className="mt-0">
                      <MultiVariantTable
                        variants={[...variants, ...draftVariants]}
                        onAddVariant={handleAddVariant}
                        onDeleteVariant={handleDeleteVariant}
                        onEditVariant={handleEditVariant}
                        onSaveNewVariant={handleSaveNewVariant}
                        newVariantExists={isAddingVariant}
                        currentVariant={selectedVariant}
                        onUpdateVariantField={updateVariantField}
                        onCancelNewVariant={handleCancelVariant}
                      />
                    </TabsContent>

                    {/* Matrix Generator Tab */}
                    <TabsContent value="matrix" className="mt-0">
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                        <h3 className="text-sm font-semibold text-blue-800 flex items-center mb-2">
                          <HelpCircle className="h-4 w-4 mr-2" />
                          Matrix Variant Generator
                        </h3>
                        <p className="text-sm text-blue-700">
                          Use this tool to quickly create multiple variants by
                          defining attributes like color and size. The system
                          will generate all possible combinations automatically.
                        </p>
                      </div>

                      <VariantMatrixGenerator
                        onSaveVariants={(newVariants) => {
                          console.log("Generated variants:", newVariants);

                          // Create draft variants for each generated variant
                          const drafts = newVariants.map((variant, index) => ({
                            ...variant,
                            id: -(Date.now() + index), // Negative ID to indicate it's a draft
                          }));

                          // Add these to our draft variants
                          setDraftVariants((prev) => [...prev, ...drafts]);

                          // Show success toast
                          toast({
                            title: `${newVariants.length} variants generated`,
                            description:
                              "The variants have been added to your product. Save the product to apply changes.",
                          });
                        }}
                        existingVariants={[...variants, ...draftVariants]}
                        productName={form.getValues("name")}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Note about product review */}
              <div className="mt-8 flex flex-col gap-4">
                <p className="text-sm text-muted-foreground text-center">
                  Your product will be reviewed by our team before being
                  published.
                </p>
              </div>

              {/* Large green submit button */}
              <div className="flex flex-col items-center mt-8 border-t pt-6">
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md w-full max-w-md py-6"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting Product...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Submit Product
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </div>

          {/* Sidebar - 1/4 Width */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submission Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Form Completion</span>
                    <span className="text-sm font-medium text-blue-600">
                      {completionStatus.percentage}%
                    </span>
                  </div>
                  <Progress
                    value={completionStatus.percentage}
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {completionStatus.basicComplete ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm">Basic information</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {completionStatus.descriptionComplete ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm">Product description</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {completionStatus.imagesComplete ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm">
                      {uploadedImages.length > 0
                        ? `Images (${uploadedImages.length} uploaded)`
                        : "Images required"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {completionStatus.inventoryComplete ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm">Inventory details</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Listing Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-sm">
                      <span className="flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        Product Title Tips
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-xs space-y-1 ml-6 list-disc text-muted-foreground">
                        <li>Include brand, model number, and key attributes</li>
                        <li>Mention color, size, and quantity if applicable</li>
                        <li>Keep it under 150 characters</li>
                        <li>Don't use ALL CAPS or excessive punctuation!!!</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-sm">
                      <span className="flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        Pricing Strategy
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-xs space-y-1 ml-6 list-disc text-muted-foreground">
                        <li>Set competitive prices to match market rates</li>
                        <li>
                          MRP must be equal to or higher than selling price
                        </li>
                        <li>Consider shipping costs when setting prices</li>
                        <li>Lelekart charges commission based on category</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-sm">
                      <span className="flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        Image Requirements
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-xs space-y-1 ml-6 list-disc text-muted-foreground">
                        <li>Minimum 1 image, maximum 8 images</li>
                        <li>White background preferred</li>
                        <li>No watermarks or text overlays allowed</li>
                        <li>First image is the main product image</li>
                        <li>Include images from different angles</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger className="text-sm">
                      <span className="flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        Approval Process
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-xs space-y-1 ml-6 list-disc text-muted-foreground">
                        <li>
                          Products go through quality check before listing
                        </li>
                        <li>Approval typically takes 24-48 hours</li>
                        <li>
                          Ensure all mandatory fields are filled correctly
                        </li>
                        <li>
                          Products failing quality check will need revision
                        </li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <div className="p-4 bg-green-50 rounded-md">
              <h3 className="flex items-center text-sm font-semibold text-green-700 mb-2">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Boost Your Sales
              </h3>
              <ul className="text-xs text-green-700 space-y-1 ml-6 list-disc">
                <li>Complete all product information for better visibility</li>
                <li>High-quality images improve conversion rates</li>
                <li>Detailed descriptions help customers make decisions</li>
                <li>Keep inventory updated to avoid stockouts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Variant Dialog */}
      <Dialog open={isEditingVariant} onOpenChange={setIsEditingVariant}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Edit Variant</DialogTitle>
            <DialogDescription>
              Make changes to this variant. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          {selectedVariant && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-variant-color">Color</Label>
                  <Input
                    id="edit-variant-color"
                    defaultValue={selectedVariant.color || ""}
                    onChange={(e) => {
                      setSelectedVariant({
                        ...selectedVariant,
                        color: e.target.value,
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-variant-size">Size</Label>
                  <Input
                    id="edit-variant-size"
                    defaultValue={selectedVariant.size || ""}
                    onChange={(e) => {
                      setSelectedVariant({
                        ...selectedVariant,
                        size: e.target.value,
                      });
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-variant-price">Price</Label>
                  <Input
                    id="edit-variant-price"
                    type="number"
                    defaultValue={selectedVariant.price || 0}
                    onChange={(e) => {
                      setSelectedVariant({
                        ...selectedVariant,
                        price: Number(e.target.value),
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-variant-mrp">MRP</Label>
                  <Input
                    id="edit-variant-mrp"
                    type="number"
                    defaultValue={selectedVariant.mrp || 0}
                    onChange={(e) => {
                      setSelectedVariant({
                        ...selectedVariant,
                        mrp: Number(e.target.value),
                      });
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-variant-stock">Stock</Label>
                  <Input
                    id="edit-variant-stock"
                    type="number"
                    defaultValue={selectedVariant.stock || 0}
                    onChange={(e) => {
                      setSelectedVariant({
                        ...selectedVariant,
                        stock: Number(e.target.value),
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-variant-warranty">
                    Warranty (months)
                  </Label>
                  <Input
                    id="edit-variant-warranty"
                    type="number"
                    min="0"
                    placeholder="e.g. 12"
                    defaultValue={selectedVariant.warranty || 0}
                    onChange={(e) => {
                      setSelectedVariant({
                        ...selectedVariant,
                        warranty: Number(e.target.value),
                      });
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-variant-return-policy">
                  Return Policy (days)
                </Label>
                <Input
                  id="edit-variant-return-policy"
                  type="number"
                  min="0"
                  placeholder="e.g. 7"
                  defaultValue={selectedVariant.returnPolicy || "7"}
                  onChange={(e) => {
                    setSelectedVariant({
                      ...selectedVariant,
                      returnPolicy: e.target.value,
                    });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Number of days within which customers can return this variant
                </p>
              </div>

              {/* Variant Images Section */}
              <div className="space-y-3 pt-2 border-t">
                <Label className="font-medium flex items-center">
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Variant Images
                </Label>
                <div className="text-xs text-muted-foreground mb-3">
                  Add variant-specific images. These will be shown when this
                  color/size is selected.
                </div>

                {/* Display current variant images */}
                {selectedVariant.images &&
                  selectedVariant.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Array.isArray(selectedVariant.images)
                        ? selectedVariant.images.map((img, idx) => (
                            <div
                              key={`variant-img-${idx}`}
                              className="relative group"
                            >
                              <img
                                src={img}
                                alt={`Variant ${idx + 1}`}
                                className="h-16 w-16 object-cover border rounded-md"
                              />
                              <button
                                type="button"
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hidden group-hover:block"
                                onClick={() => {
                                  // Remove this image from the variant
                                  const updatedImages = [
                                    ...selectedVariant.images,
                                  ].filter((_, i) => i !== idx);
                                  setSelectedVariant({
                                    ...selectedVariant,
                                    images: updatedImages,
                                  });
                                }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))
                        : null}
                    </div>
                  )}

                {/* Media Picker for variant images */}
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">
                      Upload Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full p-2 border rounded-md"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Create a URL for the selected file
                          const imageUrl = URL.createObjectURL(file);
                          const currentImages = Array.isArray(
                            selectedVariant.images
                          )
                            ? selectedVariant.images
                            : [];

                          setSelectedVariant({
                            ...selectedVariant,
                            images: [...currentImages, imageUrl],
                          });

                          toast({
                            title: "Image uploaded",
                            description:
                              "Image has been added to this variant.",
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">
                      Image URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="Enter image URL"
                        className="flex-1 p-2 border rounded-md"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const url = e.currentTarget.value;
                            if (url) {
                              const currentImages = Array.isArray(
                                selectedVariant.images
                              )
                                ? selectedVariant.images
                                : [];

                              setSelectedVariant({
                                ...selectedVariant,
                                images: [...currentImages, url],
                              });

                              toast({
                                title: "Image URL added",
                                description:
                                  "Image URL has been added to this variant.",
                              });
                              e.currentTarget.value = "";
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        onClick={(e) => {
                          const input = e.currentTarget
                            .previousElementSibling as HTMLInputElement;
                          const url = input.value;
                          if (url) {
                            const currentImages = Array.isArray(
                              selectedVariant.images
                            )
                              ? selectedVariant.images
                              : [];

                            setSelectedVariant({
                              ...selectedVariant,
                              images: [...currentImages, url],
                            });

                            toast({
                              title: "Image URL added",
                              description:
                                "Image URL has been added to this variant.",
                            });
                            input.value = "";
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditingVariant(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={() => {
                if (selectedVariant) {
                  // Ensure images is an array
                  const processedVariant = {
                    ...selectedVariant,
                    images: Array.isArray(selectedVariant.images)
                      ? selectedVariant.images
                      : [],
                  };

                  // Update the variant in the current variants list
                  setVariants(
                    variants.map((v) =>
                      v.id === processedVariant.id ? processedVariant : v
                    )
                  );

                  // Add to deleted variants if it's a stored variant (positive ID)
                  if (processedVariant.id && processedVariant.id > 0) {
                    // This is an existing variant that has been edited
                    // We'll update it when the product is saved
                  } else {
                    // This is a draft variant, update it in the draft list
                    setDraftVariants((drafts) =>
                      drafts.map((d) =>
                        d.id === processedVariant.id ? processedVariant : d
                      )
                    );
                  }

                  toast({
                    title: "Variant updated",
                    description:
                      "The variant has been updated. Save the product to apply changes.",
                  });

                  setIsEditingVariant(false);
                }
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Variant Dialog */}
      <Dialog open={isDeletingVariant} onOpenChange={setIsDeletingVariant}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Variant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this variant? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeletingVariant(false);
                setVariantImages([]); // Clear variant images when canceling delete
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedVariant && selectedVariant.id) {
                  // Remove from the variants array
                  setVariants(
                    variants.filter((v) => v.id !== selectedVariant.id)
                  );

                  // Also remove from draft variants if it exists there
                  setDraftVariants((drafts) =>
                    drafts.filter((d) => d.id !== selectedVariant.id)
                  );

                  // Clear variant images
                  setVariantImages([]);

                  toast({
                    title: "Variant deleted",
                    description:
                      "The variant has been deleted. Save the product to apply changes.",
                  });

                  setIsDeletingVariant(false);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SellerDashboardLayout>
  );
}
