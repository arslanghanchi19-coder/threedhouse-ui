import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const products = sqliteTable("products", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: integer("price").notNull(),
  stock: integer("stock").notNull().default(0),
  material: text("material").notNull().default("PETG"),
  color: text("color").notNull().default(""),
  description: text("description").notNull().default(""),
  imageKey: text("image_key"),
  images: text("images").notNull().default("[]"),
});
export const categories = sqliteTable("categories", {
  name: text("name").primaryKey(),
  imageKey: text("image_key"),
});
export const makingVideos = sqliteTable("making_videos", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  videoKey: text("video_key").notNull(),
});
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull().default(""),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  orderStatus: text("order_status").notNull().default("new"),
  courier: text("courier").notNull().default(""),
  trackingNumber: text("tracking_number").notNull().default(""),
  trackingUrl: text("tracking_url").notNull().default(""),
  ownerNote: text("owner_note").notNull().default(""),
  subtotal: integer("subtotal").notNull(),
  shipping: integer("shipping").notNull().default(0),
  total: integer("total").notNull(),
  items: text("items").notNull(),
});

export const quotes = sqliteTable("quotes", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull().default(""),
  projectType: text("project_type").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  status: text("status").notNull().default("new"),
  ownerNote: text("owner_note").notNull().default(""),
});
