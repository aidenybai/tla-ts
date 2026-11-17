// test262's harness/sm/non262-JSON-shell.js, typed so that tla-ts can compile it.

// oxlint-disable-next-line no-unused-vars
function testJSON(str: string) {
  try {
    JSON.parse(str);
  } catch {
    throw new Test262Error("string <" + str + "> should have parsed as JSON");
  }
  try {
    JSON.parse(str + " ");
  } catch {
    throw new Test262Error("string <" + str + " > should have parsed as JSON");
  }
  try {
    JSON.parse(" " + str);
  } catch {
    throw new Test262Error("string < " + str + "> should have parsed as JSON");
  }
  try {
    JSON.parse(" " + str + " ");
  } catch {
    throw new Test262Error("string < " + str + " > should have parsed as JSON");
  }
}

// oxlint-disable-next-line no-unused-vars
function testJSONSyntaxError(str: string) {
  assert.throws(
    SyntaxError,
    function () {
      JSON.parse(str);
    },
    "string <" + str + "> shouldn't have parsed as JSON",
  );
  assert.throws(
    SyntaxError,
    function () {
      JSON.parse(str + " ");
    },
    "string <" + str + " > shouldn't have parsed as JSON",
  );
  assert.throws(
    SyntaxError,
    function () {
      JSON.parse(" " + str);
    },
    "string < " + str + "> shouldn't have parsed as JSON",
  );
  assert.throws(
    SyntaxError,
    function () {
      JSON.parse(" " + str + " ");
    },
    "string < " + str + " > shouldn't have parsed as JSON",
  );
}
