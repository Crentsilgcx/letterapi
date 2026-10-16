import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DeliveryFormValues,
  FormErrors,
  SubmitMessage,
  CreateDeliveryRequest,
} from '../types';
import { validateGhanaMobilePhone } from '../utils/phoneValidation';

const DRAFT_STORAGE_KEY = 'delivery-form-draft';

const initialValues: DeliveryFormValues = {
  fullName: '',
  phone: '',
  email: '',
  recipient: '',
};

export function useDeliveryForm(onSubmit: (payload: CreateDeliveryRequest) => Promise<void>) {
  const [values, setValues] = useState<DeliveryFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<SubmitMessage | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  // Closes the double-tap window between the press and the state update, so a
  // single letter can never be created twice. Nothing retries a failed POST.
  const submittingRef = useRef(false);
  const draftHydratedRef = useRef(false);

  // Load a partially filled form once, then keep saving it as the courier types
  // so an accidental app close never loses a delivery.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
        if (cancelled || !stored) return;
        const parsed = JSON.parse(stored);
        if (!parsed || typeof parsed !== 'object') return;
        setValues((prev) => ({
          fullName: typeof parsed.fullName === 'string' ? parsed.fullName : prev.fullName,
          phone: typeof parsed.phone === 'string' ? parsed.phone : prev.phone,
          email: typeof parsed.email === 'string' ? parsed.email : prev.email,
          recipient: typeof parsed.recipient === 'string' ? parsed.recipient : prev.recipient,
        }));
      } catch {
        // A missing or corrupt draft simply means an empty form.
      } finally {
        if (!cancelled) draftHydratedRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!draftHydratedRef.current) return;
    AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(values)).catch(() => {
      // Saving the draft is best effort.
    });
  }, [values]);

  const clearDraft = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }
  }, []);

  const validate = useCallback((formValues: DeliveryFormValues): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formValues.fullName?.trim()) {
      newErrors.fullName = 'Delivery person name is required';
    }

    if (formValues.phone && formValues.phone.trim().length > 60) {
      newErrors.phone = 'Phone is too long (max 60 characters)';
    }

    // Validate phone number if provided - Ghanaian mobile validation
    if (formValues.phone && formValues.phone.trim()) {
      const phoneValidation = validateGhanaMobilePhone(formValues.phone.trim());
      if (!phoneValidation.valid) {
        newErrors.phone = phoneValidation.error;
      }
    }

    // Validate email - simple validation: must contain @ and .com
    if (formValues.email && formValues.email.trim()) {
      const email = formValues.email.trim().toLowerCase();
      if (!email.includes('@') || !email.includes('.com')) {
        newErrors.email = 'Enter a valid email address (must contain @ and .com)';
      }
    }

    // recipient is optional - validate length if provided
    if (formValues.recipient && formValues.recipient.length > 160) {
      newErrors.recipient = 'Recipient is too long (max 160 characters)';
    }

    return newErrors;
  }, []);

  const handleChange = useCallback((field: keyof DeliveryFormValues, value: string | ((prev: string) => string)) => {
    console.log('[DeliveryForm] handleChange:', field, value);
    setValues((prev) => ({
      ...prev,
      [field]: typeof value === 'function' ? value(prev[field]) : value
    }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  const handleBlur = useCallback(
    (field: keyof DeliveryFormValues) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const fieldErrors = validate({ ...values, [field]: values[field] });
      if (fieldErrors[field]) {
        setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }));
      }
    },
    [validate, values]
  );

const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;

    console.log('[DeliveryForm] handleSubmit - current values:', values);

    const newErrors = validate(values);
if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({
        fullName: true,
        phone: true,
        email: true,
        recipient: true,
      });
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const payload: CreateDeliveryRequest = {
        fullName: values.fullName.trim(),
        phone: values.phone?.trim() || null,
        email: values.email?.trim() || null,
        recipient: values.recipient?.trim() || null,
      };

      console.log('[DeliveryForm] Sending payload:', payload);

      await onSubmit(payload);

      await clearDraft();
      setValues(initialValues);
      setErrors({});
      setTouched({});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit delivery';
      setSubmitMessage({ type: 'error', text: errorMessage });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [clearDraft, onSubmit, validate, values]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitMessage(null);
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitMessage,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setSubmitMessage,
  };
}