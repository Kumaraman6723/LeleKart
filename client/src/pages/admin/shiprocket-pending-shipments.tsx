import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  TruckIcon,
  Package,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  Settings,
  ArrowRight,
  Check,
  Shield,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { formatPrice as formatCurrency } from "@/lib/utils";
import ShiprocketErrorDisplay from "@/components/shiprocket/shiprocket-error-display";

interface Courier {
  id: string;
  name: string;
  serviceability: {
    forward: number;
    reverse: number;
  };
  rating: number;
  rate: {
    price: number;
    estimated_days: number;
    is_available: boolean;
  };
  etd: string;
  freight_charge: number;
  courier_company_id: number;
  company_id: number;
  courier_name: string;
  price: number;
  cod_charge: number;
  cod_limit: number;
}

const PendingShipments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for shipping dialog
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<string>("");

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);

  // Generate token mutation for manual refresh
  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/shiprocket/token");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Token refreshed",
        description: "Shiprocket API token has been refreshed successfully.",
        variant: "default",
      });
      // Refresh all Shiprocket data
      queryClient.invalidateQueries({ queryKey: ["/api/shiprocket/couriers"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/shiprocket/orders/pending"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shiprocket/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error refreshing token",
        description:
          error.message || "There was an error refreshing the token.",
        variant: "destructive",
      });
    },
  });

  // Get pending orders
  const {
    data: pendingOrders,
    isLoading: isLoadingOrders,
    isError: isErrorOrders,
    error: pendingOrdersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["/api/shiprocket/orders/pending", currentPage, pageSize],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/shiprocket/orders/pending?page=${currentPage}&limit=${pageSize}`
      );

      try {
        const text = await response.text();
        let data;

        try {
          // Try to parse as JSON first
          data = JSON.parse(text);
        } catch (parseError) {
          // If it's not valid JSON (e.g., it's HTML), throw error with the text
          if (text.includes("<!DOCTYPE") || text.includes("<html")) {
            throw new Error(
              "The API returned HTML instead of JSON. Please try generating a new API token."
            );
          } else {
            throw new Error(
              `Invalid API response: ${text.substring(0, 100)}...`
            );
          }
        }

        // Update total orders count if available in response
        if (data.total) {
          setTotalOrders(data.total);
        }

        return data.orders || data; // Handle both paginated and non-paginated responses
      } catch (error) {
        console.error("Pending orders API error:", error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry if we get HTML response
      if (
        error instanceof Error &&
        (error.message.includes("<!DOCTYPE") ||
          error.message.includes("<html") ||
          error.message.includes("returned HTML"))
      ) {
        return false;
      }
      // For other errors, retry up to 2 times
      return failureCount < 2;
    },
  });

  // Calculate total pages
  const totalPages = Math.ceil(totalOrders / pageSize);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Get available couriers
  const {
    data: couriers,
    isLoading: isLoadingCouriers,
    isError: isErrorCouriers,
    error: couriersError,
    refetch: refetchCouriers,
  } = useQuery({
    queryKey: ["/api/shiprocket/couriers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/shiprocket/couriers");

      try {
        const text = await response.text();

        // Check for HTML response first - this is a common issue with Shiprocket API
        if (text.includes("<!DOCTYPE") || text.includes("<html")) {
          throw new Error(
            "The API returned HTML instead of JSON. Please try generating a new API token."
          );
        }

        let data;
        try {
          // Try to parse as JSON
          data = JSON.parse(text);
        } catch (parseError) {
          // If parse error but not HTML (caught above), it's some other invalid format
          throw new Error(
            `Invalid API response format: ${text.substring(0, 100)}...`
          );
        }

        // Handle different response formats
        if (data?.data && Array.isArray(data.data)) {
          // If response has a data property that's an array
          return data.data;
        } else if (data?.courier_data && Array.isArray(data.courier_data)) {
          // If response has a courier_data property that's an array
          return data.courier_data;
        } else if (Array.isArray(data)) {
          // If response is directly an array
          return data;
        } else if (data?.couriers && Array.isArray(data.couriers)) {
          // If response has a couriers property that's an array
          return data.couriers;
        }

        // If none of the above formats match, throw error
        console.error("Unexpected courier data format:", data);
        throw new Error(
          "Invalid courier data format: API response does not contain an array of couriers"
        );
      } catch (error) {
        console.error("Error fetching couriers:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: (failureCount, error) => {
      // Don't retry if we get HTML response or invalid data format
      if (
        error instanceof Error &&
        (error.message.includes("<!DOCTYPE") ||
          error.message.includes("<html") ||
          error.message.includes("returned HTML") ||
          error.message.includes("Invalid courier data format"))
      ) {
        return false;
      }
      // For other errors, retry up to 2 times
      return failureCount < 2;
    },
  });

  // Memoize the courier options to prevent unnecessary re-renders
  const courierOptions = React.useMemo(() => {
    if (!Array.isArray(couriers)) return [];

    return couriers.map((courier: Courier) => {
      // Get the rate information
      const rate = courier.rate || {
        price: courier.freight_charge || courier.price || 0,
        estimated_days: courier.etd ? parseInt(courier.etd) : null,
        is_available: true,
      };

      return {
        id: courier.id,
        name: courier.name,
        rate: rate.price,
        estimatedDays: rate.estimated_days,
        isAvailable: rate.is_available,
        serviceability: courier.serviceability?.forward,
        codCharge: courier.cod_charge || 0,
        codLimit: courier.cod_limit || 0,
      };
    });
  }, [couriers]);

  // Ship order mutation
  const shipOrderMutation = useMutation({
    mutationFn: async (data: { orderId: number; courierCompany: string }) => {
      const response = await apiRequest(
        "POST",
        "/api/shiprocket/ship-order",
        data
      );

      try {
        const text = await response.text();

        // Check for HTML response
        if (text.includes("<!DOCTYPE") || text.includes("<html")) {
          throw new Error(
            "The API returned HTML instead of JSON. Please try generating a new API token."
          );
        }

        // Try to parse the response text as JSON
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch (parseError) {
          // Not HTML but not valid JSON either
          throw new Error(
            `Invalid API response format: ${text.substring(0, 100)}...`
          );
        }

        if (!response.ok) {
          console.log("Ship order error:", errorData);

          // Handle permission error specifically
          if (response.status === 403) {
            throw new Error(
              `Permission error: ${
                errorData?.message ||
                "Your Shiprocket account doesn't have the necessary API access permissions."
              }`
            );
          }

          // Handle token-related errors
          if (
            errorData?.code === "TOKEN_MISSING" ||
            errorData?.code === "TOKEN_ERROR"
          ) {
            throw new Error(
              `Token error: ${
                errorData?.message || "Shiprocket token is missing or invalid."
              }`
            );
          }

          // Handle authentication errors
          if (errorData?.code === "AUTH_FAILED") {
            throw new Error(
              `Authentication error: ${
                errorData?.message || "Your Shiprocket credentials are invalid."
              }`
            );
          }

          // Handle expired token
          if (errorData?.code === "TOKEN_EXPIRED") {
            throw new Error(
              `Token expired: ${
                errorData?.message || "Your Shiprocket token has expired."
              }`
            );
          }

          throw new Error(
            errorData?.message || errorData?.error || "Failed to ship order"
          );
        }

        return errorData;
      } catch (error) {
        console.error("Ship order API error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Order shipped",
        description: "Order has been shipped successfully with Shiprocket.",
        variant: "default",
      });
      setIsShippingDialogOpen(false);
      setSelectedOrderId(null);
      setSelectedCourier("");

      // Refresh both pending and shipped orders lists
      queryClient.invalidateQueries({
        queryKey: ["/api/shiprocket/orders/pending"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shiprocket/orders"] });
    },
    onError: (error: any) => {
      // Show a more detailed error message for common errors
      const errorMessage =
        error.message || "There was an error shipping the order.";

      toast({
        title: errorMessage.includes("Token")
          ? "Authentication Error"
          : errorMessage.includes("Permission")
          ? "Permission Error"
          : "Error Shipping Order",
        description: errorMessage,
        variant: "destructive",
      });

      // If it's a token issue, show the refresh token button
      if (errorMessage.includes("Token")) {
        // Refresh couriers to trigger the error display with refresh token button
        queryClient.invalidateQueries({
          queryKey: ["/api/shiprocket/couriers"],
        });
      }
    },
  });

  // Auto-ship all orders mutation
  const autoShipMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/shiprocket/auto-ship");

      try {
        const text = await response.text();

        // Check for HTML response
        if (text.includes("<!DOCTYPE") || text.includes("<html")) {
          throw new Error(
            "The API returned HTML instead of JSON. Please try generating a new API token."
          );
        }

        // Try to parse the response text as JSON
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch (parseError) {
          // Not HTML but not valid JSON either
          throw new Error(
            `Invalid API response format: ${text.substring(0, 100)}...`
          );
        }

        if (!response.ok) {
          console.log("Auto-ship error:", errorData);

          // Handle specific errors
          if (
            errorData?.error?.includes("Default courier not configured") ||
            errorData?.message?.includes("default courier")
          ) {
            throw new Error(
              "No default courier is configured. Please configure a default courier in Shiprocket Settings."
            );
          }

          // Handle permission error specifically
          if (response.status === 403) {
            throw new Error(
              `Permission error: ${
                errorData?.message ||
                "Your Shiprocket account doesn't have the necessary API access permissions."
              }`
            );
          }

          // Handle token-related errors
          if (
            errorData?.code === "TOKEN_MISSING" ||
            errorData?.code === "TOKEN_ERROR"
          ) {
            throw new Error(
              `Token error: ${
                errorData?.message || "Shiprocket token is missing or invalid."
              }`
            );
          }

          // Handle authentication errors
          if (errorData?.code === "AUTH_FAILED") {
            throw new Error(
              `Authentication error: ${
                errorData?.message || "Your Shiprocket credentials are invalid."
              }`
            );
          }

          // Handle expired token
          if (errorData?.code === "TOKEN_EXPIRED") {
            throw new Error(
              `Token expired: ${
                errorData?.message || "Your Shiprocket token has expired."
              }`
            );
          }

          throw new Error(
            errorData?.message ||
              errorData?.error ||
              "Failed to auto-ship orders"
          );
        }

        return errorData;
      } catch (error) {
        console.error("Auto-ship API error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Orders processed",
        description: `Successfully shipped ${data.shipped} of ${data.total} orders with Shiprocket.`,
        variant: "default",
      });

      // Refresh both pending and shipped orders lists
      queryClient.invalidateQueries({
        queryKey: ["/api/shiprocket/orders/pending"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shiprocket/orders"] });
    },
    onError: (error: any) => {
      // Show a more detailed error message for common errors
      const errorMessage =
        error.message || "There was an error auto-shipping the orders.";

      // Set appropriate title based on error type
      toast({
        title: errorMessage.includes("default courier")
          ? "Default Courier Missing"
          : errorMessage.includes("Token")
          ? "Authentication Error"
          : errorMessage.includes("Permission")
          ? "Permission Error"
          : "Error Auto-Shipping Orders",
        description: errorMessage,
        variant: "destructive",
      });

      // If it's a token issue, show the refresh token button by refreshing couriers
      if (errorMessage.includes("Token")) {
        queryClient.invalidateQueries({
          queryKey: ["/api/shiprocket/couriers"],
        });
      }
    },
  });

  // Handle auto-ship all orders
  const handleAutoShipAll = () => {
    if (!pendingOrders?.length) {
      toast({
        title: "No orders to ship",
        description: "There are no pending orders to auto-ship.",
        variant: "destructive",
      });
      return;
    }

    // Confirm with the user before proceeding
    if (
      window.confirm(
        `Are you sure you want to auto-ship all ${pendingOrders.length} pending orders using the default courier?`
      )
    ) {
      autoShipMutation.mutate();
    }
  };

  // Open shipping dialog
  const openShippingDialog = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsShippingDialogOpen(true);
  };

  // Handle ship order
  const handleShipOrder = () => {
    if (!selectedOrderId || !selectedCourier) {
      toast({
        title: "Missing information",
        description: "Please select a courier company.",
        variant: "destructive",
      });
      return;
    }

    shipOrderMutation.mutate({
      orderId: selectedOrderId,
      courierCompany: selectedCourier,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <TruckIcon className="h-5 w-5" />
            Pending Shipments
          </CardTitle>
          <CardDescription>
            Orders that are ready to be shipped with Shiprocket
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {autoShipMutation.isPending ? (
            <Button
              variant="default"
              size="sm"
              disabled
              className="flex items-center gap-2"
            >
              <Loader2 className="h-4 w-4 animate-spin" /> Processing...
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleAutoShipAll}
              disabled={!pendingOrders?.length}
              className="flex items-center gap-2"
            >
              <TruckIcon className="h-4 w-4" /> Auto-Ship All
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchOrders()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </CardHeader>

      {/* Show Default Courier Config Error if Auto-Ship attempt fails with that error */}
      {autoShipMutation.isError &&
        autoShipMutation.error instanceof Error &&
        autoShipMutation.error.message.includes(
          "Default courier not configured"
        ) && (
          <div className="mx-6 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800">
                  Default Courier Not Configured
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  Auto-Ship requires a default courier to be configured in your
                  Shiprocket account. To configure a default courier:
                </p>
                <ol className="text-sm text-amber-700 mt-2 ml-4 list-decimal">
                  <li>Log in to your Shiprocket account</li>
                  <li>Go to Settings &gt; Shipping &gt; Courier Priority</li>
                  <li>Set a default courier for your shipments</li>
                  <li>Return here and try Auto-Ship again</li>
                </ol>
                <p className="text-sm text-amber-700 mt-2">
                  Alternatively, you can ship orders individually by selecting a
                  courier for each order.
                </p>
              </div>
            </div>
          </div>
        )}
      {/* Show permission error guidance if couriers API returns 403 */}
      {isErrorCouriers &&
        couriersError instanceof Error &&
        couriersError.message.includes("Permissions error") && (
          <div className="mx-6 mb-4 p-4 bg-rose-50 border border-rose-200 rounded-md">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-6 w-6 text-rose-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-rose-800">
                  Shiprocket API Permission Error
                </h4>
                <p className="text-sm text-rose-700 mt-1">
                  Your Shiprocket account doesn't have the necessary API access
                  permissions. This is required to use Shiprocket integration.
                </p>
                <div className="mt-3 p-3 bg-white border border-rose-100 rounded">
                  <h5 className="font-medium text-rose-800 text-sm">
                    How to Fix This:
                  </h5>
                  <ol className="text-sm text-rose-700 mt-2 ml-4 list-decimal">
                    <li className="mb-1">
                      Log in to your Shiprocket account at{" "}
                      <a
                        href="https://app.shiprocket.in/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        shiprocket.in
                      </a>
                    </li>
                    <li className="mb-1">
                      Go to{" "}
                      <span className="font-medium">Settings &gt; API</span> and
                      check your current plan
                    </li>
                    <li className="mb-1">
                      Upgrade to a plan that includes API access (typically
                      Business plan or higher)
                    </li>
                    <li className="mb-1">
                      Contact Shiprocket support if you need assistance with
                      plan options
                    </li>
                    <li>
                      Once upgraded, return here and click "Refresh Token" to
                      reconnect
                    </li>
                  </ol>
                </div>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateTokenMutation.mutate()}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" /> Refresh Token
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      <CardContent>
        {isLoadingOrders ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isErrorOrders ? (
          <div className="py-4">
            {pendingOrdersError instanceof Error &&
            pendingOrdersError.message.includes("API returned HTML") ? (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-md">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-medium text-amber-800">
                    Authentication Error
                  </h4>
                  <p className="text-sm text-amber-700">
                    {pendingOrdersError.message}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateTokenMutation.mutate()}
                    className="flex items-center gap-2 mt-2"
                  >
                    <RefreshCw className="h-4 w-4" /> Generate New Token
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-red-500">
                Error loading pending orders:{" "}
                {pendingOrdersError instanceof Error
                  ? pendingOrdersError.message
                  : "Unknown error"}
                . Please try again.
              </div>
            )}
          </div>
        ) : pendingOrders?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium">No Pending Shipments</h3>
            <p className="mt-1">
              All orders have been shipped or no orders are ready for shipping.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingOrders?.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>
                        {new Date(order.date).toLocaleDateString()}{" "}
                        <span className="text-xs text-gray-500 block">
                          {formatDistanceToNow(new Date(order.date), {
                            addSuffix: true,
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        {order.user?.name || "Unknown"}
                        <span className="text-xs text-gray-500 block">
                          {order.address?.city}, {order.address?.state}
                        </span>
                      </TableCell>
                      <TableCell>
                        {order.items?.length || 0} items
                        <span className="text-xs text-gray-500 block">
                          {order.items
                            ?.map(
                              (item: any) =>
                                item.productDetails?.name ||
                                `Item #${item.productId}`
                            )
                            .join(", ")
                            .substring(0, 30)}
                          {(order.items
                            ?.map(
                              (item: any) =>
                                item.productDetails?.name ||
                                `Item #${item.productId}`
                            )
                            .join(", ").length || 0) > 30
                            ? "..."
                            : ""}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200"
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openShippingDialog(order.id)}
                          className="flex items-center gap-1"
                        >
                          <TruckIcon className="h-4 w-4" /> Ship
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Add pagination controls */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, totalOrders)} of{" "}
                  {totalOrders} orders
                </p>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => handlePageSizeChange(Number(value))}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                {/* Render a limited range of page numbers */}
                {(() => {
                  const pages = [];
                  const maxPagesToShow = 5; // Maximum number of page buttons to show
                  const totalPages = Math.ceil(totalOrders / pageSize); // Ensure totalPages is calculated correctly

                  // Determine the start and end page numbers to display
                  let startPage, endPage;

                  if (totalPages <= maxPagesToShow) {
                    // If total pages are less than or equal to max, show all pages
                    startPage = 1;
                    endPage = totalPages;
                  } else {
                    // Calculate start and end pages to keep the current page centered
                    const halfPagesToShow = Math.floor(maxPagesToShow / 2);
                    startPage = Math.max(1, currentPage - halfPagesToShow);
                    endPage = Math.min(
                      totalPages,
                      currentPage + halfPagesToShow
                    );

                    // Adjust start and end if they hit boundaries
                    if (endPage - startPage + 1 < maxPagesToShow) {
                      if (startPage === 1) {
                        endPage = Math.min(
                          totalPages,
                          startPage + maxPagesToShow - 1
                        );
                      } else if (endPage === totalPages) {
                        startPage = Math.max(1, endPage - maxPagesToShow + 1);
                      }
                    }
                  }

                  // Render page buttons
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <Button
                        key={i}
                        variant={currentPage === i ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(i)}
                        className="w-8 h-8"
                      >
                        {i}
                      </Button>
                    );
                  }

                  return pages;
                })()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Shipping Dialog */}
      <Dialog
        open={isShippingDialogOpen}
        onOpenChange={setIsShippingDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ship Order with Shiprocket</DialogTitle>
            <DialogDescription>
              Select a courier company to ship this order
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="block text-sm font-medium mb-2">
              Select Courier Company
            </label>
            {isLoadingCouriers ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading courier options...
              </div>
            ) : isErrorCouriers ? (
              <div className="space-y-3">
                {/* Show detailed guidance for permission errors */}
                {couriersError instanceof Error &&
                couriersError.message.includes("Permission") ? (
                  <div className="p-3 border border-rose-200 bg-rose-50 rounded-md">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-rose-800 text-sm">
                          API Permission Error
                        </h4>
                        <p className="text-sm text-rose-700 mt-1">
                          Your Shiprocket account doesn't have the necessary API
                          access permissions. This typically happens with free
                          or basic plans.
                        </p>
                        <div className="mt-2">
                          <h5 className="font-medium text-rose-800 text-xs">
                            How to Fix This:
                          </h5>
                          <ol className="text-xs text-rose-700 mt-1 ml-4 list-decimal">
                            <li className="mb-1">
                              Upgrade to a Shiprocket plan that includes API
                              access (Business plan or higher)
                            </li>
                            <li className="mb-1">
                              Once upgraded, return here and click "Refresh
                              Token"
                            </li>
                          </ol>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              "https://app.shiprocket.in/plan-and-pricing",
                              "_blank"
                            )
                          }
                          className="mt-2 flex items-center gap-2 text-xs"
                        >
                          <ExternalLink className="h-3 w-3" /> View Shiprocket
                          Plans
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-500 text-sm">
                    {couriersError instanceof Error
                      ? couriersError.message
                      : "Error loading couriers. The Shiprocket token may need to be refreshed."}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchCouriers()}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-3 w-3" /> Retry
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => generateTokenMutation.mutate()}
                    disabled={generateTokenMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {generateTokenMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    {generateTokenMutation.isPending
                      ? "Refreshing..."
                      : "Refresh Token"}
                  </Button>
                </div>
              </div>
            ) : (
              <Select
                value={selectedCourier}
                onValueChange={setSelectedCourier}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a courier" />
                </SelectTrigger>
                <SelectContent>
                  {courierOptions.length > 0 ? (
                    courierOptions.map((courier) => (
                      <SelectItem
                        key={courier.id}
                        value={courier.id}
                        disabled={!courier.isAvailable}
                      >
                        <div className="flex flex-col">
                          <div className="font-medium">{courier.name}</div>
                          <div className="text-sm">
                            <span className="font-medium">₹{courier.rate}</span>
                            {courier.codCharge > 0 && (
                              <span className="text-gray-500 ml-2">
                                (COD: ₹{courier.codCharge})
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {courier.estimatedDays
                              ? `Estimated delivery: ${courier.estimatedDays} days`
                              : ""}
                            {courier.serviceability
                              ? ` (${courier.serviceability} serviceable)`
                              : ""}
                            {courier.codLimit > 0 && (
                              <span className="ml-1">
                                (COD Limit: ₹{courier.codLimit})
                              </span>
                            )}
                            {!courier.isAvailable && (
                              <span className="text-red-500 ml-1">
                                (Not available for this order)
                              </span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-couriers" disabled>
                      No couriers available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}

            <div className="mt-4 text-sm text-gray-500">
              This will create a shipment with Shiprocket and generate a
              tracking number. The order status will be updated to "shipped".
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsShippingDialogOpen(false)}
              disabled={shipOrderMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleShipOrder}
              disabled={!selectedCourier || shipOrderMutation.isPending}
              className="flex items-center gap-2"
            >
              {shipOrderMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TruckIcon className="h-4 w-4" />
              )}
              {shipOrderMutation.isPending ? "Processing..." : "Ship Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const ShiprocketPendingShipmentsPage = () => {
  const { toast } = useToast();
  const [tokenStatus, setTokenStatus] = useState<
    "checking" | "valid" | "expired" | "error" | "permission_error"
  >("checking");
  const queryClient = useQueryClient();

  // Check token status
  const checkTokenStatus = async () => {
    setTokenStatus("checking");
    try {
      // First check if we have a token
      const settingsResponse = await apiRequest(
        "GET",
        "/api/shiprocket/settings"
      );
      const settingsData = await settingsResponse.json();

      if (!settingsData || !settingsData.token) {
        setTokenStatus("expired");
        return;
      }

      // Check if the token works by making a test API call
      try {
        // Using a quick test API call to check token permissions
        const testResponse = await apiRequest(
          "GET",
          "/api/shiprocket/couriers"
        );

        if (testResponse.status === 403) {
          // Token exists but permission denied (403)
          const errorData = await testResponse
            .clone()
            .json()
            .catch(() => ({}));
          console.log("Shiprocket permission error:", errorData);
          setTokenStatus("permission_error");
        } else if (!testResponse.ok) {
          // Other errors (token might be expired)
          const errorData = await testResponse
            .clone()
            .json()
            .catch(() => ({}));
          console.log("Shiprocket token error:", errorData);
          setTokenStatus("expired");
        } else {
          // Token works correctly
          console.log("Shiprocket token is valid and has correct permissions");
          setTokenStatus("valid");
        }
      } catch (apiError) {
        // If we can't reach the API endpoint, consider the token expired
        console.error(
          "API test failed:",
          apiError instanceof Error ? apiError.message : String(apiError)
        );
        setTokenStatus("expired");
      }
    } catch (error) {
      console.error(
        "Error checking token status:",
        error instanceof Error ? error.message : String(error)
      );
      setTokenStatus("error");
    }
  };

  // Generate token mutation
  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/shiprocket/token");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Token refreshed",
        description: "Shiprocket API token has been refreshed successfully.",
        variant: "default",
      });
      setTokenStatus("valid");
      // Refresh all Shiprocket data
      queryClient.invalidateQueries({ queryKey: ["/api/shiprocket/couriers"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/shiprocket/orders/pending"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shiprocket/orders"] });
    },
    onError: (error: any) => {
      setTokenStatus("error");
      toast({
        title: "Error refreshing token",
        description:
          error.message || "There was an error refreshing the token.",
        variant: "destructive",
      });
    },
  });

  // Check token status on component mount
  useEffect(() => {
    checkTokenStatus();
  }, []);

  // Render token status indicator
  const renderTokenStatus = () => {
    if (tokenStatus === "checking") {
      return (
        <div className="flex items-center gap-2 p-2 bg-slate-100 border border-slate-200 rounded-md text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
          <span className="text-slate-600">
            Checking Shiprocket API token status...
          </span>
        </div>
      );
    }

    if (tokenStatus === "valid") {
      return (
        <div className="flex items-center justify-between p-2 bg-green-50 border border-green-100 rounded-md text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-green-700">
              Shiprocket API token is valid and active
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkTokenStatus}
            className="h-7 px-2 text-xs bg-white"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Check
          </Button>
        </div>
      );
    }

    if (tokenStatus === "permission_error") {
      return (
        <div className="flex flex-col p-2 bg-red-50 border border-red-100 rounded-md text-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <span className="text-red-700 font-medium">
                Shiprocket API Permission Error
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkTokenStatus}
              className="h-7 px-2 text-xs bg-white"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Check Again
            </Button>
          </div>
          <div className="text-gray-700 text-xs bg-white p-2 rounded border border-gray-200">
            <p className="mb-1">
              <strong>Issue:</strong> You have valid Shiprocket credentials, but
              your Shiprocket account doesn't have the necessary permissions to
              access the Courier API.
            </p>
            <p>
              <strong>Solution:</strong> Please ensure your Shiprocket account
              has the required plan and permissions enabled. Contact Shiprocket
              support to upgrade your account or enable API access if needed.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              variant="default"
              size="sm"
              onClick={() => generateTokenMutation.mutate()}
              disabled={generateTokenMutation.isPending}
              className="h-7 px-2 text-xs"
            >
              {generateTokenMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Refresh Token
            </Button>
          </div>
        </div>
      );
    }

    if (tokenStatus === "expired") {
      return (
        <div className="flex items-center justify-between p-2 bg-amber-50 border border-amber-100 rounded-md text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-amber-700">
              Shiprocket API token is missing or expired
            </span>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => generateTokenMutation.mutate()}
            disabled={generateTokenMutation.isPending}
            className="h-7 px-2 text-xs"
          >
            {generateTokenMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            {generateTokenMutation.isPending
              ? "Refreshing..."
              : "Refresh Token"}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between p-2 bg-red-50 border border-red-100 rounded-md text-sm">
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-red-700">
            Error checking Shiprocket API token status
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={checkTokenStatus}
            className="h-7 px-2 text-xs bg-white"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Check Again
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => generateTokenMutation.mutate()}
            disabled={generateTokenMutation.isPending}
            className="h-7 px-2 text-xs"
          >
            {generateTokenMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Refresh Token
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        {renderTokenStatus()}
        <PendingShipments />
      </div>
    </AdminLayout>
  );
};

export default ShiprocketPendingShipmentsPage;
