import { z } from "zod";

export const messageSchema = z
  .string()
  .min(1, { message: "Message cannot be empty" })
  .max(1000, {
    message: `Message must be less than 1000 characters`,
  })
  .trim();

export const searchSchema = z
  .string()
  .max(100, { message: "Search query too long" })
  .transform((val) => val.trim());

export const dateRangeSchema = z
  .object({
    from: z.date().nullable(),
    to: z.date().nullable(),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return data.from <= data.to;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["to"],
    },
  );

export const conversationStatusSchema = z.enum(["all", "PENDING", "RESOLVED"]);

export const conversationFilterSchema = z.object({
  search: searchSchema,
  dateRange: dateRangeSchema,
  status: conversationStatusSchema,
});

export type MessageData = z.infer<typeof messageSchema>;
export type SearchData = z.infer<typeof searchSchema>;
export type DateRangeData = z.infer<typeof dateRangeSchema>;
export type ConversationStatusData = z.infer<typeof conversationStatusSchema>;
export type ConversationFilterData = z.infer<typeof conversationFilterSchema>;

export const validateMessage = (message: string) => {
  return messageSchema.safeParse(message);
};

export const validateSearch = (search: string) => {
  return searchSchema.safeParse(search);
};

export const validateDateRange = (dateRange: unknown) => {
  return dateRangeSchema.safeParse(dateRange);
};

export const validateConversationStatus = (status: unknown) => {
  return conversationStatusSchema.safeParse(status);
};

export const validateConversationFilter = (filter: unknown) => {
  return conversationFilterSchema.safeParse(filter);
};
