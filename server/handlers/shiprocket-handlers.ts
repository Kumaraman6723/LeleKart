import { Request, Response } from "express";
import axios from "axios";
import { storage } from "../storage";
import { db } from "../db";
import { shiprocketSettings, orders } from "@shared/schema";
import { eq, inArray, not, and, isNull, desc, sql } from "drizzle-orm";

const SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";

/**
 * Helper function to generate a fresh Shiprocket token for each API request
 * Following the recommendation to always generate a new token for each API call
 */
async function getShiprocketToken(): Promise<string | null> {
  try {
    // Get the settings from the database - order by id to get a consistent record
    // This helps when there are multiple entries in the shiprocket_settings table
    const settings = await db
      .select()
      .from(shiprocketSettings)
      .orderBy(shiprocketSettings.id);

    if (
      !settings ||
      settings.length === 0 ||
      !settings[0].email ||
      !settings[0].password
    ) {
      console.error("Shiprocket credentials not configured");
      return null;
    }

    // Use the first valid setting record consistently
    const setting = settings[0];

    // Always generate a fresh token as recommended
    console.log("Generating new Shiprocket token...");
    try {
      const response = await axios.post(`${SHIPROCKET_API_BASE}/auth/login`, {
        email: setting.email,
        password: setting.password,
      });

      if (response.data.token) {
        console.log("New Shiprocket token generated successfully");

        // Store the token for reference, but we will continue to get a fresh one each time
        await db
          .update(shiprocketSettings)
          .set({ token: response.data.token, updatedAt: new Date() })
          .where(eq(shiprocketSettings.id, setting.id));

        return response.data.token;
      } else {
        console.error(
          "Failed to generate Shiprocket token - no token in response"
        );
        return null;
      }
    } catch (tokenError: any) {
      // Check for specific error responses
      const status = tokenError?.response?.status;
      const errorMessage =
        tokenError?.response?.data?.message || "Unknown error";

      console.log("Shiprocket token generation failed:", errorMessage);

      // For 403 Forbidden errors, account might lack necessary permissions
      if (status === 403) {
        throw new Error(
          `Unauthorized! You do not have the required permissions.`
        );
      }

      // For authentication errors
      if (
        status === 401 ||
        (errorMessage && errorMessage.toLowerCase().includes("auth"))
      ) {
        throw new Error(
          `Authentication failed! Please check your Shiprocket credentials.`
        );
      }

      throw tokenError;
    }
  } catch (error: unknown) {
    console.error("Error in getShiprocketToken:", error);
    // Add type assertion or check if needed for specific error handling here
    throw error; // Re-throw to allow proper error handling upstream
  }
}

/**
 * Get Shiprocket settings handler
 */
