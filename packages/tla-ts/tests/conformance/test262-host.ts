// test262's $262, with only the members that tla-ts can model, so that a test that reads another
// fails to type check. gc collects nothing, as a host's may.

// oxlint-disable-next-line no-unused-vars
const $262 = {
  gc: () => {},
};
