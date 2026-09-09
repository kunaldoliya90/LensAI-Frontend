import { z } from "zod";

/** Mirrors SignupRequest: password is SecretStr with min_length 12. */
export const signupSchema = z.object({
  company_name: z.string().trim().min(1, "Enter your company name").max(255),
  name: z.string().trim().min(1, "Enter your name").max(255),
  email: z.email("Enter a valid email address"),
  password: z.string().min(12, "Use at least 12 characters"),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
