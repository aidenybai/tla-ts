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

// A string is a paragraph, and text between backticks in it is code.
export const LESSONS: Lesson[] = [
  {
    title: "A like button",
    blocks: [
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
      "A test calls `like` and `unlike` in one order. A TLA+ model checker tries every order. This guide translates the file into TLA+ line by line.",
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
      "`VARIABLE` declares a value that changes. `==` defines a name, as `const` does. `=` compares, as `===` does. `Init` is a condition, not an assignment: the checker starts in every state where it's true.",
    ],
  },
  {
    title: "Steps",
    blocks: [
      "Copying the TypeScript doesn't work:",
      { language: "tlaplus", code: `Like == likes = likes + 1` },
      "`=` compares, and no number equals itself plus one. This is false in every state, so `Like` never happens.",
      "A step has a state before and a state after. A prime marks the value after.",
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
      "A condition on a before and an after is called an action. `Next` lists the actions, joined with `\\/`, which is `||`. In every state, the checker tries each one.",
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
      "A rule that must be true in every state is called an invariant. It has no prime, because it reads one state.",
    ],
  },
  {
    title: "The module",
    blocks: [
      "Save this as `Likes.tla`. `EXTENDS` is `import`, and even `+` needs it. `\\*` starts a comment.",
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
      "`Likes.cfg` tells the checker which definition is which:",
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
      "Nothing stops `Unlike` at zero.",
    ],
  },
  {
    title: "Guards",
    blocks: [
      "A condition with no prime reads only the state before, so it decides whether the step can happen. `/\\` is `&&`, and a long condition can be a list with `/\\` at the start of each line.",
      {
        typescript: `const unlike = () => {
  if (likes === 0) return;
  likes -= 1;
};`,
        tla: String.raw`Unlike ==
  /\ likes > 0
  /\ likes' = likes - 1`,
      },
      "Now the checker finds no error, but it never stops. `Like` can always run again, so there's always a new state.",
      "The checker visits every state, so a spec needs a finite number of them. Bound `Like` too:",
      {
        typescript: `const like = () => {
  if (likes >= 3) return;
  likes += 1;
};`,
        tla: String.raw`Like ==
  /\ likes < 3
  /\ likes' = likes + 1`,
      },
      "The checker finds 4 states, and the rule holds in each.",
    ],
  },
  {
    title: "Sets and parameters",
    blocks: [
      "A count lets one user like twice. Store who liked:",
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
      "Nothing mutates. Each action says what the set is after the step.",
      '`\\E` means "there exists". It makes the checker try each action with each user.',
      {
        language: "tlaplus",
        code: String.raw`Next == \E user \in Users : Like(user) \/ Unlike(user)`,
      },
      "Two users make 4 possible sets, so this spec is finite with no guard.",
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
      "A number is an integer of any size. TLA+ has no floats, no `null`, and no `undefined`.",
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
      "`Cardinality` comes from the `FiniteSets` module. `1..3` is the set `{1, 2, 3}`.",
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
      "A sequence counts from 1, not 0. These operators come from the `Sequences` module.",
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
      "A function is a lookup table, closer to a `Map` than to a TypeScript function.",
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
      "A body is one expression, with no statements and no `return`.",
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
      "`npx tla-ts likes.ts` writes this module from the first file and checks it:",
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
      "Two lines are new. `vars` lists the variables. `Spec` says that a run starts in `Init`, and that every step is a `Next` step or leaves `vars` unchanged.",
    ],
  },
];
