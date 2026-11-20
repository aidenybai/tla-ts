export interface Comparison {
  typescript: string;
  tla: string;
}

export interface Listing {
  language: "tlaplus" | "shellscript";
  code: string;
}

export interface Lesson {
  title: string;
  blocks: (string | Comparison | Listing)[];
}

// A string is a paragraph, and text between backticks in it is code.
export const LESSONS: Lesson[] = [
  {
    title: "Start with a module",
    blocks: [
      "A spec is one module in one file. A line of dashes opens the module and a line of equals signs closes it.",
      {
        language: "tlaplus",
        code: String.raw`---- MODULE Likes ----
EXTENDS Integers, Sequences, FiniteSets

\* A comment on one line.
(* A comment on
   many lines. *)
====`,
      },
      "`EXTENDS` imports other modules, as `import` does. Even `+` comes from a module: `Integers` defines the arithmetic.",
    ],
  },
  {
    title: "Define names",
    blocks: [
      "`==` defines a name, as `const` does. A definition with parameters is called an operator.",
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
      "TLA+ has no types, no statements, and no `return`. The body of a definition is one expression, and `LET` names a part of it.",
    ],
  },
  {
    title: "Compare and combine values",
    blocks: [
      "A number is an integer of any size. TLA+ has no floats, no `null`, and no `undefined`. A string takes double quotes.",
      "`=` compares two values. It never assigns.",
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
      "You can write a long condition as a list. Each line starts with `/\\` or `\\/`, and the indentation groups the lines, so you need no brackets.",
      {
        typescript: `const isValid =
  count >= 0 &&
  count <= limit &&
  (isOpen || isAdmin);`,
        tla: String.raw`IsValid ==
  /\ count >= 0
  /\ count <= Limit
  /\ \/ isOpen
     \/ isAdmin`,
      },
    ],
  },
  {
    title: "Group values in sets",
    blocks: [
      "The set is the main collection of TLA+. A set has no order and no duplicates. TLA+ compares sets by value, so a set of sets works.",
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
      "`1..3` is the set of the integers from 1 to 3. `Cardinality` comes from the `FiniteSets` module.",
      'A filter and a map are both written in braces. `\\A` reads "for all" and `\\E` reads "there exists". The TypeScript here uses an array, because a `Set` has no `filter`.',
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
    ],
  },
  {
    title: "Count sequences from 1",
    blocks: [
      "An array is a sequence in TLA+, written in double angle brackets. The first element is at index 1, not 0.",
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
      "`Len`, `Append`, `Tail`, and `\\o` come from the `Sequences` module.",
    ],
  },
  {
    title: "Build records and functions",
    blocks: [
      "An object is a record. `|->` separates a field from its value.",
      {
        typescript: `{ name: "ada", likes: 0 }
user.name
{ ...user, likes: 1 }`,
        tla: `[name |-> "ada", likes |-> 0]
user.name
[user EXCEPT !.likes = 1]`,
      },
      "`EXCEPT` returns a copy with one field changed. Nothing in TLA+ mutates a value.",
      "A function in TLA+ is a lookup table. It gives a value to every key of a set, so it's closer to a `Record` or a `Map` than to a TypeScript function.",
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
      "A sequence is a function whose keys are `1..Len(list)`, and a record is a function whose keys are its field names. So `list[1]`, `DOMAIN`, and `EXCEPT` work on all three.",
    ],
  },
  {
    title: "Declare state",
    blocks: [
      "Every name so far is a constant. `VARIABLE` declares a value that changes over time, and `Init` says how it starts.",
      {
        typescript: `let likes = 0;`,
        tla: `VARIABLE likes

Init == likes = 0`,
      },
      "`Init` is a condition, not an assignment. `Init == likes \\in 0..2` is also a start, and the checker then tries all three values.",
    ],
  },
  {
    title: "Describe each step as an action",
    blocks: [
      'An action is a condition on two states: the state before a step and the state after it. `likes\'` is the value of `likes` after the step, and you read it as "likes prime".',
      {
        typescript: `const like = () => {
  likes += 1;
};`,
        tla: `Like == likes' = likes + 1`,
      },
      "A condition with no prime is a guard. The step can happen only in a state where the guard is true.",
      {
        typescript: `const like = () => {
  if (likes >= 3) return;
  likes += 1;
};`,
        tla: String.raw`Like ==
  /\ likes < 3
  /\ likes' = likes + 1`,
      },
      "An action must give a next value to every variable. `UNCHANGED` keeps a variable as it is.",
      {
        typescript: `const close = () => {
  if (!isOpen) return;
  isOpen = false;
};`,
        tla: String.raw`Close ==
  /\ isOpen
  /\ isOpen' = FALSE
  /\ UNCHANGED likes`,
      },
      "`Next` joins the actions with `\\/`. In each state, the checker tries every action whose guard is true.",
      {
        typescript: `export { like, unlike };`,
        tla: String.raw`Next == Like \/ Unlike`,
      },
      "An action can take a parameter. `\\E` lets the checker try the action with every value of a set.",
      {
        typescript: `const add = (n: 1 | 2) => {
  likes += n;
};`,
        tla: String.raw`Add(n) == likes' = likes + n

Next == \E n \in {1, 2} : Add(n)`,
      },
    ],
  },
  {
    title: "State a rule as an invariant",
    blocks: [
      "An invariant is a condition that must be true in every state. It has no prime, because it reads one state.",
      {
        typescript: `const neverNegative = () =>
  likes >= 0;`,
        tla: `NeverNegative == likes >= 0`,
      },
      "The checker starts in each state that `Init` allows. It follows `Next` to every state it can reach, and it tests the invariant in each one.",
    ],
  },
  {
    title: "Check the whole spec",
    blocks: [
      "Here is a like button as a complete module. Save it as `Likes.tla`.",
      {
        language: "tlaplus",
        code: String.raw`---- MODULE Likes ----
EXTENDS Integers

VARIABLE likes

Init == likes = 0

Like ==
  /\ likes < 3
  /\ likes' = likes + 1

Unlike == likes' = likes - 1

Next == Like \/ Unlike

NeverNegative == likes >= 0
====`,
      },
      "The checker visits every state, so the spec must have a finite number of them. The guard `likes < 3` keeps the count small.",
      "A configuration file names the definitions to check. Save this one as `Likes.cfg`.",
      {
        language: "tlaplus",
        code: `INIT Init
NEXT Next
INVARIANT NeverNegative`,
      },
      "Then run the checker:",
      { language: "shellscript", code: "npx tla-ts Likes.tla" },
      "The checker reports that the invariant `NeverNegative` is violated, and it prints the steps: `likes = 0` at the start, then `likes = -1` after `Unlike`. `Unlike` has no guard, so it can run at zero.",
      {
        language: "tlaplus",
        code: String.raw`Unlike ==
  /\ likes > 0
  /\ likes' = likes - 1`,
      },
      "With this guard, the checker finds 4 states, from `likes = 0` to `likes = 3`, and no error.",
    ],
  },
];
