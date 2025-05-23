import React, {
  useState,
  useEffect,
  useCallback,
  ErrorInfo,
  ReactNode,
  useRef,
} from "react";
import { calculateBasePrice, extractGstAmount } from "@shared/utils/gst";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  ArrowLeft,
  ImagePlus,
  Tag,
  AlertCircle,
  HelpCircle,
  Info,
  CheckCircle,
  Upload,
  Trash2,
  Eye,
  Plus,
  X,
  Edit,
  UploadCloud,
  PackageOpen,
  Save,
  Link as LinkIcon,
} from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast, useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { ProductVariant } from "@/components/product/variant-form";
import { VariantMatrixGenerator } from "@/components/product/variant-matrix-generator";
import { GstRateField } from "@/components/product/gst-rate-field";
import { MultiMediaPicker } from "@/components/multi-media-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Form validation schema
const productSchema = z
  .object({
    name: z
      .string()
      .min(3, "Product name must be at least 3 characters")
      .max(150, "Name too long"),
    description: z
      .string()
      .min(20, "Description must be at least 20 characters")
      .max(5000, "Description too long"),
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
    // The stock field validation will be skipped when variants are present
    stock: z
      .string()
      .optional()
      .refine(
        (val) => {
          // If the field is empty (which might happen with variants), consider it valid
          if (!val || val.trim() === "") return true;
          // Otherwise, validate as a non-negative number
          return !isNaN(parseInt(val)) && parseInt(val) >= 0;
        },
        {
          message: "Stock must be a non-negative number",
        }
      ),
    weight: z
      .string()
      .refine(
        (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
        {
          message: "Weight must be a non-negative number",
        }
      )
      .optional(),
    height: z
      .string()
      .refine(
        (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
        {
          message: "Height must be a non-negative number",
        }
      )
      .optional(),
    width: z
      .string()
      .refine(
        (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
        {
          message: "Width must be a non-negative number",
        }
      )
      .optional(),
    length: z
      .string()
      .refine(
        (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
        {
          message: "Length must be a non-negative number",
        }
      )
      .optional(),
    warranty: z
      .string()
      .min(1, "Warranty information is required")
      .max(500, "Warranty description is too long"),
    hsn: z.string().optional(),
    color: z.string().optional(),
    size: z.string().optional(),
    tax: z.string().min(1, "Please select a tax bracket"),
    productType: z.string().min(1, "Please select a product type"),
    returnPolicy: z.string().min(1, "Please select a return policy"),
    customReturnPolicy: z.string().optional(),
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
  )
  .refine((data) => parseFloat(data.mrp) >= parseFloat(data.price), {
    message: "MRP must be greater than or equal to the selling price",
    path: ["mrp"],
  });

type ProductFormValues = z.infer<typeof productSchema>;

// Check if a return policy value is one of the standard options
const isStandardReturnPolicy = (value?: string | number | null): boolean => {
  if (value === undefined || value === null) return true;
  const standardValues = ["0", "7", "10", "15", "30"];
  return standardValues.includes(value.toString());
};

export default function EditProductPage() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  // Try to match both possible route patterns for edit product
  const [, editParams] = useRoute("/seller/products/edit/:id");
  const [, draftEditParams] = useRoute("/seller/drafts/edit/:id");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editVariantDialogOpen, setEditVariantDialogOpen] = useState(false);
  const [deleteVariantDialogOpen, setDeleteVariantDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [deletedVariantIds, setDeletedVariantIds] = useState<number[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [draftVariants, setDraftVariants] = useState<ProductVariant[]>([]);
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(
    null
  );
  const [currentVariants, setCurrentVariants] = useState<ProductVariant[]>([]);
  const [isEditingVariant, setIsEditingVariant] = useState(false);
  const [newVariantRow, setNewVariantRow] = useState(false);
  const [variantImages, setVariantImages] = useState<string[]>([]);
  const [categoryGstRates, setCategoryGstRates] = useState<
    Record<string, number>
  >({});
  const [activeTab, setActiveTab] = useState<string>("basic");
  const queryClient = useQueryClient();
  // Add state for image URL input (inside EditProductPage)
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [addUrlError, setAddUrlError] = useState("");

  // Check both route patterns and use the first match
  const params = editParams || draftEditParams;
  const productId = params?.id ? parseInt(params.id) : 0;

  // Effect to handle tab changes and preserve variant data
  useEffect(() => {
    // If moving away from variants tab, save the current state of variants to a ref
    // If moving to variants tab, make sure the variants state is properly loaded
    if (activeTab === "variants") {
      // Make sure we have proper array representation of variant images
      // Process existing variants
      const processVariantImages = (variant: ProductVariant) => {
        // Make a copy of the variant to avoid reference issues
        const processedVariant = { ...variant };

        // Process images field if it exists
        if (variant.images) {
          try {
            // If images is a string that contains JSON, parse it
            if (typeof variant.images === "string") {
              const parsedImages = JSON.parse(variant.images);
              processedVariant.images = Array.isArray(parsedImages)
                ? parsedImages
                : [];
            }
            // If images is already an array, use it directly
            else if (Array.isArray(variant.images)) {
              processedVariant.images = variant.images;
            } else {
              processedVariant.images = [];
            }
          } catch (error) {
            // Handle image parsing error silently
            processedVariant.images = [];
          }
        } else {
          processedVariant.images = [];
        }

        return processedVariant;
      };

      // Process both saved and draft variants - with null checking
      const updatedVariants = Array.isArray(variants)
        ? variants.map(processVariantImages)
        : [];
      const updatedDraftVariants = Array.isArray(draftVariants)
        ? draftVariants.map(processVariantImages)
        : [];

      // Update regular variants if needed
      if (JSON.stringify(updatedVariants) !== JSON.stringify(variants)) {
        setVariants(updatedVariants);
      }

      // Update draft variants if needed
      if (
        JSON.stringify(updatedDraftVariants) !== JSON.stringify(draftVariants)
      ) {
        setDraftVariants(updatedDraftVariants);
      }
    }
    // Including variants and draftVariants in dependencies to prevent ESLint warnings
    // Note: this could cause circular updates if not handled carefully,
    // but we're protecting against that with the JSON.stringify comparison
  }, [activeTab, variants, draftVariants]);

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

  // Define the product variant type
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
    height?: number;
    width?: number;
    length?: number;
    weight?: number;
    warranty?: number;
  }

  // Fetch product data including variants
  const { data: product, isLoading: isProductLoading } = useQuery({
    queryKey: ["/api/products", productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}?variants=true`);
      if (!res.ok) {
        throw new Error("Failed to fetch product");
      }
      return res.json();
    },
    enabled: !!productId,
  });

  // Form setup
  const form = useForm<ProductFormValues>({
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
      brand: "",
      color: "",
      size: "",
      stock: "1",
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

  // Updated memoized function to update variant fields with functional state update pattern
  // This prevents cursor jumping by ensuring state updates don't trigger re-renders that reset cursor position
  // Maintain a cursor position state outside component re-renders
  const cursorStateRef = useRef<{ field: string; position: number | null }>({
    field: "",
    position: null,
  });

  const updateVariantField = useCallback(
    (field: keyof ProductVariant, value: any) => {
      // Get the current cursor position from the active input element
      const activeElement = document.activeElement as HTMLInputElement;
      const cursorPosition = activeElement?.selectionStart || null;

      // Store cursor position in ref to persist across renders
      cursorStateRef.current = {
        field: String(field),
        position: cursorPosition,
      };

      // Use functional state update to avoid state update race conditions
      setCurrentVariant((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [field]: value,
        };
      });

      // Use requestAnimationFrame for higher priority than setTimeout
      requestAnimationFrame(() => {
        // Map the field name to the actual input id in the DOM
        const fieldIdMap: Record<string, string> = {
          sku: "variant-sku",
          color: "variant-color",
          size: "variant-size",
          price: "variant-price",
          mrp: "variant-mrp",
          stock: "variant-stock",
        };

        // Get the corresponding input id
        const inputId = fieldIdMap[cursorStateRef.current.field];
        const storedPosition = cursorStateRef.current.position;

        // Find the input for the same field that was just updated
        if (inputId) {
          const fieldInput = document.getElementById(
            inputId
          ) as HTMLInputElement;

          if (fieldInput && storedPosition !== null) {
            // First focus the input
            fieldInput.focus();

            // Then restore cursor position (only if the cursor was in the field)
            try {
              fieldInput.setSelectionRange(storedPosition, storedPosition);
            } catch (e) {
              // Silent handling of cursor position restoration errors
            }
          }
        }
      });
    },
    []
  );

  // Get the currently selected category's GST rate
  const getSelectedCategoryGstRate = (): number => {
    // If the product has a custom GST rate, use it
    if (product?.gstRate) {
      const rate = parseFloat(product.gstRate.toString());
      return isNaN(rate) ? 0 : rate;
    }

    // Otherwise use category default
    const selectedCategory = form.getValues("category");
    return selectedCategory ? categoryGstRates[selectedCategory] || 0 : 0;
  };

  // Calculate components of GST-inclusive price
  const calculateFinalPrice = (): {
    basePrice: number;
    gstRate: number;
    gstAmount: number;
    finalPrice: number;
  } => {
    // The selling price entered by the user already includes GST
    const finalPrice = parseInt(form.getValues("price")) || 0;

    // Use custom GST rate if provided, otherwise use category GST rate
    const customGstRate = form.getValues("gstRate");
    const gstRate =
      customGstRate !== undefined &&
      customGstRate !== null &&
      customGstRate !== ""
        ? parseFloat(customGstRate.toString())
        : getSelectedCategoryGstRate();

    // Extract the base price and GST amount from the inclusive price
    const basePrice = calculateBasePrice(finalPrice, gstRate);
    const gstAmount = extractGstAmount(finalPrice, gstRate);

    return { basePrice, gstRate, gstAmount, finalPrice };
  };

  // Update form values when product data is loaded
  useEffect(() => {
    if (product) {
      // Process product data to initialize the form

      // Initialize product images - handle both main imageUrl and additional images array
      let productImages: string[] = [];

      // Add main image if available
      if (product.imageUrl) {
        productImages.push(product.imageUrl);
      }

      // Process additional images if available (might be stored as JSON string)
      if (product.images) {
        try {
          // If it's a string, try to parse it as JSON
          if (typeof product.images === "string") {
            const parsedImages = JSON.parse(product.images);
            if (Array.isArray(parsedImages)) {
              // Filter out any duplicates with the main image
              const additionalImages = parsedImages.filter(
                (img: string) => img !== product.imageUrl
              );
              productImages = [...productImages, ...additionalImages];
            }
          }
          // If it's already an array, use it directly
          else if (Array.isArray(product.images)) {
            const additionalImages = product.images.filter(
              (img: string) => img !== product.imageUrl
            );
            productImages = [...productImages, ...additionalImages];
          }
        } catch (error) {
          console.error("Failed to parse product images:", error);
        }
      }

      setUploadedImages(productImages);

      // Initialize variants if available
      if (product.variants && Array.isArray(product.variants)) {
        // Process variants to ensure images field is properly parsed from string if needed
        const processedVariants = product.variants.map(
          (variant: ProductVariant) => {
            // Make a copy of the variant to avoid mutations
            const processedVariant = { ...variant };

            // Process images field if it exists
            if (variant.images) {
              try {
                // If images is a string that contains JSON, parse it
                if (typeof variant.images === "string") {
                  const imagesStr = String(variant.images); // Ensure it's a valid string
                  // Check if the string is a valid JSON array
                  if (
                    imagesStr &&
                    imagesStr.trim &&
                    imagesStr.trim().startsWith("[")
                  ) {
                    try {
                      // Try to parse it as a JSON array
                      const parsedImages = JSON.parse(imagesStr);
                      if (Array.isArray(parsedImages)) {
                        processedVariant.images = parsedImages.filter(
                          (img: any) =>
                            typeof img === "string" &&
                            img.trim &&
                            img.trim() !== ""
                        );
                      } else {
                        processedVariant.images = [];
                      }
                    } catch (parseError) {
                      // Silent error handling
                      processedVariant.images = [];
                    }
                  } else if (imagesStr && imagesStr.trim) {
                    // Treat it as a single image URL if it's not empty
                    const trimmed = imagesStr.trim();
                    if (trimmed !== "") {
                      processedVariant.images = [trimmed];
                    } else {
                      processedVariant.images = [];
                    }
                  } else {
                    // Invalid string format
                    processedVariant.images = [];
                  }
                }
                // If images is already an array, use it directly
                else if (Array.isArray(variant.images)) {
                  // Filter out any empty or invalid items
                  processedVariant.images = variant.images.filter(
                    (img: any) => typeof img === "string" && img.trim() !== ""
                  );
                } else {
                  processedVariant.images = [];
                }
              } catch (error) {
                // Silent error handling for image parsing
                processedVariant.images = [];
              }
            } else {
              processedVariant.images = [];
            }

            // Ensure all other fields are properly formatted
            return {
              ...processedVariant,
              id: processedVariant.id,
              productId: Number(productId),
              sku: processedVariant.sku || "",
              color: processedVariant.color || "",
              size: processedVariant.size || "",
              price: Number(processedVariant.price) || 0,
              mrp: Number(processedVariant.mrp) || 0,
              stock: Number(processedVariant.stock) || 0,
              height: Number(product.height) || 0,
              width: Number(product.width) || 0,
              length: Number(product.length) || 0,
              weight: Number(product.weight) || 0,
              warranty: Number(product.warranty) || 0,
              // Images already processed above
            };
          }
        );

        setVariants(processedVariants);
        // Also initialize currentVariants with the same data for tracking
        setCurrentVariants(processedVariants);
      }

      // Process GST rate for form initialization

      // Extract GST rate correctly - ensure it's a string value for the form
      let gstRateValue = "";
      if (product.gstRate !== undefined && product.gstRate !== null) {
        // If it's already a string, use it directly
        if (typeof product.gstRate === "string") {
          gstRateValue = product.gstRate;
        } else {
          // Convert numeric or other types to string
          gstRateValue = product.gstRate.toString();
        }

        // Check if the string is a valid number
        const parsedValue = parseFloat(gstRateValue);
        if (!isNaN(parsedValue)) {
          // Format the GST rate as a string with no trailing zeros if it's an integer
          gstRateValue =
            parsedValue % 1 === 0
              ? parsedValue.toString()
              : parsedValue.toFixed(2);
        }
      }

      // GST rate is now formatted correctly and subcategory data is ready for form initialization

      form.reset({
        name: product.name || "",
        description: product.description || "",
        specifications: product.specifications || "",
        price: product.price?.toString() || "",
        mrp: product.mrp?.toString() || (product.price * 1.2)?.toString() || "",
        purchasePrice: product.purchasePrice?.toString() || "",
        // Use the properly formatted GST rate
        gstRate: gstRateValue,
        sku: product.sku || product.id?.toString() || "",
        category: product.category || "",
        subcategory: product.subcategory || "none",
        subcategoryId: product.subcategoryId || null,
        brand: product.brand || "Brand",
        color: product.color || "",
        size: product.size || "",
        stock: product.stock?.toString() || "1",
        weight: product.weight?.toString() || "",
        height: product.height?.toString() || "",
        width: product.width?.toString() || "",
        length: product.length?.toString() || "",
        warranty: product.warranty?.toString() || "",
        hsn: product.hsn || "",
        // Ensure tax dropdown is also set correctly from the GST rate
        tax:
          product.gstRate !== undefined && product.gstRate !== null
            ? product.gstRate.toString()
            : "",
        productType: product.productType || "physical",
        returnPolicy: isStandardReturnPolicy(product.returnPolicy)
          ? product.returnPolicy?.toString()
          : "custom",
        customReturnPolicy: !isStandardReturnPolicy(product.returnPolicy)
          ? product.returnPolicy?.toString()
          : "",
      });

      // Make sure GST rate and tax fields are in sync
      setTimeout(() => {
        // Double-check if the product GST rate exists
        if (product.gstRate !== undefined && product.gstRate !== null) {
          // Use the properly formatted GST value
          form.setValue("tax", gstRateValue);
          form.setValue("gstRate", gstRateValue);
        }

        // Handle custom return policy if needed
        if (
          product.returnPolicy &&
          !isStandardReturnPolicy(product.returnPolicy)
        ) {
          form.setValue("returnPolicy", "custom");
          form.setValue("customReturnPolicy", product.returnPolicy.toString());
        }
      }, 100);
    }
  }, [product, form]);

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Start the real upload process
    setIsUploading(true);
    setUploadProgress(0);

    const uploadedUrls: string[] = [];

    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Calculate progress
        setUploadProgress(Math.round((i / files.length) * 50)); // First half is for processing

        // Create a FormData object to send the file
        const formData = new FormData();
        formData.append("file", file);

        // Make the actual API request to upload to S3
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to upload file: ${errorText}`);
        }

        const data = await response.json();

        // Add the real URL from S3
        uploadedUrls.push(data.url);

        // Update progress (second half is for uploads)
        setUploadProgress(50 + Math.round(((i + 1) / files.length) * 50));
      }

      // Update state with real uploaded image URLs
      setUploadedImages([...uploadedImages, ...uploadedUrls]);

      toast({
        title: "Images uploaded",
        description: `${files.length} image${
          files.length > 1 ? "s" : ""
        } uploaded successfully.`,
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error uploading your files. Please try again.",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);

      // Reset the input field
      e.target.value = "";
    }
  };

  // Remove image handler
  const handleRemoveImage = (index: number) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
  };

  // Variant image upload handler
  const handleVariantImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Start the real upload process
    setIsUploading(true);
    setUploadProgress(0);

    const uploadedUrls: string[] = [];

    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Calculate progress
        setUploadProgress(Math.round((i / files.length) * 50)); // First half is for processing

        // Create a FormData object to send the file
        const formData = new FormData();

        // CRITICAL FIX: Ensure the form field name is "file" as expected by the server
        // Do not include any extra form fields, and make sure field name exactly matches backend
        formData.append("file", file);

        // Make the actual API request to upload to S3
        // Make sure no extra headers are interfering with the multipart form
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
          // Explicitly remove content-type header to let browser set it with boundary
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to upload variant image: ${errorText}`);
        }

        const data = await response.json();

        // Add the real URL from S3
        uploadedUrls.push(data.url);

        // Update progress (second half is for uploads)
        setUploadProgress(50 + Math.round(((i + 1) / files.length) * 50));
      }

      // Update state with real uploaded image URLs
      setVariantImages([...variantImages, ...uploadedUrls]);

      toast({
        title: "Variant images uploaded",
        description: `${files.length} image${
          files.length > 1 ? "s" : ""
        } uploaded successfully.`,
      });
    } catch (error) {
      console.error("Error uploading variant images:", error);
      toast({
        variant: "destructive",
        title: "Variant image upload failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error uploading your variant images. Please try again.",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);

      // Reset the input field
      e.target.value = "";
    }
  };

  // Remove variant image handler
  const handleRemoveVariantImage = (index: number) => {
    const newImages = [...variantImages];
    newImages.splice(index, 1);
    setVariantImages(newImages);
  };

  // Save variant handler
  const handleSaveVariant = (variant: ProductVariant, images: string[]) => {
    try {
      // Add images to the variant and ensure numeric values
      const updatedVariant = {
        ...variant,
        images: images,
        // Clean up any dash characters and ensure fields have proper values
        color:
          variant.color === "—" || variant.color === "-" ? "" : variant.color,
        size: variant.size === "—" || variant.size === "-" ? "" : variant.size,
        // Ensure numeric properties have correct type
        price:
          typeof variant.price === "string"
            ? parseInt(variant.price)
            : variant.price,
        mrp:
          typeof variant.mrp === "string" ? parseInt(variant.mrp) : variant.mrp,
        stock:
          typeof variant.stock === "string"
            ? parseInt(variant.stock)
            : variant.stock,
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

        // CRITICAL: Also update currentVariants which is the source of truth for product updates
        // This ensures images are preserved when the product is saved
        setCurrentVariants((prevCurrentVariants) => {
          const currentIndex = prevCurrentVariants.findIndex(
            (v) => v.id === updatedVariant.id
          );
          if (currentIndex >= 0) {
            // Update existing variant in currentVariants
            const newCurrentVariants = [...prevCurrentVariants];
            newCurrentVariants[currentIndex] = updatedVariant;
            return newCurrentVariants;
          } else {
            // Add to currentVariants if not found
            return [...prevCurrentVariants, updatedVariant];
          }
        });
      } else {
        // Add new variant - ensure it has a safe numeric ID
        const newVariant = {
          ...updatedVariant,
          id: updatedVariant.id || Math.floor(Math.random() * 1000000) + 1,
        };
        setVariants([...variants, newVariant]);
        // Also add to currentVariants
        setCurrentVariants((prev) => [...prev, newVariant]);
      }

      // Reset all state variables related to variant editing
      // Important: Do this in a specific order to avoid UI flickers
      // 1. First clear editing flags
      setIsEditingVariant(false);
      setNewVariantRow(false);

      // 2. Then reset data after a small delay to avoid race conditions
      setTimeout(() => {
        setCurrentVariant(null);
        setVariantImages([]);

        toast({
          title: "Success",
          description: "Product variant has been updated successfully",
        });
      }, 10);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save product variant. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Error boundary component to prevent the entire screen from going blank
  class ProductVariantErrorBoundary extends React.Component<
    {
      children: ReactNode;
      onError: (error: Error, errorInfo: ErrorInfo) => void;
    },
    { hasError: boolean }
  > {
    constructor(props: {
      children: ReactNode;
      onError: (error: Error, errorInfo: ErrorInfo) => void;
    }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(_: Error) {
      return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
      // Pass the error to the handler provided by props
      this.props.onError(error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="p-4 border border-red-300 bg-red-50 rounded-md">
            <h3 className="text-red-800 font-medium">
              Something went wrong in the variant editor
            </h3>
            <p className="text-red-600 mt-2">
              Please try reloading the page or contacting support if this
              persists.
            </p>
            <button
              className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
              onClick={() => this.setState({ hasError: false })}
            >
              Try again
            </button>
          </div>
        );
      }

      return this.props.children;
    }
  }

  // Edit variant handler - using dialog-based approach
  const handleEditVariant = (variant: ProductVariant) => {
    try {
      // Make a deep copy of the variant to avoid reference issues
      const variantCopy = JSON.parse(JSON.stringify(variant));

      // Process variant images to ensure they're in a consistent format
      if (variantCopy.images) {
        // If images is a string and looks like JSON, parse it
        if (
          typeof variantCopy.images === "string" &&
          variantCopy.images.trim().startsWith("[")
        ) {
          try {
            variantCopy.images = JSON.parse(variantCopy.images);
          } catch (parseError) {
            variantCopy.images = [];
          }
        }
        // If it's a string but not JSON, treat it as a single image URL
        else if (
          typeof variantCopy.images === "string" &&
          variantCopy.images.trim() !== ""
        ) {
          variantCopy.images = [variantCopy.images];
        }

        // Ensure images is always an array
        if (!Array.isArray(variantCopy.images)) {
          variantCopy.images = [];
        }
      } else {
        // Initialize as empty array if missing
        variantCopy.images = [];
      }

      // Set the selected variant and open the edit dialog
      setSelectedVariant(variantCopy);
      setEditVariantDialogOpen(true);
    } catch (error) {
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
    setDeleteVariantDialogOpen(true);
  };

  // Add new variant handler - Firefox safe implementation
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

    // If this is the first variant, update the UI to remind users that stock is now managed at variant level
    if (variants.length === 0 && draftVariants.length === 0) {
      toast({
        title: "Variant mode enabled",
        description:
          "Stock will now be managed at the variant level. The main product stock field has been hidden.",
      });
    }

    // Initialize a new variant with default values from the main product form
    // Use safe parsing for form values with fallbacks to prevent NaN issues
    const baseSkuValue = form.getValues("sku") || `SKU-${Date.now()}`;
    const variantNumber = variants.length + draftVariants.length + 1;

    // Generate a temporary negative ID to avoid conflicts with real database IDs
    const tempId = -Math.floor(Math.random() * 1000000);

    // Create variant with unique negative ID to prevent reference issues
    const newVariant = {
      id: tempId, // Use negative ID for new variants to avoid conflicts with database IDs
      sku: `${baseSkuValue}-V${variantNumber}`,
      color: "",
      size: "",
      price: parseInt(form.getValues("price") || "0") || 0,
      mrp: parseInt(form.getValues("mrp") || "0") || 0,
      stock: parseInt(form.getValues("stock") || "1") || 1,
      images: [],
    };

    // First set editing mode to prevent race conditions
    setIsEditingVariant(true);

    // Add the new variant with state updates
    setCurrentVariant(newVariant);
    setNewVariantRow(true);
    setVariantImages([]);
  };

  // Save the currently editing variant
  const handleSaveNewVariant = (updatedVariant: ProductVariant) => {
    // More robust validation for the current variant's required fields
    if (!updatedVariant.sku || updatedVariant.sku.trim() === "") {
      toast({
        title: "Missing required field: SKU",
        description: "Please enter a valid SKU for this variant",
        variant: "destructive",
      });
      return;
    }

    // Validate price (must be a positive number)
    if (
      updatedVariant.price === undefined ||
      updatedVariant.price === null ||
      isNaN(Number(updatedVariant.price)) ||
      Number(updatedVariant.price) <= 0
    ) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price greater than zero",
        variant: "destructive",
      });
      return;
    }

    // Validate stock (must be a non-negative number)
    if (
      updatedVariant.stock === undefined ||
      updatedVariant.stock === null ||
      isNaN(Number(updatedVariant.stock)) ||
      Number(updatedVariant.stock) < 0
    ) {
      toast({
        title: "Invalid stock quantity",
        description: "Please enter a valid stock quantity (zero or greater)",
        variant: "destructive",
      });
      return;
    }

    // Create variant with images and ensure numeric properties have correct type
    const variantWithImages = {
      ...updatedVariant,
      images: variantImages,
      // Clean up any dash characters and ensure fields have proper values
      color:
        updatedVariant.color === "—" || updatedVariant.color === "-"
          ? ""
          : updatedVariant.color,
      size:
        updatedVariant.size === "—" || updatedVariant.size === "-"
          ? ""
          : updatedVariant.size,
      // Ensure numeric properties have correct type and valid values
      price: Number(updatedVariant.price) || 0,
      mrp: Number(updatedVariant.mrp) || 0,
      stock: Number(updatedVariant.stock) || 0,
    };

    // Check if we're editing an existing variant
    if (
      currentVariant?.id &&
      (variants.some((v) => v.id === currentVariant.id) ||
        draftVariants.some((v) => v.id === currentVariant.id))
    ) {
      // Update existing variant
      if (variants.some((v) => v.id === currentVariant.id)) {
        // Update in regular variants array
        const updatedVariants = [...variants];
        const existingIndex = updatedVariants.findIndex(
          (v) => v.id === currentVariant.id
        );

        if (existingIndex !== -1) {
          updatedVariants[existingIndex] = variantWithImages;
          setVariants(updatedVariants);
        }
      } else {
        // Update in draft variants array
        const updatedDraftVariants = [...draftVariants];
        const existingIndex = updatedDraftVariants.findIndex(
          (v) => v.id === currentVariant.id
        );

        if (existingIndex !== -1) {
          updatedDraftVariants[existingIndex] = variantWithImages;
          setDraftVariants(updatedDraftVariants);
        }
      }
    } else {
      // Add as new variant to draftVariants array
      setDraftVariants([...draftVariants, variantWithImages]);
    }

    // Clean up the editing state to allow editing of any variant
    setIsEditingVariant(false);
    setCurrentVariant(null);
    setVariantImages([]);
    setNewVariantRow(false);

    // Show success toast
    toast({
      title: currentVariant?.id ? "Variant updated" : "Variant added",
      description: currentVariant?.id
        ? "Variant has been updated successfully"
        : "Variant has been added successfully",
    });
  };

  // Cancel variant editing
  const handleCancelVariantEdit = () => {
    // Only clear the current variant and images
    setCurrentVariant(null);
    setVariantImages([]);
    setNewVariantRow(false);
    setIsEditingVariant(false); // Also reset the editing flag
    // We're not touching draftVariants here - previously added draft variants remain
  };

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      // Save any pending variants to the server first
      if (draftVariants.length > 0) {
        try {
          // First prepare the variants for submission
          const variantsToSave = draftVariants.map((variant) => {
            // If ID is negative (temporary), remove it for the API
            const { id, ...rest } = variant;
            if (id && id < 0) {
              return {
                ...rest,
                productId: productId,
              };
            }
            return variant;
          });

          // Send variants to server to be saved
          const variantResponse = await fetch(
            `/api/products/${productId}/variants`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(variantsToSave),
            }
          );

          if (!variantResponse.ok) {
            // Handle error silently - will be caught in the catch block if needed
            const errorText = await variantResponse.text();
            throw new Error(errorText);
          } else {
            const savedVariants = await variantResponse.json();

            // Update the variants state with the saved variants
            const variantsArray = savedVariants.variants || savedVariants;
            setVariants(variantsArray);
            setDraftVariants([]);
          }
        } catch (error) {
          // Display error to user through toast notification
          toast({
            title: "Error saving variants",
            description:
              "There was a problem saving your product variants. Please try again.",
            variant: "destructive",
          });
        }
      }

      // First, we'd upload the images to storage (simulated here)
      let imageUrl = "https://placehold.co/600x400?text=Product+Image";

      if (uploadedImages.length > 0) {
        imageUrl = uploadedImages[0]; // Use the first image as the primary image
      }

      // Prepare the data for the API
      const gstRateValue =
        data.gstRate ||
        data.tax ||
        getSelectedCategoryGstRate().toString() ||
        "0";

      // Instead of fetching from server, use our current state which has the updated images
      // This ensures we don't lose the uploaded images stored in our current state

      const productData = {
        name: data.name,
        description: data.description,
        specifications: data.specifications,
        price: parseInt(data.price), // Convert to number
        mrp: parseInt(data.mrp),
        purchasePrice: data.purchasePrice
          ? parseFloat(data.purchasePrice)
          : undefined,
        gstRate: gstRateValue || "0", // Make sure to include GST rate as a string
        category: data.category,
        subcategory:
          data.subcategory === "none" ? null : data.subcategory || null, // Add subcategory, convert "none" to null
        subcategoryId: data.subcategoryId || null, // Add subcategoryId
        brand: data.brand,
        color: data.color,
        size: data.size,
        imageUrl: imageUrl,
        images: JSON.stringify(uploadedImages), // Add the images array as a JSON string
        // If variants exist, calculate total stock from variants
        // Only use currentVariants to avoid duplicate stock counting, as variants are already in currentVariants
        stock:
          currentVariants.length > 0
            ? currentVariants.reduce(
                (sum, variant) => sum + (Number(variant.stock) || 0),
                0
              )
            : parseInt(data.stock || "0"), // Otherwise use the main stock field with fallback
        weight: data.weight ? parseFloat(data.weight) : undefined,
        height: data.height ? parseFloat(data.height) : undefined,
        width: data.width ? parseFloat(data.width) : undefined,
        length: data.length ? parseFloat(data.length) : undefined,
        warranty: data.warranty ? parseInt(data.warranty) : undefined,
        tax: gstRateValue || "0", // Make sure tax and gstRate are synchronized
        hsn: data.hsn,
        productType: data.productType,
        returnPolicy:
          data.returnPolicy === "custom"
            ? data.customReturnPolicy || "0"
            : data.returnPolicy,
        // Add the __preserveVariants flag to ensure existing variants are preserved when category is changed
        __preserveVariants: true,
      };
      console.log("productData", productData.width);
      console.log("Full product data:", JSON.stringify(productData, null, 2));

      // Filter out any deleted variants before processing
      // This ensures we don't include variants that should be deleted
      const activeVariants = [...variants];
      const serverVariants = currentVariants
        ? currentVariants.filter((serverVariant: any) => {
            // Check if this server variant ID is in the deletedVariantIds list
            const isDeleted =
              typeof serverVariant.id === "number" &&
              deletedVariantIds.includes(serverVariant.id);

            // Only include if not deleted
            return !isDeleted;
          })
        : [];

      // Process variants to ensure proper format
      // IMPORTANT: Use currentVariants as the source of truth for variants
      // This ensures all image updates made in dialogs are preserved
      const allVariants = [...activeVariants, ...serverVariants];

      const processedVariants = allVariants.map((variant) => {
        // Priority order for variant data:
        // 1. currentVariants (from dialog image updates)
        // 2. activeVariants (from UI state)
        // 3. serverVariants (from API)

        // First, check if this variant exists in currentVariants
        let baseVariant = variant;
        let variantImages = [];

        // IMPORTANT: Always get the most up-to-date variant data from currentVariants if available
        if (variant.id && currentVariants && Array.isArray(currentVariants)) {
          const updatedVariant = currentVariants.find(
            (v) => v.id === variant.id
          );
          if (updatedVariant) {
            // Found variant in currentVariants, using as base
            baseVariant = updatedVariant;

            // If it has images, prioritize those
            if (
              Array.isArray(updatedVariant.images) &&
              updatedVariant.images.length > 0
            ) {
              variantImages = updatedVariant.images;
            }
          }
        }

        // If we didn't get images from currentVariants, process the variant's own images
        if (variantImages.length === 0) {
          // If images is already an array, use it
          if (Array.isArray(baseVariant.images)) {
            variantImages = baseVariant.images;
          }
          // If images is a string that looks like a JSON array
          else if (typeof baseVariant.images === "string") {
            try {
              // Check if it's a string representation of JSON array
              if (baseVariant.images.trim().startsWith("[")) {
                variantImages = JSON.parse(baseVariant.images);
                // Ensure it's an array after parsing
                if (!Array.isArray(variantImages)) {
                  variantImages = [];
                }
              } else {
                // It might be a single image URL
                variantImages = [baseVariant.images];
              }
            } catch (error) {
              variantImages = [];
            }
          } else {
            variantImages = [];
          }
        }

        // Validate all images in the array to ensure they're valid URLs
        variantImages = variantImages.filter((img: any) => {
          if (typeof img === "string" && img.trim() !== "") {
            return true;
          }
          // Skip invalid images silently
          return false;
        });

        // Create a properly formatted variant object with the most accurate data
        // Always use data from baseVariant (which will be the currentVariant if found)
        return {
          ...baseVariant,
          // Explicitly format all fields to ensure correct data types
          id: typeof baseVariant.id === "number" ? baseVariant.id : undefined,
          productId: Number(productId),
          sku: baseVariant.sku || "",
          color: baseVariant.color || "",
          size: baseVariant.size || "",
          // Ensure price and mrp are valid numbers
          price: Number(baseVariant.price) || 0,
          mrp: Number(baseVariant.mrp) || 0,
          stock: Number(baseVariant.stock) || 0,
          // Always pass images as a clean array (will be converted to JSON string on server)
          images: variantImages,
        };
      });

      // Send the data to the API with variants (combine regular and server variants)
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productData,
          variants: processedVariants,
          deletedVariantIds,
          __includeAllVariants: true, // Add this flag to tell server to include all variants in response
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle server error response
        throw new Error(errorData.error || "Failed to update product");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      // Check if a draft product was updated (now in pending status)
      const wasDraft = product?.isDraft || product?.is_draft;

      // Check if variants were returned in the response and update the state
      if (data.variants && Array.isArray(data.variants)) {
        // Process variants to ensure correct format
        const processedVariants = data.variants.map((variant: any) => {
          // Process images for each variant
          let variantImages = [];

          if (variant.images) {
            try {
              // If images is a string that contains JSON, parse it
              if (typeof variant.images === "string") {
                const parsedImages = JSON.parse(variant.images);
                variantImages = Array.isArray(parsedImages) ? parsedImages : [];
              }
              // If images is already an array, use it directly
              else if (Array.isArray(variant.images)) {
                variantImages = variant.images;
              }
            } catch (error) {
              console.error(
                `Failed to parse images for variant ${variant.id}:`,
                error
              );
            }
          }

          // Return properly formatted variant
          return {
            id: variant.id,
            productId: Number(productId),
            sku: variant.sku || "",
            color: variant.color || "",
            size: variant.size || "",
            price: Number(variant.price) || 0,
            mrp: Number(variant.mrp) || 0,
            stock: Number(variant.stock) || 0,
            images: variantImages,
          };
        });

        // Update the variants state with the data from the server
        setVariants(processedVariants);
        setDraftVariants([]); // Clear draft variants as they're now saved
      } else {
        // If no variants in response, explicitly fetch them to make sure they appear in the UI
        fetch(`/api/products/${productId}/variants`)
          .then((res) => res.json())
          .then((fetchedVariants) => {
            // Filter out any deleted variants that might still be returned from the server
            const filteredVariants = fetchedVariants.filter((variant: any) => {
              // Keep only variants whose IDs are not in the deletedVariantIds array
              return !deletedVariantIds.includes(variant.id);
            });

            // Process variants to ensure correct format
            const processedVariants = filteredVariants.map((variant: any) => {
              // Process images for each variant
              let variantImages = [];

              if (variant.images) {
                try {
                  // If images is a string that contains JSON, parse it
                  if (typeof variant.images === "string") {
                    const parsedImages = JSON.parse(variant.images);
                    variantImages = Array.isArray(parsedImages)
                      ? parsedImages
                      : [];
                  }
                  // If images is already an array, use it directly
                  else if (Array.isArray(variant.images)) {
                    variantImages = variant.images;
                  }
                } catch (error) {
                  // Failed to parse variant images, will use empty array
                }
              }

              // Return properly formatted variant
              return {
                id: variant.id,
                productId: Number(productId),
                sku: variant.sku || "",
                color: variant.color || "",
                size: variant.size || "",
                price: Number(variant.price) || 0,
                mrp: Number(variant.mrp) || 0,
                stock: Number(variant.stock) || 0,
                images: variantImages,
              };
            });

            // Update the variants state with the data from the server
            setVariants(processedVariants);
            setDraftVariants([]); // Clear draft variants as they're now saved
          })
          .catch((error) => {
            // Error fetching variants after product update, silently fail
          });
      }

      // Also force a refresh of the product to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId] });

      // Reset deleted variant IDs since they've been processed
      setDeletedVariantIds([]);

      toast({
        title: "Product updated successfully",
        description: wasDraft
          ? "Your draft product has been updated and submitted for approval."
          : "Your product has been updated and is pending review.",
      });

      // Redirect to products page after a brief delay using wouter
      setTimeout(() => {
        setLocation("/seller/products");
      }, 1500);

      // Invalidate the products query to refresh the products list
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });

      // Get the current user to include sellerId in the cache key
      const currentUser = queryClient.getQueryData<any>(["/api/user"]);

      // Invalidate seller-specific product queries
      queryClient.invalidateQueries({
        queryKey: ["/api/seller/products", currentUser?.id],
        exact: false,
      });

      // Invalidate specific product query to refresh its data
      queryClient.invalidateQueries({
        queryKey: ["/api/products", productId],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update product",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete product");
      }

      return true;
    },
    onSuccess: () => {
      toast({
        title: "Product deleted successfully",
        description: "Your product has been removed from the marketplace.",
      });

      // Redirect to products page after a brief delay using wouter
      setTimeout(() => {
        setLocation("/seller/products");
      }, 1500);

      // Invalidate the products query to refresh the products list
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });

      // Get the current user to include sellerId in the cache key
      const currentUser = queryClient.getQueryData<any>(["/api/user"]);

      // Invalidate seller-specific product queries
      queryClient.invalidateQueries({
        queryKey: ["/api/seller/products", currentUser?.id],
        exact: false,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete product",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    if (uploadedImages.length === 0) {
      toast({
        title: "Images required",
        description: "Please upload at least one product image.",
        variant: "destructive",
      });
      return;
    }

    // Check for variants with missing required fields
    if (variants.length > 0 || draftVariants.length > 0) {
      const allVariants = [...variants, ...draftVariants];
      const invalidVariant = allVariants.find((variant) => {
        // More robust variant validation
        if (!variant.sku || variant.sku.trim() === "") {
          return true;
        }

        // Check price (must be positive)
        const price = Number(variant.price);
        if (isNaN(price) || price <= 0) {
          return true;
        }

        // Check stock (must be non-negative)
        const stock = Number(variant.stock);
        if (isNaN(stock) || stock < 0) {
          return true;
        }

        return false;
      });

      if (invalidVariant) {
        toast({
          title: "Invalid variant details",
          description:
            "Please ensure all variants have a valid SKU, price (greater than zero), and stock quantity (zero or greater)",
          variant: "destructive",
        });
        return;
      }
    }

    // We only need to pass the form data to the mutation
    // The mutation will extract what it needs to match our database schema
    updateMutation.mutate(data);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
    setIsDeleteDialogOpen(false);
  };

  // Handler to add image by URL
  const isValidImageUrl = (url: string) => {
    // Basic check for image URL
    return (
      /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url) ||
      /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url)
    );
  };

  const handleAddImageUrl = () => {
    setAddUrlError("");
    const url = imageUrlInput.trim();
    if (!url) {
      setAddUrlError("Please enter an image URL.");
      return;
    }
    if (!isValidImageUrl(url)) {
      setAddUrlError("Please enter a valid image URL (JPG, PNG, GIF, WEBP).");
      return;
    }
    if (uploadedImages.includes(url)) {
      setAddUrlError("This image is already added.");
      return;
    }
    setUploadedImages([...uploadedImages, url]);
    setImageUrlInput("");
    toast({
      title: "Image added",
      description: "The image URL has been added.",
    });
  };

  if (isProductLoading) {
    return (
      <SellerDashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-2 text-xl">Loading product data...</p>
        </div>
      </SellerDashboardLayout>
    );
  }

  return (
    <SellerDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation("/seller/products")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Product</h1>
              <p className="text-muted-foreground">
                Update your product details
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              onClick={() => {
                // Get the current form values
                const values = form.getValues();

                // Directly call onSubmit function with form values
                // Form is being submitted
                onSubmit(values);
              }}
              disabled={updateMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {updateMutation.isPending ? "Updating..." : "Update Product"}
            </Button>
            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Product
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the product and remove it from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              variant="outline"
              onClick={() =>
                setLocation(`/seller/products/preview/${productId}`)
              }
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>

            {/* Single Update button is now at the top of the page */}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2/3 Width */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs
              defaultValue="basic"
              className="w-full"
              value={activeTab}
              onValueChange={(value) => {
                // Tab selection changed
                setActiveTab(value);

                // If switching to variants tab, fetch the variants directly from the server
                if (value === "variants") {
                  // Directly fetch variants from the server to ensure we have the latest data
                  fetch(`/api/products/${productId}/variants`)
                    .then((res) => res.json())
                    .then((fetchedVariants) => {
                      // Process the fetched variants

                      // Process variants to ensure correct format
                      const processedVariants = fetchedVariants.map(
                        (variant: any) => {
                          // Process images for each variant
                          let variantImages = [];

                          if (variant.images) {
                            try {
                              // If images is a string that contains JSON, parse it
                              if (typeof variant.images === "string") {
                                const parsedImages = JSON.parse(variant.images);
                                variantImages = Array.isArray(parsedImages)
                                  ? parsedImages
                                  : [];
                              }
                              // If images is already an array, use it directly
                              else if (Array.isArray(variant.images)) {
                                variantImages = variant.images;
                              }
                            } catch (error) {
                              console.error(
                                `Failed to parse images for variant ${variant.id}:`,
                                error
                              );
                            }
                          }

                          // Return properly formatted variant
                          return {
                            id: variant.id,
                            productId: Number(productId),
                            sku: variant.sku || "",
                            color: variant.color || "",
                            size: variant.size || "",
                            price: Number(variant.price) || 0,
                            mrp: Number(variant.mrp) || 0,
                            stock: Number(variant.stock) || 0,
                            images: variantImages,
                            createdAt: variant.createdAt,
                          };
                        }
                      );

                      // Update the variants state with the freshly fetched data
                      if (processedVariants.length > 0) {
                        setVariants(processedVariants);
                      }
                    })
                    .catch((error) => {
                      // Handle errors when variants cannot be fetched
                    });
                }
              }}
            >
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic Details</TabsTrigger>
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="variants">Variants</TabsTrigger>
              </TabsList>

              {/* Basic Details Tab */}
              <TabsContent value="basic" className="space-y-4 mt-6">
                <Form {...form}>
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Product Information</CardTitle>
                        <CardDescription>
                          Basic details about your product
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Product Name{" "}
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Samsung Galaxy S22 Ultra (Phantom Black, 256 GB)"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Include key features, color, and model in the
                                title
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="sku"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  SKU <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g. SM-S22U-BLK-256"
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
                            name="brand"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Brand <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g. Samsung"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Brand or manufacturer name
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => {
                              // Initialize with empty array and update when field.value changes
                              const [colorTags, setColorTags] = useState<
                                string[]
                              >([]);

                              // Update colorTags when field.value changes (including initial load)
                              useEffect(() => {
                                if (field.value) {
                                  // Process color field value changes
                                  setColorTags(
                                    field.value.split(/,\s*/).filter(Boolean)
                                  );
                                }
                              }, [field.value]);

                              const handleColorKeyDown = (
                                e: React.KeyboardEvent<HTMLInputElement>
                              ) => {
                                // Add tag on Enter or comma
                                if (e.key === "Enter" || e.key === ",") {
                                  e.preventDefault();
                                  const inputValue = (
                                    e.target as HTMLInputElement
                                  ).value.trim();

                                  if (inputValue) {
                                    // Check if input contains multiple colors (comma-separated)
                                    const colorValues = inputValue
                                      .split(",")
                                      .map((c) => c.trim())
                                      .filter(Boolean);

                                    if (colorValues.length > 0) {
                                      // Add multiple colors at once
                                      const newTags = [...colorTags];
                                      colorValues.forEach((color) => {
                                        if (!newTags.includes(color)) {
                                          newTags.push(color);
                                        }
                                      });
                                      setColorTags(newTags);
                                      field.onChange(newTags.join(", "));
                                    }

                                    (e.target as HTMLInputElement).value = "";
                                  }
                                }
                              };

                              const handleColorBlur = (
                                e: React.FocusEvent<HTMLInputElement>
                              ) => {
                                const inputValue = e.target.value.trim();
                                if (inputValue) {
                                  // Check if input contains multiple colors (comma-separated)
                                  const colorValues = inputValue
                                    .split(",")
                                    .map((c) => c.trim())
                                    .filter(Boolean);

                                  if (colorValues.length > 0) {
                                    // Add multiple colors at once
                                    const newTags = [...colorTags];
                                    colorValues.forEach((color) => {
                                      if (!newTags.includes(color)) {
                                        newTags.push(color);
                                      }
                                    });
                                    setColorTags(newTags);
                                    field.onChange(newTags.join(", "));
                                  }

                                  e.target.value = "";
                                }
                              };

                              const removeColorTag = (index: number) => {
                                const newTags = [...colorTags];
                                newTags.splice(index, 1);
                                setColorTags(newTags);
                                field.onChange(newTags.join(", "));
                              };

                              return (
                                <FormItem>
                                  <FormLabel>Color</FormLabel>
                                  <div className="space-y-2">
                                    <FormControl>
                                      <Input
                                        placeholder="Add color (press Enter or comma after each)"
                                        onKeyDown={handleColorKeyDown}
                                        onBlur={handleColorBlur}
                                      />
                                    </FormControl>
                                    {colorTags.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {colorTags.map((tag, i) => (
                                          <Badge
                                            key={i}
                                            className="px-3 py-1 flex items-center gap-1"
                                          >
                                            {tag}
                                            <span
                                              className="cursor-pointer hover:text-destructive"
                                              onClick={() => removeColorTag(i)}
                                            >
                                              ×
                                            </span>
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <FormDescription>
                                    Main color or color variants
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
                              // Initialize with empty array and update when field.value changes
                              const [sizeTags, setSizeTags] = useState<
                                string[]
                              >([]);

                              // Update sizeTags when field.value changes (including initial load)
                              useEffect(() => {
                                if (field.value) {
                                  // Process size field value changes
                                  setSizeTags(
                                    field.value.split(/,\s*/).filter(Boolean)
                                  );
                                }
                              }, [field.value]);

                              const handleSizeKeyDown = (
                                e: React.KeyboardEvent<HTMLInputElement>
                              ) => {
                                // Add tag on Enter or comma
                                if (e.key === "Enter" || e.key === ",") {
                                  e.preventDefault();
                                  const inputValue = (
                                    e.target as HTMLInputElement
                                  ).value.trim();

                                  if (inputValue) {
                                    // Check if input contains multiple sizes (comma-separated)
                                    const sizeValues = inputValue
                                      .split(",")
                                      .map((s) => s.trim())
                                      .filter(Boolean);

                                    if (sizeValues.length > 0) {
                                      // Add multiple sizes at once
                                      const newTags = [...sizeTags];
                                      sizeValues.forEach((size) => {
                                        if (!newTags.includes(size)) {
                                          newTags.push(size);
                                        }
                                      });
                                      setSizeTags(newTags);
                                      field.onChange(newTags.join(", "));
                                    }

                                    (e.target as HTMLInputElement).value = "";
                                  }
                                }
                              };

                              const handleSizeBlur = (
                                e: React.FocusEvent<HTMLInputElement>
                              ) => {
                                const inputValue = e.target.value.trim();
                                if (inputValue) {
                                  // Check if input contains multiple sizes (comma-separated)
                                  const sizeValues = inputValue
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean);

                                  if (sizeValues.length > 0) {
                                    // Add multiple sizes at once
                                    const newTags = [...sizeTags];
                                    sizeValues.forEach((size) => {
                                      if (!newTags.includes(size)) {
                                        newTags.push(size);
                                      }
                                    });
                                    setSizeTags(newTags);
                                    field.onChange(newTags.join(", "));
                                  }

                                  e.target.value = "";
                                }
                              };

                              const removeSizeTag = (index: number) => {
                                const newTags = [...sizeTags];
                                newTags.splice(index, 1);
                                setSizeTags(newTags);
                                field.onChange(newTags.join(", "));
                              };

                              return (
                                <FormItem>
                                  <FormLabel>Size</FormLabel>
                                  <div className="space-y-2">
                                    <FormControl>
                                      <Input
                                        placeholder="Add size (press Enter or comma after each)"
                                        onKeyDown={handleSizeKeyDown}
                                        onBlur={handleSizeBlur}
                                      />
                                    </FormControl>
                                    {sizeTags.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {sizeTags.map((tag, i) => (
                                          <Badge
                                            key={i}
                                            className="px-3 py-1 flex items-center gap-1"
                                          >
                                            {tag}
                                            <span
                                              className="cursor-pointer hover:text-destructive"
                                              onClick={() => removeSizeTag(i)}
                                            >
                                              ×
                                            </span>
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <FormDescription>
                                    Size, dimensions, or variants
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 999"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Your selling price (including GST)
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
                                <FormLabel>
                                  MRP (Including GST){" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 1299"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Maximum retail price including GST (must be ≥
                                  selling price)
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
                                <FormLabel>
                                  Purchase Price (Including GST)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 699"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Your purchase/cost price including GST (for
                                  profit calculations)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* GST Rate Field Component */}
                        <GstRateField
                          form={form}
                          getSelectedCategoryGstRate={
                            getSelectedCategoryGstRate
                          }
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Category{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    // Clear subcategory when category changes
                                    form.setValue("subcategory", "");
                                    form.setValue("subcategoryId", null);
                                  }}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {categories.map((category: any) => (
                                      <SelectItem
                                        key={category.id}
                                        value={category.name}
                                      >
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Choose the most appropriate category
                                </FormDescription>
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
                                          const subcategory =
                                            subcategories?.find(
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
                                        <SelectItem value="none">
                                          None
                                        </SelectItem>
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

                          <FormField
                            control={form.control}
                            name="tax"
                            render={({ field }) => {
                              // Use the gstRate from the product if available
                              React.useEffect(() => {
                                if (product?.gstRate) {
                                  const gstValue = product.gstRate.toString();
                                  // Update the tax field with the GST rate from the product
                                  field.onChange(gstValue);
                                }
                              }, [product?.gstRate]);

                              return (
                                <FormItem>
                                  <FormLabel>
                                    Tax Rate{" "}
                                    <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <Select
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      // Also update the gstRate field to keep them in sync
                                      form.setValue("gstRate", value);
                                    }}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select tax rate" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="0">0% GST</SelectItem>
                                      <SelectItem value="5">5% GST</SelectItem>
                                      <SelectItem value="12">
                                        12% GST
                                      </SelectItem>
                                      <SelectItem value="18">
                                        18% GST
                                      </SelectItem>
                                      <SelectItem value="28">
                                        28% GST
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Select applicable tax rate (synchronized
                                    with custom GST rate)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </Form>
              </TabsContent>

              {/* Description Tab */}
              <TabsContent value="description" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Description</CardTitle>
                    <CardDescription>
                      Provide detailed information about your product
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Description{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <RichTextEditor
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Describe your product in detail. Include features, benefits, materials, and any other relevant information."
                                minHeight={300}
                              />
                            </FormControl>
                            <FormDescription>
                              Minimum 20 characters. Use formatting tools to
                              highlight key features, add headings, and make
                              your description more attractive.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="h-6"></div>

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
                                minHeight={200}
                              />
                            </FormControl>
                            <FormDescription>
                              Add detailed technical specifications in
                              structured format. Good for SEO and helps
                              customers make informed decisions.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Images</CardTitle>
                    <CardDescription>
                      Upload high-quality images of your product (min 1, max 8)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {uploadedImages.length > 0 && (
                      <div>
                        <h3 className="text-md font-medium mb-3">
                          Current Product Images
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {uploadedImages.map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={image}
                                alt={`Product image ${index + 1}`}
                                className="w-full h-32 object-cover rounded-md border"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleRemoveImage(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              {index === 0 && (
                                <Badge
                                  variant="secondary"
                                  className="absolute top-2 left-2"
                                >
                                  Primary
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-4">
                      <div className="border rounded-md p-4">
                        <h3 className="text-md font-medium mb-3">
                          Select from Media Library
                        </h3>
                        <MultiMediaPicker
                          onSelect={(urls) => {
                            const combinedImages = [...uploadedImages];
                            for (const url of urls) {
                              if (!combinedImages.includes(url)) {
                                combinedImages.push(url);
                              }
                            }
                            setUploadedImages(combinedImages);
                          }}
                          selectedUrls={uploadedImages}
                          buttonLabel="Browse Media Library"
                          maxImages={999}
                        />
                      </div>
                    </div>

                    {/* Row for upload and add URL */}
                    <div className="flex flex-col md:flex-row gap-6 items-stretch w-full mt-6">
                      {/* Upload New Images - compact style */}
                      <div className="flex-1 min-w-0 max-w-md flex items-center justify-center">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 w-full flex flex-col items-center justify-center text-center bg-white">
                          <Label
                            htmlFor="upload-image"
                            className="cursor-pointer w-full"
                          >
                            <div className="flex flex-col items-center justify-center space-y-1">
                              <ImagePlus className="h-8 w-8 text-gray-400" />
                              <h3 className="text-base font-medium">
                                Or Upload New Images
                              </h3>
                              <p className="text-xs text-gray-500">
                                Drag and drop or click to upload (max 5MB each)
                              </p>
                              <Button
                                type="button"
                                variant="secondary"
                                className="mt-1 px-3 py-1 text-sm"
                                disabled={isUploading}
                              >
                                {isUploading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Select Files
                                  </>
                                )}
                              </Button>
                              {isUploading && (
                                <div className="w-full mt-1">
                                  <Progress
                                    value={uploadProgress}
                                    className="h-2 w-full"
                                  />
                                  <p className="text-xs text-right mt-1">
                                    {uploadProgress}%
                                  </p>
                                </div>
                              )}
                            </div>
                            <Input
                              id="upload-image"
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handleImageUpload}
                              disabled={isUploading}
                            />
                          </Label>
                        </div>
                      </div>
                      {/* Add Image URL */}
                      <div className="flex-1 min-w-0 max-w-md border rounded-md p-4 bg-muted/30 flex flex-col justify-center">
                        <h3 className="text-md font-medium mb-2">
                          Add Image URL
                        </h3>
                        <div className="flex flex-row gap-2 mb-2">
                          <Input
                            type="url"
                            placeholder="https://example.com/product-image.jpg"
                            value={imageUrlInput}
                            onChange={(e) => setImageUrlInput(e.target.value)}
                            className="flex-1"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddImageUrl();
                            }}
                            aria-label="Image URL"
                          />
                          <Button
                            type="button"
                            onClick={handleAddImageUrl}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            Add URL
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          Enter a direct link to an image (JPG, PNG, GIF, WEBP)
                        </div>
                        {addUrlError && (
                          <div className="text-xs text-red-500 mb-2">
                            {addUrlError}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Media Library below row */}

                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-4">
                      <div className="flex">
                        <Info className="h-5 w-5 text-yellow-500 mr-2" />
                        <div>
                          <h4 className="text-sm font-medium text-yellow-800">
                            Image Guidelines
                          </h4>
                          <ul className="text-xs text-yellow-700 mt-1 ml-4 list-disc">
                            <li>Minimum 1 image is required</li>
                            <li>Images should be on white background</li>
                            <li>Each image should be less than 5MB</li>
                            <li>Recommended size: 2000 x 2000 pixels</li>
                            <li>Supported formats: JPG, PNG, WEBP</li>
                            <li>
                              First image will be displayed as the primary image
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Inventory Tab */}
              <TabsContent value="inventory" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory & Shipping</CardTitle>
                    <CardDescription>
                      Manage stock and shipping details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Form {...form}>
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="stock"
                          render={({ field }) => (
                            <FormItem
                              className={
                                variants.length > 0 || draftVariants.length > 0
                                  ? "hidden"
                                  : ""
                              }
                            >
                              <FormLabel>
                                Stock Quantity{" "}
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="e.g. 100"
                                  {...field}
                                  disabled={
                                    variants.length > 0 ||
                                    draftVariants.length > 0
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                {variants.length > 0 || draftVariants.length > 0
                                  ? "Stock is managed at the variant level when variants are enabled."
                                  : ""}
                                Current available quantity
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="weight"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Weight (g)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 250"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Product weight in grams
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="hsn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>HSN Code</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g. 85171290"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Harmonized System of Nomenclature code
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                    placeholder="e.g. 15"
                                    {...field}
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
                                    placeholder="e.g. 10"
                                    {...field}
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
                                    placeholder="e.g. 5"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="returnPolicy"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Return Policy{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    // If custom is selected, focus the custom input field
                                    if (value === "custom") {
                                      setTimeout(() => {
                                        const customField =
                                          document.getElementById(
                                            "custom-return-policy"
                                          );
                                        if (customField) customField.focus();
                                      }, 0);
                                    }
                                  }}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select return policy" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="0">
                                      No Returns
                                    </SelectItem>
                                    <SelectItem value="7">7 Days</SelectItem>
                                    <SelectItem value="10">10 Days</SelectItem>
                                    <SelectItem value="15">15 Days</SelectItem>
                                    <SelectItem value="30">30 Days</SelectItem>
                                    <SelectItem value="custom">
                                      Custom
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Select return period
                                </FormDescription>
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
                                  <FormLabel>
                                    Custom Return Days{" "}
                                    <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      id="custom-return-policy"
                                      placeholder="Enter number of days"
                                      type="number"
                                      min="1"
                                      max="365"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Enter the number of days for your custom
                                    return policy
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          <FormField
                            control={form.control}
                            name="warranty"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Warranty Period</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g. 12 (warranty in months)"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Enter warranty period in months (e.g. 12 for 1
                                  year)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="productType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Product Type{" "}
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-col space-y-1"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="physical" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Physical Product
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="digital" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Digital Product
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="service" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Service
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Variants Tab */}
              <TabsContent value="variants" className="space-y-4 mt-6">
                <ProductVariantErrorBoundary
                  onError={(error, errorInfo) => {
                    console.error(
                      "Variant section error caught:",
                      error,
                      errorInfo
                    );
                    toast({
                      title: "Error in variant editor",
                      description:
                        "An error occurred while editing variants. Technical details have been logged.",
                      variant: "destructive",
                    });
                  }}
                >
                  {/* Display Existing Variants in Table if they exist */}
                  {variants.length > 0 && (
                    <Card className="mb-6">
                      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div>
                          <CardTitle>Existing Product Variants</CardTitle>
                          <CardDescription>
                            The following variants have been saved for this
                            product
                          </CardDescription>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Are you sure you want to delete all ${variants.length} variants? This action cannot be undone.`
                              )
                            ) {
                              // Add all variant IDs to the deleted list
                              const variantIds = variants
                                .filter(
                                  (v) => typeof v.id === "number" && v.id > 0
                                )
                                .map((v) => v.id as number);

                              setDeletedVariantIds((prev) => [
                                ...prev,
                                ...variantIds,
                              ]);

                              // Clear variants from state
                              setVariants([]);
                              setDraftVariants([]);

                              // Attempt to delete each variant from the server immediately
                              const deleteVariants = async () => {
                                console.log(
                                  `Attempting to delete ${variantIds.length} variants`
                                );

                                for (const id of variantIds) {
                                  try {
                                    const deleteResponse = await fetch(
                                      `/api/products/${productId}/variants/${id}`,
                                      {
                                        method: "DELETE",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                      }
                                    );

                                    // Deletion process completed with status: deleteResponse.ok
                                  } catch (error) {
                                    // Handle deletion error silently - will still be removed from UI
                                  }
                                }

                                // Refresh variants from server to ensure our state is in sync
                                try {
                                  const response = await fetch(
                                    `/api/products/${productId}/variants`
                                  );
                                  if (response.ok) {
                                    const data = await response.json();
                                    // Check if there are any variants left (there shouldn't be)
                                    // Verification complete - data length should be 0 after deletion
                                  }
                                } catch (error) {
                                  // Silent error handling for verification step
                                }
                              };

                              deleteVariants();

                              toast({
                                title: "All variants deleted",
                                description: `${variants.length} variants have been deleted.`,
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete All Variants
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {/* Existing Variants Table */}
                        <div className="overflow-x-auto rounded-md border">
                          <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted text-sm">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-left font-medium text-muted-foreground"
                                >
                                  Variant
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-left font-medium text-muted-foreground"
                                >
                                  SKU
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-left font-medium text-muted-foreground"
                                >
                                  Price
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-left font-medium text-muted-foreground"
                                >
                                  MRP
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-left font-medium text-muted-foreground"
                                >
                                  Stock
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-left font-medium text-muted-foreground"
                                >
                                  Images
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-left font-medium text-muted-foreground"
                                >
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {variants.map((variant, index) => (
                                <tr
                                  key={variant.id || index}
                                  className={
                                    index % 2 === 0
                                      ? "bg-background"
                                      : "bg-muted/50"
                                  }
                                >
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex flex-col">
                                      {variant.color && (
                                        <span className="text-sm">
                                          <strong>Color:</strong>{" "}
                                          {variant.color}
                                        </span>
                                      )}
                                      {variant.size && (
                                        <span className="text-sm">
                                          <strong>Size:</strong> {variant.size}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {variant.sku}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {variant.price}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {variant.mrp}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {variant.stock}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                      {(() => {
                                        // CRITICAL FIX: Look for images in currentVariants first (most up-to-date)
                                        // This ensures we display the most recent images after editing variants
                                        let displayImages = variant.images;

                                        // If the variant exists in currentVariants, use those images instead
                                        if (
                                          currentVariants &&
                                          Array.isArray(currentVariants)
                                        ) {
                                          const currentVariant =
                                            currentVariants.find(
                                              (v) => v.id === variant.id
                                            );

                                          // Log available image sources for debugging
                                          console.log(
                                            `Variant ${variant.id} images:`,
                                            {
                                              regularVariant: Array.isArray(
                                                variant.images
                                              )
                                                ? variant.images.length
                                                : "not an array",
                                              currentVariant:
                                                currentVariant &&
                                                Array.isArray(
                                                  currentVariant.images
                                                )
                                                  ? currentVariant.images.length
                                                  : "not found or not an array",
                                            }
                                          );

                                          if (
                                            currentVariant &&
                                            Array.isArray(
                                              currentVariant.images
                                            ) &&
                                            currentVariant.images.length > 0
                                          ) {
                                            console.log(
                                              `Using updated images from currentVariants for variant ${variant.id}`
                                            );
                                            displayImages =
                                              currentVariant.images;
                                          }
                                        }

                                        // If images exist, display them
                                        if (
                                          displayImages &&
                                          Array.isArray(displayImages) &&
                                          displayImages.length > 0
                                        ) {
                                          return (
                                            <div className="flex flex-row gap-1">
                                              {displayImages.map(
                                                (img, imgIndex) => (
                                                  <img
                                                    key={imgIndex}
                                                    src={img}
                                                    alt={`Variant ${index} image ${imgIndex}`}
                                                    className="h-8 w-8 rounded object-cover"
                                                  />
                                                )
                                              )}
                                            </div>
                                          );
                                        }

                                        // Otherwise show no images message
                                        return (
                                          <span className="text-xs text-muted-foreground italic">
                                            No images
                                          </span>
                                        );
                                      })()}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-2 text-xs"
                                        onClick={() => {
                                          // Set the selected variant and open the edit dialog
                                          console.log(
                                            "Edit button clicked for variant:",
                                            variant
                                          );
                                          setSelectedVariant(variant);
                                          setEditVariantDialogOpen(true);
                                        }}
                                      >
                                        <Edit className="h-3.5 w-3.5 mr-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                          // Set the selected variant and open the delete dialog
                                          console.log(
                                            "Delete button clicked for variant:",
                                            variant
                                          );
                                          setSelectedVariant(variant);
                                          setDeleteVariantDialogOpen(true);
                                        }}
                                      >
                                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                                        Delete
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Matrix Variant Generator Card */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Create Additional Variants</CardTitle>
                      <CardDescription>
                        Define color and size options to automatically generate
                        additional variant combinations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <VariantMatrixGenerator
                        onSaveVariants={(generatedVariants) => {
                          // Add to existing draft variants (not replace)
                          const newDraftVariants = generatedVariants.map(
                            (variant) => {
                              // Process each variant from the matrix generator

                              return {
                                ...variant,
                                id:
                                  variant.id ||
                                  -(
                                    Date.now() +
                                    Math.floor(Math.random() * 1000)
                                  ), // Generate temporary ID
                                productId: product?.id,
                                // Ensure these fields are explicitly set
                                sku:
                                  variant.sku ||
                                  `${form.getValues("name").substring(0, 5)}-${
                                    variant.color
                                  }-${variant.size}`.replace(/\s+/g, ""),
                                color: variant.color || "",
                                size: variant.size || "",
                                price: Number(variant.price) || 0,
                                mrp: Number(variant.mrp) || 0,
                                stock: Number(variant.stock) || 0,
                                images:
                                  variant.images &&
                                  Array.isArray(variant.images)
                                    ? variant.images
                                    : [],
                              };
                            }
                          );

                          // Keep existing variants and add new ones to drafts
                          setDraftVariants((prevDrafts) => [
                            ...prevDrafts,
                            ...newDraftVariants,
                          ]);

                          toast({
                            title: "Variants Generated",
                            description: `${generatedVariants.length} variants have been generated. Save the product to make them permanent.`,
                          });
                        }}
                        existingVariants={variants}
                        productName={form.getValues("name")}
                      />
                    </CardContent>
                  </Card>

                  {/* Generated Variants Display */}
                  {draftVariants.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle>Configure Variants</CardTitle>
                        <CardDescription>
                          {draftVariants.length} variants generated. Configure
                          details and enable/disable as needed.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Use</TableHead>
                              <TableHead>Color</TableHead>
                              <TableHead>Size</TableHead>
                              <TableHead>SKU</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>MRP</TableHead>
                              <TableHead>Stock</TableHead>
                              <TableHead>Images</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {draftVariants.map((variant) => (
                              <TableRow key={variant.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={true}
                                    onCheckedChange={(checked) => {
                                      // Update the variant's enabled status
                                      setDraftVariants((prev) =>
                                        prev.map((v) =>
                                          v.id === variant.id
                                            ? {
                                                ...v,
                                                enabled: checked === true,
                                              }
                                            : v
                                        )
                                      );
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{variant.color}</TableCell>
                                <TableCell>{variant.size}</TableCell>
                                <TableCell>{variant.sku}</TableCell>
                                <TableCell>{variant.price}</TableCell>
                                <TableCell>{variant.mrp}</TableCell>
                                <TableCell>{variant.stock}</TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline">
                                      {variant.images.length}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setCurrentVariant(variant);
                                        setIsEditingVariant(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-1" /> Edit
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                      <CardFooter className="flex justify-end">
                        <Button
                          className="w-full sm:w-auto"
                          onClick={async () => {
                            try {
                              setIsUploading(true);

                              // First, save the draft variants to the actual variants state
                              setVariants(draftVariants);

                              // Prepare the variants for submission by removing any temporary IDs
                              const variantsToSave = draftVariants.map(
                                (variant) => {
                                  // If ID is negative (temporary), remove it for the API
                                  const { id, ...rest } = variant;
                                  if (id && id < 0) {
                                    return {
                                      ...rest,
                                      productId: productId,
                                    };
                                  }
                                  return variant;
                                }
                              );

                              // Prepare variants for database save

                              // Send variants to server to be saved
                              const response = await fetch(
                                `/api/products/${productId}/variants`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify(variantsToSave),
                                }
                              );

                              if (!response.ok) {
                                throw new Error(
                                  `Failed to save variants: ${response.statusText}`
                                );
                              }

                              const savedVariants = await response.json();
                              // Update the variants state with the saved variants (including server-generated IDs)
                              // Check if the response has a nested variants property (our API returns this structure)
                              const variantsArray =
                                savedVariants.variants || savedVariants;

                              // Set both variant states
                              setVariants(variantsArray);
                              setDraftVariants(variantsArray);

                              // Show success message
                              toast({
                                title: "Variants Saved",
                                description: `${variantsArray.length} variants have been saved to the database.`,
                                variant: "default",
                              });

                              // Refresh product data to get updated variants
                              queryClient.invalidateQueries({
                                queryKey: ["/api/products", productId],
                              });
                            } catch (error) {
                              console.error("Error saving variants:", error);
                              toast({
                                title: "Error Saving Variants",
                                description:
                                  error instanceof Error
                                    ? error.message
                                    : "An unknown error occurred",
                                variant: "destructive",
                              });
                            } finally {
                              setIsUploading(false);
                            }
                          }}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Variants
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  )}
                </ProductVariantErrorBoundary>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - 1/3 Width */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Approval Status:</span>
                  <Badge
                    variant={product?.approved ? "default" : "secondary"}
                    className={
                      product?.approved ? "bg-green-100 text-green-800" : ""
                    }
                  >
                    {product?.approved ? "Approved" : "Pending Approval"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Listing Status:</span>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 hover:bg-green-100"
                  >
                    Active
                  </Badge>
                </div>

                <Separator />

                <div className="pt-2">
                  <h4 className="text-sm font-medium mb-3">Checklist</h4>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                      <span className="text-sm">
                        Basic information provided
                      </span>
                    </div>
                    <div className="flex items-start">
                      {uploadedImages.length > 0 ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2" />
                      )}
                      <span className="text-sm">Product images uploaded</span>
                    </div>
                    <div className="flex items-start">
                      {form.getValues().description.length >= 20 ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2" />
                      )}
                      <span className="text-sm">
                        Detailed description added
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Help & Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-sm">
                      <div className="flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Product Image Tips
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Use high-resolution images on white background</li>
                        <li>Show product from multiple angles</li>
                        <li>Include size reference when applicable</li>
                        <li>Avoid text overlays on images</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-sm">
                      <div className="flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Description Writing Guide
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Start with a compelling product summary</li>
                        <li>List all key features and specifications</li>
                        <li>
                          Include dimensions, materials, and care instructions
                        </li>
                        <li>Mention warranty information if applicable</li>
                        <li>Use bullet points for easy scanning</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-sm">
                      <div className="flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Pricing Strategy
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Research competitor pricing</li>
                        <li>Consider offering promotional discounts</li>
                        <li>Set MRP slightly higher than your selling price</li>
                        <li>
                          Factor in all costs including shipping and taxes
                        </li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex">
                    <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">
                        Need Help?
                      </h4>
                      <p className="text-xs text-blue-700 mt-1">
                        Contact our seller support team at{" "}
                        <span className="font-medium">
                          seller-support@example.com
                        </span>{" "}
                        for assistance with your product listings.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Variant Dialog */}
      <Dialog
        open={editVariantDialogOpen}
        onOpenChange={setEditVariantDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
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
                    value={selectedVariant.color || ""}
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
                    value={selectedVariant.size || ""}
                    onChange={(e) => {
                      setSelectedVariant({
                        ...selectedVariant,
                        size: e.target.value,
                      });
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-variant-price">Price</Label>
                  <Input
                    id="edit-variant-price"
                    type="number"
                    value={selectedVariant.price || 0}
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
                    value={selectedVariant.mrp || 0}
                    onChange={(e) => {
                      setSelectedVariant({
                        ...selectedVariant,
                        mrp: Number(e.target.value),
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-variant-stock">Stock</Label>
                  <Input
                    id="edit-variant-stock"
                    type="number"
                    value={selectedVariant.stock || 0}
                    onChange={(e) => {
                      setSelectedVariant({
                        ...selectedVariant,
                        stock: Number(e.target.value),
                      });
                    }}
                  />
                </div>
              </div>

              {/* Variant Image Upload Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-medium">
                    Variant Images
                  </Label>
                  <div className="flex space-x-2">
                    <label
                      htmlFor="variant-file-upload"
                      className="cursor-pointer"
                    >
                      <div className="inline-flex items-center justify-center h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground shadow transition-colors hover:bg-primary/90">
                        <UploadCloud className="h-4 w-4 mr-1.5" />
                        Upload Image
                      </div>
                      <input
                        id="variant-file-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const files = Array.from(e.target.files);

                            // Show upload indicator
                            setIsUploading(true);
                            setUploadProgress(0);

                            try {
                              const totalFiles = files.length;
                              let completedFiles = 0;
                              let successfulUploads = [];

                              // Use the multiple upload endpoint if more than one file
                              if (files.length > 1) {
                                // Create a FormData object for multiple files
                                const formData = new FormData();
                                files.forEach((file) => {
                                  // Use 'file' as the field name instead of 'files'
                                  // This matches what the server expects
                                  formData.append("file", file);
                                });

                                console.log(
                                  `Uploading ${files.length} variant images at once`
                                );

                                // Send the files to the server using the multiple upload endpoint
                                const response = await fetch(
                                  "/api/upload-multiple",
                                  {
                                    method: "POST",
                                    body: formData,
                                    credentials: "include",
                                  }
                                );

                                if (!response.ok) {
                                  const errorText = await response.text();
                                  console.error(
                                    `Multiple upload failed with status ${response.status}: ${errorText}`
                                  );
                                  throw new Error(
                                    `Upload failed: ${
                                      errorText || response.statusText
                                    }`
                                  );
                                }

                                const result = await response.json();

                                // Handle different response formats from the server
                                if (result) {
                                  if (
                                    result.urls &&
                                    Array.isArray(result.urls)
                                  ) {
                                    successfulUploads = result.urls;
                                  } else if (result.url) {
                                    // Single image response
                                    successfulUploads = [result.url];
                                  } else if (Array.isArray(result)) {
                                    // Array of urls directly
                                    successfulUploads = result;
                                  }

                                  console.log(
                                    "Multiple upload response:",
                                    result
                                  );
                                  console.log(
                                    "Processed successful uploads:",
                                    successfulUploads
                                  );
                                }
                              } else {
                                // Process files one by one for single file upload
                                for (const file of files) {
                                  // Create a FormData object
                                  const formData = new FormData();
                                  formData.append("file", file);

                                  console.log(
                                    `Uploading variant image (${
                                      completedFiles + 1
                                    }/${totalFiles}):`,
                                    file.name
                                  );

                                  // Send the file to the server
                                  const response = await fetch("/api/upload", {
                                    method: "POST",
                                    body: formData,
                                    credentials: "include",
                                  });

                                  if (!response.ok) {
                                    const errorText = await response.text();
                                    console.error(
                                      `Upload failed with status ${response.status}: ${errorText}`
                                    );
                                    // Continue with other files instead of throwing
                                    toast({
                                      title: `Failed to upload ${file.name}`,
                                      description:
                                        errorText || response.statusText,
                                      variant: "destructive",
                                    });
                                  } else {
                                    const result = await response.json();
                                    if (result && result.url) {
                                      successfulUploads.push(result.url);
                                    }
                                  }

                                  // Update progress
                                  completedFiles++;
                                  setUploadProgress(
                                    Math.round(
                                      (completedFiles / totalFiles) * 100
                                    )
                                  );
                                }
                              }

                              // Now add all successfully uploaded images to the variant
                              if (successfulUploads.length > 0) {
                                // Make sure we're working with a proper array of images
                                let currentImages = [];

                                // Process the current images to ensure it's an array
                                if (selectedVariant.images) {
                                  if (Array.isArray(selectedVariant.images)) {
                                    currentImages = [...selectedVariant.images];
                                  } else if (
                                    typeof selectedVariant.images === "string"
                                  ) {
                                    try {
                                      // Try to parse if it's a JSON string
                                      if (
                                        selectedVariant.images.startsWith("[")
                                      ) {
                                        const parsed = JSON.parse(
                                          selectedVariant.images
                                        );
                                        currentImages = Array.isArray(parsed)
                                          ? parsed
                                          : [];
                                      } else {
                                        // Single image URL
                                        currentImages = [
                                          selectedVariant.images,
                                        ];
                                      }
                                    } catch (e) {
                                      console.error("Error parsing images:", e);
                                      currentImages = [];
                                    }
                                  }
                                }

                                // Add new uploads to current images
                                const updatedImages = [
                                  ...currentImages,
                                  ...successfulUploads,
                                ];

                                console.log(
                                  "Current images before update:",
                                  currentImages
                                );
                                console.log(
                                  "Adding new images to variant:",
                                  successfulUploads
                                );
                                console.log(
                                  "Final updated images array:",
                                  updatedImages
                                );

                                // Update the selected variant with the new images array
                                setSelectedVariant({
                                  ...selectedVariant,
                                  images: updatedImages,
                                });

                                // Also update the variant in all relevant state variables to ensure consistency
                                if (selectedVariant.id) {
                                  // Update in variants array
                                  setVariants((prevVariants) =>
                                    prevVariants.map((v) =>
                                      v.id === selectedVariant.id
                                        ? { ...v, images: updatedImages }
                                        : v
                                    )
                                  );

                                  // Update in currentVariants array which is critical for server updates
                                  if (currentVariants) {
                                    const updatedCurrentVariants = [
                                      ...currentVariants,
                                    ];
                                    const existingIndex =
                                      updatedCurrentVariants.findIndex(
                                        (v) => v.id === selectedVariant.id
                                      );

                                    if (existingIndex !== -1) {
                                      updatedCurrentVariants[existingIndex] = {
                                        ...updatedCurrentVariants[
                                          existingIndex
                                        ],
                                        images: updatedImages,
                                      };
                                      setCurrentVariants(
                                        updatedCurrentVariants
                                      );
                                    }
                                  }

                                  // Also update in draft variants if applicable
                                  setDraftVariants((prevDrafts) => {
                                    const draftExists = prevDrafts.some(
                                      (d) => d.id === selectedVariant.id
                                    );
                                    if (draftExists) {
                                      return prevDrafts.map((d) =>
                                        d.id === selectedVariant.id
                                          ? { ...d, images: updatedImages }
                                          : d
                                      );
                                    }
                                    return prevDrafts;
                                  });
                                }

                                toast({
                                  title: "Images uploaded",
                                  description: `${
                                    successfulUploads.length
                                  } image${
                                    successfulUploads.length !== 1 ? "s" : ""
                                  } added to this variant.`,
                                });
                              }
                            } catch (error) {
                              console.error(
                                "Error uploading variant images:",
                                error
                              );
                              toast({
                                title: "Upload failed",
                                description:
                                  error instanceof Error
                                    ? error.message
                                    : "Failed to upload images",
                                variant: "destructive",
                              });
                            } finally {
                              setIsUploading(false);
                              setUploadProgress(100);

                              // Clear the file input
                              e.target.value = "";
                            }
                          }
                        }}
                      />
                    </label>

                    {/* Add Image URL Option */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = window.prompt("Enter image URL:");
                        if (url && url.trim()) {
                          // Add the URL to variant images
                          const updatedImages = selectedVariant.images
                            ? Array.isArray(selectedVariant.images)
                              ? [...selectedVariant.images, url.trim()]
                              : [url.trim()]
                            : [url.trim()];

                          // Update the selected variant with the new images
                          setSelectedVariant({
                            ...selectedVariant,
                            images: updatedImages,
                          });

                          toast({
                            title: "Image added",
                            description:
                              "The image URL has been added to this variant.",
                          });
                        }
                      }}
                    >
                      <LinkIcon className="h-4 w-4 mr-1.5" />
                      Add Image URL
                    </Button>
                  </div>
                </div>

                {/* Display existing variant images */}
                <div className="border rounded-md p-4 bg-muted/30">
                  {selectedVariant.images &&
                  Array.isArray(selectedVariant.images) &&
                  selectedVariant.images.length > 0 ? (
                    <div>
                      <div className="mb-2 text-sm text-muted-foreground flex items-center justify-between">
                        <span>
                          {selectedVariant.images.length} image
                          {selectedVariant.images.length !== 1 ? "s" : ""}{" "}
                          uploaded
                        </span>
                        <span className="text-xs">
                          (You can upload multiple images per variant)
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {selectedVariant.images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={img}
                              alt={`Variant ${idx}`}
                              className="h-20 w-full object-cover rounded-md border border-border"
                            />
                            <div className="absolute top-1 right-1">
                              <button
                                type="button"
                                onClick={() => {
                                  // Remove the image from the variant
                                  const updatedImages = [
                                    ...selectedVariant.images,
                                  ];
                                  updatedImages.splice(idx, 1);

                                  setSelectedVariant({
                                    ...selectedVariant,
                                    images: updatedImages,
                                  });

                                  toast({
                                    title: "Image removed",
                                    description:
                                      "The image has been removed from this variant.",
                                  });
                                }}
                                className="bg-destructive text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="absolute bottom-1 left-1">
                              <span className="bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                #{idx + 1}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <UploadCloud className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">No images yet</p>
                      <p className="text-xs mt-1 text-muted-foreground">
                        Click "Upload Image" to add images for this variant. You
                        can add multiple images.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditVariantDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading}
              onClick={() => {
                if (selectedVariant) {
                  console.log("Saving variant changes for:", selectedVariant);

                  // Ensure we have well-processed images that will survive the trip to the server
                  // and back again through various serialization/deserialization cycles
                  let processedImages = selectedVariant.images || [];

                  // Ensure the images array is properly formatted
                  if (typeof processedImages === "string") {
                    try {
                      const parsedImages = JSON.parse(processedImages);
                      processedImages = Array.isArray(parsedImages)
                        ? parsedImages
                        : [];
                    } catch (error) {
                      console.error(
                        "Error parsing variant images string:",
                        error
                      );
                      processedImages = [];
                    }
                  } else if (!Array.isArray(processedImages)) {
                    processedImages = [];
                  }

                  // Create a properly formatted variant with clean images
                  const processedVariant = {
                    ...selectedVariant,
                    images: processedImages,
                    // Ensure numeric values are numbers
                    price: Number(selectedVariant.price) || 0,
                    mrp: Number(selectedVariant.mrp) || 0,
                    stock: Number(selectedVariant.stock) || 0,
                  };

                  console.log(
                    "Processed variant for update:",
                    processedVariant
                  );
                  console.log(
                    "Processed variant images type:",
                    typeof processedVariant.images
                  );
                  console.log(
                    "Processed variant images:",
                    processedVariant.images
                  );

                  // Make absolutely sure images is an array before proceeding
                  if (!Array.isArray(processedVariant.images)) {
                    console.warn(
                      "Variant images is not an array after processing in dialog. Converting to empty array."
                    );
                    processedVariant.images = [];
                  }

                  // Check if the variant is in the regular variants list (has a positive ID)
                  const isRegularVariant =
                    typeof processedVariant.id === "number" &&
                    processedVariant.id > 0;

                  // IMPORTANT: Update ALL fields, not just images
                  const updatedVariant = {
                    ...processedVariant,
                    price: Number(processedVariant.price) || 0,
                    mrp: Number(processedVariant.mrp) || 0,
                    stock: Number(processedVariant.stock) || 0,
                    color: processedVariant.color || "",
                    size: processedVariant.size || "",
                    images: processedVariant.images,
                  };

                  console.log("Saving processed variant:", updatedVariant);

                  if (isRegularVariant) {
                    // Update in the variants list
                    console.log("Updating regular variant in variants list");
                    setVariants((prevVariants) =>
                      prevVariants.map((v) =>
                        v.id === updatedVariant.id ? updatedVariant : v
                      )
                    );
                  } else {
                    // Update in the draft variants list
                    console.log(
                      "Updating draft variant in draft variants list"
                    );
                    setDraftVariants((prevDrafts) =>
                      prevDrafts.map((d) =>
                        d.id === updatedVariant.id ? updatedVariant : d
                      )
                    );

                    // Also update in the main variants list (if it exists there)
                    setVariants((prevVariants) => {
                      const variantExists = prevVariants.some(
                        (v) => v.id === updatedVariant.id
                      );
                      if (variantExists) {
                        return prevVariants.map((v) =>
                          v.id === updatedVariant.id ? updatedVariant : v
                        );
                      }
                      return prevVariants;
                    });
                  }

                  // Update the current variants directly to ensure all changes persist
                  // This ensures the API receives the correct data when the product is updated
                  if (updatedVariant.id && currentVariants) {
                    console.log(
                      `Making sure variant ${updatedVariant.id} changes are preserved`
                    );

                    // Create a copy of the current variants and update the one with matching ID
                    const updatedVariants = [...currentVariants];
                    const existingIndex = updatedVariants.findIndex(
                      (v) => v.id === updatedVariant.id
                    );

                    if (existingIndex !== -1) {
                      // Update the entire variant - critically important for prices
                      updatedVariants[existingIndex] = {
                        ...updatedVariants[existingIndex],
                        price: Number(updatedVariant.price),
                        mrp: Number(updatedVariant.mrp),
                        stock: Number(updatedVariant.stock),
                        color: updatedVariant.color,
                        size: updatedVariant.size,
                        images: updatedVariant.images,
                      };
                      setCurrentVariants(updatedVariants);
                      console.log(
                        "Updated variant in currentVariants:",
                        updatedVariants[existingIndex]
                      );
                    }
                  }

                  // Add direct database update for this variant (critical for price updates)
                  if (
                    updatedVariant.id &&
                    typeof updatedVariant.id === "number" &&
                    updatedVariant.id > 0
                  ) {
                    console.log(
                      "Sending direct variant update to server:",
                      updatedVariant
                    );

                    // Create an optimized variant object with only the fields we need to update
                    const variantUpdateData = {
                      id: updatedVariant.id,
                      price: Number(updatedVariant.price),
                      mrp: Number(updatedVariant.mrp),
                      stock: Number(updatedVariant.stock),
                      color: updatedVariant.color,
                      size: updatedVariant.size,
                      images: updatedVariant.images,
                    };

                    // Send the update to the server
                    fetch(
                      `/api/products/${productId}/variants/${updatedVariant.id}`,
                      {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(variantUpdateData),
                      }
                    )
                      .then((response) => {
                        if (!response.ok) {
                          throw new Error("Failed to update variant");
                        }
                        return response.json();
                      })
                      .then((data) => {
                        console.log("Variant updated successfully:", data);
                      })
                      .catch((error) => {
                        console.error("Error updating variant:", error);
                        // Continue with the UI update even if the server update fails
                      });
                  }

                  toast({
                    title: "Variant updated",
                    description:
                      "The variant has been updated. Save the product to apply changes.",
                  });

                  setEditVariantDialogOpen(false);
                }
              }}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Variant Dialog */}
      <Dialog
        open={deleteVariantDialogOpen}
        onOpenChange={setDeleteVariantDialogOpen}
      >
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
              onClick={() => setDeleteVariantDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (selectedVariant && selectedVariant.id) {
                  console.log("Deleting variant:", selectedVariant);

                  // If the variant has a positive ID, it exists in the database
                  if (
                    typeof selectedVariant.id === "number" &&
                    selectedVariant.id > 0
                  ) {
                    // Add to the list of deleted variant IDs to track which ones need to be deleted from DB
                    const variantId = selectedVariant.id as number;
                    setDeletedVariantIds((prev) => {
                      if (!prev.includes(variantId)) {
                        return [...prev, variantId];
                      }
                      return prev;
                    });

                    // Try to immediately delete the variant from the database
                    try {
                      console.log(
                        `Attempting immediate deletion of variant ID ${selectedVariant.id}`
                      );
                      const deleteResponse = await fetch(
                        `/api/products/${productId}/variants/${selectedVariant.id}`,
                        {
                          method: "DELETE",
                          headers: {
                            "Content-Type": "application/json",
                          },
                        }
                      );

                      if (deleteResponse.ok) {
                        console.log(
                          `Successfully deleted variant ID ${selectedVariant.id} from database`
                        );
                      } else {
                        console.error(
                          `Failed to delete variant ID ${selectedVariant.id} from database`
                        );
                        // Will still continue with local state deletion
                      }
                    } catch (error) {
                      console.error("Error during variant deletion:", error);
                      // Still continue with local state deletion
                    }
                  }

                  // Remove from the variants array
                  setVariants((prev) =>
                    prev.filter((v) => v.id !== selectedVariant.id)
                  );

                  // Also remove from draft variants if it exists there
                  setDraftVariants((prev) =>
                    prev.filter((d) => d.id !== selectedVariant.id)
                  );

                  // CRITICAL: Also remove from currentVariants which is used as source of truth during updates
                  // This ensures the deleted variant won't reappear when the product is saved
                  setCurrentVariants((prev) => {
                    const filtered = prev.filter(
                      (v) => v.id !== selectedVariant.id
                    );
                    console.log(
                      `Removed variant ${selectedVariant.id} from currentVariants, count before: ${prev.length}, after: ${filtered.length}`
                    );
                    return filtered;
                  });

                  toast({
                    title: "Variant deleted",
                    description: "The variant has been deleted.",
                  });

                  setDeleteVariantDialogOpen(false);
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
// Eye component is imported from lucide-react at the top of the file
