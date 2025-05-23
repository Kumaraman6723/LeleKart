import { Product, User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { CartContext } from "@/context/cart-context"; // Import context directly
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { apiRequest } from "@/lib/queryClient";
import { WishlistButton } from "./wishlist-button";
import { ProductImage } from "./product-image";

// Define an extended Product interface to include image_url and GST details
interface ExtendedProduct extends Product {
  image?: string;
  image_url?: string;
  imageUrl?: string | null;
  hasVariants?: boolean;
  variants?: any[];
  gstDetails?: {
    gstRate: number;
    basePrice: number;
    gstAmount: number;
    priceWithGst: number;
  };
}

interface ProductCardProps {
  product: ExtendedProduct;
  featured?: boolean;
}

export function ProductCard({ product, featured = false }: ProductCardProps) {
  const cartContext = useContext(CartContext); // Use context directly with optional chaining
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Get user data to check if logged in
  const { data: user } = useQuery<User | null>({
    queryKey: ["/api/user"],
    retry: false,
    staleTime: 60000,
  });

  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  // Strip HTML tags from string
  const stripHtmlTags = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If user is not logged in, redirect to auth
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to add items to cart",
        variant: "default",
      });
      setLocation("/auth", { replace: false });
      return;
    }

    // Only buyers can add to cart
    // After null check, the user is definitely a User type with a role property
    const userRole = user?.role as string;
    if (userRole && userRole !== "buyer") {
      toast({
        title: "Action Not Allowed",
        description:
          "Only buyers can add items to cart. Please switch to a buyer account.",
        variant: "destructive",
      });
      return;
    }

    // Check if product has variants - if so, redirect to product detail page
    if (
      product.hasVariants ||
      (product.variants && product.variants.length > 0)
    ) {
      toast({
        title: "Selection Required",
        description: "Please select product options before adding to cart",
        variant: "default",
      });

      // Redirect to product detail page to allow variant selection
      setLocation(`/product/${product.id}`, { replace: false });
      return;
    }

    try {
      // Use direct API call if context is not available
      if (cartContext) {
        cartContext.addToCart(product);
      } else {
        // Fallback to direct API call
        await apiRequest("POST", "/api/cart", {
          productId: product.id,
          quantity: 1,
        });

        // Refresh cart data
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });

        toast({
          title: "Added to cart",
          description: `${product.name} has been added to your cart`,
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to add to cart",
        description: "There was an error adding the product to your cart",
        variant: "destructive",
      });
    }
  };

  // Use the same dimensions and styling for all product cards regardless of featured status
  return (
    <div className="relative">
      {/* Add Wishlist button on top right of card */}
      <WishlistButton productId={product.id} variant="card" />

      {/* Use normalized path that starts with a slash to prevent double slashes */}
      <Link href={`/product/${product.id}`} className="block">
        <Card className="product-card h-full flex flex-col items-center p-3 transition-transform duration-200 hover:cursor-pointer hover:shadow-md hover:-translate-y-1">
          <CardContent className="p-0 w-full flex flex-col items-center h-full">
            <div className="w-full flex-shrink-0 h-40 flex items-center justify-center mb-3 bg-slate-50 rounded-md">
              <ProductImage product={product} className="rounded-sm" />
            </div>

            <div className="flex flex-col flex-grow w-full">
              <h3 className="font-medium text-center text-sm line-clamp-2 h-10">
                {product.name}
              </h3>
              <div className="text-green-600 font-medium mt-1 text-center">
                {product.gstDetails
                  ? formatPrice(product.gstDetails.priceWithGst)
                  : formatPrice(product.price)}
              </div>
              <div className="text-xs text-gray-500 mt-1 text-center line-clamp-1">
                {stripHtmlTags(product.description).slice(0, 30)}...
              </div>
            </div>

            <Button
              variant={featured ? "outline" : "ghost"}
              size="sm"
              className={`mt-2 w-full ${
                featured
                  ? "border-primary text-primary hover:bg-primary hover:text-white"
                  : "text-primary hover:bg-primary/10"
              }`}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
