(*---
description: Evaluates a random set expression, seed 262, number 7159.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07159 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-LET b11006 == (1 % 2147483647) IN Head(<<1>>)), (([[x \in 1..2 |-> x] EXCEPT ![2147483647] = 2147483647] @@ ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]))).a})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 70 to line 14, col 87 of module random_07159
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07159 failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
