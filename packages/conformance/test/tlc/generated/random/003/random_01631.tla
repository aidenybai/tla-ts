(*---
description: Evaluates a random function expression, seed 262, number 1631.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01631 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ([a |-> 0, b |-> TRUE] = (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)) THEN LET b2604 == (2147483647 * 2) IN (b2604 + 1) ELSE ([b2605 \in 1..3 |-> b2605])[(-2)] :> ([(CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \ {1}] : TRUE) EXCEPT ![Len(TRUE)] = CASE TRUE -> 3 [] OTHER -> 1]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01631 failed.
    In applying the function
    <<1, 2, 3>>,
    the first argument is:
    -2
    which is not in its domain.
---*)
