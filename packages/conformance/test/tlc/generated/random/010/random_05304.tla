(*---
description: Evaluates a random bool expression, seed 262, number 5304.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05304 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {({x \in 1..3 : x > 1} \ {1, 2}), ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x])} \ {LET b8208 == 1 IN b8208, (<<1, 2>>).a}) = (((2147483647 % -1) .. LET b8209 == 2147483647 IN 2) \cap ((CHOOSE r \in [a : 2..1] : TRUE) \cup {b8210 : b8210 \in SUBSET {1}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05304 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
