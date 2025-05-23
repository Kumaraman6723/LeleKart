import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  foreignKey,
  doublePrecision,
  jsonb,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Shiprocket Integration Settings
export const shiprocketSettings = pgTable("shiprocket_settings", {
  id: serial("id").primaryKey(),
  email: text("email"),
  password: text("password"),
  token: text("token"),
  defaultCourier: text("default_courier"),
  autoShipEnabled: boolean("auto_ship_enabled").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertShiprocketSettingsSchema = createInsertSchema(
  shiprocketSettings
).pick({
  email: true,
  password: true,
  token: true,
  defaultCourier: true,
  autoShipEnabled: true,
});

// Define notification types
export enum NotificationType {
  ORDER_STATUS = "ORDER_STATUS",
  PRODUCT_APPROVAL = "PRODUCT_APPROVAL",
  PRICE_DROP = "PRICE_DROP",
  NEW_MESSAGE = "NEW_MESSAGE",
  SYSTEM = "SYSTEM",
  WALLET = "WALLET",
}

// User schema with role
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("buyer"),
  name: text("name"),
  phone: text("phone"),
  address: text("address"),
  profileImage: text("profile_image"), // Profile image URL
  approved: boolean("approved").notNull().default(false), // Sellers need admin approval
  rejected: boolean("rejected").notNull().default(false), // For rejected sellers
  isCoAdmin: boolean("is_co_admin").default(false), // Designates a user as a co-admin
  permissions: jsonb("permissions").default("{}"), // JSON object containing permission settings
  notificationPreferences: jsonb("notification_preferences").default("{}"), // User notification preferences
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  name: true,
  phone: true,
  address: true,
  profileImage: true,
  approved: true,
  rejected: true,
  isCoAdmin: true,
  permissions: true,
  notificationPreferences: true,
});

// Product schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  specifications: text("specifications"), // Technical specifications
  sku: text("sku"), // Stock Keeping Unit (unique product identifier)
  mrp: integer("mrp"), // Maximum Retail Price (original price before discount)
  purchasePrice: integer("purchase_price"), // Purchase Price (cost price)
  price: integer("price").notNull(),
  category: text("category").notNull(),
  categoryId: integer("category_id").references(() => categories.id), // Reference to categories table
  subcategoryId: integer("subcategory_id").references(() => subcategories.id), // Reference to subcategories table
  color: text("color"), // Product color
  size: text("size"), // Product size
  imageUrl: text("image_url"), // Now optional
  images: text("images"), // Additional images as JSON string
  sellerId: integer("seller_id").references(() => users.id), // Now optional
  stock: integer("stock").notNull().default(0),
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }).default("0.00"), // Product-specific GST rate
  approved: boolean("approved").notNull().default(false),
  rejected: boolean("rejected").notNull().default(false), // Flag to mark explicitly rejected products
  deleted: boolean("deleted").notNull().default(false), // Soft delete flag
  isDraft: boolean("is_draft").notNull().default(false), // Flag to mark product as draft
  weight: decimal("weight", { precision: 10, scale: 3 }), // Product weight in kg
  length: decimal("length", { precision: 10, scale: 2 }), // Product length in cm
  width: decimal("width", { precision: 10, scale: 2 }), // Product width in cm
  height: decimal("height", { precision: 10, scale: 2 }), // Product height in cm
  warranty: integer("warranty"), // Warranty period in months
  returnPolicy: text("return_policy"), // Return policy details
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  specifications: true,
  sku: true,
  mrp: true,
  purchasePrice: true,
  price: true,
  category: true,
  categoryId: true,
  subcategoryId: true,
  color: true,
  size: true,
  imageUrl: true,
  images: true,
  sellerId: true,
  stock: true,
  gstRate: true,
  approved: true,
  rejected: true,
  deleted: true,
  isDraft: true,
  weight: true,
  length: true,
  width: true,
  height: true,
  warranty: true,
  returnPolicy: true,
});

// Product Variants Schema
export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  sku: text("sku"), // Variant-specific SKU
  color: text("color"), // Variant color
  size: text("size"), // Variant size
  price: integer("price").notNull(), // Variant-specific price
  mrp: integer("mrp"), // Variant-specific MRP
  stock: integer("stock").notNull().default(0), // Variant-specific stock
  images: text("images"), // Variant-specific images as JSON string
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductVariantSchema = createInsertSchema(
  productVariants
).pick({
  productId: true,
  sku: true,
  color: true,
  size: true,
  price: true,
  mrp: true,
  stock: true,
  images: true,
});

// Cart schema
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  variantId: integer("variant_id").references(() => productVariants.id),
  quantity: integer("quantity").notNull().default(1),
});

export const insertCartSchema = createInsertSchema(carts).pick({
  userId: true,
  productId: true,
  variantId: true,
  quantity: true,
});

// Order schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  status: text("status").notNull().default("pending"),
  total: integer("total").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  shippingDetails: text("shipping_details"), // Stored as JSON string
  paymentMethod: text("payment_method").notNull().default("cod"),
  paymentId: text("payment_id"), // For Razorpay paymentId
  orderId: text("order_id"), // For Razorpay orderId
  addressId: integer("address_id").references(() => userAddresses.id), // Optional reference to saved address

  // Wallet integration fields
  walletDiscount: integer("wallet_discount").default(0), // Amount discounted using wallet coins
  walletCoinsUsed: integer("wallet_coins_used").default(0), // Number of coins used from wallet

  // Shiprocket integration fields
  shippingStatus: text("shipping_status"), // Status of the order in Shiprocket
  shiprocketOrderId: text("shiprocket_order_id"), // Order ID in Shiprocket
  shiprocketShipmentId: text("shiprocket_shipment_id"), // Shipment ID in Shiprocket
  awbCode: text("awb_code"), // Tracking code / AWB code
  courierName: text("courier_name"), // Name of the courier service
  trackingDetails: text("tracking_details"), // Stored as JSON string with tracking details
  estimatedDeliveryDate: timestamp("estimated_delivery_date"), // Estimated delivery date
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  status: true,
  total: true,
  date: true,
  shippingDetails: true,
  paymentMethod: true,
  paymentId: true,
  orderId: true,
  addressId: true,
  // Wallet fields
  walletDiscount: true,
  walletCoinsUsed: true,
  // Shiprocket fields
  shippingStatus: true,
  shiprocketOrderId: true,
  shiprocketShipmentId: true,
  trackingDetails: true,
  courierName: true,
  awbCode: true,
  estimatedDeliveryDate: true,
});

