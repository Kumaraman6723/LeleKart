import React, { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Filter,
  Package,
  MoreVertical,
  Truck,
  AlertTriangle,
  Check,
  Calendar,
  FileText,
  Send,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define types for our data
interface OrderItem {
  id: number;
  productId: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface Order {
  id: number;
  orderId?: string;
  user?: {
    id: number;
    name: string;
  };
  date: string;
  status: string;
  total: number;
  shippingDetails?: any; // Could be a string (JSON) or an object
  shipmentStatus?: string;
  shiprocketOrderId?: string | null;
  trackingId?: string | null;
  courierName?: string;
  orderItems?: OrderItem[];
  deliveryDate?: string | null;
  estimatedDeliveryDate?: string | null;
}

const PendingShipmentsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State variables for order details and shipping
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isShippingDialog, setIsShippingDialog] = useState(false);
  const [isShipping, setIsShipping] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Fetch real orders from API with pagination
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/orders/pending", currentPage, pageSize],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/admin/orders/pending?page=${currentPage}&limit=${pageSize}`
      );
      if (!res.ok) throw new Error("Failed to fetch pending orders");
      return res.json();
    },
  });

  // Extract orders and pagination info from response
  const pendingOrders = data?.orders || [];
  const totalOrders = data?.total || 0;
  const pageCount = data?.pageCount || 1;

  // Mutation for shipping an order via Shiprocket
  const shipOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/shiprocket`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to ship order");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Order shipped successfully",
        description: `Tracking ID: ${data.trackingNumber || "Pending"}`,
      });

      // Close dialog and reset state
      setIsShippingDialog(false);
      setIsShipping(false);
      setSelectedOrder(null);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/orders/pending"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to ship order",
        description: error.message,
        variant: "destructive",
      });
      setIsShipping(false);
    },
  });

  // Handle view details action
  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  // Handle ship now action
  const handleShipNow = (order: Order) => {
    setSelectedOrder(order);
    setIsShippingDialog(true);
  };

  // Handle confirmation of shipping
  const confirmShipping = () => {
    if (!selectedOrder) return;

    setIsShipping(true);
    // Pass the order ID as-is since the server now handles the 'ORD-' prefix correctly
    // Convert to string if it's not already
    const orderId =
      typeof selectedOrder.id === "string"
        ? selectedOrder.id
        : String(selectedOrder.id);
    shipOrderMutation.mutate(orderId);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "ready to ship":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-transparent">
            Ready to Ship
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-transparent">
            Processing
          </Badge>
        );
      case "payment issue":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-transparent">
            Payment Issue
          </Badge>
        );
      case "address issue":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-transparent">
            Address Issue
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-transparent">
            {status}
          </Badge>
        );
    }
  };

  return (
    <AdminLayout>
      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order ID:{" "}
              {selectedOrder?.orderId ||
                (selectedOrder?.id ? `ORD-${selectedOrder.id}` : "")}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Customer
                  </h3>
                  <p className="text-base">
                    {selectedOrder.user?.name || "Unknown Customer"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Order Date
                  </h3>
                  <p className="text-base">
                    {new Date(selectedOrder.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Status
                  </h3>
                  <p className="text-base">{selectedOrder.status}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Order ID
                  </h3>
                  <p className="text-base">
                    {selectedOrder.orderId || `ORD-${selectedOrder.id}`}
                  </p>
                </div>
              </div>

              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Shipping Details</h3>
                {(() => {
                  let shippingInfo: any = selectedOrder.shippingDetails;

                  // Parse the shipping details if it's a string
                  if (typeof shippingInfo === "string") {
                    try {
                      shippingInfo = JSON.parse(shippingInfo);
                    } catch (e) {
                      return (
                        <div className="text-sm">
                          Error parsing shipping details
                        </div>
                      );
                    }
                  }

                  if (shippingInfo) {
                    return (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name:</span>{" "}
                          {shippingInfo.name}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Phone:</span>{" "}
                          {shippingInfo.phone}
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">
                            Address:
                          </span>{" "}
                          {shippingInfo.address}
                        </div>
                        <div>
                          <span className="text-muted-foreground">City:</span>{" "}
                          {shippingInfo.city}
                        </div>
                        <div>
                          <span className="text-muted-foreground">State:</span>{" "}
                          {shippingInfo.state}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Zip Code:
                          </span>{" "}
                          {shippingInfo.zipCode}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Country:
                          </span>{" "}
                          {shippingInfo.country}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-sm">
                        No shipping details available
                      </div>
                    );
                  }
                })()}
              </div>

              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Order Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(selectedOrder.orderItems) ? (
                      selectedOrder.orderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell>{item.sku}</TableCell>
                          <TableCell>₹{item.price.toLocaleString()}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground"
                        >
                          No items data available
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-medium">
                        Order Total:
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ₹{selectedOrder.total.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {selectedOrder.shiprocketOrderId && (
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Shipping Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Shiprocket Order ID:
                      </span>{" "}
                      {selectedOrder.shiprocketOrderId}
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Tracking ID:
                      </span>{" "}
                      {selectedOrder.trackingId || "Pending"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Courier:</span>{" "}
                      {selectedOrder.courierName || "Pending"}
                    </div>
                    {selectedOrder.trackingId && (
                      <div className="col-span-2 mt-2">
                        <a
                          href={`https://shiprocket.co/tracking/${selectedOrder.trackingId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Track Shipment
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
            {selectedOrder?.status.toLowerCase() === "ready to ship" && (
              <Button
                onClick={() => {
                  setIsDetailsOpen(false);
                  handleShipNow(selectedOrder);
                }}
                className="ml-2"
              >
                <Truck className="h-4 w-4 mr-2" />
                Ship Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ship Order Dialog */}
      <Dialog open={isShippingDialog} onOpenChange={setIsShippingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ship Order</DialogTitle>
            <DialogDescription>
              Create shipment for order{" "}
              {selectedOrder?.orderId ||
                (selectedOrder?.id ? `ORD-${selectedOrder.id}` : "")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-center space-y-3">
              <Package className="h-12 w-12 mx-auto text-primary" />
              <h3 className="text-lg font-medium">
                Ready to ship to {selectedOrder?.user?.name || "Customer"}
              </h3>
              <p className="text-muted-foreground text-sm">
                This will create a shipment with Shiprocket. You can track the
                shipment status after it's created.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsShippingDialog(false)}
              disabled={isShipping}
            >
              Cancel
            </Button>
            <Button onClick={confirmShipping} disabled={isShipping}>
              {isShipping ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Shipment...
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4 mr-2" />
                  Create Shipment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Pending Shipments
            </h1>
            <p className="text-muted-foreground">
              Manage and fulfill orders that are ready to be shipped
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Orders Ready for Shipping</CardTitle>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search orders..."
                    className="pl-8 w-64"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading pending shipments...
                </div>
              ) : (
                `${totalOrders} orders pending shipment`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Shipping Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">
                          Loading orders...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : pendingOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Package className="h-12 w-12 text-muted-foreground" />
                        <div className="space-y-1 text-center">
                          <p className="font-medium">No pending shipments</p>
                          <p className="text-sm text-muted-foreground">
                            All orders have been shipped or there are no new
                            orders.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.orderId || `ORD-${order.id}`}
                      </TableCell>
                      <TableCell>
                        {order.user?.name || "Unknown Customer"}
                      </TableCell>
                      <TableCell>
                        {new Date(order.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>₹{order.total.toLocaleString()}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {(() => {
                          let shippingInfo = order.shippingDetails;

                          // Parse the shipping details if it's a string
                          if (typeof shippingInfo === "string") {
                            try {
                              shippingInfo = JSON.parse(shippingInfo);
                              return `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state}`;
                            } catch (e) {
                              return "Error parsing shipping details";
                            }
                          } else if (
                            shippingInfo &&
                            typeof shippingInfo === "object"
                          ) {
                            return `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state}`;
                          }

                          return "No shipping details";
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(order)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleShipNow(order)}
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Ship Now
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                {totalOrders > 0 ? (
                  <>
                    Showing{" "}
                    <strong>
                      {(currentPage - 1) * pageSize + 1}-
                      {(currentPage - 1) * pageSize +
                        Math.min(pendingOrders.length, pageSize)}
                    </strong>{" "}
                    of <strong>{totalOrders}</strong> orders
                  </>
                ) : (
                  "No orders to display"
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={isLoading || currentPage >= pageCount}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default PendingShipmentsPage;
