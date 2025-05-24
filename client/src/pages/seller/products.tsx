import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "wouter";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { Pagination } from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Layers,
  Search,
  Plus,
  Filter,
  Edit,
  FileEdit,
  Trash,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product as SchemaProduct } from "@shared/schema";

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

import { useToast } from "@/hooks/use-toast";

// Define a ProductWithSKU interface that extends the base Product type
interface Product extends Omit<SchemaProduct, "sku"> {
  sku?: string | null;
  image?: string;
  image_url?: string; // Add snake_case version from API
  subcategory?: string | null;
}
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ProductImage } from "@/components/product/product-image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SellerProductsPage() {
  // State for deletion dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Try to use context first if available
  const authContext = useContext(AuthContext);

  // Get user data from direct API if context is not available
  const { data: apiUser } = useQuery<any>({
    queryKey: ["/api/user"],
    enabled: !authContext?.user,
  });

  // Use context user if available, otherwise use API user
  const user = authContext?.user || apiUser;

  // State for pagination and search
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // State for category and subcategory editing
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<string>("");
  const [editingSubcategory, setEditingSubcategory] = useState<string>("");

  // Fetch all categories
  const { data: categoriesData } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) {
        throw new Error("Failed to fetch categories");
      }
      return res.json();
    },
  });

  // Fetch ALL subcategories for client-side filtering by category
  const { data: subcategoriesData } = useQuery({
    queryKey: ["/api/subcategories/all"],
    queryFn: async () => {
      const res = await fetch("/api/subcategories/all");
      if (!res.ok) {
        throw new Error("Failed to fetch subcategories");
      }
      return await res.json();
    },
    // Always fetch all subcategories
    enabled: !!categoriesData,
  });

  // Update product category/subcategory mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      productId,
      category,
      subcategory,
    }: {
      productId: number;
      category: string;
      subcategory: string;
    }) => {
      console.log(
        "Updating product",
        productId,
        "with category:",
        category,
        "subcategory:",
        subcategory
      );

      // Get the subcategory ID if a subcategory is selected
      let subcategoryId = null;
      if (subcategory && subcategory !== "_none") {
        // Find matching subcategory to get its ID
        const subcategoriesResponse = await fetch(
          `/api/subcategories?category=${encodeURIComponent(category)}`
        );
        const subcategoriesData = await subcategoriesResponse.json();
        const matchingSubcategory = subcategoriesData.subcategories.find(
          (sub: any) => sub.name === subcategory
        );
        subcategoryId = matchingSubcategory?.id || null;
      }

      console.log("Resolved subcategoryId:", subcategoryId);

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productData: {
            category,
            subcategoryId, // Send subcategoryId instead of subcategory string
            __preserveVariants: true, // Add flag to preserve existing variants
          },
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update product");
      }

      // Get the updated product directly to confirm changes
      const updatedProduct = await response.json();
      console.log("Updated product response:", updatedProduct);

      // Add subcategory name to the returned object for displaying in UI
      return {
        ...updatedProduct,
        subcategory: subcategory === "_none" ? null : subcategory,
      };
    },
    onSuccess: (data) => {
      toast({
        title: "Product updated",
        description: "Category and subcategory have been updated successfully.",
      });

      // Reset editing state
      setEditingProductId(null);
      setEditingCategory("");
      setEditingSubcategory("");

      // Update product data in cache directly with seller ID in the query key
      queryClient.setQueryData(
        ["/api/seller/products", user?.id],
        (oldData: any) => {
          if (!oldData || !oldData.products) return oldData;

          return {
            ...oldData,
            products: oldData.products.map((p: any) =>
              p.id === data.id
                ? {
                    ...p,
                    category: data.category,
                    subcategory: data.subcategory,
                  }
                : p
            ),
          };
        }
      );

      // Also invalidate the query to ensure we get fresh data on next load
      // Use the sellerId in the queryKey to ensure proper cache invalidation for this seller only
      queryClient.invalidateQueries({
        queryKey: ["/api/seller/products", user?.id],
        exact: false,
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

  // Fetch products for the logged-in seller with pagination
  const { data, isLoading } = useQuery({
    // Include sellerId directly in the queryKey to ensure proper cache isolation between sellers
    queryKey: [
      "/api/seller/products",
      user?.id,
      {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        includeDrafts: true,
      },
    ],
    queryFn: async ({ queryKey }) => {
      const [_, sellerId, params] = queryKey as [
        string,
        number,
        {
          page: number;
          limit: number;
          search: string;
          includeDrafts: boolean;
        }
      ];

      let url = `/api/seller/products?page=${params.page}&limit=${params.limit}&includeDrafts=true`;

      // Add search parameter if it exists
      if (params.search) {
        url += `&search=${encodeURIComponent(params.search)}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }
      return res.json();
    },
    enabled: !!user?.id,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    refetchOnMount: true, // Always refetch when the component mounts
    refetchOnWindowFocus: true, // Refetch when window gets focus
  });

  // Log the API response structure to debug pagination
  useEffect(() => {
    if (data) {
      console.log("API response structure:", data);
    }
  }, [data]);

  // Extract products and pagination from response
  const [enhancedProducts, setEnhancedProducts] = useState<any[]>([]);
  const rawProducts = data?.products || [];
  // For the seller products API, pagination data is at the top level, not in a pagination object
  const pagination = {
    currentPage: data?.currentPage || 1,
    totalPages: data?.totalPages || 1,
    total: data?.total || 0,
  };

  // Get subcategory names for products that have subcategoryId/subcategory_id
  useEffect(() => {
    // Skip if no products
    if (!rawProducts.length) {
      return;
    }

    console.log("Raw products received:", rawProducts);

    // Function to get subcategory name by ID
    const fetchSubcategoryName = async (subcategoryId: number) => {
      try {
        const response = await fetch(`/api/subcategories/${subcategoryId}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`Fetched subcategory ${subcategoryId}:`, data);
          return data.name;
        }
      } catch (error) {
        console.error("Error fetching subcategory:", error);
      }
      return null;
    };

    // Process all products at once with less nesting
    const processProducts = async () => {
      // Create mapping of subcategoryId to subcategory name
      const subcategoryNames: Record<number, string> = {};

      // Handle both potential property names (subcategoryId and subcategory_id)
      const productsWithSubcategoryIds = rawProducts.filter((p) => {
        // Access potential property formats
        const id = p.subcategoryId || p.subcategory_id;
        return id !== undefined && id !== null;
      });

      console.log("Products with subcategory IDs:", productsWithSubcategoryIds);

      // Get all subcategory IDs we need to fetch, handle different property names
      const neededSubcategoryIds = productsWithSubcategoryIds
        .map((p) => {
          return p.subcategoryId || p.subcategory_id;
        })
        .filter((id) => id !== undefined && id !== null);

      console.log("Needed subcategory IDs:", neededSubcategoryIds);

      // Fetch names for all needed subcategories
      for (const id of neededSubcategoryIds) {
        if (!subcategoryNames[id]) {
          const name = await fetchSubcategoryName(id);
          if (name) {
            subcategoryNames[id] = name;
            console.log(`Mapped subcategory ID ${id} to name "${name}"`);
          }
        }
      }

      // Apply subcategory names to products
      const updatedProducts = rawProducts.map((product) => {
        // Get the subcategory ID (handle both property naming conventions)
        const subcategoryId = product.subcategoryId || product.subcategory_id;

        if (subcategoryId && subcategoryNames[subcategoryId]) {
          return {
            ...product,
            subcategory: subcategoryNames[subcategoryId],
          };
        }
        return product;
      });

      console.log("Enhanced products with subcategory names:", updatedProducts);
      setEnhancedProducts(updatedProducts);
    };

    processProducts();
  }, [rawProducts]);

  const fetchedProducts =
    enhancedProducts.length > 0 ? enhancedProducts : rawProducts;

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: number) => {
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
        title: "Product deleted",
        description: "The product has been removed from your inventory.",
      });

      // Invalidate products query to refresh the list with sellerId for proper cache targeting
      queryClient.invalidateQueries({
        queryKey: ["/api/seller/products", user?.id],
        exact: false,
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete product",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      const response = await fetch(`/api/products/bulk-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: productIds }), // Changed from productIds to ids to match the API endpoint
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete products");
      }

      return true;
    },
    onSuccess: () => {
      toast({
        title: "Products deleted",
        description: `${selectedProducts.length} products have been removed from your inventory.`,
      });

      // Invalidate products query to refresh the list with sellerId for proper cache targeting
      queryClient.invalidateQueries({
        queryKey: ["/api/seller/products", user?.id],
        exact: false,
      });
      setIsBulkDeleteDialogOpen(false);
      setSelectedProducts([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete products",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle delete confirmation
  const handleDeleteProduct = () => {
    if (selectedProductId) {
      deleteMutation.mutate(selectedProductId);
    }
  };

  // Handle bulk delete confirmation
  const handleBulkDeleteProducts = () => {
    if (selectedProducts.length > 0) {
      bulkDeleteMutation.mutate(selectedProducts);
    }
  };

  // Open delete confirmation dialog
  const confirmDelete = (productId: number) => {
    setSelectedProductId(productId);
    setIsDeleteDialogOpen(true);
  };

  // Open bulk delete confirmation dialog
  const confirmBulkDelete = () => {
    if (selectedProducts.length > 0) {
      setIsBulkDeleteDialogOpen(true);
    } else {
      toast({
        title: "No products selected",
        description: "Please select at least one product to delete.",
        variant: "destructive",
      });
    }
  };

  // Always use real fetched products
  const products = fetchedProducts;

  return (
    <SellerDashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Product Management</h1>
            <p className="text-muted-foreground">
              Manage your product listings
            </p>
          </div>
          <div className="flex gap-3">
            <Button className="flex items-center gap-2" asChild>
              <Link href="/seller/products/add">
                <Plus className="h-4 w-4" />
                Add Product
              </Link>
            </Button>
            {/* Bulk upload functionality removed */}
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                // Show toast notification
                toast({
                  title: "Exporting products",
                  description:
                    "Your product data is being prepared for download...",
                });

                // Create a form element to handle the download
                const form = document.createElement("form");
                form.method = "GET";
                form.action = "/api/seller/products/export";
                document.body.appendChild(form);
                form.submit();
                document.body.removeChild(form);
              }}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Product Inventory</CardTitle>
            <CardDescription>
              You have {data?.total || 0} products in your inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    // Reset to first page when searching
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={confirmBulkDelete}
                  disabled={
                    selectedProducts.length === 0 ||
                    bulkDeleteMutation.isPending
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  {bulkDeleteMutation.isPending
                    ? "Deleting..."
                    : "Delete Selected"}
                  {selectedProducts.length > 0 &&
                    ` (${selectedProducts.length})`}
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={
                          products.length > 0 &&
                          selectedProducts.length === products.length
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Select all products
                            setSelectedProducts(
                              products.map((p: Product) => p.id)
                            );
                          } else {
                            // Deselect all products
                            setSelectedProducts([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subcategory</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: Product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProducts([
                                ...selectedProducts,
                                product.id,
                              ]);
                            } else {
                              setSelectedProducts(
                                selectedProducts.filter(
                                  (id) => id !== product.id
                                )
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <ProductImage product={product} size="small" />
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>₹{product.price.toLocaleString()}</TableCell>
                      <TableCell>
                        <span
                          className={
                            product.stock < 20 ? "text-red-500 font-medium" : ""
                          }
                        >
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        {editingProductId === product.id ? (
                          <div className="space-y-2">
                            <Select
                              value={editingCategory || product.category}
                              onValueChange={(value) => {
                                setEditingCategory(value);
                                setEditingSubcategory(""); // Reset subcategory when category changes
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categoriesData?.map(
                                  (category: { id: number; name: string }) => (
                                    <SelectItem
                                      key={category.id}
                                      value={category.name}
                                    >
                                      {category.name}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:text-primary"
                            onClick={() => {
                              setEditingProductId(product.id);
                              setEditingCategory(product.category || "");
                              setEditingSubcategory(product.subcategory || "");
                            }}
                          >
                            {product.category || "-"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingProductId === product.id ? (
                          <div className="space-y-2">
                            <Select
                              value={editingSubcategory}
                              onValueChange={setEditingSubcategory}
                              disabled={!editingCategory}
                            >
                              <SelectTrigger className="h-8 w-full">
                                <SelectValue
                                  placeholder={
                                    !editingCategory
                                      ? "Select category first"
                                      : "Select subcategory"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="_none">None</SelectItem>
                                {(() => {
                                  // Get current category
                                  const currentCategory = editingCategory || "";

                                  if (!currentCategory) {
                                    console.log(
                                      "No current category selected, cannot filter subcategories"
                                    );
                                    return [];
                                  }

                                  // Find category object to get ID
                                  const categoryObj = categoriesData?.find(
                                    (c: any) => c.name === currentCategory
                                  );

                                  if (!categoryObj) {
                                    console.log(
                                      `Category "${currentCategory}" not found in categories list`
                                    );
                                    return [];
                                  }

                                  // Filter subcategories to only those matching this category's ID
                                  const allSubcategories =
                                    subcategoriesData || [];
                                  const filteredSubcategories =
                                    allSubcategories.filter(
                                      (subcategory: any) => {
                                        return (
                                          subcategory.categoryId ===
                                          categoryObj.id
                                        );
                                      }
                                    );

                                  // Limited logging to avoid console spam
                                  console.log(
                                    `Category "${currentCategory}" (ID: ${categoryObj.id}): Found ${filteredSubcategories.length} matching subcategories`
                                  );

                                  // If there are no subcategories for this category, return empty array
                                  // The "None" option is already included in the SelectContent
                                  if (filteredSubcategories.length === 0) {
                                    console.log(
                                      "No subcategories found for this category"
                                    );
                                    return [];
                                  }

                                  return filteredSubcategories.map(
                                    (subcategory: {
                                      id: number;
                                      name: string;
                                    }) => (
                                      <SelectItem
                                        key={subcategory.id}
                                        value={subcategory.name}
                                      >
                                        {subcategory.name}
                                      </SelectItem>
                                    )
                                  );
                                })()}
                              </SelectContent>
                            </Select>
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                className="h-7 px-2 py-1 text-xs"
                                onClick={() => {
                                  // Save the changes
                                  updateCategoryMutation.mutate({
                                    productId: product.id,
                                    category: editingCategory,
                                    subcategory:
                                      editingSubcategory === "_none"
                                        ? ""
                                        : editingSubcategory,
                                  });
                                }}
                                disabled={updateCategoryMutation.isPending}
                              >
                                {updateCategoryMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    Saving...
                                  </>
                                ) : (
                                  "Save"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 py-1 text-xs"
                                onClick={() => {
                                  // Cancel editing
                                  setEditingProductId(null);
                                  setEditingCategory("");
                                  setEditingSubcategory("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:text-primary"
                            onClick={() => {
                              setEditingProductId(product.id);
                              setEditingCategory(product.category || "");
                              setEditingSubcategory(
                                product.subcategory
                                  ? product.subcategory
                                  : "_none"
                              );
                            }}
                          >
                            {product.subcategory || "-"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.isDraft ? (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200"
                          >
                            <FileEdit className="h-3 w-3 mr-1" />
                            Draft
                          </Badge>
                        ) : product.approved ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <Link
                              href={`/seller/products/preview/${product.id}`}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Preview</span>
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <Link
                              href={
                                product.isDraft
                                  ? `/seller/drafts/edit/${product.id}`
                                  : `/seller/products/edit/${product.id}`
                              }
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => confirmDelete(product.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Showing {products.length} of {pagination.total} products
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
              onClick={() => setCurrentPage(currentPage - 1)}
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
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedProducts.length} products?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected products and remove them from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteProducts}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Selected"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SellerDashboardLayout>
  );
}
