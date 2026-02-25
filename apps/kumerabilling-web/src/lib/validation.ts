import { z } from "zod";

export const onboardingSchema = z.object({
  companyName: z.string().min(2),
  rut: z.string().min(6),
  address: z.string().min(5),
  email: z.email(),
  phone: z.string().min(6),
  serviceSlug: z.string().min(2),
  planId: z.string().uuid(),
  taxDocumentType: z.enum(["boleta", "factura"]),
});

export const contractAcceptSchema = z.object({
  token: z.string().min(10),
  accepted: z.literal(true),
  signerName: z.string().min(5),
  signerRut: z.string().min(8),
  signerEmail: z.email(),
});

export const paymentRejectSchema = z.object({
  reason: z.string().min(3),
});

export const updateSubscriptionStatusSchema = z.object({
  status: z.enum(["pending_activation", "active", "suspended", "cancelled"]),
});
