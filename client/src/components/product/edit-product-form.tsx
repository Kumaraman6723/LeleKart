import { useLocation } from "wouter";
import AddProductForm from "./add-product-form";

interface ProductVariant {
  id?: number;
  sku: string;
  color?: string;
  size?: string;
  price: number;
  mrp?: number;
  stock: number;
  images: string[];
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  mrp?: number;
  purchasePrice?: number;
  brand?: string;
  category: string;
  subcategory?: string;
  subcategoryId?: number;
  gstRate?: number;
  stock: number;
  sku?: string;
  images: string[];
  specifications?: string;
  warranty?: number;
  returnPolicy?: string;
  customReturnPolicy?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  color?: string;
  size?: string;
  variants?: ProductVariant[];
  isDraft?: boolean;
  approved?: boolean;
  createdAt?: string;
  updatedAt?: string;
  sellerId?: number;
  status?: "draft" | "pending" | "approved" | "rejected";
  rejectionReason?: string;
}

interface EditProductFormProps {
  product: Product;
  redirectTo?: string; // Where to redirect after successful update
  onSuccess?: (updatedProduct: Product) => void; // Optional callback after successful update
  onError?: (error: Error) => void; // Optional callback for error handling
}

/**
 * Edit Product Form Component
 *
 * This is a wrapper around AddProductForm that passes the product data as initialValues.
 * Since AddProductForm can handle both creating and editing products, this component
 * simply prepares the proper initial values and passes them to AddProductForm.
 *
 * The component handles:
 * - Proper type checking for all product fields
 * - Conversion of data types where needed
 * - Default values for optional fields
 * - Proper handling of variants and images
 */
export default function EditProductForm({
  product,
  redirectTo = "/admin/products",
  onSuccess,
  onError,
}: EditProductFormProps) {
  // Ensure all required fields are present and properly typed
  const initialValues: Product = {
    ...product,
    // Ensure numeric fields are numbers
    price: Number(product.price),
    mrp: product.mrp ? Number(product.mrp) : undefined,
    purchasePrice: product.purchasePrice
      ? Number(product.purchasePrice)
      : undefined,
    gstRate: product.gstRate ? Number(product.gstRate) : undefined,
    stock: Number(product.stock),
    warranty: product.warranty ? Number(product.warranty) : undefined,
    weight: product.weight ? Number(product.weight) : undefined,
    length: product.length ? Number(product.length) : undefined,
    width: product.width ? Number(product.width) : undefined,
    height: product.height ? Number(product.height) : undefined,
    // Ensure variants have proper types
    variants:
      product.variants?.map((variant) => ({
        ...variant,
        id: variant.id || undefined,
        price: Number(variant.price),
        mrp: variant.mrp ? Number(variant.mrp) : undefined,
        stock: Number(variant.stock),
        images: Array.isArray(variant.images) ? variant.images : [],
      })) || [],
    // Ensure images is always an array
    images: Array.isArray(product.images) ? product.images : [],
    // Set default return policy if not present
    returnPolicy: product.returnPolicy || "7",
    // Ensure dates are strings
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || new Date().toISOString(),
  };

  return (
    <AddProductForm initialValues={initialValues} redirectTo={redirectTo} />
  );
}