export async function getShiprocketSettings(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get settings from the database - order by id to get a consistent record
    const settings = await db
      .select()
      .from(shiprocketSettings)
      .orderBy(shiprocketSettings.id);

    if (!settings || settings.length === 0) {
      // Create default settings if none exist
      const [newSettings] = await db
        .insert(shiprocketSettings)
        .values({
          email: "",
          password: "",
          token: "",
          defaultCourier: "",
          autoShipEnabled: false,
          updatedAt: new Date(),
        })
        .returning();

      return res.status(200).json({
        ...newSettings,
        password: "", // Don't send password to client
      });
    }

    // Use the first record consistently
    const setting = settings[0];

    return res.status(200).json({
      ...setting,
      password: "", // Don't send password to client
    });
  } catch (error) {
    console.error("Error getting Shiprocket settings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Save Shiprocket settings handler
 */
export async function saveShiprocketSettings(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { email, password, defaultCourier, autoShipEnabled } = req.body;

    console.log("Saving Shiprocket settings:", {
      email: email ? email : "not provided",
      passwordProvided: password ? "yes" : "no",
      defaultCourier: defaultCourier || "not provided",
      autoShipEnabled: autoShipEnabled === true ? "enabled" : "disabled",
    });

    // Get settings from the database - order by id to get a consistent record
    const settings = await db
      .select()
      .from(shiprocketSettings)
      .orderBy(shiprocketSettings.id);

    if (!settings || settings.length === 0) {
      // Create new settings
      const [newSettings] = await db
        .insert(shiprocketSettings)
        .values({
          email,
          password: password || "",
          token: "",
          defaultCourier: defaultCourier || "",
          autoShipEnabled: autoShipEnabled || false,
          updatedAt: new Date(),
        })
        .returning();

      return res.status(200).json({
        ...newSettings,
        password: "", // Don't send password to client
      });
    }

    // Use the first record consistently
    const setting = settings[0];

    // Update settings
    const updateData: any = {
      email,
      defaultCourier: defaultCourier || "",
      autoShipEnabled: autoShipEnabled || false,
      updatedAt: new Date(),
    };

    // Only update password if provided
    if (password) {
      updateData.password = password;
      // Clear token if password changed
      updateData.token = "";
    }

    const [updatedSettings] = await db
      .update(shiprocketSettings)
      .set(updateData)
      .where(eq(shiprocketSettings.id, setting.id))
      .returning();

    return res.status(200).json({
      ...updatedSettings,
      password: "", // Don't send password to client
    });
  } catch (error) {
    console.error("Error saving Shiprocket settings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Generate Shiprocket API token handler
 */
export async function generateShiprocketToken(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get credentials from request body if provided
    const { email, password } = req.body;

    // Get settings from the database - order by id to get a consistent record
    const settings = await db
      .select()
      .from(shiprocketSettings)
      .orderBy(shiprocketSettings.id);

    // If no settings found, create new settings
    if (!settings || settings.length === 0) {
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      try {
        // Generate token with provided credentials
        const response = await axios.post(`${SHIPROCKET_API_BASE}/auth/login`, {
          email,
          password,
        });

        if (response.data.token) {
          // Create new settings with token
          const [newSettings] = await db
            .insert(shiprocketSettings)
            .values({
              email,
              password,
              token: response.data.token,
              updatedAt: new Date(),
            })
            .returning();

          return res.status(200).json({
            ...newSettings,
            password: "", // Don't send password to client
          });
        } else {
          return res.status(400).json({ error: "Failed to generate token" });
        }
      } catch (error) {
        console.error("Error generating Shiprocket token:", error);

        if (error.response && error.response.data) {
          return res.status(400).json({
            error: "Authentication failed with Shiprocket API",
            details: error.response.data,
          });
        }

        return res
          .status(500)
          .json({ error: "Failed to authenticate with Shiprocket API" });
      }
    }

    // Use the first record consistently
    const setting = settings[0];

    // Use new credentials if provided, otherwise use existing credentials
    const credentialsToUse = {
      email: email || setting.email,
      password: password || setting.password,
    };

    console.log("Using credentials: ", {
      email: credentialsToUse.email,
      password: credentialsToUse.password ? "******" : "empty",
    });

    if (!credentialsToUse.email || !credentialsToUse.password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    try {
      // Generate token
      const response = await axios.post(`${SHIPROCKET_API_BASE}/auth/login`, {
        email: credentialsToUse.email,
        password: credentialsToUse.password,
      });

      if (response.data.token) {
        // Update settings with new credentials if provided
        const updateData: any = {
          token: response.data.token,
          updatedAt: new Date(),
        };

        // Only update email/password if new ones were provided
        if (email) updateData.email = email;
        if (password) updateData.password = password;

        const [updatedSettings] = await db
          .update(shiprocketSettings)
          .set(updateData)
          .where(eq(shiprocketSettings.id, setting.id))
          .returning();

        return res.status(200).json({
          ...updatedSettings,
          password: "", // Don't send password to client
        });
      } else {
        return res.status(400).json({ error: "Failed to generate token" });
      }
    } catch (error) {
      console.error("Error generating Shiprocket token:", error);

      if (error.response && error.response.data) {
        return res.status(400).json({
          error: "Authentication failed with Shiprocket API",
          details: error.response.data,
        });
      }

      return res
        .status(500)
        .json({ error: "Failed to authenticate with Shiprocket API" });
    }
  } catch (error) {
    console.error("Error generating Shiprocket token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get courier rates for an order
 */
async function getCourierRates(token: string, orderData: any) {
  try {
    const response = await axios.post(
      `${SHIPROCKET_API_BASE}/courier/serviceability/`,
      {
        pickup_postcode: "110001", // Default pickup postcode, should be configurable
        delivery_postcode: orderData.shipping_pincode,
        weight: orderData.weight,
        cod: orderData.payment_method === "COD" ? 1 : 0,
        length: orderData.length,
        breadth: orderData.breadth,
        height: orderData.height,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error(
      "Error getting courier rates:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * Get Shiprocket couriers handler
 */
export async function getShiprocketCouriers(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get token (this will automatically refresh if expired)
    let token;
    try {
      token = await getShiprocketToken();

      if (!token) {
        return res.status(400).json({
          error: "Shiprocket token not available",
          message:
            "Please check your Shiprocket credentials or generate a new token.",
          code: "TOKEN_MISSING",
        });
      }
    } catch (tokenError: any) {
      console.log("Shiprocket API error details:", tokenError.message);

      // Catch permission errors specifically
      if (tokenError.message && tokenError.message.includes("Unauthorized")) {
        return res.status(403).json({
          error: "API Permission Error",
          message:
            "Your Shiprocket account doesn't have the necessary API access permissions. This typically requires a Business plan or higher.",
          details:
            "Please upgrade your Shiprocket plan or contact Shiprocket support to enable API access.",
          code: "PERMISSION_ERROR",
        });
      }

      // For other token errors
      return res.status(400).json({
        error: "Error getting Shiprocket token",
        message:
          tokenError.message || "Please check your Shiprocket credentials.",
        code: "TOKEN_ERROR",
      });
    }

    // Get order details from request if provided
    const { orderId } = req.query;
    let courierRates = null;

    if (orderId) {
      // Get order details
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, parseInt(orderId as string)));

      if (order) {
        // Get order items
        const orderItems = await storage.getOrderItems(order.id);

        // Get shipping address
        const address = order.addressId
          ? await storage.getUserAddress(order.addressId)
          : null;

        if (address) {
          // Calculate total weight and dimensions
          let totalWeight = 0;
          let maxLength = 0;
          let maxWidth = 0;
          let maxHeight = 0;

          for (const item of orderItems) {
            const product = await storage.getProduct(item.productId);
            if (product) {
              // Add weight for each item (weight is in kg)
              const productWeight = parseFloat(product.weight as any) || 0.5;
              totalWeight += productWeight * item.quantity;

              // Update max dimensions (dimensions are in cm)
              const productLength = parseFloat(product.length as any) || 10;
              const productWidth = parseFloat(product.width as any) || 10;
              const productHeight = parseFloat(product.height as any) || 10;

              maxLength = Math.max(maxLength, productLength);
              maxWidth = Math.max(maxWidth, productWidth);
              maxHeight = Math.max(maxHeight, productHeight);
            }
          }

          // Get courier rates
          try {
            courierRates = await getCourierRates(token, {
              shipping_pincode: address.pincode,
              weight: totalWeight / 1000, // Convert to kg
              length: maxLength || 10,
              breadth: maxWidth || 10,
              height: maxHeight || 10,
              payment_method: order.paymentMethod,
            });
          } catch (rateError) {
            console.error("Error getting courier rates:", rateError);
            // Continue without rates
          }
        }
      }
    }

    // Fetch couriers
    try {
      // Using a second try/catch block to handle API errors specifically
      const response = await axios.get(
        `${SHIPROCKET_API_BASE}/courier/courierListWithCounts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Combine courier list with rates if available
      const couriers = response.data.data;
      if (courierRates && courierRates.data) {
        // Add rates to courier data
        const couriersWithRates = couriers.map((courier: any) => {
          const rate = courierRates.data.available_courier_companies.find(
            (c: any) => c.courier_company_id === courier.id
          );
          return {
            ...courier,
            rate: rate
              ? {
                  price: rate.rate,
                  estimated_days: rate.estimated_days,
                  is_available: true,
                }
              : {
                  price: null,
                  estimated_days: null,
                  is_available: false,
                },
          };
        });

        return res.status(200).json({
          ...response.data,
          data: couriersWithRates,
        });
      }

      return res.status(200).json(response.data);
    } catch (apiError: any) {
      console.error(
        "Error in Shiprocket API call:",
        apiError?.response?.data || apiError.message
      );

      // If we get a 401, token might have just expired (rare race condition)
      if (apiError?.response?.status === 401) {
        // Force token refresh by invalidating the current token in the database
        const settings = await db
          .select()
          .from(shiprocketSettings)
          .orderBy(shiprocketSettings.id);
        if (settings && settings.length > 0) {
          // Use the first record consistently
          const setting = settings[0];
          await db
            .update(shiprocketSettings)
            .set({ token: "" })
            .where(eq(shiprocketSettings.id, setting.id));

          // Suggest the client try again
          return res.status(401).json({
            error: "Token refresh required",
            message: "Please try again in a moment",
          });
        }
      }

      // Specifically handle 403 permission errors
      if (apiError?.response?.status === 403) {
        return res.status(403).json({
          error: "Unauthorized! You do not have the required permissions.",
          message:
            "Your Shiprocket account doesn't have the necessary API access permissions. Please upgrade your Shiprocket plan or contact Shiprocket support to enable API access for courier services.",
          details: apiError.response.data,
        });
      }

      if (apiError?.response?.data) {
        return res.status(apiError.response.status || 400).json({
          error: "Error from Shiprocket API",
          message:
            apiError.response.data.message ||
            "An error occurred while communicating with Shiprocket API",
          details: apiError.response.data,
        });
      }

      return res
        .status(500)
        .json({ error: "Failed to communicate with Shiprocket API" });
    }
  } catch (error: any) {
    console.error("Error in getShiprocketCouriers handler:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get pending orders for Shiprocket shipping
 */
export async function getPendingShiprocketOrders(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get pagination parameters from query
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    console.log("Fetching pending Shiprocket orders from database...");

    // Get total count of orders with status 'pending'
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "pending"));

    // Get paginated orders with status 'pending'
    const pendingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.status, "pending"))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(orders.date)); // Order by most recent first using date field

    console.log(`Found ${pendingOrders.length} pending orders in the database`);

    // Get additional data for each order
    const ordersWithDetails = await Promise.all(
      pendingOrders.map(async (order) => {
        try {
          const orderItems = await storage.getOrderItems(order.id);
          const address = order.addressId
            ? await storage.getUserAddress(order.addressId)
            : null;
          const userDetails = await storage.getUser(order.userId);

          return {
            ...order,
            items: orderItems.map((item) => ({
              ...item,
              productDetails: item.product
                ? {
                    name: item.product.name,
                    // Add other product details as needed
                  }
                : null,
            })),
            address: address
              ? {
                  street: address.address, // Use address field instead of street
                  additionalInfo: "", // Add if needed
                  city: address.city,
                  state: address.state,
                  pincode: address.pincode,
                  phone: address.phone,
                }
              : null,
            user: userDetails
              ? {
                  id: userDetails.id,
                  name: userDetails.name || "Customer",
                  email: userDetails.email || "customer@example.com",
                  phone: userDetails.phone || "1234567890",
                }
              : null,
          };
        } catch (error) {
          console.error(`Error fetching details for order ${order.id}:`, error);
          return {
            ...order,
            items: [],
            address: null,
            user: null,
            error: "Failed to fetch order details",
          };
        }
      })
    );

    return res.status(200).json({
      orders: ordersWithDetails,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("Error getting pending Shiprocket orders:", error);
    return res.status(500).json({
      error: "Internal server error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch pending orders",
    });
  }
}

/**
 * Auto-ship orders with Shiprocket
 * This will find all pending orders and ship them with the default courier
 */
export async function autoShipWithShiprocket(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get settings to check if auto-ship is enabled and get default courier
    const settings = await db
      .select()
      .from(shiprocketSettings)
      .orderBy(shiprocketSettings.id);

    if (!settings || settings.length === 0) {
      return res.status(400).json({
        error: "Shiprocket settings not configured",
        message:
          "Please configure your Shiprocket settings in the Shipping Settings page before using auto-ship.",
      });
    }

    // Use the first record consistently
    const setting = settings[0];

    if (!setting.defaultCourier) {
      return res.status(400).json({
        error: "Default courier not configured",
        message:
          "Please configure a default courier in your Shiprocket settings to use auto-ship. You can do this in the Shiprocket dashboard under Settings > Shipping > Courier Priority.",
      });
    }

    // Get pending orders
    const pendingOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.status, "confirmed"),
          isNull(orders.shiprocketOrderId),
          not(eq(orders.paymentMethod, "cod"))
        )
      );

    if (pendingOrders.length === 0) {
      return res
        .status(200)
        .json({ message: "No pending orders to ship", shipped: 0 });
    }

    // Ship each order
    const shipResults = [];
    let successCount = 0;

    for (const order of pendingOrders) {
      try {
        // Get token
        let token;
        token = await getShiprocketToken();

        if (!token) {
          return res
            .status(400)
            .json({ error: "Shiprocket token not available" });
        }

        // Get order items
        const orderItems = await storage.getOrderItems(order.id);

        // Get shipping address
        const address = order.addressId
          ? await storage.getUserAddress(order.addressId)
          : null;

        if (!address) {
          shipResults.push({
            orderId: order.id,
            success: false,
            error: "Shipping address not found",
          });
          continue;
        }

        // Get user details
        const user = await storage.getUser(order.userId);

        if (!user) {
          shipResults.push({
            orderId: order.id,
            success: false,
            error: "User not found",
          });
          continue;
        }

        // Calculate total weight and dimensions
        let totalWeight = 0;
        let maxLength = 0;
        let maxWidth = 0;
        let maxHeight = 0;

        for (const item of orderItems) {
          const product = await storage.getProduct(item.productId);
          if (product) {
            // Add weight for each item (weight is in kg)
            const productWeight = parseFloat(product.weight as any) || 0.5;
            totalWeight += productWeight * item.quantity;

            // Update max dimensions (dimensions are in cm)
            const productLength = parseFloat(product.length as any) || 10;
            const productWidth = parseFloat(product.width as any) || 10;
            const productHeight = parseFloat(product.height as any) || 10;

            maxLength = Math.max(maxLength, productLength);
            maxWidth = Math.max(maxWidth, productWidth);
            maxHeight = Math.max(maxHeight, productHeight);
          }
        }

        // Transform order data for Shiprocket API
        const shiprocketOrderData = {
          order_id: `ORD-${order.id}`,
          order_date: new Date(order.date).toISOString().split("T")[0],
          pickup_location: "Primary",
          channel_id: "",
          comment: "Order from LeLeKart (Auto-shipped)",
          billing_customer_name: user.name || user.username,
          billing_last_name: "",
          billing_address: address.address,
          billing_address_2: "",
          billing_city: address.city,
          billing_pincode: address.pincode,
          billing_state: address.state,
          billing_country: "India",
          billing_email: user.email,
          billing_phone: user.phone || address.phone,
          shipping_is_billing: true,
          shipping_customer_name: user.name || user.username,
          shipping_last_name: "",
          shipping_address: address.address,
          shipping_address_2: "",
          shipping_city: address.city,
          shipping_pincode: address.pincode,
          shipping_state: address.state,
          shipping_country: "India",
          shipping_email: user.email,
          shipping_phone: user.phone || address.phone,
          order_items: orderItems.map((item) => ({
            name: item.product?.name || `Product ID: ${item.productId}`,
            sku: `SKU-${item.productId}`,
            units: item.quantity,
            selling_price: item.price / 100, // Convert from paisa to rupees
            discount: "",
            tax: "",
            hsn: "",
          })),
          payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
          shipping_charges: 0,
          giftwrap_charges: 0,
          transaction_charges: 0,
          total_discount: 0,
          sub_total: order.total / 100, // Convert from paisa to rupees
          length: maxLength || 10, // Use calculated max length or default to 10cm
          breadth: maxWidth || 10, // Use calculated max width or default to 10cm
          height: maxHeight || 10, // Use calculated max height or default to 10cm
          weight: totalWeight / 1000 || 0.5, // Use calculated total weight (converted to kg) or default to 0.5kg
        };

        // Create order in Shiprocket
        const response = await axios.post(
          `${SHIPROCKET_API_BASE}/orders/create/adhoc`,
          shiprocketOrderData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.order_id) {
          // Generate shipment with default courier
          const shipmentResponse = await axios.post(
            `${SHIPROCKET_API_BASE}/shipments/create/adhoc`,
            {
              shipment_id: response.data.shipment_id,
              courier_id: setting.defaultCourier,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          // Update order with Shiprocket details
          const [updatedOrder] = await db
            .update(orders)
            .set({
              shiprocketOrderId: response.data.order_id.toString(),
              shiprocketShipmentId: response.data.shipment_id.toString(),
              shippingStatus: "processing",
              status: "shipped",
              ...(shipmentResponse.data
                ? {
                    awbCode: shipmentResponse.data.awb_code,
                    courierName: shipmentResponse.data.courier_name,
                    estimatedDeliveryDate: shipmentResponse.data
                      .expected_delivery_date
                      ? new Date(shipmentResponse.data.expected_delivery_date)
                      : null,
                  }
                : {}),
            })
            .where(eq(orders.id, order.id))
            .returning();

          shipResults.push({
            orderId: order.id,
            success: true,
            shiprocketOrderId: response.data.order_id.toString(),
            shiprocketShipmentId: response.data.shipment_id.toString(),
            awbCode: shipmentResponse.data?.awb_code || null,
          });

          successCount++;
        } else {
          shipResults.push({
            orderId: order.id,
            success: false,
            error: "Failed to create order in Shiprocket",
          });
        }
      } catch (error: any) {
        console.error(
          `Error auto-shipping order ${order.id}:`,
          error.response?.data || error.message
        );
        shipResults.push({
          orderId: order.id,
          success: false,
          error:
            error.response?.data?.message || error.message || "Unknown error",
        });
      }
    }

    return res.status(200).json({
      message: `Auto-shipped ${successCount} of ${pendingOrders.length} orders`,
      shipped: successCount,
      total: pendingOrders.length,
      results: shipResults,
    });
  } catch (error: any) {
    console.error(
      "Error auto-shipping with Shiprocket:",
      error.response?.data || error.message
    );

    // Check for specific errors and provide more helpful messages
    if (error.message && error.message.includes("Unauthorized")) {
      return res.status(403).json({
        error: "Unauthorized! You do not have the required permissions.",
        message:
          "Your Shiprocket account doesn't have the necessary API access permissions. Please upgrade your Shiprocket plan or contact Shiprocket support to enable API access.",
      });
    }

    if (error.response?.data) {
      return res.status(error.response?.status || 500).json({
        error: error.response.data.message || "Shiprocket API Error",
        details: error.response.data,
        message:
          "There was an error communicating with Shiprocket. Please check your credentials and try again.",
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message:
        error.message ||
        "An unexpected error occurred while processing your request.",
    });
  }
}

/**
 * Get orders shipped with Shiprocket
 */
export async function getShiprocketOrders(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get orders that have been shipped with Shiprocket
    const shippedOrders = await db
      .select()
      .from(orders)
      .where(not(isNull(orders.shiprocketOrderId)));

    // Get additional data for each order
    const ordersWithDetails = await Promise.all(
      shippedOrders.map(async (order) => {
        const orderItems = await storage.getOrderItems(order.id);

        return {
          ...order,
          items: orderItems,
        };
      })
    );

    return res.status(200).json(ordersWithDetails);
  } catch (error) {
    console.error("Error getting Shiprocket orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Ship order via Shiprocket
 */
export async function shipOrderWithShiprocket(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { orderId, courierCompany } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    // Get order
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.shiprocketOrderId) {
      return res
        .status(400)
        .json({ error: "Order already shipped with Shiprocket" });
    }

    // Get token
    let token;
    try {
      token = await getShiprocketToken();

      if (!token) {
        return res.status(400).json({
          error: "Shiprocket token not available",
          message: "Please check your Shiprocket credentials in Settings.",
        });
      }
    } catch (tokenError: any) {
      // Handle permission errors specifically
      if (tokenError.message && tokenError.message.includes("Unauthorized")) {
        return res.status(403).json({
          error: "Unauthorized! You do not have the required permissions.",
          message:
            "Your Shiprocket account doesn't have the necessary API access permissions. Please upgrade your Shiprocket plan or contact Shiprocket support to enable API access.",
        });
      }

      // For other token errors
      return res.status(400).json({
        error: "Error getting Shiprocket token",
        message:
          tokenError.message || "Please check your Shiprocket credentials.",
      });
    }

    // Get order items
    const orderItems = await storage.getOrderItems(order.id);

    // Calculate total weight and dimensions
    let totalWeight = 0;
    let maxLength = 0;
    let maxWidth = 0;
    let maxHeight = 0;

    for (const item of orderItems) {
      const product = await storage.getProduct(item.productId);
      if (product) {
        // Add weight for each item (weight is in kg)
        const productWeight = parseFloat(product.weight as any) || 0.5;
        totalWeight += productWeight * item.quantity;

        // Update max dimensions (dimensions are in cm)
        const productLength = parseFloat(product.length as any) || 10;
        const productWidth = parseFloat(product.width as any) || 10;
        const productHeight = parseFloat(product.height as any) || 10;

        maxLength = Math.max(maxLength, productLength);
        maxWidth = Math.max(maxWidth, productWidth);
        maxHeight = Math.max(maxHeight, productHeight);
      }
    }

    // Get shipping address
    const address = order.addressId
      ? await storage.getUserAddress(order.addressId)
      : null;

    if (!address) {
      return res.status(400).json({ error: "Shipping address not found" });
    }

    // Get user details
    const user = await storage.getUser(order.userId);

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Transform order data for Shiprocket API
    const shiprocketOrderData = {
      order_id: `ORD-${order.id}`,
      order_date: new Date(order.date).toISOString().split("T")[0],
      pickup_location: "Primary",
      channel_id: "",
      comment: "Order from LeLeKart",
      billing_customer_name: user.name || user.username,
      billing_last_name: "",
      billing_address: address.address,
      billing_address_2: "",
      billing_city: address.city,
      billing_pincode: address.pincode,
      billing_state: address.state,
      billing_country: "India",
      billing_email: user.email,
      billing_phone: user.phone || address.phone,
      shipping_is_billing: true,
      shipping_customer_name: user.name || user.username,
      shipping_last_name: "",
      shipping_address: address.address,
      shipping_address_2: "",
      shipping_city: address.city,
      shipping_pincode: address.pincode,
      shipping_state: address.state,
      shipping_country: "India",
      shipping_email: user.email,
      shipping_phone: user.phone || address.phone,
      order_items: orderItems.map((item) => ({
        name: item.product?.name || `Product ID: ${item.productId}`,
        sku: `SKU-${item.productId}`,
        units: item.quantity,
        selling_price: item.price, // Convert from paisa to rupees
        discount: "",
        tax: "",
        hsn: "",
      })),
      payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: order.total, // Convert from paisa to rupees
      length: maxLength || 10, // Use calculated max length or default to 10cm
      breadth: maxWidth || 10, // Use calculated max width or default to 10cm
      height: maxHeight || 10, // Use calculated max height or default to 10cm
      weight: totalWeight / 1000 || 0.5, // Use calculated total weight (converted to kg) or default to 0.5kg
    };

    // Create order in Shiprocket
    const response = await axios.post(
      `${SHIPROCKET_API_BASE}/orders/create/adhoc`,
      shiprocketOrderData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.order_id) {
      // If courier company provided, generate shipment
      let shipmentResponse = null;
      if (courierCompany) {
        try {
          shipmentResponse = await axios.post(
            `${SHIPROCKET_API_BASE}/shipments/create/adhoc`,
            {
              shipment_id: response.data.shipment_id,
              courier_id: courierCompany,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
        } catch (shipmentError: any) {
          console.error(
            "Error generating shipment:",
            shipmentError.response?.data || shipmentError.message
          );
          // Continue with order creation even if shipment generation fails
        }
      }

      // Update order with Shiprocket details
      const [updatedOrder] = await db
        .update(orders)
        .set({
          shiprocketOrderId: response.data.order_id.toString(),
          shiprocketShipmentId: response.data.shipment_id.toString(),
          shippingStatus: "processing",
          status: "shipped",
          ...(shipmentResponse?.data
            ? {
                awbCode: shipmentResponse.data.awb_code,
                courierName: shipmentResponse.data.courier_name,
                estimatedDeliveryDate: shipmentResponse.data
                  .expected_delivery_date
                  ? new Date(shipmentResponse.data.expected_delivery_date)
                  : null,
              }
            : {}),
        })
        .where(eq(orders.id, order.id))
        .returning();

      // Get updated order details to return
      const orderDetails = {
        ...updatedOrder,
        items: await storage.getOrderItems(updatedOrder.id),
      };

      return res.status(200).json(orderDetails);
    } else {
      console.error("Invalid response from Shiprocket:", response.data);
      return res.status(400).json({
        error: "Failed to create order in Shiprocket",
        details: response.data,
        message:
          "The Shiprocket API returned an invalid response. Please try again.",
      });
    }
  } catch (error: any) {
    console.error(
      "Error shipping order with Shiprocket:",
      error.response?.data || error.message
    );

    // Check for specific errors and provide more helpful messages
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: "Shiprocket API endpoint not found",
        message:
          "The Shiprocket API endpoint is not available. Please check your Shiprocket account status and try again.",
        details: error.response.data,
      });
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(error.response.status).json({
        error: "Authentication failed",
        message:
          "Your Shiprocket credentials are invalid or expired. Please refresh your token and try again.",
        details: error.response.data,
      });
    }

    if (error.response?.data) {
      return res.status(error.response?.status || 500).json({
        error: error.response.data.message || "Error from Shiprocket API",
        details: error.response.data,
        message:
          "There was an error communicating with Shiprocket. Please check your credentials and try again.",
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message:
        error.message ||
        "An unexpected error occurred while processing your request.",
    });
  }
}

/**
 * Test Shiprocket connection by retrieving couriers
 */
export async function testShiprocketConnection(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get token (this will automatically refresh if expired)
    let token;
    try {
      token = await getShiprocketToken();

      if (!token) {
        return res.status(400).json({
          error: "Shiprocket token not available",
          message:
            "Please check your Shiprocket credentials or generate a new token.",
          code: "TOKEN_MISSING",
        });
      }
    } catch (tokenError: any) {
      console.log("Shiprocket API error details:", tokenError.message);

      // Catch permission errors specifically
      if (tokenError.message && tokenError.message.includes("Unauthorized")) {
        return res.status(403).json({
          error: "API Permission Error",
          message:
            "Your Shiprocket account doesn't have the necessary API access permissions. This typically requires a Business plan or higher.",
          details:
            "Please upgrade your Shiprocket plan or contact Shiprocket support to enable API access.",
          code: "PERMISSION_ERROR",
        });
      }

      // For other token errors
      return res.status(400).json({
        error: "Error getting Shiprocket token",
        message:
          tokenError.message || "Please check your Shiprocket credentials.",
        code: "TOKEN_ERROR",
      });
    }

    // Test API access by getting courier companies
    try {
      const response = await axios.get(
        `${SHIPROCKET_API_BASE}/courier/courierListWithCounts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.status(200).json({
        success: true,
        message: "Successfully connected to Shiprocket API",
      });
    } catch (apiError: any) {
      console.error(
        "Error in Shiprocket API test call:",
        apiError?.response?.data || apiError.message
      );

      if (apiError?.response?.data) {
        return res.status(apiError.response.status || 400).json({
          error: "Error from Shiprocket API",
          message:
            apiError.response.data.message ||
            "An error occurred while communicating with Shiprocket API",
          details: apiError.response.data,
        });
      }

      return res.status(500).json({
        error: "Failed to communicate with Shiprocket API",
        message: apiError.message || "Connection test failed",
      });
    }
  } catch (error: any) {
    console.error("Error in testShiprocketConnection:", error);
    return res.status(500).json({
      error: "Internal server error",
      message:
        error.message ||
        "An unexpected error occurred while processing your request.",
    });
  }
}
