import { createHash } from "node:crypto";

function checkDigit(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    const digit = Number(digits[i]);
    const fromRight = digits.length - 1 - i;
    sum += fromRight % 2 === 0 ? digit * 3 : digit;
  }
  return (10 - (sum % 10)) % 10;
}

export function validGtin(value: string) {
  const digits = value.replace(/\s|-/g, "");
  if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(digits)) return false;
  return checkDigit(digits.slice(0, -1)) === Number(digits.at(-1));
}

export function validSscc(value: string) {
  const digits = value.replace(/\s|-/g, "");
  return /^\d{18}$/.test(digits) && checkDigit(digits.slice(0, -1)) === Number(digits.at(-1));
}

export function ssccForOrder(orderId: string) {
  const hash = createHash("sha256").update(orderId).digest("hex");
  const base = BigInt(`0x${hash.slice(0, 15)}`).toString().padStart(17, "0").slice(-17);
  return `${base}${checkDigit(base)}`;
}

export function gtinForSku(sku: string) {
  const hash = createHash("sha256").update(sku).digest("hex");
  const base = BigInt(`0x${hash.slice(0, 12)}`).toString().padStart(13, "0").slice(-13);
  return `${base}${checkDigit(base)}`;
}