// Seller Orders schema - for tracking per-seller sub-orders
export const sellerOrders = pgTable("seller_orders", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id),
  subtotal: integer("subtotal").notNull(),
  deliveryCharge: integer("delivery_charge").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  shippingStatus: text("shipping_status"),
  trackingDetails: text("tracking_details"),
  estimatedDeliveryDate: timestamp("estimated_delivery_date"),
  awbCode: text("awb_code"),
  courierName: text("courier_name"),
});

export const insertSellerOrderSchema = createInsertSchema(sellerOrders).pick({
  orderId: true,
  sellerId: true,
  subtotal: true,
  deliveryCharge: true,
  status: true,
  shippingStatus: true,
  trackingDetails: true,
  estimatedDeliveryDate: true,
  awbCode: true,
  courierName: true,
});

// OrderItem schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
  sellerOrderId: integer("seller_order_id").references(() => sellerOrders.id),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  productId: true,
  quantity: true,
  price: true,
  sellerOrderId: true,
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  carts: many(carts),
  orders: many(orders),
  reviews: many(reviews),
  reviewHelpfulVotes: many(reviewHelpful),
  wishlists: many(wishlists),
  mediaItems: many(mediaLibrary),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(users, {
    fields: [products.sellerId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  subcategory: one(subcategories, {
    fields: [products.subcategoryId],
    references: [subcategories.id],
  }),
  cartItems: many(carts),
  orderItems: many(orderItems),
  reviews: many(reviews),
  wishlists: many(wishlists),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ one }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
  })
);

export const cartsRelations = relations(carts, ({ one }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [carts.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [carts.variantId],
    references: [productVariants.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  address: one(userAddresses, {
    fields: [orders.addressId],
    references: [userAddresses.id],
  }),
  items: many(orderItems),
  sellerOrders: many(sellerOrders),
  reviews: many(reviews),
}));

export const sellerOrdersRelations = relations(
  sellerOrders,
  ({ one, many }) => ({
    order: one(orders, {
      fields: [sellerOrders.orderId],
      references: [orders.id],
    }),
    seller: one(users, {
      fields: [sellerOrders.sellerId],
      references: [users.id],
    }),
    items: many(orderItems),
  })
);

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  sellerOrder: one(sellerOrders, {
    fields: [orderItems.sellerOrderId],
    references: [sellerOrders.id],
  }),
}));

// User OTP table for passwordless authentication
export const userOtps = pgTable("user_otps", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserOtpSchema = createInsertSchema(userOtps).pick({
  email: true,
  otp: true,
  expiresAt: true,
  verified: true,
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(), // New: URL-friendly identifier
  description: text("description"), // New: Optional category description
  image: text("image").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  active: boolean("active").notNull().default(true), // New: Status toggle
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  slug: true,
  description: true,
  image: true,
  displayOrder: true,
  active: true,
  gstRate: true,
});

// Subcategories table
export const subcategories = pgTable("subcategories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(), // New: URL-friendly identifier
  image: text("image"),
  description: text("description"),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  displayOrder: integer("display_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  featured: boolean("featured").notNull().default(false), // New: Featured flag for promotional subcategories
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Define category to subcategory relationship
export const categoriesRelations = relations(categories, ({ many }) => ({
  subcategories: many(subcategories),
}));

// Define subcategory to category relationship
export const subcategoriesRelations = relations(
  subcategories,
  ({ one, many }) => ({
    category: one(categories, {
      fields: [subcategories.categoryId],
      references: [categories.id],
    }),
    products: many(products),
  })
);

export const insertSubcategorySchema = createInsertSchema(subcategories).pick({
  name: true,
  slug: true,
  image: true,
  description: true,
  categoryId: true,
  displayOrder: true,
  active: true,
  featured: true,
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  orderId: integer("order_id").references(() => orders.id), // Optional - to verify purchase
  rating: integer("rating").notNull(), // 1-5 star rating
  review: text("review"), // Text review (optional)
  title: text("title"), // Review title/headline (optional)
  verifiedPurchase: boolean("verified_purchase").notNull().default(false),
  status: text("status").notNull().default("published"), // published, pending, rejected
  helpfulCount: integer("helpful_count").notNull().default(0), // Number of users who found this helpful
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  userId: true,
  productId: true,
  orderId: true,
  rating: true,
  review: true,
  title: true,
  verifiedPurchase: true,
  status: true,
});

// Review Images table (for photo reviews)
export const reviewImages = pgTable("review_images", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id")
    .notNull()
    .references(() => reviews.id),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReviewImageSchema = createInsertSchema(reviewImages).pick({
  reviewId: true,
  imageUrl: true,
});

// Review Helpful Votes (to track which users found which reviews helpful)
export const reviewHelpful = pgTable("review_helpful", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id")
    .notNull()
    .references(() => reviews.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReviewHelpfulSchema = createInsertSchema(reviewHelpful).pick(
  {
    reviewId: true,
    userId: true,
  }
);

// Relations for reviews
export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
  images: many(reviewImages),
  helpfulVotes: many(reviewHelpful),
}));

export const reviewImagesRelations = relations(reviewImages, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewImages.reviewId],
    references: [reviews.id],
  }),
}));

