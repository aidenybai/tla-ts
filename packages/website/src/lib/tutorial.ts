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
    title: "A like button",
    blocks: [
      "Here's a like button, and a rule it should never break.",
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
      "A test tries one order of clicks. TLA+ tries every order.",
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
      "A double equals defines a name. A single equals compares.",
      "So `Init` isn't an assignment. It describes the first state: likes equals 0.",
    ],
  },
  {
    title: "Steps",
    blocks: [
      "TLA+ has no assignment at all. This looks like one, but it compares likes to itself plus one. That's never true.",
      { language: "tlaplus", code: `Like == likes = likes + 1` },
      "To change a variable, describe its next value. A prime means next.",
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
      "`Next` says which steps can happen: a like or an unlike.",
      { language: "tlaplus", code: String.raw`Next == Like \/ Unlike` },
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
      "A rule must hold in every state. TLA+ calls it an invariant.",
    ],
  },
  {
    title: "The module",
    blocks: [
      "The whole file, `Likes.tla`:",
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
      "`EXTENDS` is an import. Even plus and minus come from a module.",
      "A second file, `Likes.cfg`, tells the checker what to check:",
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
      "Unlike ran at zero. The checker found the bug in one step.",
    ],
  },
  {
    title: "Guards",
    blocks: [
      "Stop unlike at zero. A line with no prime is a guard: the step happens only when it's true.",
      {
        typescript: `const unlike = () => {
  if (likes === 0) return;
  likes -= 1;
};`,
        tla: String.raw`Unlike ==
  /\ likes > 0
  /\ likes' = likes - 1`,
      },
      "The bug is gone, but now the checker never finishes. Likes can grow forever, so there's always another state to check.",
      "Cap it.",
      {
        typescript: `const like = () => {
  if (likes >= 3) return;
  likes += 1;
};`,
        tla: String.raw`Like ==
  /\ likes < 3
  /\ likes' = likes + 1`,
      },
      "Four states, no errors.",
    ],
  },
  {
    title: "Sets and parameters",
    blocks: [
      "One user can still like twice. Store who liked, not how many.",
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
      "Each step now takes a user. `\\E` tries every one.",
      {
        language: "tlaplus",
        code: String.raw`Next == \E user \in Users : Like(user) \/ Unlike(user)`,
      },
    ],
  },
  {
    title: "The rest of the syntax",
    blocks: [
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
      "Numbers are whole. There are no floats, no null, and no undefined.",
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
      "`Cardinality` comes from the FiniteSets module.",
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
      "Sequences start at 1. Their operators come from the Sequences module.",
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
      { heading: "Records" },
      {
        typescript: `{ name: "ada", likes: 0 }
user.name
{ ...user, likes: 1 }`,
        tla: `[name |-> "ada", likes |-> 0]
user.name
[user EXCEPT !.likes = 1]`,
      },
      { heading: "Functions" },
      "A function is a lookup table, like a Map.",
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
    title: "Skip the TLA+",
    blocks: [
      "TLA-ts checks the TypeScript file itself.",
      { language: "shellscript", code: "npx tla-ts likes.ts" },
      "It finds the same bug: likes is -1 after one unlike.",
      "It writes TLA+ to do it, but of JavaScript running your code, so its module is far longer than ours.",
    ],
  },
];
