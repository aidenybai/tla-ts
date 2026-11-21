export interface Comparison {
  typescript: string;
  tla: string;
}

export interface Listing {
  language: "typescript" | "tlaplus" | "shellscript" | "text";
  code: string;
}

export interface Subheading {
  heading: string;
}

export interface Lesson {
  title: string;
  blocks: (string | Comparison | Listing | Subheading)[];
}

// A string is a paragraph, and text between backticks in it is code. The two sides of a comparison
// are written row for row, because an arrow joins each row that has code on both sides.
export const LESSONS: Lesson[] = [
  {
    title: "A like button",
    blocks: [
      "This is the file we'll translate. It has one variable, two functions that change it, and one rule.",
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
      "The rule says `likes` never goes below zero. A test checks that for one sequence of calls. TLA+ checks it for every sequence.",
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
      "`VARIABLE` declares `likes`. `Init` gives its starting value.",
      "TLA+ has two equals signs. `==` defines a name, like `const`. `=` compares two values, like `===`.",
      "So `Init` doesn't assign 0 to `likes`. It says `likes` equals 0 at the start.",
    ],
  },
  {
    title: "Steps",
    blocks: [
      "`like` adds one to `likes`. The direct translation is wrong:",
      { language: "tlaplus", code: `Like == likes = likes + 1` },
      "`=` compares, so this asks if `likes` equals `likes + 1`. That's never true.",
      "TLA+ has no assignment. To describe a change, you write the new value with a prime: `likes'`.",
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
      "`likes' = likes + 1` says the new value equals the old value plus one. A definition like this is called an action.",
      '`Next` lists every action, separated by `\\/`, which means "or".',
      { language: "tlaplus", code: String.raw`Next == Like \/ Unlike` },
      "At each step, the checker tries `Like` and it tries `Unlike`.",
    ],
  },
  {
    title: "Rules",
    blocks: [
      {
        typescript: `const neverNegative = () =>
  likes >= 0;`,
        tla: `NeverNegative ==
  likes >= 0`,
      },
      "`NeverNegative` must be true in every state. A rule like this is called an invariant.",
    ],
  },
  {
    title: "The module",
    blocks: [
      "Put the definitions in a file named `Likes.tla`.",
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
      "The first and last lines mark where the module starts and ends. `EXTENDS Integers` imports `+`, `-`, and `>=`. `\\*` starts a comment.",
      "Then tell the checker which definitions to use, in a file named `Likes.cfg`.",
      {
        language: "text",
        code: `INIT Init
NEXT Next
INVARIANT NeverNegative`,
      },
    ],
  },
  {
    title: "The first run",
    blocks: [
      "Run the checker:",
      { language: "shellscript", code: "npx tla-ts Likes.tla" },
      "It finds a bug:",
      {
        language: "text",
        code: `Error: Invariant NeverNegative is violated.
Error: The behavior up to this point is:
State 1: <Initial predicate>
likes = 0

State 2: <Unlike line 11, col 11 to line 11, col 28 of module Likes>
likes = -1`,
      },
      "Read the output from top to bottom. `likes` starts at 0. Then `Unlike` runs, and `likes` is -1. The rule is broken after one step.",
    ],
  },
  {
    title: "Guards",
    blocks: [
      "`Unlike` must not run when `likes` is 0. In TypeScript, you return early. In TLA+, you add a condition:",
      {
        typescript: `const unlike = () => {
  if (likes === 0) return;
  likes -= 1;
};`,
        tla: String.raw`Unlike ==
  /\ likes > 0
  /\ likes' = likes - 1`,
      },
      "`/\\` means \"and\". The first line has no prime, so it's about the current state. If it's false, `Unlike` can't run. A condition like this is called a guard.",
      "Run the checker again. It finds no bug, but it never finishes. `Like` has no guard, so `likes` grows forever and the checker never runs out of states.",
      "Give `Like` a guard too:",
      {
        typescript: `const like = () => {
  if (likes >= 3) return;
  likes += 1;
};`,
        tla: String.raw`Like ==
  /\ likes < 3
  /\ likes' = likes + 1`,
      },
      "Now `likes` stays between 0 and 3. The checker visits all 4 states and reports no error.",
    ],
  },
  {
    title: "Sets and parameters",
    blocks: [
      "The counter has a second bug: one user can like twice. To fix it, store the users who liked.",
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
      "`{}` is the empty set. `\\union` adds to a set, and `\\` removes from it.",
      "`Like` and `Unlike` now take a user. `Next` has to say which users:",
      {
        language: "tlaplus",
        code: String.raw`Next == \E user \in Users : Like(user) \/ Unlike(user)`,
      },
      '`\\E user \\in Users` means "for some user in `Users`". The checker tries every user.',
    ],
  },
  {
    title: "The rest of the syntax",
    blocks: [
      "These tables cover the rest. Each row is the same expression in both languages.",
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
      '`a => b` means "if `a`, then `b`". Numbers are integers. There are no floats, no `null`, and no `undefined`.',
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
      "`Cardinality` needs `EXTENDS FiniteSets`.",
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
      '`\\A` means "for all".',
      { heading: "Sequences" },
      "Sequences are arrays. They start at index 1.",
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
      "These need `EXTENDS Sequences`.",
      { heading: "Records" },
      "Records are objects.",
      {
        typescript: `{ name: "ada", likes: 0 }
user.name
{ ...user, likes: 1 }`,
        tla: `[name |-> "ada", likes |-> 0]
user.name
[user EXCEPT !.likes = 1]`,
      },
      "`EXCEPT` copies a record and changes one field.",
      { heading: "Functions" },
      "Functions are maps from keys to values.",
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
      "A definition can take parameters. `LET` defines a local name.",
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
    title: "What TLA-ts writes",
    blocks: [
      "You don't have to write TLA+ by hand. Run `npx tla-ts likes.ts`, and TLA-ts writes this module and checks it:",
      {
        language: "tlaplus",
        code: String.raw`---- MODULE Likes ----
EXTENDS Integers, Sequences, FiniteSets, TLC
VARIABLES likes
vars == <<likes>>
Init == likes = 0
like == likes' = likes + 1
unlike == likes' = likes - 1
Next == \/ like
        \/ unlike
Spec == /\ Init
        /\ [][Next]_vars
neverNegative == likes >= 0
====`,
      },
      "It has two definitions this guide didn't cover. `vars` lists the variables. `Spec` combines `Init` and `Next` into one formula: start in `Init`, then take `Next` steps.",
    ],
  },
];
