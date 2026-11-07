// An open-addressing table of each entry's hash and its position plus one, side by side. A Map holds
// at most 2^24 entries.
export const createHashIndex = () => {
  const index = { slots: new Int32Array(1 << 12), size: 0, shift: 21 };
  const getSlot = (hash: number) => (Math.imul(hash, 0x9e3779b1) >>> index.shift) << 1;
  const insert = (hash: number, entry: number) => {
    const slots = index.slots;
    const mask = slots.length - 1;
    let slot = getSlot(hash);
    while (slots[slot + 1] !== 0) slot = (slot + 2) & mask;
    slots[slot] = hash;
    slots[slot + 1] = entry;
  };
  return {
    // The position of the first entry with this hash that isMatch accepts, or -1.
    find: <Target>(
      hash: number,
      isMatch: (position: number, target: Target) => boolean,
      target: Target,
    ) => {
      const slots = index.slots;
      const mask = slots.length - 1;
      for (let slot = getSlot(hash); ; slot = (slot + 2) & mask) {
        const entry = slots[slot + 1];
        if (entry === 0) return -1;
        if (slots[slot] === hash && isMatch(entry - 1, target)) return entry - 1;
      }
    },
    add: (hash: number, position: number) => {
      index.size++;
      if (index.size * 4 > index.slots.length) {
        const slots = index.slots;
        index.slots = new Int32Array(slots.length * 2);
        index.shift--;
        for (let slot = 0; slot < slots.length; slot += 2) {
          if (slots[slot + 1] !== 0) insert(slots[slot], slots[slot + 1]);
        }
      }
      insert(hash, position + 1);
    },
  };
};
