export const onlyDigits = (value = '') => value.replace(/\D/g, '');

export function formatCpf(value = '') {
  const digits = onlyDigits(value).slice(0, 11);
  let formatted = digits.slice(0, 3);
  if (digits.length > 3) formatted += `.${digits.slice(3, 6)}`;
  if (digits.length > 6) formatted += `.${digits.slice(6, 9)}`;
  if (digits.length > 9) formatted += `-${digits.slice(9, 11)}`;
  return formatted;
}

export function formatCnpj(value = '') {
  const digits = onlyDigits(value).slice(0, 14);
  let formatted = digits.slice(0, 2);
  if (digits.length > 2) formatted += `.${digits.slice(2, 5)}`;
  if (digits.length > 5) formatted += `.${digits.slice(5, 8)}`;
  if (digits.length > 8) formatted += `/${digits.slice(8, 12)}`;
  if (digits.length > 12) formatted += `-${digits.slice(12, 14)}`;
  return formatted;
}

export function formatCpfOrCnpj(value = '') {
  const digits = onlyDigits(value).slice(0, 14);
  return digits.length <= 11 ? formatCpf(digits) : formatCnpj(digits);
}

export function formatPhone(value = '') {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return '';
  if (digits.length < 3) return `(${digits}`;
  const areaCode = digits.slice(0, 2);
  const number = digits.slice(2);
  if (number.length <= 4) return `(${areaCode}) ${number}`;
  const prefixLength = digits.length === 11 ? 5 : 4;
  return `(${areaCode}) ${number.slice(0, prefixLength)}-${number.slice(prefixLength)}`;
}

export function formatCep(value = '') {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function formatVehiclePlate(value = '') {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  return clean.length > 3 ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean;
}

export function normalizeVehiclePlate(value = '') {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
}

export function formatEmailInput(value = '') {
  return value.replace(/\s/g, '').toLowerCase().slice(0, 180);
}

