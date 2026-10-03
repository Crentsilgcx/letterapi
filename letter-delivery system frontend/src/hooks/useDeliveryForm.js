import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from './useForm';
import { deliveryApi } from '../api';

const initialValues = {
  deliveryPersonId: '',
  fullName: '',
  phone: '',
  email: '',
  organizationName: '',
  recipientRole: '',
};

const validate = (values, isNewPerson) => {
  const errors = {};
  if (!values.recipientRole) errors.recipientRole = 'Recipient position is required';
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Invalid email format';
  }
  if (values.phone && values.phone.length > 60) errors.phone = 'Phone too long (max 60)';
  if (values.fullName && values.fullName.length > 160) errors.fullName = 'Name too long (max 160)';
  if (values.organizationName && values.organizationName.length > 180) errors.organizationName = 'Organization name too long (max 180)';
  
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
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [isCreatingPerson, setIsCreatingPerson] = useState(false);

  const form = useForm(initialValues, (values) => validate(values, isNewPerson(values)));

  const fetchDeliveryPersons = useCallback(() => {
    deliveryApi.getDeliveryPersons().then(setDeliveryPersons).catch(() => {});
  }, []);

  useEffect(() => {
    deliveryApi.getRecipientRoles().then(setRecipientRoles).catch(() => {});
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
      organizationName: isNew ? (values.organizationName || null) : (values.organizationName || null),
      recipientRole: values.recipientRole,
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
      form.setFieldValue('organizationName', '');
    } else if (value) {
      const person = deliveryPersons.find(p => String(p.id) === String(value));
      if (person) {
        form.setFieldValue('fullName', person.fullName || '');
        form.setFieldValue('phone', person.phone || '');
        form.setFieldValue('email', person.email || '');
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