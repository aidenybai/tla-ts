(*---
description: Evaluates a random bool expression, seed 262, number 9480.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09480 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) = (CHOOSE r \in [a : {1, 2}] : TRUE)) <=> (UNION {SUBSET {1}, {1, 2}} = UNION {1..3, {2, 1, 3}})) <=> (\A b14727 \in (DOMAIN [x \in Nat |-> x + 1] \cap ({x \in 1..3 : x > 1} \cup {1, 2})) : ((2 * 2147483647) = (-b14727)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09480 failed.
    Attempted to compare integer 1 with non-integer:
    {}
---*)
