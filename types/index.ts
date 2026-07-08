// ─── API Response Wrappers ───────────────────────────────────────────────────
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  size: number;
  totalElements: number | null;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  role: "USER" | "ADMIN";
  isSeller: boolean;
  isVerified: boolean;
  totalBought: number;
  totalSold: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  fullName: string;
  password: string;
  phone: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// ─── Shop ────────────────────────────────────────────────────────────────────
export interface Shop {
  id: number;
  slug: string;
  shopName: string;
  description: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  returnPolicy: string;
  shippingInfo: string;
  followerCount: number;
  rating: number;
  reviewCount: number;
  isFollowing: boolean;
  isOwner: boolean;
  isVerified?: boolean;
  owner?: {
    id: number;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
  createdAt: string;
}

export interface CreateShopRequest {
  shopName: string;
  description: string;
  logoUrl?: string;
  bannerUrl?: string;
  returnPolicy?: string;
  shippingInfo?: string;
}

// ─── Category ────────────────────────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  parentId: number | null;
  children?: Category[];
  productCount?: number;
}

// ─── Brand ───────────────────────────────────────────────────────────────────
export interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string;
  productCount?: number;
}

// ─── Product ─────────────────────────────────────────────────────────────────
export type Scale = "1:64" | "1:43" | "1:24" | "1:18";
export type Condition =
  | "SEALED"
  | "OPENED"
  | "LOOSE"
  | "DAMAGED_BOX"
  | "CUSTOM";

export const CONDITION_LABELS: Record<Condition, string> = {
  SEALED: "Nguyên seal",
  OPENED: "Đã mở hộp",
  LOOSE: "Không hộp",
  DAMAGED_BOX: "Hộp bị lỗi",
  CUSTOM: "Độ chế / Custom",
};

