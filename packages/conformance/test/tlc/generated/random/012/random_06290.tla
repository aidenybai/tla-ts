(*---
description: Evaluates a random bool expression, seed 262, number 6290.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06290 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {((1..3 \cup Nat) \cap UNION {1..3, {1, 2}}), {LET b9675 == 3 IN b9675, (-0)}} \subseteq ((CASE FALSE -> 0 [] OTHER -> 0 .. IF TRUE THEN 3 ELSE 1) \ (([x \in 1..2 |-> x]).a % (1 - [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06290 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
