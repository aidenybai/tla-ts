(*---
description: Evaluates a random function expression, seed 262, number 839.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00839 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((<<1, 2>> \o <<1, 2>>) = [b1365 \in {1, 2} |-> 2147483647]) THEN Len(<<1, [x \in Nat |-> x + 1]>>) ELSE Cardinality({b1366 \in SUBSET {1} : TRUE}) :> Cardinality({([x \in 1..2 |-> x]).a, (2147483647 + 7)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00839 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
