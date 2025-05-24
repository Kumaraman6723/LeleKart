import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useLocation, useRoute, Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  RefreshCw,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Plus,
  Loader2,
  Package,
  X,
  Check,
  Filter,
  Clock,
  ArrowRight,
  UserPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileDown,
} from "lucide-react";
import { ProductImageGallery } from "@/components/ui/product-image-gallery";

export default function AdminProducts() {
  const [_, setLocation] = useLocation();
  return <AdminProductsContent setLocationProp={setLocation} />;
}

// Define a type for Seller
type Seller = {
  id: number;
  username: string;
  email: string;
  name?: string;
  approved: boolean;
  role: string;
};

function AdminProductsContent({
  setLocationProp,
}: {
  setLocationProp?: (path: string) => void;
}) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Pre-define search functions
  function performSearch() {
    if (!searchInput.trim()) return;

    // Add to search history
    addSearchToHistory(searchInput);

    // Update the search state
    setSearch(searchInput);

    // Update URL with search parameters
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("search", searchInput);
    searchParams.set("searchField", searchField);

    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({}, "", newUrl);

    // Refetch products with new search term
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");

    // Remove search parameters from URL
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.delete("search");

    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({}, "", newUrl);

    // Refetch products without search term
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
  }
  const [searchField, setSearchField] = useState<string>("all");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [isSearchSuggestionsOpen, setIsSearchSuggestionsOpen] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [priceRangeFilter, setPriceRangeFilter] = useState<
    [number | null, number | null]
  >([null, null]);
  const [stockFilter, setStockFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("newest");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [location, setLocation] = useLocation();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  // Set approvalFilter to null (show all products) by default
  const [approvalFilter, setApprovalFilter] = useState<string | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string>("");
  const [sellerSearchTerm, setSellerSearchTerm] = useState("");
  const [assignSellerProduct, setAssignSellerProduct] =
    useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    productId: number | null;
    productName: string;
  }>({
    open: false,
    productId: null,
    productName: "",
  });

  // Category and subcategory editing states
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<string>("");
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<
    number | null
  >(null);

  // Track currently selected product's category (for subcategory filtering)
  const [selectedProductCategory, setSelectedProductCategory] = useState<
    string | null
  >(null);

  // Fetch products with pagination
  const {
    data: productsData,
    isLoading,
    isError,
    refetch,
  } = useQuery<{
    products: Product[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      limit: number;
    };
  }>({
    queryKey: ["/api/products", { page: currentPage, limit: itemsPerPage }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey as [string, { page: number; limit: number }];
      const res = await apiRequest(
        "GET",
        `/api/products?page=${params.page}&limit=${params.limit}${
          categoryFilter ? `&category=${categoryFilter}` : ""
        }${
          approvalFilter === "approved"
            ? "&approved=true"
            : approvalFilter === "rejected"
            ? "&rejected=true"
            : approvalFilter === "pending"
            ? "&pending=true"
            : ""
        }${search ? `&search=${encodeURIComponent(search)}` : ""}`
      );
      return res.json();
    },
  });

  // Extract products array and pagination from response
  const products = productsData?.products || [];
  const pagination = productsData?.pagination || {
    total: 0,
    totalPages: 1,
    currentPage: 1,
    limit: itemsPerPage,
  };

  // Extract unique categories for filtering
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ) as string[];

  // Fetch all categories and subcategories from the server for the dropdowns
  const { data: allCategories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  // Fetch filtered subcategories based on the currently edited category
  const { data: categorySubcategories = [] } = useQuery({
    queryKey: ["/api/subcategories/filtered", editingCategory],
    queryFn: async () => {
      // If no category is selected, don't fetch subcategories
      if (!editingCategory) {
        console.log("No editing category selected, skipping subcategory fetch");
        return [];
      }

      // Find category ID based on name
      const categoryObj = allCategories?.find(
        (c: any) => c.name === editingCategory
      );

      if (!categoryObj || !categoryObj.id) {
        console.log(
          `Cannot find category ID for "${editingCategory}" in allCategories`
        );
        console.log(
          "Available categories:",
          allCategories?.map((c: any) => ({ id: c.id, name: c.name }))
        );
        return [];
      }

      console.log(
        `Fetching subcategories specifically for category ID ${categoryObj.id} (${editingCategory})`
      );
      const res = await fetch(
        `/api/subcategories?categoryId=${categoryObj.id}`
      );
      if (!res.ok) {
        throw new Error(
          `Failed to fetch subcategories for category "${editingCategory}"`
        );
      }
      const data = await res.json();
      console.log(
        `Found ${
          data.subcategories?.length || 0
        } subcategories for category "${editingCategory}" (ID: ${
          categoryObj.id
        })`
      );

      if (data.subcategories?.length > 0) {
        console.log(
          "First few subcategories:",
          data.subcategories.slice(0, 3).map((s: any) => ({
            id: s.id,
            name: s.name,
            categoryId: s.categoryId,
          }))
        );
      }

      return data.subcategories || [];
    },
    enabled: !!allCategories && !!editingCategory,
  });

  // Fetch subcategories for display in the products table - filtered by category on the server-side
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);

  // Fetch subcategories for all categories - but we'll do server-side filtering
  const { data: productSubcategories = [] } = useQuery({
    queryKey: ["/api/subcategories", "displayTable"],
    queryFn: async () => {
      // Get all subcategories but with a higher limit to ensure we get them all
      const res = await fetch("/api/subcategories?limit=100");
      if (!res.ok) throw new Error("Failed to fetch subcategories");

      const data = await res.json();
      console.log(
        `Fetched subcategories for table display (${
          data.subcategories?.length || 0
        } total)`
      );
      return data.subcategories || [];
    },
  });

  // Create a proper type for Subcategory
  type Subcategory = {
    id: number;
    name: string;
    categoryId: number;
    slug?: string;
  };

  // Log product data for debugging
  useEffect(() => {
    if (products.length > 0) {
      // Check specific product or first product for debugging
      const product = products.find((p) => p.id === 4470) || products[0];
      // Debug data is no longer needed as subcategory handling is working correctly
    }
  }, [productsData, productSubcategories]);

  // Store recent searches in localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem("productSearchHistory");
    if (savedSearches) {
      setSearchHistory(JSON.parse(savedSearches));
    }
  }, []);

  // Store recent searches in localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem("adminProductSearchHistory");
    if (savedSearches) {
      try {
        const parsedSearches = JSON.parse(savedSearches);
        if (Array.isArray(parsedSearches)) {
          setSearchHistory(parsedSearches);
        }
      } catch (error) {
        console.error("Error parsing search history:", error);
      }
    }
  }, []);

  // Function to add search term to history
  const addSearchToHistory = (term: string) => {
    if (!term.trim()) return;

    const newHistory = [
      term,
      ...searchHistory.filter(
        (item) => item.toLowerCase() !== term.toLowerCase()
      ),
    ].slice(0, 10); // Keep only the 10 most recent searches

    setSearchHistory(newHistory);
    localStorage.setItem(
      "adminProductSearchHistory",
      JSON.stringify(newHistory)
    );
  };

  // Generate search suggestions based on input
  useEffect(() => {
    if (searchInput.trim().length < 2) {
      setSearchSuggestions([]);
      setIsSearchSuggestionsOpen(false);
      return;
    }

    // Filter history for matching items
    const historyMatches = searchHistory.filter((item) =>
      item.toLowerCase().includes(searchInput.toLowerCase())
    );

    // Simple suggestion generator based on current products
    const productNameSuggestions = products
      .filter((p) => p.name.toLowerCase().includes(searchInput.toLowerCase()))
      .map((p) => p.name)
      .slice(0, 5);

    const categorySuggestions = categories
      .filter((c) => c.toLowerCase().includes(searchInput.toLowerCase()))
      .map((c) => c)
      .slice(0, 3);

    // Combine and deduplicate suggestions
    const combinedSuggestions = Array.from(
      new Set([
        ...historyMatches,
        ...productNameSuggestions,
        ...categorySuggestions,
      ])
    ).slice(0, 7);

    setSearchSuggestions(combinedSuggestions);
    setIsSearchSuggestionsOpen(combinedSuggestions.length > 0);
  }, [searchInput, searchHistory, products, categories]);

  // Get search query from URL if present
  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get("search");
    const searchFieldParam = urlParams.get("searchField");
    const minPrice = urlParams.get("minPrice");
    const maxPrice = urlParams.get("maxPrice");
    const stockFilter = urlParams.get("stock");
    const sortBy = urlParams.get("sortBy");

    // Apply search params if they exist
    if (searchParam) {
      setSearch(searchParam);
      setSearchInput(searchParam);

      console.log("Admin - Found search parameter in URL:", searchParam);

      // Force a refetch with the search parameter
      queryClient.invalidateQueries({
        queryKey: ["/api/products"],
      });

      toast({
        title: "Admin Search",
        description: `Searching admin products for "${searchParam}"`,
        duration: 3000,
      });
    }

    // Apply other filter params
    if (searchFieldParam) setSearchField(searchFieldParam);
    if (minPrice || maxPrice) {
      setPriceRangeFilter([
        minPrice ? parseFloat(minPrice) : null,
        maxPrice ? parseFloat(maxPrice) : null,
      ]);
    }
    if (stockFilter) setStockFilter(stockFilter);
    if (sortBy) setSortBy(sortBy);

    // Extract product ID from path if it's a single product view
    // Format: /admin/products/123
    const pathMatch = window.location.pathname.match(
      /\/admin\/products\/(\d+)/
    );
    if (pathMatch && pathMatch[1]) {
      const productId = parseInt(pathMatch[1]);

      // Fetch the specific product and set it to view
      const fetchProduct = async () => {
        try {
          const res = await apiRequest("GET", `/api/products/${productId}`);
          const product = await res.json();
          setViewProduct(product);
        } catch (error) {
          console.error("Error fetching product:", error);
          toast({
            title: "Error",
            description: "Failed to load product details",
            variant: "destructive",
          });
        }
      };

      fetchProduct();
    }
  }, [location, toast]);

  // This section was moved above to fix the reference error

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk delete products mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await apiRequest("POST", `/api/products/bulk-delete`, { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setSelectedProducts([]);
      toast({
        title: "Products deleted",
        description: `${selectedProducts.length} products have been successfully deleted.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete products",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve product mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/products/${id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product approved",
        description: "The product is now visible to buyers.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject product mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/products/${id}/reject`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product rejected",
        description: "The product will not be visible to buyers.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch approved sellers for the assignment dropdown
  const { data: sellers = [] } = useQuery<Seller[]>({
    queryKey: ["/api/sellers/approved"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/sellers/approved");
      return res.json();
    },
    // Only fetch when the assignment dialog is open
    enabled: assignSellerProduct !== null,
  });

  // Assign product to a seller mutation
  const assignSellerMutation = useMutation({
    mutationFn: async ({
      productId,
      sellerId,
    }: {
      productId: number;
      sellerId: number;
    }) => {
      const res = await apiRequest(
        "PUT",
        `/api/products/${productId}/assign-seller`,
        { sellerId }
      );
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setAssignSellerProduct(null);
      setSelectedSellerId("");
      toast({
        title: "Product reassigned",
        description:
          data.message ||
          "The product has been successfully reassigned to another seller.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reassign product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle delete confirmation
  const handleDeleteClick = (product: Product) => {
    setDeleteConfirm({
      open: true,
      productId: product.id,
      productName: product.name,
    });
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (deleteConfirm.productId) {
      await deleteMutation.mutateAsync(deleteConfirm.productId);
      setDeleteConfirm({
        open: false,
        productId: null,
        productName: "",
      });
    }
  };

  // Handle product approval
  const handleApproveProduct = async (product: Product) => {
    await approveMutation.mutateAsync(product.id);
  };

  // Handle product rejection
  const handleRejectProduct = async (product: Product) => {
    await rejectMutation.mutateAsync(product.id);
  };

  // Handle seller assignment
  const handleAssignSeller = async () => {
    if (!assignSellerProduct || !selectedSellerId) return;

    await assignSellerMutation.mutateAsync({
      productId: assignSellerProduct.id,
      sellerId: parseInt(selectedSellerId),
    });
  };

  // Handle saving the category and subcategory changes
  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      productId,
      category,
      subcategoryId,
    }: {
      productId: number;
      category: string;
      subcategoryId: number | null;
    }) => {
      console.log("Updating product", productId, "with data:", {
        category,
        subcategoryId,
        subcategoryIdType: typeof subcategoryId,
      });

      // Make sure subcategoryId is either a valid number or null
      // Handle special cases: undefined, empty string, 0, "0", "none"
      let normalizedSubcategoryId: number | null = subcategoryId;

      // Check for empty or special values that should be converted to null
      if (
        normalizedSubcategoryId === undefined ||
        normalizedSubcategoryId === null ||
        normalizedSubcategoryId === 0
      ) {
        normalizedSubcategoryId = null;
      } else if (typeof normalizedSubcategoryId === "string") {
        // Handle string values that should be null
        if (
          normalizedSubcategoryId === "" ||
          normalizedSubcategoryId === "0" ||
          normalizedSubcategoryId === "none"
        ) {
          normalizedSubcategoryId = null;
        } else {
          // Try to convert string to number
          const parsed = Number(normalizedSubcategoryId);
          // If conversion results in NaN, set to null
          normalizedSubcategoryId = isNaN(parsed) ? null : parsed;
        }
      }

      // Log the normalized data before sending
      console.log("Sending normalized data:", {
        category,
        subcategoryId: normalizedSubcategoryId,
        subcategoryIdType: typeof normalizedSubcategoryId,
      });

      // First fetch the current product data to ensure we have the latest variants
      const currentProductResponse = await fetch(`/api/products/${productId}`);
      const currentProduct = await currentProductResponse.json();
      console.log(
        "Current product variants:",
        currentProduct.variants?.length || 0
      );

      // Include the variants in the update request to ensure they are preserved
      const response = await apiRequest("PUT", `/api/products/${productId}`, {
        productData: {
          category,
          subcategoryId: normalizedSubcategoryId,
          // Include existing variants to ensure they're preserved
          __preserveVariants: true,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update product category");
      }

      // Log the response data
      const responseData = await response.json();
      console.log("Update response:", responseData);

      return responseData;
    },
    onSuccess: () => {
      setEditingProductId(null);
      setEditingCategory("");
      setEditingSubcategoryId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product updated",
        description: "Product category and subcategory updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter and sort products
  const filteredProducts = products
    ?.filter((product) => {
      // Advanced text search by field
      let matchesSearch = !search ? true : false;

      if (search) {
        const searchLower = search.toLowerCase();

        if (searchField === "all") {
          matchesSearch =
            product.name.toLowerCase().includes(searchLower) ||
            (product.description &&
              product.description.toLowerCase().includes(searchLower)) ||
            (product.category &&
              product.category.toLowerCase().includes(searchLower)) ||
            (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
            (product.seller_username &&
              product.seller_username.toLowerCase().includes(searchLower));
        } else if (searchField === "name") {
          matchesSearch = product.name.toLowerCase().includes(searchLower);
        } else if (searchField === "description") {
          matchesSearch =
            product.description &&
            product.description.toLowerCase().includes(searchLower);
        } else if (searchField === "category") {
          matchesSearch =
            product.category &&
            product.category.toLowerCase().includes(searchLower);
        } else if (searchField === "sku") {
          matchesSearch =
            product.sku && product.sku.toLowerCase().includes(searchLower);
        } else if (searchField === "seller") {
          matchesSearch =
            product.seller_username &&
            product.seller_username.toLowerCase().includes(searchLower);
        }
      }

      // Category filter
      const matchesCategory = !categoryFilter
        ? true
        : product.category === categoryFilter;

      // Approval filter
      const matchesApproval =
        approvalFilter === null
          ? true
          : approvalFilter === "approved"
          ? product.approved
          : approvalFilter === "rejected"
          ? product.rejected
          : !product.approved && !product.rejected; // pending products (not approved and not rejected)

      // Price range filter
      const [minPrice, maxPrice] = priceRangeFilter;
      const matchesPrice =
        (!minPrice || (product.price && product.price >= minPrice)) &&
        (!maxPrice || (product.price && product.price <= maxPrice));

      // Stock filter
      const matchesStock = !stockFilter
        ? true
        : stockFilter === "inStock"
        ? product.stockQuantity && product.stockQuantity > 0
        : product.stockQuantity === 0 || !product.stockQuantity;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesApproval &&
        matchesPrice &&
        matchesStock
      );
    })
    // Dynamic sorting
    .sort((a, b) => {
      if (sortBy === "newest") return b.id - a.id;
      if (sortBy === "oldest") return a.id - b.id;
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "price-low") {
        const aPrice = a.price || 0;
        const bPrice = b.price || 0;
        return aPrice - bPrice;
      }
      if (sortBy === "price-high") {
        const aPrice = a.price || 0;
        const bPrice = b.price || 0;
        return bPrice - aPrice;
      }
      return b.id - a.id; // default to newest
    });

  // Categories are already defined above

  // Get product stats from our new dedicated API endpoint
  const { data: productStats } = useQuery({
    queryKey: ["/api/admin/product-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/product-stats", {
        credentials: "include",
      });
      return res.json();
    },
  });

  // Product counts for stats - use server provided counts from the product-stats endpoint
  const totalProductsCount = pagination?.total || 0;
  const totalProducts = productStats?.total || 0;
  const approvedProducts = productStats?.approved || 0;
  const rejectedProducts = productStats?.rejected || 0;
  const pendingProducts = productStats?.pending || 0;

  // Handler to toggle select all products
  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((product) => product.id));
    }
  };

  // Handler to toggle a single product selection
  const toggleProductSelection = (productId: number) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  // Confirm bulk delete
  const confirmBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    try {
      await bulkDeleteMutation.mutateAsync(selectedProducts);
      setBulkDeleteConfirm(false);
    } catch (error) {
      console.error("Bulk delete error:", error);
    }
  };

  // Handler to change the page
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handler to change items per page
  const handleItemsPerPageChange = (value: string) => {
    const newLimit = parseInt(value);
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  // Loading states
  const ProductStatsLoading = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {["total", "approved", "pending", "rejected"].map((stat) => (
        <Card key={stat} className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium capitalize">
              {stat} Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Product Management
          </h1>
          <p className="text-muted-foreground">
            Manage your store's products, approvals, and inventory
          </p>
        </div>

        {/* Products Stats */}
        {isLoading ? (
          <ProductStatsLoading />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Approved Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{approvedProducts}</div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingProducts}</div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Rejected Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rejectedProducts}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Products Data Table */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 space-y-1">
              {/* Advanced Search UI */}
              <div className="flex items-center space-x-1">
                {/* Field selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 px-3 font-normal justify-between"
                      role="combobox"
                    >
                      {searchField === "all"
                        ? "All Fields"
                        : searchField === "name"
                        ? "Name"
                        : searchField === "description"
                        ? "Description"
                        : searchField === "category"
                        ? "Category"
                        : searchField === "sku"
                        ? "SKU"
                        : searchField === "seller"
                        ? "Seller"
                        : "All Fields"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    <DropdownMenuLabel>Search in field</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      value={searchField}
                      onValueChange={setSearchField}
                    >
                      <DropdownMenuRadioItem value="all">
                        All Fields
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="name">
                        Name
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="description">
                        Description
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="category">
                        Category
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="sku">
                        SKU
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="seller">
                        Seller
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Search input with suggestions */}
                <div className="relative flex-1">
                  <Command className="rounded-lg border shadow-md overflow-visible">
                    <div className="flex items-center border-b px-3">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <CommandInput
                        ref={searchInputRef}
                        placeholder={`Search in ${
                          searchField === "all" ? "all fields" : searchField
                        }...`}
                        value={searchInput}
                        onValueChange={(value) => {
                          setSearchInput(value);
                          setIsSearchSuggestionsOpen(value.length >= 2);
                        }}
                        className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            performSearch();
                            setIsSearchSuggestionsOpen(false);
                          }
                        }}
                      />
                      {(searchInput || search) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={clearSearch}
                          title="Clear search"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Popover
                        open={advancedSearchOpen}
                        onOpenChange={setAdvancedSearchOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-1 px-2"
                            title="Advanced Search"
                          >
                            <Filter className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4" align="end">
                          <div className="grid gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Price Range</h4>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  placeholder="Min"
                                  value={
                                    priceRangeFilter[0] === null
                                      ? ""
                                      : priceRangeFilter[0]
                                  }
                                  onChange={(e) =>
                                    setPriceRangeFilter([
                                      e.target.value
                                        ? parseFloat(e.target.value)
                                        : null,
                                      priceRangeFilter[1],
                                    ])
                                  }
                                  className="w-1/2"
                                />
                                <span>-</span>
                                <Input
                                  type="number"
                                  placeholder="Max"
                                  value={
                                    priceRangeFilter[1] === null
                                      ? ""
                                      : priceRangeFilter[1]
                                  }
                                  onChange={(e) =>
                                    setPriceRangeFilter([
                                      priceRangeFilter[0],
                                      e.target.value
                                        ? parseFloat(e.target.value)
                                        : null,
                                    ])
                                  }
                                  className="w-1/2"
                                />
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Stock Status</h4>
                              <div className="flex items-center space-x-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="w-full justify-between"
                                    >
                                      {stockFilter === "inStock"
                                        ? "In Stock"
                                        : stockFilter === "outOfStock"
                                        ? "Out of Stock"
                                        : "Any"}
                                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="w-48">
                                    <DropdownMenuRadioGroup
                                      value={stockFilter || "any"}
                                      onValueChange={(v) =>
                                        setStockFilter(v === "any" ? null : v)
                                      }
                                    >
                                      <DropdownMenuRadioItem value="any">
                                        Any
                                      </DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem value="inStock">
                                        In Stock
                                      </DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem value="outOfStock">
                                        Out of Stock
                                      </DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Sort By</h4>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-between"
                                  >
                                    {sortBy === "newest"
                                      ? "Newest First"
                                      : sortBy === "oldest"
                                      ? "Oldest First"
                                      : sortBy === "name-asc"
                                      ? "Name (A-Z)"
                                      : sortBy === "name-desc"
                                      ? "Name (Z-A)"
                                      : sortBy === "price-low"
                                      ? "Price (Low to High)"
                                      : sortBy === "price-high"
                                      ? "Price (High to Low)"
                                      : "Newest First"}
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-48">
                                  <DropdownMenuRadioGroup
                                    value={sortBy}
                                    onValueChange={setSortBy}
                                  >
                                    <DropdownMenuRadioItem value="newest">
                                      Newest First
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="oldest">
                                      Oldest First
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="name-asc">
                                      Name (A-Z)
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="name-desc">
                                      Name (Z-A)
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="price-low">
                                      Price (Low to High)
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="price-high">
                                      Price (High to Low)
                                    </DropdownMenuRadioItem>
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setPriceRangeFilter([null, null]);
                                  setStockFilter(null);
                                  setSortBy("newest");
                                  setAdvancedSearchOpen(false);
                                }}
                              >
                                Reset
                              </Button>
                              <Button
                                onClick={() => {
                                  // Apply filters and close popover
                                  queryClient.invalidateQueries({
                                    queryKey: ["/api/products"],
                                  });
                                  setAdvancedSearchOpen(false);

                                  // Update URL with filters
                                  const searchParams = new URLSearchParams(
                                    window.location.search
                                  );
                                  if (priceRangeFilter[0])
                                    searchParams.set(
                                      "minPrice",
                                      priceRangeFilter[0].toString()
                                    );
                                  else searchParams.delete("minPrice");

                                  if (priceRangeFilter[1])
                                    searchParams.set(
                                      "maxPrice",
                                      priceRangeFilter[1].toString()
                                    );
                                  else searchParams.delete("maxPrice");

                                  if (stockFilter)
                                    searchParams.set("stock", stockFilter);
                                  else searchParams.delete("stock");

                                  if (sortBy !== "newest")
                                    searchParams.set("sortBy", sortBy);
                                  else searchParams.delete("sortBy");

                                  const newUrl = `${
                                    window.location.pathname
                                  }?${searchParams.toString()}`;
                                  window.history.pushState({}, "", newUrl);
                                }}
                              >
                                Apply Filters
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Search suggestions */}
                    {isSearchSuggestionsOpen &&
                      searchSuggestions.length > 0 && (
                        <div className="border-t">
                          <CommandList>
                            <CommandGroup heading="Suggestions">
                              {searchSuggestions.map((suggestion) => (
                                <CommandItem
                                  key={suggestion}
                                  value={suggestion}
                                  onSelect={(value) => {
                                    setSearchInput(value);
                                    setIsSearchSuggestionsOpen(false);
                                    performSearch();
                                  }}
                                  className="cursor-pointer"
                                >
                                  {suggestion}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                            {searchHistory.length > 0 && (
                              <CommandGroup heading="Recent Searches">
                                {searchHistory
                                  .slice(0, 3)
                                  .map((historyItem) => (
                                    <CommandItem
                                      key={`history-${historyItem}`}
                                      value={historyItem}
                                      onSelect={(value) => {
                                        setSearchInput(value);
                                        setIsSearchSuggestionsOpen(false);
                                        performSearch();
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <Clock className="mr-2 h-4 w-4" />
                                      {historyItem}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </div>
                      )}
                  </Command>
                </div>

                {/* Search button */}
                <Button type="submit" className="px-4" onClick={performSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>

              {/* Search functions moved to the top of the component */}

              {/* Active Filters */}
              {(search ||
                categoryFilter ||
                approvalFilter ||
                priceRangeFilter[0] ||
                priceRangeFilter[1] ||
                stockFilter) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {search && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <span>Search: {search}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => {
                          setSearch("");
                          setSearchInput("");
                          // Update URL
                          const searchParams = new URLSearchParams(
                            window.location.search
                          );
                          searchParams.delete("search");
                          const newUrl = `${
                            window.location.pathname
                          }?${searchParams.toString()}`;
                          window.history.pushState({}, "", newUrl);
                          queryClient.invalidateQueries({
                            queryKey: ["/api/products"],
                          });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {searchField !== "all" && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <span>Field: {searchField}</span>
                    </Badge>
                  )}
                  {(priceRangeFilter[0] || priceRangeFilter[1]) && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <span>
                        Price: {priceRangeFilter[0] || "0"} -{" "}
                        {priceRangeFilter[1] || "any"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => {
                          setPriceRangeFilter([null, null]);
                          // Update URL
                          const searchParams = new URLSearchParams(
                            window.location.search
                          );
                          searchParams.delete("minPrice");
                          searchParams.delete("maxPrice");
                          const newUrl = `${
                            window.location.pathname
                          }?${searchParams.toString()}`;
                          window.history.pushState({}, "", newUrl);
                          queryClient.invalidateQueries({
                            queryKey: ["/api/products"],
                          });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {stockFilter && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <span>
                        Stock:{" "}
                        {stockFilter === "inStock"
                          ? "In Stock"
                          : "Out of Stock"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => {
                          setStockFilter(null);
                          // Update URL
                          const searchParams = new URLSearchParams(
                            window.location.search
                          );
                          searchParams.delete("stock");
                          const newUrl = `${
                            window.location.pathname
                          }?${searchParams.toString()}`;
                          window.history.pushState({}, "", newUrl);
                          queryClient.invalidateQueries({
                            queryKey: ["/api/products"],
                          });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {sortBy !== "newest" && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <span>
                        Sorting:{" "}
                        {sortBy === "oldest"
                          ? "Oldest First"
                          : sortBy === "name-asc"
                          ? "Name (A-Z)"
                          : sortBy === "name-desc"
                          ? "Name (Z-A)"
                          : sortBy === "price-low"
                          ? "Price (Low to High)"
                          : sortBy === "price-high"
                          ? "Price (High to Low)"
                          : "Newest First"}
                      </span>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => {
                      // Clear all filters
                      setSearch("");
                      setSearchInput("");
                      setCategoryFilter(null);
                      setApprovalFilter(null);
                      setPriceRangeFilter([null, null]);
                      setStockFilter(null);
                      setSortBy("newest");

                      // Update URL - remove all filter parameters
                      const newUrl = window.location.pathname;
                      window.history.pushState({}, "", newUrl);

                      // Refetch products without filters
                      queryClient.invalidateQueries({
                        queryKey: ["/api/products"],
                      });
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>

            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {(approvalFilter || categoryFilter) && (
                    <Badge variant="secondary" className="ml-2 px-1">
                      {(approvalFilter ? 1 : 0) + (categoryFilter ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Filter Products</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="p-2">
                  <div className="mb-2 font-medium text-sm">
                    Approval Status
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant={
                        approvalFilter === null ? "secondary" : "outline"
                      }
                      size="sm"
                      onClick={() => setApprovalFilter(null)}
                      className="justify-start"
                    >
                      All
                    </Button>
                    <Button
                      variant={
                        approvalFilter === "approved" ? "secondary" : "outline"
                      }
                      size="sm"
                      onClick={() => setApprovalFilter("approved")}
                      className="justify-start"
                    >
                      <Check className="mr-2 h-4 w-4" /> Approved
                    </Button>
                    <Button
                      variant={
                        approvalFilter === "pending" ? "secondary" : "outline"
                      }
                      size="sm"
                      onClick={() => setApprovalFilter("pending")}
                      className="justify-start"
                    >
                      <Clock className="mr-2 h-4 w-4" /> Pending
                    </Button>
                    <Button
                      variant={
                        approvalFilter === "rejected" ? "secondary" : "outline"
                      }
                      size="sm"
                      onClick={() => setApprovalFilter("rejected")}
                      className="justify-start"
                    >
                      <X className="mr-2 h-4 w-4" /> Rejected
                    </Button>
                  </div>
                </div>

                <DropdownMenuSeparator />

                <div className="p-2">
                  <div className="mb-2 font-medium text-sm">Categories</div>
                  <div className="flex flex-col space-y-2 max-h-48 overflow-y-auto">
                    <Button
                      variant={
                        categoryFilter === null ? "secondary" : "outline"
                      }
                      size="sm"
                      onClick={() => setCategoryFilter(null)}
                      className="justify-start"
                    >
                      All Categories
                    </Button>
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={
                          categoryFilter === category ? "secondary" : "outline"
                        }
                        size="sm"
                        onClick={() => setCategoryFilter(category)}
                        className="justify-start"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="justify-center cursor-pointer"
                  onClick={() => {
                    setApprovalFilter(null);
                    setCategoryFilter(null);
                    setSearch("");
                  }}
                >
                  Clear All Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Action Buttons */}
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            {selectedProducts.length > 0 && (
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={() => setBulkDeleteConfirm(true)}
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Selected ({selectedProducts.length})
              </Button>
            )}
            <Button className="w-full sm:w-auto mr-2" asChild>
              <a href="/api/admin/products/export" download>
                <FileDown className="mr-2 h-4 w-4" />
                Export All Products
              </a>
            </Button>
            <Button className="w-full sm:w-auto" asChild>
              <Link href="/admin/products/add">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Skeleton className="h-4 w-4 rounded" />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-24 rounded-md" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : filteredProducts?.length ? (
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          selectedProducts.length === products.length &&
                          products.length > 0
                        }
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all products"
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Sub Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() =>
                            toggleProductSelection(product.id)
                          }
                          aria-label={`Select product ${product.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-500">
                        {product.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded bg-gray-100 relative overflow-hidden border">
                            {(() => {
                              // Determine which image source to use
                              let imageSrc = "";

                              try {
                                // Check for image_url (snake_case) first - this is what's in our data
                                if ((product as any).image_url) {
                                  imageSrc = (product as any).image_url;
                                }
                                // Check for imageUrl (camelCase)
                                else if (product.imageUrl) {
                                  imageSrc = product.imageUrl;
                                }
                                // Check for images array or string
                                else if (product.images) {
                                  // Handle array of images
                                  if (
                                    Array.isArray(product.images) &&
                                    product.images.length > 0
                                  ) {
                                    imageSrc = product.images[0];
                                  }
                                  // Handle string (single image URL)
                                  else if (typeof product.images === "string") {
                                    // Check if it's a JSON string
                                    if (
                                      product.images.startsWith("[") &&
                                      product.images.includes("]")
                                    ) {
                                      try {
                                        const parsedImages = JSON.parse(
                                          product.images
                                        );
                                        if (
                                          Array.isArray(parsedImages) &&
                                          parsedImages.length > 0
                                        ) {
                                          imageSrc = parsedImages[0];
                                        }
                                      } catch (e) {
                                        console.error(
                                          "Failed to parse image JSON:",
                                          e
                                        );
                                      }
                                    } else {
                                      // It's a single URL
                                      imageSrc = product.images;
                                    }
                                  }
                                }
                              } catch (err) {
                                console.error("Error processing image:", err);
                              }

                              // Always use category-specific fallback as default
                              const categoryImage = `../images/${(
                                product.category || "general"
                              ).toLowerCase()}.svg`;
                              const genericFallback =
                                "https://placehold.co/100?text=No+Image";

                              // If this is a Lelekart image, use our proxy
                              const useProxy =
                                imageSrc &&
                                (imageSrc.includes("flixcart.com") ||
                                  imageSrc.includes("lelekart.com"));
                              const displaySrc = useProxy
                                ? `/api/image-proxy?url=${encodeURIComponent(
                                    imageSrc
                                  )}&category=${encodeURIComponent(
                                    product.category || "general"
                                  )}`
                                : imageSrc || categoryImage;

                              return (
                                <img
                                  key={`product-image-${product.id}`}
                                  src={displaySrc}
                                  alt={product.name}
                                  className="object-contain h-full w-full"
                                  loading="lazy"
                                  onError={(e) => {
                                    console.error(
                                      "Failed to load image:",
                                      displaySrc
                                    );

                                    // If using proxy failed, try direct URL
                                    if (useProxy && imageSrc) {
                                      console.log(
                                        "Proxy failed, trying direct URL:",
                                        imageSrc
                                      );
                                      (e.target as HTMLImageElement).src =
                                        imageSrc;
                                      return;
                                    }

                                    // Try category-specific fallback
                                    (e.target as HTMLImageElement).src =
                                      categoryImage;

                                    // Add a second error handler for the category fallback
                                    (e.target as HTMLImageElement).onerror =
                                      () => {
                                        (e.target as HTMLImageElement).src =
                                          genericFallback;
                                        (e.target as HTMLImageElement).onerror =
                                          null; // Prevent infinite loop
                                      };
                                  }}
                                  style={{
                                    maxHeight: "48px",
                                    background: "#f9f9f9",
                                  }}
                                />
                              );
                            })()}
                          </div>
                          <div
                            className="font-medium hover:text-primary cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap max-w-xs"
                            onClick={() => setViewProduct(product)}
                          >
                            {search &&
                            searchField !== "description" &&
                            searchField !== "seller" &&
                            searchField !== "sku" ? (
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: product.name.replace(
                                    new RegExp(
                                      `(${search.replace(
                                        /[.*+?^${}()|[\]\\]/g,
                                        "\\$&"
                                      )})`,
                                      "gi"
                                    ),
                                    '<span class="bg-yellow-100 dark:bg-yellow-900 px-1 rounded-sm font-semibold">$1</span>'
                                  ),
                                }}
                              />
                            ) : (
                              product.name
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingProductId === product.id ? (
                          <div className="flex items-center gap-2">
                            <Select
                              value={editingCategory || product.category || ""}
                              onValueChange={(value) => {
                                setEditingCategory(value);
                                // Reset subcategory when category changes
                                setEditingSubcategoryId(null);
                                console.log(
                                  `Category changed to "${value}" for product ${product.id}, cleared subcategory selection`
                                );
                              }}
                            >
                              <SelectTrigger className="h-8 w-[150px]">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {allCategories?.map((category: any) => (
                                  <SelectItem
                                    key={category.id}
                                    value={category.name}
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <div className="flex space-x-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() =>
                                  updateCategoryMutation.mutate({
                                    productId: product.id,
                                    category:
                                      editingCategory || product.category || "",
                                    subcategoryId: editingSubcategoryId,
                                  })
                                }
                                disabled={updateCategoryMutation.isPending}
                              >
                                {updateCategoryMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setEditingProductId(null);
                                  setEditingCategory("");
                                  setEditingSubcategoryId(null);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:text-primary"
                            onClick={() => {
                              setEditingProductId(product.id);
                              setEditingCategory(product.category || "");
                              setEditingSubcategoryId(
                                product.subcategoryId || null
                              );
                            }}
                          >
                            {search &&
                            searchField !== "description" &&
                            searchField !== "seller" &&
                            searchField !== "sku" &&
                            searchField !== "name" ? (
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: (product.category || "").replace(
                                    new RegExp(
                                      `(${search.replace(
                                        /[.*+?^${}()|[\]\\]/g,
                                        "\\$&"
                                      )})`,
                                      "gi"
                                    ),
                                    '<span class="bg-yellow-100 dark:bg-yellow-900 px-1 rounded-sm font-semibold">$1</span>'
                                  ),
                                }}
                              />
                            ) : (
                              product.category
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingProductId === product.id ? (
                          <div className="flex items-center gap-2">
                            <Select
                              value={editingSubcategoryId?.toString() || "none"}
                              onValueChange={(value) =>
                                setEditingSubcategoryId(
                                  value && value !== "none"
                                    ? parseInt(value)
                                    : null
                                )
                              }
                              disabled={!editingCategory && !product.category}
                            >
                              <SelectTrigger className="h-8 w-[150px]">
                                <SelectValue placeholder="Select subcategory" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {/* Filter subcategories by product category */}
                                {(() => {
                                  // Get current category - use editing value if actively editing
                                  const currentCategory =
                                    editingProductId === product.id
                                      ? editingCategory || product.category
                                      : product.category;

                                  if (!currentCategory) {
                                    console.log(
                                      "No current category selected for product",
                                      product.id
                                    );
                                    return [];
                                  }

                                  // Find category object to get ID
                                  const categoryObj = allCategories?.find(
                                    (c: { id: number; name: string }) =>
                                      c.name === currentCategory
                                  );

                                  if (!categoryObj) {
                                    console.log(
                                      `Category object not found for "${currentCategory}"`
                                    );
                                    return [];
                                  }

                                  // Log debugging info for the Home product ID 4582
                                  if (product.id === 4582) {
                                    console.log(
                                      "-------------------------------"
                                    );
                                    console.log(
                                      `Filtering subcategories for product ${product.id} (${product.name})`
                                    );
                                    console.log(
                                      `Current category: ${currentCategory} (ID: ${categoryObj.id})`
                                    );
                                    console.log(
                                      `Total subcategories to filter: ${productSubcategories.length}`
                                    );
                                    console.log(
                                      "-------------------------------"
                                    );
                                  }

                                  // Filter subcategories to only those matching this category's ID
                                  // We'll make a new fetch request for this specific category to ensure proper filtering

                                  // This was causing an infinite render loop - removing setSelectedProduct call
                                  // We can use the product.id directly for debugging instead
                                  // DO NOT call setState functions during render!

                                  // Since we already have all subcategories loaded with productSubcategories,
                                  // we should filter them properly based on the categoryId
                                  const filteredSubcategories =
                                    productSubcategories.filter(
                                      (subcategory: Subcategory) => {
                                        // IMPORTANT: Convert both values to numbers before comparison
                                        // This fixes the bug where string comparison fails (e.g., "3" !== 3)
                                        // Also handle null/undefined categoryId values
                                        if (!subcategory.categoryId) {
                                          return false; // Filter out subcategories with no categoryId
                                        }

                                        const subcategoryCategoryId = Number(
                                          subcategory.categoryId
                                        );
                                        const categoryObjId = Number(
                                          categoryObj.id
                                        );

                                        // Strict equality check
                                        const isMatch =
                                          subcategoryCategoryId ===
                                          categoryObjId;

                                        // No longer need to log subcategory matches

                                        return isMatch;
                                      }
                                    );

                                  // If no subcategories are found for this category, we'll display just "None" option
                                  // (shown in the JSX with filteredSubcategories.length === 0 condition)

                                  // No longer need to debug Home category subcategories

                                  // No need to track category matches for debug purposes

                                  // If there are no subcategories for this category, return only the "None" option
                                  // The "None" option is already included in the SelectContent
                                  if (filteredSubcategories.length === 0) {
                                    console.log(
                                      "No subcategories found for this category, returning empty array (None option already exists in JSX)"
                                    );
                                    return [];
                                  }

                                  return filteredSubcategories;
                                })().map(
                                  (subcategory: {
                                    id: number | string;
                                    name: string;
                                  }) => (
                                    <SelectItem
                                      key={subcategory.id.toString()}
                                      value={subcategory.id.toString()}
                                    >
                                      {subcategory.name}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                            <div className="flex space-x-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() =>
                                  updateCategoryMutation.mutate({
                                    productId: product.id,
                                    category:
                                      editingCategory || product.category || "",
                                    subcategoryId: editingSubcategoryId,
                                  })
                                }
                                disabled={updateCategoryMutation.isPending}
                              >
                                {updateCategoryMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setEditingProductId(null);
                                  setEditingCategory("");
                                  setEditingSubcategoryId(null);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:text-primary"
                            onClick={() => {
                              setEditingProductId(product.id);
                              setEditingCategory(product.category || "");
                              setEditingSubcategoryId(
                                product.subcategoryId || null
                              );
                            }}
                          >
                            {(() => {
                              // Find the matching subcategory from productSubcategories
                              // Make sure we're using correct number comparison
                              const subcategoryMatch =
                                productSubcategories?.find(
                                  (s: Subcategory) =>
                                    Number(s.id) ===
                                    Number(product.subcategoryId)
                                );

                              // Additional debug logging
                              if (product.id === 4470) {
                                console.log(
                                  "Subcategory display - product subcategoryId:",
                                  product.subcategoryId
                                );
                                console.log(
                                  "All subcategories available:",
                                  productSubcategories?.map(
                                    (s: Subcategory) => ({
                                      id: s.id,
                                      name: s.name,
                                      categoryId: s.categoryId,
                                    })
                                  )
                                );
                              }

                              // For debugging purposes - helps trace subcategory issues
                              if (product.id === 4470) {
                                console.log(
                                  `Product ${product.id} subcategoryId:`,
                                  product.subcategoryId,
                                  typeof product.subcategoryId
                                );
                                console.log(
                                  `Found subcategory for product ${product.id}:`,
                                  subcategoryMatch
                                );
                                console.log(
                                  `Total subcategories:`,
                                  productSubcategories?.length
                                );
                              }

                              // Display subcategory name if found
                              return subcategoryMatch
                                ? subcategoryMatch.name
                                : product.subcategoryId
                                ? `ID: ${product.subcategoryId}`
                                : "-";
                            })()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>₹{Number(product.price).toFixed(2)}</TableCell>
                      <TableCell>
                        {product.approved !== undefined ? (
                          <Badge
                            className={
                              product.approved
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : product.rejected
                                ? "bg-red-100 text-red-800 hover:bg-red-100"
                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                            }
                          >
                            {product.approved
                              ? "Approved"
                              : product.rejected
                              ? "Rejected"
                              : "Pending"}
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {search && searchField === "seller" ? (
                          <span
                            dangerouslySetInnerHTML={{
                              __html: (
                                product.seller_name ||
                                product.seller_username ||
                                (product.sellerId
                                  ? `Seller #${product.sellerId}`
                                  : "Unknown Seller")
                              ).replace(
                                new RegExp(
                                  `(${search.replace(
                                    /[.*+?^${}()|[\]\\]/g,
                                    "\\$&"
                                  )})`,
                                  "gi"
                                ),
                                '<span class="bg-yellow-100 dark:bg-yellow-900 px-1 rounded-sm font-semibold">$1</span>'
                              ),
                            }}
                          />
                        ) : (
                          product.seller_name ||
                          product.seller_username ||
                          (product.sellerId
                            ? `Seller #${product.sellerId}`
                            : "Unknown Seller")
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                          onClick={() => setAssignSellerProduct(product)}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Assign
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/product/${product.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/products/edit/${product.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Product
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setAssignSellerProduct(product)}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              Assign Seller
                            </DropdownMenuItem>
                            {!product.approved && (
                              <DropdownMenuItem
                                onClick={() => handleApproveProduct(product)}
                                disabled={approveMutation.isPending}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Approve Product
                              </DropdownMenuItem>
                            )}

                            {!product.approved && (
                              <DropdownMenuItem
                                onClick={() => handleRejectProduct(product)}
                                disabled={rejectMutation.isPending}
                                className="text-red-600"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Reject Product
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteClick(product)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-md border bg-white p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold">No products found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search || categoryFilter || approvalFilter
                  ? "Try adjusting your search or filters."
                  : "Add your first product to get started."}
              </p>
              {search || categoryFilter || approvalFilter ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter(null);
                    setApprovalFilter(null);
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/admin/products/add">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Link>
                </Button>
              )}
            </div>
          )}

          {filteredProducts?.length ? (
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  Showing {filteredProducts.length} of {pagination.total}{" "}
                  products
                </span>
                <Select
                  value={String(itemsPerPage)}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1); // Reset to first page when changing page size
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Product Details Dialog */}
      <Dialog
        open={viewProduct !== null}
        onOpenChange={(open) => !open && setViewProduct(null)}
      >
        {viewProduct && (
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewProduct.name}</DialogTitle>
              <DialogDescription>
                Product ID: {viewProduct.id} | Added by{" "}
                {viewProduct.seller_name ||
                  viewProduct.seller_username ||
                  (viewProduct.sellerId
                    ? `Seller #${viewProduct.sellerId}`
                    : "Unknown Seller")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid md:grid-cols-2 gap-6 mt-4">
              {/* Product Images */}
              <div>
                <ProductImageGallery
                  imageUrl={viewProduct.imageUrl}
                  additionalImages={viewProduct.images}
                  productName={viewProduct.name}
                />
              </div>

              {/* Product Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Product ID
                  </h3>
                  <p className="font-mono text-sm">{viewProduct.id}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Price</h3>
                  <p className="text-xl font-bold">
                    ₹{Number(viewProduct.price).toFixed(2)}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Category
                  </h3>
                  <p>{viewProduct.category}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <Badge
                    className={
                      viewProduct.approved
                        ? "bg-green-100 text-green-800"
                        : viewProduct.rejected
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {viewProduct.approved
                      ? "Approved"
                      : viewProduct.rejected
                      ? "Rejected"
                      : "Pending Approval"}
                  </Badge>
                </div>

                {viewProduct.stock !== undefined && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Stock</h3>
                    <p>{viewProduct.stock} units</p>
                  </div>
                )}

                {viewProduct.brand && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Brand</h3>
                    <p>{viewProduct.brand}</p>
                  </div>
                )}

                {viewProduct.color && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Color</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline">{viewProduct.color}</Badge>
                    </div>
                  </div>
                )}

                {viewProduct.size && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Size</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline">{viewProduct.size}</Badge>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Description
                  </h3>
                  <p className="text-sm whitespace-pre-line">
                    {viewProduct.description}
                  </p>
                </div>

                {viewProduct.specifications && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Specifications
                    </h3>
                    <p className="text-sm whitespace-pre-line">
                      {viewProduct.specifications}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setViewProduct(null)}>
                Close
              </Button>

              {/* Show approve/reject buttons only for pending products */}
              {viewProduct && !viewProduct.approved && (
                <>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      handleRejectProduct(viewProduct);
                      setViewProduct(null);
                    }}
                    disabled={rejectMutation.isPending}
                  >
                    {rejectMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Reject Product
                  </Button>

                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleApproveProduct(viewProduct);
                      setViewProduct(null);
                    }}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Approve Product
                  </Button>
                </>
              )}

              <Button asChild>
                <Link
                  href={`/admin/products/edit/${viewProduct.id}`}
                  onClick={() => setViewProduct(null)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Product
                </Link>
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirm({
              open: false,
              productId: null,
              productName: "",
            });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteConfirm.productName}
              &quot;?
              <br />
              <br />
              This action cannot be undone and will permanently remove the
              product from your store.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={bulkDeleteConfirm}
        onOpenChange={(open) => {
          if (!open) {
            setBulkDeleteConfirm(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Products</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedProducts.length}{" "}
              products?
              <br />
              <br />
              This action cannot be undone and will permanently remove these
              products from your store.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkDeleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete All Selected"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Seller Dialog */}
      <Dialog
        open={assignSellerProduct !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAssignSellerProduct(null);
            setSelectedSellerId("");
            setSellerSearchTerm("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Product to a Different Seller</DialogTitle>
            <DialogDescription>
              Reassign "{assignSellerProduct?.name}" to another seller.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="seller-search">Search Sellers</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="seller-search"
                  type="search"
                  placeholder="Search by name or email..."
                  className="pl-9"
                  value={sellerSearchTerm}
                  onChange={(e) => setSellerSearchTerm(e.target.value)}
                />
              </div>

              <Label htmlFor="seller-select" className="mt-4">
                Select Seller
              </Label>
              <Select
                value={selectedSellerId}
                onValueChange={setSelectedSellerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a seller" />
                </SelectTrigger>
                <SelectContent>
                  {sellers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Loading sellers...
                    </div>
                  ) : (
                    sellers
                      .filter(
                        (seller) =>
                          !sellerSearchTerm ||
                          (seller.name?.toLowerCase() || "").includes(
                            sellerSearchTerm.toLowerCase()
                          ) ||
                          (seller.username.toLowerCase() || "").includes(
                            sellerSearchTerm.toLowerCase()
                          ) ||
                          (seller.email.toLowerCase() || "").includes(
                            sellerSearchTerm.toLowerCase()
                          )
                      )
                      .map((seller) => (
                        <SelectItem
                          key={seller.id}
                          value={seller.id.toString()}
                        >
                          {seller.name || seller.username} ({seller.email})
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>

              {/* Current seller information */}
              {assignSellerProduct && (
                <div className="mt-4 p-2 bg-muted rounded-md">
                  <p className="text-sm font-medium">Current Seller</p>
                  <p className="text-sm">
                    {assignSellerProduct.seller_name ||
                      assignSellerProduct.seller_username ||
                      (assignSellerProduct.sellerId
                        ? `Seller #${assignSellerProduct.sellerId}`
                        : "Unknown Seller")}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleAssignSeller}
              disabled={assignSellerMutation.isPending || !selectedSellerId}
            >
              {assignSellerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reassigning...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Reassign Product
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
