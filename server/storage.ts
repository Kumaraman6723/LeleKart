import {
  users,
  User,
  InsertUser,
  products,
  Product,
  InsertProduct,
  productVariants,
  ProductVariant,
  InsertProductVariant,
  documentTemplates,
  DocumentTemplate,
  InsertDocumentTemplate,
  carts,
  Cart,
  InsertCart,
  orders,
  Order,
  InsertOrder,
  orderItems,
  OrderItem,
  InsertOrderItem,
  sellerOrders,
  SellerOrder,
  InsertSellerOrder,
  categories,
  Category,
  InsertCategory,
  subcategories,
  Subcategory,
  InsertSubcategory,
  reviews,
  Review,
  InsertReview,
  reviewImages,
  ReviewImage,
  InsertReviewImage,
  reviewHelpful,
  ReviewHelpful,
  InsertReviewHelpful,
  wishlists,
  Wishlist,
  InsertWishlist,
  userAddresses,
  UserAddress,
  InsertUserAddress,
  salesHistory,
  SalesHistory,
  InsertSalesHistory,
  demandForecasts,
  DemandForecast,
  InsertDemandForecast,
  priceOptimizations,
  PriceOptimization,
  InsertPriceOptimization,
  inventoryOptimizations,
  InventoryOptimization,
  InsertInventoryOptimization,
  aiGeneratedContent,
  AIGeneratedContent,
  InsertAIGeneratedContent,
  sellerDocuments,
  SellerDocument,
  InsertSellerDocument,
  businessDetails,
  BusinessDetails,
  InsertBusinessDetails,
  bankingInformation,
  BankingInformation,
  InsertBankingInformation,
  banners,
  Banner,
  InsertBanner,
  footerContent,
  FooterContent,
  InsertFooterContent,
  shippingMethods,
  ShippingMethod,
  InsertShippingMethod,
  shippingZones,
  ShippingZone,
  InsertShippingZone,
  shippingRules,
  ShippingRule,
  InsertShippingRule,
  sellerShippingSettings,
  SellerShippingSetting,
  InsertSellerShippingSetting,
  productShippingOverrides,
  ProductShippingOverride,
  InsertProductShippingOverride,
  shippingTracking,
  ShippingTracking,
  InsertShippingTracking,
  // New imports
  returns,
  Return,
  InsertReturn,
  sellerAnalytics,
  SellerAnalytic,
  InsertSellerAnalytic,
  sellerPayments,
  SellerPayment,
  InsertSellerPayment,
  sellerSettings,
  SellerSetting,
  InsertSellerSetting,
  supportTickets,
  SupportTicket,
  InsertSupportTicket,
  supportMessages,
  SupportMessage,
  InsertSupportMessage,
  // Rewards and Gift Cards imports
  rewards,
  Reward as SelectReward,
  InsertReward,
  rewardTransactions,
  RewardTransaction as SelectRewardTransaction,
  InsertRewardTransaction,
  rewardRules,
  RewardRule as SelectRewardRule,
  InsertRewardRule,
  giftCards,
  GiftCard as SelectGiftCard,
  InsertGiftCard,
  giftCardTransactions,
  GiftCardTransaction as SelectGiftCardTransaction,
  InsertGiftCardTransaction,
  giftCardTemplates,
  GiftCardTemplate as SelectGiftCardTemplate,
  InsertGiftCardTemplate,
  // Wallet imports
  wallets,
  Wallet as SelectWallet,
  InsertWallet,
  walletTransactions,
  WalletTransaction as SelectWalletTransaction,
  InsertWalletTransaction,
  walletSettings,
  WalletSettings as SelectWalletSettings,
  InsertWalletSettings,
  // System settings
  systemSettings,
  SystemSetting,
  InsertSystemSetting,
  // Notification imports
  notifications,
  Notification,
  InsertNotification,
  // Product Display Settings
  productDisplaySettings,
  ProductDisplaySettings,
  InsertProductDisplaySettings,
  // Media Library imports
  mediaLibrary,
  MediaLibraryItem,
  InsertMediaLibraryItem,
} from "@shared/schema";

// Import Return Management Schema
import {
  ReturnRequestWithDetails,
  ReturnMessageWithUser,
  ReturnRequestFilters,
  ReturnRequest,
  InsertReturnRequest,
  ReturnReason,
  InsertReturnReason,
  ReturnPolicy,
  InsertReturnPolicy,
  ReturnMessage,
  InsertReturnMessage,
  ReturnStatusHistory,
  InsertReturnStatusHistory,
  returnMessages,
  returnRequests,
  returnStatusHistory,
  returnReasons,
  returnPolicies,
} from "@shared/return-schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import {
  and,
  eq,
  desc,
  sql,
  ilike,
  or,
  isNull,
  asc,
  inArray,
} from "drizzle-orm";
import { db } from "./db";
import { pool } from "./db";

export interface IStorage {
  // Media Library Methods
  getMediaItems(
    page?: number,
    limit?: number,
    search?: string
  ): Promise<{ items: MediaLibraryItem[]; total: number }>;
  getMediaItemById(id: number): Promise<MediaLibraryItem | undefined>;
  createMediaItem(item: InsertMediaLibraryItem): Promise<MediaLibraryItem>;
  deleteMediaItem(id: number): Promise<void>;

  // Document Template Methods
  getDocumentTemplates(type?: string): Promise<DocumentTemplate[]>;
  getDocumentTemplate(id: number): Promise<DocumentTemplate | undefined>;
  getDefaultDocumentTemplate(
    type: string
  ): Promise<DocumentTemplate | undefined>;
  createDocumentTemplate(
    template: InsertDocumentTemplate
  ): Promise<DocumentTemplate>;
  updateDocumentTemplate(
    id: number,
    template: Partial<InsertDocumentTemplate>
  ): Promise<DocumentTemplate>;
  deleteDocumentTemplate(id: number): Promise<void>;
  setDefaultTemplate(id: number): Promise<DocumentTemplate>;

  // System Settings Methods
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  getAllSystemSettings(): Promise<SystemSetting[]>;
  createOrUpdateSystemSetting(
    key: string,
    value: string,
    description?: string
  ): Promise<SystemSetting>;

  // Notification Methods
  getUserNotifications(
    userId: number,
    page?: number,
    limit?: number
  ): Promise<{ notifications: Notification[]; total: number }>;
  getUserUnreadNotificationsCount(userId: number): Promise<number>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification>;
  markAllUserNotificationsAsRead(userId: number): Promise<void>;
  deleteNotification(id: number): Promise<void>;
  deleteAllUserNotifications(userId: number): Promise<void>;

  // Rewards Methods
  getUserRewards(userId: number): Promise<SelectReward | undefined>;
  createUserRewards(data: InsertReward): Promise<SelectReward>;
  updateUserRewards(
    userId: number,
    data: Partial<InsertReward>
  ): Promise<SelectReward>;
  getUserRewardTransactions(
    userId: number,
    page?: number,
    limit?: number
  ): Promise<{ transactions: SelectRewardTransaction[]; total: number }>;
  createRewardTransaction(
    data: InsertRewardTransaction
  ): Promise<SelectRewardTransaction>;
  getRewardRules(): Promise<SelectRewardRule[]>;
  getRewardRule(id: number): Promise<SelectRewardRule | undefined>;
  createRewardRule(data: InsertRewardRule): Promise<SelectRewardRule>;
  updateRewardRule(
    id: number,
    data: Partial<InsertRewardRule>
  ): Promise<SelectRewardRule>;
  deleteRewardRule(id: number): Promise<void>;
  getRewardStatistics(): Promise<{
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    activeUsers: number;
  }>;

  // Gift Card Methods
  getAllGiftCards(
    page?: number,
    limit?: number
  ): Promise<{ giftCards: SelectGiftCard[]; total: number }>;
  getUserGiftCards(userId: number): Promise<SelectGiftCard[]>;
  getGiftCard(id: number): Promise<SelectGiftCard | undefined>;
  getGiftCardByCode(code: string): Promise<SelectGiftCard | undefined>;
  createGiftCard(data: InsertGiftCard): Promise<SelectGiftCard>;
  updateGiftCard(
    id: number,
    data: Partial<InsertGiftCard>
  ): Promise<SelectGiftCard>;
  createGiftCardTransaction(
    data: InsertGiftCardTransaction
  ): Promise<SelectGiftCardTransaction>;
  getGiftCardTemplates(): Promise<SelectGiftCardTemplate[]>;
  getGiftCardTemplate(id: number): Promise<SelectGiftCardTemplate | undefined>;
  createGiftCardTemplate(
    data: InsertGiftCardTemplate
  ): Promise<SelectGiftCardTemplate>;
  updateGiftCardTemplate(
    id: number,
    data: Partial<InsertGiftCardTemplate>
  ): Promise<SelectGiftCardTemplate>;
  deleteGiftCardTemplate(id: number): Promise<void>;

  // Return Management Methods
  getReturnRequestById(id: number): Promise<ReturnRequest | undefined>;
  getReturnRequestWithDetails(id: number): Promise<any>;
  createReturnRequest(data: InsertReturnRequest): Promise<ReturnRequest>;
  updateReturnRequest(
    id: number,
    data: Partial<ReturnRequest>
  ): Promise<ReturnRequest>;
  getReturnRequestsByBuyerId(
    buyerId: number,
    limit?: number,
    offset?: number
  ): Promise<ReturnRequest[]>;
  getReturnRequestsBySellerId(
    sellerId: number,
    limit?: number,
    offset?: number
  ): Promise<ReturnRequest[]>;
  getReturnRequests(
    filters?: any,
    limit?: number,
    offset?: number
  ): Promise<ReturnRequest[]>;
  getReturnRequestsForOrderItem(orderItemId: number): Promise<ReturnRequest[]>;
  getReturnReasonById(id: number): Promise<ReturnReason | undefined>;
  getActiveReturnReasons(requestType?: string): Promise<ReturnReason[]>;
  createReturnReason(data: InsertReturnReason): Promise<ReturnReason>;
  updateReturnReason(
    id: number,
    data: Partial<ReturnReason>
  ): Promise<ReturnReason>;
  getReturnPolicyByCriteria(
    sellerId?: number | null,
    categoryId?: number | null
  ): Promise<ReturnPolicy | undefined>;
  getReturnPolicyById(id: number): Promise<ReturnPolicy | undefined>;
  getReturnPoliciesBySellerId(sellerId: number): Promise<ReturnPolicy[]>;
  createReturnPolicy(data: InsertReturnPolicy): Promise<ReturnPolicy>;
  updateReturnPolicy(
    id: number,
    data: Partial<ReturnPolicy>
  ): Promise<ReturnPolicy>;
  createReturnMessage(data: InsertReturnMessage): Promise<ReturnMessage>;
  getReturnMessages(returnRequestId: number): Promise<ReturnMessage[]>;
  getReturnMessagesWithUsers(returnRequestId: number): Promise<any[]>;
  markReturnMessagesAsRead(
    returnRequestId: number,
    userId: number
  ): Promise<void>;
  createReturnStatusHistory(
    data: InsertReturnStatusHistory
  ): Promise<ReturnStatusHistory>;
  getReturnStatusHistory(
    returnRequestId: number
  ): Promise<ReturnStatusHistory[]>;
  getUnreadReturnMessageCount(userId: number): Promise<number>;
  getReturnAnalytics(
    sellerId?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<any>;

  // Order Shipping Methods
  updateOrder(id: number, data: Partial<Order>): Promise<Order>;
  createOrUpdateOrderShippingTracking(data: any): Promise<any>;
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUserRole(id: number, role: string): Promise<User>;
  updateUserProfile(id: number, data: Partial<User>): Promise<User>;
  getUserNotificationPreferences(id: number): Promise<any | null>;
  updateUserNotificationPreferences(
    id: number,
    preferences: any
  ): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getSellers(approved?: boolean, rejected?: boolean): Promise<User[]>;
  getPendingSellers(): Promise<User[]>;
  getApprovedSellers(): Promise<User[]>;
  getRejectedSellers(): Promise<User[]>;
  updateSellerApproval(
    id: number,
    approved: boolean,
    rejected?: boolean
  ): Promise<User>;
  getAllAdminUsers(includeCoAdmins: boolean): Promise<User[]>;
  updateSellerProfile(id: number, profileData: Partial<User>): Promise<User>;

  // Admin and Co-Admin Management
  getCoAdmins(): Promise<User[]>;
  getCoAdminById(id: number): Promise<User | undefined>;
  updateCoAdminPermissions(
    id: number,
    permissions: any
  ): Promise<User | undefined>;
  deleteCoAdmin(id: number): Promise<void>;
  getAllAdminUsers(includeCoAdmins: boolean): Promise<User[]>;

  // Seller Document operations
  getSellerDocuments(sellerId: number): Promise<SellerDocument[]>;
  getSellerDocumentById(id: number): Promise<SellerDocument | undefined>;
  createSellerDocument(document: InsertSellerDocument): Promise<SellerDocument>;
  updateSellerDocument(id: number, verified: boolean): Promise<SellerDocument>;
  deleteSellerDocument(id: number): Promise<void>;

  // Business Details operations
  getBusinessDetails(sellerId: number): Promise<BusinessDetails | undefined>;
  createBusinessDetails(
    details: InsertBusinessDetails
  ): Promise<BusinessDetails>;
  updateBusinessDetails(
    sellerId: number,
    details: Partial<BusinessDetails>
  ): Promise<BusinessDetails>;

  // Banking Information operations
  getBankingInformation(
    sellerId: number
  ): Promise<BankingInformation | undefined>;
  createBankingInformation(
    info: InsertBankingInformation
  ): Promise<BankingInformation>;
  updateBankingInformation(
    sellerId: number,
    info: Partial<BankingInformation>
  ): Promise<BankingInformation>;
  // User Address operations
  getUserAddresses(userId: number): Promise<UserAddress[]>;
  getUserAddressById(id: number): Promise<UserAddress | undefined>;
  createUserAddress(address: InsertUserAddress): Promise<UserAddress>;
  updateUserAddress(
    id: number,
    address: Partial<UserAddress>
  ): Promise<UserAddress>;
  deleteUserAddress(id: number): Promise<void>;
  setDefaultAddress(userId: number, addressId: number): Promise<void>;
  getDefaultAddress(userId: number): Promise<UserAddress | undefined>;

  // Product operations
  getProducts(
    category?: string,
    sellerId?: number,
    approved?: boolean
  ): Promise<Product[]>;
  getProductsCount(
    category?: string,
    sellerId?: number,
    approved?: boolean,
    search?: string,
    hideDrafts?: boolean,
    subcategory?: string,
    hideRejected?: boolean
  ): Promise<number>;
  getProductsPaginated(
    category?: string,
    sellerId?: number,
    approved?: boolean,
    offset?: number,
    limit?: number,
    search?: string,
    hideDrafts?: boolean,
    subcategory?: string,
    hideRejected?: boolean
  ): Promise<Product[]>;
  getAllProducts(filters?: {
    sellerId?: number;
    category?: string;
    approved?: boolean;
  }): Promise<Product[]>;
  getAllProductsForExport(): Promise<Product[]>;
  searchProducts(query: string, limit?: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductById(
    id: number,
    includeVariants?: boolean
  ): Promise<(Product & { variants?: ProductVariant[] }) | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  assignProductSeller(productId: number, sellerId: number): Promise<Product>;

  // Product Variants operations
  getProductVariants(productId: number): Promise<ProductVariant[]>;
  getProductVariant(id: number): Promise<ProductVariant | undefined>;
  createProductVariant(variant: InsertProductVariant): Promise<ProductVariant>;
  updateProductVariant(
    id: number,
    variant: Partial<ProductVariant>
  ): Promise<ProductVariant>;
  deleteProductVariant(id: number): Promise<void>;
  createProductVariantsBulk(
    variants: InsertProductVariant[]
  ): Promise<ProductVariant[]>;

  // Stock management
  updateProductStock(productId: number, newStock: number): Promise<void>;
  updateProductVariantStock(variantId: number, newStock: number): Promise<void>;

  // Cart operations
  getCartItems(userId: number): Promise<
    {
      id: number;
      quantity: number;
      product: Product;
      userId: number;
      variant?: ProductVariant;
    }[]
  >;
  getCartItem(id: number): Promise<Cart | undefined>;
  addToCart(cart: InsertCart): Promise<Cart>;
  updateCartItem(id: number, quantity: number): Promise<Cart>;
  removeFromCart(id: number): Promise<void>;
  clearCart(userId: number): Promise<void>;

  // Order operations
  getOrders(userId?: number, sellerId?: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getLatestOrder(): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  getOrderItems(orderId: number): Promise<(OrderItem & { product: Product })[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, data: Partial<OrderItem>): Promise<OrderItem>;
  getOrderItemsBySellerOrderId(
    sellerOrderId: number
  ): Promise<(OrderItem & { product: Product })[]>;
  orderHasSellerProducts(orderId: number, sellerId: number): Promise<boolean>;

  // Seller Order operations
  getSellerOrders(orderId: number): Promise<SellerOrder[]>;
  getSellerOrder(id: number): Promise<SellerOrder | undefined>;
  getSellerOrderById(id: number): Promise<SellerOrder | undefined>;
  getSellerOrdersByOrderId(
    orderId: number
  ): Promise<(SellerOrder & { seller: User })[]>;
  getSellerOrdersBySellerId(
    sellerId: number
  ): Promise<(SellerOrder & { order: Order })[]>;
  createSellerOrder(sellerOrder: InsertSellerOrder): Promise<SellerOrder>;
  updateSellerOrderStatus(id: number, status: string): Promise<SellerOrder>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<Category>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Subcategory operations
  getSubcategories(categoryId?: number): Promise<Subcategory[]>;
  getAllSubcategories(): Promise<Subcategory[]>;
  getSubcategoriesPaginated(
    categoryId?: number,
    page?: number,
    limit?: number
  ): Promise<{
    subcategories: Subcategory[];
    totalItems: number;
    totalPages: number;
  }>;
  getSubcategory(id: number): Promise<Subcategory | undefined>;
  createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory>;
  updateSubcategory(
    id: number,
    subcategory: Partial<Subcategory>
  ): Promise<Subcategory>;
  deleteSubcategory(id: number): Promise<void>;

  // Review operations
  getProductReviews(
    productId: number
  ): Promise<(Review & { user: User; images?: ReviewImage[] })[]>;
  getUserReviews(
    userId: number
  ): Promise<(Review & { product: Product; images?: ReviewImage[] })[]>;
  getReview(
    id: number
  ): Promise<
    | (Review & { user: User; product: Product; images?: ReviewImage[] })
    | undefined
  >;
  getProductReviewsForSeller(sellerId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, review: Partial<Review>): Promise<Review>;
  deleteReview(id: number): Promise<void>;

  // Review Image operations
  addReviewImage(reviewImage: InsertReviewImage): Promise<ReviewImage>;
  deleteReviewImage(id: number): Promise<void>;

  // Review Helpful operations
  markReviewHelpful(reviewId: number, userId: number): Promise<ReviewHelpful>;
  unmarkReviewHelpful(reviewId: number, userId: number): Promise<void>;
  isReviewHelpfulByUser(reviewId: number, userId: number): Promise<boolean>;

  // Product Rating Summary
  getProductRatingSummary(productId: number): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingCounts: { rating: number; count: number }[];
  }>;

  // Check if user purchased product (for verified review status)
  hasUserPurchasedProduct(userId: number, productId: number): Promise<boolean>;

  // Wishlist operations
  getWishlistItems(
    userId: number
  ): Promise<
    { id: number; product: Product; userId: number; dateAdded: Date }[]
  >;
  getWishlistItem(
    userId: number,
    productId: number
  ): Promise<Wishlist | undefined>;
  addToWishlist(wishlist: InsertWishlist): Promise<Wishlist>;
  removeFromWishlist(userId: number, productId: number): Promise<void>;
  clearWishlist(userId: number): Promise<void>;
  isProductInWishlist(userId: number, productId: number): Promise<boolean>;

  // Smart Inventory & Price Management Features
  // Sales History
  getSalesHistory(productId: number, sellerId: number): Promise<SalesHistory[]>;
  createSalesRecord(salesData: InsertSalesHistory): Promise<SalesHistory>;

  // Demand Forecasts
  getDemandForecasts(
    productId: number,
    sellerId: number
  ): Promise<DemandForecast[]>;
  getDemandForecast(id: number): Promise<DemandForecast | undefined>;
  createDemandForecast(
    forecastData: InsertDemandForecast
  ): Promise<DemandForecast>;

  // Price Optimizations
  getPriceOptimizations(
    productId: number,
    sellerId: number
  ): Promise<PriceOptimization[]>;
  getPriceOptimization(id: number): Promise<PriceOptimization | undefined>;
  createPriceOptimization(
    optimizationData: InsertPriceOptimization
  ): Promise<PriceOptimization>;
  updatePriceOptimizationStatus(
    id: number,
    status: string,
    sellerId: number
  ): Promise<PriceOptimization>;
  applyPriceOptimization(id: number, sellerId: number): Promise<Product>;

  // Inventory Optimizations
  getInventoryOptimizations(
    productId: number,
    sellerId: number
  ): Promise<InventoryOptimization[]>;
  getInventoryOptimization(
    id: number
  ): Promise<InventoryOptimization | undefined>;
  createInventoryOptimization(
    optimizationData: InsertInventoryOptimization
  ): Promise<InventoryOptimization>;
  updateInventoryOptimizationStatus(
    id: number,
    status: string,
    sellerId: number
  ): Promise<InventoryOptimization>;
  applyInventoryOptimization(id: number, sellerId: number): Promise<Product>;

  // AI Generated Content
  getAIGeneratedContents(
    productId: number,
    sellerId: number,
    contentType?: string
  ): Promise<AIGeneratedContent[]>;
  getAIGeneratedContent(id: number): Promise<AIGeneratedContent | undefined>;
  createAIGeneratedContent(
    contentData: InsertAIGeneratedContent
  ): Promise<AIGeneratedContent>;
  updateAIGeneratedContentStatus(
    id: number,
    status: string,
    sellerId: number
  ): Promise<AIGeneratedContent>;
  applyAIGeneratedContent(id: number, sellerId: number): Promise<Product>;

  // Seller Approval Operations
  getSellers(): Promise<User[]>;
  updateSellerApprovalStatus(
    sellerId: number,
    status: boolean,
    isRejected?: boolean
  ): Promise<User>;

  // Banner operations
  getBanners(active?: boolean): Promise<Banner[]>;
  getBanner(id: number): Promise<Banner | undefined>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: number, banner: Partial<Banner>): Promise<Banner>;
  deleteBanner(id: number): Promise<void>;
  updateBannerPosition(id: number, position: number): Promise<Banner>;
  toggleBannerActive(id: number): Promise<Banner>;

  // Footer Content operations
  getFooterContents(
    section?: string,
    isActive?: boolean
  ): Promise<FooterContent[]>;
  getFooterContentById(id: number): Promise<FooterContent | undefined>;
  createFooterContent(content: InsertFooterContent): Promise<FooterContent>;
  updateFooterContent(
    id: number,
    content: Partial<FooterContent>
  ): Promise<FooterContent>;
  deleteFooterContent(id: number): Promise<void>;
  toggleFooterContentActive(id: number): Promise<FooterContent>;
  updateFooterContentOrder(id: number, order: number): Promise<FooterContent>;

  // Product Display Settings operations
  getProductDisplaySettings(): Promise<ProductDisplaySettings | undefined>;
  createProductDisplaySettings(
    settings: InsertProductDisplaySettings
  ): Promise<ProductDisplaySettings>;
  updateProductDisplaySettings(
    id: number,
    settings: Partial<ProductDisplaySettings>
  ): Promise<ProductDisplaySettings>;

  // Shipping Methods operations
  getShippingMethods(): Promise<ShippingMethod[]>;
  getShippingMethodById(id: number): Promise<ShippingMethod | undefined>;
  createShippingMethod(method: InsertShippingMethod): Promise<ShippingMethod>;
  updateShippingMethod(
    id: number,
    method: Partial<ShippingMethod>
  ): Promise<ShippingMethod>;
  deleteShippingMethod(id: number): Promise<void>;

  // Shipping Zones operations
  getShippingZones(): Promise<ShippingZone[]>;
  getShippingZoneById(id: number): Promise<ShippingZone | undefined>;
  createShippingZone(zone: InsertShippingZone): Promise<ShippingZone>;
  updateShippingZone(
    id: number,
    zone: Partial<ShippingZone>
  ): Promise<ShippingZone>;
  deleteShippingZone(id: number): Promise<void>;

  // Shipping Rules operations
  getShippingRules(): Promise<ShippingRule[]>;
  getShippingRuleById(id: number): Promise<ShippingRule | undefined>;
  getShippingRulesByMethod(methodId: number): Promise<ShippingRule[]>;
  getShippingRulesByZone(zoneId: number): Promise<ShippingRule[]>;
  createShippingRule(rule: InsertShippingRule): Promise<ShippingRule>;
  updateShippingRule(
    id: number,
    rule: Partial<ShippingRule>
  ): Promise<ShippingRule>;
  deleteShippingRule(id: number): Promise<void>;

  // Seller Shipping Settings operations
  getSellerShippingSettings(
    sellerId: number
  ): Promise<SellerShippingSetting | undefined>;
  createSellerShippingSettings(
    settings: InsertSellerShippingSetting
  ): Promise<SellerShippingSetting>;
  updateSellerShippingSettings(
    sellerId: number,
    settings: Partial<SellerShippingSetting>
  ): Promise<SellerShippingSetting>;

  // Product Shipping Overrides operations
  getProductShippingOverrides(
    sellerId: number
  ): Promise<ProductShippingOverride[]>;
  getProductShippingOverrideById(
    id: number
  ): Promise<ProductShippingOverride | undefined>;
  getProductShippingOverrideByProduct(
    productId: number
  ): Promise<ProductShippingOverride | undefined>;
  createProductShippingOverride(
    override: InsertProductShippingOverride
  ): Promise<ProductShippingOverride>;
  updateProductShippingOverride(
    id: number,
    override: Partial<ProductShippingOverride>
  ): Promise<ProductShippingOverride>;
  deleteProductShippingOverride(id: number): Promise<void>;

  // Shipping Tracking operations
  getShippingTracking(orderId: number): Promise<ShippingTracking | undefined>;
  createShippingTracking(
    tracking: InsertShippingTracking
  ): Promise<ShippingTracking>;
  updateShippingTracking(
    id: number,
    tracking: Partial<ShippingTracking>
  ): Promise<ShippingTracking>;

  // Returns Management operations
  getReturnsForSeller(sellerId: number): Promise<Return[]>;
  getReturnById(id: number): Promise<Return | undefined>;
  createReturn(returnData: InsertReturn): Promise<Return>;
  updateReturnStatus(
    id: number,
    returnStatus: string,
    refundStatus?: string
  ): Promise<Return>;

  // Analytics Management operations
  getSellerAnalytics(
    sellerId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<SellerAnalytic[]>;
  createOrUpdateSellerAnalytics(
    data: InsertSellerAnalytic
  ): Promise<SellerAnalytic>;

  // Payments Management operations
  getSellerPayments(sellerId: number): Promise<SellerPayment[]>;
  getSellerPaymentById(id: number): Promise<SellerPayment | undefined>;
  createSellerPayment(paymentData: InsertSellerPayment): Promise<SellerPayment>;
  updateSellerPayment(
    id: number,
    paymentData: Partial<InsertSellerPayment>
  ): Promise<SellerPayment>;

  // Settings Management operations
  getSellerSettings(sellerId: number): Promise<SellerSetting | undefined>;
  createOrUpdateSellerSettings(
    sellerId: number,
    settingsData: Partial<InsertSellerSetting>
  ): Promise<SellerSetting>;

  // Support Management operations
  getSellerSupportTickets(userId: number): Promise<SupportTicket[]>;
  getSupportTicketById(id: number): Promise<SupportTicket | undefined>;
  createSupportTicket(ticketData: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(
    id: number,
    ticketData: Partial<InsertSupportTicket>
  ): Promise<SupportTicket>;
  getSupportMessages(ticketId: number): Promise<SupportMessage[]>;
  createSupportMessage(
    messageData: InsertSupportMessage
  ): Promise<SupportMessage>;
  getSupportMessagesByTicket(ticketId: number): Promise<SupportMessage[]>;

  // Wallet Methods
  getWalletSettings(): Promise<SelectWalletSettings | null>;
  updateWalletSettings(
    settingsData: Partial<SelectWalletSettings>
  ): Promise<SelectWalletSettings>;
  getUserWallet(userId: number): Promise<SelectWallet | null>;
  getWalletByUserId(userId: number): Promise<SelectWallet | null>; // Alias for getUserWallet for compatibility
  createUserWalletIfNotExists(userId: number): Promise<SelectWallet>;
  addCoinsToWallet(
    userId: number,
    amount: number,
    referenceType: string,
    referenceId?: number,
    description?: string
  ): Promise<SelectWallet>;
  redeemCoinsFromWallet(
    userId: number,
    amount: number,
    referenceType: string,
    referenceId?: number,
    description?: string
  ): Promise<{ wallet: SelectWallet; discountAmount: number }>;
  getUserWalletTransactions(
    userId: number,
    page?: number,
    limit?: number
  ): Promise<{ transactions: SelectWalletTransaction[]; total: number }>;
  processFirstPurchaseReward(
    userId: number,
    orderId: number
  ): Promise<SelectWallet | null>;
  processExpiredCoins(): Promise<number>;
  manualAdjustWallet(
    userId: number,
    amount: number,
    description: string
  ): Promise<SelectWallet>;
  getUsersWithWallets(): Promise<
    Array<{ id: number; username: string; balance: number }>
  >;

  // Product Display Settings
  getProductDisplaySettings(): Promise<ProductDisplaySettings | undefined>;
  createProductDisplaySettings(
    settings: InsertProductDisplaySettings
  ): Promise<ProductDisplaySettings>;
  updateProductDisplaySettings(
    id: number,
    settings: Partial<ProductDisplaySettings>
  ): Promise<ProductDisplaySettings>;

  // Session store
  sessionStore: session.SessionStore;
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  // Utility method to sanitize object fields for database operations
  private sanitizeTimestampFields<T extends Record<string, any>>(
    data: T
  ): Omit<T, "createdAt" | "updatedAt"> {
    // Create a new object without the timestamp fields
    const { createdAt, updatedAt, ...cleanData } = data;
    return cleanData;
  }

  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Media Library Methods
  async getMediaItems(
    page: number = 1,
    limit: number = 20,
    search?: string
  ): Promise<{ items: MediaLibraryItem[]; total: number }> {
    try {
      let query = db.select().from(mediaLibrary);

      if (search) {
        query = query.where(
          or(
            ilike(mediaLibrary.filename, `%${search}%`),
            ilike(mediaLibrary.originalName, `%${search}%`),
            ilike(mediaLibrary.tags, `%${search}%`),
            ilike(mediaLibrary.alt, `%${search}%`)
          )
        );
      }

      const totalResult = await db
        .select({ count: sql`count(*)` })
        .from(mediaLibrary);
      const total = Number(totalResult[0].count);

      const items = await query
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(desc(mediaLibrary.createdAt));

      return { items, total };
    } catch (error) {
      console.error("Error fetching media items:", error);
      return { items: [], total: 0 };
    }
  }

  async getMediaItemById(id: number): Promise<MediaLibraryItem | undefined> {
    try {
      const [item] = await db
        .select()
        .from(mediaLibrary)
        .where(eq(mediaLibrary.id, id));

      return item;
    } catch (error) {
      console.error(`Error fetching media item with ID ${id}:`, error);
      return undefined;
    }
  }

  async createMediaItem(
    item: InsertMediaLibraryItem
  ): Promise<MediaLibraryItem> {
    try {
      const [newItem] = await db.insert(mediaLibrary).values(item).returning();

      return newItem;
    } catch (error) {
      console.error("Error creating media item:", error);
      throw error;
    }
  }

  async deleteMediaItem(id: number): Promise<void> {
    try {
      await db.delete(mediaLibrary).where(eq(mediaLibrary.id, id));
    } catch (error) {
      console.error(`Error deleting media item with ID ${id}:`, error);
      throw error;
    }
  }

  // Document Template Methods
  async getDocumentTemplates(type?: string): Promise<DocumentTemplate[]> {
    try {
      if (type) {
        return await db
          .select()
          .from(documentTemplates)
          .where(eq(documentTemplates.type, type));
      } else {
        return await db.select().from(documentTemplates);
      }
    } catch (error) {
      console.error("Error getting document templates:", error);
      return [];
    }
  }

  async getDocumentTemplate(id: number): Promise<DocumentTemplate | undefined> {
    try {
      const [template] = await db
        .select()
        .from(documentTemplates)
        .where(eq(documentTemplates.id, id));
      return template;
    } catch (error) {
      console.error(`Error getting document template with ID ${id}:`, error);
      return undefined;
    }
  }

  async getDefaultDocumentTemplate(
    type: string
  ): Promise<DocumentTemplate | undefined> {
    try {
      const [template] = await db
        .select()
        .from(documentTemplates)
        .where(
          and(
            eq(documentTemplates.type, type),
            eq(documentTemplates.isDefault, true)
          )
        );
      return template;
    } catch (error) {
      console.error(
        `Error getting default document template of type ${type}:`,
        error
      );
      return undefined;
    }
  }

  async createDocumentTemplate(
    template: InsertDocumentTemplate
  ): Promise<DocumentTemplate> {
    try {
      // Set updatedAt to current time
      const data = {
        ...template,
        updatedAt: new Date(),
      };

      const [newTemplate] = await db
        .insert(documentTemplates)
        .values(data)
        .returning();

      return newTemplate;
    } catch (error) {
      console.error("Error creating document template:", error);
      throw new Error("Failed to create document template");
    }
  }

  async updateDocumentTemplate(
    id: number,
    template: Partial<InsertDocumentTemplate>
  ): Promise<DocumentTemplate> {
    try {
      // Set updatedAt to current time
      const data = {
        ...template,
        updatedAt: new Date(),
      };

      const [updatedTemplate] = await db
        .update(documentTemplates)
        .set(data)
        .where(eq(documentTemplates.id, id))
        .returning();

      return updatedTemplate;
    } catch (error) {
      console.error(`Error updating document template with ID ${id}:`, error);
      throw new Error("Failed to update document template");
    }
  }

  async deleteDocumentTemplate(id: number): Promise<void> {
    try {
      await db.delete(documentTemplates).where(eq(documentTemplates.id, id));
    } catch (error) {
      console.error(`Error deleting document template with ID ${id}:`, error);
      throw new Error("Failed to delete document template");
    }
  }

  async setDefaultTemplate(id: number): Promise<DocumentTemplate> {
    try {
      // Get the template to find its type
      const template = await this.getDocumentTemplate(id);
      if (!template) {
        throw new Error(`Document template with ID ${id} not found`);
      }

      // First, unset default for all templates of the same type
      await db
        .update(documentTemplates)
        .set({ isDefault: false })
        .where(eq(documentTemplates.type, template.type));

      // Then set this template as default
      const [updatedTemplate] = await db
        .update(documentTemplates)
        .set({
          isDefault: true,
          updatedAt: new Date(),
        })
        .where(eq(documentTemplates.id, id))
        .returning();

      return updatedTemplate;
    } catch (error) {
      console.error(`Error setting template ${id} as default:`, error);
      throw new Error("Failed to set default template");
    }
  }

  // System Settings methods
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    try {
      const [setting] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, key));

      return setting;
    } catch (error) {
      console.error(`Error getting system setting for key ${key}:`, error);
      return undefined;
    }
  }