export const reviewHelpfulRelations = relations(reviewHelpful, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewHelpful.reviewId],
    references: [reviews.id],
  }),
  user: one(users, {
    fields: [reviewHelpful.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;

export type Cart = typeof carts.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type SellerOrder = typeof sellerOrders.$inferSelect;
export type InsertSellerOrder = z.infer<typeof insertSellerOrderSchema>;

// Seller Agreement schema
export const sellerAgreements = pgTable("seller_agreements", {
  id: serial("id").primaryKey(),
  version: text("version").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSellerAgreementSchema = createInsertSchema(
  sellerAgreements
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const acceptedAgreements = pgTable("accepted_agreements", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  agreementId: integer("agreement_id")
    .notNull()
    .references(() => sellerAgreements.id, { onDelete: "cascade" }),
  acceptedAt: timestamp("accepted_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const insertAcceptedAgreementSchema = createInsertSchema(
  acceptedAgreements
).omit({
  id: true,
  acceptedAt: true,
});

// Relations
export const sellerAgreementsRelations = relations(
  sellerAgreements,
  ({ many }) => ({
    acceptedBy: many(acceptedAgreements),
  })
);

export const acceptedAgreementsRelations = relations(
  acceptedAgreements,
  ({ one }) => ({
    seller: one(users, {
      fields: [acceptedAgreements.sellerId],
      references: [users.id],
    }),
    agreement: one(sellerAgreements, {
      fields: [acceptedAgreements.agreementId],
      references: [sellerAgreements.id],
    }),
  })
);

export type UserOtp = typeof userOtps.$inferSelect;
export type InsertUserOtp = z.infer<typeof insertUserOtpSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Subcategory = typeof subcategories.$inferSelect;
export type InsertSubcategory = z.infer<typeof insertSubcategorySchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type ReviewImage = typeof reviewImages.$inferSelect;
export type InsertReviewImage = z.infer<typeof insertReviewImageSchema>;

export type ReviewHelpful = typeof reviewHelpful.$inferSelect;
export type InsertReviewHelpful = z.infer<typeof insertReviewHelpfulSchema>;

// User Activity Tracking for AI Assistant
export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Can be null for anonymous sessions
  sessionId: text("session_id").notNull(), // For tracking anonymous users
  activityType: text("activity_type").notNull(), // view, search, add_to_cart, purchase, etc.
  productId: integer("product_id").references(() => products.id),
  categoryId: integer("category_id").references(() => categories.id),
  searchQuery: text("search_query"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  additionalData: text("additional_data"), // JSON string with additional context
});

export const insertUserActivitySchema = createInsertSchema(userActivities).pick(
  {
    userId: true,
    sessionId: true,
    activityType: true,
    productId: true,
    categoryId: true,
    searchQuery: true,
    additionalData: true,
  }
);

// Product Relationships for Complementary Products
export const productRelationships = pgTable("product_relationships", {
  id: serial("id").primaryKey(),
  sourceProductId: integer("source_product_id")
    .notNull()
    .references(() => products.id),
  relatedProductId: integer("related_product_id")
    .notNull()
    .references(() => products.id),
  relationshipType: text("relationship_type").notNull(), // complementary, similar, bundle, etc.
  strength: doublePrecision("strength").notNull().default(1.0), // Relation strength (higher = stronger relationship)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductRelationshipSchema = createInsertSchema(
  productRelationships
).pick({
  sourceProductId: true,
  relatedProductId: true,
  relationshipType: true,
  strength: true,
});

// AI Assistant Conversations
export const aiAssistantConversations = pgTable("ai_assistant_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id").notNull(),
  productId: integer("product_id").references(() => products.id), // Optional - if about a specific product
  categoryId: integer("category_id").references(() => categories.id), // Optional - if about a specific category
  conversationHistory: text("conversation_history").notNull(), // JSON string of messages
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAiAssistantConversationSchema = createInsertSchema(
  aiAssistantConversations
).pick({
  userId: true,
  sessionId: true,
  productId: true,
  categoryId: true,
  conversationHistory: true,
});

// Size Preferences for Size Recommendations
export const userSizePreferences = pgTable("user_size_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  category: text("category").notNull(), // clothing, shoes, etc.
  size: text("size").notNull(), // S, M, L, 42, etc.
  fit: text("fit"), // slim, regular, loose, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSizePreferenceSchema = createInsertSchema(
  userSizePreferences
).pick({
  userId: true,
  category: true,
  size: true,
  fit: true,
});

// Relations for new tables
export const userActivitiesRelations = relations(userActivities, ({ one }) => ({
  user: one(users, {
    fields: [userActivities.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [userActivities.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [userActivities.categoryId],
    references: [categories.id],
  }),
}));

export const productRelationshipsRelations = relations(
  productRelationships,
  ({ one }) => ({
    sourceProduct: one(products, {
      fields: [productRelationships.sourceProductId],
      references: [products.id],
    }),
    relatedProduct: one(products, {
      fields: [productRelationships.relatedProductId],
      references: [products.id],
    }),
  })
);

export const aiAssistantConversationsRelations = relations(
  aiAssistantConversations,
  ({ one }) => ({
    user: one(users, {
      fields: [aiAssistantConversations.userId],
      references: [users.id],
    }),
    product: one(products, {
      fields: [aiAssistantConversations.productId],
      references: [products.id],
    }),
    category: one(categories, {
      fields: [aiAssistantConversations.categoryId],
      references: [categories.id],
    }),
  })
);

export const userSizePreferencesRelations = relations(
  userSizePreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [userSizePreferences.userId],
      references: [users.id],
    }),
  })
);

// Add relationships to existing tables
export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;

export type ProductRelationship = typeof productRelationships.$inferSelect;
export type InsertProductRelationship = z.infer<
  typeof insertProductRelationshipSchema
>;

export type AiAssistantConversation =
  typeof aiAssistantConversations.$inferSelect;
export type InsertAiAssistantConversation = z.infer<
  typeof insertAiAssistantConversationSchema
>;

export type UserSizePreference = typeof userSizePreferences.$inferSelect;
export type InsertUserSizePreference = z.infer<
  typeof insertUserSizePreferenceSchema
>;

export type UserAddress = typeof userAddresses.$inferSelect;
export type InsertUserAddress = z.infer<typeof insertUserAddressSchema>;

// ----------- User Addresses Feature -----------

// User Addresses table
export const userAddresses = pgTable("user_addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  addressName: text("address_name").notNull(), // Home, Work, etc.
  fullName: text("full_name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  phone: text("phone").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  isDefaultBilling: boolean("is_default_billing").notNull().default(false), // Default billing address flag
  isDefaultShipping: boolean("is_default_shipping").notNull().default(false), // Default shipping address flag
  addressType: text("address_type").notNull().default("both"), // 'shipping', 'billing', or 'both'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserAddressSchema = createInsertSchema(userAddresses).pick({
  userId: true,
  addressName: true,
  fullName: true,
  address: true,
  city: true,
  state: true,
  pincode: true,
  phone: true,
  isDefault: true,
  isDefaultBilling: true,
  isDefaultShipping: true,
  addressType: true,
});

// User Address Relations
export const userAddressesRelations = relations(userAddresses, ({ one }) => ({
  user: one(users, {
    fields: [userAddresses.userId],
    references: [users.id],
  }),
}));

// ----------- Wishlist Feature -----------

// Wishlist table
export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  dateAdded: timestamp("date_added").notNull().defaultNow(),
});

export const insertWishlistSchema = createInsertSchema(wishlists).pick({
  userId: true,
  productId: true,
});

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
}));

