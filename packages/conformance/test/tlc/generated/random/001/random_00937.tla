(*---
description: Evaluates a random function expression, seed 262, number 937.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00937 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF FALSE THEN 2 ELSE -1 + ([a |-> 1]).a) % Head(<<-1, 2147483647>>)) :> Cardinality((UNION {{}, 2..1} \ {b1499 \in {1, 2} : TRUE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00937 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
