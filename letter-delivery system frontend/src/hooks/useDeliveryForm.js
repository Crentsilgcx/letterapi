import { useState, useEffect, useCallback } from 'react';
import { useForm } from './useForm';
import { deliveryApi } from '../api';

const initialValues = {
  deliveryPersonId: '',
  fullName: '',
  phone: '',
  email: '',
  organizationId: '',
  organizationName: '',
  recipientId: '',
  subject: '',
  referenceNumber: '',
  description: '',
};

const validate = (values) => {
  const errors = {};
  if (!values.recipientId) errors.recipientId = 'Recipient is required';
  if (!values.subject?.trim()) errors.subject = 'Subject is required';
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Invalid email format';
  }
  if (values.phone && values.phone.length > 60) errors.phone = 'Phone too long (max 60)';
  if (values.fullName && values.fullName.length > 160) errors.fullName = 'Name too long (max 160)';
  if (values.subject && values.subject.length > 250) errors.subject = 'Subject too long (max 250)';
  if (values.referenceNumber && values.referenceNumber.length > 120) errors.referenceNumber = 'Reference too long (max 120)';
  if (values.description && values.description.length > 5000) errors.description = 'Description too long (max 5000)';
  return errors;
};

export function useDeliveryForm() {
  const [recipients, setRecipients] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);

  const form = useForm(initialValues, validate);

  useEffect(() => {
    deliveryApi.getRecipients().then(setRecipients).catch(() => {});
    deliveryApi.getOrganizations().then(setOrganizations).catch(() => {});
    deliveryApi.getDeliveryPersons().then(setDeliveryPersons).catch(() => {});
  }, []);

  const submitDelivery = useCallback(async (values) => {
    const payload = {
      deliveryPersonId: values.deliveryPersonId ? Number(values.deliveryPersonId) : null,
      fullName: values.fullName || null,
      phone: values.phone || null,
      email: values.email || null,
      organizationId: values.organizationId ? Number(values.organizationId) : null,
      organizationName: values.organizationName || null,
      recipientId: Number(values.recipientId),
      subject: values.subject.trim(),
      referenceNumber: values.referenceNumber || null,
      description: values.description || null,
    };
    await deliveryApi.createDelivery(payload);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    return form.handleSubmit(submitDelivery)
      .then(() => form.resetForm())
      .then(() => form.setSubmitSuccess('Delivery created successfully!'))
      .catch(() => {});
  };

  return {
    ...form,
    recipients,
    organizations,
    deliveryPersons,
    handleSubmit,
  };
}