export interface CreateDeliveryRequest {
  fullName: string;
  phone: string | null;
  email: string | null;
  recipient: string | null;
}

export interface DeliveryResponse {
  id: number;
  /** The single backend-generated identifier for the letter, e.g. REF-2026-7K4P92. */
  trackingNumber: string;
  status: string;
  deliveryPersonName: string;
  deliveryPersonPhone: string | null;
  deliveryPersonEmail: string | null;
  organizationName: string | null;
  recipientName: string;
  recipientTitle: string | null;
  subject: string | null;
  referenceNumber: string | null;
  deliveredAt: string;
  receivedAt: string | null;
  receivedBy: string | null;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface RecipientPosition {
  value: string;
  label: string;
}

export interface FormErrors {
  fullName?: string;
  phone?: string;
  email?: string;
  recipient?: string;
}

export interface DeliveryFormValues {
  fullName: string;
  phone: string;
  email: string;
  recipient: string;
}

export interface SubmitMessage {
  type: 'success' | 'error';
  text: string;
}