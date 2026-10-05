export interface CreateDeliveryRequest {
  fullName: string;
  phone: string | null;
  email: string | null;
  recipientPosition: string | null;
}

export interface DeliveryResponse {
  id: number;
  /** The single backend-generated identifier for the letter, e.g. REF-2026-7K4P92. */
  trackingNumber: string;
  status: string;
  deliveryPersonName: string;
  recipientName: string;
  recipientTitle: string;
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
  recipientPosition?: string;
}

export interface DeliveryFormValues {
  fullName: string;
  phone: string;
  email: string;
  recipientPosition: string;
}

export interface SubmitMessage {
  type: 'success' | 'error';
  text: string;
}
