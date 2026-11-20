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
      "Here's a like button. A user can do two things, `like` and `unlike`. We also have a rule, `neverNegative`, that should hold whatever the user does.",
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
      "A test would call `like` and `unlike` in an order we thought of, and then check the rule. TLA+ works the other way around. We describe the state and the steps, and a program called a model checker tries the steps in every order.",
      "Let's translate this file into TLA+, one line at a time.",
    ],
  },
  {
    title: "The state",
    blocks: [
      "The file has one piece of state, `likes`, and it starts at 0. In TLA+, that takes two lines.",
      {
        typescript: `let likes = 0;`,
        tla: `VARIABLE likes

Init == likes = 0`,
      },
      "`VARIABLE` declares a value that changes over time. TLA+ has no types, so that's the whole declaration.",
      "The second line has two kinds of equals sign. `==` defines a name, as `const` does. A single `=` compares, as `===` does. So `Init` isn't an assignment. It's a condition, and it's true in a state where `likes` equals 0.",
      'The checker starts in every state that makes `Init` true. Here there\'s one. If we wrote `Init == likes \\in {0, 1, 2}`, where `\\in` means "is in", the checker would start in three.',
    ],
  },
  {
    title: "A step",
    blocks: [
      "Next comes `like`. For our first attempt, we'll copy the TypeScript.",
      { language: "tlaplus", code: `Like == likes = likes + 1` },
      "This doesn't work, and the reason is the main idea of TLA+. `=` compares, so this line asks whether `likes` equals itself plus one. No number does. The condition is false in every state, so `Like` can never happen.",
      "A step has two states, the one before it and the one after it. We need a way to talk about both. TLA+ marks the value after the step with a prime.",
      {
        typescript: `const like = () => {
  likes += 1;
};`,
        tla: `Like == likes' = likes + 1`,
      },
      'Read `likes\'` as "likes prime". The line says that after the step, `likes` equals what it was before, plus one. A condition on a before and an after is called an action.',
      "`Unlike` is the same action with a minus.",
      { language: "tlaplus", code: `Unlike == likes' = likes - 1` },
    ],
  },
  {
    title: "Every order",
    blocks: [
      "TypeScript marks the steps a user can take with `export`. TLA+ collects them in one more definition, named `Next` by convention.",
      { language: "tlaplus", code: String.raw`Next == Like \/ Unlike` },
      '`\\/` is `||`. So `Next` says that a step is a `Like` or an `Unlike`. The checker treats that "or" as a choice. In every state it reaches, it tries both.',
    ],
  },
  {
    title: "The rule",
    blocks: [
      "The rule translates almost word for word.",
      {
        typescript: `const neverNegative = () =>
  likes >= 0;`,
        tla: `NeverNegative == likes >= 0`,
      },
      "It has no prime, because it reads one state at a time. A rule that must be true in every state is called an invariant.",
    ],
  },
  {
    title: "The module",
    blocks: [
      "A TLA+ file is a module. A line of dashes opens it, and a line of equals signs closes it. Here's ours, saved as `Likes.tla`.",
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
      "`EXTENDS` is `import`. Even `+` and `>=` need it, because the `Integers` module defines them. `\\*` starts a comment.",
      "The checker also needs to know which definition plays which part. That goes in a second file, `Likes.cfg`.",
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
      "Now we can run the checker.",
      { language: "shellscript", code: "npx tla-ts Likes.tla" },
      "It prints this, among other lines:",
      {
        language: "text",
        code: `Error: Invariant NeverNegative is violated.
Error: The behavior up to this point is:
State 1: <Initial predicate>
likes = 0

State 2: <Unlike line 11, col 11 to line 11, col 28 of module Likes>
likes = -1`,
      },
      "The checker found a state that breaks the rule, and it printed the steps that lead there. We start at 0, the user clicks unlike, and `likes` is -1. Nothing stops `Unlike` at zero.",
    ],
  },
  {
    title: "A guard",
    blocks: [
      "In TypeScript, we'd fix this with an early return. In TLA+, we add a condition with no prime. It reads only the state before the step, so it decides whether the step can happen at all. A condition like that is called a guard.",
      {
        typescript: `const unlike = () => {
  if (likes === 0) return;
  likes -= 1;
};`,
        tla: String.raw`Unlike ==
  /\ likes > 0
  /\ likes' = likes - 1`,
      },
      "`/\\` is `&&`. TLA+ lets us write a long condition as a list, with `/\\` at the start of each line.",
      "Run the checker again. This time it finds no error, but it also never stops. `Like` can always run once more, so there's always a new state to visit: 4 likes, then 5, then 6.",
    ],
  },
  {
    title: "A small model",
    blocks: [
      "The checker visits every state, so a spec must have a finite number of them. The usual answer is to make the model small. If a count can go below zero, it can do so with 3 likes. It doesn't need 3 million.",
      "So we give `Like` a guard too.",
      {
        typescript: `const like = () => {
  if (likes >= 3) return;
  likes += 1;
};`,
        tla: String.raw`Like ==
  /\ likes < 3
  /\ likes' = likes + 1`,
      },
      "Now the checker finishes. It finds 4 states, from 0 likes to 3, and the rule holds in all of them. That result isn't a sample. No order of clicks breaks the rule.",
    ],
  },
  {
    title: "Who liked",
    blocks: [
      "Our button has another problem: one user can like twice. Let's store who liked, not how many. The state becomes a set, and each step takes a user.",
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
      "Braces make a set. `\\union` joins two sets, and `\\` removes the members of the second set from the first. Nothing mutates. Each action says what the set is after the step.",
      '`Like` now takes a parameter, so `Next` must say which users to try. `\\E` means "there exists".',
      {
        language: "tlaplus",
        code: String.raw`Next == \E user \in Users : Like(user) \/ Unlike(user)`,
      },
      "The checker tries both actions for each user. This spec needs no guard to stay small. Two users make 4 possible sets, so the checker visits 4 states and stops.",
    ],
  },
  {
    title: "The rest of the syntax",
    blocks: [
      "That's the core of TLA+: variables, `Init`, actions, `Next`, and invariants. Everything else is expressions, and most of them match something in TypeScript.",
      { heading: "Logic" },
      '`=>` is the one with no TypeScript operator. `a => b` means "if `a` is true, then `b` is true".',
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
      "`Cardinality` comes from the `FiniteSets` module, and `1..3` is the set of the integers from 1 to 3.",
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
      'A filter and a map are both written in braces. `\\A` means "for all". The TypeScript side uses an array here, because a `Set` has no `filter`.',
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
      "A sequence is the array of TLA+. Watch the second row: a sequence counts from 1, not 0. These operators come from the `Sequences` module.",
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
      "A record is an object. `EXCEPT` returns a copy with one field changed, as a spread does.",
      {
        typescript: `{ name: "ada", likes: 0 }
user.name
{ ...user, likes: 1 }`,
        tla: `[name |-> "ada", likes |-> 0]
user.name
[user EXCEPT !.likes = 1]`,
      },
      { heading: "Functions" },
      "A function in TLA+ is a lookup table. It gives a value to every key in a set, so it's closer to a `Map` than to a TypeScript function.",
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
      "A definition can take parameters, as `Like(user)` did. Its body is one expression, with no statements and no `return`. `LET` names a part of that expression.",
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
      "TLA-ts does this translation for you. Run `npx tla-ts likes.ts` on the file we started with, and it checks this module:",
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
      "It's the module we wrote by hand, and you can read most of it now. Two lines are new. `vars` is a sequence of all the variables. `Spec` puts the pieces together: a run starts in `Init`, and every step after that is a `Next` step or leaves `vars` unchanged.",
    ],
  },
];
