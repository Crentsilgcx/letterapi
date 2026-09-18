import { useState, useCallback } from 'react';

export function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);

  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const setFieldTouched = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFieldValue(name, value);
  }, [setFieldValue]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setFieldTouched(name);
  }, [setFieldTouched]);

  const runValidation = useCallback(() => {
    if (!validate) return true;
    const newErrors = validate(values);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validate, values]);

  const handleSubmit = useCallback(async (onSubmit) => {
    if (!runValidation()) return;
    setIsSubmitting(true);
    setSubmitMessage(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setSubmitMessage({ type: 'error', text: err.message });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [runValidation, values]);

  const resetForm = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setSubmitMessage(null);
  }, [initialValues]);

  const setSubmitSuccess = useCallback((message) => {
    setSubmitMessage({ type: 'success', text: message });
  }, []);

  const setSubmitError = useCallback((message) => {
    setSubmitMessage({ type: 'error', text: message });
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitMessage,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldTouched,
    runValidation,
    handleSubmit,
    resetForm,
    setSubmitSuccess,
    setSubmitError,
  };
}