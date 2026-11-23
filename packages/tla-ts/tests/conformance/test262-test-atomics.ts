// test262's harness/testAtomics.js, typed so that tla-ts can compile it. The original makes its
// index generators in each call, and tla-ts calls a function from an array only where the array is a
// module's, so they are made once. It also adds the generator or value to the message of an error
// it rethrows, which changes no outcome. A test calls only some of its functions.
/* oxlint-disable no-unused-vars */

// A test passes what a generator gives to an Atomics method, which JavaScript doesn't type.
// oxlint-disable-next-line typescript/no-explicit-any
type IndexGenerator = (view: { length: number }) => any;

const bad_indices: IndexGenerator[] = [
  function (view) {
    return -1;
  },
  function (view) {
    return view.length;
  },
  function (view) {
    return view.length * 2;
  },
  function (view) {
    return Number.POSITIVE_INFINITY;
  },
  function (view) {
    return Number.NEGATIVE_INFINITY;
  },
  function (view) {
    return {
      valueOf: function () {
        return 125;
      },
    };
  },
  // A valueOf that isn't callable makes ToPrimitive call toString.
  function (view) {
    return {
      toString: function () {
        return "125";
      },
      valueOf: false,
    };
  },
];

function testWithAtomicsOutOfBoundsIndices(f: (IdxGen: IndexGenerator) => void) {
  for (let i = 0; i < bad_indices.length; ++i) {
    f(bad_indices[i]);
  }
}

// Most of these are eventually coerced to +0 by ToIndex.
const good_indices: IndexGenerator[] = [
  function (view) {
    // -0, which the operation makes rather than erases.
    // oxlint-disable-next-line erasing-op
    return 0 / -1;
  },
  function (view) {
    return "-0";
  },
  function (view) {
    return undefined;
  },
  function (view) {
    return NaN;
  },
  function (view) {
    return 0.5;
  },
  function (view) {
    return "0.5";
  },
  function (view) {
    return -0.9;
  },
  function (view) {
    return { password: "qumquat" };
  },
  function (view) {
    return view.length - 1;
  },
  function (view) {
    return {
      valueOf: function () {
        return 0;
      },
    };
  },
  // A valueOf that isn't callable makes ToPrimitive call toString.
  function (view) {
    return {
      toString: function () {
        return "0";
      },
      valueOf: false,
    };
  },
];

// The view must have length greater than zero.
function testWithAtomicsInBoundsIndices(f: (IdxGen: IndexGenerator) => void) {
  for (let i = 0; i < good_indices.length; ++i) {
    f(good_indices[i]);
  }
}

// oxlint-disable-next-line typescript/no-explicit-any
function testWithAtomicsNonViewValues(f: (nonView: any) => void) {
  const values: unknown[] = [
    null,
    undefined,
    true,
    false,
    new Boolean(true),
    10,
    3.14,
    new Number(4),
    "Hi there",
    new Date(),
    /a*utomaton/g,
    { password: "qumquat" },
    new DataView(new ArrayBuffer(10)),
    new ArrayBuffer(128),
    new SharedArrayBuffer(128),
    new Error("Ouch"),
    [1, 1, 2, 3, 5, 8],
    function (x: number) {
      return -x;
    },
    Symbol("halleluja"),
    Object,
    Int32Array,
    Date,
    Math,
    Atomics,
  ];
  for (let i = 0; i < values.length; ++i) {
    f(values[i]);
  }
}
