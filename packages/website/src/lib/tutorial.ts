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
      "Here's a like button. It has one variable, two functions that change it, and one rule: the count never goes below zero.",
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
      "You'd probably test this by calling `like`, then `unlike`, and checking the count. That test passes.",
      "But a test only checks the order of calls you wrote down. The bug is in an order you didn't: an `unlike` before any `like`.",
      "This one is easy to spot. The same kind of bug in a retry loop or a cache isn't, because the order that breaks it can be ten steps long.",
    ],
  },
  {
    title: "What TLA+ is",
    blocks: [
      "TLA+ is a language for describing what a system can do. Leslie Lamport created it, and engineers at Amazon have used it to find bugs in S3 and DynamoDB.",
      "You don't write tests in it. You describe the state, the steps that change it, and the rules that must hold. A program called a model checker then tries every order of steps (not a sample of them) and checks the rules in every state it reaches.",
      "TL;DR: describe the steps, and let the checker find the order that breaks them.",
      "The syntax looks like math, which puts people off. But most of it maps to TypeScript you already write. Let's translate the like button, one piece at a time.",
    ],
  },
  {
    title: "State",
    blocks: [
      "Let's start with the variable.",
      {
        typescript: `let likes = 0;`,
        tla: `VARIABLE likes

Init == likes = 0`,
      },
      "`VARIABLE` declares `likes`. TLA+ has no types, so that's the whole declaration.",
      "`Init` is where things get different. TLA+ has two equals signs: `==` defines a name (like `const`), and `=` compares two values (like `===`).",
      "So `Init` doesn't set `likes` to 0. It's a condition that says `likes` equals 0, and the checker starts in every state where that's true.",
    ],
  },
  {
    title: "Steps",
    blocks: [
      "Now for `like`. Let's try the obvious translation:",
      { language: "tlaplus", code: `Like == likes = likes + 1` },
      "This doesn't work. Remember that `=` compares, so this asks whether `likes` equals `likes + 1`. No number does, so `Like` can never happen.",
      "Why? TLA+ has no assignment, so nothing ever changes a variable. You describe a step by relating two states: the one before it and the one after it.",
      "A prime (`'`) marks the state after. `likes'` is the value of `likes` once the step is done.",
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
      "Read the first one as: after a like, `likes` is what it was before, plus one. A definition like this is called an action.",
      "The checker also needs to know which actions exist. That's the job of `Next`:",
      { language: "tlaplus", code: String.raw`Next == Like \/ Unlike` },
      '`\\/` means "or" (it\'s `||` in TypeScript). So a step is either a `Like` or an `Unlike`, and in every state the checker tries both.',
    ],
  },
  {
    title: "Rules",
    blocks: [
      "The rule is the easy part.",
      {
        typescript: `const neverNegative = () =>
  likes >= 0;`,
        tla: `NeverNegative ==
  likes >= 0`,
      },
      "It has no prime, because it looks at one state and not at a step. A rule that must hold in every state is called an invariant.",
    ],
  },
  {
    title: "Putting it together",
    blocks: [
      "That's every piece. Here's the whole file, `Likes.tla`:",
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
      "A few things are new. The first and last lines mark where the module starts and ends. `EXTENDS` is an import (even `+` comes from a module). `\\*` starts a comment.",
      "The checker also needs to know which definition plays which part. That goes in a second file, `Likes.cfg`:",
      {
        language: "text",
        code: `INIT Init
NEXT Next
INVARIANT NeverNegative`,
      },
    ],
  },
  {
    title: "Finding the bug",
    blocks: [
      "Let's run it:",
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
      "The checker says more than that the rule is broken. It prints the exact steps that break it: `likes` starts at 0, then `Unlike` runs, and `likes` is -1.",
      "That's the bug from the start of this guide, and we never wrote a test for it.",
    ],
  },
  {
    title: "Fixing it",
    blocks: [
      "In TypeScript, you'd return early when the count is 0. TLA+ does the same thing with a condition:",
      {
        typescript: `const unlike = () => {
  if (likes === 0) return;
  likes -= 1;
};`,
        tla: String.raw`Unlike ==
  /\ likes > 0
  /\ likes' = likes - 1`,
      },
      "`/\\` means \"and\" (it's `&&` in TypeScript). The first line has no prime, so it's about the state before the step. If it's false, the step can't happen. A condition like this is called a guard.",
      "Run the checker again and the bug is gone. But there's a new problem: the checker never finishes.",
      "Why? `Like` has no guard, so `likes` can grow forever. The checker visits every state, and now there's no end to them.",
      "The fix is to make the model small. A count that can go negative will do it with 3 likes, and doesn't need 3 million:",
      {
        typescript: `const like = () => {
  if (likes >= 3) return;
  likes += 1;
};`,
        tla: String.raw`Like ==
  /\ likes < 3
  /\ likes' = likes + 1`,
      },
      "Now the checker finishes. It finds 4 states (0 to 3 likes), and the rule holds in all of them.",
      "TL;DR: a passing check isn't a sample. Within 3 likes, no order of clicks breaks the rule.",
    ],
  },
  {
    title: "Sets and parameters",
    blocks: [
      "The button has one more problem: a user can like twice. Let's store who liked, not how many.",
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
      "`{}` is the empty set, `\\union` adds to a set, and `\\` removes from it. Notice that nothing mutates. Each action says what the set is after the step.",
      "`Like` and `Unlike` take a user now, so `Next` has to say which one:",
      {
        language: "tlaplus",
        code: String.raw`Next == \E user \in Users : Like(user) \/ Unlike(user)`,
      },
      '`\\E` means "there exists". Here it tells the checker to try each action with every user in `Users`.',
    ],
  },
  {
    title: "The rest of the syntax",
    blocks: [
      "That's the core of TLA+. Everything else is expressions, and most of them have a twin in TypeScript. Each row below is the same expression in both languages.",
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
      '`a => b` means "if `a`, then `b`". Numbers are whole, and there are no floats, no `null`, and no `undefined`.',
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
      "`Cardinality` comes from the `FiniteSets` module, so it needs an `EXTENDS`.",
      'Filters and maps are written in braces too. `\\A` means "for all".',
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
      "A sequence is an array. Watch out for the second row: sequences start at 1, not 0.",
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
      "These operators come from the `Sequences` module.",
      { heading: "Records" },
      "A record is an object. `EXCEPT` copies one and changes a field, like a spread.",
      {
        typescript: `{ name: "ada", likes: 0 }
user.name
{ ...user, likes: 1 }`,
        tla: `[name |-> "ada", likes |-> 0]
user.name
[user EXCEPT !.likes = 1]`,
      },
      { heading: "Functions" },
      "This name is misleading. A function in TLA+ is a lookup table from keys to values, so it's closer to a `Map` than to a TypeScript function.",
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
      "The thing that looks like a TypeScript function is a definition with parameters. Its body is one expression, and `LET` names a part of it.",
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
    title: "Do you have to write this by hand?",
    blocks: [
      "No. That's what TLA-ts is for. It takes the TypeScript file from the start of this guide and checks it directly:",
      { language: "shellscript", code: "npx tla-ts likes.ts" },
      "It finds the same bug: `likes` is -1 after one `unlike`.",
      "It still writes TLA+ to do it, but of a JavaScript engine running your code. So its module is much longer than the one we wrote, and you won't need to read it.",
      "So why learn TLA+ at all? Because the hard part is the same in both languages: deciding what the state is, which steps can happen, and which rules must hold.",
    ],
  },
];
