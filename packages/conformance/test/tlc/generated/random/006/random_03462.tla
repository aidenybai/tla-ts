(*---
description: Evaluates a random set expression, seed 262, number 3462.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03462 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([[[a |-> 1] EXCEPT !.a = @ + 3] EXCEPT !.a = @ + IF FALSE THEN 3 ELSE 2147483647]).a, IF (LET b5479 == 2 IN b5479 \in ({x \in 1..3 : x > 1} \ SUBSET {1})) THEN ((0 \in 1..3) /\ (~FALSE)) ELSE ((7 * {x \in 1..3 : x > 1}) % (2 + 3))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03462 failed.
    2178:0 Overflow when computing 4+2147483647
---*)
