import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  price: z.number().positive("Price must be positive"),
  offerPrice: z.number().nonnegative().optional(),
  purchaseDate: z.string().or(z.date()).optional(),
  expireDate: z.string().or(z.date()).optional(),
  unit: z.string().min(1, "Unit is required"),
  stock: z.number().int().nonnegative().default(0),
  description: z.string().optional(),
  category: z.string().optional(),
  productImage: z.object({
    url: z.string().url(),
    publicId: z.string()
  }).optional(),
});

export const updateProductSchema = createProductSchema.partial();

// ID parameter validation
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid ID format"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