export interface Product {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: Category;
  brand: Brand;
  scale: Scale;
  carBrand: string;
  carModel: string;
  yearMade: number | null;
  color: string;
  material: string;
  condition: Condition;
  conditionNote: string;
  price: number;
  originalPrice: number | null;
  quantity: number;
  soldCount: number;
  weightGram: number | null;
  freeShipping: boolean;
  isCombo: boolean;
  comboQuantity: number | null;
  allowOffer: boolean;
  minOfferPrice: number | null;
  bulkDiscountMin: number | null;
  bulkDiscountPct: number | null;
  imageUrls: string[] | null;
  /** Detail endpoint returns images as objects */
  images?: { id: number; imageUrl: string; thumbnailUrl: string | null; isPrimary: boolean }[];
  /** Listing endpoint returns flat primary image */
  primaryImage?: string | null;
  /** Flat fields some list endpoints return instead of the nested shop object */
  shopId?: number;
  shopName?: string;
  shopSlug?: string;
  metaTitle: string | null;
  metaDescription: string | null;
  shop: Shop;
  ratingAvg: number | null;
  followerCount: number;
  isActive: boolean;
  isVerified?: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  categoryId: number;
  brandId: number;
  scale: Scale;
  carBrand: string;
  carModel: string;
  yearMade?: number;
  color: string;
  material: string;
  condition: Condition;
  conditionNote?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  weightGram?: number;
  freeShipping: boolean;
  isCombo: boolean;
  comboQuantity?: number;
  allowOffer: boolean;
  minOfferPrice?: number;
  bulkDiscountMin?: number;
  bulkDiscountPct?: number;
  imageUrls: string[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface ProductFilter {
  sortBy?: "newest" | "price_asc" | "price_desc";
  cursor?: string;
  size?: number;
  shopId?: number;
  categoryId?: number;
  brandId?: number;
  scale?: Scale;
  condition?: Condition;
  minPrice?: number;
  maxPrice?: number;
  keyword?: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  price: number;
  quantity: number;
  scale: string;
  condition: Condition;
  shopId: number;
  shopName: string;
  shopSlug: string;
  brandName: string | null;
  isAvailable: boolean;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  shopCount: number;
}

// ─── Order ────────────────────────────────────────────────────────────────────
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPING"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED"
  | "EXPIRED";

export type PaymentMethod =
  | "VNPAY"
  | "MOMO"
  | "COD"
  | "BANK_TRANSFER"
  | "WALLET";

export type PaymentStatus = "PAID" | "UNPAID" | "PENDING" | "FAILED" | "REFUNDED";

export type EscrowStatus = "NONE" | "HOLDING" | "RELEASED" | "REFUNDED";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Chờ thanh toán",
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  REFUNDED: "Đã hoàn tiền",
  EXPIRED: "Hết hạn thanh toán",
};

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  orderCode: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus | null;
  escrowStatus: EscrowStatus | null;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalQuantity: number;
  totalAmount: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingMethod: string | null;
  trackingNumber: string | null;
  buyerNote: string | null;
  sellerNote: string | null;
  cancelReason: string | null;
  paymentDeadline?: string | null;
  paymentExpiredAt?: string | null;
  items: OrderItem[];
  shop: {
    id: number;
    shopName: string;
    slug: string;
    owner?: { id: number };
  };
  buyer: {
    id: number;
    username: string;
    fullName: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface CheckoutRequest {
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  paymentMethod: PaymentMethod;
  buyerNote?: string;
  productIds: number[];
}

// ─── Auction ──────────────────────────────────────────────────────────────────
export type AuctionStatus =
  | "UPCOMING"
  | "ACTIVE"
  | "ENDED"
  | "CANCELLED"
  | "SOLD";

export interface AuctionBid {
  id: number;
  bidderId?: number;
  bidderUsername: string;
  bidderAvatar?: string | null;
  bidAmount: number;
  isWinning: boolean;
  createdAt: string;
}

export interface Auction {
  id: number;
  product: Product;
  seller: Shop;
  startingPrice: number;
  currentPrice: number;
  bidIncrement: number;
  reservePrice: number | null;
  buyNowPrice: number | null;
  startTime: string;
  endTime: string;
  autoExtendMinutes: number;
  snipeThresholdMin: number;
  status: AuctionStatus;
  bidCount: number;
  totalBids?: number;
  recentBids?: AuctionBid[];
  highestBidder: User | null;
  winner: User | null;
}

export interface BidRequest {
  bidAmount: number;
  maxAutoBid?: number;
}

export interface CreateAuctionRequest {
  productId: number;
  startingPrice: number;
  bidIncrement: number;
  reservePrice?: number;
  buyNowPrice?: number;
  startTime: string;
  endTime: string;
  autoExtendMinutes?: number;
  snipeThresholdMin?: number;
}

export interface MyAuction {
  id: number;
  status: AuctionStatus;
  productName: string;
  productImage: string | null;
  productId: number;
  startingPrice: number;
  currentPrice: number;
  reservePrice: number | null;
  reserveMet: boolean;
  totalBids: number;
  startTime: string;
  endTime: string;
  extendedCount: number;
  winnerUsername: string | null;
  createdAt: string;
}

export interface AuctionBidEvent {
  type: "NEW_BID" | "AUCTION_ENDED";
  auctionId: number;
  currentPrice: number;
  bidCount: number;
  highestBidder: { id: number; username: string } | null;
  endTime: string;
  winner?: { id: number; username: string } | null;
}

// ─── Offer ────────────────────────────────────────────────────────────────────
export type OfferStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "COUNTERED"
  | "COUNTER_ACCEPTED"
  | "CANCELLED"
  | "EXPIRED";

export interface Offer {
  id: number;
  product: Product;
  buyer: User;
  shop: Shop;
  offerPrice: number;
  counterPrice: number | null;
  message: string;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferRequest {
  productId: number;
  offerPrice: number;
  message?: string;
}

// ─── Wallet ───────────────────────────────────────────────────────────────────
export type TransactionType =
  | "DEPOSIT"
  | "WITHDRAW"
  | "PAYMENT"
  | "REFUND"
  | "EARNING"
  | "ESCROW_HOLD";

export interface WalletTransaction {
  id: number;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  relatedProduct?: {
    id: number;
    name: string;
    slug: string;
    imageUrls: string[];
  };
}

export interface Wallet {
  balance: number;
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface Review {
  id: number;
  orderId: number;
  type: "BUYER_TO_SELLER" | "SELLER_TO_BUYER";
  rating: number;
  comment: string;
  ratingAccuracy: number | null;
  ratingShipping: number | null;
  ratingCommunication: number | null;
  reply: string | null;
  repliedAt: string | null;
  reviewerUsername: string;
  reviewerAvatar: string | null;
  reviewedUsername: string;
  imageUrls: string[];
  createdAt: string;
}

export interface CreateReviewRequest {
  orderId: number;
  rating: number;
  comment: string;
  ratingAccuracy?: number;
  ratingShipping?: number;
  ratingCommunication?: number;
  imageUrls?: string[];
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export interface Conversation {
  id: number;
  otherId?: number;
  otherUsername: string;
  otherAvatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: number;
}

export type ChatTagType = "PRODUCT" | "ORDER" | "WANT_LIST";

export interface Message {
  id: number;
  senderUsername: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  imageUrls?: string[];
  tagType?: ChatTagType;
  tagId?: number;
  tagTitle?: string;
}

export interface SendMessageResponse {
  conversationId: number;
  messageId: number;
  senderUsername: string;
  content: string;
  type?: string;
  timestamp: string;
  imageUrls?: string[];
  tagType?: ChatTagType;
  tagId?: number;
  tagTitle?: string;
}

export interface ChatMessageEvent {
  conversationId: number;
  messageId: number;
  senderUsername: string;
  content: string;
  type?: string;
  timestamp: string;
  imageUrls?: string[];
}

// ─── Notification ─────────────────────────────────────────────────────────────
export type NotificationType =
  | "ORDER_PLACED" | "ORDER_CONFIRMED" | "ORDER_SHIPPED" | "ORDER_DELIVERED"
  | "ORDER_COMPLETED" | "ORDER_CANCELLED"
  | "BID_PLACED" | "BID_OUTBID" | "AUCTION_WON" | "AUCTION_LOST" | "AUCTION_ENDING_SOON"
  | "OFFER_RECEIVED" | "OFFER_ACCEPTED" | "OFFER_REJECTED" | "OFFER_COUNTERED"
  | "TRADE_PROPOSED" | "TRADE_ACCEPTED"
  | "WANT_LIST_MATCH" | "NEW_FOLLOWER" | "NEW_REVIEW"
  | "BADGE_EARNED" | "RANK_UP" | "PRODUCT_PRICE_DROP"
  | "PAYMENT_RECEIVED" | "ESCROW_RELEASED" | "REFUND_PROCESSED";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  referenceType: string | null;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export type BadgeTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";

export interface Badge {
  id: number;
  name: string;
  description: string;
  iconUrl: string | null;
  tier: BadgeTier;
  criteriaType: string;
  criteriaValue: number;
}

export interface UserBadge {
  id: number;
  name: string;
  description: string;
  iconUrl: string | null;
  tier: BadgeTier;
  isFeatured: boolean;
  earnedAt: string;
}

// ─── Showcase ─────────────────────────────────────────────────────────────────
export interface Showcase {
  id: number;
  name: string;
  description: string;
  coverImageUrl: string | null;
  itemCount: number;
  likeCount: number;
  viewCount: number;
  isPublic: boolean;
  isLiked: boolean;
  ownerUsername: string;
  items?: ShowcaseItem[];
  createdAt: string;
}

export interface ShowcaseItem {
  id: number;
  name: string;
  brand: string;
  scale: string;
  imageUrl: string | null;
  description: string;
  purchasePrice: number | null;
}

export interface CreateShowcaseRequest {
  name: string;
  description: string;
  coverImageUrl?: string;
  isPublic: boolean;
}

export interface CreateShowcaseItemRequest {
  name: string;
  brand: string;
  scale: string;
  imageUrl?: string;
  description?: string;
  purchasePrice?: number;
}

// ─── WantList ─────────────────────────────────────────────────────────────────
export type WantListStatus = "ACTIVE" | "CANCELLED" | "FULFILLED";

export interface WantList {
  id: number;
  title: string;
  description: string;
  scale: string | null;
  carBrand: string | null;
  carModel: string | null;
  maxPrice: number | null;
  status: WantListStatus;
  isPublic: boolean;
  userId?: number;
  username: string;
  createdAt: string;
  imageUrl: string | null;
  contactCount: number;
}

export interface CreateWantListRequest {
  title: string;
  description: string;
  scale?: string;
  carBrand?: string;
  carModel?: string;
  maxPrice?: number;
  isPublic: boolean;
  imageUrl?: string;
}

// ─── Trade ────────────────────────────────────────────────────────────────────
export type TradeStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "EXPIRED";

export interface Trade {
  id: number;
  status: TradeStatus;
  offererUsername: string;
  receiverUsername: string;
  targetProductId: number;
  targetProductName: string;
  cashOffset: number;
  message: string;
  offerProducts: { id: number; name: string }[];
  expiresAt: string | null;
  createdAt: string;
}

export interface CreateTradeRequest {
  targetProductId: number;
  offerProductIds: number[];
  cashOffset?: number;
  message?: string;
}

// ─── Report ───────────────────────────────────────────────────────────────────
export type ReportTargetType = "USER" | "PRODUCT" | "REVIEW" | "MESSAGE";

export type ReportReason =
  | "FAKE_PRODUCT" | "SCAM" | "INAPPROPRIATE" | "SPAM"
  | "HARASSMENT" | "COPYRIGHT" | "WRONG_CATEGORY" | "PRICE_GOUGING" | "OTHER";

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  FAKE_PRODUCT: "Sản phẩm giả mạo",
  SCAM: "Lừa đảo",
  INAPPROPRIATE: "Nội dung không phù hợp",
  SPAM: "Spam",
  HARASSMENT: "Quấy rối",
  COPYRIGHT: "Vi phạm bản quyền",
  WRONG_CATEGORY: "Sai danh mục",
  PRICE_GOUGING: "Giá cả bất hợp lý",
  OTHER: "Lý do khác",
};

export interface Report {
  id: number;
  targetType: ReportTargetType;
  targetId: number;
  reason: ReportReason;
  description: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  resolution: string | null;
  reporterUsername: string;
  createdAt: string;
}

export interface CreateReportRequest {
  targetType: ReportTargetType;
  targetId: number;
  reason: ReportReason;
  description: string;
}

// ─── Address ──────────────────────────────────────────────────────────────────
export interface Address {
  id: number;
  receiverName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault: boolean;
}

export interface CreateAddressRequest {
  receiverName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault: boolean;
}
