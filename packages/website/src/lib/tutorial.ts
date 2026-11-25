import type { Language } from "./highlighter";

interface Comparison {
  typescript: string;
  tla: string;
}

interface Listing {
  language: Language;
  code: string;
}

interface Subheading {
  heading: string;
}

interface Table {
  header: string[];
  rows: string[][];
}

interface Lesson {
  title: string;
  blocks: (string | Comparison | Listing | Subheading | Table)[];
}

// A string is a paragraph, and text between backticks in it is code. The two sides of a comparison
// are written row for row, because an arrow joins each row that has code on both sides.
export const LESSONS: Lesson[] = [
  {
    title: "The problem",
    blocks: [
      "Here's a like button with a bug in it.",
      {
        language: "typescript",
        code: `let likes = 0;

export const like = () => {
  likes += 1;
};

export const unlike = () => {
  likes -= 1;
};

export const neverNegative = () => likes >= 0;`,
      },
      "If someone clicks unlike before they've liked anything, `likes` goes to -1. You'd only catch that with a test if you already thought to try it.",
      "TLA-ts doesn't need you to think of it. Save the file as `likes.ts` and run it:",
      { language: "shellscript", code: "npx tla-ts likes.ts" },
      {
        language: "text",
        code: `Error: Invariant neverNegative is violated.
Error: The behavior up to this point is:
State 1: <Initial predicate>
likes = 0

State 2: <unlike line 501, col 11 to line 501, col 52 of module ProgramCode>
likes = -1`,
      },
      "It called `unlike` first, saw that `neverNegative` returned `false`, and printed the steps that got there.",
    ],
  },
  {
    title: "How TLA-ts reads your file",
    blocks: [
      "There's no test in that file and no special syntax. TLA-ts treats the file as a state machine, and it uses TypeScript's types to work out what each part is:",
      {
        header: ["In your file", "What TLA-ts does with it"],
        rows: [
          ["A top-level `let`", "It's state. Every trace shows its value."],
          ["An exported function that changes state", "It's an action. The checker calls it."],
          [
            "An exported `() => boolean`",
            "It's an invariant. It has to return `true` in every state.",
          ],
          ["A function you don't export", "It's a helper. Only your own code calls it."],
        ],
      },
      "The top level of the file runs once, and whatever the variables hold after that is the first state.",
      "From there, the checker calls every action. Each call that changes something gives a new state. It then calls every action again from each new state, and keeps going until nothing new turns up. Along the way it calls every invariant on every state.",
      "That's why it found the bug. `unlike` is an action, so the checker called it from the first state.",
    ],
  },
  {
    title: "Guards",
    blocks: [
      "To fix the bug, return early when there's nothing to unlike:",
      {
        language: "typescript",
        code: `export const unlike = () => {
  if (likes === 0) return;
  likes -= 1;
};`,
      },
      "A call that changes nothing isn't a step, so the checker can't unlike from 0 anymore. An early return like this is called a guard.",
      "If you run it now, the bug is gone, but the check never finishes. `like` can run forever, so there's always a new state to visit, and TLA-ts keeps going until it runs out of memory.",
      "The checker needs a finite number of states. Put a guard on `like` too:",
      {
        language: "typescript",
        code: `export const like = () => {
  if (likes >= 3) return;
  likes += 1;
};`,
      },
      {
        language: "text",
        code: `Model checking completed. No error has been found.
7 states generated, 4 distinct states found, 0 states left on queue.`,
      },
      "There are 4 states (0, 1, 2, and 3 likes), and `neverNegative` holds in all of them. A small bound is usually enough. If a count can go negative, it can do it within 3 likes.",
    ],
  },
  {
    title: "Parameters",
    blocks: [
      "Actions can take parameters. This version keeps track of who liked, and keeps a count next to it:",
      {
        language: "typescript",
        code: `type User = "ada" | "bob";

let liked = new Set<User>();
let count = 0;

export const like = (user: User) => {
  liked.add(user);
  count += 1;
};

export const unlike = (user: User) => {
  if (!liked.has(user)) return;
  liked.delete(user);
  count -= 1;
};

export const countMatches = () => count === liked.size;`,
      },
      'The checker calls an action with every value of its parameter\'s type. `User` has two values, so from every state it tries `like("ada")` and `like("bob")`.',
      {
        language: "text",
        code: `Error: Invariant countMatches is violated.
Error: The behavior up to this point is:
State 1: <Initial predicate>
/\\ liked = {}
/\\ count = 0

State 2: <like("ada") line 522, col 15 to line 522, col 62 of module ProgramCode>
/\\ liked = {"ada"}
/\\ count = 1

State 3: <like("ada") line 522, col 15 to line 522, col 62 of module ProgramCode>
/\\ liked = {"ada"}
/\\ count = 2`,
      },
      "Ada liked twice. The set still has one user in it, but the count went to 2.",
      "The type decides which values the checker tries, so it has to have a finite set of them:",
      {
        header: ["Type", "Values the checker tries"],
        rows: [
          ['`"a" | "b"`, `1 | 2`', "Each literal"],
          ["`boolean`", "`true` and `false`"],
          ["`number`", "The integers from -3 to 3"],
          ["`string`", '`""`, `"a"`, and `"b"`'],
          ["`T[]`", "Every array of `T` up to 3 long"],
          ["`Set<T>`", "Every subset of `T`'s values"],
        ],
      },
      "Use a union of literals when you care which values get tried.",
    ],
  },
  {
    title: "Deadlocks",
    blocks: [
      "TLA-ts also tells you when the file gets stuck. This one stops at step 2:",
      {
        language: "typescript",
        code: `let step: 0 | 1 | 2 = 0;

export const next = () => {
  if (step === 2) return;
  step += 1;
};`,
      },
      {
        language: "text",
        code: `Error: Deadlock reached.
Error: The behavior up to this point is:
State 1: <Initial predicate>
step = 0

State 2: <next line 461, col 9 to line 461, col 50 of module ProgramCode>
step = 1

State 3: <next line 461, col 9 to line 461, col 50 of module ProgramCode>
step = 2`,
      },
      "A deadlock is a state where no action can change anything. Sometimes that's a bug, like two requests waiting on each other. Here it's the file finishing, so you can allow it with a tag:",
      {
        language: "typescript",
        code: `/** @noDeadlock */
let step: 0 | 1 | 2 = 0;`,
      },
    ],
  },
  {
    title: "More than invariants",
    blocks: [
      "An invariant says something is true in every state. Some rules are about what happens over time, and TypeScript has no syntax for those, so TLA-ts reads them from JSDoc tags:",
      {
        header: ["Tag", "Goes on", "What it means"],
        rows: [
          ["`@eventually`", "A boolean function", "It returns `true` at some point"],
          [
            "`@leadsTo other`",
            "A boolean function",
            "Whenever it's `true`, `other` is `true` later",
          ],
          ["`@always`", "A boolean function of `before`", "Every step satisfies it"],
          ["`@fair`", "An action", "It can't be skipped forever"],
          ["`@constraint`", "A boolean function", "Don't look past states where it's `false`"],
        ],
      },
      {
        language: "typescript",
        code: `/** @noDeadlock */
let count = 0;

/** @fair */
export const step = (by: 1 | 2) => {
  if (count < 4) count += by;
};

/** @always */
export const neverDecreases = (before: { count: number }) => count >= before.count;

/** @eventually */
export const isDone = () => count >= 4;`,
      },
      "`before` holds the state before the step, so `neverDecreases` compares the two. Without `@fair`, `isDone` fails, because nothing forces `step` to ever run.",
    ],
  },
  {
    title: "What it compiles to",
    blocks: [
      "TLA-ts doesn't check the TypeScript itself. It compiles the file to a TLA+ spec and model checks that, using a TypeScript port of TLC, the TLA+ model checker.",
      "If you wrote the like button in TLA+ by hand, it would look like this:",
      {
        typescript: `let likes = 0;

const like = () => {
  likes += 1;
};

const unlike = () => {
  likes -= 1;
};

const neverNegative = () =>
  likes >= 0;`,
        tla: `VARIABLE likes
Init == likes = 0
Like ==
  likes' = likes + 1


Unlike ==
  likes' = likes - 1


NeverNegative ==
  likes >= 0`,
      },
      "`likes'` means `likes` after the step, so `Like` says the new value is the old value plus one.",
      "The spec TLA-ts writes is much longer than that. It models a JavaScript engine running your file, so that `likes += 1` does exactly what Node does, including the parts a hand-written spec leaves out. You can see it in the playground, with an arrow from each declaration to its TLA+.",
    ],
  },
  {
    title: "Limits",
    blocks: [
      "TLA-ts runs your file the way Node 26 does. It strips the types and doesn't type check, so a file with type errors still runs.",
      "A file with exported functions can't import other files yet. Async functions and generators aren't actions.",
      "A check only covers the values the checker tries. For a `number` parameter that's -3 to 3, so use a union of literals for anything else.",
    ],
  },
];
