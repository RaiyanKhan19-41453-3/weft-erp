const SMALL = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

function belowThousand(value: number): string {
  if (value < 20) return SMALL[value]!;
  if (value < 100) {
    const tens = Math.floor(value / 10);
    const rest = value % 10;
    return rest ? `${TENS[tens]}-${SMALL[rest]}` : TENS[tens]!;
  }
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  return rest
    ? `${SMALL[hundreds]} hundred ${belowThousand(rest)}`
    : `${SMALL[hundreds]} hundred`;
}

function integerWords(value: number): string {
  if (value === 0) return "zero";
  const parts: string[] = [];
  const millions = Math.floor(value / 1_000_000);
  const thousands = Math.floor((value % 1_000_000) / 1000);
  const remainder = value % 1000;
  if (millions) parts.push(`${belowThousand(millions)} million`);
  if (thousands) parts.push(`${belowThousand(thousands)} thousand`);
  if (remainder) parts.push(belowThousand(remainder));
  return parts.join(" ");
}

/** Converts a USD amount into a human-readable invoice total. */
export function amountInWords(amount: number) {
  const rounded = Math.round(amount * 100);
  const dollars = Math.floor(rounded / 100);
  const cents = rounded % 100;
  const dollarText = integerWords(dollars);
  const centText = cents ? ` and ${belowThousand(cents)} cents` : "";
  return `US Dollars ${dollarText}${centText} only`;
}
