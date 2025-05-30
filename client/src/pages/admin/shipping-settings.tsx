import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  PackageIcon,
  SettingsIcon,
  RefreshCwIcon,
  ClockIcon,
  CheckIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ShiprocketErrorDisplay from "@/components/shiprocket/shiprocket-error-display";

interface ShippingSettings {
  email: string;
  password: string;
  defaultCourier: string;
  autoShipEnabled: boolean;
}

interface ShippingCourier {
  id: string;
  name: string;
  rate?: {
    price: number;
    estimated_days: string;
    is_available: boolean;
    weight_limit: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  };
  serviceability?: number;
  codCharge?: number;
  codLimit?: number;
}

interface ShippingShipment {
  id: string;
  order_id: string;
  status: string;
  courier: string;
  tracking_id: string;
  created_at: string;
}

interface PendingOrder {
  id: number;
  userId: number;
  status: string;
  total: number;
  date: string;
  shippingDetails: string;
  items: {
    id: number;
    orderId: number;
    productId: number;
    quantity: number;
    price: number;
    product: {
      name: string;
    };
  }[];
}

export default function ShippingSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ShippingSettings>({
    email: "",
    password: "",
    defaultCourier: "",
    autoShipEnabled: false,
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Fetch shipping connection status
  const {
    data: connectionStatus,
    isLoading: isLoadingStatus,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["/api/shiprocket/status"],
    queryFn: async () => {
      // Try the shiprocket settings endpoint since there is no specific status endpoint
      try {
        const res = await apiRequest("GET", "/api/shiprocket/settings");
        if (!res.ok) throw new Error("Failed to fetch shiprocket settings");

        const settings = await res.json();

        console.log("Connection status query fetched settings:", settings);

        // Check if we have credentials and determine connection status
        const connected = !!(
          (settings.email && settings.token) // Check for email and token only
        );

        console.log("Connection status determined as:", connected);

        return { connected, settings };
      } catch (error) {
        console.error("Error fetching shiprocket status:", error);
        return { connected: false };
      }
    },
  });

  // Fetch shipping settings
  const {
    data: shippingSettings,
    isLoading: isLoadingSettings,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ["/api/shiprocket/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/shiprocket/settings");
      if (!res.ok) throw new Error("Failed to fetch shiprocket settings");
      return res.json();
    },
  });

  // Fetch shipping couriers
  const { data: couriers, isLoading: isLoadingCouriers } = useQuery({
    queryKey: ["/api/shiprocket/couriers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/shiprocket/couriers");
      if (!res.ok) throw new Error("Failed to fetch shiprocket couriers");
      const data = await res.json();

      // Log the response to help with debugging
      console.log("Courier data received:", data);

      // Ensure the response has the expected structure
      if (!Array.isArray(data)) {
        console.error("Expected array of couriers but got:", typeof data);
        throw new Error("Invalid courier data format");
      }

      return data;
    },
    enabled: connectionStatus?.connected === true,
  });

  // Fetch shipments
  const {
    data: shipments,
    isLoading: isLoadingShipments,
    refetch: refetchShipments,
  } = useQuery({
    queryKey: ["/api/shiprocket/shipments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/shiprocket/shipments");
      if (!res.ok) throw new Error("Failed to fetch shipments");
      return res.json();
    },
    enabled: connectionStatus?.connected === true,
  });

  // Fetch pending orders
  const {
    data: pendingOrders,
    isLoading: isLoadingPendingOrders,
    refetch: refetchPendingOrders,
  } = useQuery({
    queryKey: ["/api/shiprocket/orders/pending"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/shiprocket/orders/pending");
      if (!res.ok) throw new Error("Failed to fetch pending orders");
      return res.json();
    },
    enabled: connectionStatus?.connected === true,
  });

  // Connect to shipping service mutation
  const connectMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await apiRequest(
        "POST",
        "/api/shiprocket/connect",
        credentials
      );
      if (!res.ok) {
        // Check if the response contains HTML (likely an error page)
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          const htmlText = await res.text();
          const error = new Error(
            "Received HTML response instead of JSON. The API might be down or returning an error page."
          );
          // Add HTML content to the error for use in the error display component
          (error as any).htmlContent = htmlText;
          throw error;
        }

        try {
          const errorData = await res.json();
          throw new Error(
            errorData.error || "Failed to connect to shipping service"
          );
        } catch (jsonError) {
          // If JSON parsing fails, it might be another format
          const textContent = await res.text();
          throw new Error(
            `Failed to connect: ${textContent.substring(0, 100)}...`
          );
        }
      }
      return res.json();
    },
    onSuccess: async (data) => {
      console.log("Connection successful, data:", data);

      // Force refetch all relevant data
      await Promise.all([
        refetchStatus(),
        refetchSettings(),
        refetchShipments(),
        refetchPendingOrders(),
      ]);

      toast({
        title: "Connected to shipping service",
        description: "Your shipping account has been connected successfully.",
        variant: "default",
      });

      // Only redirect if connection was actually successful
      if (data && data.connected) {
        // Don't redirect immediately, wait for status to update
        setTimeout(() => {
          window.location.href = "/admin/shipping-dashboard";
        }, 1000);
      }
    },
    onError: (error) => {
      console.error("Connection error:", error);
      setConnectionError(error as Error);
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test shipping connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/shiprocket/test");
      if (!res.ok) {
        // Check if the response contains HTML (likely an error page)
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          const htmlText = await res.text();
          const error = new Error(
            "Received HTML response instead of JSON. The API might be down or returning an error page."
          );
          // Add HTML content to the error for use in the error display component
          (error as any).htmlContent = htmlText;
          throw error;
        }

        try {
          const errorData = await res.json();
          throw new Error(
            errorData.error || "Failed to test shipping connection"
          );
        } catch (jsonError) {
          // If JSON parsing fails, it might be another format
          const textContent = await res.text();
          throw new Error(
            `Test connection failed: ${textContent.substring(0, 100)}...`
          );
        }
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection test successful",
        description: "Your shipping account is properly connected.",
        variant: "default",
      });
    },
    onError: (error) => {
      setConnectionError(error as Error);
      toast({
        title: "Connection test failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: ShippingSettings) => {
      const res = await apiRequest(
        "POST",
        "/api/shiprocket/settings",
        newSettings
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save settings");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your shipping settings have been saved successfully.",
        variant: "default",
      });
      refetchSettings();
    },
    onError: (error) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create shipment mutation
  const createShipmentMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest(
        "POST",
        `/api/shiprocket/orders/${orderId}/ship`
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create shipment");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Shipment created",
        description: "The order has been shipped successfully.",
        variant: "default",
      });
      refetchPendingOrders();
      refetchShipments();
    },
    onError: (error) => {
      toast({
        title: "Failed to create shipment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel shipment mutation
  const cancelShipmentMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest(
        "POST",
        `/api/shiprocket/orders/${orderId}/ship/cancel`
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to cancel shipment");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Shipment cancelled",
        description: "The shipment has been cancelled successfully.",
        variant: "default",
      });
      refetchShipments();
    },
    onError: (error) => {
      toast({
        title: "Failed to cancel shipment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update settings state when data is loaded
  useEffect(() => {
    if (shippingSettings) {
      setSettings(shippingSettings);
    }
  }, [shippingSettings]);

  // Handle connect to shipping service
  const handleConnect = async () => {
    if (!settings.email || !settings.password) {
      toast({
        title: "Missing credentials",
        description: "Please provide your shipping service email and password.",
        variant: "destructive",
      });
      return;
    }

    console.log("Connecting with credentials:", {
      email: settings.email,
      password: settings.password ? "******" : "empty", // Don't log actual password
    });

    setIsConnecting(true);
    try {
      const result = await connectMutation.mutateAsync({
        email: settings.email,
        password: settings.password,
      });
      console.log("Connect result:", result);
    } catch (error) {
      console.error("Connection error:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle test connection
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      await testConnectionMutation.mutateAsync();
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Handle save settings
  const handleSaveSettings = async () => {
    console.log("Saving settings:", {
      email: settings.email,
      password: settings.password ? "******" : "empty", // Don't log actual password
      defaultCourier: settings.defaultCourier,
      autoShipEnabled: settings.autoShipEnabled,
    });

    try {
      const result = await saveSettingsMutation.mutateAsync(settings);
      console.log("Save settings result:", result);
    } catch (error) {
      console.error("Save settings error:", error);
    }
  };

  // Format date helper function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Shipment status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Parse shipping details
  const parseShippingDetails = (shippingDetails: string) => {
    try {
      return typeof shippingDetails === "string"
        ? JSON.parse(shippingDetails)
        : shippingDetails;
    } catch (error) {
      return { address: shippingDetails };
    }
  };

  // Handle API errors
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  const handleRetryConnection = async () => {
    console.log("Retrying connection...");
    setConnectionError(null);

    // Force refetch all relevant data
    await Promise.all([
      refetchStatus(),
      refetchSettings(),
      refetchShipments(),
      refetchPendingOrders(),
    ]);

    console.log("Connection status after retry:", connectionStatus);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Shipping Settings</h1>
          <div className="flex items-center space-x-2">
            {isLoadingStatus ? (
              <Badge variant="outline" className="bg-gray-100">
                <Skeleton className="h-4 w-20" />
              </Badge>
            ) : connectionStatus?.connected ? (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-100 text-red-800">
                <XCircleIcon className="h-4 w-4 mr-1" />
                Not Connected
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleRetryConnection}>
              <RefreshCwIcon className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Display error for HTML responses and connection failures */}
        {connectMutation.error && (
          <div className="mb-6">
            <ShiprocketErrorDisplay
              error={connectMutation.error}
              onRetry={handleRetryConnection}
            />
          </div>
        )}

        {testConnectionMutation.error && (
          <div className="mb-6">
            <ShiprocketErrorDisplay
              error={testConnectionMutation.error}
              onRetry={handleRetryConnection}
            />
          </div>
        )}

        <Tabs defaultValue="settings">
          <TabsList className="mb-4">
            <TabsTrigger value="settings">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              disabled={!connectionStatus?.connected}
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              Pending Orders
            </TabsTrigger>
            <TabsTrigger
              value="shipments"
              disabled={!connectionStatus?.connected}
            >
              <TruckIcon className="h-4 w-4 mr-2" />
              Shipments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Account</CardTitle>
                  <CardDescription>
                    Connect your shipping account to automate shipping and order
                    tracking.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={settings.email}
                        onChange={(e) =>
                          setSettings({ ...settings, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder={
                          settings.password === "********"
                            ? "********"
                            : "Enter password"
                        }
                        value={settings.password}
                        onChange={(e) =>
                          setSettings({ ...settings, password: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={
                      !connectionStatus?.connected || isTestingConnection
                    }
                  >
                    {isTestingConnection ? (
                      <>
                        <Skeleton className="h-4 w-4 mr-2 rounded-full animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                  <Button onClick={handleConnect} disabled={isConnecting}>
                    {isConnecting ? (
                      <>
                        <Skeleton className="h-4 w-4 mr-2 rounded-full animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        {connectionStatus?.connected
                          ? "Update Connection"
                          : "Connect"}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shipping Configuration</CardTitle>
                  <CardDescription>
                    Configure default shipping options and automation settings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultCourier">Default Courier</Label>
                      <Select
                        disabled={!connectionStatus?.connected}
                        value={settings.defaultCourier}
                        onValueChange={(value) =>
                          setSettings({ ...settings, defaultCourier: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a courier" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingCouriers ? (
                            <div className="p-2 flex justify-center">
                              <Skeleton className="h-4 w-full" />
                            </div>
                          ) : couriers && couriers.length > 0 ? (
                            couriers.map((courier: ShippingCourier) => (
                              <SelectItem
                                key={courier.id}
                                value={courier.id}
                                disabled={!courier.rate?.is_available}
                              >
                                <div className="flex flex-col">
                                  <div className="font-medium">
                                    {courier.name}
                                  </div>
                                  {courier.rate && (
                                    <>
                                      <div className="text-sm">
                                        <span className="font-medium">
                                          ₹{courier.rate.price}
                                        </span>
                                        {courier.codCharge &&
                                          courier.codCharge > 0 && (
                                            <span className="text-gray-500 ml-2">
                                              (COD: ₹{courier.codCharge})
                                            </span>
                                          )}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {courier.rate.estimated_days && (
                                          <span>
                                            Estimated delivery:{" "}
                                            {courier.rate.estimated_days}
                                          </span>
                                        )}
                                        {courier.rate.weight_limit > 0 && (
                                          <span className="ml-1">
                                            • Max weight:{" "}
                                            {courier.rate.weight_limit}kg
                                          </span>
                                        )}
                                        {courier.rate.dimensions && (
                                          <span className="ml-1">
                                            • Max dimensions:{" "}
                                            {courier.rate.dimensions.length}x
                                            {courier.rate.dimensions.width}x
                                            {courier.rate.dimensions.height}cm
                                          </span>
                                        )}
                                        {courier.codLimit &&
                                          courier.codLimit > 0 && (
                                            <span className="ml-1">
                                              • COD Limit: ₹{courier.codLimit}
                                            </span>
                                          )}
                                        {!courier.rate.is_available && (
                                          <span className="text-red-500 ml-1">
                                            (Not available)
                                          </span>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-center text-muted-foreground">
                              No couriers available
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-ship">Auto Ship Orders</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically create shipments for new orders
                        </p>
                      </div>
                      <Switch
                        id="auto-ship"
                        disabled={!connectionStatus?.connected}
                        checked={settings.autoShipEnabled}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, autoShipEnabled: checked })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={handleSaveSettings}
                    disabled={
                      !connectionStatus?.connected ||
                      saveSettingsMutation.isPending
                    }
                  >
                    {saveSettingsMutation.isPending ? (
                      <>
                        <Skeleton className="h-4 w-4 mr-2 rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Settings"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Orders</CardTitle>
                <CardDescription>
                  Orders that are ready to be shipped
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPendingOrders ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-md" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !pendingOrders ||
                  !Array.isArray(pendingOrders) ||
                  pendingOrders.length === 0 ? (
                  <div className="py-12 text-center">
                    <PackageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No pending orders</h3>
                    <p className="text-sm text-muted-foreground">
                      All orders have been shipped or there are no new orders
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingOrders.map((order: PendingOrder) => {
                        const shippingInfo = parseShippingDetails(
                          order.shippingDetails
                        );
                        return (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              #{order.id}
                            </TableCell>
                            <TableCell>{shippingInfo.name || "N/A"}</TableCell>
                            <TableCell>
                              {order.items?.length || 0} items
                            </TableCell>
                            <TableCell>₹{order.total.toFixed(2)}</TableCell>
                            <TableCell>{formatDate(order.date)}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  createShipmentMutation.mutate(order.id)
                                }
                                disabled={createShipmentMutation.isPending}
                              >
                                {createShipmentMutation.isPending ? (
                                  <Skeleton className="h-4 w-4 rounded-full animate-spin" />
                                ) : (
                                  <TruckIcon className="h-4 w-4 mr-1" />
                                )}
                                Ship
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipments">
            <Card>
              <CardHeader>
                <CardTitle>Recent Shipments</CardTitle>
                <CardDescription>
                  View and manage your recent shipments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingShipments ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-md" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !shipments || shipments.length === 0 ? (
                  <div className="py-12 text-center">
                    <TruckIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No shipments yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Start shipping orders to see them here
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tracking ID</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Courier</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shipments.map((shipment: ShippingShipment) => (
                        <TableRow key={shipment.id}>
                          <TableCell className="font-medium">
                            {shipment.tracking_id}
                          </TableCell>
                          <TableCell>#{shipment.order_id}</TableCell>
                          <TableCell>{shipment.courier}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(shipment.status)}>
                              {shipment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDate(shipment.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={`/admin/tracking/${shipment.tracking_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Track
                                </a>
                              </Button>
                              {shipment.status.toLowerCase() !==
                                "delivered" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    cancelShipmentMutation.mutate(
                                      parseInt(shipment.order_id)
                                    )
                                  }
                                  disabled={cancelShipmentMutation.isPending}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
