let count = 0;

export const tick = () => {
  count = count === 3 ? 0 : count + 1;
};

export const isBounded = () => count <= 3;
