import { z } from "zod";

export const signupBodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
});

export const loginBodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
});

export type SignupBody = z.infer<typeof signupBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
