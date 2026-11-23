interface Found {
  text: string;
  index: number;
}

const DIGITS = /^[0-9]+/;

export const readNumbers = (text: string) => {
  const numbers: Found[] = [];
  let index = 0;
  while (index < text.length) {
    const digits = DIGITS.exec(text.slice(index));
    if (digits) {
      numbers.push({ text: digits[0], index });
      index += digits[0].length;
      continue;
    }
    index += 1;
  }
  return numbers;
};
