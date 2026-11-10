type OcamlValue = number | string | OcamlValue[];

export const compareStrings = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;

export const compareValues = (left: OcamlValue, right: OcamlValue): number => {
  if (typeof left === "number" && typeof right === "number") return left - right;
  if (typeof left === "string" && typeof right === "string") return compareStrings(left, right);
  if (!Array.isArray(left) || !Array.isArray(right)) return 0;
  const index = left.findIndex(
    (item, position) => position >= right.length || compareValues(item, right[position]) !== 0,
  );
  if (index === -1) return left.length - right.length;
  if (index >= right.length) return 1;
  return compareValues(left[index], right[index]);
};
