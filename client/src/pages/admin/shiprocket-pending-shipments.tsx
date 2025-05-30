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
  id: number;
  courier_company_id: number;
  courier_name: string;
  rate: number;
  estimated_delivery_days: string;
  etd: string;
  cod_charges: number;
  freight_charge: number;
  rto_charges: number;
  surface_max_weight: string;
  air_max_weight: string;
  blocked: number;
  is_surface: boolean;
  is_hyperlocal: boolean;
  realtime_tracking: string;
  pod_available: string;
  call_before_delivery: string;
  delivery_performance: number;
  pickup_performance: number;
  tracking_performance: number;
  rto_performance: number;
  rating: number;
  charge_weight: number;
  cod: number;
  courier_type: string;
  cutoff_time: string;
  min_weight: number;
  weight_cases: number;
  zone: string;
  state: string;
  city: string;
  postcode: string;
  is_recommended: boolean;
}

interface OrderDetails {
  id: number;
  items: {
    productId: number;
    quantity: number;
    product?: {
      weight?: number;
      length?: number;
      width?: number;
      height?: number;
      sellerId?: number;
    };
  }[];
  address?: {
    pincode: string;
  };
  paymentMethod: string;
  total: number;
}

const PendingShipments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<string>("");
  const [currentOrderDetails, setCurrentOrderDetails] =
    useState<OrderDetails | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [courierOptions, setCourierOptions] = useState<Courier[]>([]);

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
          data = JSON.parse(text);
        } catch (parseError) {
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
        if (data.total) {
          setTotalOrders(data.total);
        }
        return data.orders || data;
      } catch (error) {
        console.error("Pending orders API error:", error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      if (
        error instanceof Error &&
        (error.message.includes("<!DOCTYPE") ||
          error.message.includes("<html") ||
          error.message.includes("returned HTML"))
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const totalPages = Math.ceil(totalOrders / pageSize);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const getCourierRates = async (orderId: number) => {
    try {
      const response = await apiRequest(
        "GET",
        `/api/shiprocket/couriers?orderId=${orderId}`
      );
      const data = await response.json();
      console.log("Fetched courier rates:", data);
      return data;
    } catch (error) {
      console.error("Error fetching courier rates:", error);
      throw error;
    }
  };

  const shipOrderMutation = useMutation({
    mutationFn: async (data: { orderId: number; courierCompany: string }) => {
      const response = await apiRequest(
        "POST",
        "/api/shiprocket/ship-order",
        data
      );
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order shipped",
        description: "Order has been shipped successfully with Shiprocket.",
        variant: "default",
      });
      setIsShippingDialogOpen(false);
      setSelectedOrderId(null);
      setSelectedCourier("");
      queryClient.invalidateQueries({
        queryKey: ["/api/shiprocket/orders/pending"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shiprocket/orders"] });
    },
    onError: (error: any) => {
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
      if (errorMessage.includes("Token")) {
        queryClient.invalidateQueries({
          queryKey: ["/api/shiprocket/couriers"],
        });
      }
    },
  });

  const openShippingDialog = async (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsShippingDialogOpen(true);

    try {
      const order = pendingOrders?.find((o: any) => o.id === orderId);
      if (order) {
        setCurrentOrderDetails({
          id: order.id,
          items: order.items,
          address: order.address,
          paymentMethod: order.paymentMethod,
          total: order.total,
        });
      }

      const response = await getCourierRates(orderId);
      console.log("Courier rates response:", response);

      const availableCouriers = response.couriers || [];
      console.log("Available couriers:", availableCouriers);

      if (availableCouriers.length === 0) {
        console.log("No available couriers found in response:", response);
        toast({
          title: "No courier options available",
          description: "No courier services are available for this order.",
          variant: "destructive",
        });
        return;
      }

      setCourierOptions(availableCouriers);
    } catch (error) {
      console.error("Error fetching courier rates:", error);
      toast({
        title: "Error fetching courier options",
        description: "Could not fetch available couriers for this order.",
        variant: "destructive",
      });
    }
  };

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
                        {new Date(order.date).toLocaleDateString()}
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-8 h-8"
                    >
                      {page}
                    </Button>
                  )
                )}
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
            {courierOptions.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading courier options...
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
                  {courierOptions.map((courier: Courier) => (
                    <SelectItem
                      key={courier.courier_company_id}
                      value={courier.courier_company_id.toString()}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium flex items-center gap-2">
                            {courier.courier_name}
                            {courier.is_surface && (
                              <Badge variant="outline" className="text-xs">
                                Surface
                              </Badge>
                            )}
                            {courier.is_recommended && (
                              <Badge variant="secondary" className="text-xs">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm font-medium">
                            ₹{courier.rate}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span>
                            Delivery: {courier.estimated_delivery_days} days
                          </span>
                          {courier.cod_charges > 0 && (
                            <span>• COD: ₹{courier.cod_charges}</span>
                          )}
                          {courier.rating > 0 && (
                            <span>• Rating: {courier.rating.toFixed(1)}</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                          {courier.surface_max_weight && (
                            <span>
                              Max weight: {courier.surface_max_weight} kg
                            </span>
                          )}
                          {courier.cutoff_time && (
                            <span>• Cutoff: {courier.cutoff_time}</span>
                          )}
                          {courier.pod_available && (
                            <span>• POD: {courier.pod_available}</span>
                          )}
                          {courier.call_before_delivery === "Available" && (
                            <span>• Call before delivery</span>
                          )}
                          {courier.realtime_tracking === "Real Time" && (
                            <span>• Real-time tracking</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                          {courier.delivery_performance > 0 && (
                            <span>
                              Delivery:{" "}
                              {courier.delivery_performance.toFixed(1)}
                            </span>
                          )}
                          {courier.pickup_performance > 0 && (
                            <span>
                              • Pickup: {courier.pickup_performance.toFixed(1)}
                            </span>
                          )}
                          {courier.tracking_performance > 0 && (
                            <span>
                              • Tracking:{" "}
                              {courier.tracking_performance.toFixed(1)}
                            </span>
                          )}
                          {courier.rto_performance > 0 && (
                            <span>
                              • RTO: {courier.rto_performance.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
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

  const checkTokenStatus = async () => {
    setTokenStatus("checking");
    try {
      const response = await apiRequest("GET", "/api/shiprocket/settings");
      const settingsData = await response.json();
      if (!settingsData || !settingsData.token) {
        setTokenStatus("expired");
        return;
      }
      const testResponse = await apiRequest(
        "GET",
        "/api/shiprocket/check-token"
      );
      if (testResponse.status === 403) {
        setTokenStatus("permission_error");
      } else if (!testResponse.ok) {
        setTokenStatus("expired");
      } else {
        setTokenStatus("valid");
      }
    } catch (error) {
      console.error("Error checking token status:", error);
      setTokenStatus("error");
    }
  };

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

  useEffect(() => {
    checkTokenStatus();
  }, []);

  const renderTokenStatus = () => {
    switch (tokenStatus) {
      case "checking":
        return (
          <div className="flex items-center gap-2 p-2 bg-slate-100 border border-slate-200 rounded-md text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
            <span className="text-slate-600">
              Checking Shiprocket API token status...
            </span>
          </div>
        );
      case "valid":
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
      case "permission_error":
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
                <strong>Issue:</strong> You have valid Shiprocket credentials,
                but your Shiprocket account doesn't have the necessary
                permissions.
              </p>
              <p>
                <strong>Solution:</strong> Please ensure your Shiprocket account
                has the required plan and permissions enabled.
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
      case "expired":
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
      default:
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
    }
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
