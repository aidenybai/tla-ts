(*---
description: Evaluates a random function expression, seed 262, number 3105.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03105 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) @@ (0 :> 2147483647)) @@ [(2147483647 :> 0) EXCEPT ![LET b4957 == 0 IN 7] = LET b4958 == 3 IN 1]) @@ [b4959 \in {(2 * b4960) : b4960 \in (SUBSET {1} \ {2, 1, 3})} |-> Len([<<3, 1, 2>> EXCEPT ![1] = 2])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 89 to line 14, col 103 of module random_03105
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03105 failed.
    Attempted to check equality of integer 2 with non-integer:
    {}
---*)
