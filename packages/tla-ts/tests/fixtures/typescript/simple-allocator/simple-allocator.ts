// A port of the safety part of SimpleAllocator.tla from tlaplus/Examples, with the constants of
// TLC's ExamplesSimpleAllocatorTest, Clients = {c1, c2, c3} and Resources = {r1, r2}, and the
// spec's Symmetry over both, which that test leaves out as it checks liveness.

/** @symmetric */
type Client = "c1" | "c2" | "c3";
/** @symmetric */
type Resource = "r1" | "r2";

// taken is the union of alloc's sets: the resources that available leaves out.
let unsat: Record<Client, Set<Resource>> = { c1: new Set(), c2: new Set(), c3: new Set() };
let alloc: Record<Client, Set<Resource>> = { c1: new Set(), c2: new Set(), c3: new Set() };
let taken = new Set<Resource>();

export const request = (c: Client, wanted: Set<Resource>) => {
  if (unsat[c].size !== 0 || alloc[c].size !== 0 || wanted.size === 0) return;
  unsat[c] = wanted;
};

export const allocate = (c: Client, given: Set<Resource>) => {
  if (given.size === 0 || !given.isSubsetOf(unsat[c]) || !given.isDisjointFrom(taken)) return;
  alloc[c] = alloc[c].union(given);
  unsat[c] = unsat[c].difference(given);
  taken = taken.union(given);
};

export const giveBack = (c: Client, returned: Set<Resource>) => {
  if (returned.size === 0 || !returned.isSubsetOf(alloc[c])) return;
  alloc[c] = alloc[c].difference(returned);
  taken = taken.difference(returned);
};

// ResourceMutex, which TLC checks in every state for every two clients.
export const checkMutex = (a: Client, b: Client) => {
  if (a !== b && !alloc[a].isDisjointFrom(alloc[b])) throw "two clients hold a resource";
};
