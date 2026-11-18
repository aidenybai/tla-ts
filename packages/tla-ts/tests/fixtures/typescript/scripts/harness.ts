// A script that a page runs before another, whose globals the later script reads.
function check(value: unknown, message: string) {
  if (value !== true) throw new Error(message);
}

var shared = 1;
