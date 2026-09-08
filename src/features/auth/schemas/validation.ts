import { z } from "zod";

export type FieldErrors = Record<string, string | undefined>;

const trimString = (schema: z.ZodString) => schema.trim();

export const emailSchema = trimString(
  z
    .string()
    .min(1, "Email is required.")
    .max(254, "Email must be 254 characters or fewer.")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."),
).toLowerCase();

export const nameSchema = trimString(
  z
    .string()
    .min(1, "Full name is required.")
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must be 100 characters or fewer.")
    .regex(
      /^[\p{L}][\p{L}\s.'-]*$/u,
      "Name can only contain letters, spaces, apostrophes and hyphens.",
    ),
);

export const passwordSchema = z
  .string()
  .min(1, "Password is required.")
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be 128 characters or fewer.")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter.")
  .regex(/[0-9]/, "Password must include at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must include at least one special character.");

export const loginPasswordSchema = z
  .string()
  .min(1, "Password is required.")
  .max(128, "Password must be 128 characters or fewer.");

export const otpSchema = z
  .string()
  .min(1, "Enter the 6-digit code.")
  .regex(/^\d{6}$/, "The code must be exactly 6 digits.");

export const signInSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export const signUpSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

function issueToErrors(
  issues: z.ZodIssue[],
): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path[0]?.toString() ?? "form";
    if (errors[key] === undefined) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function validateSignIn(values: {
  email: string;
  password: string;
}): FieldErrors {
  const result = signInSchema.safeParse(values);
  return result.success ? {} : issueToErrors(result.error.issues);
}

export function validateSignUp(values: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): FieldErrors {
  const result = signUpSchema.safeParse(values);
  return result.success ? {} : issueToErrors(result.error.issues);
}

export function validateForgotPassword(email: string): FieldErrors {
  const result = forgotPasswordSchema.safeParse({ email });
  return result.success ? {} : issueToErrors(result.error.issues);
}

export function validateResetPassword(values: {
  password: string;
  confirmPassword: string;
}): FieldErrors {
  const result = resetPasswordSchema.safeParse(values);
  return result.success ? {} : issueToErrors(result.error.issues);
}

export function validateOtp(code: string): string | undefined {
  const result = otpSchema.safeParse(code);
  return result.success ? undefined : result.error.issues[0].message;
}