  async getAllSystemSettings(): Promise<SystemSetting[]> {
    try {
      return await db.select().from(systemSettings);
    } catch (error) {
      console.error("Error getting all system settings:", error);
      return [];
    }
  }

  async createOrUpdateSystemSetting(
    key: string,
    value: string,
    description?: string
  ): Promise<SystemSetting> {
    try {
      // Check if setting exists
      const existingSetting = await this.getSystemSetting(key);

      if (existingSetting) {
        // Update existing setting
        const [updatedSetting] = await db
          .update(systemSettings)
          .set({
            value,
            description: description || existingSetting.description,
            updatedAt: new Date(),
          })
          .where(eq(systemSettings.key, key))
          .returning();

        return updatedSetting;
      } else {
        // Create new setting
        const [newSetting] = await db
          .insert(systemSettings)
          .values({
            key,
            value,
            description,
          })
          .returning();

        return newSetting;
      }
    } catch (error) {
      console.error(
        `Error creating/updating system setting for key ${key}:`,
        error
      );
      throw new Error("Failed to create/update system setting");
    }
  }

  // Notification methods
  async getUserNotifications(
    userId: number,
    page = 1,
    limit = 10
  ): Promise<{ notifications: Notification[]; total: number }> {
    const offset = (page - 1) * limit;

    // Get total count
    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(notifications)
      .where(eq(notifications.userId, userId));

    const total = Number(totalResult[0]?.count || 0);

    // Get paginated notifications
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return { notifications: result, total };
  }

  async getUserUnreadNotificationsCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.read, false))
      );

    return Number(result[0]?.count || 0);
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));

    return notification;
  }

  async createNotification(
    notification: InsertNotification
  ): Promise<Notification> {
    const [createdNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();

    return createdNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();

    return updatedNotification;
  }

  async markAllUserNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async deleteAllUserNotifications(userId: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.userId, userId));
  }

  // Seller Document methods
  async getSellerDocuments(sellerId: number): Promise<SellerDocument[]> {
    try {
      return await db
        .select()
        .from(sellerDocuments)
        .where(eq(sellerDocuments.sellerId, sellerId));
    } catch (error) {
      console.error(
        `Error getting seller documents for seller ID ${sellerId}:`,
        error
      );
      return [];
    }
  }

  async getSellerDocumentById(id: number): Promise<SellerDocument | undefined> {
    try {
      const [document] = await db
        .select()
        .from(sellerDocuments)
        .where(eq(sellerDocuments.id, id));
      return document;
    } catch (error) {
      console.error(`Error getting seller document with ID ${id}:`, error);
      return undefined;
    }
  }

  async createSellerDocument(
    document: InsertSellerDocument
  ): Promise<SellerDocument> {
    try {
      const [newDocument] = await db
        .insert(sellerDocuments)
        .values(document)
        .returning();
      return newDocument;
    } catch (error) {
      console.error("Error creating seller document:", error);
      throw new Error("Failed to create seller document");
    }
  }

  async updateSellerDocument(
    id: number,
    verified: boolean
  ): Promise<SellerDocument> {
    try {
      const [document] = await db
        .update(sellerDocuments)
        .set({
          verified,
          verifiedAt: verified ? new Date() : null,
        })
        .where(eq(sellerDocuments.id, id))
        .returning();

      if (!document) {
        throw new Error(`Document with ID ${id} not found`);
      }

      return document;
    } catch (error) {
      console.error(`Error updating seller document ${id}:`, error);
      throw new Error("Failed to update seller document");
    }
  }

  async deleteSellerDocument(id: number): Promise<void> {
    try {
      await db.delete(sellerDocuments).where(eq(sellerDocuments.id, id));
    } catch (error) {
      console.error(`Error deleting seller document ${id}:`, error);
      throw new Error("Failed to delete seller document");
    }
  }

  // Business Details methods
  async getBusinessDetails(
    sellerId: number
  ): Promise<BusinessDetails | undefined> {
    try {
      const [details] = await db
        .select()
        .from(businessDetails)
        .where(eq(businessDetails.sellerId, sellerId));
      return details;
    } catch (error) {
      console.error(
        `Error getting business details for seller ID ${sellerId}:`,
        error
      );
      return undefined;
    }
  }

  async createBusinessDetails(
    details: InsertBusinessDetails
  ): Promise<BusinessDetails> {
    try {
      const [newDetails] = await db
        .insert(businessDetails)
        .values(details)
        .returning();
      return newDetails;
    } catch (error) {
      console.error("Error creating business details:", error);
      throw new Error("Failed to create business details");
    }
  }

  async updateBusinessDetails(
    sellerId: number,
    details: Partial<BusinessDetails>
  ): Promise<BusinessDetails> {
    try {
      // Check if business details exist for this seller
      const existingDetails = await this.getBusinessDetails(sellerId);

      if (existingDetails) {
        // Update existing details
        const [updatedDetails] = await db
          .update(businessDetails)
          .set({
            ...details,
            updatedAt: new Date(),
          })
          .where(eq(businessDetails.sellerId, sellerId))
          .returning();

        return updatedDetails;
      } else {
        // Create new business details
        return await this.createBusinessDetails({
          sellerId,
          businessName: details.businessName || "Default Business Name", // Required field
          gstNumber: details.gstNumber,
          panNumber: details.panNumber,
          businessType: details.businessType,
        });
      }
    } catch (error) {
      console.error(
        `Error updating business details for seller ID ${sellerId}:`,
        error
      );
      throw new Error("Failed to update business details");
    }
  }

  // Banking Information methods
  async getBankingInformation(
    sellerId: number
  ): Promise<BankingInformation | undefined> {
    try {
      const [info] = await db
        .select()
        .from(bankingInformation)
        .where(eq(bankingInformation.sellerId, sellerId));
      return info;
    } catch (error) {
      console.error(
        `Error getting banking information for seller ID ${sellerId}:`,
        error
      );
      return undefined;
    }
  }

  async createBankingInformation(
    info: InsertBankingInformation
  ): Promise<BankingInformation> {
    try {
      const [newInfo] = await db
        .insert(bankingInformation)
        .values(info)
        .returning();
      return newInfo;
    } catch (error) {
      console.error("Error creating banking information:", error);
      throw new Error("Failed to create banking information");
    }
  }

  async updateBankingInformation(
    sellerId: number,
    info: Partial<BankingInformation>
  ): Promise<BankingInformation> {
    try {
      // Check if banking information exists for this seller
      const existingInfo = await this.getBankingInformation(sellerId);

      if (existingInfo) {
        // Update existing information
        const [updatedInfo] = await db
          .update(bankingInformation)
          .set({
            ...info,
            updatedAt: new Date(),
          })
          .where(eq(bankingInformation.sellerId, sellerId))
          .returning();

        return updatedInfo;
      } else {
        // Create new banking information
        return await this.createBankingInformation({
          sellerId,
          accountHolderName: info.accountHolderName || "Account Holder", // Required field
          accountNumber: info.accountNumber || "0000000000000", // Required field
          bankName: info.bankName || "Bank Name", // Required field
          ifscCode: info.ifscCode || "XXXX0000000", // Required field
        });
      }
    } catch (error) {
      console.error(
        `Error updating banking information for seller ID ${sellerId}:`,
        error
      );
      throw new Error("Failed to update banking information");
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async updateUserRole(id: number, role: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role: role as User["role"] })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async updateUserProfile(id: number, data: Partial<User>): Promise<User> {
    // Only allow updating these fields
    const allowedFields: (keyof User)[] = [
      "username",
      "email",
      "phone",
      "address",
      "profileImage",
    ];

    // Filter out any fields that are not allowed
    const filteredData: Partial<User> = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        filteredData[key] = data[key];
      }
    }

    // Check for email uniqueness if email is being updated
    if (filteredData.email) {
      const existingUser = await this.getUserByEmail(filteredData.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error("Email address already in use by another account");
      }
    }

    // Check for username uniqueness if username is being updated
    if (filteredData.username) {
      const existingUser = await this.getUserByUsername(filteredData.username);
      if (existingUser && existingUser.id !== id) {
        throw new Error("Username already exists");
      }
    }

    // Update the user in the database
    const [updatedUser] = await db
      .update(users)
      .set(filteredData)
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async getUserNotificationPreferences(id: number): Promise<any | null> {
    try {
      // Get the user first
      const user = await this.getUser(id);

      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }

      // Check if notification preferences exist
      if (!user.notificationPreferences) {
        return null;
      }

      // If it's already an object, return it
      if (
        typeof user.notificationPreferences === "object" &&
        user.notificationPreferences !== null
      ) {
        return user.notificationPreferences;
      }

      // Parse and return the notification preferences
      try {
        // If it's a string, try to parse it as JSON
        if (typeof user.notificationPreferences === "string") {
          return JSON.parse(user.notificationPreferences);
        } else {
          console.warn(
            `Unexpected type for notification preferences: ${typeof user.notificationPreferences}`
          );
          return null;
        }
      } catch (error) {
        console.error(
          `Error parsing notification preferences for user ${id}:`,
          error
        );

        // If parsing fails and we have an invalid value like '[object Object]',
        // return default preferences instead of null
        if (user.notificationPreferences === "[object Object]") {
          console.log(
            `Resetting invalid notification preferences for user ${id}`
          );
          return {
            orderUpdates: true,
            promotions: true,
            priceAlerts: true,
            stockAlerts: true,
            accountUpdates: true,
            deliveryUpdates: true,
            recommendationAlerts: true,
            paymentReminders: true,
            communicationPreference: "email",
          };
        }

        return null;
      }
    } catch (error) {
      console.error(
        `Error getting notification preferences for user ${id}:`,
        error
      );
      return null;
    }
  }

  async updateUserNotificationPreferences(
    id: number,
    preferences: any
  ): Promise<User> {
    try {
      // Get the user first to ensure they exist
      const user = await this.getUser(id);

      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }

      // Ensure preferences is an object, not a string
      const preferencesObj =
        typeof preferences === "string" ? JSON.parse(preferences) : preferences;

      // Debug log to see what we're trying to save
      console.log(
        `Saving notification preferences for user ${id}:`,
        preferencesObj
      );

      // Convert preferences to JSON string
      const preferencesJson = JSON.stringify(preferencesObj);

      // Update the user's notification preferences
      const [updatedUser] = await db
        .update(users)
        .set({ notificationPreferences: preferencesJson })
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        throw new Error(
          `Failed to update notification preferences for user ${id}`
        );
      }

      console.log(
        `Successfully updated notification preferences for user ${id}`
      );

      return updatedUser;
    } catch (error) {
      console.error(
        `Error updating notification preferences for user ${id}:`,
        error
      );
      throw new Error(
        `Failed to update notification preferences: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      // Check for special admin user that cannot be deleted
      const user = await this.getUser(id);

      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }

      // Special admin with email kaushlendra.k12@fms.edu cannot be deleted
      if (user.email === "kaushlendra.k12@fms.edu") {
        throw new Error("This is a special admin user that cannot be deleted");
      }

      // Helper function to safely delete records from a table
      const safeDelete = async (
        tableName: string,
        action: () => Promise<any>
      ) => {
        try {
          await action();
        } catch (error) {
          // If the table doesn't exist, log it but continue
          if ((error as any).code === "42P01") {
            console.log(`Table ${tableName} doesn't exist, skipping deletion`);
          } else {
            // For other errors, log but continue with the deletion process
            console.error(`Error deleting from ${tableName}:`, error);
          }
        }
      };

      // Handle foreign key constraints by checking if tables exist and then deleting records
      try {
        // First, directly check if products table exists and if user has products
        const productQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'products'
          ) as exists
        `;
        const { rows: tableExists } = await pool.query(productQuery);

        if (tableExists[0].exists) {
          // If products table exists, check if user has products
          const { rows: productCount } = await pool.query(
            `SELECT COUNT(*) FROM products WHERE seller_id = $1`,
            [id]
          );

          if (parseInt(productCount[0].count) > 0) {
            // User has products - we need to handle this first
            await pool.query(`DELETE FROM products WHERE seller_id = $1`, [id]);
          }
        }
      } catch (error) {
        console.error("Error checking for products:", error);
        // Continue with deletion anyway
      }

      // Try a direct SQL approach for cart deletion to avoid Drizzle issues
      try {
        await pool.query(`DELETE FROM carts WHERE user_id = $1`, [id]);
      } catch (error) {
        // If table doesn't exist, just continue
        console.log("Carts might not exist, skipping cart deletion");
      }

      // 3. Delete user's orders and order items
      try {
        // Check if orders table exists
        const { rows: orderExists } = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'orders'
          ) as exists
        `);

        if (orderExists[0].exists) {
          // Get all orders for the user
          const { rows: userOrders } = await pool.query(
            `SELECT id FROM orders WHERE user_id = $1`,
            [id]
          );

          // Delete order items first if they exist
          const { rows: orderItemsExist } = await pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'order_items'
            ) as exists
          `);

          if (orderItemsExist[0].exists && userOrders.length > 0) {
            for (const order of userOrders) {
              await pool.query(`DELETE FROM order_items WHERE order_id = $1`, [
                order.id,
              ]);
            }
          }

          // Then delete the orders
          await pool.query(`DELETE FROM orders WHERE user_id = $1`, [id]);
        }
      } catch (error) {
        console.log("Error handling orders:", error);
      }

      // 4. Delete user's reviews and related data - similar approach with direct SQL
      try {
        // Check if reviews table exists
        const { rows: reviewsExist } = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'reviews'
          ) as exists
        `);

        if (reviewsExist[0].exists) {
          // Get all reviews for the user
          const { rows: userReviews } = await pool.query(
            `SELECT id FROM reviews WHERE user_id = $1`,
            [id]
          );

          if (userReviews.length > 0) {
            // Check and delete review images if they exist
            try {
              const { rows: imagesExist } = await pool.query(`
                SELECT EXISTS (
                  SELECT FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'review_images'
                ) as exists
              `);

              if (imagesExist[0].exists) {
                for (const review of userReviews) {
                  await pool.query(
                    `DELETE FROM review_images WHERE review_id = $1`,
                    [review.id]
                  );
                }
              }
            } catch (error) {
              console.log("Review images table might not exist");
            }

            // Check and delete review helpful marks if they exist
            try {
              const { rows: helpfulExist } = await pool.query(`
                SELECT EXISTS (
                  SELECT FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'review_helpful'
                ) as exists
              `);

              if (helpfulExist[0].exists) {
                for (const review of userReviews) {
                  await pool.query(
                    `DELETE FROM review_helpful WHERE review_id = $1`,
                    [review.id]
                  );
                }
              }
            } catch (error) {
              console.log("Review helpful table might not exist");
            }
          }

          // Then delete the reviews
          await pool.query(`DELETE FROM reviews WHERE user_id = $1`, [id]);
        }
      } catch (error) {
        console.log("Error handling reviews:", error);
      }

      // 5. Delete user's addresses with direct SQL
      try {
        await pool.query(`DELETE FROM user_addresses WHERE user_id = $1`, [id]);
      } catch (error) {
        console.log("User addresses table might not exist");
      }

      // 6. Delete seller-specific data if user is a seller
      if (user.role === "seller") {
        const sellerTables = [
          "sales_history",
          "demand_forecasts",
          "price_optimizations",
          "inventory_optimizations",
          "seller_documents",
          "business_details",
          "banking_information",
        ];

        for (const table of sellerTables) {
          try {
            // Check if table exists
            const { rows: tableExists } = await pool.query(
              `
              SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
              ) as exists
            `,
              [table]
            );

            if (tableExists[0].exists) {
              await pool.query(`DELETE FROM ${table} WHERE seller_id = $1`, [
                id,
              ]);
            }
          } catch (error) {
            console.log(`${table} might not exist or can't be deleted`);
          }
        }
      }

      // 7. Delete AI-generated content with direct SQL
      try {
        await pool.query(
          `DELETE FROM ai_generated_content WHERE user_id = $1`,
          [id]
        );
      } catch (error) {
        console.log("AI-generated content table might not exist");
      }

      // Finally, delete the user
      await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      throw new Error(`Failed to delete user: ${(error as Error).message}`);
    }
  }

  // Co-Admin Management Methods
  async getCoAdmins(): Promise<User[]> {
    try {
      const coAdmins = await db
        .select()
        .from(users)
        .where(and(eq(users.role, "admin"), eq(users.isCoAdmin, true)));

      return coAdmins;
    } catch (error) {
      console.error("Error fetching co-admins:", error);
      return [];
    }
  }

  async getCoAdminById(id: number): Promise<User | undefined> {
    try {
      const [coAdmin] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, id),
            eq(users.role, "admin"),
            eq(users.isCoAdmin, true)
          )
        );

      return coAdmin;
    } catch (error) {
      console.error(`Error fetching co-admin with ID ${id}:`, error);
      return undefined;
    }
  }

  async updateCoAdminPermissions(
    id: number,
    permissions: any
  ): Promise<User | undefined> {
    try {
      // First check if the user is a co-admin
      const coAdmin = await this.getCoAdminById(id);

      if (!coAdmin) {
        return undefined;
      }

      // Update permissions
      const [updatedCoAdmin] = await db
        .update(users)
        .set({ permissions })
        .where(eq(users.id, id))
        .returning();

      return updatedCoAdmin;
    } catch (error) {
      console.error(`Error updating co-admin permissions for ID ${id}:`, error);
      return undefined;
    }
  }

  async deleteCoAdmin(id: number): Promise<void> {
    try {
      // Verify that the user is a co-admin before deletion
      const coAdmin = await this.getCoAdminById(id);

      if (!coAdmin) {
        throw new Error(`Co-admin with ID ${id} not found`);
      }

      await db.delete(users).where(eq(users.id, id));
    } catch (error) {
      console.error(`Error deleting co-admin with ID ${id}:`, error);
      throw new Error(`Failed to delete co-admin: ${(error as Error).message}`);
    }
  }

  /**
   * Get all admin users, with option to include or exclude co-admins
   * @param includeCoAdmins If true, include co-admin users; if false, return only true admins
   */
  async getAllAdminUsers(includeCoAdmins: boolean): Promise<User[]> {
    try {
      // Build the query based on whether we want to include co-admins or not
      let query = db.select().from(users).where(eq(users.role, "admin"));

      // If we don't want co-admins, add a condition to exclude them
      if (!includeCoAdmins) {
        query = query.where(
          or(eq(users.isCoAdmin, false), isNull(users.isCoAdmin))
        );
      }

      const adminUsers = await query;

      return adminUsers;
    } catch (error) {
      console.error("Error fetching admin users:", error);
      return [];
    }
  }

  async getSellers(approved?: boolean, rejected?: boolean): Promise<User[]> {
    try {
      let query = db.select().from(users).where(eq(users.role, "seller"));

      if (approved !== undefined) {
        query = query.where(eq(users.approved, approved));
      }

      if (rejected !== undefined) {
        query = query.where(eq(users.rejected, rejected));
      }

      return await query;
    } catch (error) {
      console.error("Error in getSellers:", error);
      return [];
    }
  }

  // Get pending sellers (not approved, not rejected)
  async getPendingSellers(): Promise<User[]> {
    try {
      return await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.role, "seller"),
            eq(users.approved, false),
            eq(users.rejected, false)
          )
        );
    } catch (error) {
      console.error("Error in getPendingSellers:", error);
      return [];
    }
  }

  // Get approved sellers
  async getApprovedSellers(): Promise<User[]> {
    try {
      return await db
        .select()
        .from(users)
        .where(and(eq(users.role, "seller"), eq(users.approved, true)));
    } catch (error) {
      console.error("Error in getApprovedSellers:", error);
      return [];
    }
  }

  // Get rejected sellers
  async getRejectedSellers(): Promise<User[]> {
    try {
      return await db
        .select()
        .from(users)
        .where(and(eq(users.role, "seller"), eq(users.rejected, true)));
    } catch (error) {
      console.error("Error in getRejectedSellers:", error);
      return [];
    }
  }

  // For interface compatibility
  async updateSellerApproval(
    id: number,
    approved: boolean,
    rejected: boolean = false
  ): Promise<User> {
    return this.updateSellerApprovalStatus(id, approved, rejected);
  }

  async updateSellerProfile(
    id: number,
    profileData: Partial<User>
  ): Promise<User> {
    try {
      // First check if user exists and is a seller
      const [seller] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.role, "seller")));

      if (!seller) {
        throw new Error(`Seller with ID ${id} not found`);
      }

      // Remove fields that shouldn't be updated via this method
      const safeProfileData: Partial<User> = { ...profileData };

      // Fields to exclude from updates
      const excludeFields = ["id", "role", "approved", "rejected"];
      excludeFields.forEach((field) => {
        if (field in safeProfileData) {
          delete safeProfileData[field as keyof User];
        }
      });

      // Update the seller profile (without updatedAt since it might not exist in schema)
      const [updatedSeller] = await db
        .update(users)
        .set(safeProfileData)
        .where(eq(users.id, id))
        .returning();

      return updatedSeller;
    } catch (error) {
      console.error(`Error updating seller profile for ID ${id}:`, error);
      throw new Error("Failed to update seller profile");
    }
  }

  async updateSellerApprovalStatus(
    id: number,
    status: boolean,
    isRejected: boolean = false
  ): Promise<User> {
    const [seller] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "seller")));

    if (!seller) {
      throw new Error(`Seller with ID ${id} not found`);
    }

    // When approving, clear the rejected flag
    // When rejecting, set the rejected flag and clear approved
    const [updatedSeller] = await db
      .update(users)
      .set({
        approved: status,
        rejected: isRejected,
      })
      .where(eq(users.id, id))
      .returning();

    return updatedSeller;
  }

  // User Address Management Methods

  async getUserAddresses(userId: number): Promise<UserAddress[]> {
    try {
      return await db
        .select()
        .from(userAddresses)
        .where(eq(userAddresses.userId, userId));
    } catch (error) {
      console.error("Error in getUserAddresses:", error);
      return [];
    }
  }

  async getUserAddressById(id: number): Promise<UserAddress | undefined> {
    try {
      const [address] = await db
        .select()
        .from(userAddresses)
        .where(eq(userAddresses.id, id));
      return address;
    } catch (error) {
      console.error(`Error getting address ${id}:`, error);
      return undefined;
    }
  }

  async getUserAddress(id: number): Promise<UserAddress | undefined> {
    // This is an alias for getUserAddressById for better naming consistency
    return this.getUserAddressById(id);
  }

  async getWalletById(id: number): Promise<any> {
    try {
      // Use the getUserWallet function from wallet-handlers.js
      const { getUserWallet } = await import("./handlers/wallet-handlers");
      const wallet = await getUserWallet(id);
      return wallet;
    } catch (error) {
      console.error(`Error getting wallet with ID ${id}:`, error);
      return null;
    }
  }

  async createUserAddress(address: InsertUserAddress): Promise<UserAddress> {
    try {
      // If this is set as default, make sure to unset any other default addresses for this user
      if (address.isDefault) {
        await db
          .update(userAddresses)
          .set({ isDefault: false })
          .where(
            and(
              eq(userAddresses.userId, address.userId),
              eq(userAddresses.isDefault, true)
            )
          );
      }

      // Now create the new address
      const [newAddress] = await db
        .insert(userAddresses)
        .values(address)
        .returning();

      return newAddress;
    } catch (error) {
      console.error("Error creating address:", error);
      throw new Error("Failed to create address");
    }
  }

  async updateUserAddress(
    id: number,
    updateData: Partial<UserAddress>
  ): Promise<UserAddress> {
    try {
      const [existingAddress] = await db
        .select()
        .from(userAddresses)
        .where(eq(userAddresses.id, id));

      if (!existingAddress) {
        throw new Error(`Address with ID ${id} not found`);
      }

      // If setting this address as default, unset any other defaults first
      if (updateData.isDefault) {
        await db
          .update(userAddresses)
          .set({ isDefault: false })
          .where(
            and(
              eq(userAddresses.userId, existingAddress.userId),
              eq(userAddresses.isDefault, true),
              userAddresses.id != id // Don't unset the current address
            )
          );
      }

      // Update the address
      const [updatedAddress] = await db
        .update(userAddresses)
        .set({
          ...updateData,
          updatedAt: new Date(), // Always update the updatedAt timestamp
        })
        .where(eq(userAddresses.id, id))
        .returning();

      return updatedAddress;
    } catch (error) {
      console.error(`Error updating address ${id}:`, error);
      throw new Error("Failed to update address");
    }
  }

  async deleteUserAddress(id: number): Promise<void> {
    try {
      console.log(`Attempting to delete address ID: ${id}`);

      // First, check if this address is used in any orders
      const ordersUsingAddress = await db
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.addressId, id))
        .limit(1);

      console.log(
        `Found ${ordersUsingAddress.length} orders using this address`
      );

      if (ordersUsingAddress.length > 0) {
        // Address is used in orders, so we need to handle this case
        console.log(
          `Cannot delete address ID ${id} because it's used in orders`
        );

        // Option 1: We could throw an error explaining the situation
        throw new Error(
          "This address cannot be deleted because it's used in completed orders."
        );

        // Option 2 (alternate): We could set a 'deleted' flag if we had one
        // await db.update(userAddresses)
        //   .set({ deleted: true })
        //   .where(eq(userAddresses.id, id));
      }

      // Get the address before deleting (to check if it's a default address)
      const [existingAddress] = await db
        .select()
        .from(userAddresses)
        .where(eq(userAddresses.id, id));

      if (!existingAddress) {
        console.log(`No address found with ID: ${id}`);
        return; // Address doesn't exist, nothing to delete
      }

      // Attempt to delete the address
      const [deletedAddress] = await db
        .delete(userAddresses)
        .where(eq(userAddresses.id, id))
        .returning();

      console.log(`Successfully deleted address:`, deletedAddress);

      // If this was a default address and there are other addresses, make one of them the default
      if (existingAddress.isDefault) {
        console.log(
          `Deleted address was a default, finding a new default address`
        );
        const otherAddresses = await db
          .select()
          .from(userAddresses)
          .where(eq(userAddresses.userId, existingAddress.userId))
          .limit(1);

        if (otherAddresses.length > 0) {
          console.log(
            `Setting address ID ${otherAddresses[0].id} as new default`
          );
          await db
            .update(userAddresses)
            .set({ isDefault: true })
            .where(eq(userAddresses.id, otherAddresses[0].id));
        }
      }
    } catch (error) {
      console.error(`Error deleting address ${id}:`, error);
      throw error; // Rethrow the error with original message
    }
  }

  async setDefaultAddress(userId: number, addressId: number): Promise<void> {
    try {
      // First, check if the address exists and belongs to the user
      const [address] = await db
        .select()
        .from(userAddresses)
        .where(
          and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId))
        );

      if (!address) {
        throw new Error(`Address ${addressId} not found for user ${userId}`);
      }

      // Unset all default addresses for this user
      await db
        .update(userAddresses)
        .set({ isDefault: false })
        .where(eq(userAddresses.userId, userId));

      // Set the selected address as default
      await db
        .update(userAddresses)
        .set({
          isDefault: true,
          // For backward compatibility, also set as default billing and shipping
          isDefaultBilling: true,
          isDefaultShipping: true,
        })
        .where(eq(userAddresses.id, addressId));
    } catch (error) {
      console.error(`Error setting default address:`, error);
      throw new Error("Failed to set default address");
    }
  }

  async setDefaultBillingAddress(
    userId: number,
    addressId: number
  ): Promise<void> {
    try {
      // First, check if the address exists and belongs to the user
      const [address] = await db
        .select()
        .from(userAddresses)
        .where(
          and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId))
        );

      if (!address) {
        throw new Error(`Address ${addressId} not found for user ${userId}`);
      }

      // Check if address type is compatible
      if (address.addressType === "shipping") {
        // Update address type to 'both' if it was shipping-only
        await db
          .update(userAddresses)
          .set({ addressType: "both" })
          .where(eq(userAddresses.id, addressId));
      }

      // Unset all default billing addresses for this user
      await db
        .update(userAddresses)
        .set({ isDefaultBilling: false })
        .where(eq(userAddresses.userId, userId));

      // Set the selected address as default billing
      await db
        .update(userAddresses)
        .set({ isDefaultBilling: true })
        .where(eq(userAddresses.id, addressId));
    } catch (error) {
      console.error(`Error setting default billing address:`, error);
      throw new Error("Failed to set default billing address");
    }
  }

  async setDefaultShippingAddress(
    userId: number,
    addressId: number
  ): Promise<void> {
    try {
      // First, check if the address exists and belongs to the user
      const [address] = await db
        .select()
        .from(userAddresses)
        .where(
          and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId))
        );

      if (!address) {
        throw new Error(`Address ${addressId} not found for user ${userId}`);
      }

      // Check if address type is compatible
      if (address.addressType === "billing") {
        // Update address type to 'both' if it was billing-only
        await db
          .update(userAddresses)
          .set({ addressType: "both" })
          .where(eq(userAddresses.id, addressId));
      }

      // Unset all default shipping addresses for this user
      await db
        .update(userAddresses)
        .set({ isDefaultShipping: false })
        .where(eq(userAddresses.userId, userId));

      // Set the selected address as default shipping
      await db
        .update(userAddresses)
        .set({ isDefaultShipping: true })
        .where(eq(userAddresses.id, addressId));
    } catch (error) {
      console.error(`Error setting default shipping address:`, error);
      throw new Error("Failed to set default shipping address");
    }
  }

  async getDefaultAddress(userId: number): Promise<UserAddress | undefined> {
    try {
      const [address] = await db
        .select()
        .from(userAddresses)
        .where(
          and(
            eq(userAddresses.userId, userId),
            eq(userAddresses.isDefault, true)
          )
        );

      return address;
    } catch (error) {
      console.error(`Error getting default address for user ${userId}:`, error);
      return undefined;
    }
  }

  async getDefaultBillingAddress(
    userId: number
  ): Promise<UserAddress | undefined> {
    try {
      const [address] = await db
        .select()
        .from(userAddresses)
        .where(
          and(
            eq(userAddresses.userId, userId),
            eq(userAddresses.isDefaultBilling, true),
            or(
              eq(userAddresses.addressType, "billing"),
              eq(userAddresses.addressType, "both")
            )
          )
        );

      return address;
    } catch (error) {
      console.error(
        `Error getting default billing address for user ${userId}:`,
        error
      );
      return undefined;
    }
  }

  async getDefaultShippingAddress(
    userId: number
  ): Promise<UserAddress | undefined> {
    try {
      const [address] = await db
        .select()
        .from(userAddresses)
        .where(
          and(
            eq(userAddresses.userId, userId),
            eq(userAddresses.isDefaultShipping, true),
            or(
              eq(userAddresses.addressType, "shipping"),
              eq(userAddresses.addressType, "both")
            )
          )
        );

      return address;
    } catch (error) {
      console.error(
        `Error getting default shipping address for user ${userId}:`,
        error
      );
      return undefined;
    }
  }

  async getProducts(
    category?: string,
    sellerId?: number,
    approved?: boolean
  ): Promise<Product[]> {
    try {
      console.log("Getting products with filters:", {
        category,
        sellerId,
        approved,
      });

      // Use SQL query for more flexibility with filtering
      let query = `
        SELECT * FROM products 
        WHERE 1=1 AND deleted = false
      `;
      const params: any[] = [];

      // Add category filter (case-insensitive)
      if (category) {
        query += ` AND LOWER(category) = LOWER($${params.length + 1})`;
        params.push(category);
      }

      // Add seller filter - NOTE: Use snake_case for database column names
      if (sellerId !== undefined) {
        query += ` AND seller_id = $${params.length + 1}`;
        params.push(sellerId);
      }

      // Add approved filter
      if (approved !== undefined) {
        query += ` AND approved = $${params.length + 1}`;
        params.push(approved);
      }

      console.log("Executing SQL query:", query, "with params:", params);

      // Execute the query
      const { rows } = await pool.query(query, params);
      console.log(`Found ${rows.length} products`);
      return rows;
    } catch (error) {
      console.error("Error in getProducts:", error);
      return [];
    }
  }

  async getProductsCount(
    category?: string,
    sellerId?: number,
    approved?: boolean,
    search?: string,
    hideDrafts?: boolean,
    subcategory?: string,
    hideRejected?: boolean
  ): Promise<number> {
    try {
      // Use SQL query for counting with filters
      let query = `
        SELECT COUNT(*) as count FROM products 
        WHERE 1=1 AND deleted = false
      `;
      const params: any[] = [];

      // Add category filter (case-insensitive)
      if (category) {
        query += ` AND LOWER(category) = LOWER($${params.length + 1})`;
        params.push(category);
      }

      // Add seller filter - NOTE: Use snake_case for database column names
      if (sellerId !== undefined) {
        query += ` AND seller_id = $${params.length + 1}`;
        params.push(sellerId);
      }

      // Add approved filter
      if (approved !== undefined) {
        query += ` AND approved = $${params.length + 1}`;
        params.push(approved);
      }

      // Add isDraft filter - hide draft products for buyers
      if (hideDrafts) {
        query += ` AND (is_draft = false OR is_draft IS NULL)`;
      }

      // Add rejected filter - hide rejected products
      if (hideRejected) {
        query += ` AND rejected = false`;
      }

      // Add subcategory filter
      if (subcategory) {
        // Join with subcategories table to filter by subcategory slug
        query += ` AND products.subcategory_id IN (
          SELECT sc.id FROM subcategories sc 
          WHERE LOWER(sc.slug) = LOWER($${params.length + 1})
        )`;
        params.push(subcategory);
      }

      // Add search filter
      if (search && search.trim() !== "") {
        query += ` AND (
          LOWER(name) LIKE LOWER($${params.length + 1}) OR 
          LOWER(description) LIKE LOWER($${params.length + 1}) OR
          LOWER(category) LIKE LOWER($${params.length + 1}) OR
          LOWER(sku) LIKE LOWER($${params.length + 1})
        )`;
        params.push(`%${search}%`);
      }

      // Execute the query
      const { rows } = await pool.query(query, params);
      return parseInt(rows[0].count || "0");
    } catch (error) {
      console.error("Error in getProductsCount:", error);
      return 0;
    }
  }

  async getProductsPaginated(
    category?: string,
    sellerId?: number,
    approved?: boolean,
    offset: number = 0,
    limit: number = 12,
    search?: string,
    hideDrafts?: boolean,
    subcategory?: string,
    hideRejected?: boolean
  ): Promise<Product[]> {
    try {
      // Use SQL query for pagination with filters and join with users table to get seller names
      // Explicitly map snake_case column names to camelCase for consistency
      let query = `
        SELECT 
          p.id, p.name, p.description, p.specifications, p.sku, p.mrp, p.purchase_price as "purchasePrice", 
          p.price, p.category, p.category_id as "categoryId", p.subcategory_id as "subcategoryId", 
          p.color, p.size, p.image_url as "imageUrl", p.images, p.seller_id as "sellerId", 
          p.stock, p.gst_rate as "gstRate", p.approved, p.rejected, p.deleted, p.is_draft as "isDraft", 
          p.created_at as "createdAt", p.length, p.width, p.height, p.weight,
          u.username as seller_username, u.name as seller_name
        FROM products p
        LEFT JOIN users u ON p.seller_id = u.id
        WHERE 1=1 AND p.deleted = false
      `;
      const params: any[] = [];

      // Add category filter (case-insensitive)
      if (category) {
        query += ` AND LOWER(p.category) = LOWER($${params.length + 1})`;
        params.push(category);
      }

      // Add seller filter - NOTE: Use snake_case for database column names
      if (sellerId !== undefined) {
        query += ` AND p.seller_id = $${params.length + 1}`;
        params.push(sellerId);
      }

      // Add approved filter
      if (approved !== undefined) {
        query += ` AND p.approved = $${params.length + 1}`;
        params.push(approved);
      }

      // Add isDraft filter - hide draft products for buyers
      if (hideDrafts) {
        query += ` AND (p.is_draft = false OR p.is_draft IS NULL)`;
      }

      // Add rejected filter - hide rejected products
      if (hideRejected) {
        query += ` AND p.rejected = false`;
      }

      // Add subcategory filter
      if (subcategory) {
        console.log(`Filtering by subcategory slug: ${subcategory}`);
        // Join with subcategories table to filter by subcategory slug
        query += ` AND p.subcategory_id IN (
          SELECT sc.id FROM subcategories sc 
          WHERE LOWER(sc.slug) = LOWER($${params.length + 1})
        )`;
        params.push(subcategory);

        // Debug: Let's log the matching subcategories
        const debugQuery = `SELECT id, name, slug FROM subcategories WHERE LOWER(slug) = LOWER($1)`;
        try {
          const { rows } = await pool.query(debugQuery, [subcategory]);
          console.log(`Found matching subcategories:`, rows);
        } catch (error) {
          console.error("Error in subcategory debug query:", error);
        }
      }

      // Add search filter
      if (search && search.trim() !== "") {
        query += ` AND (
          LOWER(p.name) LIKE LOWER($${params.length + 1}) OR 
          LOWER(p.description) LIKE LOWER($${params.length + 1}) OR
          LOWER(p.category) LIKE LOWER($${params.length + 1}) OR
          LOWER(p.sku) LIKE LOWER($${params.length + 1})
        )`;
        params.push(`%${search}%`);
      }

      // Add pagination
      query += ` ORDER BY p.id DESC LIMIT $${params.length + 1} OFFSET $${
        params.length + 2
      }`;
      params.push(limit, offset);

      console.log(
        "Executing paginated SQL query:",
        query,
        "with params:",
        params
      );

      // Execute the query
      const { rows } = await pool.query(query, params);
      console.log(`Found ${rows.length} products (paginated)`);
      return rows;
    } catch (error) {
      console.error("Error in getProductsPaginated:", error);
      return [];
    }
  }

  async getAllProducts(filters?: {
    sellerId?: number;
    category?: string;
    approved?: boolean;
  }): Promise<Product[]> {
    try {
      let params: any[] = [];
      let paramIndex = 1;

      // Build query with WHERE clauses for filtering
      let query = `
        SELECT * FROM products 
        WHERE 1=1 AND deleted = false
      `;

      if (filters) {
        if (filters.category) {
          query += ` AND LOWER(category) = LOWER($${paramIndex++})`;
          params.push(filters.category);
        }

        if (filters.sellerId !== undefined) {
          query += ` AND seller_id = $${paramIndex++}`;
          params.push(filters.sellerId);
        }

        if (filters.approved !== undefined) {
          query += ` AND approved = $${paramIndex++}`;
          params.push(filters.approved);
        }
      }

      // Add ORDER BY
      query += ` ORDER BY id DESC`;

      console.log(
        "Executing SQL query for product export:",
        query,
        "with params:",
        params
      );

      // Execute the query
      const { rows } = await pool.query(query, params);
      console.log(`Found ${rows.length} products for export`);
      return rows;
    } catch (error) {
      console.error("Error in getAllProducts:", error);
      return [];
    }
  }

  /**
   * Special method for exporting all products with complete details for admin exports.
   * This method is optimized for exports and includes all necessary product data.
   */
  async getAllProductsForExport(): Promise<Product[]> {
    try {
      // Use a comprehensive SQL query to get all product details with related seller information
      const query = `
        SELECT p.*, u.username as seller_username, u.name as seller_name
        FROM products p
        LEFT JOIN users u ON p.seller_id = u.id
        WHERE p.deleted = false
        ORDER BY p.id DESC
      `;

      // Execute the query without pagination for complete export
      console.log("Executing SQL query to get all products for export");
      const { rows } = await pool.query(query);
      console.log(`Found ${rows.length} products for export`);

      // Return all products
      return rows;
    } catch (error) {
      console.error("Error in getAllProductsForExport:", error);
      return [];
    }
  }

  async getProduct(id: number): Promise<
    | (Product & {
        categoryGstRate?: number | null;
        sellerName?: string;
        sellerUsername?: string;
        subcategory?: string;
      })
    | undefined
  > {
    try {
      // Join with categories to get the category GST rate, users to get seller info, and subcategories to get subcategory name
      // Explicitly select only the columns we know exist to avoid schema errors
      const result = await db
        .select({
          product: {
            id: products.id,
            name: products.name,
            description: products.description,
            specifications: products.specifications,
            sku: products.sku,
            mrp: products.mrp,
            purchasePrice: products.purchasePrice,
            price: products.price,
            category: products.category,
            categoryId: products.categoryId,
            subcategoryId: products.subcategoryId,
            color: products.color,
            size: products.size,
            imageUrl: products.imageUrl,
            images: products.images,
            sellerId: products.sellerId,
            stock: products.stock,
            gstRate: products.gstRate,
            approved: products.approved,
            rejected: products.rejected,
            deleted: products.deleted,
            isDraft: products.isDraft,
            weight: products.weight,
            height: products.height,
            width: products.width,
            length: products.length,
            warranty: products.warranty,
            returnPolicy: products.returnPolicy,
            createdAt: products.createdAt,
          },
          categoryGstRate: categories.gstRate,
          sellerName: users.name,
          sellerUsername: users.username,
          subcategory: subcategories.name,
        })
        .from(products)
        .leftJoin(
          categories,
          eq(sql`LOWER(${products.category})`, sql`LOWER(${categories.name})`)
        )
        .leftJoin(users, eq(products.sellerId, users.id))
        .leftJoin(subcategories, eq(products.subcategoryId, subcategories.id))
        .where(
          and(
            eq(products.id, id),
            eq(products.deleted, false) // Don't allow viewing deleted products
          )
        );

      if (result.length === 0) {
        return undefined;
      }

      console.log(
        `Product GST rate from DB for ID ${id}:`,
        result[0].product.gstRate
      );
      console.log(`Seller info for product ID ${id}:`, {
        sellerName: result[0].sellerName,
        sellerUsername: result[0].sellerUsername,
      });
      console.log(`Full result from DB:`, JSON.stringify(result[0], null, 2));

      // Calculate GST details for the product
      // Note: Prices in DB are GST-inclusive
      const product = result[0].product;
      const gstRate =
        product.gstRate !== null
          ? parseFloat(product.gstRate as unknown as string)
          : 0;
      const priceWithGst = product.price || 0;
      const basePrice =
        gstRate > 0 ? (priceWithGst * 100) / (100 + gstRate) : priceWithGst;
      const gstAmount = priceWithGst - basePrice;

      // Return product with GST details, seller information, and subcategory name
      return {
        ...product,
        categoryGstRate: result[0].categoryGstRate,
        sellerName: result[0].sellerName,
        sellerUsername: result[0].sellerUsername,
        subcategory: result[0].subcategory,
        gstDetails: {
          gstRate,
          basePrice,
          gstAmount,
          priceWithGst,
        },
      };
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      // Fall back to just returning the product with basic seller info but still check for deleted
      try {
        // Still join with users table to get seller information
        // Also explicitly select only columns we know exist in the database
        const result = await db
          .select({
            product: {
              id: products.id,
              name: products.name,
              description: products.description,
              specifications: products.specifications,
              sku: products.sku,
              mrp: products.mrp,
              purchasePrice: products.purchasePrice,
              price: products.price,
              category: products.category,
              categoryId: products.categoryId,
              subcategoryId: products.subcategoryId,
              color: products.color,
              size: products.size,
              imageUrl: products.imageUrl,
              images: products.images,
              sellerId: products.sellerId,
              stock: products.stock,
              gstRate: products.gstRate,
              approved: products.approved,
              rejected: products.rejected,
              deleted: products.deleted,
              isDraft: products.isDraft,
              weight: products.weight,
              height: products.height,
              width: products.width,
              length: products.length,
              warranty: products.warranty,
              returnPolicy: products.returnPolicy,
              createdAt: products.createdAt,
            },
            sellerName: users.name,
            sellerUsername: users.username,
          })
          .from(products)
          .leftJoin(users, eq(products.sellerId, users.id))
          .where(
            and(
              eq(products.id, id),
              eq(products.deleted, false) // Don't allow viewing deleted products
            )
          );

        if (result.length === 0) return undefined;

        return {
          ...result[0].product,
          sellerName: result[0].sellerName,
          sellerUsername: result[0].sellerUsername,
        };
      } catch (fallbackError) {
        console.error(
          `Fallback error for product with ID ${id}:`,
          fallbackError
        );
        // Last resort: just fetch the product without any joins
        // Explicitly select only the columns we know exist to avoid schema errors
        const [product] = await db
          .select({
            id: products.id,
            name: products.name,
            description: products.description,
            specifications: products.specifications,
            sku: products.sku,
            mrp: products.mrp,
            purchasePrice: products.purchasePrice,
            price: products.price,
            category: products.category,
            categoryId: products.categoryId,
            subcategoryId: products.subcategoryId,
            color: products.color,
            size: products.size,
            imageUrl: products.imageUrl,
            images: products.images,
            sellerId: products.sellerId,
            stock: products.stock,
            gstRate: products.gstRate,
            approved: products.approved,
            rejected: products.rejected,
            deleted: products.deleted,
            isDraft: products.isDraft,
            weight: products.weight,
            height: products.height,
            width: products.width,
            length: products.length,
            warranty: products.warranty,
            returnPolicy: products.returnPolicy,
            createdAt: products.createdAt,
          })
          .from(products)
          .where(
            and(
              eq(products.id, id),
              eq(products.deleted, false) // Don't allow viewing deleted products
            )
          );
        return product;
      }
    }
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    // Ensure image_url is never null to satisfy database constraint
    const DEFAULT_IMAGE_URL =
      "https://via.placeholder.com/400x400?text=Product+Image";

    // Debug the incoming data to see what fields are present
    console.log(
      "Creating product - input data keys:",
      Object.keys(insertProduct)
    );

    // Validate essential fields
    if (!insertProduct.seller_id && !insertProduct.sellerId) {
      console.error("Missing seller_id in product creation:", insertProduct);
      throw new Error("seller_id or sellerId is required for product creation");
    }

    // Ensure both camelCase and snake_case versions of sellerId are set
    if (insertProduct.seller_id && !insertProduct.sellerId) {
      insertProduct.sellerId = insertProduct.seller_id;
    } else if (insertProduct.sellerId && !insertProduct.seller_id) {
      insertProduct.seller_id = insertProduct.sellerId;
    }

    // Handle potential field name mismatch (image_url vs imageUrl)
    // We need to make sure we're setting the field correctly regardless of the naming
    let productToInsert: any = {
      ...insertProduct,
      approved: insertProduct.approved ?? false, // Default to requiring approval
    };

    // Ensure imageUrl field is set (this is what the schema expects)
    if (!productToInsert.imageUrl && productToInsert.image_url) {
      productToInsert.imageUrl = productToInsert.image_url;
    } else if (!productToInsert.imageUrl) {
      productToInsert.imageUrl = DEFAULT_IMAGE_URL;
    }

    // If we're still getting a null image_url in the database, let's make sure both properties are set
    if (!productToInsert.image_url) {
      productToInsert.image_url = productToInsert.imageUrl || DEFAULT_IMAGE_URL;
    }

    // Handle purchase_price field to ensure it's properly saved
    if (
      insertProduct.purchasePrice !== undefined &&
      !insertProduct.purchase_price
    ) {
      productToInsert.purchase_price = insertProduct.purchasePrice;
      console.log(
        "Setting purchase_price from purchasePrice:",
        productToInsert.purchase_price
      );
    } else if (
      insertProduct.purchase_price !== undefined &&
      !insertProduct.purchasePrice
    ) {
      productToInsert.purchasePrice = insertProduct.purchase_price;
      console.log(
        "Setting purchasePrice from purchase_price:",
        productToInsert.purchasePrice
      );
    }

    // Handle gst_rate field to ensure it's properly saved
    if (insertProduct.gstRate !== undefined && !insertProduct.gst_rate) {
      productToInsert.gst_rate = insertProduct.gstRate;
      console.log("Setting gst_rate from gstRate:", productToInsert.gst_rate);
    } else if (insertProduct.gst_rate !== undefined && !insertProduct.gstRate) {
      productToInsert.gstRate = insertProduct.gst_rate;
      console.log("Setting gstRate from gst_rate:", productToInsert.gstRate);
    }

    console.log("Creating product with final data:", {
      imageUrl: productToInsert.imageUrl,
      image_url: productToInsert.image_url,
      purchase_price: productToInsert.purchase_price,
      purchasePrice: productToInsert.purchasePrice,
      gst_rate: productToInsert.gst_rate,
      gstRate: productToInsert.gstRate,
    });

    try {
      const [product] = await db
        .insert(products)
        .values(productToInsert)
        .returning();

      return product;
    } catch (error) {
      console.error("Error in createProduct:", error);
      console.error("Problem data:", JSON.stringify(productToInsert, null, 2));
      throw error;
    }
  }

  async updateProduct(
    id: number,
    productData: Partial<Product>
  ): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();

    if (!updatedProduct) {
      throw new Error(`Product with ID ${id} not found`);
    }

    return updatedProduct;
  }

  // Get products that are pending approval (where approved=false and rejected=false) with pagination
  async getPendingProducts(
    page: number = 1,
    limit: number = 10,
    search?: string,
    category?: string
  ): Promise<{ products: any[]; total: number }> {
    try {
      console.log(
        `Getting pending products with filters: page=${page}, limit=${limit}, search=${
          search || "none"
        }, category=${category || "none"}`
      );

      // Build search conditions
      const conditions = [
        eq(products.approved, false),
        eq(products.rejected, false),
        // Add condition to filter out deleted products
        eq(products.deleted, false),
      ];

      // Add category filter if provided
      if (category) {
        conditions.push(ilike(products.category, `%${category}%`));
      }

      // Add search filter if provided
      if (search) {
        conditions.push(
          or(
            ilike(products.name, `%${search}%`),
            ilike(products.description, `%${search}%`),
            ilike(products.sku, `%${search}%`)
          )
        );
      }

      // First get the total count with filters applied
      // Use simple SQL to avoid schema mismatch issues
      const countQuery = `
        SELECT COUNT(*) as count
        FROM products p
        WHERE p.approved = false AND p.rejected = false AND p.deleted = false
        ${category ? `AND LOWER(p.category) LIKE LOWER('%${category}%')` : ""}
        ${
          search
            ? `AND (LOWER(p.name) LIKE LOWER('%${search}%') OR 
                         LOWER(p.description) LIKE LOWER('%${search}%') OR 
                         LOWER(p.sku) LIKE LOWER('%${search}%'))`
            : ""
        }
      `;

      console.log("Executing pending product count query:", countQuery);
      const { rows: countResult } = await pool.query(countQuery);
      const total = Number(countResult[0].count);

      // Calculate offset
      const offset = (page - 1) * limit;

      // Join with users table to get seller information - select only columns that exist
      // Using SQL query to avoid issues with columns that may not exist
      const query = `
        SELECT p.id, p.name, p.description, p.specifications, p.sku, p.mrp, 
               p.purchase_price, p.price, p.category, p.category_id, p.subcategory_id,
               p.color, p.size, p.image_url, p.images, p.seller_id, p.stock, 
               p.gst_rate, p.approved, p.rejected, p.deleted, p.is_draft, p.created_at,
               u.id as seller_id, u.username as seller_username, u.email as seller_email, 
               u.role as seller_role
        FROM products p
        LEFT JOIN users u ON p.seller_id = u.id
        WHERE p.approved = false AND p.rejected = false AND p.deleted = false
        ${category ? `AND LOWER(p.category) LIKE LOWER('%${category}%')` : ""}
        ${
          search
            ? `AND (LOWER(p.name) LIKE LOWER('%${search}%') OR 
                         LOWER(p.description) LIKE LOWER('%${search}%') OR 
                         LOWER(p.sku) LIKE LOWER('%${search}%'))`
            : ""
        }
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      console.log("Executing pending products query:", query);
      const { rows: result } = await pool.query(query);

      console.log(
        `Found ${result.length} pending products (page ${page}/${
          Math.ceil(total / limit) || 1
        })`
      );
      return {
        products: result,
        total,
      };
    } catch (error) {
      console.error("Error in getPendingProducts:", error);
      return {
        products: [],
        total: 0,
      };
    }
  }

  // Approve a product
  async approveProduct(id: number): Promise<Product> {
    // Validate ID first
    if (
      typeof id !== "number" ||
      isNaN(id) ||
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new Error(`Invalid product ID: ${id}`);
    }

    try {
      // First check if the product exists and is not deleted
      const [product] = await db
        .select()
        .from(products)
        .where(and(eq(products.id, id), eq(products.deleted, false)));

      if (!product) {
        throw new Error(`Product with ID ${id} not found or has been deleted`);
      }

      // Now update the product to approved state
      const [updatedProduct] = await db
        .update(products)
        .set({ approved: true })
        .where(and(eq(products.id, id), eq(products.deleted, false)))
        .returning();

      if (!updatedProduct) {
        throw new Error(`Product with ID ${id} not found or has been deleted`);
      }

      return updatedProduct;
    } catch (error) {
      console.error(`Error approving product ${id}:`, error);
      throw error;
    }
  }

  // Reject a product (marking it as rejected)
  async rejectProduct(id: number): Promise<Product> {
    // Validate ID first
    if (
      typeof id !== "number" ||
      isNaN(id) ||
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new Error(`Invalid product ID: ${id}`);
    }

    try {
      // First check if the product exists and is not deleted
      const [product] = await db
        .select()
        .from(products)
        .where(and(eq(products.id, id), eq(products.deleted, false)));

      if (!product) {
        throw new Error(`Product with ID ${id} not found or has been deleted`);
      }

      // Mark as not approved and explicitly rejected
      const [updatedProduct] = await db
        .update(products)
        .set({
          approved: false,
          rejected: true, // Set the rejected flag
        })
        .where(and(eq(products.id, id), eq(products.deleted, false)))
        .returning();

      if (!updatedProduct) {
        throw new Error(`Product with ID ${id} not found or has been deleted`);
      }

      return updatedProduct;
    } catch (error) {
      console.error(`Error rejecting product ${id}:`, error);
      throw error;
    }
  }

  async assignProductSeller(
    productId: number,
    sellerId: number
  ): Promise<Product> {
    try {
      console.log(`Assigning product ${productId} to seller ${sellerId}`);

      // Verify that the product exists
      const product = await this.getProduct(productId);
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      // Verify that the seller exists and is approved
      const seller = await this.getUser(sellerId);
      if (!seller) {
        throw new Error(`Seller with ID ${sellerId} not found`);
      }
      if (seller.role !== "seller" || !seller.approved) {
        throw new Error(`User with ID ${sellerId} is not an approved seller`);
      }

      // Update the product's seller ID
      const [updatedProduct] = await db
        .update(products)
        .set({
          sellerId: sellerId,
        })
        .where(eq(products.id, productId))
        .returning();

      if (!updatedProduct) {
        throw new Error(`Failed to update product ${productId}`);
      }

      console.log(
        `Successfully assigned product ${productId} to seller ${sellerId}`
      );
      return updatedProduct;
    } catch (error) {
      console.error(
        `Error assigning product ${productId} to seller ${sellerId}:`,
        error
      );
      throw error;
    }
  }

  async searchProducts(
    query: string,
    limit: number = 10,
    userRole: string = "buyer"
  ): Promise<Product[]> {
    try {
      console.log(
        "Searching products with query:",
        query,
        "for user role:",
        userRole
      );

      // Clean and prepare the search query
      const cleanedQuery = query.trim().replace(/[^\w\s]/gi, "");

      if (!cleanedQuery) {
        console.log("Empty cleaned query, returning empty results");
        return [];
      }

      // Create a tsquery compatible string with prefix matching
      const searchTerms = cleanedQuery
        .split(/\s+/)
        .filter((term) => term.length > 0);

      if (searchTerms.length === 0) {
        console.log("No valid search terms, returning empty results");
        return [];
      }

      // Create the tsquery string with exact matching and prefix matching for better results
      // For a multi-word query like "test product", we want to ensure:
      // 1. The exact phrase "test product" gets priority
      // 2. Words like "test" and "product" are also matched individually

      // For single words, use prefix matching
      let tsQueryString;
      if (searchTerms.length === 1) {
        // Single term - use prefix matching
        tsQueryString = `${searchTerms[0]}:*`;
      } else {
        // Multiple terms - create a combination of exact phrase and individual terms
        const exactPhrase = searchTerms.join(" & "); // AND operator for exact phrase match
        const individualTerms = searchTerms
          .map((term) => `${term}:*`)
          .join(" | "); // OR operator for individual terms
        tsQueryString = `(${exactPhrase}) | (${individualTerms})`; // Combine both approaches
      }

      console.log("TS Query string:", tsQueryString);

      // Add approval filter for regular buyers
      const approvalFilter =
        userRole === "buyer"
          ? ` AND p.approved = true AND (p.is_draft IS NULL OR p.is_draft = false)`
          : "";

      // Simplified query that doesn't rely on column aliases in ORDER BY
      const finalQuery = `
        WITH ranked_products AS (
          SELECT 
            p.*,
            ts_rank(
              setweight(to_tsvector('english', coalesce(p.name, '')), 'A') ||
              setweight(to_tsvector('english', coalesce(p.category, '')), 'B') ||
              setweight(to_tsvector('english', coalesce(p.description, '')), 'C'),
              to_tsquery('english', $1)
            ) AS search_rank,
            CASE 
              -- Exact word match with word boundaries (highest priority)
              WHEN p.name ~* ('^' || $4 || '$') THEN 10.0 -- Exact word match in name
              WHEN p.name ~* ('\\y' || $4 || '\\y') THEN 8.0 -- Word boundary match in name
              WHEN p.category ~* ('\\y' || $4 || '\\y') THEN 6.0 -- Word boundary match in category
              -- Generic ILIKE matches (lower priority)
              WHEN p.name ILIKE $2 THEN 3.0
              WHEN p.category ILIKE $2 THEN 2.0
              WHEN p.name ILIKE $3 THEN 1.5
              WHEN p.description ILIKE $3 THEN 1.0
              ELSE 0
            END AS exact_match_rank
          FROM products p
          WHERE 
            p.deleted = false AND (
              (
                to_tsvector('english', coalesce(p.name, '')) ||
                to_tsvector('english', coalesce(p.category, '')) ||
                to_tsvector('english', coalesce(p.description, ''))
              ) @@ to_tsquery('english', $1)
              OR p.name ILIKE $3
              OR p.category ILIKE $2
              OR p.description ILIKE $3
            )
            ${approvalFilter}
        )
        SELECT * FROM ranked_products
        ORDER BY (search_rank + exact_match_rank) DESC, id DESC
        LIMIT $5
      `;

      // Parameters for the search query - Use word boundaries for exact matches
      const params = [
        tsQueryString, // $1 - TS query for full-text search
        `% ${query} %`, // $2 - Exact word match - note the spaces around the query
        `%${query}%`, // $3 - Partial match for fallback scenario
        query, // $4 - Cleaned search term for regex word boundary matching
        limit, // $5 - Result limit
      ];

      // Log the exact search parameters to help debug
      console.log(
        "SEARCH DEBUG - EXACT MATCHING: Using the following parameters:"
      );
      console.log("- Original query:", query);
      console.log("- TS Query:", tsQueryString);
      console.log("- Exact match pattern:", `% ${query} %`);
      console.log("- Partial match pattern:", `%${query}%`);

      console.log("Executing advanced search query with params:", params);

      // Execute the query
      const { rows } = await pool.query(finalQuery, params);
      console.log(`Found ${rows.length} products in advanced search`);

      return rows;
    } catch (error) {
      console.error("Error in searchProducts:", error);
      return [];
    }
  }

  async deleteProduct(id: number): Promise<void> {
    console.log(`[DEBUG] Starting to delete product ID ${id}`);
    try {
      // Check if product exists and is not already deleted
      const product = await this.getProduct(id);
      console.log(`[DEBUG] Product check:`, product ? "Found" : "Not found");

      if (!product) {
        throw new Error(`Product with ID ${id} not found`);
      }

      // Check if product is in an order - if so, use soft delete
      console.log(`[DEBUG] Checking if product ${id} is in any orders`);
      const orderItemsForProduct = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.productId, id));

      console.log(
        `[DEBUG] Order items for product ${id}:`,
        orderItemsForProduct.length
      );

      // Check if product is in any carts - we need to remove these references first
      console.log(`[DEBUG] Checking if product ${id} is in any carts`);
      const cartItemsForProduct = await db
        .select()
        .from(carts)
        .where(eq(carts.productId, id));

      console.log(
        `[DEBUG] Cart items for product ${id}:`,
        cartItemsForProduct.length
      );

      // If product is in orders or has related records, use soft delete
      if (orderItemsForProduct.length > 0) {
        console.log(`[DEBUG] Product ${id} is in orders, doing soft delete`);
        // Soft delete - mark as deleted
        const result = await db
          .update(products)
          .set({ deleted: true })
          .where(eq(products.id, id));

        console.log(`[DEBUG] Soft delete result:`, result);

        if (!result) {
          throw new Error(`Failed to soft delete product with ID ${id}`);
        }
      } else {
        console.log(
          `[DEBUG] Product ${id} has no orders, proceeding with deletion`
        );

        // First delete any cart items referencing this product
        if (cartItemsForProduct.length > 0) {
          console.log(
            `[DEBUG] Removing ${cartItemsForProduct.length} cart items for product ${id}`
          );
          try {
            await db.delete(carts).where(eq(carts.productId, id));
            console.log(
              `[DEBUG] Successfully removed cart items for product ${id}`
            );
          } catch (cartError) {
            console.error(
              `[DEBUG] Error removing cart items for product ${id}:`,
              cartError
            );
            throw new Error(
              `Failed to remove cart items: ${cartError.message}`
            );
          }
        }

        // Next delete any product variants
        try {
          console.log(`[DEBUG] Deleting variants for product ${id}`);
          await db
            .delete(productVariants)
            .where(eq(productVariants.productId, id));
          console.log(
            `[DEBUG] Successfully deleted variants for product ${id}`
          );
        } catch (variantError) {
          console.error(
            `[DEBUG] Error deleting variants for product ${id}:`,
            variantError
          );
          throw new Error(
            `Failed to delete product variants: ${variantError.message}`
          );
        }

        // Check for any other tables that might reference this product
        // For example, product_relationships, wishlists, etc.
        console.log(`[DEBUG] Checking for product in wishlists`);
        try {
          // If wishlist table exists, remove references
          await db.delete(wishlists).where(eq(wishlists.productId, id));
          console.log(
            `[DEBUG] Successfully removed wishlist items for product ${id}`
          );
        } catch (wishlistError) {
          // This might fail if wishlist table doesn't exist, which is fine
          console.log(`[DEBUG] No wishlist items found or table doesn't exist`);
        }

        // Finally delete the product
        try {
          console.log(`[DEBUG] Deleting product ${id}`);
          const result = await db.delete(products).where(eq(products.id, id));
          console.log(`[DEBUG] Product deletion result:`, result);

          if (!result) {
            throw new Error(`Product with ID ${id} not found`);
          }
          console.log(`[DEBUG] Successfully deleted product ${id}`);
        } catch (prodError) {
          console.error(`[DEBUG] Error deleting product ${id}:`, prodError);
          throw new Error(`Failed to delete product: ${prodError.message}`);
        }
      }
    } catch (error) {
      console.error(`[DEBUG] Error in deleteProduct for ${id}:`, error);
      throw error;
    }
  }

  // PRODUCT VARIANTS

  async getProductById(
    id: number,
    includeVariants: boolean = false
  ): Promise<(Product & { variants?: ProductVariant[] }) | undefined> {
    try {
      // First get the basic product information
      const product = await this.getProduct(id);

      if (!product) {
        return undefined;
      }

      // If variants are requested, fetch them and include them in the result
      if (includeVariants) {
        console.log(`DEBUG: Looking for variants for product ID ${id}`);
        const variants = await this.getProductVariants(id);
        console.log(
          `DEBUG: Found ${variants.length} variants for product ${id}:`,
          variants
        );

        return {
          ...product,
          variants,
        };
      }

      return product;
    } catch (error) {
      console.error("Error in getProductById:", error);
      return undefined;
    }
  }

  async getProductVariants(productId: number): Promise<ProductVariant[]> {
    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));

    // Process variant images to parse JSON strings into arrays
    return variants.map((variant) => {
      // Make a copy of the variant to avoid modifying the original
      const processedVariant = { ...variant };

      // Process the images field if it exists
      if (variant.images) {
        try {
          // If images is a string that looks like a JSON array, parse it
          if (
            typeof variant.images === "string" &&
            variant.images.trim().startsWith("[")
          ) {
            console.log(
              `Parsing variant ${variant.id} images from JSON string:`,
              variant.images
            );
            const parsedImages = JSON.parse(variant.images);
            // Ensure it's an array after parsing
            processedVariant.images = Array.isArray(parsedImages)
              ? parsedImages
              : [];
            console.log(
              `Successfully parsed ${processedVariant.images.length} images for variant ${variant.id}`
            );
          }
        } catch (error) {
          console.error(
            `Error parsing images for variant ${variant.id}:`,
            error
          );
          processedVariant.images = [];
        }
      } else {
        processedVariant.images = [];
      }

      return processedVariant;
    });
  }

  async getProductVariant(id: number): Promise<ProductVariant | undefined> {
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, id));

    if (!variant) return undefined;

    // Process variant images to parse JSON strings into arrays
    const processedVariant = { ...variant };

    // Process the images field if it exists
    if (variant.images) {
      try {
        // If images is a string that looks like a JSON array, parse it
        if (
          typeof variant.images === "string" &&
          variant.images.trim().startsWith("[")
        ) {
          console.log(
            `Parsing single variant ${variant.id} images from JSON string:`,
            variant.images
          );
          const parsedImages = JSON.parse(variant.images);
          // Ensure it's an array after parsing
          processedVariant.images = Array.isArray(parsedImages)
            ? parsedImages
            : [];
          console.log(
            `Successfully parsed ${processedVariant.images.length} images for single variant ${variant.id}`
          );
        }
      } catch (error) {
        console.error(
          `Error parsing images for single variant ${variant.id}:`,
          error
        );
        processedVariant.images = [];
      }
    } else {
      processedVariant.images = [];
    }

    return processedVariant;
  }

  async createProductVariant(
    variant: InsertProductVariant
  ): Promise<ProductVariant> {
    const [newVariant] = await db
      .insert(productVariants)
      .values(variant)
      .returning();
    return newVariant;
  }

  async updateProductVariant(
    id: number,
    variant: Partial<ProductVariant>
  ): Promise<ProductVariant> {
    console.log(
      `Starting updateProductVariant for ID ${id}`,
      JSON.stringify(variant, null, 2)
    );

    // Special handling for images field
    let processedVariant = { ...variant };

    // Make sure images is stored as a proper JSON string
    if (processedVariant.images !== undefined) {
      console.log(
        `Processing images for variant ${id}, type:`,
        typeof processedVariant.images
      );

      if (Array.isArray(processedVariant.images)) {
        // If it's an array, convert to JSON string
        console.log(
          `Variant ${id} has images as array with ${processedVariant.images.length} items:`,
          JSON.stringify(processedVariant.images)
        );
        processedVariant.images = JSON.stringify(processedVariant.images);
      } else if (typeof processedVariant.images === "string") {
        // If it's a string, check if it's a single URL or JSON
        if (
          !processedVariant.images.trim().startsWith("[") &&
          !processedVariant.images.trim().startsWith('"')
        ) {
          // Single URL case - wrap in array
          console.log(
            `Variant ${id} has single image URL string, converting to JSON array:`,
            processedVariant.images
          );
          processedVariant.images = JSON.stringify([processedVariant.images]);
        } else if (processedVariant.images.trim().startsWith("[")) {
          try {
            // JSON array case - validate and normalize
            const parsed = JSON.parse(processedVariant.images);
            if (Array.isArray(parsed)) {
              console.log(
                `Variant ${id} images JSON string valid with ${parsed.length} images:`,
                JSON.stringify(parsed)
              );
              processedVariant.images = JSON.stringify(parsed);
            } else {
              console.log(
                `Variant ${id} images JSON parsed but not an array, resetting to empty array`
              );
              processedVariant.images = JSON.stringify([]);
            }
          } catch (e) {
            console.log(
              `Variant ${id} had invalid JSON string for images, resetting to empty array`
            );
            processedVariant.images = JSON.stringify([]);
          }
        }
      } else {
        // Default case for undefined or null
        console.log(`Variant ${id} has no valid images, using empty array`);
        processedVariant.images = JSON.stringify([]);
      }
    }

    console.log(
      `Final processed variant data for ${id}:`,
      JSON.stringify(processedVariant, null, 2)
    );
    console.log(`Images field for variant ${id}:`, processedVariant.images);

    // Update the variant in the database
    const [updatedVariant] = await db
      .update(productVariants)
      .set(processedVariant)
      .where(eq(productVariants.id, id))
      .returning();

    if (!updatedVariant) {
      throw new Error(`Variant with ID ${id} not found`);
    }

    // Process the images field in the response
    if (updatedVariant.images) {
      try {
        const parsedImages = JSON.parse(updatedVariant.images);
        updatedVariant.images = Array.isArray(parsedImages) ? parsedImages : [];
      } catch (error) {
        console.error(`Error parsing images for updated variant ${id}:`, error);
        updatedVariant.images = [];
      }
    } else {
      updatedVariant.images = [];
    }

    return updatedVariant;
  }

  async deleteProductVariant(id: number): Promise<void> {
    await db.delete(productVariants).where(eq(productVariants.id, id));
  }

  async createProductVariantsBulk(
    variants: InsertProductVariant[]
  ): Promise<ProductVariant[]> {
    if (variants.length === 0) return [];

    console.log(`Creating ${variants.length} variants in bulk`);

    try {
      // Make sure all variants have a productId
      const validVariants = variants.filter(
        (v) => v.productId !== undefined && v.productId !== null
      );

      if (validVariants.length === 0) {
        console.error(
          "No valid variants to insert - all were missing productId"
        );
        return [];
      }

      console.log(`Valid variants to insert: ${validVariants.length}`);

      // Insert all variants at once and return them
      const createdVariants = await db
        .insert(productVariants)
        .values(validVariants)
        .returning();

      console.log(`Successfully inserted ${createdVariants.length} variants`);

      return createdVariants;
    } catch (error) {
      console.error("Error in bulk variant creation:", error);
      throw error;
    }
  }

  async updateProductStock(productId: number, newStock: number): Promise<void> {
    try {
      console.log(`Updating stock for product ${productId} to ${newStock}`);

      await db
        .update(products)
        .set({ stock: newStock })
        .where(eq(products.id, productId));

      console.log(
        `Successfully updated stock for product ${productId} to ${newStock}`
      );
    } catch (error) {
      console.error(`Error updating stock for product ${productId}:`, error);
      throw error;
    }
  }

  async updateProductVariantStock(
    variantId: number,
    newStock: number
  ): Promise<void> {
    try {
      console.log(`Updating stock for variant ${variantId} to ${newStock}`);

      await db
        .update(productVariants)
        .set({ stock: newStock })
        .where(eq(productVariants.id, variantId));

      console.log(
        `Successfully updated stock for variant ${variantId} to ${newStock}`
      );
    } catch (error) {
      console.error(`Error updating stock for variant ${variantId}:`, error);
      throw error;
    }
  }

  async getCartItems(userId: number): Promise<
    {
      id: number;
      quantity: number;
      product: Product;
      userId: number;
      variant?: ProductVariant;
    }[]
  > {
    try {
      console.log(`Getting cart items for user ID: ${userId}`);

      // First, get cart items with products but without variants
      const cartWithProducts = await db
        .select({
          id: carts.id,
          quantity: carts.quantity,
          userId: carts.userId,
          variantId: carts.variantId,
          product: products,
        })
        .from(carts)
        .where(eq(carts.userId, userId))
        .innerJoin(products, eq(carts.productId, products.id));

      console.log(`Found ${cartWithProducts.length} items in cart`);

      // Return early if no cart items
      if (cartWithProducts.length === 0) {
        return [];
      }

      // For each cart item with a variant ID, get the variant info separately
      const result = await Promise.all(
        cartWithProducts.map(async (item) => {
          const mappedItem = {
            id: item.id,
            quantity: item.quantity,
            userId: item.userId,
            product: item.product,
          };

          // If cart item has a variant ID, fetch the variant
          if (item.variantId) {
            try {
              const [variant] = await db
                .select()
                .from(productVariants)
                .where(eq(productVariants.id, item.variantId));

              if (variant) {
                return { ...mappedItem, variant };
              }
            } catch (variantError) {
              console.error(
                `Error fetching variant ${item.variantId}:`,
                variantError
              );
            }
          }

          return mappedItem;
        })
      );

      return result;
    } catch (error) {
      console.error("Error in getCartItems:", error);
      throw error;
    }
  }

  async getCartItem(id: number): Promise<Cart | undefined> {
    const [cartItem] = await db.select().from(carts).where(eq(carts.id, id));
    return cartItem;
  }

  async addToCart(insertCart: InsertCart): Promise<Cart> {
    try {
      // Validate productId is a valid number
      if (
        !insertCart.productId ||
        typeof insertCart.productId !== "number" ||
        isNaN(insertCart.productId)
      ) {
        console.error(`Invalid product ID: ${insertCart.productId}`);
        throw new Error(`Invalid product ID: ${insertCart.productId}`);
      }

      // First verify that the product exists and is not deleted
      console.log(
        `Verifying product ${insertCart.productId} exists before adding to cart`
      );
      const [productExists] = await db
        .select({ id: products.id })
        .from(products)
        .where(
          and(
            eq(products.id, insertCart.productId),
            eq(products.deleted, false) // Don't allow adding deleted products
          )
        );

      if (!productExists) {
        console.error(
          `Product with ID ${insertCart.productId} does not exist or is deleted`
        );

        // Check if the user might be trying to add a variant ID as a product ID
        const [variantAsProduct] = await db
          .select({
            id: productVariants.id,
            productId: productVariants.productId,
          })
          .from(productVariants)
          .where(eq(productVariants.id, insertCart.productId));

        if (variantAsProduct) {
          console.warn(
            `ID ${insertCart.productId} matches a variant ID, not a product ID. Will use the parent product ID ${variantAsProduct.productId} instead.`
          );

          // Update product ID to use the variant's parent product
          insertCart.productId = variantAsProduct.productId;
          insertCart.variantId = variantAsProduct.id;

          // Verify the corrected product ID exists and is not deleted
          const [correctedProductExists] = await db
            .select({ id: products.id })
            .from(products)
            .where(
              and(
                eq(products.id, insertCart.productId),
                eq(products.deleted, false)
              )
            );

          if (!correctedProductExists) {
            throw new Error(
              `Product with ID ${insertCart.productId} does not exist or is no longer available`
            );
          }

          // If we got here, we've successfully fixed the product ID/variant ID confusion
          console.log(
            `Successfully corrected product/variant confusion. Using product ${insertCart.productId} with variant ${insertCart.variantId}`
          );
        } else {
          // Original product doesn't exist and it's not a variant ID either
          throw new Error(
            `Product with ID ${insertCart.productId} does not exist or is no longer available`
          );
        }
      }

      // Validate quantity is positive
      if (!insertCart.quantity || insertCart.quantity <= 0) {
        console.error(`Invalid quantity: ${insertCart.quantity}`);
        throw new Error(`Quantity must be greater than 0`);
      }

      // Check if variant exists if a variantId is provided
      if (insertCart.variantId) {
        console.log(
          `Checking if variant ${insertCart.variantId} exists for product ${insertCart.productId}`
        );

        // Try a simpler query first: just check if the variant ID exists, without checking the product ID
        // This helps isolate whether the issue is with the join condition or the variant existence
        const [variantExists] = await db
          .select({ id: productVariants.id })
          .from(productVariants)
          .where(eq(productVariants.id, insertCart.variantId));

        if (!variantExists) {
          console.error(
            `Variant with ID ${insertCart.variantId} does not exist`
          );
          throw new Error(
            `Variant with ID ${insertCart.variantId} does not exist or is no longer available`
          );
        }

        // Now verify that this variant belongs to the correct product
        const [variantMatchesProduct] = await db
          .select({ id: productVariants.id })
          .from(productVariants)
          .where(
            and(
              eq(productVariants.id, insertCart.variantId),
              eq(productVariants.productId, insertCart.productId)
            )
          );

        if (!variantMatchesProduct) {
          console.error(
            `Variant with ID ${insertCart.variantId} exists but doesn't belong to product ${insertCart.productId}`
          );
          console.log(
            `Continuing anyway as variant ${insertCart.variantId} exists in the system`
          );
          // We don't throw an error here since the variant exists, which means it's a valid cart item
          // This makes the system more resilient to product/variant mismatches
        }
      }

      // Then check if product with the same variant already exists in cart
      console.log(
        `Checking if product ${insertCart.productId} with variant ${
          insertCart.variantId || "none"
        } exists in cart for user ${insertCart.userId}`
      );

      const whereConditions = insertCart.variantId
        ? // If variant provided, match both product and variant
          and(
            eq(carts.userId, insertCart.userId),
            eq(carts.productId, insertCart.productId),
            eq(carts.variantId, insertCart.variantId)
          )
        : // If no variant, make sure no variant matches either
          and(
            eq(carts.userId, insertCart.userId),
            eq(carts.productId, insertCart.productId),
            isNull(carts.variantId)
          );

      const [existingCartItem] = await db
        .select()
        .from(carts)
        .where(whereConditions);

      // If exists, update quantity
      if (existingCartItem) {
        console.log(
          `Found existing cart item: ${JSON.stringify(existingCartItem)}`
        );
        console.log(
          `Updating quantity from ${existingCartItem.quantity} to ${
            existingCartItem.quantity + insertCart.quantity
          }`
        );

        const [updatedCartItem] = await db
          .update(carts)
          .set({
            quantity: existingCartItem.quantity + insertCart.quantity,
          })
          .where(eq(carts.id, existingCartItem.id))
          .returning();

        console.log(`Updated cart item: ${JSON.stringify(updatedCartItem)}`);
        return updatedCartItem;
      }

      // Otherwise insert new cart item
      console.log(`No existing cart item found, creating new one`);
      const [cartItem] = await db.insert(carts).values(insertCart).returning();

      console.log(`Created new cart item: ${JSON.stringify(cartItem)}`);
      return cartItem;
    } catch (error) {
      console.error(`Error adding to cart:`, error);
      throw error;
    }
  }

  async updateCartItem(id: number, quantity: number): Promise<Cart> {
    try {
      // Validate quantity is positive
      if (
        !quantity ||
        typeof quantity !== "number" ||
        isNaN(quantity) ||
        quantity <= 0
      ) {
        console.error(`Invalid quantity: ${quantity}`);
        throw new Error(`Quantity must be greater than 0`);
      }

      // First check if cart item exists
      const [cartItem] = await db.select().from(carts).where(eq(carts.id, id));

      if (!cartItem) {
        console.error(`Cart item with ID ${id} not found`);
        throw new Error(`Cart item with ID ${id} not found`);
      }

      // Now verify that the product still exists and is not deleted
      const [productExists] = await db
        .select({ id: products.id })
        .from(products)
        .where(
          and(eq(products.id, cartItem.productId), eq(products.deleted, false))
        );

      if (!productExists) {
        console.error(
          `Product associated with cart item ${id} no longer exists or is deleted`
        );
        throw new Error(
          `Product associated with this cart item no longer exists`
        );
      }

      // Update the cart item
      console.log(`Updating cart item ${id} with new quantity: ${quantity}`);
      const [updatedCartItem] = await db
        .update(carts)
        .set({ quantity })
        .where(eq(carts.id, id))
        .returning();

      console.log(`Updated cart item: ${JSON.stringify(updatedCartItem)}`);
      return updatedCartItem;
    } catch (error) {
      console.error(`Error updating cart item:`, error);
      throw error;
    }
  }

  async removeFromCart(id: number): Promise<void> {
    try {
      console.log(`Removing cart item with ID: ${id}`);
      await db.delete(carts).where(eq(carts.id, id));
      console.log(`Successfully removed cart item ${id}`);
    } catch (error) {
      console.error(`Error removing cart item ${id}:`, error);
      throw error;
    }
  }

  async clearCart(userId: number): Promise<void> {
    try {
      console.log(`Clearing all cart items for user ID: ${userId}`);
      await db.delete(carts).where(eq(carts.userId, userId));
      console.log(`Successfully cleared cart for user ${userId}`);
    } catch (error) {
      console.error(`Error clearing cart for user ${userId}:`, error);
      throw error;
    }
  }

  async getOrders(userId?: number, sellerId?: number): Promise<Order[]> {
    let orderResults: Order[];

    if (userId) {
      orderResults = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId));
    } else if (sellerId) {
      // This is more complex as we need to join with orderItems and products
      const sellerOrders = await db
        .select({ order: orders })
        .from(orders)
        .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(products.sellerId, sellerId))
        .groupBy(orders.id);

      orderResults = sellerOrders.map((item) => item.order);
    } else {
      orderResults = await db.select().from(orders);
    }

    // Parse shipping details for each order
    return orderResults.map((order) => {
      if (order.shippingDetails && typeof order.shippingDetails === "string") {
        try {
          order.shippingDetails = JSON.parse(order.shippingDetails);
        } catch (error) {
          console.error("Error parsing shippingDetails:", error);
        }
      }
      return order;
    });
  }

  async getOrder(id: number | string): Promise<Order | undefined> {
    // Handle case where id is a string with 'ORD-' prefix
    let numericId: number;
    if (typeof id === "string") {
      if (id.includes("ORD-")) {
        numericId = parseInt(id.replace("ORD-", ""));
      } else {
        numericId = parseInt(id);
      }

      if (isNaN(numericId)) {
        console.error(`Invalid order ID format: ${id}`);
        return undefined;
      }
    } else {
      numericId = id;
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, numericId));

    if (!order) return undefined;

    // Parse shippingDetails from string to object if it exists
    if (order.shippingDetails && typeof order.shippingDetails === "string") {
      try {
        order.shippingDetails = JSON.parse(order.shippingDetails);
      } catch (error) {
        console.error("Error parsing shippingDetails:", error);
      }
    }

    return order;
  }

  /**
   * Get the most recent order in the system
   * @returns The latest order or undefined if no orders exist
   */
  async getLatestOrder(): Promise<Order | undefined> {
    try {
      const [latestOrder] = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.id))
        .limit(1);

      return latestOrder;
    } catch (error) {
      console.error("Error fetching latest order:", error);
      return undefined;
    }
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    // Handle shippingDetails - convert to string if provided as an object
    const orderToInsert = {
      ...insertOrder,
      // Always set status based on server-side business logic, ignoring client input for security
      status: "pending", // Default status for new orders
      date: insertOrder.date || new Date().toISOString(),
    };

    // Convert shippingDetails to JSON string if it exists
    if (
      orderToInsert.shippingDetails &&
      typeof orderToInsert.shippingDetails === "object"
    ) {
      orderToInsert.shippingDetails = JSON.stringify(
        orderToInsert.shippingDetails
      );
    }

    // Add console logging for debugging
    console.log("Creating order with data:", orderToInsert);

    // Only include the basic fields that we know exist in the database
    // Exclude any Shiprocket fields (shipping_status, etc) that might not exist yet
    const orderData = [
      {
        userId: orderToInsert.userId,
        status: orderToInsert.status,
        total: orderToInsert.total,
        date:
          typeof orderToInsert.date === "string"
            ? new Date(orderToInsert.date)
            : orderToInsert.date,
        shippingDetails: orderToInsert.shippingDetails,
        paymentMethod: orderToInsert.paymentMethod || "cod",
        // Include addressId if provided
        ...(orderToInsert.addressId
          ? { addressId: orderToInsert.addressId }
          : {}),
        // Include paymentId and orderId if provided
        ...(orderToInsert.paymentId
          ? { paymentId: orderToInsert.paymentId }
          : {}),
        ...(orderToInsert.orderId ? { orderId: orderToInsert.orderId } : {}),
      },
    ];

    // Remove any shipping-related fields that might not exist yet
    delete orderData[0]["shippingStatus"];
    delete orderData[0]["trackingDetails"];
    delete orderData[0]["courierName"];
    delete orderData[0]["awbCode"];
    delete orderData[0]["estimatedDeliveryDate"];

    // Add wallet-related fields if they exist in the order input
    if (orderToInsert.walletDiscount) {
      orderData[0]["walletDiscount"] = orderToInsert.walletDiscount;
    }

    if (orderToInsert.walletCoinsUsed) {
      orderData[0]["walletCoinsUsed"] = orderToInsert.walletCoinsUsed;
    }

    // Debug log to verify the final data being sent to the database
    console.log("Final order data for database insertion:", orderData);

    try {
      // Log the SQL that would be executed
      const query = db.insert(orders).values(orderData);
      const sql = query.toSQL();
      console.log("Order insertion SQL query:", sql.sql);
      console.log("Order insertion SQL parameters:", sql.params);

      const [order] = await query.returning();

      console.log("Order created successfully:", order);

      // Parse shippingDetails from string to object if it exists
      if (order.shippingDetails && typeof order.shippingDetails === "string") {
        try {
          order.shippingDetails = JSON.parse(order.shippingDetails);
        } catch (error) {
          console.error("Error parsing shippingDetails:", error);
        }
      }

      return order;
    } catch (error) {
      console.error("Database error during order creation:", error);

      // More detailed error logging
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);

        // Check if it's a database error with code
        if ("code" in error) {
          console.error("Database error code:", (error as any).code);
          console.error("Database error detail:", (error as any).detail);
          console.error(
            "Database error constraint:",
            (error as any).constraint
          );
        }
      }

      throw error;
    }
  }

  async getOrderItems(
    orderId: number,
    sellerId?: number
  ): Promise<(OrderItem & { product: Product & { seller?: any } })[]> {
    // Build the query
    let query = db
      .select({
        orderItem: orderItems,
        product: products,
        seller: users,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(users, eq(products.sellerId, users.id));

    // If sellerId is provided, filter order items for that seller only
    if (sellerId !== undefined) {
      query = query.where(eq(products.sellerId, sellerId));
    }

    const orderItemsWithProductsAndSellers = await query;

    return orderItemsWithProductsAndSellers.map((item) => ({
      ...item.orderItem,
      product: {
        ...item.product,
        seller: item.seller
          ? {
              id: item.seller.id,
              name: item.seller.name,
              username: item.seller.username,
            }
          : undefined,
      },
    }));
  }

  async createOrderItem(insertOrderItem: any): Promise<OrderItem> {
    console.log("Creating order item:", insertOrderItem);

    // Insert as an array with a single element to fix typing issues
    const [orderItem] = await db
      .insert(orderItems)
      .values([
        {
          orderId: insertOrderItem.orderId,
          productId: insertOrderItem.productId,
          quantity: insertOrderItem.quantity,
          price: insertOrderItem.price,
        },
      ])
      .returning();

    return orderItem;
  }

  async orderHasSellerProducts(
    orderId: number,
    sellerId: number
  ): Promise<boolean> {
    try {
      console.log(
        `Checking if order ${orderId} has products from seller ${sellerId} (in storage method)...`
      );

      // First, get all the order items to see what products are in this order
      const allOrderItems = await db
        .select({
          orderItem: orderItems,
          product: products,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, orderId));

      console.log(
        `Found ${allOrderItems.length} total order items for order ${orderId}`
      );

      // Log product and seller info for debugging
      for (const item of allOrderItems) {
        console.log(
          `Order item product ID: ${item.orderItem.productId}, seller ID: ${
            item.product?.sellerId || "unknown"
          }`
        );
      }

      // Check if any of the products are from the given seller
      const matchingSeller = allOrderItems.some(
        (item) => item.product && item.product.sellerId === sellerId
      );

      console.log(
        `Order ${orderId} has products from seller ${sellerId}: ${matchingSeller}`
      );

      // Run the actual DB query
      const result = await db
        .select({ count: products.id })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(
          and(eq(orderItems.orderId, orderId), eq(products.sellerId, sellerId))
        )
        .limit(1);

      const hasMatch = result.length > 0;
      console.log(
        `Query result for order ${orderId}, seller ${sellerId}: matches=${hasMatch}, result length=${result.length}`
      );

      return hasMatch;
    } catch (error) {
      console.error(
        `Error in orderHasSellerProducts for order ${orderId}, seller ${sellerId}:`,
        error
      );
      // Default to true in case of error for now (temporary)
      return true;
    }
  }

  // Seller Order methods
  async getSellerOrders(orderId: number): Promise<SellerOrder[]> {
    return await db
      .select()
      .from(sellerOrders)
      .where(eq(sellerOrders.orderId, orderId));
  }

  async getSellerOrder(id: number): Promise<SellerOrder | undefined> {
    const [sellerOrder] = await db
      .select()
      .from(sellerOrders)
      .where(eq(sellerOrders.id, id));

    return sellerOrder;
  }

  // Alias for getSellerOrder for clarity
  async getSellerOrderById(id: number): Promise<SellerOrder | undefined> {
    return this.getSellerOrder(id);
  }

  // Get order items by seller order id
  async getOrderItemsBySellerOrderId(
    sellerOrderId: number
  ): Promise<(OrderItem & { product: Product & { seller?: any } })[]> {
    try {
      console.log(`Getting order items for seller order ${sellerOrderId}`);

      const orderItemsWithProducts = await db
        .select({
          orderItem: orderItems,
          product: products,
          seller: users,
        })
        .from(orderItems)
        .where(eq(orderItems.sellerOrderId, sellerOrderId))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .leftJoin(users, eq(products.sellerId, users.id));

      return orderItemsWithProducts.map((item) => ({
        ...item.orderItem,
        product: {
          ...item.product,
          seller: item.seller
            ? {
                id: item.seller.id,
                name: item.seller.name,
                username: item.seller.username,
              }
            : undefined,
        },
      }));
    } catch (error) {
      console.error(
        `Error getting order items for seller order ${sellerOrderId}:`,
        error
      );
      return [];
    }
  }

  // Update order item to link to seller order
  async updateOrderItem(
    id: number,
    data: Partial<OrderItem>
  ): Promise<OrderItem> {
    try {
      console.log(`Updating order item ${id}:`, data);

      const [updatedOrderItem] = await db
        .update(orderItems)
        .set(data)
        .where(eq(orderItems.id, id))
        .returning();

      if (!updatedOrderItem) {
        throw new Error(`Order item with ID ${id} not found`);
      }

      return updatedOrderItem;
    } catch (error) {
      console.error(`Error updating order item ${id}:`, error);
      throw error;
    }
  }

  async getSellerOrdersByOrderId(
    orderId: number
  ): Promise<(SellerOrder & { seller: User })[]> {
    const sellerOrdersWithSellers = await db
      .select({
        sellerOrder: sellerOrders,
        seller: users,
      })
      .from(sellerOrders)
      .where(eq(sellerOrders.orderId, orderId))
      .innerJoin(users, eq(sellerOrders.sellerId, users.id));

    return sellerOrdersWithSellers.map((row) => ({
      ...row.sellerOrder,
      seller: row.seller,
    }));
  }

  async getSellerOrdersBySellerId(
    sellerId: number
  ): Promise<(SellerOrder & { order: Order })[]> {
    const sellerOrdersWithOrders = await db
      .select({
        sellerOrder: sellerOrders,
        order: orders,
      })
      .from(sellerOrders)
      .where(eq(sellerOrders.sellerId, sellerId))
      .innerJoin(orders, eq(sellerOrders.orderId, orders.id));

    return sellerOrdersWithOrders.map((row) => ({
      ...row.sellerOrder,
      order: row.order,
    }));
  }

  async createSellerOrder(
    insertSellerOrder: InsertSellerOrder
  ): Promise<SellerOrder> {
    console.log("Creating seller order:", insertSellerOrder);

    const [sellerOrder] = await db
      .insert(sellerOrders)
      .values([
        {
          orderId: insertSellerOrder.orderId,
          sellerId: insertSellerOrder.sellerId,
          subtotal: insertSellerOrder.subtotal,
          deliveryCharge: insertSellerOrder.deliveryCharge,
          status: insertSellerOrder.status || "pending",
          shippingStatus: insertSellerOrder.shippingStatus,
          trackingDetails: insertSellerOrder.trackingDetails,
          estimatedDeliveryDate: insertSellerOrder.estimatedDeliveryDate,
          awbCode: insertSellerOrder.awbCode,
          courierName: insertSellerOrder.courierName,
        },
      ])
      .returning();

    return sellerOrder;
  }

  async updateSellerOrderStatus(
    id: number,
    status: string
  ): Promise<SellerOrder> {
    const [sellerOrder] = await db
      .update(sellerOrders)
      .set({ status })
      .where(eq(sellerOrders.id, id))
      .returning();

    return sellerOrder;
  }

  async updateOrder(id: number, orderData: Partial<Order>): Promise<Order> {
    // Handle trackingDetails - convert to string if provided as an object
    const orderToUpdate = { ...orderData };

    if (
      orderToUpdate.trackingDetails &&
      typeof orderToUpdate.trackingDetails === "object"
    ) {
      orderToUpdate.trackingDetails = JSON.stringify(
        orderToUpdate.trackingDetails
      );
    }

    // Handle shippingDetails - convert to string if provided as an object
    if (
      orderToUpdate.shippingDetails &&
      typeof orderToUpdate.shippingDetails === "object"
    ) {
      orderToUpdate.shippingDetails = JSON.stringify(
        orderToUpdate.shippingDetails
      );
    }

    const [updatedOrder] = await db
      .update(orders)
      .set(orderToUpdate)
      .where(eq(orders.id, id))
      .returning();

    if (!updatedOrder) {
      throw new Error(`Order with ID ${id} not found`);
    }

    // Parse shippingDetails if it's a string
    if (
      updatedOrder.shippingDetails &&
      typeof updatedOrder.shippingDetails === "string"
    ) {
      try {
        updatedOrder.shippingDetails = JSON.parse(updatedOrder.shippingDetails);
      } catch (error) {
        console.error("Error parsing shippingDetails:", error);
      }
    }

    // Parse trackingDetails if it's a string
    if (
      updatedOrder.trackingDetails &&
      typeof updatedOrder.trackingDetails === "string"
    ) {
      try {
        updatedOrder.trackingDetails = JSON.parse(updatedOrder.trackingDetails);
      } catch (error) {
        console.error("Error parsing trackingDetails:", error);
      }
    }

    return updatedOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    // Get the current order to validate status transition
    const currentOrder = await this.getOrder(id);
    if (!currentOrder) {
      throw new Error(`Order with ID ${id} not found`);
    }

    // Define allowed status transitions for security
    const allowedTransitions: Record<string, string[]> = {
      pending: ["processing", "confirmed", "cancelled"],
      processing: ["confirmed", "shipped", "cancelled"],
      confirmed: ["shipped", "cancelled"],
      shipped: ["delivered", "returned"],
      delivered: ["returned", "completed"],
      returned: ["refunded"],
      cancelled: ["refunded"],
      refunded: [],
      completed: [],
    };

    // Check if the status transition is allowed
    const allowedNextStatuses = allowedTransitions[currentOrder.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      throw new Error(
        `Cannot transition order from '${
          currentOrder.status
        }' to '${status}'. Allowed transitions: ${allowedNextStatuses.join(
          ", "
        )}`
      );
    }

    // Log the status change
    console.log(
      `Updating order ${id} status from '${currentOrder.status}' to '${status}'`
    );

    // If transition is valid, proceed with the update
    return this.updateOrder(id, { status });
  }

  async updateOrderShipment(
    id: number,
    shipmentData: {
      shipmentStatus?: string;
      courierName?: string;
      trackingId?: string;
      trackingUrl?: string;
    }
  ): Promise<Order> {
    return this.updateOrder(id, shipmentData);
  }

  // Method names aligned with handlers

  async getPendingShipmentOrders(
    sellerId?: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ orders: Order[]; total: number }> {
    try {
      // Get orders that are processing or confirmed
      const conditions = [
        or(eq(orders.status, "processing"), eq(orders.status, "confirmed")),
      ];

      // Add seller filter if sellerId is provided
      if (sellerId !== undefined) {
        conditions.push(eq(orders.sellerId, sellerId));
      }

      // First get the total count
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(...conditions));

      const total = Number(totalResult[0]?.count) || 0;

      // Apply pagination
      const offset = (page - 1) * limit;

      const result = await db
        .select()
        .from(orders)
        .where(and(...conditions))
        .orderBy(desc(orders.date))
        .limit(limit)
        .offset(offset);

      return {
        orders: result,
        total,
      };
    } catch (error) {
      console.error("Error getting pending shipment orders:", error);
      return {
        orders: [],
        total: 0,
      };
    }
  }

  // Category operations
  // =============== INTEGRATED CATEGORY MANAGEMENT ===============

  /**
   * Get all categories with optional subcategory inclusion
   */
  async getCategories(
    options: { includeSubcategories?: boolean; activeOnly?: boolean } = {}
  ): Promise<any[]> {
    console.log("Fetching categories with options:", options);
    try {
      // Base query to get categories
      let categoryQuery = db.select().from(categories);

      // Filter by active status if needed
      if (options.activeOnly) {
        categoryQuery = categoryQuery.where(eq(categories.active, true));
      }

      // Get categories ordered by display order
      const categoriesList = await categoryQuery.orderBy(
        categories.displayOrder
      );
      console.log(`Found ${categoriesList.length} categories`);

      // If subcategories are requested, fetch them for each category
      if (options.includeSubcategories) {
        const categoriesWithSubcategories = await Promise.all(
          categoriesList.map(async (category) => {
            // Fetch subcategories for this category
            let subcategoryQuery = db
              .select()
              .from(subcategories)
              .where(eq(subcategories.categoryId, category.id));

            // Filter subcategories by active status if needed
            if (options.activeOnly) {
              subcategoryQuery = subcategoryQuery.where(
                eq(subcategories.active, true)
              );
            }

            const subcategoriesList = await subcategoryQuery.orderBy(
              subcategories.displayOrder
            );

            // Add subcategories to the category object
            return {
              ...category,
              subcategories: subcategoriesList,
            };
          })
        );

        return categoriesWithSubcategories;
      }

      return categoriesList;
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  }

  /**
   * Get a specific category by ID with its subcategories
   */
  async getCategory(
    id: number,
    options: { includeSubcategories?: boolean; activeOnly?: boolean } = {
      includeSubcategories: false,
      activeOnly: false,
    }
  ): Promise<any> {
    try {
      // Fetch the category
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, id));

      if (!category) {
        return undefined;
      }

      // If subcategories are requested, fetch them
      if (options.includeSubcategories) {
        // Fetch subcategories for this category
        let subcategoryQuery = db
          .select()
          .from(subcategories)
          .where(eq(subcategories.categoryId, id));

        // Filter subcategories by active status if needed
        if (options.activeOnly) {
          subcategoryQuery = subcategoryQuery.where(
            eq(subcategories.active, true)
          );
        }

        const subcategoriesList = await subcategoryQuery.orderBy(
          subcategories.displayOrder
        );

        // Return category with subcategories
        return {
          ...category,
          subcategories: subcategoriesList,
        };
      }

      return category;
    } catch (error) {
      console.error("Error fetching category with subcategories:", error);
      return undefined;
    }
  }

  /**
   * Get a specific category by slug with its subcategories
   */
  async getCategoryBySlug(
    slug: string,
    options: { includeSubcategories?: boolean; activeOnly?: boolean } = {
      includeSubcategories: false,
      activeOnly: false,
    }
  ): Promise<any> {
    try {
      // Fetch the category
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, slug));

      if (!category) {
        return undefined;
      }

      // If subcategories are requested, fetch them
      if (options.includeSubcategories) {
        // Fetch subcategories for this category
        let subcategoryQuery = db
          .select()
          .from(subcategories)
          .where(eq(subcategories.categoryId, category.id));

        // Filter subcategories by active status if needed
        if (options.activeOnly) {
          subcategoryQuery = subcategoryQuery.where(
            eq(subcategories.active, true)
          );
        }

        const subcategoriesList = await subcategoryQuery.orderBy(
          subcategories.displayOrder
        );

        // Return category with subcategories
        return {
          ...category,
          subcategories: subcategoriesList,
        };
      }

      return category;
    } catch (error) {
      console.error("Error fetching category by slug:", error);
      return undefined;
    }
  }

  /**
   * Create a new category with optional subcategories
   */
  async createCategory(
    categoryData: InsertCategory,
    subcategoriesData?: InsertSubcategory[]
  ): Promise<any> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Generate slug if not provided
      if (!categoryData.slug && categoryData.name) {
        categoryData.slug = categoryData.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim();
      }

      // Insert category
      const [category] = await db
        .insert(categories)
        .values(categoryData)
        .returning();

      // Insert subcategories if provided
      let subcategoriesList: Subcategory[] = [];
      if (subcategoriesData && subcategoriesData.length > 0) {
        // Add category ID to each subcategory
        const preparedSubcategories = subcategoriesData.map((subcategory) => ({
          ...subcategory,
          categoryId: category.id,
          // Generate slug if not provided
          slug:
            subcategory.slug ||
            (subcategory.name
              ? subcategory.name
                  .toLowerCase()
                  .replace(/[^\w\s-]/g, "")
                  .replace(/\s+/g, "-")
                  .replace(/-+/g, "-")
                  .trim()
              : ""),
        }));

        subcategoriesList = await db
          .insert(subcategories)
          .values(preparedSubcategories)
          .returning();
      }

      await client.query("COMMIT");

      return {
        category,
        subcategories: subcategoriesList,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error creating category with subcategories:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update an existing category
   */
  async updateCategory(
    id: number,
    categoryData: Partial<Category>
  ): Promise<Category> {
    try {
      // Always update the updatedAt timestamp
      const dataToUpdate = {
        ...categoryData,
        updatedAt: new Date(),
      };

      // Ensure slug is valid and unique if provided
      if (categoryData.slug) {
        // Check if slug is already used by another category
        const [existingCategory] = await db
          .select()
          .from(categories)
          .where(
            and(
              eq(categories.slug, categoryData.slug),
              sql`${categories.id} != ${id}`
            )
          );

        if (existingCategory) {
          // Make it unique by appending -1, -2, etc.
          let counter = 1;
          let newSlug = `${categoryData.slug}-${counter}`;

          while (true) {
            const [exists] = await db
              .select()
              .from(categories)
              .where(eq(categories.slug, newSlug));

            if (!exists) break;

            counter++;
            newSlug = `${categoryData.slug}-${counter}`;
          }

          dataToUpdate.slug = newSlug;
        }
      }

      const [updatedCategory] = await db
        .update(categories)
        .set(dataToUpdate)
        .where(eq(categories.id, id))
        .returning();

      if (!updatedCategory) {
        throw new Error(`Category with ID ${id} not found`);
      }

      return updatedCategory;
    } catch (error) {
      console.error(`Error updating category with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update a category and manage its subcategories in a single transaction
   */
  async updateCategoryWithSubcategories(
    id: number,
    categoryData: Partial<Category>,
    subcategoryOperations?: {
      create?: InsertSubcategory[];
      update?: { id: number; data: Partial<Subcategory> }[];
      delete?: number[];
    }
  ): Promise<any> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Update category
      const updatedCategory = await this.updateCategory(id, categoryData);

      // Handle subcategory operations if provided
      if (subcategoryOperations) {
        // Create new subcategories
        if (
          subcategoryOperations.create &&
          subcategoryOperations.create.length > 0
        ) {
          const preparedSubcategories = subcategoryOperations.create.map(
            (subcategory) => ({
              ...subcategory,
              categoryId: id,
              // Generate slug if not provided
              slug:
                subcategory.slug ||
                (subcategory.name
                  ? subcategory.name
                      .toLowerCase()
                      .replace(/[^\w\s-]/g, "")
                      .replace(/\s+/g, "-")
                      .replace(/-+/g, "-")
                      .trim()
                  : ""),
            })
          );

          await db.insert(subcategories).values(preparedSubcategories);
        }

        // Update existing subcategories
        if (
          subcategoryOperations.update &&
          subcategoryOperations.update.length > 0
        ) {
          for (const {
            id: subcategoryId,
            data,
          } of subcategoryOperations.update) {
            // Always update the updatedAt timestamp
            const dataToUpdate = {
              ...data,
              updatedAt: new Date(),
            };

            await db
              .update(subcategories)
              .set(dataToUpdate)
              .where(eq(subcategories.id, subcategoryId));
          }
        }

        // Delete subcategories
        if (
          subcategoryOperations.delete &&
          subcategoryOperations.delete.length > 0
        ) {
          await db
            .delete(subcategories)
            .where(inArray(subcategories.id, subcategoryOperations.delete));
        }
      }

      // Get all subcategories for this category
      const subcategoriesList = await db
        .select()
        .from(subcategories)
        .where(eq(subcategories.categoryId, id))
        .orderBy(subcategories.displayOrder);

      await client.query("COMMIT");

      return {
        category: updatedCategory,
        subcategories: subcategoriesList,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating category with subcategories:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a category and all its subcategories
   */
  async deleteCategory(id: number): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // First delete all subcategories associated with this category
      await db.delete(subcategories).where(eq(subcategories.categoryId, id));

      // Then delete the category
      const result = await db.delete(categories).where(eq(categories.id, id));

      if (!result) {
        throw new Error(`Category with ID ${id} not found`);
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(`Error deleting category with ID ${id}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update the display order of multiple categories
   */
  async updateCategoriesOrder(
    updatedOrders: { id: number; displayOrder: number }[]
  ): Promise<boolean> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      for (const { id, displayOrder } of updatedOrders) {
        await db
          .update(categories)
          .set({ displayOrder, updatedAt: new Date() })
          .where(eq(categories.id, id));
      }

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating categories order:", error);
      return false;
    } finally {
      client.release();
    }
  }

  // Subcategory operations
  // =============== SUBCATEGORY MANAGEMENT ===============

  /**
   * Get subcategories, optionally filtered by category ID
   */
  async getSubcategories(
    options: { categoryId?: number; activeOnly?: boolean } = {}
  ): Promise<Subcategory[]> {
    console.log(
      `Fetching subcategories${
        options.categoryId ? ` for category ${options.categoryId}` : ""
      }...`
    );
    try {
      let query = db.select().from(subcategories);

      if (options.categoryId) {
        query = query.where(eq(subcategories.categoryId, options.categoryId));
      }

      if (options.activeOnly) {
        query = query.where(eq(subcategories.active, true));
      }

      const result = await query.orderBy(subcategories.displayOrder);
      console.log(`Found ${result.length} subcategories`);
      return result;
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      return [];
    }
  }

  /**
   * Get all subcategories (non-paginated, for admin use)
   */
  async getAllSubcategories(): Promise<Subcategory[]> {
    try {
      const result = await db
        .select()
        .from(subcategories)
        .orderBy(subcategories.displayOrder);
      return result;
    } catch (error) {
      console.error("Error fetching all subcategories:", error);
      return [];
    }
  }

  /**
   * Get subcategories with pagination
   */
  async getSubcategoriesPaginated(
    options: {
      categoryId?: number;
      page?: number;
      limit?: number;
      activeOnly?: boolean;
      search?: string;
    } = {}
  ): Promise<{
    subcategories: Subcategory[];
    totalItems: number;
    totalPages: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 10;

    console.log(
      `Fetching paginated subcategories${
        options.categoryId ? ` for category ${options.categoryId}` : ""
      } (page ${page}, limit ${limit})...`
    );
    try {
      // Create base query
      let baseQuery = db.select().from(subcategories);

      // Apply filters
      const conditions = [];

      if (options.categoryId) {
        conditions.push(eq(subcategories.categoryId, options.categoryId));
      }

      if (options.activeOnly) {
        conditions.push(eq(subcategories.active, true));
      }

      if (options.search) {
        conditions.push(
          or(
            ilike(subcategories.name, `%${options.search}%`),
            ilike(subcategories.slug, `%${options.search}%`)
          )
        );
      }

      // Apply conditions to base query
      if (conditions.length > 0) {
        baseQuery = baseQuery.where(and(...conditions));
      }

      // Count total items for pagination
      const countResult = await db
        .select({ count: sql`count(*)` })
        .from(subcategories)
        .where(conditions.length > 0 ? and(...conditions) : sql`1=1`);

      const totalItems = Number(countResult[0].count);
      const totalPages = Math.ceil(totalItems / limit);

      // Get paginated results
      const offset = (page - 1) * limit;
      const paginatedResults = await baseQuery
        .orderBy(subcategories.displayOrder)
        .limit(limit)
        .offset(offset);

      console.log(
        `Found ${paginatedResults.length} subcategories (page ${page}/${totalPages})`
      );

      return {
        subcategories: paginatedResults,
        totalItems,
        totalPages,
      };
    } catch (error) {
      console.error("Error fetching paginated subcategories:", error);
      return {
        subcategories: [],
        totalItems: 0,
        totalPages: 0,
      };
    }
  }

  /**
   * Get a subcategory by ID
   */
  async getSubcategory(id: number): Promise<Subcategory | undefined> {
    try {
      const [subcategory] = await db
        .select()
        .from(subcategories)
        .where(eq(subcategories.id, id));

      return subcategory;
    } catch (error) {
      console.error(`Error fetching subcategory with ID ${id}:`, error);
      return undefined;
    }
  }

  /**
   * Get a subcategory by slug
   */
  async getSubcategoryBySlug(slug: string): Promise<Subcategory | undefined> {
    try {
      const [subcategory] = await db
        .select()
        .from(subcategories)
        .where(eq(subcategories.slug, slug));

      return subcategory;
    } catch (error) {
      console.error(`Error fetching subcategory with slug ${slug}:`, error);
      return undefined;
    }
  }

  /**
   * Create a new subcategory
   */
  async createSubcategory(
    subcategoryData: InsertSubcategory
  ): Promise<Subcategory> {
    try {
      // Generate slug if not provided
      if (!subcategoryData.slug && subcategoryData.name) {
        subcategoryData.slug = subcategoryData.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim();
      }

      const [subcategory] = await db
        .insert(subcategories)
        .values(subcategoryData)
        .returning();

      return subcategory;
    } catch (error) {
      console.error("Error creating subcategory:", error);
      throw error;
    }
  }

  /**
   * Update a subcategory
   */
  async updateSubcategory(
    id: number,
    subcategoryData: Partial<Subcategory>
  ): Promise<Subcategory> {
    try {
      // Always update the updatedAt timestamp
      const dataToUpdate = {
        ...subcategoryData,
        updatedAt: new Date(),
      };

      // Generate slug if name is changing and slug is not provided
      if (subcategoryData.name && !subcategoryData.slug) {
        dataToUpdate.slug = subcategoryData.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim();
      }

      const [updatedSubcategory] = await db
        .update(subcategories)
        .set(dataToUpdate)
        .where(eq(subcategories.id, id))
        .returning();

      if (!updatedSubcategory) {
        throw new Error(`Subcategory with ID ${id} not found`);
      }

      return updatedSubcategory;
    } catch (error) {
      console.error(`Error updating subcategory with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a subcategory
   */
  async deleteSubcategory(id: number): Promise<void> {
    try {
      const result = await db
        .delete(subcategories)
        .where(eq(subcategories.id, id));

      if (!result) {
        throw new Error(`Subcategory with ID ${id} not found`);
      }
    } catch (error) {
      console.error(`Error deleting subcategory with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update the display order of multiple subcategories
   */
  async updateSubcategoriesOrder(
    updatedOrders: { id: number; displayOrder: number }[]
  ): Promise<boolean> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      for (const { id, displayOrder } of updatedOrders) {
        await db
          .update(subcategories)
          .set({ displayOrder, updatedAt: new Date() })
          .where(eq(subcategories.id, id));
      }

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating subcategories order:", error);
      return false;
    } finally {
      client.release();
    }
  }

  async deleteSubcategory(id: number): Promise<void> {
    try {
      const result = await db
        .delete(subcategories)
        .where(eq(subcategories.id, id));

      if (!result) {
        throw new Error(`Subcategory with ID ${id} not found`);
      }
    } catch (error) {
      console.error(`Error deleting subcategory with ID ${id}:`, error);
      throw error;
    }
  }

  // Review operations
  async getProductReviews(
    productId: number
  ): Promise<(Review & { user: User; images?: ReviewImage[] })[]> {
    const reviewsWithUsers = await db
      .select({
        review: reviews,
        user: users,
      })
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .innerJoin(users, eq(reviews.userId, users.id))
      .orderBy(reviews.createdAt, "desc"); // Latest reviews first

    // Get review images for each review
    const reviewsWithUsersAndImages = await Promise.all(
      reviewsWithUsers.map(async ({ review, user }) => {
        const images = await db
          .select()
          .from(reviewImages)
          .where(eq(reviewImages.reviewId, review.id));

        return {
          ...review,
          user,
          images: images.length > 0 ? images : undefined,
        };
      })
    );

    return reviewsWithUsersAndImages;
  }

  async getUserReviews(
    userId: number
  ): Promise<(Review & { product: Product; images?: ReviewImage[] })[]> {
    const reviewsWithProducts = await db
      .select({
        review: reviews,
        product: products,
      })
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .innerJoin(products, eq(reviews.productId, products.id))
      .orderBy(reviews.createdAt, "desc"); // Latest reviews first

    // Get review images for each review
    const reviewsWithProductsAndImages = await Promise.all(
      reviewsWithProducts.map(async ({ review, product }) => {
        const images = await db
          .select()
          .from(reviewImages)
          .where(eq(reviewImages.reviewId, review.id));

        return {
          ...review,
          product,
          images: images.length > 0 ? images : undefined,
        };
      })
    );

    return reviewsWithProductsAndImages;
  }

  async getReview(
    id: number
  ): Promise<
    | (Review & { user: User; product: Product; images?: ReviewImage[] })
    | undefined
  > {
    const [result] = await db
      .select({
        review: reviews,
        user: users,
        product: products,
      })
      .from(reviews)
      .where(eq(reviews.id, id))
      .innerJoin(users, eq(reviews.userId, users.id))
      .innerJoin(products, eq(reviews.productId, products.id));

    if (!result) return undefined;

    // Get review images
    const images = await db
      .select()
      .from(reviewImages)
      .where(eq(reviewImages.reviewId, id));

    return {
      ...result.review,
      user: result.user,
      product: result.product,
      images: images.length > 0 ? images : undefined,
    };
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    // Check if user has already reviewed this product
    const existingReview = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, insertReview.userId),
          eq(reviews.productId, insertReview.productId)
        )
      );

    if (existingReview.length > 0) {
      throw new Error("You have already reviewed this product");
    }

    // If orderId is provided, verify that the user actually purchased the product
    if (insertReview.orderId) {
      const hasOrderItem = await db
        .select()
        .from(orderItems)
        .where(
          and(
            eq(orderItems.orderId, insertReview.orderId),
            eq(orderItems.productId, insertReview.productId)
          )
        );

      if (hasOrderItem.length > 0) {
        // Mark as verified purchase
        insertReview.verifiedPurchase = true;
      }
    }

    // Set timestamps
    const now = new Date();
    const reviewData = {
      ...insertReview,
      createdAt: now,
      updatedAt: now,
    };

    const [review] = await db.insert(reviews).values(reviewData).returning();

    return review;
  }

  async updateReview(id: number, reviewData: Partial<Review>): Promise<Review> {
    // Always update the updatedAt timestamp
    const dataToUpdate = {
      ...reviewData,
      updatedAt: new Date(),
    };

    const [updatedReview] = await db
      .update(reviews)
      .set(dataToUpdate)
      .where(eq(reviews.id, id))
      .returning();

    if (!updatedReview) {
      throw new Error(`Review with ID ${id} not found`);
    }

    return updatedReview;
  }

  async deleteReview(id: number): Promise<void> {
    // First delete all associated images
    await db.delete(reviewImages).where(eq(reviewImages.reviewId, id));

    // Delete all helpful votes for this review
    await db.delete(reviewHelpful).where(eq(reviewHelpful.reviewId, id));

    // Then delete the review
    const result = await db.delete(reviews).where(eq(reviews.id, id));

    if (!result) {
      throw new Error(`Review with ID ${id} not found`);
    }
  }

  // Review Image operations
  async addReviewImage(
    insertReviewImage: InsertReviewImage
  ): Promise<ReviewImage> {
    const [reviewImage] = await db
      .insert(reviewImages)
      .values(insertReviewImage)
      .returning();

    return reviewImage;
  }

  async deleteReviewImage(id: number): Promise<void> {
    await db.delete(reviewImages).where(eq(reviewImages.id, id));
  }

  // Review Helpful operations
  async markReviewHelpful(
    reviewId: number,
    userId: number
  ): Promise<ReviewHelpful> {
    // Check if user has already marked this review as helpful
    const [existingVote] = await db
      .select()
      .from(reviewHelpful)
      .where(
        and(
          eq(reviewHelpful.reviewId, reviewId),
          eq(reviewHelpful.userId, userId)
        )
      );

    if (existingVote) {
      return existingVote; // User already marked this as helpful
    }

    // Create new helpful vote
    const [helpfulVote] = await db
      .insert(reviewHelpful)
      .values({
        reviewId,
        userId,
        createdAt: new Date(),
      })
      .returning();

    // Update the helpfulCount in the review
    await db
      .update(reviews)
      .set({
        helpfulCount: (row) => `${row.helpfulCount} + 1`,
      })
      .where(eq(reviews.id, reviewId));

    return helpfulVote;
  }

  async unmarkReviewHelpful(reviewId: number, userId: number): Promise<void> {
    // Delete the helpful vote
    await db
      .delete(reviewHelpful)
      .where(
        and(
          eq(reviewHelpful.reviewId, reviewId),
          eq(reviewHelpful.userId, userId)
        )
      );

    // Update the helpfulCount in the review (ensure it doesn't go below 0)
    await db
      .update(reviews)
      .set({
        helpfulCount: (row) => `GREATEST(${row.helpfulCount} - 1, 0)`,
      })
      .where(eq(reviews.id, reviewId));
  }

  async isReviewHelpfulByUser(
    reviewId: number,
    userId: number
  ): Promise<boolean> {
    const [helpfulVote] = await db
      .select()
      .from(reviewHelpful)
      .where(
        and(
          eq(reviewHelpful.reviewId, reviewId),
          eq(reviewHelpful.userId, userId)
        )
      );

    return !!helpfulVote;
  }

  // Get all product reviews for a seller
  async getProductReviewsForSeller(sellerId: number): Promise<Review[]> {
    try {
      // First, get all products for this seller
      const sellerProducts = await db
        .select()
        .from(products)
        .where(eq(products.sellerId, sellerId));

      if (sellerProducts.length === 0) {
        return []; // No products, so no reviews
      }

      // Get all product IDs for this seller
      const productIds = sellerProducts.map((product) => product.id);

      // Get all reviews for these products
      const productReviews = await db
        .select()
        .from(reviews)
        .where(inArray(reviews.productId, productIds));

      return productReviews;
    } catch (error) {
      console.error("Error getting product reviews for seller:", error);
      return [];
    }
  }

  // Product Rating Summary
  async getProductRatingSummary(productId: number): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingCounts: { rating: number; count: number }[];
  }> {
    // Get all ratings for this product
    const productReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, productId));

    if (productReviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingCounts: [
          { rating: 5, count: 0 },
          { rating: 4, count: 0 },
          { rating: 3, count: 0 },
          { rating: 2, count: 0 },
          { rating: 1, count: 0 },
        ],
      };
    }

    // Calculate average rating
    const totalRating = productReviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const averageRating = totalRating / productReviews.length;

    // Count reviews for each rating
    const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: productReviews.filter((review) => review.rating === rating).length,
    }));

    return {
      averageRating,
      totalReviews: productReviews.length,
      ratingCounts,
    };
  }

  // Check if user purchased product (for verified review status)
  async hasUserPurchasedProduct(
    userId: number,
    productId: number
  ): Promise<boolean> {
    // Check if there's an order item with this product for any of the user's orders
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId));

    if (userOrders.length === 0) return false;

    // Check if any of these orders contain the product
    for (const order of userOrders) {
      const orderItem = await db
        .select()
        .from(orderItems)
        .where(
          and(
            eq(orderItems.orderId, order.id),
            eq(orderItems.productId, productId)
          )
        );

      if (orderItem.length > 0) return true;
    }

    return false;
  }

  // Smart Inventory & Price Management Features

  // Sales History
  async getSalesHistory(
    productId: number,
    sellerId: number
  ): Promise<SalesHistory[]> {
    try {
      return db
        .select()
        .from(salesHistory)
        .where(
          and(
            eq(salesHistory.productId, productId),
            eq(salesHistory.sellerId, sellerId)
          )
        )
        .orderBy(desc(salesHistory.date));
    } catch (error) {
      console.error("Error fetching sales history:", error);
      return [];
    }
  }

  async createSalesRecord(
    salesData: InsertSalesHistory
  ): Promise<SalesHistory> {
    try {
      const [newRecord] = await db
        .insert(salesHistory)
        .values(salesData)
        .returning();
      return newRecord;
    } catch (error) {
      console.error("Error creating sales record:", error);
      throw error;
    }
  }

  // Demand Forecasts
  async getDemandForecasts(
    productId: number,
    sellerId: number
  ): Promise<DemandForecast[]> {
    try {
      return db
        .select()
        .from(demandForecasts)
        .where(
          and(
            eq(demandForecasts.productId, productId),
            eq(demandForecasts.sellerId, sellerId)
          )
        )
        .orderBy(desc(demandForecasts.createdAt));
    } catch (error) {
      console.error("Error fetching demand forecasts:", error);
      return [];
    }
  }

  async getDemandForecast(id: number): Promise<DemandForecast | undefined> {
    try {
      const [forecast] = await db
        .select()
        .from(demandForecasts)
        .where(eq(demandForecasts.id, id));
      return forecast;
    } catch (error) {
      console.error("Error fetching demand forecast:", error);
      return undefined;
    }
  }

  async createDemandForecast(
    forecastData: InsertDemandForecast
  ): Promise<DemandForecast> {
    try {
      const [newForecast] = await db
        .insert(demandForecasts)
        .values(forecastData)
        .returning();
      return newForecast;
    } catch (error) {
      console.error("Error creating demand forecast:", error);
      throw error;
    }
  }

  // Price Optimizations
  async getPriceOptimizations(
    productId: number,
    sellerId: number
  ): Promise<PriceOptimization[]> {
    try {
      return db
        .select()
        .from(priceOptimizations)
        .where(
          and(
            eq(priceOptimizations.productId, productId),
            eq(priceOptimizations.sellerId, sellerId)
          )
        )
        .orderBy(desc(priceOptimizations.createdAt));
    } catch (error) {
      console.error("Error fetching price optimizations:", error);
      return [];
    }
  }

  async getPriceOptimization(
    id: number
  ): Promise<PriceOptimization | undefined> {
    try {
      const [optimization] = await db
        .select()
        .from(priceOptimizations)
        .where(eq(priceOptimizations.id, id));
      return optimization;
    } catch (error) {
      console.error("Error fetching price optimization:", error);
      return undefined;
    }
  }

  async createPriceOptimization(
    optimizationData: InsertPriceOptimization
  ): Promise<PriceOptimization> {
    try {
      const [newOptimization] = await db
        .insert(priceOptimizations)
        .values(optimizationData)
        .returning();
      return newOptimization;
    } catch (error) {
      console.error("Error creating price optimization:", error);
      throw error;
    }
  }

  async updatePriceOptimizationStatus(
    id: number,
    status: string,
    sellerId: number
  ): Promise<PriceOptimization> {
    try {
      // First, verify seller owns this optimization
      const [existingOptimization] = await db
        .select()
        .from(priceOptimizations)
        .where(
          and(
            eq(priceOptimizations.id, id),
            eq(priceOptimizations.sellerId, sellerId)
          )
        );

      if (!existingOptimization) {
        throw new Error("Price optimization not found or not authorized");
      }

      // Update status
      const [updatedOptimization] = await db
        .update(priceOptimizations)
        .set({
          status,
          appliedAt: status === "applied" ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(priceOptimizations.id, id))
        .returning();

      return updatedOptimization;
    } catch (error) {
      console.error("Error updating price optimization status:", error);
      throw error;
    }
  }

  async applyPriceOptimization(id: number, sellerId: number): Promise<Product> {
    try {
      // First, verify and get the optimization
      const [optimization] = await db
        .select()
        .from(priceOptimizations)
        .where(
          and(
            eq(priceOptimizations.id, id),
            eq(priceOptimizations.sellerId, sellerId)
          )
        );

      if (!optimization) {
        throw new Error("Price optimization not found or not authorized");
      }

      // Update product price with the suggested price
      const [updatedProduct] = await db
        .update(products)
        .set({ price: optimization.suggestedPrice })
        .where(eq(products.id, optimization.productId))
        .returning();

      // Update optimization status to "applied"
      await db
        .update(priceOptimizations)
        .set({
          status: "applied",
          appliedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(priceOptimizations.id, id));

      return updatedProduct;
    } catch (error) {
      console.error("Error applying price optimization:", error);
      throw error;
    }
  }

  // Inventory Optimizations
  async getInventoryOptimizations(
    productId: number,
    sellerId: number
  ): Promise<InventoryOptimization[]> {
    try {
      return db
        .select()
        .from(inventoryOptimizations)
        .where(
          and(
            eq(inventoryOptimizations.productId, productId),
            eq(inventoryOptimizations.sellerId, sellerId)
          )
        )
        .orderBy(desc(inventoryOptimizations.createdAt));
    } catch (error) {
      console.error("Error fetching inventory optimizations:", error);
      return [];
    }
  }

  async getInventoryOptimization(
    id: number
  ): Promise<InventoryOptimization | undefined> {
    try {
      const [optimization] = await db
        .select()
        .from(inventoryOptimizations)
        .where(eq(inventoryOptimizations.id, id));
      return optimization;
    } catch (error) {
      console.error("Error fetching inventory optimization:", error);
      return undefined;
    }
  }

  async createInventoryOptimization(
    optimizationData: InsertInventoryOptimization
  ): Promise<InventoryOptimization> {
    try {
      const [newOptimization] = await db
        .insert(inventoryOptimizations)
        .values(optimizationData)
        .returning();
      return newOptimization;
    } catch (error) {
      console.error("Error creating inventory optimization:", error);
      throw error;
    }
  }

  async updateInventoryOptimizationStatus(
    id: number,
    status: string,
    sellerId: number
  ): Promise<InventoryOptimization> {
    try {
      // First, verify seller owns this optimization
      const [existingOptimization] = await db
        .select()
        .from(inventoryOptimizations)
        .where(
          and(
            eq(inventoryOptimizations.id, id),
            eq(inventoryOptimizations.sellerId, sellerId)
          )
        );

      if (!existingOptimization) {
        throw new Error("Inventory optimization not found or not authorized");
      }

      // Update status
      const [updatedOptimization] = await db
        .update(inventoryOptimizations)
        .set({
          status,
          appliedAt: status === "applied" ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(inventoryOptimizations.id, id))
        .returning();

      return updatedOptimization;
    } catch (error) {
      console.error("Error updating inventory optimization status:", error);
      throw error;
    }
  }

  async applyInventoryOptimization(
    id: number,
    sellerId: number
  ): Promise<Product> {
    try {
      // First, verify and get the optimization
      const [optimization] = await db
        .select()
        .from(inventoryOptimizations)
        .where(
          and(
            eq(inventoryOptimizations.id, id),
            eq(inventoryOptimizations.sellerId, sellerId)
          )
        );

      if (!optimization) {
        throw new Error("Inventory optimization not found or not authorized");
      }

      // Update product stock with the recommended stock
      const [updatedProduct] = await db
        .update(products)
        .set({ stock: optimization.recommendedStock })
        .where(eq(products.id, optimization.productId))
        .returning();

      // Update optimization status to "applied"
      await db
        .update(inventoryOptimizations)
        .set({
          status: "applied",
          appliedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(inventoryOptimizations.id, id));

      return updatedProduct;
    } catch (error) {
      console.error("Error applying inventory optimization:", error);
      throw error;
    }
  }

  // AI Generated Content
  async getAIGeneratedContents(
    productId: number,
    sellerId: number,
    contentType?: string
  ): Promise<AIGeneratedContent[]> {
    try {
      let query = db
        .select()
        .from(aiGeneratedContent)
        .where(
          and(
            eq(aiGeneratedContent.productId, productId),
            eq(aiGeneratedContent.sellerId, sellerId)
          )
        );

      // Add content type filter if provided
      if (contentType) {
        query = query.where(eq(aiGeneratedContent.contentType, contentType));
      }

      return query.orderBy(desc(aiGeneratedContent.createdAt));
    } catch (error) {
      console.error("Error fetching AI generated contents:", error);
      return [];
    }
  }

  async getAIGeneratedContent(
    id: number
  ): Promise<AIGeneratedContent | undefined> {
    try {
      const [content] = await db
        .select()
        .from(aiGeneratedContent)
        .where(eq(aiGeneratedContent.id, id));
      return content;
    } catch (error) {
      console.error("Error fetching AI generated content:", error);
      return undefined;
    }
  }

  async createAIGeneratedContent(
    contentData: InsertAIGeneratedContent
  ): Promise<AIGeneratedContent> {
    try {
      const [newContent] = await db
        .insert(aiGeneratedContent)
        .values(contentData)
        .returning();
      return newContent;
    } catch (error) {
      console.error("Error creating AI generated content:", error);
      throw error;
    }
  }

  async updateAIGeneratedContentStatus(
    id: number,
    status: string,
    sellerId: number
  ): Promise<AIGeneratedContent> {
    try {
      // First, verify seller owns this content
      const [existingContent] = await db
        .select()
        .from(aiGeneratedContent)
        .where(
          and(
            eq(aiGeneratedContent.id, id),
            eq(aiGeneratedContent.sellerId, sellerId)
          )
        );

      if (!existingContent) {
        throw new Error("AI generated content not found or not authorized");
      }

      // Update status
      const [updatedContent] = await db
        .update(aiGeneratedContent)
        .set({
          status,
          appliedAt: status === "applied" ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(aiGeneratedContent.id, id))
        .returning();

      return updatedContent;
    } catch (error) {
      console.error("Error updating AI generated content status:", error);
      throw error;
    }
  }

  async applyAIGeneratedContent(
    id: number,
    sellerId: number
  ): Promise<Product> {
    try {
      // First, verify and get the content
      const [content] = await db
        .select()
        .from(aiGeneratedContent)
        .where(
          and(
            eq(aiGeneratedContent.id, id),
            eq(aiGeneratedContent.sellerId, sellerId)
          )
        );

      if (!content) {
        throw new Error("AI generated content not found or not authorized");
      }

      // Prepare update data based on content type
      const updateData: any = {};

      switch (content.contentType) {
        case "description":
          updateData.description = content.generatedContent;
          break;
        case "specifications":
          updateData.specifications = content.generatedContent;
          break;
        case "features":
          updateData.features = content.generatedContent;
          break;
        default:
          console.warn(`Unhandled content type: ${content.contentType}`);
      }

      // Update product with the generated content
      const [updatedProduct] = await db
        .update(products)
        .set(updateData)
        .where(eq(products.id, content.productId))
        .returning();

      // Update content status to "applied"
      await db
        .update(aiGeneratedContent)
        .set({
          status: "applied",
          appliedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(aiGeneratedContent.id, id));

      return updatedProduct;
    } catch (error) {
      console.error("Error applying AI generated content:", error);
      throw error;
    }
  }

  // Wishlist Operations
  async getWishlistItems(
    userId: number
  ): Promise<
    { id: number; product: Product; userId: number; dateAdded: Date }[]
  > {
    try {
      console.log("Getting wishlist items for user:", userId);

      const wishlistWithProducts = await db
        .select({
          id: wishlists.id,
          userId: wishlists.userId,
          dateAdded: wishlists.dateAdded,
          product: products,
        })
        .from(wishlists)
        .where(eq(wishlists.userId, userId))
        .innerJoin(products, eq(wishlists.productId, products.id));

      console.log(`Found ${wishlistWithProducts.length} items in wishlist`);

      return wishlistWithProducts.map((item) => ({
        id: item.id,
        userId: item.userId,
        dateAdded: item.dateAdded,
        product: item.product,
      }));
    } catch (error) {
      console.error("Error in getWishlistItems:", error);
      return [];
    }
  }

  async addToWishlist(insertWishlist: InsertWishlist): Promise<Wishlist> {
    try {
      console.log("Adding to wishlist:", insertWishlist);

      // First check if product already exists in wishlist
      const [existingWishlistItem] = await db
        .select()
        .from(wishlists)
        .where(
          and(
            eq(wishlists.userId, insertWishlist.userId),
            eq(wishlists.productId, insertWishlist.productId)
          )
        );

      // If it already exists, just return it
      if (existingWishlistItem) {
        console.log("Product already in wishlist");
        return existingWishlistItem;
      }

      // Otherwise insert new wishlist item
      const [wishlistItem] = await db
        .insert(wishlists)
        .values(insertWishlist)
        .returning();

      console.log("Added item to wishlist:", wishlistItem);
      return wishlistItem;
    } catch (error) {
      console.error("Error in addToWishlist:", error);
      throw error;
    }
  }

  async getWishlistItem(
    userId: number,
    productId: number
  ): Promise<Wishlist | undefined> {
    try {
      console.log("Getting wishlist item:", { userId, productId });

      const [wishlistItem] = await db
        .select()
        .from(wishlists)
        .where(
          and(eq(wishlists.userId, userId), eq(wishlists.productId, productId))
        );

      return wishlistItem;
    } catch (error) {
      console.error("Error in getWishlistItem:", error);
      throw error;
    }
  }

  async removeFromWishlist(userId: number, productId: number): Promise<void> {
    try {
      console.log("Removing item from wishlist:", { userId, productId });
      await db
        .delete(wishlists)
        .where(
          and(eq(wishlists.userId, userId), eq(wishlists.productId, productId))
        );
      console.log("Removed item from wishlist");
    } catch (error) {
      console.error("Error in removeFromWishlist:", error);
      throw error;
    }
  }

  async clearWishlist(userId: number): Promise<void> {
    try {
      console.log("Clearing wishlist for user:", userId);
      await db.delete(wishlists).where(eq(wishlists.userId, userId));
      console.log("Cleared wishlist");
    } catch (error) {
      console.error("Error in clearWishlist:", error);
      throw error;
    }
  }

  async isProductInWishlist(
    userId: number,
    productId: number
  ): Promise<boolean> {
    try {
      console.log("Checking if product is in wishlist:", { userId, productId });

      const [existingWishlistItem] = await db
        .select()
        .from(wishlists)
        .where(
          and(eq(wishlists.userId, userId), eq(wishlists.productId, productId))
        );

      const result = !!existingWishlistItem;
      console.log("Product in wishlist:", result);
      return result;
    } catch (error) {
      console.error("Error in isProductInWishlist:", error);
      return false;
    }
  }

  // Banner Management Methods
  async getBanners(active?: boolean): Promise<Banner[]> {
    try {
      let query = db.select().from(banners);

      if (active !== undefined) {
        query = query.where(eq(banners.active, active));
      }

      return await query.orderBy(banners.position);
    } catch (error) {
      console.error("Error in getBanners:", error);
      return [];
    }
  }

  async getBanner(id: number): Promise<Banner | undefined> {
    try {
      const [banner] = await db
        .select()
        .from(banners)
        .where(eq(banners.id, id));
      return banner;
    } catch (error) {
      console.error(`Error getting banner with ID ${id}:`, error);
      return undefined;
    }
  }

  async createBanner(insertBanner: InsertBanner): Promise<Banner> {
    try {
      // Set position to be at the end if not provided
      if (!insertBanner.position) {
        const lastBanners = await db
          .select()
          .from(banners)
          .orderBy(desc(banners.position))
          .limit(1);

        const lastPosition =
          lastBanners.length > 0 ? lastBanners[0].position : 0;
        insertBanner.position = lastPosition + 1;
      }

      const [banner] = await db
        .insert(banners)
        .values({
          ...insertBanner,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return banner;
    } catch (error) {
      console.error("Error creating banner:", error);
      throw new Error("Failed to create banner");
    }
  }

  async updateBanner(id: number, updateData: Partial<Banner>): Promise<Banner> {
    try {
      // Use sanitizeTimestampFields to remove createdAt and updatedAt fields
      const cleanUpdateData = this.sanitizeTimestampFields(updateData);

      // Log the cleaned data for debugging
      console.log(`Cleaned banner data for update ID ${id}:`, cleanUpdateData);

      // Make absolutely sure the data is valid for the database
      // Convert any fields that might cause type issues
      if (typeof cleanUpdateData.position === "string") {
        cleanUpdateData.position = parseInt(cleanUpdateData.position);
      }

      if (cleanUpdateData.productId === "" || cleanUpdateData.productId === 0) {
        cleanUpdateData.productId = null;
      }

      const [banner] = await db
        .update(banners)
        .set({
          ...cleanUpdateData,
          updatedAt: new Date(), // Always use a fresh Date object
        })
        .where(eq(banners.id, id))
        .returning();

      if (!banner) {
        throw new Error(`Banner with ID ${id} not found`);
      }

      return banner;
    } catch (error) {
      console.error(`Error updating banner ${id}:`, error);
      // Pass the original error message for better debugging
      if (error instanceof Error) {
        throw new Error(`Failed to update banner: ${error.message}`);
      } else {
        throw new Error("Failed to update banner");
      }
    }
  }

  async deleteBanner(id: number): Promise<void> {
    try {
      await db.delete(banners).where(eq(banners.id, id));

      // Re-order remaining banners to maintain consistent position values
      const remainingBanners = await db
        .select()
        .from(banners)
        .orderBy(banners.position);

      for (let i = 0; i < remainingBanners.length; i++) {
        await db
          .update(banners)
          .set({ position: i + 1 })
          .where(eq(banners.id, remainingBanners[i].id));
      }
    } catch (error) {
      console.error(`Error deleting banner ${id}:`, error);
      throw new Error("Failed to delete banner");
    }
  }

  async updateBannerPosition(id: number, position: number): Promise<Banner> {
    try {
      // Get the current position of the banner
      const [banner] = await db
        .select()
        .from(banners)
        .where(eq(banners.id, id));

      if (!banner) {
        throw new Error(`Banner with ID ${id} not found`);
      }

      const currentPosition = banner.position;

      // Get all banners
      const allBanners = await db
        .select()
        .from(banners)
        .orderBy(banners.position);

      // Update positions
      if (position < currentPosition) {
        // Moving up - increase position of banners between new and old position
        for (const b of allBanners) {
          if (b.position >= position && b.position < currentPosition) {
            await db
              .update(banners)
              .set({ position: b.position + 1 })
              .where(eq(banners.id, b.id));
          }
        }
      } else if (position > currentPosition) {
        // Moving down - decrease position of banners between old and new position
        for (const b of allBanners) {
          if (b.position > currentPosition && b.position <= position) {
            await db
              .update(banners)
              .set({ position: b.position - 1 })
              .where(eq(banners.id, b.id));
          }
        }
      }

      // Update the position of the target banner
      const [updatedBanner] = await db
        .update(banners)
        .set({
          position,
          updatedAt: new Date(),
        })
        .where(eq(banners.id, id))
        .returning();

      return updatedBanner;
    } catch (error) {
      console.error(`Error updating banner position ${id}:`, error);
      throw new Error("Failed to update banner position");
    }
  }

  async toggleBannerActive(id: number): Promise<Banner> {
    try {
      const [banner] = await db
        .select()
        .from(banners)
        .where(eq(banners.id, id));

      if (!banner) {
        throw new Error(`Banner with ID ${id} not found`);
      }

      const [updatedBanner] = await db
        .update(banners)
        .set({
          active: !banner.active,
          updatedAt: new Date(),
        })
        .where(eq(banners.id, id))
        .returning();

      return updatedBanner;
    } catch (error) {
      console.error(`Error toggling banner active state ${id}:`, error);
      throw new Error("Failed to toggle banner active state");
    }
  }

  // Footer Content Methods
  async getFooterContents(
    section?: string,
    isActive?: boolean
  ): Promise<FooterContent[]> {
    try {
      let query = db.select().from(footerContent);

      if (section) {
        query = query.where(eq(footerContent.section, section));
      }

      if (isActive !== undefined) {
        query = query.where(eq(footerContent.isActive, isActive));
      }

      // Always return in order by section and order
      return await query.orderBy(footerContent.section, footerContent.order);
    } catch (error) {
      console.error("Error getting footer contents:", error);
      return [];
    }
  }

  async getFooterContentById(id: number): Promise<FooterContent | undefined> {
    try {
      const [content] = await db
        .select()
        .from(footerContent)
        .where(eq(footerContent.id, id));
      return content;
    } catch (error) {
      console.error(`Error getting footer content with ID ${id}:`, error);
      return undefined;
    }
  }

  async createFooterContent(
    content: InsertFooterContent
  ): Promise<FooterContent> {
    try {
      const [newContent] = await db
        .insert(footerContent)
        .values({
          ...content,
          lastUpdated: new Date(),
        })
        .returning();
      return newContent;
    } catch (error) {
      console.error("Error creating footer content:", error);
      throw new Error("Failed to create footer content");
    }
  }

  async updateFooterContent(
    id: number,
    content: Partial<FooterContent>
  ): Promise<FooterContent> {
    try {
      const [existingContent] = await db
        .select()
        .from(footerContent)
        .where(eq(footerContent.id, id));

      if (!existingContent) {
        throw new Error(`Footer content with ID ${id} not found`);
      }

      const [updatedContent] = await db
        .update(footerContent)
        .set({
          ...content,
          lastUpdated: new Date(),
        })
        .where(eq(footerContent.id, id))
        .returning();

      return updatedContent;
    } catch (error) {
      console.error(`Error updating footer content ${id}:`, error);
      throw new Error("Failed to update footer content");
    }
  }

  async deleteFooterContent(id: number): Promise<void> {
    try {
      await db.delete(footerContent).where(eq(footerContent.id, id));
    } catch (error) {
      console.error(`Error deleting footer content ${id}:`, error);
      throw new Error("Failed to delete footer content");
    }
  }

  async toggleFooterContentActive(id: number): Promise<FooterContent> {
    try {
      const [content] = await db
        .select()
        .from(footerContent)
        .where(eq(footerContent.id, id));

      if (!content) {
        throw new Error(`Footer content with ID ${id} not found`);
      }

      const [updatedContent] = await db
        .update(footerContent)
        .set({
          isActive: !content.isActive,
          lastUpdated: new Date(),
        })
        .where(eq(footerContent.id, id))
        .returning();

      return updatedContent;
    } catch (error) {
      console.error(
        `Error toggling footer content active state for ID ${id}:`,
        error
      );
      throw new Error("Failed to toggle footer content active state");
    }
  }

  async updateFooterContentOrder(
    id: number,
    order: number
  ): Promise<FooterContent> {
    try {
      const [content] = await db
        .select()
        .from(footerContent)
        .where(eq(footerContent.id, id));

      if (!content) {
        throw new Error(`Footer content with ID ${id} not found`);
      }

      const [updatedContent] = await db
        .update(footerContent)
        .set({
          order,
          lastUpdated: new Date(),
        })
        .where(eq(footerContent.id, id))
        .returning();

      return updatedContent;
    } catch (error) {
      console.error(`Error updating footer content order for ID ${id}:`, error);
      throw new Error("Failed to update footer content order");
    }
  }

  // Product Display Settings Methods
  async getProductDisplaySettings(): Promise<
    ProductDisplaySettings | undefined
  > {
    try {
      // Get the active settings, or just the first record if none are active
      const settings = await db
        .select()
        .from(productDisplaySettings)
        .where(eq(productDisplaySettings.isActive, true))
        .limit(1);

      if (settings.length === 0) {
        // If no active settings, get the most recently created one
        const allSettings = await db
          .select()
          .from(productDisplaySettings)
          .orderBy(desc(productDisplaySettings.createdAt))
          .limit(1);

        return allSettings[0];
      }

      return settings[0];
    } catch (error) {
      console.error("Error getting product display settings:", error);
      return undefined;
    }
  }

  async createProductDisplaySettings(
    settings: InsertProductDisplaySettings
  ): Promise<ProductDisplaySettings> {
    try {
      // If this is being set as active, deactivate all other settings first
      if (settings.isActive) {
        await db.update(productDisplaySettings).set({ isActive: false });
      }

      const [newSettings] = await db
        .insert(productDisplaySettings)
        .values({
          ...settings,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return newSettings;
    } catch (error) {
      console.error("Error creating product display settings:", error);
      throw new Error("Failed to create product display settings");
    }
  }

  async updateProductDisplaySettings(
    id: number,
    settings: Partial<ProductDisplaySettings>
  ): Promise<ProductDisplaySettings> {
    try {
      // If this is being set as active, deactivate all other settings first
      if (settings.isActive) {
        await db
          .update(productDisplaySettings)
          .set({ isActive: false })
          .where(sql`id != ${id}`);
      }

      const [updatedSettings] = await db
        .update(productDisplaySettings)
        .set({
          ...settings,
          updatedAt: new Date(),
        })
        .where(eq(productDisplaySettings.id, id))
        .returning();

      if (!updatedSettings) {
        throw new Error(`Product display settings with ID ${id} not found`);
      }

      return updatedSettings;
    } catch (error) {
      console.error(`Error updating product display settings ${id}:`, error);
      throw new Error("Failed to update product display settings");
    }
  }

  // Shipping Methods methods
  async getShippingMethods(): Promise<ShippingMethod[]> {
    try {
      return await db.select().from(shippingMethods);
    } catch (error) {
      console.error("Error getting shipping methods:", error);
      return [];
    }
  }

  async getShippingMethodById(id: number): Promise<ShippingMethod | undefined> {
    try {
      const [method] = await db
        .select()
        .from(shippingMethods)
        .where(eq(shippingMethods.id, id));
      return method;
    } catch (error) {
      console.error(`Error getting shipping method with ID ${id}:`, error);
      return undefined;
    }
  }

  async createShippingMethod(
    method: InsertShippingMethod
  ): Promise<ShippingMethod> {
    try {
      const [newMethod] = await db
        .insert(shippingMethods)
        .values(method)
        .returning();
      return newMethod;
    } catch (error) {
      console.error("Error creating shipping method:", error);
      throw new Error("Failed to create shipping method");
    }
  }

  async updateShippingMethod(
    id: number,
    method: Partial<ShippingMethod>
  ): Promise<ShippingMethod> {
    try {
      const [updatedMethod] = await db
        .update(shippingMethods)
        .set(method)
        .where(eq(shippingMethods.id, id))
        .returning();

      if (!updatedMethod) {
        throw new Error(`Shipping method with ID ${id} not found`);
      }

      return updatedMethod;
    } catch (error) {
      console.error(`Error updating shipping method with ID ${id}:`, error);
      throw new Error("Failed to update shipping method");
    }
  }

  async deleteShippingMethod(id: number): Promise<void> {
    try {
      // Check if there are any shipping rules using this method
      const rules = await this.getShippingRulesByMethod(id);
      if (rules.length > 0) {
        throw new Error(
          "Cannot delete shipping method that is in use by shipping rules"
        );
      }

      // Check if there are any seller settings using this method
      const query = `
        SELECT EXISTS (
          SELECT 1 FROM seller_shipping_settings
          WHERE default_shipping_method_id = $1
        ) as exists
      `;

      const { rows } = await pool.query(query, [id]);
      if (rows[0].exists) {
        throw new Error(
          "Cannot delete shipping method that is in use in seller settings"
        );
      }

      await db.delete(shippingMethods).where(eq(shippingMethods.id, id));
    } catch (error) {
      console.error(`Error deleting shipping method with ID ${id}:`, error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to delete shipping method"
      );
    }
  }

  // Shipping Zones methods
  async getShippingZones(): Promise<ShippingZone[]> {
    try {
      return await db.select().from(shippingZones);
    } catch (error) {
      console.error("Error getting shipping zones:", error);
      return [];
    }
  }

  async getShippingZoneById(id: number): Promise<ShippingZone | undefined> {
    try {
      const [zone] = await db
        .select()
        .from(shippingZones)
        .where(eq(shippingZones.id, id));
      return zone;
    } catch (error) {
      console.error(`Error getting shipping zone with ID ${id}:`, error);
      return undefined;
    }
  }

  async createShippingZone(zone: InsertShippingZone): Promise<ShippingZone> {
    try {
      const [newZone] = await db.insert(shippingZones).values(zone).returning();
      return newZone;
    } catch (error) {
      console.error("Error creating shipping zone:", error);
      throw new Error("Failed to create shipping zone");
    }
  }

  async updateShippingZone(
    id: number,
    zone: Partial<ShippingZone>
  ): Promise<ShippingZone> {
    try {
      const [updatedZone] = await db
        .update(shippingZones)
        .set(zone)
        .where(eq(shippingZones.id, id))
        .returning();

      if (!updatedZone) {
        throw new Error(`Shipping zone with ID ${id} not found`);
      }

      return updatedZone;
    } catch (error) {
      console.error(`Error updating shipping zone with ID ${id}:`, error);
      throw new Error("Failed to update shipping zone");
    }
  }

  async deleteShippingZone(id: number): Promise<void> {
    try {
      // Check if there are any shipping rules using this zone
      const rules = await this.getShippingRulesByZone(id);
      if (rules.length > 0) {
        throw new Error(
          "Cannot delete shipping zone that is in use by shipping rules"
        );
      }

      await db.delete(shippingZones).where(eq(shippingZones.id, id));
    } catch (error) {
      console.error(`Error deleting shipping zone with ID ${id}:`, error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to delete shipping zone"
      );
    }
  }

  // Shipping Rules methods
  async getShippingRules(): Promise<ShippingRule[]> {
    try {
      return await db.select().from(shippingRules);
    } catch (error) {
      console.error("Error getting shipping rules:", error);
      return [];
    }
  }

  async getShippingRuleById(id: number): Promise<ShippingRule | undefined> {
    try {
      const [rule] = await db
        .select()
        .from(shippingRules)
        .where(eq(shippingRules.id, id));
      return rule;
    } catch (error) {
      console.error(`Error getting shipping rule with ID ${id}:`, error);
      return undefined;
    }
  }

  async getShippingRulesByMethod(methodId: number): Promise<ShippingRule[]> {
    try {
      return await db
        .select()
        .from(shippingRules)
        .where(eq(shippingRules.methodId, methodId));
    } catch (error) {
      console.error(
        `Error getting shipping rules for method ID ${methodId}:`,
        error
      );
      return [];
    }
  }

  // For compatibility with shipping handlers
  async getShippingRulesByMethodId(methodId: number): Promise<ShippingRule[]> {
    return this.getShippingRulesByMethod(methodId);
  }

  async getShippingRulesByZone(zoneId: number): Promise<ShippingRule[]> {
    try {
      return await db
        .select()
        .from(shippingRules)
        .where(eq(shippingRules.zoneId, zoneId));
    } catch (error) {
      console.error(
        `Error getting shipping rules for zone ID ${zoneId}:`,
        error
      );
      return [];
    }
  }

  // For compatibility with shipping handlers
  async getShippingRulesByZoneId(zoneId: number): Promise<ShippingRule[]> {
    return this.getShippingRulesByZone(zoneId);
  }

  // For compatibility with shipping handlers
  async getShippingRulesByMethodAndZone(
    methodId: number,
    zoneId: number
  ): Promise<ShippingRule[]> {
    try {
      return await db
        .select()
        .from(shippingRules)
        .where(
          and(
            eq(shippingRules.methodId, methodId),
            eq(shippingRules.zoneId, zoneId)
          )
        );
    } catch (error) {
      console.error(
        `Error getting shipping rules for method ID ${methodId} and zone ID ${zoneId}:`,
        error
      );
      return [];
    }
  }

  async createShippingRule(rule: InsertShippingRule): Promise<ShippingRule> {
    try {
      // Validate that the method and zone exist
      const method = await this.getShippingMethodById(rule.methodId);
      if (!method) {
        throw new Error(`Shipping method with ID ${rule.methodId} not found`);
      }

      const zone = await this.getShippingZoneById(rule.zoneId);
      if (!zone) {
        throw new Error(`Shipping zone with ID ${rule.zoneId} not found`);
      }

      // Check for duplicates
      const existingRules = await db
        .select()
        .from(shippingRules)
        .where(
          and(
            eq(shippingRules.methodId, rule.methodId),
            eq(shippingRules.zoneId, rule.zoneId)
          )
        );

      if (existingRules.length > 0) {
        throw new Error(
          `A shipping rule for method ID ${rule.methodId} and zone ID ${rule.zoneId} already exists`
        );
      }

      const [newRule] = await db.insert(shippingRules).values(rule).returning();
      return newRule;
    } catch (error) {
      console.error("Error creating shipping rule:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to create shipping rule"
      );
    }
  }

  async updateShippingRule(
    id: number,
    rule: Partial<ShippingRule>
  ): Promise<ShippingRule> {
    try {
      // If updating methodId or zoneId, validate they exist
      if (rule.methodId) {
        const method = await this.getShippingMethodById(rule.methodId);
        if (!method) {
          throw new Error(`Shipping method with ID ${rule.methodId} not found`);
        }
      }

      if (rule.zoneId) {
        const zone = await this.getShippingZoneById(rule.zoneId);
        if (!zone) {
          throw new Error(`Shipping zone with ID ${rule.zoneId} not found`);
        }
      }

      // If updating both methodId and zoneId, check for duplicates
      if (rule.methodId && rule.zoneId) {
        const existingRules = await db
          .select()
          .from(shippingRules)
          .where(
            and(
              eq(shippingRules.methodId, rule.methodId),
              eq(shippingRules.zoneId, rule.zoneId),
              sql`${shippingRules.id} != ${id}`
            )
          );

        if (existingRules.length > 0) {
          throw new Error(
            `A shipping rule for method ID ${rule.methodId} and zone ID ${rule.zoneId} already exists`
          );
        }
      }

      const [updatedRule] = await db
        .update(shippingRules)
        .set(rule)
        .where(eq(shippingRules.id, id))
        .returning();

      if (!updatedRule) {
        throw new Error(`Shipping rule with ID ${id} not found`);
      }

      return updatedRule;
    } catch (error) {
      console.error(`Error updating shipping rule with ID ${id}:`, error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to update shipping rule"
      );
    }
  }

  async deleteShippingRule(id: number): Promise<void> {
    try {
      await db.delete(shippingRules).where(eq(shippingRules.id, id));
    } catch (error) {
      console.error(`Error deleting shipping rule with ID ${id}:`, error);
      throw new Error("Failed to delete shipping rule");
    }
  }

  // Seller Shipping Settings methods
  async getSellerShippingSettings(
    sellerId: number
  ): Promise<SellerShippingSetting | undefined> {
    try {
      const [settings] = await db
        .select()
        .from(sellerShippingSettings)
        .where(eq(sellerShippingSettings.sellerId, sellerId));
      return settings;
    } catch (error) {
      console.error(
        `Error getting shipping settings for seller ID ${sellerId}:`,
        error
      );
      return undefined;
    }
  }

  async createSellerShippingSettings(
    settings: InsertSellerShippingSetting
  ): Promise<SellerShippingSetting> {
    try {
      // Validate that the default shipping method exists if provided
      if (settings.defaultShippingMethodId) {
        const method = await this.getShippingMethodById(
          settings.defaultShippingMethodId
        );
        if (!method) {
          throw new Error(
            `Shipping method with ID ${settings.defaultShippingMethodId} not found`
          );
        }
      }

      // Check if settings already exist for this seller
      const existingSettings = await this.getSellerShippingSettings(
        settings.sellerId
      );
      if (existingSettings) {
        throw new Error(
          `Shipping settings for seller ID ${settings.sellerId} already exist`
        );
      }

      const [newSettings] = await db
        .insert(sellerShippingSettings)
        .values(settings)
        .returning();
      return newSettings;
    } catch (error) {
      console.error("Error creating seller shipping settings:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to create seller shipping settings"
      );
    }
  }

  async updateSellerShippingSettings(
    sellerId: number,
    settings: Partial<SellerShippingSetting>
  ): Promise<SellerShippingSetting> {
    try {
      // Validate that the default shipping method exists if provided
      if (settings.defaultShippingMethodId) {
        const method = await this.getShippingMethodById(
          settings.defaultShippingMethodId
        );
        if (!method) {
          throw new Error(
            `Shipping method with ID ${settings.defaultShippingMethodId} not found`
          );
        }
      }

      // Check if settings exist for this seller
      const existingSettings = await this.getSellerShippingSettings(sellerId);
      if (!existingSettings) {
        // Create new settings if they don't exist
        return await this.createSellerShippingSettings({
          sellerId,
          enableCustomShipping: settings.enableCustomShipping ?? false,
          defaultShippingMethodId: settings.defaultShippingMethodId,
          freeShippingThreshold: settings.freeShippingThreshold,
          processingTime: settings.processingTime || "1-2 business days",
          shippingPolicy: settings.shippingPolicy,
          returnPolicy: settings.returnPolicy,
          internationalShipping: settings.internationalShipping ?? false,
        });
      }

      // Update existing settings
      const [updatedSettings] = await db
        .update(sellerShippingSettings)
        .set(settings)
        .where(eq(sellerShippingSettings.sellerId, sellerId))
        .returning();

      if (!updatedSettings) {
        throw new Error(
          `Failed to update shipping settings for seller ID ${sellerId}`
        );
      }

      return updatedSettings;
    } catch (error) {
      console.error(
        `Error updating shipping settings for seller ID ${sellerId}:`,
        error
      );
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to update seller shipping settings"
      );
    }
  }

  // Product Shipping Overrides methods
  async getProductShippingOverrides(
    sellerId: number
  ): Promise<ProductShippingOverride[]> {
    try {
      return await db
        .select()
        .from(productShippingOverrides)
        .where(eq(productShippingOverrides.sellerId, sellerId));
    } catch (error) {
      console.error(
        `Error getting product shipping overrides for seller ID ${sellerId}:`,
        error
      );
      return [];
    }
  }

  async getProductShippingOverrideById(
    id: number
  ): Promise<ProductShippingOverride | undefined> {
    try {
      const [override] = await db
        .select()
        .from(productShippingOverrides)
        .where(eq(productShippingOverrides.id, id));
      return override;
    } catch (error) {
      console.error(
        `Error getting product shipping override with ID ${id}:`,
        error
      );
      return undefined;
    }
  }

  async getProductShippingOverrideByProduct(
    productId: number
  ): Promise<ProductShippingOverride | undefined> {
    try {
      const [override] = await db
        .select()
        .from(productShippingOverrides)
        .where(eq(productShippingOverrides.productId, productId));
      return override;
    } catch (error) {
      console.error(
        `Error getting product shipping override for product ID ${productId}:`,
        error
      );
      return undefined;
    }
  }

  async createProductShippingOverride(
    override: InsertProductShippingOverride
  ): Promise<ProductShippingOverride> {
    try {
      // Validate that the product exists
      const product = await this.getProduct(override.productId);
      if (!product) {
        throw new Error(`Product with ID ${override.productId} not found`);
      }

      // Check if the seller owns the product
      if (product.sellerId !== override.sellerId) {
        throw new Error(
          `Seller ID ${override.sellerId} does not own product ID ${override.productId}`
        );
      }

      // Check if an override already exists for this product
      const existingOverride = await this.getProductShippingOverrideByProduct(
        override.productId
      );
      if (existingOverride) {
        throw new Error(
          `Shipping override for product ID ${override.productId} already exists`
        );
      }

      const [newOverride] = await db
        .insert(productShippingOverrides)
        .values(override)
        .returning();
      return newOverride;
    } catch (error) {
      console.error("Error creating product shipping override:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to create product shipping override"
      );
    }
  }

  async updateProductShippingOverride(
    id: number,
    override: Partial<ProductShippingOverride>
  ): Promise<ProductShippingOverride> {
    try {
      // Validate product ID if provided
      if (override.productId) {
        const product = await this.getProduct(override.productId);
        if (!product) {
          throw new Error(`Product with ID ${override.productId} not found`);
        }

        // If sellerId is provided, check that seller owns the product
        if (override.sellerId && product.sellerId !== override.sellerId) {
          throw new Error(
            `Seller ID ${override.sellerId} does not own product ID ${override.productId}`
          );
        }

        // If seller ID isn't being updated, ensure seller still owns the product
        const existingOverride = await this.getProductShippingOverrideById(id);
        if (
          existingOverride &&
          !override.sellerId &&
          product.sellerId !== existingOverride.sellerId
        ) {
          throw new Error(
            `Current seller (ID ${existingOverride.sellerId}) does not own product ID ${override.productId}`
          );
        }
      }

      const [updatedOverride] = await db
        .update(productShippingOverrides)
        .set(override)
        .where(eq(productShippingOverrides.id, id))
        .returning();

      if (!updatedOverride) {
        throw new Error(`Product shipping override with ID ${id} not found`);
      }

      return updatedOverride;
    } catch (error) {
      console.error(
        `Error updating product shipping override with ID ${id}:`,
        error
      );
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to update product shipping override"
      );
    }
  }

  async deleteProductShippingOverride(id: number): Promise<void> {
    try {
      await db
        .delete(productShippingOverrides)
        .where(eq(productShippingOverrides.id, id));
    } catch (error) {
      console.error(
        `Error deleting product shipping override with ID ${id}:`,
        error
      );
      throw new Error("Failed to delete product shipping override");
    }
  }

  // Shipping Tracking methods
  async getShippingTracking(
    orderId: number
  ): Promise<ShippingTracking | undefined> {
    try {
      const [tracking] = await db
        .select()
        .from(shippingTracking)
        .where(eq(shippingTracking.orderId, orderId));
      return tracking;
    } catch (error) {
      console.error(
        `Error getting shipping tracking for order ID ${orderId}:`,
        error
      );
      return undefined;
    }
  }

  async createShippingTracking(
    tracking: InsertShippingTracking
  ): Promise<ShippingTracking> {
    try {
      // Validate that the order exists
      const order = await this.getOrder(tracking.orderId);
      if (!order) {
        throw new Error(`Order with ID ${tracking.orderId} not found`);
      }

      // Check if tracking already exists for this order
      const existingTracking = await this.getShippingTracking(tracking.orderId);
      if (existingTracking) {
        throw new Error(
          `Shipping tracking for order ID ${tracking.orderId} already exists`
        );
      }

      const [newTracking] = await db
        .insert(shippingTracking)
        .values(tracking)
        .returning();
      return newTracking;
    } catch (error) {
      console.error("Error creating shipping tracking:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to create shipping tracking"
      );
    }
  }

  async updateShippingTracking(
    id: number,
    tracking: Partial<ShippingTracking>
  ): Promise<ShippingTracking> {
    try {
      // If orderId is being updated, validate that the order exists
      if (tracking.orderId) {
        const order = await this.getOrder(tracking.orderId);
        if (!order) {
          throw new Error(`Order with ID ${tracking.orderId} not found`);
        }

        // Check if tracking already exists for the new order
        const existingTracking = await this.getShippingTracking(
          tracking.orderId
        );
        if (existingTracking && existingTracking.id !== id) {
          throw new Error(
            `Shipping tracking for order ID ${tracking.orderId} already exists`
          );
        }
      }

      const [updatedTracking] = await db
        .update(shippingTracking)
        .set({
          ...tracking,
          updatedAt: new Date(),
        })
        .where(eq(shippingTracking.id, id))
        .returning();

      if (!updatedTracking) {
        throw new Error(`Shipping tracking with ID ${id} not found`);
      }

      return updatedTracking;
    } catch (error) {
      console.error(`Error updating shipping tracking with ID ${id}:`, error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to update shipping tracking"
      );
    }
  }

  // For backward compatibility with existing code
  async getOrderShippingTracking(
    orderId: number
  ): Promise<ShippingTracking | undefined> {
    return this.getShippingTracking(orderId);
  }

  async createOrderShippingTracking(
    tracking: InsertShippingTracking
  ): Promise<ShippingTracking> {
    return this.createShippingTracking(tracking);
  }

  async updateOrderShippingTracking(
    id: number,
    tracking: Partial<ShippingTracking>
  ): Promise<ShippingTracking> {
    return this.updateShippingTracking(id, tracking);
  }

  // Returns Management
  async getReturnsForSeller(sellerId: number): Promise<Return[]> {
    try {
      return await db
        .select()
        .from(returns)
        .where(eq(returns.sellerId, sellerId))
        .orderBy(desc(returns.returnDate));
    } catch (error) {
      console.error(`Error getting returns for seller ID ${sellerId}:`, error);
      return [];
    }
  }

  async getReturnById(id: number): Promise<Return | undefined> {
    try {
      const [returnData] = await db
        .select()
        .from(returns)
        .where(eq(returns.id, id));
      return returnData;
    } catch (error) {
      console.error(`Error getting return with ID ${id}:`, error);
      return undefined;
    }
  }

  async createReturn(returnData: InsertReturn): Promise<Return> {
    try {
      const [newReturn] = await db
        .insert(returns)
        .values(returnData)
        .returning();
      return newReturn;
    } catch (error) {
      console.error("Error creating return:", error);
      throw new Error("Failed to create return");
    }
  }

  async updateReturnStatus(
    id: number,
    returnStatus: string,
    refundStatus?: string
  ): Promise<Return> {
    try {
      const updateData: any = { returnStatus, updatedAt: new Date() };
      if (refundStatus) {
        updateData.refundStatus = refundStatus;
        if (refundStatus === "processed") {
          updateData.refundDate = new Date();
        }
      }

      const [updatedReturn] = await db
        .update(returns)
        .set(updateData)
        .where(eq(returns.id, id))
        .returning();

      if (!updatedReturn) {
        throw new Error(`Return with ID ${id} not found`);
      }

      return updatedReturn;
    } catch (error) {
      console.error(`Error updating return status for ID ${id}:`, error);
      throw new Error("Failed to update return status");
    }
  }

  // Analytics Management
  async getSellerAnalytics(
    sellerId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<SellerAnalytic[]> {
    try {
      let query = db
        .select()
        .from(sellerAnalytics)
        .where(eq(sellerAnalytics.sellerId, sellerId));

      if (startDate) {
        query = query.where(sql`${sellerAnalytics.date} >= ${startDate}`);
      }

      if (endDate) {
        query = query.where(sql`${sellerAnalytics.date} <= ${endDate}`);
      }

      return await query.orderBy(sellerAnalytics.date);
    } catch (error) {
      console.error(
        `Error getting analytics for seller ID ${sellerId}:`,
        error
      );
      return [];
    }
  }

  async createOrUpdateSellerAnalytics(
    data: InsertSellerAnalytic
  ): Promise<SellerAnalytic> {
    try {
      // Check if there's an existing record for this date
      const [existing] = await db
        .select()
        .from(sellerAnalytics)
        .where(eq(sellerAnalytics.sellerId, data.sellerId))
        .where(sql`${sellerAnalytics.date} = ${data.date}`);

      if (existing) {
        // Update existing record
        const [updated] = await db
          .update(sellerAnalytics)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(sellerAnalytics.id, existing.id))
          .returning();

        return updated;
      } else {
        // Create new record
        const [newRecord] = await db
          .insert(sellerAnalytics)
          .values(data)
          .returning();

        return newRecord;
      }
    } catch (error) {
      console.error("Error creating/updating analytics:", error);
      throw new Error("Failed to create/update analytics");
    }
  }

  // Payments Management
  async getSellerPayments(sellerId: number): Promise<SellerPayment[]> {
    try {
      return await db
        .select()
        .from(sellerPayments)
        .where(eq(sellerPayments.sellerId, sellerId))
        .orderBy(desc(sellerPayments.createdAt));
    } catch (error) {
      console.error(`Error getting payments for seller ID ${sellerId}:`, error);
      return [];
    }
  }

  async getSellerPaymentById(id: number): Promise<SellerPayment | undefined> {
    try {
      const [payment] = await db
        .select()
        .from(sellerPayments)
        .where(eq(sellerPayments.id, id));

      return payment;
    } catch (error) {
      console.error(`Error getting payment with ID ${id}:`, error);
      return undefined;
    }
  }

  async createSellerPayment(
    paymentData: InsertSellerPayment
  ): Promise<SellerPayment> {
    try {
      const [newPayment] = await db
        .insert(sellerPayments)
        .values(paymentData)
        .returning();

      return newPayment;
    } catch (error) {
      console.error("Error creating payment:", error);
      throw new Error("Failed to create payment");
    }
  }

  async updateSellerPayment(
    id: number,
    paymentData: Partial<InsertSellerPayment>
  ): Promise<SellerPayment> {
    try {
      const [updatedPayment] = await db
        .update(sellerPayments)
        .set({
          ...paymentData,
          updatedAt: new Date(),
        })
        .where(eq(sellerPayments.id, id))
        .returning();

      if (!updatedPayment) {
        throw new Error(`Payment with ID ${id} not found`);
      }

      return updatedPayment;
    } catch (error) {
      console.error(`Error updating payment with ID ${id}:`, error);
      throw new Error("Failed to update payment");
    }
  }

  // Settings Management
  async getSellerSettings(
    sellerId: number
  ): Promise<SellerSetting | undefined> {
    try {
      const [settings] = await db
        .select()
        .from(sellerSettings)
        .where(eq(sellerSettings.sellerId, sellerId));

      return settings;
    } catch (error) {
      console.error(`Error getting settings for seller ID ${sellerId}:`, error);
      return undefined;
    }
  }

  async createSellerSettings(
    settingsData: Partial<InsertSellerSetting>
  ): Promise<SellerSetting> {
    try {
      const [newSettings] = await db
        .insert(sellerSettings)
        .values(settingsData)
        .returning();

      return newSettings;
    } catch (error) {
      console.error(
        `Error creating settings for seller ID ${settingsData.sellerId}:`,
        error
      );
      throw new Error("Failed to create settings");
    }
  }

  async updateSellerSettings(
    sellerId: number,
    settingsData: Partial<InsertSellerSetting>
  ): Promise<SellerSetting> {
    try {
      const settings = await this.getSellerSettings(sellerId);

      if (!settings) {
        throw new Error(`No settings found for seller ID ${sellerId}`);
      }

      const [updatedSettings] = await db
        .update(sellerSettings)
        .set({
          ...settingsData,
          updatedAt: new Date(),
        })
        .where(eq(sellerSettings.id, settings.id))
        .returning();

      return updatedSettings;
    } catch (error) {
      console.error(
        `Error updating settings for seller ID ${sellerId}:`,
        error
      );
      throw new Error("Failed to update settings");
    }
  }

  async createOrUpdateSellerSettings(
    sellerId: number,
    settingsData: Partial<InsertSellerSetting>
  ): Promise<SellerSetting> {
    try {
      // Check if settings exist
      const existingSettings = await this.getSellerSettings(sellerId);

      if (existingSettings) {
        // Update existing settings
        const [updatedSettings] = await db
          .update(sellerSettings)
          .set({
            ...settingsData,
            updatedAt: new Date(),
          })
          .where(eq(sellerSettings.id, existingSettings.id))
          .returning();

        return updatedSettings;
      } else {
        // Create new settings
        const [newSettings] = await db
          .insert(sellerSettings)
          .values({
            sellerId,
            ...settingsData,
          })
          .returning();

        return newSettings;
      }
    } catch (error) {
      console.error(
        `Error creating/updating settings for seller ID ${sellerId}:`,
        error
      );
      throw new Error("Failed to create/update settings");
    }
  }

  // Support Management
  async getSellerSupportTickets(userId: number): Promise<SupportTicket[]> {
    try {
      return await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.userId, userId))
        .orderBy(desc(supportTickets.createdAt));
    } catch (error) {
      console.error(
        `Error getting support tickets for user ID ${userId}:`,
        error
      );
      return [];
    }
  }

  async getSupportTicketById(id: number): Promise<SupportTicket | undefined> {
    try {
      const [ticket] = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.id, id));

      return ticket;
    } catch (error) {
      console.error(`Error getting support ticket with ID ${id}:`, error);
      return undefined;
    }
  }

  async createSupportTicket(
    ticketData: InsertSupportTicket
  ): Promise<SupportTicket> {
    try {
      const [newTicket] = await db
        .insert(supportTickets)
        .values(ticketData)
        .returning();

      return newTicket;
    } catch (error) {
      console.error("Error creating support ticket:", error);
      throw new Error("Failed to create support ticket");
    }
  }

  async updateSupportTicket(
    id: number,
    ticketData: Partial<InsertSupportTicket>
  ): Promise<SupportTicket> {
    try {
      const [updatedTicket] = await db
        .update(supportTickets)
        .set({
          ...ticketData,
          updatedAt: new Date(),
        })
        .where(eq(supportTickets.id, id))
        .returning();

      if (!updatedTicket) {
        throw new Error(`Support ticket with ID ${id} not found`);
      }

      return updatedTicket;
    } catch (error) {
      console.error(`Error updating support ticket with ID ${id}:`, error);
      throw new Error("Failed to update support ticket");
    }
  }

  async getSupportMessages(ticketId: number): Promise<SupportMessage[]> {
    try {
      return await db
        .select()
        .from(supportMessages)
        .where(eq(supportMessages.ticketId, ticketId))
        .orderBy(supportMessages.createdAt);
    } catch (error) {
      console.error(
        `Error getting support messages for ticket ID ${ticketId}:`,
        error
      );
      return [];
    }
  }

  async createSupportMessage(
    messageData: InsertSupportMessage
  ): Promise<SupportMessage> {
    try {
      const [newMessage] = await db
        .insert(supportMessages)
        .values(messageData)
        .returning();

      // Update the ticket's updatedAt time
      await db
        .update(supportTickets)
        .set({ updatedAt: new Date() })
        .where(eq(supportTickets.id, messageData.ticketId));

      return newMessage;
    } catch (error) {
      console.error("Error creating support message:", error);
      throw new Error("Failed to create support message");
    }
  }

  // ========== Rewards Methods ==========
  async getUserRewards(userId: number): Promise<SelectReward | undefined> {
    try {
      const [userRewards] = await db
        .select()
        .from(rewards)
        .where(eq(rewards.userId, userId));
      return userRewards;
    } catch (error) {
      console.error(`Error getting user rewards: ${error}`);
      throw error;
    }
  }

  async createUserRewards(data: InsertReward): Promise<SelectReward> {
    try {
      const [userRewards] = await db.insert(rewards).values(data).returning();
      return userRewards;
    } catch (error) {
      console.error(`Error creating user rewards: ${error}`);
      throw error;
    }
  }

  async updateUserRewards(
    userId: number,
    data: Partial<InsertReward>
  ): Promise<SelectReward> {
    try {
      const [userRewards] = await db
        .update(rewards)
        .set({
          ...data,
          lastUpdated: new Date(),
        })
        .where(eq(rewards.userId, userId))
        .returning();
      return userRewards;
    } catch (error) {
      console.error(`Error updating user rewards: ${error}`);
      throw error;
    }
  }

  async getUserRewardTransactions(
    userId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ transactions: SelectRewardTransaction[]; total: number }> {
    try {
      const offset = (page - 1) * limit;

      const transactions = await db
        .select()
        .from(rewardTransactions)
        .where(eq(rewardTransactions.userId, userId))
        .orderBy(desc(rewardTransactions.transactionDate))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(rewardTransactions)
        .where(eq(rewardTransactions.userId, userId));

      return {
        transactions,
        total: Number(count),
      };
    } catch (error) {
      console.error(`Error getting user reward transactions: ${error}`);
      throw error;
    }
  }

  async createRewardTransaction(
    data: InsertRewardTransaction
  ): Promise<SelectRewardTransaction> {
    try {
      const [transaction] = await db
        .insert(rewardTransactions)
        .values(data)
        .returning();
      return transaction;
    } catch (error) {
      console.error(`Error creating reward transaction: ${error}`);
      throw error;
    }
  }

  async getRewardRules(): Promise<SelectRewardRule[]> {
    try {
      return await db.select().from(rewardRules);
    } catch (error) {
      console.error(`Error getting reward rules: ${error}`);
      throw error;
    }
  }

  async getRewardRule(id: number): Promise<SelectRewardRule | undefined> {
    try {
      const [rule] = await db
        .select()
        .from(rewardRules)
        .where(eq(rewardRules.id, id));
      return rule;
    } catch (error) {
      console.error(`Error getting reward rule: ${error}`);
      throw error;
    }
  }

  async createRewardRule(data: InsertRewardRule): Promise<SelectRewardRule> {
    try {
      const [rule] = await db.insert(rewardRules).values(data).returning();
      return rule;
    } catch (error) {
      console.error(`Error creating reward rule: ${error}`);
      throw error;
    }
  }

  async updateRewardRule(
    id: number,
    data: Partial<InsertRewardRule>
  ): Promise<SelectRewardRule> {
    try {
      const [rule] = await db
        .update(rewardRules)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(rewardRules.id, id))
        .returning();
      return rule;
    } catch (error) {
      console.error(`Error updating reward rule: ${error}`);
      throw error;
    }
  }

  async deleteRewardRule(id: number): Promise<void> {
    try {
      await db.delete(rewardRules).where(eq(rewardRules.id, id));
    } catch (error) {
      console.error(`Error deleting reward rule: ${error}`);
      throw error;
    }
  }

  async getRewardStatistics(): Promise<{
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    activeUsers: number;
  }> {
    try {
      // Get total points issued (positive transactions)
      const [issuedResult] = await db
        .select({
          total: sql<number>`sum(points)`,
        })
        .from(rewardTransactions)
        .where(sql`points > 0`);

      // Get total points redeemed (negative transactions)
      const [redeemedResult] = await db
        .select({
          total: sql<number>`sum(abs(points))`,
        })
        .from(rewardTransactions)
        .where(sql`points < 0`);

      // Get count of users with reward accounts
      const [usersResult] = await db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(rewards);

      return {
        totalPointsIssued: Number(issuedResult?.total || 0),
        totalPointsRedeemed: Number(redeemedResult?.total || 0),
        activeUsers: Number(usersResult?.count || 0),
      };
    } catch (error) {
      console.error(`Error getting reward statistics: ${error}`);
      throw error;
    }
  }

  // ========== Gift Card Methods ==========
  async getAllGiftCards(
    page: number = 1,
    limit: number = 10
  ): Promise<{ giftCards: SelectGiftCard[]; total: number }> {
    try {
      const offset = (page - 1) * limit;

      const giftCards = await db
        .select()
        .from(giftCards)
        .orderBy(desc(giftCards.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(giftCards);

      return {
        giftCards,
        total: Number(count),
      };
    } catch (error) {
      console.error(`Error getting all gift cards: ${error}`);
      throw error;
    }
  }

  async getUserGiftCards(userId: number): Promise<SelectGiftCard[]> {
    try {
      return await db
        .select()
        .from(giftCards)
        .where(
          or(eq(giftCards.issuedTo, userId), eq(giftCards.purchasedBy, userId))
        )
        .orderBy(desc(giftCards.createdAt));
    } catch (error) {
      console.error(`Error getting user gift cards: ${error}`);
      throw error;
    }
  }

  async getGiftCard(id: number): Promise<SelectGiftCard | undefined> {
    try {
      const [giftCard] = await db
        .select()
        .from(giftCards)
        .where(eq(giftCards.id, id));
      return giftCard;
    } catch (error) {
      console.error(`Error getting gift card: ${error}`);
      throw error;
    }
  }

  async getGiftCardByCode(code: string): Promise<SelectGiftCard | undefined> {
    try {
      const [giftCard] = await db
        .select()
        .from(giftCards)
        .where(eq(giftCards.code, code));
      return giftCard;
    } catch (error) {
      console.error(`Error getting gift card by code: ${error}`);
      throw error;
    }
  }

  async createGiftCard(data: InsertGiftCard): Promise<SelectGiftCard> {
    try {
      const [giftCard] = await db.insert(giftCards).values(data).returning();
      return giftCard;
    } catch (error) {
      console.error(`Error creating gift card: ${error}`);
      throw error;
    }
  }

  async updateGiftCard(
    id: number,
    data: Partial<InsertGiftCard>
  ): Promise<SelectGiftCard> {
    try {
      const [giftCard] = await db
        .update(giftCards)
        .set(data)
        .where(eq(giftCards.id, id))
        .returning();
      return giftCard;
    } catch (error) {
      console.error(`Error updating gift card: ${error}`);
      throw error;
    }
  }

  async createGiftCardTransaction(
    data: InsertGiftCardTransaction
  ): Promise<SelectGiftCardTransaction> {
    try {
      const [transaction] = await db
        .insert(giftCardTransactions)
        .values(data)
        .returning();
      return transaction;
    } catch (error) {
      console.error(`Error creating gift card transaction: ${error}`);
      throw error;
    }
  }

  async getGiftCardTemplates(): Promise<SelectGiftCardTemplate[]> {
    try {
      return await db.select().from(giftCardTemplates);
    } catch (error) {
      console.error(`Error getting gift card templates: ${error}`);
      throw error;
    }
  }

  async getGiftCardTemplate(
    id: number
  ): Promise<SelectGiftCardTemplate | undefined> {
    try {
      const [template] = await db
        .select()
        .from(giftCardTemplates)
        .where(eq(giftCardTemplates.id, id));
      return template;
    } catch (error) {
      console.error(`Error getting gift card template: ${error}`);
      throw error;
    }
  }

  async createGiftCardTemplate(
    data: InsertGiftCardTemplate
  ): Promise<SelectGiftCardTemplate> {
    try {
      const [template] = await db
        .insert(giftCardTemplates)
        .values(data)
        .returning();
      return template;
    } catch (error) {
      console.error(`Error creating gift card template: ${error}`);
      throw error;
    }
  }

  async updateGiftCardTemplate(
    id: number,
    data: Partial<InsertGiftCardTemplate>
  ): Promise<SelectGiftCardTemplate> {
    try {
      const [template] = await db
        .update(giftCardTemplates)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(giftCardTemplates.id, id))
        .returning();
      return template;
    } catch (error) {
      console.error(`Error updating gift card template: ${error}`);
      throw error;
    }
  }

  async deleteGiftCardTemplate(id: number): Promise<void> {
    try {
      await db.delete(giftCardTemplates).where(eq(giftCardTemplates.id, id));
    } catch (error) {
      console.error(`Error deleting gift card template: ${error}`);
      throw error;
    }
  }

  // Wallet Methods Implementation
  async getWalletSettings(): Promise<SelectWalletSettings | null> {
    try {
      const [settings] = await db.select().from(walletSettings).limit(1);
      return settings || null;
    } catch (error) {
      console.error("Error getting wallet settings:", error);
      return null;
    }
  }

  async updateWalletSettings(
    settingsData: Partial<SelectWalletSettings>
  ): Promise<SelectWalletSettings> {
    try {
      const [settings] = await db.select().from(walletSettings).limit(1);

      if (!settings) {
        // Create settings if none exist
        const [newSettings] = await db
          .insert(walletSettings)
          .values({
            ...settingsData,
            updatedAt: new Date(),
          })
          .returning();
        return newSettings;
      }

      // Update existing settings
      const [updatedSettings] = await db
        .update(walletSettings)
        .set({
          ...settingsData,
          updatedAt: new Date(),
        })
        .where(eq(walletSettings.id, settings.id))
        .returning();

      return updatedSettings;
    } catch (error) {
      console.error("Error updating wallet settings:", error);
      throw error;
    }
  }

  async getUserWallet(userId: number): Promise<SelectWallet | null> {
    try {
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId));

      return wallet || null;
    } catch (error) {
      console.error(`Error getting wallet for user ${userId}:`, error);
      return null;
    }
  }

  // Alias for getUserWallet - needed for compatibility in checkout process
  async getWalletByUserId(userId: number): Promise<SelectWallet | null> {
    return this.getUserWallet(userId);
  }

  async createUserWalletIfNotExists(userId: number): Promise<SelectWallet> {
    try {
      let wallet = await this.getUserWallet(userId);

      if (!wallet) {
        const [newWallet] = await db
          .insert(wallets)
          .values({
            userId,
            balance: 0,
            lifetimeEarned: 0,
            lifetimeRedeemed: 0,
          })
          .returning();

        wallet = newWallet;
      }

      return wallet;
    } catch (error) {
      console.error(`Error creating wallet for user ${userId}:`, error);
      throw error;
    }
  }

  async addCoinsToWallet(
    userId: number,
    amount: number,
    referenceType: string,
    referenceId?: number,
    description?: string
  ): Promise<SelectWallet> {
    try {
      // Get or create wallet
      const wallet = await this.createUserWalletIfNotExists(userId);

      // Check wallet settings for coin expiry
      const settings = await this.getWalletSettings();
      const expiryDays = settings?.coinExpiryDays || 90;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      // Start transaction
      return await db.transaction(async (trx) => {
        // Add transaction record
        await trx.insert(walletTransactions).values({
          walletId: wallet.id,
          amount,
          transactionType: "CREDIT",
          referenceType,
          referenceId,
          description,
          expiresAt,
        });

        // Update wallet balance
        const [updatedWallet] = await trx
          .update(wallets)
          .set({
            balance: wallet.balance + amount,
            lifetimeEarned: wallet.lifetimeEarned + amount,
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, wallet.id))
          .returning();

        return updatedWallet;
      });
    } catch (error) {
      console.error(`Error adding coins to wallet for user ${userId}:`, error);
      throw error;
    }
  }

  async redeemCoinsFromWallet(
    userId: number,
    amount: number,
    referenceType: string,
    referenceId?: number,
    description?: string
  ): Promise<{ wallet: SelectWallet; discountAmount: number }> {
    try {
      // Get wallet and settings
      const wallet = await this.getUserWallet(userId);
      const settings = await this.getWalletSettings();

      if (!wallet || !settings || !settings.isEnabled) {
        throw new Error("Wallet not found or feature disabled");
      }

      // Validate amount is within limits
      if (amount > wallet.balance) {
        throw new Error("Insufficient coins in wallet");
      }

      if (amount > settings.maxRedeemableCoins) {
        throw new Error(
          `Maximum redeemable coins is ${settings.maxRedeemableCoins}`
        );
      }

      // Calculate discount amount based on coin-to-currency ratio
      const discountAmount = parseFloat(
        (amount * parseFloat(settings.coinToCurrencyRatio.toString())).toFixed(
          2
        )
      );

      // Start transaction
      const updatedWallet = await db.transaction(async (trx) => {
        // Add transaction record
        await trx.insert(walletTransactions).values({
          walletId: wallet.id,
          amount: -amount, // Negative amount for deduction
          transactionType: "DEBIT",
          referenceType,
          referenceId,
          description,
        });

        // Update wallet balance
        const [updatedWallet] = await trx
          .update(wallets)
          .set({
            balance: wallet.balance - amount,
            lifetimeRedeemed: wallet.lifetimeRedeemed + amount,
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, wallet.id))
          .returning();

        return updatedWallet;
      });

      return {
        wallet: updatedWallet,
        discountAmount,
      };
    } catch (error) {
      console.error(
        `Error redeeming coins from wallet for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  async getUserWalletTransactions(
    userId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ transactions: SelectWalletTransaction[]; total: number }> {
    try {
      const offset = (page - 1) * limit;

      // Get user wallet
      const wallet = await this.getUserWallet(userId);
      if (!wallet) {
        return { transactions: [], total: 0 };
      }

      // Get total count
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(walletTransactions)
        .where(eq(walletTransactions.walletId, wallet.id));

      const total = Number(totalResult[0]?.count) || 0;

      // Get transactions with pagination
      const transactions = await db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.walletId, wallet.id))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        transactions,
        total,
      };
    } catch (error) {
      console.error(
        `Error getting wallet transactions for user ${userId}:`,
        error
      );
      return { transactions: [], total: 0 };
    }
  }

  async processFirstPurchaseReward(
    userId: number,
    orderId: number
  ): Promise<SelectWallet | null> {
    try {
      // Check if this is the user's first purchase
      const wallet = await this.getUserWallet(userId);
      if (!wallet) {
        return null;
      }

      const transactions = await db
        .select()
        .from(walletTransactions)
        .where(
          and(
            eq(walletTransactions.walletId, wallet.id),
            eq(walletTransactions.referenceType, "FIRST_PURCHASE")
          )
        );

      // If user already has a first purchase reward, don't give another
      if (transactions.length > 0) {
        return null;
      }

      // Get wallet settings
      const settings = await this.getWalletSettings();
      if (!settings || !settings.isEnabled) {
        return null;
      }

      // Add first purchase reward
      const coinsToAdd = settings.firstPurchaseCoins;
      const description = "First purchase reward";

      return await this.addCoinsToWallet(
        userId,
        coinsToAdd,
        "FIRST_PURCHASE",
        orderId,
        description
      );
    } catch (error) {
      console.error(
        `Error processing first purchase reward for user ${userId}:`,
        error
      );
      return null;
    }
  }

  async processExpiredCoins(): Promise<number> {
    try {
      const now = new Date();
      let expiredCoinsCount = 0;

      // Find all transactions with coins that have expired
      const expiredTransactions = await db
        .select()
        .from(walletTransactions)
        .where(
          and(
            eq(walletTransactions.transactionType, "CREDIT"),
            sql`${walletTransactions.expiresAt} IS NOT NULL`,
            sql`${walletTransactions.expiresAt} <= ${now}`,
            // Only include transactions that haven't been marked as expired yet
            sql`NOT EXISTS (
              SELECT 1 FROM ${walletTransactions} as wt
              WHERE wt.reference_type = 'EXPIRED'
              AND wt.reference_id = ${walletTransactions.id}
            )`
          )
        );

      // Process each expired transaction
      for (const transaction of expiredTransactions) {
        await db.transaction(async (trx) => {
          // Create an "EXPIRED" transaction that references the original
          await trx.insert(walletTransactions).values({
            walletId: transaction.walletId,
            amount: -transaction.amount, // Negative amount to reverse the credit
            transactionType: "EXPIRED",
            referenceType: "EXPIRED",
            referenceId: transaction.id,
            description: `Expired coins from transaction #${transaction.id}`,
          });

          // Update wallet balance
          const [wallet] = await trx
            .select()
            .from(wallets)
            .where(eq(wallets.id, transaction.walletId));

          if (wallet) {
            await trx
              .update(wallets)
              .set({
                balance: Math.max(0, wallet.balance - transaction.amount), // Ensure balance doesn't go negative
                updatedAt: new Date(),
              })
              .where(eq(wallets.id, transaction.walletId));

            expiredCoinsCount += transaction.amount;
          }
        });
      }

      return expiredCoinsCount;
    } catch (error) {
      console.error("Error processing expired coins:", error);
      return 0;
    }
  }

  async manualAdjustWallet(
    userId: number,
    amount: number,
    description: string
  ): Promise<SelectWallet> {
    try {
      if (amount === 0) {
        throw new Error("Adjustment amount cannot be zero");
      }

      const wallet = await this.createUserWalletIfNotExists(userId);

      return await db.transaction(async (trx) => {
        // Add transaction record
        await trx.insert(walletTransactions).values({
          walletId: wallet.id,
          amount,
          transactionType: amount > 0 ? "CREDIT" : "DEBIT",
          referenceType: "MANUAL_ADJUSTMENT",
          description,
        });

        // Update wallet balance
        const [updatedWallet] = await trx
          .update(wallets)
          .set({
            balance: wallet.balance + amount,
            lifetimeEarned:
              amount > 0
                ? wallet.lifetimeEarned + amount
                : wallet.lifetimeEarned,
            lifetimeRedeemed:
              amount < 0
                ? wallet.lifetimeRedeemed - amount
                : wallet.lifetimeRedeemed,
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, wallet.id))
          .returning();

        return updatedWallet;
      });
    } catch (error) {
      console.error(
        `Error making manual adjustment to wallet for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Adjust wallet balance (for manual admin adjustments)
   * This method is used by the wallet-routes.ts for the /api/wallet/adjust endpoint
   */
  async adjustWallet(
    walletId: number,
    amount: number,
    referenceType: string,
    referenceId: number | null,
    description: string
  ): Promise<SelectWallet> {
    try {
      if (amount === 0) {
        throw new Error("Adjustment amount cannot be zero");
      }

      // Get wallet
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.id, walletId));

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Start transaction
      return await db.transaction(async (trx) => {
        // Add transaction record
        await trx.insert(walletTransactions).values({
          walletId,
          amount,
          transactionType: amount > 0 ? "CREDIT" : "DEBIT",
          referenceType,
          referenceId,
          description,
        });

        // Update wallet balance
        const [updatedWallet] = await trx
          .update(wallets)
          .set({
            balance: wallet.balance + amount,
            lifetimeEarned:
              amount > 0
                ? wallet.lifetimeEarned + amount
                : wallet.lifetimeEarned,
            lifetimeRedeemed:
              amount < 0
                ? wallet.lifetimeRedeemed + Math.abs(amount)
                : wallet.lifetimeRedeemed,
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, walletId))
          .returning();

        return updatedWallet;
      });
    } catch (error) {
      console.error(`Error adjusting wallet ${walletId}:`, error);
      throw error;
    }
  }

  async getUsersWithWallets(): Promise<
    Array<{ id: number; username: string; balance: number }>
  > {
    try {
      const result = await db
        .select({
          id: users.id,
          username: users.username,
          balance: wallets.balance,
        })
        .from(wallets)
        .innerJoin(users, eq(wallets.userId, users.id))
        .orderBy(users.id);

      return result;
    } catch (error) {
      console.error("Error fetching users with wallets:", error);
      throw new Error("Failed to fetch users with wallets");
    }
  }

  // Return Management Methods
  async getReturnRequestById(id: number): Promise<ReturnRequest | undefined> {
    try {
      const result = await db
        .select()
        .from(returnRequests)
        .where(eq(returnRequests.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting return request by ID:", error);
      throw error;
    }
  }

  async getReturnRequestWithDetails(id: number): Promise<any> {
    try {
      const request = await this.getReturnRequestById(id);
      if (!request) {
        return undefined;
      }

      // Get reason
      const reason = await this.getReturnReasonById(request.reasonId);

      // Get buyer and seller
      const buyer = await db
        .select()
        .from(users)
        .where(eq(users.id, request.buyerId));
      const seller = request.sellerId
        ? await db.select().from(users).where(eq(users.id, request.sellerId))
        : undefined;

      // Get order item
      let orderItem = null;
      if (request.orderItemId) {
        const orderItems = await this.getOrderItemById(request.orderItemId);
        if (orderItems) {
          const product = await this.getProduct(orderItems.productId);
          orderItem = {
            ...orderItems,
            product,
          };
        }
      }

      // Get messages
      const messages = await this.getReturnMessagesWithUsers(id);

      // Get status history
      const statusHistory = await this.getReturnStatusHistory(id);

      return {
        ...request,
        reason: reason,
        buyer: buyer.length > 0 ? buyer[0] : null,
        seller: seller && seller.length > 0 ? seller[0] : null,
        orderItem,
        messages,
        statusHistory,
      };
    } catch (error) {
      console.error("Error getting return request with details:", error);
      throw error;
    }
  }

  async createReturnRequest(data: InsertReturnRequest): Promise<ReturnRequest> {
    try {
      // Convert any JSONable fields from string to object if provided as strings
      let processedData = { ...data };
      if (typeof processedData.mediaUrls === "string") {
        processedData.mediaUrls = JSON.parse(processedData.mediaUrls);
      }
      if (typeof processedData.returnTracking === "string") {
        processedData.returnTracking = JSON.parse(processedData.returnTracking);
      }
      if (typeof processedData.replacementTracking === "string") {
        processedData.replacementTracking = JSON.parse(
          processedData.replacementTracking
        );
      }

      const result = await db
        .insert(returnRequests)
        .values(processedData)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating return request:", error);
      throw error;
    }
  }

  async updateReturnRequest(
    id: number,
    data: Partial<ReturnRequest>
  ): Promise<ReturnRequest> {
    try {
      // Process JSON fields if they're strings
      let processedData = { ...data };
      if (typeof processedData.mediaUrls === "string") {
        processedData.mediaUrls = JSON.parse(processedData.mediaUrls);
      }
      if (typeof processedData.returnTracking === "string") {
        processedData.returnTracking = JSON.parse(processedData.returnTracking);
      }
      if (typeof processedData.replacementTracking === "string") {
        processedData.replacementTracking = JSON.parse(
          processedData.replacementTracking
        );
      }

      const result = await db
        .update(returnRequests)
        .set(processedData)
        .where(eq(returnRequests.id, id))
        .returning();

      return result[0];
    } catch (error) {
      console.error("Error updating return request:", error);
      throw error;
    }
  }

  async getReturnRequestsByBuyerId(
    buyerId: number,
    limit: number = 10,
    offset: number = 0
  ): Promise<ReturnRequest[]> {
    try {
      return await db
        .select()
        .from(returnRequests)
        .where(eq(returnRequests.buyerId, buyerId))
        .orderBy(desc(returnRequests.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error("Error getting return requests by buyer ID:", error);
      throw error;
    }
  }

  async getReturnRequestsBySellerId(
    sellerId: number,
    limit: number = 10,
    offset: number = 0
  ): Promise<ReturnRequest[]> {
    try {
      return await db
        .select()
        .from(returnRequests)
        .where(eq(returnRequests.sellerId, sellerId))
        .orderBy(desc(returnRequests.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error("Error getting return requests by seller ID:", error);
      throw error;
    }
  }

  async getReturnRequests(
    filters: {
      status?: string;
      requestType?: string;
      buyerId?: number;
      sellerId?: number;
      startDate?: Date;
      endDate?: Date;
    } = {},
    limit: number = 10,
    offset: number = 0
  ): Promise<ReturnRequest[]> {
    try {
      let conditions = [];

      if (filters.status) {
        conditions.push(eq(returnRequests.status, filters.status));
      }

      if (filters.requestType) {
        conditions.push(eq(returnRequests.requestType, filters.requestType));
      }

      if (filters.buyerId) {
        conditions.push(eq(returnRequests.buyerId, filters.buyerId));
      }

      if (filters.sellerId) {
        conditions.push(eq(returnRequests.sellerId, filters.sellerId));
      }

      if (filters.startDate) {
        conditions.push(
          sql`${returnRequests.createdAt} >= ${filters.startDate}`
        );
      }

      if (filters.endDate) {
        conditions.push(sql`${returnRequests.createdAt} <= ${filters.endDate}`);
      }

      if (conditions.length === 0) {
        return await db
          .select()
          .from(returnRequests)
          .orderBy(desc(returnRequests.createdAt))
          .limit(limit)
          .offset(offset);
      } else {
        return await db
          .select()
          .from(returnRequests)
          .where(and(...conditions))
          .orderBy(desc(returnRequests.createdAt))
          .limit(limit)
          .offset(offset);
      }
    } catch (error) {
      console.error("Error getting return requests with filters:", error);
      throw error;
    }
  }

  async getReturnReasonById(id: number): Promise<ReturnReason | undefined> {
    try {
      const result = await db
        .select()
        .from(returnReasons)
        .where(eq(returnReasons.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting return reason by ID:", error);
      throw error;
    }
  }

  async getActiveReturnReasons(requestType?: string): Promise<ReturnReason[]> {
    try {
      let allReasons = await db
        .select()
        .from(returnReasons)
        .where(eq(returnReasons.active, true));

      if (requestType) {
        // Filter reasons that apply to the requested type
        return allReasons.filter(
          (reason) =>
            reason.applicableTypes &&
            Array.isArray(reason.applicableTypes) &&
            reason.applicableTypes.includes(requestType)
        );
      }

      return allReasons;
    } catch (error) {
      console.error("Error getting active return reasons:", error);
      throw error;
    }
  }

  async createReturnReason(data: InsertReturnReason): Promise<ReturnReason> {
    try {
      const result = await db.insert(returnReasons).values(data).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating return reason:", error);
      throw error;
    }
  }

  async updateReturnReason(
    id: number,
    data: Partial<ReturnReason>
  ): Promise<ReturnReason> {
    try {
      const result = await db
        .update(returnReasons)
        .set(data)
        .where(eq(returnReasons.id, id))
        .returning();

      return result[0];
    } catch (error) {
      console.error("Error updating return reason:", error);
      throw error;
    }
  }

  async getReturnPolicyByCriteria(
    sellerId?: number | null,
    categoryId?: number | null
  ): Promise<ReturnPolicy | undefined> {
    try {
      // Looking for platform default policy
      if (sellerId === null && categoryId === null) {
        const defaultPolicy = await db
          .select()
          .from(returnPolicies)
          .where(
            and(
              isNull(returnPolicies.sellerId),
              isNull(returnPolicies.categoryId)
            )
          );
        return defaultPolicy.length > 0 ? defaultPolicy[0] : undefined;
      }

      // Looking for seller-category specific policy
      if (sellerId !== undefined && categoryId !== undefined) {
        const sellerCategoryPolicy = await db
          .select()
          .from(returnPolicies)
          .where(
            and(
              eq(returnPolicies.sellerId, sellerId),
              eq(returnPolicies.categoryId, categoryId)
            )
          );

        if (sellerCategoryPolicy.length > 0) {
          return sellerCategoryPolicy[0];
        }
      }

      // Looking for seller-wide policy
      if (sellerId !== undefined) {
        const sellerPolicy = await db
          .select()
          .from(returnPolicies)
          .where(
            and(
              eq(returnPolicies.sellerId, sellerId),
              isNull(returnPolicies.categoryId)
            )
          );

        if (sellerPolicy.length > 0) {
          return sellerPolicy[0];
        }
      }

      // If nothing found and not looking for default, try the default policy
      if (sellerId !== null || categoryId !== null) {
        return this.getReturnPolicyByCriteria(null, null);
      }

      return undefined;
    } catch (error) {
      console.error("Error getting return policy by criteria:", error);
      throw error;
    }
  }

  async getReturnPoliciesBySellerId(sellerId: number): Promise<ReturnPolicy[]> {
    try {
      return await db
        .select()
        .from(returnPolicies)
        .where(eq(returnPolicies.sellerId, sellerId));
    } catch (error) {
      console.error("Error getting return policies by seller ID:", error);
      throw error;
    }
  }

  async createReturnPolicy(data: InsertReturnPolicy): Promise<ReturnPolicy> {
    try {
      // Convert any JSONable fields from string to object
      let processedData = { ...data };
      if (typeof processedData.conditionalRules === "string") {
        processedData.conditionalRules = JSON.parse(
          processedData.conditionalRules
        );
      }

      const result = await db
        .insert(returnPolicies)
        .values(processedData)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating return policy:", error);
      throw error;
    }
  }

  async updateReturnPolicy(
    id: number,
    data: Partial<ReturnPolicy>
  ): Promise<ReturnPolicy> {
    try {
      // Convert any JSONable fields from string to object
      let processedData = { ...data };
      if (typeof processedData.conditionalRules === "string") {
        processedData.conditionalRules = JSON.parse(
          processedData.conditionalRules
        );
      }

      const result = await db
        .update(returnPolicies)
        .set(processedData)
        .where(eq(returnPolicies.id, id))
        .returning();

      return result[0];
    } catch (error) {
      console.error("Error updating return policy:", error);
      throw error;
    }
  }

  async createReturnMessage(data: InsertReturnMessage): Promise<ReturnMessage> {
    try {
      // Convert any JSONable fields from string to object
      let processedData = { ...data };
      if (typeof processedData.mediaUrls === "string") {
        processedData.mediaUrls = JSON.parse(processedData.mediaUrls);
      }

      const result = await db
        .insert(returnMessages)
        .values(processedData)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating return message:", error);
      throw error;
    }
  }

  async getReturnMessages(returnRequestId: number): Promise<ReturnMessage[]> {
    try {
      return await db
        .select()
        .from(returnMessages)
        .where(eq(returnMessages.returnRequestId, returnRequestId))
        .orderBy(asc(returnMessages.createdAt));
    } catch (error) {
      console.error("Error getting return messages:", error);
      throw error;
    }
  }

  async getReturnMessagesWithUsers(returnRequestId: number): Promise<any[]> {
    try {
      const messages = await this.getReturnMessages(returnRequestId);

      // Get all unique sender IDs
      const senderIds = [...new Set(messages.map((m) => m.senderId))];

      // Handle empty array to avoid SQL error
      if (senderIds.length === 0) {
        return [];
      }

      // Get all users in one query
      const usersData = await db
        .select()
        .from(users)
        .where(sql`id IN (${senderIds.join(",")})`);

      // Create a map for easy lookup
      const userMap = new Map(usersData.map((u) => [u.id, u]));

      // Combine messages with user data
      return messages.map((message) => ({
        ...message,
        sender: userMap.get(message.senderId) || null,
      }));
    } catch (error) {
      console.error("Error getting return messages with users:", error);
      throw error;
    }
  }

  async markReturnMessagesAsRead(
    returnRequestId: number,
    userId: number
  ): Promise<void> {
    try {
      await db
        .update(returnMessages)
        .set({ read: true })
        .where(
          and(
            eq(returnMessages.returnRequestId, returnRequestId),
            sql`${returnMessages.senderId} != ${userId}`,
            eq(returnMessages.read, false)
          )
        );
    } catch (error) {
      console.error("Error marking return messages as read:", error);
      throw error;
    }
  }

  async createReturnStatusHistory(
    data: InsertReturnStatusHistoryRecord
  ): Promise<ReturnStatusHistoryRecord> {
    try {
      const result = await db
        .insert(returnStatusHistory)
        .values(data)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating return status history:", error);
      throw error;
    }
  }

  async getReturnStatusHistory(
    returnRequestId: number
  ): Promise<ReturnStatusHistoryRecord[]> {
    try {
      return await db
        .select()
        .from(returnStatusHistory)
        .where(eq(returnStatusHistory.returnRequestId, returnRequestId))
        .orderBy(asc(returnStatusHistory.createdAt));
    } catch (error) {
      console.error("Error getting return status history:", error);
      throw error;
    }
  }

  async getUnreadReturnMessageCount(userId: number): Promise<number> {
    try {
      // Find return requests where the user is either buyer or seller
      const requests = await db
        .select({ id: returnRequests.id })
        .from(returnRequests)
        .where(
          or(
            eq(returnRequests.buyerId, userId),
            eq(returnRequests.sellerId, userId)
          )
        );

      if (requests.length === 0) {
        return 0;
      }

      const requestIds = requests.map((r) => r.id);

      // Handle empty array to avoid SQL error
      if (requestIds.length === 0) {
        return 0;
      }

      // Count unread messages where the user is NOT the sender
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(returnMessages)
        .where(
          and(
            sql`${returnMessages.returnRequestId} IN (${requestIds.join(",")})`,
            sql`${returnMessages.senderId} != ${userId}`,
            eq(returnMessages.read, false)
          )
        );

      return result[0]?.count || 0;
    } catch (error) {
      console.error("Error getting unread return message count:", error);
      throw error;
    }
  }

  async getReturnAnalytics(
    sellerId?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    try {
      const now = new Date();
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);

      // Set default date range to last month if not specified
      const effectiveStartDate = startDate || oneMonthAgo;
      const effectiveEndDate = endDate || now;

      // Base query conditions
      let conditions = [
        sql`${returnRequests.createdAt} >= ${effectiveStartDate}`,
        sql`${returnRequests.createdAt} <= ${effectiveEndDate}`,
      ];

      if (sellerId) {
        conditions.push(eq(returnRequests.sellerId, sellerId));
      }

      // Get total requests by type
      const requestsByType = await db
        .select({
          type: returnRequests.requestType,
          count: sql<number>`count(*)`,
        })
        .from(returnRequests)
        .where(and(...conditions))
        .groupBy(returnRequests.requestType);

      // Get requests by status
      const requestsByStatus = await db
        .select({
          status: returnRequests.status,
          count: sql<number>`count(*)`,
        })
        .from(returnRequests)
        .where(and(...conditions))
        .groupBy(returnRequests.status);

      // Get requests by reason
      const requestsByReason = await db
        .select({
          reasonId: returnRequests.reasonId,
          count: sql<number>`count(*)`,
        })
        .from(returnRequests)
        .where(and(...conditions))
        .groupBy(returnRequests.reasonId);

      // Get average time to resolution
      const resolutionTimeQuery = await db.execute(sql`
        SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_resolution_time
        FROM return_requests
        WHERE status = 'completed'
        AND ${and(...conditions)}
      `);

      const avgResolutionTime =
        resolutionTimeQuery.rows[0]?.avg_resolution_time || 0;

      // Get refund totals
      const refundTotalsQuery = await db.execute(sql`
        SELECT SUM(refund_amount) as total_refunded
        FROM return_requests
        WHERE refund_processed = true
        AND ${and(...conditions)}
      `);

      const totalRefunded = refundTotalsQuery.rows[0]?.total_refunded || 0;

      // Get all reason IDs to fetch descriptions
      const reasonIds = requestsByReason.map((r) => r.reasonId);

      // Handle empty array to avoid SQL error
      let enhancedReasons = [];
      if (reasonIds.length > 0) {
        const reasons = await db
          .select()
          .from(returnReasons)
          .where(sql`id IN (${reasonIds.join(",")})`);

        // Create a map for easy lookup
        const reasonMap = new Map(reasons.map((r) => [r.id, r]));

        // Enhance the reasons data with descriptions
        enhancedReasons = requestsByReason.map((r) => ({
          reasonId: r.reasonId,
          count: r.count,
          description: reasonMap.get(r.reasonId)?.description || "Unknown",
        }));
      }

      return {
        totalRequests: requestsByType.reduce(
          (sum, item) => sum + Number(item.count),
          0
        ),
        requestsByType,
        requestsByStatus,
        requestsByReason: enhancedReasons,
        avgResolutionTimeSeconds: avgResolutionTime,
        totalRefunded,
      };
    } catch (error) {
      console.error("Error getting return analytics:", error);
      throw error;
    }
  }

  async getOrderItemById(orderItemId: number): Promise<OrderItem | undefined> {
    try {
      const result = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.id, orderItemId));

      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting order item by ID:", error);
      throw error;
    }
  }

  async checkReturnEligibility(
    orderId: number,
    orderItemId: number,
    requestType: string
  ): Promise<{ eligible: boolean; reason?: string }> {
    try {
      // Get order and item details
      const order = await this.getOrder(orderId);
      if (!order) {
        return { eligible: false, reason: "Order not found" };
      }

      const orderItem = await this.getOrderItemById(orderItemId);
      if (!orderItem) {
        return { eligible: false, reason: "Order item not found" };
      }

      // Verify order status - only completed orders can be returned
      if (order.status !== "delivered" && order.status !== "completed") {
        return {
          eligible: false,
          reason: "Order must be delivered to process returns",
        };
      }

      // Check if item already has a return request
      if (orderItem.returnRequestId) {
        return {
          eligible: false,
          reason: "A return request already exists for this item",
        };
      }

      // Check if item is marked as returned
      if (orderItem.isReturned) {
        return {
          eligible: false,
          reason: "This item has already been returned",
        };
      }

      // Get the product
      const product = await this.getProduct(orderItem.productId);
      if (!product) {
        return { eligible: false, reason: "Product not found" };
      }

      // Check delivery date and policy window
      const deliveryDate = this.getDeliveryDate(order);
      if (!deliveryDate) {
        return {
          eligible: false,
          reason: "Delivery date could not be determined",
        };
      }

      // Get return policy for this product
      const policy = await this.getReturnPolicyByCriteria(
        product.sellerId,
        product.categoryId
      );

      // Check if the item is in the non-returnable list
      if (
        policy &&
        policy.nonReturnableItems &&
        Array.isArray(policy.nonReturnableItems) &&
        policy.nonReturnableItems.includes(product.id.toString())
      ) {
        return {
          eligible: false,
          reason: "This item is not eligible for returns per seller policy",
        };
      }

      // Check time window based on request type
      const currentDate = new Date();
      let windowDays = 7; // Default

      if (policy) {
        if (requestType === "refund") {
          windowDays = policy.refundWindowDays;
        } else if (requestType === "return") {
          windowDays = policy.returnWindowDays;
        } else if (requestType === "replacement") {
          windowDays = policy.replacementWindowDays;
        }
      }

      const returnDeadline = new Date(deliveryDate);
      returnDeadline.setDate(returnDeadline.getDate() + windowDays);

      if (currentDate > returnDeadline) {
        return {
          eligible: false,
          reason: `${requestType} window of ${windowDays} days has expired`,
        };
      }

      // All checks passed
      return { eligible: true };
    } catch (error) {
      console.error("Error checking return eligibility:", error);
      return {
        eligible: false,
        reason: "An error occurred while checking eligibility",
      };
    }
  }

  // Helper method to get delivery date from order
  private getDeliveryDate(order: any): Date | null {
    // First check for explicit delivery date
    if (order.deliveryDate) {
      return new Date(order.deliveryDate);
    }

    // Check status history for delivery status
    if (order.statusHistory && Array.isArray(order.statusHistory)) {
      const deliveryEvent = order.statusHistory.find(
        (sh: any) => sh.status === "delivered" || sh.status === "completed"
      );

      if (deliveryEvent && deliveryEvent.date) {
        return new Date(deliveryEvent.date);
      }
    }

    // If status is delivered but no specific date, use a fallback
    // (current timestamp - 1 day) as estimate
    if (order.status === "delivered" || order.status === "completed") {
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() - 1);
      return estimatedDate;
    }

    // Cannot determine delivery date
    return null;
  }

  // =========== Return Management Methods ===========

  // Return Requests
  async getReturnRequestById(id: number): Promise<ReturnRequest | undefined> {
    try {
      const [returnRequest] = await db
        .select()
        .from(returnRequests)
        .where(eq(returnRequests.id, id));
      return returnRequest;
    } catch (error) {
      console.error(`Error getting return request with ID ${id}:`, error);
      return undefined;
    }
  }

  async getReturnRequestWithDetails(id: number): Promise<any> {
    try {
      const returnRequest = await this.getReturnRequestById(id);
      if (!returnRequest) return null;

      // Get additional details
      const order = await this.getOrder(returnRequest.orderId);
      const orderItem = returnRequest.orderItemId
        ? await this.getOrderItemById(returnRequest.orderItemId)
        : null;
      const product = orderItem
        ? await this.getProduct(orderItem.productId)
        : null;
      const reason = await this.getReturnReasonById(returnRequest.reasonId);
      const statusHistory = await this.getReturnStatusHistory(id);
      const messages = await this.getReturnMessagesWithUsers(id);

      return {
        ...returnRequest,
        order,
        orderItem,
        product,
        reason,
        statusHistory,
        messages,
      };
    } catch (error) {
      console.error(
        `Error getting detailed return request with ID ${id}:`,
        error
      );
      return null;
    }
  }

  async createReturnRequest(data: InsertReturnRequest): Promise<ReturnRequest> {
    try {
      const [returnRequest] = await db
        .insert(returnRequests)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          mediaUrls: data.mediaUrls ?? [],
        })
        .returning();
      return returnRequest;
    } catch (error) {
      console.error("Error creating return request:", error);
      throw new Error("Failed to create return request");
    }
  }

  async updateReturnRequest(
    id: number,
    data: Partial<ReturnRequest>
  ): Promise<ReturnRequest> {
    try {
      const [updatedRequest] = await db
        .update(returnRequests)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(returnRequests.id, id))
        .returning();

      if (!updatedRequest) {
        throw new Error(`Return request with ID ${id} not found`);
      }

      return updatedRequest;
    } catch (error) {
      console.error(`Error updating return request ${id}:`, error);
      throw new Error("Failed to update return request");
    }
  }

  async getReturnRequestsByBuyerId(
    buyerId: number,
    limit = 20,
    offset = 0
  ): Promise<ReturnRequest[]> {
    try {
      const requests = await db
        .select()
        .from(returnRequests)
        .where(eq(returnRequests.buyerId, buyerId))
        .orderBy(desc(returnRequests.createdAt))
        .limit(limit)
        .offset(offset);

      return requests;
    } catch (error) {
      console.error(
        `Error getting return requests for buyer ${buyerId}:`,
        error
      );
      return [];
    }
  }

  async getReturnRequestsBySellerId(
    sellerId: number,
    limit = 20,
    offset = 0
  ): Promise<ReturnRequest[]> {
    try {
      const requests = await db
        .select()
        .from(returnRequests)
        .where(eq(returnRequests.sellerId, sellerId))
        .orderBy(desc(returnRequests.createdAt))
        .limit(limit)
        .offset(offset);

      return requests;
    } catch (error) {
      console.error(
        `Error getting return requests for seller ${sellerId}:`,
        error
      );
      return [];
    }
  }

  async getReturnRequests(
    filters: any = {},
    limit = 20,
    offset = 0
  ): Promise<ReturnRequest[]> {
    try {
      let query = db.select().from(returnRequests);

      // Apply filters
      if (filters.status) {
        query = query.where(eq(returnRequests.status, filters.status));
      }

      if (filters.requestType) {
        query = query.where(
          eq(returnRequests.requestType, filters.requestType)
        );
      }

      if (filters.startDate && filters.endDate) {
        query = query.where(
          sql`${returnRequests.createdAt} BETWEEN ${filters.startDate} AND ${filters.endDate}`
        );
      }

      // Apply sorting, limiting, and pagination
      const requests = await query
        .orderBy(desc(returnRequests.createdAt))
        .limit(limit)
        .offset(offset);

      return requests;
    } catch (error) {
      console.error("Error getting filtered return requests:", error);
      return [];
    }
  }

  // Return Reasons
  async getReturnReasonById(id: number): Promise<ReturnReason | undefined> {
    try {
      const [reason] = await db
        .select()
        .from(returnReasons)
        .where(eq(returnReasons.id, id));
      return reason;
    } catch (error) {
      console.error(`Error getting return reason with ID ${id}:`, error);
      return undefined;
    }
  }

  async getActiveReturnReasons(requestType?: string): Promise<ReturnReason[]> {
    try {
      let query = db
        .select()
        .from(returnReasons)
        .where(eq(returnReasons.isActive, true));

      if (requestType) {
        query = query.where(eq(returnReasons.category, requestType));
      }

      const reasons = await query.orderBy(returnReasons.displayOrder);
      return reasons;
    } catch (error) {
      console.error("Error getting active return reasons:", error);
      return [];
    }
  }

  async createReturnReason(data: InsertReturnReason): Promise<ReturnReason> {
    try {
      const [reason] = await db
        .insert(returnReasons)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return reason;
    } catch (error) {
      console.error("Error creating return reason:", error);
      throw new Error("Failed to create return reason");
    }
  }

  async updateReturnReason(
    id: number,
    data: Partial<ReturnReason>
  ): Promise<ReturnReason> {
    try {
      const [updatedReason] = await db
        .update(returnReasons)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(returnReasons.id, id))
        .returning();

      if (!updatedReason) {
        throw new Error(`Return reason with ID ${id} not found`);
      }

      return updatedReason;
    } catch (error) {
      console.error(`Error updating return reason ${id}:`, error);
      throw new Error("Failed to update return reason");
    }
  }

  // Return Policies
  async getReturnPolicyByCriteria(
    sellerId?: number | null,
    categoryId?: number | null
  ): Promise<ReturnPolicy | undefined> {
    try {
      let query = db.select().from(returnPolicies);

      // Try to find a specific policy for this seller and category
      if (sellerId && categoryId) {
        const [specificPolicy] = await query.where(
          and(
            eq(returnPolicies.sellerId, sellerId),
            eq(returnPolicies.categoryId, categoryId),
            eq(returnPolicies.isActive, true)
          )
        );

        if (specificPolicy) return specificPolicy;
      }

      // Try to find a seller-wide policy
      if (sellerId) {
        const [sellerPolicy] = await query.where(
          and(
            eq(returnPolicies.sellerId, sellerId),
            isNull(returnPolicies.categoryId),
            eq(returnPolicies.isActive, true)
          )
        );

        if (sellerPolicy) return sellerPolicy;
      }

      // Try to find a category-wide policy
      if (categoryId) {
        const [categoryPolicy] = await query.where(
          and(
            isNull(returnPolicies.sellerId),
            eq(returnPolicies.categoryId, categoryId),
            eq(returnPolicies.isActive, true)
          )
        );

        if (categoryPolicy) return categoryPolicy;
      }

      // If all else fails, get the global policy
      const [globalPolicy] = await query.where(
        and(
          isNull(returnPolicies.sellerId),
          isNull(returnPolicies.categoryId),
          eq(returnPolicies.isActive, true)
        )
      );

      return globalPolicy;
    } catch (error) {
      console.error("Error getting return policy:", error);
      return undefined;
    }
  }

  async getGlobalReturnPolicy(): Promise<ReturnPolicy | undefined> {
    try {
      const [policy] = await db
        .select()
        .from(returnPolicies)
        .where(
          and(
            isNull(returnPolicies.sellerId),
            isNull(returnPolicies.categoryId),
            eq(returnPolicies.isActive, true)
          )
        );
      return policy;
    } catch (error) {
      console.error("Error getting global return policy:", error);
      return undefined;
    }
  }

  async getReturnPoliciesBySellerId(sellerId: number): Promise<ReturnPolicy[]> {
    try {
      const policies = await db
        .select()
        .from(returnPolicies)
        .where(eq(returnPolicies.sellerId, sellerId));
      return policies;
    } catch (error) {
      console.error(
        `Error getting return policies for seller ${sellerId}:`,
        error
      );
      return [];
    }
  }

  async createReturnPolicy(data: InsertReturnPolicy): Promise<ReturnPolicy> {
    try {
      const [policy] = await db
        .insert(returnPolicies)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return policy;
    } catch (error) {
      console.error("Error creating return policy:", error);
      throw new Error("Failed to create return policy");
    }
  }

  async updateReturnPolicy(
    id: number,
    data: Partial<ReturnPolicy>
  ): Promise<ReturnPolicy> {
    try {
      const [updatedPolicy] = await db
        .update(returnPolicies)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(returnPolicies.id, id))
        .returning();

      if (!updatedPolicy) {
        throw new Error(`Return policy with ID ${id} not found`);
      }

      return updatedPolicy;
    } catch (error) {
      console.error(`Error updating return policy ${id}:`, error);
      throw new Error("Failed to update return policy");
    }
  }

  // Return Messages
  async createReturnMessage(data: InsertReturnMessage): Promise<ReturnMessage> {
    try {
      const [message] = await db
        .insert(returnMessages)
        .values({
          ...data,
          createdAt: new Date(),
          mediaUrls: data.mediaUrls ?? [],
        })
        .returning();
      return message;
    } catch (error) {
      console.error("Error creating return message:", error);
      throw new Error("Failed to create return message");
    }
  }

  async updateReturnMessage(
    id: number,
    data: Partial<ReturnMessage>
  ): Promise<ReturnMessage> {
    try {
      const [updatedMessage] = await db
        .update(returnMessages)
        .set(data)
        .where(eq(returnMessages.id, id))
        .returning();

      if (!updatedMessage) {
        throw new Error(`Return message with ID ${id} not found`);
      }

      return updatedMessage;
    } catch (error) {
      console.error(`Error updating return message ${id}:`, error);
      throw new Error("Failed to update return message");
    }
  }

  async getReturnMessages(returnRequestId: number): Promise<ReturnMessage[]> {
    try {
      const messages = await db
        .select()
        .from(returnMessages)
        .where(eq(returnMessages.returnRequestId, returnRequestId))
        .orderBy(returnMessages.createdAt);
      return messages;
    } catch (error) {
      console.error(
        `Error getting return messages for request ${returnRequestId}:`,
        error
      );
      return [];
    }
  }

  async getReturnMessagesWithUsers(returnRequestId: number): Promise<any[]> {
    try {
      const messages = await this.getReturnMessages(returnRequestId);

      const messagesWithUsers = await Promise.all(
        messages.map(async (message) => {
          const sender = await this.getUser(message.senderId);
          return {
            ...message,
            sender: sender
              ? {
                  id: sender.id,
                  username: sender.username,
                  name: sender.name,
                  profileImage: sender.profileImage,
                }
              : null,
          };
        })
      );

      return messagesWithUsers;
    } catch (error) {
      console.error(
        `Error getting return messages with users for request ${returnRequestId}:`,
        error
      );
      return [];
    }
  }

  async markReturnMessagesAsRead(
    returnRequestId: number,
    userId: number
  ): Promise<void> {
    try {
      // Find messages sent by other users that are unread
      const messages = await db
        .select()
        .from(returnMessages)
        .where(
          and(
            eq(returnMessages.returnRequestId, returnRequestId),
            sql`${returnMessages.senderId} != ${userId}`,
            eq(returnMessages.read, false)
          )
        );

      // Mark each as read
      await Promise.all(
        messages.map((msg) =>
          db
            .update(returnMessages)
            .set({ read: true })
            .where(eq(returnMessages.id, msg.id))
        )
      );
    } catch (error) {
      console.error(
        `Error marking return messages as read for request ${returnRequestId}:`,
        error
      );
    }
  }

  async getUnreadReturnMessageCount(userId: number): Promise<number> {
    try {
      // Get all return requests where this user is either buyer or seller
      const userRequests = await db
        .select()
        .from(returnRequests)
        .where(
          or(
            eq(returnRequests.buyerId, userId),
            eq(returnRequests.sellerId, userId)
          )
        );

      let totalUnread = 0;

      // For each request, count unread messages from other users
      for (const request of userRequests) {
        const unreadCount = await db
          .select({ count: sql`count(*)` })
          .from(returnMessages)
          .where(
            and(
              eq(returnMessages.returnRequestId, request.id),
              sql`${returnMessages.senderId} != ${userId}`,
              eq(returnMessages.read, false)
            )
          );

        totalUnread += Number(unreadCount[0]?.count || 0);
      }

      return totalUnread;
    } catch (error) {
      console.error(
        `Error getting unread return message count for user ${userId}:`,
        error
      );
      return 0;
    }
  }

  // Return Status History
  async createReturnStatusHistory(
    data: InsertReturnStatusHistoryRecord
  ): Promise<ReturnStatusHistoryRecord> {
    try {
      const [history] = await db
        .insert(returnStatusHistory)
        .values({
          ...data,
          createdAt: new Date(),
        })
        .returning();
      return history;
    } catch (error) {
      console.error("Error creating return status history:", error);
      throw new Error("Failed to create return status history");
    }
  }

  async getReturnStatusHistory(
    returnRequestId: number
  ): Promise<ReturnStatusHistoryRecord[]> {
    try {
      const history = await db
        .select()
        .from(returnStatusHistory)
        .where(eq(returnStatusHistory.returnRequestId, returnRequestId))
        .orderBy(returnStatusHistory.createdAt);
      return history;
    } catch (error) {
      console.error(
        `Error getting status history for return request ${returnRequestId}:`,
        error
      );
      return [];
    }
  }

  // Return Analytics
  async getReturnAnalytics(
    sellerId?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    try {
      // Base query
      let query = db.select().from(returnRequests);

      // Apply filters
      if (sellerId) {
        query = query.where(eq(returnRequests.sellerId, sellerId));
      }

      if (startDate && endDate) {
        query = query.where(
          sql`${returnRequests.createdAt} BETWEEN ${startDate} AND ${endDate}`
        );
      }

      const requests = await query;

      // Calculate metrics
      const totalRequests = requests.length;
      const approvedRequests = requests.filter(
        (r) => r.status === "approved" || r.status === "completed"
      ).length;
      const rejectedRequests = requests.filter(
        (r) => r.status === "rejected"
      ).length;
      const pendingRequests = requests.filter(
        (r) => r.status === "pending"
      ).length;

      const refundRequests = requests.filter(
        (r) => r.requestType === "refund"
      ).length;
      const returnRequests = requests.filter(
        (r) => r.requestType === "return"
      ).length;
      const replacementRequests = requests.filter(
        (r) => r.requestType === "replacement"
      ).length;

      // Calculate approval rate
      const approvalRate =
        totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;

      // Calculate average processing time (in days)
      let totalProcessingDays = 0;
      let processedRequests = 0;

      for (const request of requests) {
        if (["completed", "approved", "rejected"].includes(request.status)) {
          const createdDate = new Date(request.createdAt);
          const updatedDate = new Date(request.updatedAt);
          const diffTime = Math.abs(
            updatedDate.getTime() - createdDate.getTime()
          );
          const diffDays = diffTime / (1000 * 60 * 60 * 24);

          totalProcessingDays += diffDays;
          processedRequests++;
        }
      }

      const avgProcessingDays =
        processedRequests > 0 ? totalProcessingDays / processedRequests : 0;

      // Calculate total refund amount
      const totalRefundAmount = requests.reduce((sum, req) => {
        if (req.refundProcessed && req.refundAmount) {
          return sum + req.refundAmount;
        }
        return sum;
      }, 0);

      return {
        totalRequests,
        approvedRequests,
        rejectedRequests,
        pendingRequests,
        refundRequests,
        returnRequests,
        replacementRequests,
        approvalRate: approvalRate.toFixed(2),
        avgProcessingDays: avgProcessingDays.toFixed(2),
        totalRefundAmount: totalRefundAmount.toFixed(2),
      };
    } catch (error) {
      console.error("Error calculating return analytics:", error);
      return {
        totalRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        pendingRequests: 0,
        refundRequests: 0,
        returnRequests: 0,
        replacementRequests: 0,
        approvalRate: "0.00",
        avgProcessingDays: "0.00",
        totalRefundAmount: "0.00",
      };
    }
  }
}

export const storage = new DatabaseStorage();
