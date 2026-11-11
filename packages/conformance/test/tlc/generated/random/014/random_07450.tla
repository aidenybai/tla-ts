(*---
description: Evaluates a random set expression, seed 262, number 7450.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07450 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {DOMAIN [x \in Nat |-> x + 1], UNION {{}, {x \in 1..3 : x > 1}}} \ (Len(<<1>>) .. (3 * 1))) \ ((Append(<<1>>, {1}) = [[x \in Nat |-> x + 1] EXCEPT ![-1] = 1]) \cup ({b11486 : b11486 \in SUBSET {1}} \cup (3 .. 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 142 to line 14, col 162 of module random_07450
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07450 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
