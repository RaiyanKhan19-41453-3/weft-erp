function fnv1a(value: string, salt = 0) {
  let hash = 2166136261 ^ salt;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function digits(value: string, length: number) {
  const first = fnv1a(value).toString(16).padStart(8, "0");
  const second = fnv1a(value, 0x9e3779b9).toString(16).padStart(8, "0");
  const decimal = BigInt(`0x${first}${second}`).toString();
  return decimal.padStart(length, "0").slice(-length);
}

function checkDigit(digitsValue: string) {
  let sum = 0;
  for (let i = 0; i < digitsValue.length; i += 1) {
    const digit = Number(digitsValue[i]);
    const fromRight = digitsValue.length - 1 - i;
    sum += fromRight % 2 === 0 ? digit * 3 : digit;
  }
  return (10 - (sum % 10)) % 10;
}

export function validGtin(value: string) {
  const normalized = value.replace(/\s|-/g, "");
  if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(normalized)) return false;
  return checkDigit(normalized.slice(0, -1)) === Number(normalized.at(-1));
}

export function validSscc(value: string) {
  const normalized = value.replace(/\s|-/g, "");
  return /^\d{18}$/.test(normalized) && checkDigit(normalized.slice(0, -1)) === Number(normalized.at(-1));
}

export function ssccForOrder(orderId: string) {
  const base = digits(orderId, 17);
  return `${base}${checkDigit(base)}`;
}

export function gtinForSku(sku: string) {
  const base = digits(sku, 13);
  return `${base}${checkDigit(base)}`;
}
