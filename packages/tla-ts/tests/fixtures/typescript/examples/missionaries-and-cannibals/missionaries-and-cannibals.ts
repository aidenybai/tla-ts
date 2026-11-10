// A port of MissionariesAndCannibals.tla from tlaplus/Examples.
type Person = "m1" | "m2" | "m3" | "c1" | "c2" | "c3";
type Bank = "E" | "W";

const missionaries = new Set<Person>(["m1", "m2", "m3"]);
const cannibals = new Set<Person>(["c1", "c2", "c3"]);

let bank_of_boat: Bank = "E";
let who_is_on_bank: Record<Bank, Set<Person>> = {
  E: missionaries.union(cannibals),
  W: new Set(),
};

const isSafe = (people: Set<Person>) =>
  people.isSubsetOf(cannibals) ||
  people.intersection(cannibals).size <= people.intersection(missionaries).size;

const otherBank = (bank: Bank) => (bank === "E" ? "W" : "E");

export const move = (people: Set<Person>) => {
  if (!people.isSubsetOf(who_is_on_bank[bank_of_boat])) return;
  if (people.size !== 1 && people.size !== 2) return;
  const newThisBank = who_is_on_bank[bank_of_boat].difference(people);
  const newOtherBank = who_is_on_bank[otherBank(bank_of_boat)].union(people);
  if (isSafe(newThisBank) && isSafe(newOtherBank)) {
    who_is_on_bank[otherBank(bank_of_boat)] = newOtherBank;
    who_is_on_bank[bank_of_boat] = newThisBank;
    bank_of_boat = otherBank(bank_of_boat);
  }
};

export const typeOK = () =>
  (bank_of_boat === "E" || bank_of_boat === "W") &&
  who_is_on_bank.E.isSubsetOf(cannibals.union(missionaries)) &&
  who_is_on_bank.W.isSubsetOf(cannibals.union(missionaries));

export const solution = () => who_is_on_bank.E.size !== 0;