export type Wishlist = typeof wishlists.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;

// ----------- Smart Inventory & Price Management Features -----------

// Sales Data table - for historical sales data used in demand forecasting
export const salesHistory = pgTable("sales_history", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id),
  date: timestamp("date").notNull(),
  quantity: integer("quantity").notNull(),
  revenue: integer("revenue").notNull(), // in cents
  costPrice: integer("cost_price").notNull(), // in cents
  profitMargin: doublePrecision("profit_margin"), // percentage
  channel: text("channel"), // e.g., "marketplace", "direct", etc.
  promotionApplied: boolean("promotion_applied").default(false),
  seasonality: text("seasonality"), // e.g., "holiday", "summer", "back-to-school"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSalesHistorySchema = createInsertSchema(salesHistory).pick({
  productId: true,
  sellerId: true,
  date: true,
  quantity: true,
  revenue: true,
  costPrice: true,
  profitMargin: true,
  channel: true,
  promotionApplied: true,
  seasonality: true,
});

// Demand Forecasts table - stores ML-generated demand predictions
export const demandForecasts = pgTable("demand_forecasts", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id),
  forecastDate: timestamp("forecast_date").notNull(),
  predictedDemand: integer("predicted_demand").notNull(),
  confidenceScore: doublePrecision("confidence_score").notNull(), // 0.0 to 1.0
  forecastPeriod: text("forecast_period").notNull(), // "daily", "weekly", "monthly"
  factorsConsidered: jsonb("factors_considered"), // JSON with factors that influenced the prediction
  actualDemand: integer("actual_demand"), // Filled in later for model evaluation
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDemandForecastSchema = createInsertSchema(
  demandForecasts
).pick({
  productId: true,
  sellerId: true,
  forecastDate: true,
  predictedDemand: true,
  confidenceScore: true,
  forecastPeriod: true,
  factorsConsidered: true,
  actualDemand: true,
});

// Price Optimization table - stores ML-generated pricing recommendations
export const priceOptimizations = pgTable("price_optimizations", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id),
  currentPrice: integer("current_price").notNull(), // in cents
  suggestedPrice: integer("suggested_price").notNull(), // in cents
  projectedRevenue: integer("projected_revenue"), // in cents
  projectedSales: integer("projected_sales"),
  confidenceScore: doublePrecision("confidence_score").notNull(), // 0.0 to 1.0
  reasoningFactors: jsonb("reasoning_factors"), // JSON with factors that influenced the recommendation
  status: text("status").notNull().default("pending"), // "pending", "applied", "rejected"
  appliedAt: timestamp("applied_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPriceOptimizationSchema = createInsertSchema(
  priceOptimizations
).pick({
  productId: true,
  sellerId: true,
  currentPrice: true,
  suggestedPrice: true,
  projectedRevenue: true,
  projectedSales: true,
  confidenceScore: true,
  reasoningFactors: true,
  status: true,
  appliedAt: true,
});

// Inventory Optimization table - stores ML-generated inventory recommendations
export const inventoryOptimizations = pgTable("inventory_optimizations", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id),
  currentStock: integer("current_stock").notNull(),
  recommendedStock: integer("recommended_stock").notNull(),
  reorderPoint: integer("reorder_point"),
  maxStock: integer("max_stock"),
  safetyStock: integer("safety_stock"),
  leadTime: integer("lead_time"), // in days
  reason: text("reason"), // Explanation for the recommendation
  priorityLevel: text("priority_level").notNull().default("medium"), // "low", "medium", "high", "critical"
  status: text("status").notNull().default("pending"), // "pending", "applied", "rejected"
  appliedAt: timestamp("applied_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInventoryOptimizationSchema = createInsertSchema(
  inventoryOptimizations
).pick({
  productId: true,
  sellerId: true,
  currentStock: true,
  recommendedStock: true,
  reorderPoint: true,
  maxStock: true,
  safetyStock: true,
  leadTime: true,
  reason: true,
  priorityLevel: true,
  status: true,
  appliedAt: true,
});

// AI Content Generation - stores ML-generated product content
export const aiGeneratedContent = pgTable("ai_generated_content", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id),
  contentType: text("content_type").notNull(), // "description", "features", "specifications", "image"
  originalData: text("original_data"), // The input data provided for generation
  generatedContent: text("generated_content").notNull(), // The AI-generated content
  imageUrl: text("image_url"), // URL for generated images, if applicable
  promptUsed: text("prompt_used"), // The prompt used to generate the content
  status: text("status").notNull().default("pending"), // "pending", "applied", "rejected"
  appliedAt: timestamp("applied_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAiGeneratedContentSchema = createInsertSchema(
  aiGeneratedContent
).pick({
  productId: true,
  sellerId: true,
  contentType: true,
  originalData: true,
  generatedContent: true,
  imageUrl: true,
  promptUsed: true,
  status: true,
  appliedAt: true,
});

// Relations for Smart Inventory & Price Management tables
export const salesHistoryRelations = relations(salesHistory, ({ one }) => ({
  product: one(products, {
    fields: [salesHistory.productId],
    references: [products.id],
  }),
  seller: one(users, {
    fields: [salesHistory.sellerId],
    references: [users.id],
  }),
}));

export const demandForecastsRelations = relations(
  demandForecasts,
  ({ one }) => ({
    product: one(products, {
      fields: [demandForecasts.productId],
      references: [products.id],
    }),
    seller: one(users, {
      fields: [demandForecasts.sellerId],
      references: [users.id],
    }),
  })
);

export const priceOptimizationsRelations = relations(
  priceOptimizations,
  ({ one }) => ({
    product: one(products, {
      fields: [priceOptimizations.productId],
      references: [products.id],
    }),
    seller: one(users, {
      fields: [priceOptimizations.sellerId],
      references: [users.id],
    }),
  })
);

export const inventoryOptimizationsRelations = relations(
  inventoryOptimizations,
  ({ one }) => ({
    product: one(products, {
      fields: [inventoryOptimizations.productId],
      references: [products.id],
    }),
    seller: one(users, {
      fields: [inventoryOptimizations.sellerId],
      references: [users.id],
    }),
  })
);

export const aiGeneratedContentRelations = relations(
  aiGeneratedContent,
  ({ one }) => ({
    product: one(products, {
      fields: [aiGeneratedContent.productId],
      references: [products.id],
    }),
    seller: one(users, {
      fields: [aiGeneratedContent.sellerId],
      references: [users.id],
    }),
  })
);

