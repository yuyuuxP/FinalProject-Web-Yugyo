'use client';

import { useEffect } from 'react';

const NON_TEXT_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'date',
  'datetime-local',
  'file',
  'hidden',
  'image',
  'month',
  'number',
  'password',
  'radio',
  'range',
  'reset',
  'submit',
  'time',
  'week',
]);

const allowedText = /^[\p{L}\p{N}\p{M}\s]*$/u;
const allowedTitle = /^[\p{L}\p{N}\p{M}\s,.]*$/u;
const allowedPhone = /^[0-9+().\-\s]*$/;
const phoneMessage =
  'Nomor telepon hanya boleh berisi angka, spasi, +, -, (, dan ).';
const titleMessage =
  'Kolom gelar hanya boleh berisi huruf, angka, spasi, koma, dan titik.';
const textMessage =
  'Simbol tidak diperbolehkan. Gunakan huruf, angka, dan spasi.';
const validationMessages = new Set([
  phoneMessage,
  titleMessage,
  textMessage,
]);

function isUnrestrictedField(target) {
  if (
    !(target instanceof HTMLInputElement) &&
    !(target instanceof HTMLTextAreaElement)
  ) {
    return false;
  }

  const type = target instanceof HTMLInputElement
    ? target.type.toLowerCase()
    : 'textarea';
  const identity = `${target.name} ${target.id}`.toLowerCase();
  return (
    target.dataset.validationExempt === 'email' ||
    target.dataset.validationExempt === 'password' ||
    target.dataset.validationExempt === 'time' ||
    type === 'email' ||
    type === 'password' ||
    identity.includes('email') ||
    identity.includes('password')
  );
}

function getEditableField(target) {
  if (
    !(target instanceof HTMLInputElement) &&
    !(target instanceof HTMLTextAreaElement)
  ) {
    return null;
  }

  if (
    target.disabled ||
    target.readOnly ||
    isUnrestrictedField(target)
  ) {
    return null;
  }

  const type =
    target instanceof HTMLInputElement
      ? target.type.toLowerCase()
      : 'textarea';
  if (NON_TEXT_TYPES.has(type) || type === 'url') return null;

  return target;
}

function isAllowedValue(field, value) {
  if (field instanceof HTMLInputElement && field.type === 'tel') {
    return allowedPhone.test(value);
  }

  return (field.dataset.allowPunctuation === 'title'
    ? allowedTitle
    : allowedText
  ).test(value);
}

function validationMessage(field) {
  if (field instanceof HTMLInputElement && field.type === 'tel') {
    return phoneMessage;
  }

  return field.dataset.allowPunctuation === 'title'
    ? titleMessage
    : textMessage;
}

export default function InputSymbolValidation() {
  useEffect(() => {
    const invalidFields = new WeakSet();

    const setInvalid = (field) => {
      field.setCustomValidity(validationMessage(field));
      invalidFields.add(field);
      field.reportValidity();
    };

    const clearInvalid = (field) => {
      if (
        !invalidFields.has(field) &&
        !validationMessages.has(field.validationMessage)
      ) {
        return;
      }

      field.setCustomValidity('');
      invalidFields.delete(field);
    };

    const getFieldForEvent = (target) => {
      const field = getEditableField(target);
      if (!field && isUnrestrictedField(target)) {
        clearInvalid(target);
      }
      return field;
    };

    const handleBeforeInput = (event) => {
      const field = getFieldForEvent(event.target);
      if (!field) return;
      if (event.inputType?.startsWith('delete')) {
        clearInvalid(field);
        return;
      }
      if (typeof event.data !== 'string') return;

      const allowed = isAllowedValue(field, event.data);
      if (!allowed) {
        event.preventDefault();
        setInvalid(field);
        return;
      }

      clearInvalid(field);
    };

    const handlePaste = (event) => {
      const field = getFieldForEvent(event.target);
      if (!field) return;

      const pastedText = event.clipboardData?.getData('text');
      if (typeof pastedText !== 'string') return;

      if (!isAllowedValue(field, pastedText)) {
        event.preventDefault();
        setInvalid(field);
        return;
      }

      clearInvalid(field);
    };

    const handleDrop = (event) => {
      const field = getFieldForEvent(event.target);
      if (!field) return;

      const droppedText = event.dataTransfer?.getData('text');
      if (typeof droppedText !== 'string') return;

      if (!isAllowedValue(field, droppedText)) {
        event.preventDefault();
        setInvalid(field);
        return;
      }

      clearInvalid(field);
    };

    const handleInput = (event) => {
      const field = getFieldForEvent(event.target);
      if (!field) return;

      if (isAllowedValue(field, field.value)) {
        clearInvalid(field);
      } else {
        setInvalid(field);
      }
    };

    const handleFocusOut = (event) => {
      const field = getFieldForEvent(event.target);
      if (field && isAllowedValue(field, field.value)) {
        clearInvalid(field);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key !== 'Enter') return;

      const field = getFieldForEvent(event.target);
      if (
        field instanceof HTMLInputElement &&
        isAllowedValue(field, field.value)
      ) {
        clearInvalid(field);
      }
    };

    const handleSubmit = (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      for (const field of form.elements) {
        if (isUnrestrictedField(field)) {
          clearInvalid(field);
        }

        const editableField = getEditableField(field);
        if (!editableField) continue;

        if (isAllowedValue(editableField, editableField.value)) {
          clearInvalid(editableField);
          continue;
        }

        setInvalid(editableField);
        event.preventDefault();
        event.stopPropagation();
        editableField.focus();
        return;
      }
    };

    const clearExemptFieldValidity = (event) => {
      if (isUnrestrictedField(event.target)) {
        clearInvalid(event.target);
      }
    };

    document
      .querySelectorAll('input, textarea')
      .forEach((field) => clearExemptFieldValidity({ target: field }));

    document.addEventListener('beforeinput', handleBeforeInput, true);
    document.addEventListener('paste', handlePaste, true);
    document.addEventListener('drop', handleDrop, true);
    document.addEventListener('input', handleInput, true);
    document.addEventListener('change', handleInput, true);
    document.addEventListener('focusin', clearExemptFieldValidity, true);
    document.addEventListener('focusout', handleFocusOut, true);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('submit', handleSubmit, true);

    return () => {
      document.removeEventListener('beforeinput', handleBeforeInput, true);
      document.removeEventListener('paste', handlePaste, true);
      document.removeEventListener('drop', handleDrop, true);
      document.removeEventListener('input', handleInput, true);
      document.removeEventListener('change', handleInput, true);
      document.removeEventListener('focusin', clearExemptFieldValidity, true);
      document.removeEventListener('focusout', handleFocusOut, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('submit', handleSubmit, true);
    };
  }, []);

  return null;
}
