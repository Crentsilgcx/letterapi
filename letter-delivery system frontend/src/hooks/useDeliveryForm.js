import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from './useForm';
import { deliveryApi, adminApi } from '../api';

const initialValues = {
  deliveryPersonId: '',
  fullName: '',
  phone: '',
  email: '',
  organizationId: '',
  organizationName: '',
  recipientRole: '',
  subject: '',
  referenceNumber: '',
  description: '',
};

const validate = (values, isNewPerson) => {
  const errors = {};
  if (!values.recipientRole) errors.recipientRole = 'Recipient role is required';
  if (!values.subject?.trim()) errors.subject = 'Subject is required';
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Invalid email format';
  }
  if (values.phone && values.phone.length > 60) errors.phone = 'Phone too long (max 60)';
  if (values.fullName && values.fullName.length > 160) errors.fullName = 'Name too long (max 160)';
  if (values.subject && values.subject.length > 250) errors.subject = 'Subject too long (max 250)';
  if (values.referenceNumber && values.referenceNumber.length > 120) errors.referenceNumber = 'Reference too long (max 120)';
  if (values.description && values.description.length > 5000) errors.description = 'Description too long (max 5000)';
  
  if (isNewPerson) {
    if (!values.fullName?.trim()) errors.fullName = 'Delivery person name is required';
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = 'Invalid email format';
    }
  }
  return errors;
};

export function useDeliveryForm() {
  const [recipientRoles, setRecipientRoles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [isCreatingPerson, setIsCreatingPerson] = useState(false);

  const form = useForm(initialValues, (values) => validate(values, isNewPerson(values)));

  const fetchDeliveryPersons = useCallback(() => {
    deliveryApi.getDeliveryPersons().then(setDeliveryPersons).catch(() => {});
  }, []);

  useEffect(() => {
    deliveryApi.getRecipientRoles().then(setRecipientRoles).catch(() => {});
    deliveryApi.getOrganizations().then(setOrganizations).catch(() => {});
    fetchDeliveryPersons();
  }, [fetchDeliveryPersons]);

  const isNewPerson = useCallback((values = form.values) => {
    return values.deliveryPersonId === '__new__';
  }, [form.values]);

  const selectedPerson = useMemo(() => {
    if (!form.values.deliveryPersonId || form.values.deliveryPersonId === '__new__') return null;
    return deliveryPersons.find(p => String(p.id) === String(form.values.deliveryPersonId));
  }, [form.values.deliveryPersonId, deliveryPersons]);

  const isDuplicateName = useMemo(() => {
    const name = form.values.fullName?.trim().toLowerCase();
    if (!name || form.values.deliveryPersonId !== '__new__') return false;
    return deliveryPersons.some(p => p.fullName?.toLowerCase() === name);
  }, [form.values.fullName, form.values.deliveryPersonId, deliveryPersons]);

  const submitDelivery = useCallback(async (values) => {
    const isNew = values.deliveryPersonId === '__new__';
    
    const payload = {
      deliveryPersonId: isNew ? null : (values.deliveryPersonId ? Number(values.deliveryPersonId) : null),
      fullName: isNew ? values.fullName.trim() : (values.fullName || null),
      phone: isNew ? (values.phone || null) : (values.phone || null),
      email: isNew ? (values.email || null) : (values.email || null),
      organizationId: isNew ? (values.organizationId ? Number(values.organizationId) : null) : (values.organizationId ? Number(values.organizationId) : null),
      organizationName: isNew ? (values.organizationName || null) : (values.organizationName || null),
      recipientRole: values.recipientRole,
      subject: values.subject.trim(),
      referenceNumber: values.referenceNumber || null,
      description: values.description || null,
    };
    
    setIsCreatingPerson(true);
    try {
      await deliveryApi.createDelivery(payload);
    } finally {
      setIsCreatingPerson(false);
    }
  }, []);

  const handleDeliveryPersonChange = useCallback((e) => {
    const value = e.target.value;
    form.setFieldValue('deliveryPersonId', value);
    
    if (value === '__new__') {
      form.setFieldValue('fullName', '');
      form.setFieldValue('phone', '');
      form.setFieldValue('email', '');
      form.setFieldValue('organizationId', '');
      form.setFieldValue('organizationName', '');
    } else if (value) {
      const person = deliveryPersons.find(p => String(p.id) === String(value));
      if (person) {
        form.setFieldValue('fullName', person.fullName || '');
        form.setFieldValue('phone', person.phone || '');
        form.setFieldValue('email', person.email || '');
        form.setFieldValue('organizationId', person.organizationId ? String(person.organizationId) : '');
        form.setFieldValue('organizationName', person.organizationName || '');
      }
    }
  }, [form, deliveryPersons]);

  const handleSubmit = (e) => {
    e.preventDefault();
    return form.handleSubmit(submitDelivery)
      .then(() => form.resetForm())
      .then(() => form.setSubmitSuccess('Delivery created successfully!'))
      .catch(() => {});
  };

  const handleNewPersonCreated = useCallback(() => {
    fetchDeliveryPersons();
    form.setFieldValue('deliveryPersonId', '');
  }, [fetchDeliveryPersons, form]);

  return {
    ...form,
    recipientRoles,
    organizations,
    deliveryPersons,
    selectedPerson,
    isNewPerson: isNewPerson(),
    isDuplicateName,
    isCreatingPerson,
    isSubmitting: form.isSubmitting || isCreatingPerson,
    handleDeliveryPersonChange,
    handleSubmit,
    handleNewPersonCreated,
  };
}