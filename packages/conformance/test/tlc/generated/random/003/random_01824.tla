(*---
description: Evaluates a random function expression, seed 262, number 1824.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01824 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b2892 \in ((Head(<<3, 1, 2>>) .. (3 % 7)) \cup ({2, 1} \ {b2893 \in 1..3 : TRUE})) : (((TRUE \/ FALSE) /\ (FALSE => FALSE)) => ((<<1, 2>> = [x \in Nat |-> x + 1]) => ({2, 1, 3} = {2, 1, 3})))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01824 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