// Footer Content schema
export const footerContent = pgTable("footer_content", {
  id: serial("id").primaryKey(),
  section: text("section").notNull(), // 'about', 'help', 'policy', 'social', 'mail_us'
  title: text("title").notNull(), // e.g. 'About Us', 'Contact Us', etc.
  content: text("content").notNull(), // HTML or Markdown content
  order: integer("order").notNull().default(0),
  url: text("url"), // Optional URL for links
  lastUpdated: timestamp("last_updated").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertFooterContentSchema = createInsertSchema(footerContent).omit(
  {
    id: true,
    lastUpdated: true,
  }
);

// Product Display Settings schema
export const productDisplaySettings = pgTable("product_display_settings", {
  id: serial("id").primaryKey(),
  displayType: text("display_type").notNull(), // vendor, category, price_asc, price_desc, rotation_vendor, rotation_category, etc.
  config: jsonb("config").notNull(), // Stores additional configuration like selected vendors, categories, rotation interval
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductDisplaySettingsSchema = createInsertSchema(
  productDisplaySettings
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type FooterContent = typeof footerContent.$inferSelect;
export type InsertFooterContent = z.infer<typeof insertFooterContentSchema>;

// Type exports for Smart Inventory & Price Management
export type SalesHistory = typeof salesHistory.$inferSelect;
export type InsertSalesHistory = z.infer<typeof insertSalesHistorySchema>;

export type DemandForecast = typeof demandForecasts.$inferSelect;
export type InsertDemandForecast = z.infer<typeof insertDemandForecastSchema>;

export type PriceOptimization = typeof priceOptimizations.$inferSelect;
export type InsertPriceOptimization = z.infer<
  typeof insertPriceOptimizationSchema
>;

export type InventoryOptimization = typeof inventoryOptimizations.$inferSelect;
export type InsertInventoryOptimization = z.infer<
  typeof insertInventoryOptimizationSchema
>;

export type AIGeneratedContent = typeof aiGeneratedContent.$inferSelect;
export type InsertAIGeneratedContent = z.infer<
  typeof insertAiGeneratedContentSchema
>;

// Seller Documents
export const sellerDocuments = pgTable("seller_documents", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id),
  documentType: text("document_type").notNull(), // e.g., "GST Certificate", "PAN Card", etc.
  documentUrl: text("document_url").notNull(),
  documentName: text("document_name").notNull(),
  verified: boolean("verified").default(false),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
});

export const insertSellerDocumentSchema = createInsertSchema(
  sellerDocuments
).omit({
  id: true,
  verified: true,
  uploadedAt: true,
  verifiedAt: true,
});

export type SellerDocument = typeof sellerDocuments.$inferSelect;
export type InsertSellerDocument = z.infer<typeof insertSellerDocumentSchema>;

// Business Details
export const businessDetails = pgTable("business_details", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  businessName: text("business_name").notNull(),
  gstNumber: text("gst_number"),
  panNumber: text("pan_number"),
  businessType: text("business_type"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBusinessDetailsSchema = createInsertSchema(
  businessDetails
).omit({
  id: true,
  updatedAt: true,
});

export type BusinessDetails = typeof businessDetails.$inferSelect;
export type InsertBusinessDetails = z.infer<typeof insertBusinessDetailsSchema>;

// Banking Information
export const bankingInformation = pgTable("banking_information", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  accountHolderName: text("account_holder_name").notNull(),
  accountNumber: text("account_number").notNull(),
  bankName: text("bank_name").notNull(),
  ifscCode: text("ifsc_code").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBankingInformationSchema = createInsertSchema(
  bankingInformation
).omit({
  id: true,
  updatedAt: true,
});

export type BankingInformation = typeof bankingInformation.$inferSelect;
export type InsertBankingInformation = z.infer<
  typeof insertBankingInformationSchema
>;

// Banner schema for hero section
export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  imageUrl: text("image_url").notNull(),
  buttonText: text("button_text").notNull().default("Shop Now"),
  category: text("category"),
  badgeText: text("badge_text"),
  productId: integer("product_id"),
  active: boolean("active").notNull().default(true),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBannerSchema = createInsertSchema(banners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Banner = typeof banners.$inferSelect;
export type InsertBanner = z.infer<typeof insertBannerSchema>;

// Shipping Methods table
export const shippingMethods = pgTable("shipping_methods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Base price in paise/cents
  estimatedDays: text("estimated_days").notNull(), // e.g., "3-5 days"
  isActive: boolean("is_active").notNull().default(true),
  icon: text("icon"), // Icon for the shipping method
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertShippingMethodSchema = createInsertSchema(
  shippingMethods
).pick({
  name: true,
  description: true,
  price: true,
  estimatedDays: true,
  isActive: true,
  icon: true,
});

// Shipping Zones table
export const shippingZones = pgTable("shipping_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "North India", "Metro Cities"
  description: text("description"),
  countries: text("countries").notNull(), // Comma-separated list or JSON string
  states: text("states"), // Comma-separated list or JSON string
  cities: text("cities"), // Comma-separated list or JSON string
  zipCodes: text("zip_codes"), // Comma-separated list or JSON string
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertShippingZoneSchema = createInsertSchema(shippingZones).pick({
  name: true,
  description: true,
  countries: true,
  states: true,
  cities: true,
  zipCodes: true,
  isActive: true,
});

// Shipping Rules table (connects methods to zones with specific pricing)
export const shippingRules = pgTable("shipping_rules", {
  id: serial("id").primaryKey(),
  zoneId: integer("zone_id")
    .notNull()
    .references(() => shippingZones.id),
  methodId: integer("method_id")
    .notNull()
    .references(() => shippingMethods.id),
  price: integer("price"), // Override price for this zone-method combination (optional)
  freeShippingThreshold: integer("free_shipping_threshold"), // Minimum order amount for free shipping
  additionalDays: integer("additional_days").default(0), // Additional days for this zone
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertShippingRuleSchema = createInsertSchema(shippingRules).pick({
  zoneId: true,
  methodId: true,
  price: true,
  freeShippingThreshold: true,
  additionalDays: true,
  isActive: true,
});

// Seller Shipping Settings table
export const sellerShippingSettings = pgTable("seller_shipping_settings", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id),
  enableCustomShipping: boolean("enable_custom_shipping")
    .notNull()
    .default(false),
  defaultShippingMethodId: integer("default_shipping_method_id").references(
    () => shippingMethods.id
  ),
  freeShippingThreshold: integer("free_shipping_threshold"), // Minimum order amount for free shipping
  processingTime: text("processing_time"), // e.g., "1-2 business days"
  shippingPolicy: text("shipping_policy"), // Text description of shipping policy
  returnPolicy: text("return_policy"), // Text description of return policy
  internationalShipping: boolean("international_shipping")
    .notNull()
    .default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSellerShippingSettingsSchema = createInsertSchema(
  sellerShippingSettings
).pick({
  sellerId: true,
  enableCustomShipping: true,
  defaultShippingMethodId: true,
  freeShippingThreshold: true,
  processingTime: true,
  shippingPolicy: true,
  returnPolicy: true,
  internationalShipping: true,
});

// Product Shipping Overrides table
export const productShippingOverrides = pgTable("product_shipping_overrides", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  customPrice: integer("custom_price"), // Custom shipping price
  freeShipping: boolean("free_shipping").notNull().default(false),
  additionalProcessingDays: integer("additional_processing_days").default(0),
  shippingRestrictions: text("shipping_restrictions"), // JSON with restricted locations
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductShippingOverrideSchema = createInsertSchema(
  productShippingOverrides
).pick({
  sellerId: true,
  productId: true,
  customPrice: true,
  freeShipping: true,
  additionalProcessingDays: true,
  shippingRestrictions: true,
});

// Shipping Tracking table
export const shippingTracking = pgTable("shipping_tracking", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  carrier: text("carrier"), // Shipping carrier name
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  shippedDate: timestamp("shipped_date"),
  estimatedDeliveryDate: timestamp("estimated_delivery_date"),
  deliveredDate: timestamp("delivered_date"),
  status: text("status").notNull().default("pending"), // pending, shipped, out_for_delivery, delivered, etc.
  statusUpdates: text("status_updates"), // JSON array of status updates with timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertShippingTrackingSchema = createInsertSchema(
  shippingTracking
).pick({
  orderId: true,
  carrier: true,
  trackingNumber: true,
  trackingUrl: true,
  shippedDate: true,
  estimatedDeliveryDate: true,
  deliveredDate: true,
  status: true,
  statusUpdates: true,
});

// Relations
export const shippingMethodsRelations = relations(
  shippingMethods,
  ({ many }) => ({
    rules: many(shippingRules),
    sellerSettings: many(sellerShippingSettings),
  })
);

export const shippingZonesRelations = relations(shippingZones, ({ many }) => ({
  rules: many(shippingRules),
}));

export const shippingRulesRelations = relations(shippingRules, ({ one }) => ({
  zone: one(shippingZones, {
    fields: [shippingRules.zoneId],
    references: [shippingZones.id],
  }),
  method: one(shippingMethods, {
    fields: [shippingRules.methodId],
    references: [shippingMethods.id],
  }),
}));

export const sellerShippingSettingsRelations = relations(
  sellerShippingSettings,
  ({ one }) => ({
    seller: one(users, {
      fields: [sellerShippingSettings.sellerId],
      references: [users.id],
    }),
    defaultMethod: one(shippingMethods, {
      fields: [sellerShippingSettings.defaultShippingMethodId],
      references: [shippingMethods.id],
    }),
  })
);

export const productShippingOverridesRelations = relations(
  productShippingOverrides,
  ({ one }) => ({
    product: one(products, {
      fields: [productShippingOverrides.productId],
      references: [products.id],
    }),
    seller: one(users, {
      fields: [productShippingOverrides.sellerId],
      references: [users.id],
    }),
  })
);

export const shippingTrackingRelations = relations(
  shippingTracking,
  ({ one }) => ({
    order: one(orders, {
      fields: [shippingTracking.orderId],
      references: [orders.id],
    }),
  })
);

// Extend orders relations to include tracking
export const ordersTrackingRelations = relations(orders, ({ one }) => ({
  tracking: one(shippingTracking),
}));

// Type exports for shipping tables
export type ShippingMethod = typeof shippingMethods.$inferSelect;
export type InsertShippingMethod = z.infer<typeof insertShippingMethodSchema>;

export type ShippingZone = typeof shippingZones.$inferSelect;
export type InsertShippingZone = z.infer<typeof insertShippingZoneSchema>;

export type ShippingRule = typeof shippingRules.$inferSelect;
export type InsertShippingRule = z.infer<typeof insertShippingRuleSchema>;

export type SellerShippingSetting = typeof sellerShippingSettings.$inferSelect;
export type InsertSellerShippingSetting = z.infer<
  typeof insertSellerShippingSettingsSchema
>;

export type ProductShippingOverride =
  typeof productShippingOverrides.$inferSelect;
export type InsertProductShippingOverride = z.infer<
  typeof insertProductShippingOverrideSchema
>;

export type ShippingTracking = typeof shippingTracking.$inferSelect;
export type InsertShippingTracking = z.infer<
  typeof insertShippingTrackingSchema
>;

export type ProductDisplaySettings = typeof productDisplaySettings.$inferSelect;
export type InsertProductDisplaySettings = z.infer<
  typeof insertProductDisplaySettingsSchema
>;

// ====================== RETURNS SCHEMA ======================
export const returns = pgTable("returns", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id),
  returnReason: text("return_reason").notNull(),
  returnStatus: text("return_status").notNull().default("requested"), // requested, approved, rejected, completed
  returnDate: timestamp("return_date").notNull().defaultNow(),
  comments: text("comments"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  refundStatus: text("refund_status").default("pending"), // pending, processed, rejected
  refundDate: timestamp("refund_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertReturnSchema = createInsertSchema(returns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const returnsRelations = relations(returns, ({ one }) => ({
  order: one(orders, {
    fields: [returns.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [returns.productId],
    references: [products.id],
  }),
  seller: one(users, {
    fields: [returns.sellerId],
    references: [users.id],
  }),
}));

// ====================== ANALYTICS SCHEMA ======================
export const sellerAnalytics = pgTable("seller_analytics", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id),
  date: timestamp("date").notNull(),
  totalOrders: integer("total_orders").notNull().default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  averageOrderValue: decimal("average_order_value", {
    precision: 10,
    scale: 2,
  }),
  totalVisitors: integer("total_visitors").default(0),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }),
  topProducts: text("top_products"), // JSON array of top product IDs
  categoryBreakdown: text("category_breakdown"), // JSON object of category sales
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSellerAnalyticsSchema = createInsertSchema(
  sellerAnalytics
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const sellerAnalyticsRelations = relations(
  sellerAnalytics,
  ({ one }) => ({
    seller: one(users, {
      fields: [sellerAnalytics.sellerId],
      references: [users.id],
    }),
  })
);

// ====================== PAYMENTS SCHEMA ======================
export const sellerPayments = pgTable("seller_payments", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  paymentDate: timestamp("payment_date"),
  referenceId: text("reference_id"), // Bank or payment processor reference
  paymentMethod: text("payment_method"), // bank_transfer, upi, etc.
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSellerPaymentSchema = createInsertSchema(
  sellerPayments
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const sellerPaymentsRelations = relations(sellerPayments, ({ one }) => ({
  seller: one(users, {
    fields: [sellerPayments.sellerId],
    references: [users.id],
  }),
}));

// ====================== SETTINGS SCHEMA ======================
export const sellerSettings = pgTable("seller_settings", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  notificationPreferences: text("notification_preferences"), // JSON object of notification settings
  taxInformation: text("tax_information"), // JSON object with tax details
  returnPolicy: text("return_policy"), // Store return policy text
  personalInfo: text("personal_info"), // JSON object with personal information
  address: text("address"), // JSON object with address information
  pickupAddress: text("pickup_address"), // JSON object with pickup address for shipping/invoices
  store: text("store"), // JSON object with store settings (name, description, contact details, etc.)
  autoAcceptOrders: boolean("auto_accept_orders").default(false),
  holidayMode: boolean("holiday_mode").default(false),
  holidayModeEndDate: timestamp("holiday_mode_end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSellerSettingsSchema = createInsertSchema(
  sellerSettings
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const sellerSettingsRelations = relations(sellerSettings, ({ one }) => ({
  seller: one(users, {
    fields: [sellerSettings.sellerId],
    references: [users.id],
  }),
}));

// ====================== HELP AND SUPPORT SCHEMA ======================
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  assignedTo: integer("assigned_to").references(() => users.id),
  category: text("category").notNull(), // orders, payments, shipping, technical, etc.
  attachments: text("attachments"), // JSON array of attachment URLs
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  resolvedDate: timestamp("resolved_date"),
});

export const insertSupportTicketSchema = createInsertSchema(
  supportTickets
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedDate: true,
});

export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id")
    .notNull()
    .references(() => supportTickets.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  message: text("message").notNull(),
  attachments: text("attachments"), // JSON array of attachment URLs
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSupportMessageSchema = createInsertSchema(
  supportMessages
).omit({
  id: true,
  createdAt: true,
});

export const supportTicketsRelations = relations(
  supportTickets,
  ({ one, many }) => ({
    user: one(users, {
      fields: [supportTickets.userId],
      references: [users.id],
    }),
    assignedToUser: one(users, {
      fields: [supportTickets.assignedTo],
      references: [users.id],
    }),
    messages: many(supportMessages),
  })
);

export const supportMessagesRelations = relations(
  supportMessages,
  ({ one }) => ({
    ticket: one(supportTickets, {
      fields: [supportMessages.ticketId],
      references: [supportTickets.id],
    }),
    user: one(users, {
      fields: [supportMessages.userId],
      references: [users.id],
    }),
  })
);

// Type exports for new schemas
export type Return = typeof returns.$inferSelect;
export type InsertReturn = z.infer<typeof insertReturnSchema>;

export type SellerAnalytic = typeof sellerAnalytics.$inferSelect;
export type InsertSellerAnalytic = z.infer<typeof insertSellerAnalyticsSchema>;

export type SellerPayment = typeof sellerPayments.$inferSelect;
export type InsertSellerPayment = z.infer<typeof insertSellerPaymentSchema>;

export type SellerSetting = typeof sellerSettings.$inferSelect;
export type InsertSellerSetting = z.infer<typeof insertSellerSettingsSchema>;

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;

// Rewards system schema
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  points: integer("points").notNull().default(0),
  lifetimePoints: integer("lifetime_points").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rewardTransactions = pgTable("reward_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  orderId: integer("order_id").references(() => orders.id, {
    onDelete: "set null",
  }),
  productId: integer("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  points: integer("points").notNull(),
  type: text("type").notNull(), // earn, redeem, expire, bonus, referral
  description: text("description"),
  transactionDate: timestamp("transaction_date").defaultNow(),
  expiryDate: timestamp("expiry_date"),
  status: text("status").notNull().default("active"), // active, used, expired
});

export const rewardRules = pgTable("reward_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // purchase, signup, review, referral, birthday
  pointsAwarded: integer("points_awarded").notNull(),
  minimumOrderValue: integer("minimum_order_value"),
  percentageValue: decimal("percentage_value"), // For purchase-based rewards
  categoryId: integer("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Gift Cards schema
export const giftCards = pgTable("gift_cards", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  initialValue: integer("initial_value").notNull(),
  currentBalance: integer("current_balance").notNull(),
  issuedTo: integer("issued_to").references(() => users.id, {
    onDelete: "set null",
  }),
  purchasedBy: integer("purchased_by").references(() => users.id, {
    onDelete: "set null",
  }),
  isActive: boolean("is_active").notNull().default(true),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsed: timestamp("last_used"),
  recipientEmail: text("recipient_email"),
  recipientName: text("recipient_name"),
  message: text("message"),
  designTemplate: text("design_template").default("default"),
});

export const giftCardTransactions = pgTable("gift_card_transactions", {
  id: serial("id").primaryKey(),
  giftCardId: integer("gift_card_id")
    .references(() => giftCards.id, { onDelete: "cascade" })
    .notNull(),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  orderId: integer("order_id").references(() => orders.id, {
    onDelete: "set null",
  }),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // purchase, redemption, refund
  transactionDate: timestamp("transaction_date").defaultNow(),
  note: text("note"),
});

// Gift Card Templates for admin to manage
export const giftCardTemplates = pgTable("gift_card_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define relationships
export const rewardsRelations = relations(rewards, ({ one }) => ({
  user: one(users, {
    fields: [rewards.userId],
    references: [users.id],
  }),
}));

export const rewardTransactionsRelations = relations(
  rewardTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [rewardTransactions.userId],
      references: [users.id],
    }),
    order: one(orders, {
      fields: [rewardTransactions.orderId],
      references: [orders.id],
    }),
    product: one(products, {
      fields: [rewardTransactions.productId],
      references: [products.id],
    }),
  })
);

export const giftCardsRelations = relations(giftCards, ({ one, many }) => ({
  issuedToUser: one(users, {
    fields: [giftCards.issuedTo],
    references: [users.id],
  }),
  purchasedByUser: one(users, {
    fields: [giftCards.purchasedBy],
    references: [users.id],
  }),
  transactions: many(giftCardTransactions),
}));

export const giftCardTransactionsRelations = relations(
  giftCardTransactions,
  ({ one }) => ({
    giftCard: one(giftCards, {
      fields: [giftCardTransactions.giftCardId],
      references: [giftCards.id],
    }),
    user: one(users, {
      fields: [giftCardTransactions.userId],
      references: [users.id],
    }),
    order: one(orders, {
      fields: [giftCardTransactions.orderId],
      references: [orders.id],
    }),
  })
);

// Create insert schemas
export const insertRewardSchema = createInsertSchema(rewards);
export const insertRewardTransactionSchema =
  createInsertSchema(rewardTransactions);
export const insertRewardRuleSchema = createInsertSchema(rewardRules);
export const insertGiftCardSchema = createInsertSchema(giftCards);
export const insertGiftCardTransactionSchema =
  createInsertSchema(giftCardTransactions);
export const insertGiftCardTemplateSchema =
  createInsertSchema(giftCardTemplates);

// Types
export type SelectReward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

export type SelectRewardTransaction = typeof rewardTransactions.$inferSelect;
export type InsertRewardTransaction = z.infer<
  typeof insertRewardTransactionSchema
>;

export type SelectRewardRule = typeof rewardRules.$inferSelect;
export type InsertRewardRule = z.infer<typeof insertRewardRuleSchema>;

export type SelectGiftCard = typeof giftCards.$inferSelect;
export type InsertGiftCard = z.infer<typeof insertGiftCardSchema>;

export type SelectGiftCardTransaction =
  typeof giftCardTransactions.$inferSelect;
export type InsertGiftCardTransaction = z.infer<
  typeof insertGiftCardTransactionSchema
>;

export type SelectGiftCardTemplate = typeof giftCardTemplates.$inferSelect;
export type InsertGiftCardTemplate = z.infer<
  typeof insertGiftCardTemplateSchema
>;

// Wallet System Schema
export const walletSettings = pgTable("wallet_settings", {
  id: serial("id").primaryKey(),
  firstPurchaseCoins: integer("first_purchase_coins").notNull().default(500),
  coinToCurrencyRatio: decimal("coin_to_currency_ratio")
    .notNull()
    .default("0.10"),
  minOrderValue: decimal("min_order_value").notNull().default("500.00"),
  maxRedeemableCoins: integer("max_redeemable_coins").notNull().default(200),
  coinExpiryDays: integer("coin_expiry_days").notNull().default(90),
  // New fields
  maxUsagePercentage: decimal("max_usage_percentage")
    .notNull()
    .default("20.00"), // Max % of order value that can be paid with coins
  minCartValue: decimal("min_cart_value").notNull().default("0.00"), // Minimum cart value required to use coins
  applicableCategories: text("applicable_categories"), // Comma-separated list of category names where coins can be applied
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  balance: integer("balance").notNull().default(0),
  lifetimeEarned: integer("lifetime_earned").notNull().default(0),
  lifetimeRedeemed: integer("lifetime_redeemed").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id")
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  transactionType: text("transaction_type").notNull(), // 'CREDIT', 'DEBIT', 'EXPIRED'
  referenceType: text("reference_type"), // 'ORDER', 'REFUND', 'ADJUSTMENT', etc.
  referenceId: integer("reference_id"), // ID of the referenced entity
  description: text("description"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  transactions: many(walletTransactions),
}));

export const walletTransactionsRelations = relations(
  walletTransactions,
  ({ one }) => ({
    wallet: one(wallets, {
      fields: [walletTransactions.walletId],
      references: [wallets.id],
    }),
  })
);

// Insert Schemas
export const insertWalletSettingsSchema = createInsertSchema(walletSettings);
export const insertWalletSchema = createInsertSchema(wallets);
export const insertWalletTransactionSchema =
  createInsertSchema(walletTransactions);

// Types
export type SelectWalletSettings = typeof walletSettings.$inferSelect;
export type InsertWalletSettings = z.infer<typeof insertWalletSettingsSchema>;

export type SelectWallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;

export type SelectWalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = z.infer<
  typeof insertWalletTransactionSchema
>;

// Shiprocket settings
// Shiprocket integration removed

// Notifications schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // Uses NotificationType values
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  link: text("link"), // Optional link to navigate to when clicked
  metadata: jsonb("metadata").default("{}"), // Optional metadata for the notification
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  title: true,
  message: true,
  read: true,
  link: true,
  metadata: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Relation from users to notifications
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Seller Agreement types
// System Settings for Seller Agreement Feature
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSystemSettingsSchema = createInsertSchema(
  systemSettings
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingsSchema>;

export type SellerAgreement = typeof sellerAgreements.$inferSelect;
export type InsertSellerAgreement = z.infer<typeof insertSellerAgreementSchema>;

export type AcceptedAgreement = typeof acceptedAgreements.$inferSelect;
export type InsertAcceptedAgreement = z.infer<
  typeof insertAcceptedAgreementSchema
>;

// Document Templates (invoice, shipping slips, etc.)
export const documentTemplates = pgTable("document_templates", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'invoice', 'shipping_slip', etc.
  name: text("name").notNull(),
  content: text("content").notNull(), // HTML/Handlebars template
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertDocumentTemplateSchema = createInsertSchema(
  documentTemplates
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type InsertDocumentTemplate = z.infer<
  typeof insertDocumentTemplateSchema
>;

// Media Library for centralized image storage
export const mediaLibrary = pgTable("media_library", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  url: text("url").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  alt: text("alt"),
  tags: text("tags"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id),
});

export const insertMediaLibrarySchema = createInsertSchema(mediaLibrary).omit({
  id: true,
  createdAt: true,
});

export const mediaLibraryRelations = relations(mediaLibrary, ({ one }) => ({
  user: one(users, {
    fields: [mediaLibrary.uploadedBy],
    references: [users.id],
  }),
}));

export type MediaLibraryItem = typeof mediaLibrary.$inferSelect;
export type InsertMediaLibraryItem = z.infer<typeof insertMediaLibrarySchema>;
