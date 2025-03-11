import { CONFIG } from "@/config";
import { z } from "zod";

export const visitorFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .max(50, { message: "Name must be less than 50 characters" })
    .trim(),
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .trim(),
});

export const messageSchema = z
  .string()
  .min(1, { message: "Message cannot be empty" })
  .max(CONFIG.CHAT.MAX_MESSAGE_LENGTH || 1000, {
    message: `Message must be less than ${CONFIG.CHAT.MAX_MESSAGE_LENGTH || 1000} characters`,
  })
  .trim();

export type VisitorFormData = z.infer<typeof visitorFormSchema>;
export type MessageData = z.infer<typeof messageSchema>;

export const validateVisitorForm = (data: unknown) => {
  return visitorFormSchema.safeParse(data);
};

export const validateMessage = (message: string) => {
  return messageSchema.safeParse(message);
};
