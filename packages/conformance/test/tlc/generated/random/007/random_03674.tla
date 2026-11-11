(*---
description: Evaluates a random int expression, seed 262, number 3674.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03674 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b5807 == LET b5808 == ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3]).a IN ((2147483647 * 3) \div ([x \in Nat |-> x + 1]).a) IN ([(<<5, 6>> @@ {1}) EXCEPT ![(-b5807)] = (FALSE /\ FALSE)])[([[a |-> 1, b |-> TRUE] EXCEPT !.a = b5807]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03674 failed.
    2169:0 The second argument of @@ should be a function, but instead it is:
    {1}
---*)
