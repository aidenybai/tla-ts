// A script that a page runs before another, whose globals the later script reads.
// oxlint-disable-next-line no-unused-vars
function check(value: unknown, message: string) {
  if (value !== true) throw new Error(message);
}

// oxlint-disable-next-line no-unused-vars
let shared = 1;
