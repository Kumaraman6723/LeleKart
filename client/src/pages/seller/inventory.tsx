import React, { useState, useEffect } from "react";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice } from "@/lib/utils";
import { 
  Search, 
  Filter, 
  Package, 
  Box, 
  AlertTriangle, 
  Check,
  CheckCircle2, 
  ShoppingCart, 
  Plus, 
  Tag, 
  Layers,
  Loader2,
  Download,
  Upload,
  RefreshCw,
  Settings,
  X
} from "lucide-react";

export default function InventoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [editingProduct, setEditingProduct] = useState<null | number>(null);
  const [editingCategory, setEditingCategory] = useState<string>("");
  const [editingSubcategory, setEditingSubcategory] = useState<string>("");

  // Fetch product categories to use in filters
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) {
        throw new Error('Failed to fetch categories');
      }
      return res.json();
    },
  });
  
  // Fetch subcategories based on selected category
  const { data: subcategories } = useQuery({
    queryKey: ['/api/subcategories', categoryFilter],
    queryFn: async () => {
      // If "all" is selected, don't filter by category
      const categoryParam = categoryFilter !== 'all' 
        ? `?categoryId=${categories?.find((c: { id: number, name: string }) => c.name === categoryFilter)?.id}` 
        : '';
        
      const res = await fetch(`/api/subcategories${categoryParam}`);
      if (!res.ok) {
        throw new Error('Failed to fetch subcategories');
      }
      const data = await res.json();
      console.log(`Fetched ${data.subcategories?.length || 0} subcategories for category filter "${categoryFilter}"`);
      return data.subcategories || [];
    },
    enabled: !!categories && categoryFilter !== 'all',
  });

  // Fetch seller products with filters
  // Mutation to update product category and subcategory
  const updateProductMutation = useMutation({
    mutationFn: async ({ productId, category, subcategory }: { productId: number, category: string, subcategory: string }) => {
      const response = await apiRequest(
        'PATCH',
        `/api/seller/products/${productId}`,
        { category, subcategory }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product updated",
        description: "Product category and subcategory have been updated successfully",
        variant: "default",
      });
      setEditingProduct(null);
      // Invalidate seller-specific queries to ensure proper cache isolation
      queryClient.invalidateQueries({ 
        queryKey: ['/api/seller/products', user?.id],
        exact: false 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update product category",
        variant: "destructive",
      });
    }
  });

  // Function to save category changes
  const saveProductCategoryChanges = () => {
    if (!editingProduct) return;
    
    updateProductMutation.mutate({
      productId: editingProduct,
      category: editingCategory,
      subcategory: editingSubcategory
    });
  };

  const { data: productsData, isLoading: productsLoading, refetch } = useQuery({
    queryKey: ['/api/seller/products', page, limit, searchQuery, categoryFilter, stockFilter, subcategoryFilter],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      if (categoryFilter && categoryFilter !== 'all') {
        queryParams.append('category', categoryFilter);
      }
      
      if (subcategoryFilter && subcategoryFilter !== 'all') {
        queryParams.append('subcategory', subcategoryFilter);
      }
      
      if (stockFilter && stockFilter !== 'all') {
        queryParams.append('stock', stockFilter);
      }
      
      const response = await apiRequest(
        'GET', 
        `/api/seller/products?${queryParams.toString()}`
      );
      
      return response.json();
    },
  });

  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;
  
  // Debug: Log product data to understand structure
  console.log("All Products Data:", products);
  if (products.length > 0) {
    console.log("First Product:", products[0]);
    console.log("Image Data:", {
      imageUrl: products[0].imageUrl,
      images: products[0].images,
      mainImage: products[0].mainImage
    });
  }

  return (
    <SellerDashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">Manage your product inventory and stock levels</p>
          </div>
          <div className="flex gap-3">
            {/* Bulk upload functionality removed */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              size="sm"
              asChild
            >
              <Link href="/seller/products/add">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Filter Products</CardTitle>
            <CardDescription>
              Use the filters below to find specific products in your inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="search" className="mb-2 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search products..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="category" className="mb-2 block">Category</Label>
                <Select 
                  value={categoryFilter} 
                  onValueChange={(value) => {
                    setCategoryFilter(value);
                    // Reset subcategory filter when category changes
                    setSubcategoryFilter("all");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories?.map((category: { id: number, name: string }) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subcategory" className="mb-2 block">Subcategory</Label>
                <Select 
                  value={subcategoryFilter} 
                  onValueChange={setSubcategoryFilter}
                  disabled={categoryFilter === 'all'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={categoryFilter === 'all' ? "Select a category first" : "All Subcategories"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subcategories</SelectItem>
                    {subcategories?.map((subcategory: { id: number, name: string }) => (
                      <SelectItem key={subcategory.id} value={subcategory.name}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="stock" className="mb-2 block">Stock Status</Label>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock (≤ 10)</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("all");
                    setSubcategoryFilter("all");
                    setStockFilter("all");
                    setPage(1);
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-white rounded-md shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Subcategory</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {productsLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      Loading products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No products found matching your filters
                    </td>
                  </tr>
                ) : (
                  products.map((product: any) => (
                    <tr key={product.id} className="hover:bg-muted/25">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-100 border">
                            {(() => {
                              // Parse images if it's a JSON string
                              let imagesList: string[] = [];
                              
                              if (product.images) {
                                try {
                                  if (typeof product.images === 'string') {
                                    // Try to parse the JSON string
                                    imagesList = JSON.parse(product.images);
                                  } else if (Array.isArray(product.images)) {
                                    imagesList = product.images;
                                  }
                                } catch (error) {
                                  console.error("Error parsing product images:", error);
                                }
                              }
                              
                              // Use the first image from the parsed list, fallback to imageUrl, or show no image message
                              if (imagesList && imagesList.length > 0) {
                                return (
                                  <img 
                                    src={imagesList[0]} 
                                    alt={product.name}
                                    className="h-10 w-10 object-cover rounded"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image';
                                    }}
                                  />
                                );
                              } else if (product.imageUrl) {
                                return (
                                  <img 
                                    src={product.imageUrl} 
                                    alt={product.name}
                                    className="h-10 w-10 object-cover rounded"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image';
                                    }}
                                  />
                                );
                              } else {
                                return (
                                  <div className="h-10 w-10 flex items-center justify-center text-muted-foreground text-xs">
                                    No Image
                                  </div>
                                );
                              }
                            })()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {product.sku || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {editingProduct === product.id ? (
                          <div className="space-y-2">
                            <Select 
                              value={editingCategory || product.category} 
                              onValueChange={(value) => {
                                setEditingCategory(value);
                                setEditingSubcategory(""); // Reset subcategory when category changes
                              }}
                            >
                              <SelectTrigger className="h-8 w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {categories?.map((category: { id: number, name: string }) => (
                                  <SelectItem key={category.id} value={category.name}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {editingProduct === product.id && (
                              <div className="flex justify-between space-x-1 mt-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-xs h-6 px-2"
                                  onClick={() => {
                                    setEditingProduct(null);
                                    setEditingCategory("");
                                    setEditingSubcategory("");
                                  }}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-xs h-6 px-2 text-primary"
                                  onClick={saveProductCategoryChanges}
                                  disabled={updateProductMutation.isPending}
                                >
                                  {updateProductMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <Check className="h-3 w-3 mr-1" />
                                  )}
                                  Save
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer hover:text-primary"
                            onClick={() => {
                              setEditingProduct(product.id);
                              setEditingCategory(product.category);
                              setEditingSubcategory(product.subcategory || "");
                            }}
                          >
                            {product.category}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {editingProduct === product.id ? (
                          <Select 
                            value={editingSubcategory} 
                            onValueChange={setEditingSubcategory}
                            disabled={!editingCategory}
                          >
                            <SelectTrigger className="h-8 w-full">
                              <SelectValue placeholder="Select subcategory" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {subcategories?.filter((sub: { id: number, name: string, categoryId: number }) => {
                                // Find the category ID that matches the current editing category
                                const categoryId = categories?.find((c: { id: number, name: string }) => c.name === editingCategory)?.id;
                                return sub.categoryId === categoryId;
                              }).map((subcategory: { id: number, name: string }) => (
                                <SelectItem key={subcategory.id} value={subcategory.name}>
                                  {subcategory.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div 
                            className="cursor-pointer hover:text-primary"
                            onClick={() => {
                              setEditingProduct(product.id);
                              setEditingCategory(product.category);
                              setEditingSubcategory(product.subcategory || "");
                            }}
                          >
                            {product.subcategory || "-"}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 font-medium">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {product.stockQuantity <= 0 ? (
                          <span className="text-red-600 font-medium">Out of stock</span>
                        ) : product.stockQuantity <= 10 ? (
                          <span className="text-amber-600 font-medium">{product.stockQuantity} left</span>
                        ) : (
                          <span className="text-green-600 font-medium">{product.stockQuantity} in stock</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {product.approved ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link href={`/seller/products/edit/${product.id}`}>
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link href={`/product/${product.id}`}>
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
              <div className="flex items-center">
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{page}</span> of{" "}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <div className="w-8 h-8 mr-2 flex items-center justify-center rounded-full bg-amber-100">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {products.filter((p: any) => p.stockQuantity > 0 && p.stockQuantity <= 10).length}
              </p>
              <p className="text-sm text-muted-foreground">
                Products with 10 or fewer items in stock
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="link" className="px-0" onClick={() => setStockFilter("low-stock")}>
                View low stock items
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <div className="w-8 h-8 mr-2 flex items-center justify-center rounded-full bg-red-100">
                  <Package className="h-4 w-4 text-red-600" />
                </div>
                Out of Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {products.filter((p: any) => p.stockQuantity <= 0).length}
              </p>
              <p className="text-sm text-muted-foreground">
                Products that are currently unavailable
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="link" className="px-0" onClick={() => setStockFilter("out-of-stock")}>
                Manage out of stock items
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <div className="w-8 h-8 mr-2 flex items-center justify-center rounded-full bg-green-100">
                  <Tag className="h-4 w-4 text-green-600" />
                </div>
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {productsData?.total || 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Total products in your inventory
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="link" className="px-0" asChild>
                <Link href="/seller/smart-inventory">
                  View inventory analytics
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </SellerDashboardLayout>
  );
}