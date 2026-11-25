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

interface Lesson {
  title: string;
  blocks: (string | Comparison | Listing | Subheading)[];
}

// A string is a paragraph, and text between backticks in it is code. The two sides of a comparison
// are written row for row, because an arrow joins each row that has code on both sides.
export const LESSONS: Lesson[] = [
  {
    title: "The problem",
    blocks: [
      "A test checks one order of calls. A bug can need a different order.",
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
      "A test that calls `like` and then `unlike` passes. The count goes below zero only when `unlike` runs first, and nothing fails until someone writes that test.",
      "With TLA+, you describe what the code can do. A model checker then runs every order of calls and reports each one that breaks a rule.",
    ],
  },
  {
    title: "How TLA+ works",
    blocks: [
      "A TLA+ spec has three parts: the state, the actions that change the state, and the invariants, which are conditions that must hold in every state.",
      "The model checker starts from the initial state and applies every action to it. It does the same to each new state until no new states appear, and it tests every invariant on each one. When an invariant fails, the checker prints the sequence of actions that led there.",
      "The like button has all three parts. `likes` is the state, `like` and `unlike` are the actions, and `neverNegative` is the invariant. The next sections translate each one.",
    ],
  },
  {
    title: "State",
    blocks: [
      {
        typescript: `let likes = 0;`,
        tla: `VARIABLE likes

Init == likes = 0`,
      },
      "`VARIABLE likes` declares the state. TLA+ has no types, so a declaration is only a name.",
      "`Init` defines the initial state. `==` defines a name, as `const` does, and `=` tests equality, as `===` does. `Init` is therefore a condition, not an assignment. It's true in the states where `likes` equals 0, and the checker starts in each of them.",
    ],
  },
  {
    title: "Actions",
    blocks: [
      "TLA+ has no assignment. This definition compares `likes` with `likes + 1`, which is false for every number, so the action can never happen:",
      { language: "tlaplus", code: `Like == likes = likes + 1` },
      "An action describes a change by relating two states. `likes` is the value before the step. `likes'`, written with a prime, is the value after it.",
      {
        typescript: `const like = () => {
  likes += 1;
};

const unlike = () => {
  likes -= 1;
};`,
        tla: `Like ==
  likes' = likes + 1


Unlike ==
  likes' = likes - 1`,
      },
      "`Like` is true of a step when the new value of `likes` is the old value plus one.",
      "`Next` lists the actions a step can be. `\\/` is logical or, so each step is a `Like` or an `Unlike`. The checker applies both to every state.",
      { language: "tlaplus", code: String.raw`Next == Like \/ Unlike` },
    ],
  },
  {
    title: "Invariants",
    blocks: [
      {
        typescript: `const neverNegative = () =>
  likes >= 0;`,
        tla: `NeverNegative ==
  likes >= 0`,
      },
      "An invariant is a condition on one state, so it has no primes. The checker tests `NeverNegative` on every state it reaches.",
    ],
  },
  {
    title: "The module",
    blocks: [
      "A spec is a module in a `.tla` file. This is `Likes.tla`:",
      {
        language: "tlaplus",
        code: String.raw`---- MODULE Likes ----
EXTENDS Integers

\* The number of likes.
VARIABLE likes

Init == likes = 0

Like == likes' = likes + 1

Unlike == likes' = likes - 1

Next == Like \/ Unlike

NeverNegative == likes >= 0
====`,
      },
      "The first and last lines delimit the module. `EXTENDS Integers` imports the arithmetic operators, including `+` and `>=`. `\\*` starts a comment.",
      "A `.cfg` file with the same name tells the checker which definitions are the initial state, the step, and the invariants:",
      {
        language: "text",
        code: `INIT Init
NEXT Next
INVARIANT NeverNegative`,
      },
    ],
  },
  {
    title: "Running the checker",
    blocks: [
      { language: "shellscript", code: "npx tla-ts Likes.tla" },
      {
        language: "text",
        code: `Error: Invariant NeverNegative is violated.
Error: The behavior up to this point is:
State 1: <Initial predicate>
likes = 0

State 2: <Unlike line 11, col 11 to line 11, col 28 of module Likes>
likes = -1`,
      },
      "The output is a trace: a sequence of states that ends in a violation. `likes` starts at 0, `Unlike` runs, and `likes` is -1.",
    ],
  },
  {
    title: "Guards",
    blocks: [
      "`Unlike` must not happen when `likes` is 0. A condition without a prime restricts the state before the step, and an action can happen only when every such condition is true. This kind of condition is called a guard.",
      {
        typescript: `const unlike = () => {
  if (likes === 0) return;
  likes -= 1;
};`,
        tla: String.raw`Unlike ==
  /\ likes > 0
  /\ likes' = likes - 1`,
      },
      "`/\\` is logical and. A list of conditions can start each line with it.",
      "With this guard, the checker finds no violation, but it doesn't stop. `Like` can always happen again, so the states never run out.",
      "A model checker needs a finite number of states. A guard on `Like` gives it one:",
      {
        typescript: `const like = () => {
  if (likes >= 3) return;
  likes += 1;
};`,
        tla: String.raw`Like ==
  /\ likes < 3
  /\ likes' = likes + 1`,
      },
      "The checker now visits 4 states, where `likes` is 0, 1, 2, or 3, and the invariant holds in all of them. That result covers every order of likes and unlikes up to the bound.",
    ],
  },
  {
    title: "Sets and parameters",
    blocks: [
      "A count can't tell whether one user liked twice. A set of users can.",
      {
        typescript: `type User = "ada" | "bob";
const liked = new Set<User>();

const like = (user: User) => {
  liked.add(user);
};

const unlike = (user: User) => {
  liked.delete(user);
};`,
        tla: String.raw`Users == {"ada", "bob"}
VARIABLE liked
Init == liked = {}
Like(user) ==
  liked' = liked \union {user}


Unlike(user) ==
  liked' = liked \ {user}`,
      },
      "`{}` is the empty set, `\\union` is set union, and `\\` is set difference. Neither action modifies `liked`. Each one states what `liked'` is.",
      'An action with a parameter needs a value for it. `\\E user \\in Users` means "for some `user` in `Users`", and the checker tries every one:',
      {
        language: "tlaplus",
        code: String.raw`Next == \E user \in Users : Like(user) \/ Unlike(user)`,
      },
    ],
  },
  {
    title: "The rest of the syntax",
    blocks: [
      "The remaining syntax is expressions. Each row shows one expression in both languages.",
      { heading: "Logic" },
      {
        typescript: `a === b
a !== b
a && b
a || b
!a
!a || b
true
a ? b : c
Math.floor(a / b)`,
        tla: String.raw`a = b
a # b
a /\ b
a \/ b
~a
a => b
TRUE
IF a THEN b ELSE c
a \div b`,
      },
      "`a => b` is implication. It's false only when `a` is true and `b` is false. Numbers are integers of any size. TLA+ has no floating point numbers, `null`, or `undefined`.",
      { heading: "Sets" },
      {
        typescript: `new Set([1, 2, 3])
set.has(x)
!set.has(x)
set.size
a.union(b)
a.intersection(b)
a.difference(b)
a.isSubsetOf(b)`,
        tla: String.raw`{1, 2, 3}
x \in set
x \notin set
Cardinality(set)
a \union b
a \intersect b
a \ b
a \subseteq b`,
      },
      "`Cardinality` requires `EXTENDS FiniteSets`.",
      'A set comprehension filters or maps a set. `\\A` is "for all", and `\\E` is "there exists".',
      {
        typescript: `items.filter((x) => x > 1)
items.map((x) => x * 2)
items.every((x) => x > 0)
items.some((x) => x > 2)`,
        tla: String.raw`{x \in items : x > 1}
{x * 2 : x \in items}
\A x \in items : x > 0
\E x \in items : x > 2`,
      },
      { heading: "Sequences" },
      "A sequence is an ordered list. Its first index is 1.",
      {
        typescript: `[1, 2, 3]
list[0]
list.length
[...list, x]
list.slice(1)
[...a, ...b]`,
        tla: String.raw`<<1, 2, 3>>
list[1]
Len(list)
Append(list, x)
Tail(list)
a \o b`,
      },
      "These operators require `EXTENDS Sequences`.",
      { heading: "Records" },
      "A record has named fields. `EXCEPT` gives a copy with one field replaced.",
      {
        typescript: `{ name: "ada", likes: 0 }
user.name
{ ...user, likes: 1 }`,
        tla: `[name |-> "ada", likes |-> 0]
user.name
[user EXCEPT !.likes = 1]`,
      },
      { heading: "Functions" },
      "A function maps each key in a set to a value, as a `Map` does. `DOMAIN` is its set of keys.",
      {
        typescript: `{ ada: 0, bob: 0 }
votes[name]
Object.keys(votes)
{ ...votes, [name]: 1 }`,
        tla: String.raw`[name \in {"ada", "bob"} |-> 0]
votes[name]
DOMAIN votes
[votes EXCEPT ![name] = 1]`,
      },
      { heading: "Definitions" },
      "A definition can take parameters. Its body is a single expression, and `LET` defines names local to it.",
      {
        typescript: `const limit = 3;
const twice = (n: number) => n * 2;
const area = (w: number) => {
  const h = w * 2;
  return w * h;
};`,
        tla: `Limit == 3
Twice(n) == n * 2
Area(w) ==
  LET h == w * 2
  IN w * h`,
      },
    ],
  },
  {
    title: "Checking TypeScript directly",
    blocks: [
      "TLA-ts runs the same check on the TypeScript file, with no spec to write:",
      { language: "shellscript", code: "npx tla-ts likes.ts" },
      "It reports the same violation: `likes` is -1 after one `unlike`.",
      "TLA-ts generates TLA+ that models a JavaScript engine running the file. The generated module is much longer than `Likes.tla`, and it isn't meant to be read.",
    ],
  },
];
