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
      "TLA+ is built for this kind of bug. You describe what your code is allowed to do, and a tool called a model checker tries every possible order of steps and tells you which ones break your rules.",
    ],
  },
  {
    title: "How it works",
    blocks: [
      "A TLA+ spec is made of three things: the state, the actions that change the state, and the invariants, which are rules that should be true in every state.",
      "The model checker starts from the first state and tries every action. Then it tries every action from each state it found, and keeps going until there's nothing new. If any state breaks an invariant, it shows you the exact steps that led to it.",
      "The like button already has all three. `likes` is the state, `like` and `unlike` are the actions, and `neverNegative` is the invariant.",
    ],
  },
  {
    title: "State",
    blocks: [
      "In TLA+ you declare a variable, and then say what it starts as:",
      {
        typescript: `let likes = 0;`,
        tla: `VARIABLE likes

Init == likes = 0`,
      },
      "The double equals (`==`) defines a name, like `const`. The single equals (`=`) checks if two things are equal, like `===`.",
      "That means `Init` isn't assigning 0 to `likes`. It's saying that `likes` is equal to 0 at the start.",
    ],
  },
  {
    title: "Actions",
    blocks: [
      "This is the part that trips people up. TLA+ doesn't have assignment, so you can't write `like` this way:",
      { language: "tlaplus", code: `Like == likes = likes + 1` },
      "That line checks whether `likes` is equal to `likes + 1`, which is never true.",
      "To change a variable, you describe what it will be after the step by adding a prime (`'`) to its name:",
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
      "`likes' = likes + 1` says that after this step, `likes` is whatever it was before plus one.",
      "Then you list all the actions in `Next`, separated by `\\/` (which is `||`). At every state, the checker tries each of them:",
      { language: "tlaplus", code: String.raw`Next == Like \/ Unlike` },
    ],
  },
  {
    title: "Invariants",
    blocks: [
      "An invariant is a condition that should be true in every state:",
      {
        typescript: `const neverNegative = () =>
  likes >= 0;`,
        tla: `NeverNegative ==
  likes >= 0`,
      },
      "The checker tests it on every state it finds.",
    ],
  },
  {
    title: "The module",
    blocks: [
      "All of this goes in a file called `Likes.tla`:",
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
      "`EXTENDS Integers` is an import. You need it even for `+` and `>=`. Lines that start with `\\*` are comments.",
      "You also need a `Likes.cfg` file that tells the checker which definitions to use:",
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
      "Now run it:",
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
      "The checker found the bug. `likes` starts at 0, `Unlike` runs, and now `likes` is -1.",
    ],
  },
  {
    title: "Guards",
    blocks: [
      "To fix it, `Unlike` shouldn't be allowed to run when `likes` is 0. In TypeScript you'd return early. In TLA+ you add a condition to the action:",
      {
        typescript: `const unlike = () => {
  if (likes === 0) return;
  likes -= 1;
};`,
        tla: String.raw`Unlike ==
  /\ likes > 0
  /\ likes' = likes - 1`,
      },
      "`/\\` is `&&`. Since `likes > 0` doesn't have a prime, it's about the state before the step, and the action can only happen when it's true. This is called a guard.",
      "If you run the checker now, it doesn't find the bug anymore, but it also never finishes. `Like` can run forever, so there are infinitely many states to check.",
      "The checker needs a finite number of states, so `Like` needs a guard too:",
      {
        typescript: `const like = () => {
  if (likes >= 3) return;
  likes += 1;
};`,
        tla: String.raw`Like ==
  /\ likes < 3
  /\ likes' = likes + 1`,
      },
      "Now there are only 4 states (0, 1, 2, and 3 likes), and the checker confirms the rule holds in all of them.",
    ],
  },
  {
    title: "Sets and parameters",
    blocks: [
      "There's still a problem with the design: the same user can like twice. To fix that, keep track of who liked instead of how many:",
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
      "`\\union` adds to a set and `\\` removes from it. Notice that neither action mutates `liked`. They each describe what `liked` will be after the step.",
      'Since the actions take a user now, `Next` has to pick one. `\\E user \\in Users` means "there exists a user in `Users`", and the checker tries all of them:',
      {
        language: "tlaplus",
        code: String.raw`Next == \E user \in Users : Like(user) \/ Unlike(user)`,
      },
    ],
  },
  {
    title: "The rest of the syntax",
    blocks: [
      "That covers the structure of a spec. The rest is expressions, and most of them have a direct TypeScript equivalent.",
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
      '`a => b` means "if `a` is true, then `b` must be true". Numbers are always integers, and there\'s no `null` or `undefined`.',
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
      "`Cardinality` comes from the `FiniteSets` module.",
      "You can also filter and map sets:",
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
      "Sequences are like arrays, except they start at index 1. These operators come from the `Sequences` module.",
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
      "Records are like objects. `EXCEPT` makes a copy with one field changed.",
      {
        typescript: `{ name: "ada", likes: 0 }
user.name
{ ...user, likes: 1 }`,
        tla: `[name |-> "ada", likes |-> 0]
user.name
[user EXCEPT !.likes = 1]`,
      },
      { heading: "Functions" },
      "Functions in TLA+ aren't like TypeScript functions. They're lookup tables, closer to a `Map`.",
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
      "Definitions can take parameters, and `LET` lets you name part of an expression.",
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
    title: "Skipping the spec",
    blocks: [
      "You don't have to write any of this by hand. TLA-ts checks the TypeScript file directly:",
      { language: "shellscript", code: "npx tla-ts likes.ts" },
      "It finds the same bug. Under the hood, TLA-ts generates TLA+ that models a JavaScript engine running your code, so its output is a lot longer than `Likes.tla`.",
    ],
  },
];
